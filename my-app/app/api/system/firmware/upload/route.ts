export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getAdminFromCookie } from "@/lib/auth";
import { withRateLimit } from "@/lib/rate-limit-middleware";
import { sendDiscordNotification } from "@/lib/discord";
import { cacheDel } from "@/lib/kv-cache";
import crypto from "crypto";

// POST /api/system/firmware/upload — อัปโหลดข้อมูลเฟิร์มแวร์ C++ ไบเนรีล่าสุด
export async function POST(req: NextRequest) {
  try {
    // 1. จำกัดการอัปโหลดเพื่อป้องกันการยิงสปามไฟล์ไบนารีชนแบนด์วิดท์ Supabase (Rate Limiting)
    const rateLimitRes = await withRateLimit(req, "firmware_upload", 10, 60);
    if (!rateLimitRes.allowed) {
      return NextResponse.json(
        { error: "ระบบตรวจพบการยิงส่งไฟล์ถี่เกินไป กรุณารอก่อนอัปโหลดใหม่อีกครั้ง" },
        { status: 429 }
      );
    }

    // 2. ตรวจสอบสิทธิ์ว่าผู้ทำคือเจ้าของระบบสูงสุด (Owner)
    const admin = await getAdminFromCookie();
    if (!admin || admin.role !== "owner") {
      return NextResponse.json({ error: "ไม่มีสิทธิ์ในการจัดการไฟล์เฟิร์มแวร์ระบบ" }, { status: 403 });
    }

    // 3. รับข้อมูล Multipart form
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const version = formData.get("version") as string | null;
    const publicUrl = formData.get("public_url") as string | null;

    if (!file || !version || !publicUrl) {
      return NextResponse.json(
        { error: "กรุณากรอกข้อมูลรุ่น ไฟล์ไบนารี .bin และ Supabase Storage Public URL ให้ครบถ้วน" },
        { status: 400 }
      );
    }

    // 4. ล้างค่าเวอร์ชันและตรวจสอบความปลอดภัยสตริง
    const cleanVersion = version.trim().replace(/[^0-9.]/g, "");
    if (!cleanVersion || cleanVersion.length < 3) {
      return NextResponse.json({ error: "รูปแบบเลขเวอร์ชันไม่ถูกต้อง (ตัวอย่าง: 1.0.2)" }, { status: 400 });
    }

    // 5. ดึงข้อมูล buffer เพื่อนำมาคำนวณ MD5 Checksum ยืนยันความสมบูรณ์ไฟล์ (กันไฟดับบอร์ดพัง)
    const fileBytes = await file.arrayBuffer();
    const fileBuffer = Buffer.from(fileBytes);
    const fileHash = crypto.createHash("md5").update(fileBuffer).digest("hex");

    // 6. เพิ่มข้อมูลลง Supabase PostgreSQL Table firmware_releases
    const pool = getPool();
    await pool.query(
      `INSERT INTO firmware_releases (version, file_path, file_size, checksum_md5, uploaded_by)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (version)
       DO UPDATE SET file_path = EXCLUDED.file_path, file_size = EXCLUDED.file_size, checksum_md5 = EXCLUDED.checksum_md5, uploaded_at = CURRENT_TIMESTAMP`,
      [cleanVersion, publicUrl.trim(), file.size, fileHash, admin.id]
    );

    // ล้าง cache เวอร์ชัน firmware เพื่อให้ ESP32 ตรวจพบ OTA รุ่นใหม่ทันที
    await cacheDel("firmware:latest_version");

    // 7. บันทึก Log การดำเนินงานในระบบ (ใช้ action firmware_deployed แทน approved)
    await pool.query(
      "INSERT INTO access_logs (action, performed_by, notes, room_code) VALUES ('firmware_deployed', $1, $2, 'system')",
      [admin.id, `ปล่อยเฟิร์มแวร์ OTA รุ่น v${cleanVersion} (MD5: ${fileHash}, ขนาด: ${(file.size / 1024).toFixed(1)} KB) โดยแอดมิน: ${admin.full_name}`]
    );

    // 8. ส่งแจ้งเตือน Discord
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
                req.headers.get("x-real-ip") || "ไม่ทราบ";
    await sendDiscordNotification("firmware_deployed", {
      adminName: admin.full_name,
      adminUsername: admin.username,
      adminRole: admin.role,
      firmwareVersion: cleanVersion,
      firmwareChecksum: fileHash,
      firmwareSize: file.size,
      ip,
    }).catch(err => console.error("[OTA Discord] notify failed:", err));

    return NextResponse.json({
      success: true,
      message: `อัปโหลดและเปิดระบบกระจายเฟิร์มแวร์ไร้สายรุ่น v${cleanVersion} สำเร็จ! MD5: ${fileHash}`,
    });

  } catch (error) {
    console.error("[Firmware Upload API Error]:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการนำส่งเฟิร์มแวร์", detail: error instanceof Error ? error.message : "unknown error" },
      { status: 500 }
    );
  }
}
