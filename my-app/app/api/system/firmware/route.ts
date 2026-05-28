export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getAdminFromCookie } from "@/lib/auth";
import { withRateLimit } from "@/lib/rate-limit-middleware";

// GET /api/system/firmware — ดึงประวัติรายการเวอร์ชันเฟิร์มแวร์ทั้งหมด
export async function GET(req: NextRequest) {
  try {
    const admin = await getAdminFromCookie();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const pool = getPool();
    const { rows } = await pool.query(
      "SELECT id, version, file_path, file_size, checksum_md5, uploaded_at FROM firmware_releases ORDER BY uploaded_at DESC"
    );

    return NextResponse.json({ success: true, releases: rows });
  } catch (error) {
    console.error("[Firmware API] GET error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูลเฟิร์มแวร์" }, { status: 500 });
  }
}

// DELETE /api/system/firmware — ลบเวอร์ชันเฟิร์มแวร์เก่าเพื่อหมุนเวียนโควตาพื้นที่ฟรี (Storage Pruning)
export async function DELETE(req: NextRequest) {
  try {
    const rateLimitRes = await withRateLimit(req, "firmware_delete", 5, 60);
    if (!rateLimitRes.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const admin = await getAdminFromCookie();
    if (!admin || admin.role !== "owner") {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "กรุณาระบุไอดีของแถวข้อมูลที่ต้องการลบ" }, { status: 400 });
    }

    const pool = getPool();
    // ดึงค่า path เพื่อให้แอดมินนำไปเป็น audit logs หรือลบจริงใน bucket
    const { rows: releaseRows } = await pool.query(
      "SELECT version, file_path FROM firmware_releases WHERE id = $1",
      [id]
    );

    if (!releaseRows || releaseRows.length === 0) {
      return NextResponse.json({ error: "ไม่พบข้อมูลเวอร์ชันนี้ในระบบ" }, { status: 404 });
    }

    const release = releaseRows[0];

    // ลบข้อมูล Row ในตารางฐานข้อมูล Supabase PostgreSQL
    await pool.query("DELETE FROM firmware_releases WHERE id = $1", [id]);

    // บันทึก Log ในระบบ
    await pool.query(
      "INSERT INTO access_logs (action, performed_by, notes, room_code) VALUES ('rejected', $1, $2, 'system')",
      [admin.id, `ลบเฟิร์มแวร์เวอร์ชัน ${release.version} ออกจากระบบคลาวด์โดยแอดมิน: ${admin.full_name}`]
    );

    return NextResponse.json({ 
      success: true, 
      message: `ลบข้อมูลประวัติเฟิร์มแวร์เวอร์ชัน ${release.version} เรียบร้อยแล้ว (กรุณาลบไฟล์ที่จัดเก็บจริงบนคลาวด์ Supabase Storage เพื่อคืนโควตาแบนด์วิดท์)` 
    });

  } catch (error) {
    console.error("[Firmware API] DELETE error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการลบเฟิร์มแวร์" }, { status: 500 });
  }
}
