// app/api/esp32/qr/route.ts — Generate and manage dynamic QR access tokens
import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // ดึงค่า URL หลักจาก Environment Variables บน Vercel
    // หากลืมตั้งค่า NEXT_PUBLIC_APP_URL ระบบจะดึงข้อมูลจาก Header Request ของ Vercel ให้อัตโนมัติ (ไม่พังแน่นอน)
    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;

    const { searchParams } = new URL(req.url);
    const roomCode = searchParams.get("room") || "default";

    // เรียกใช้ Connection Pool ผ่าน getPool() เพื่อความปลอดภัยบน Serverless และ Aiven
    const pool = getPool();

    // สร้าง Secure Random Token ขนาด 32 ตัวอักษร (16 bytes hex)
    const token = crypto.randomBytes(16).toString("hex");

    // บันทึก Token ใหม่ลงฐานข้อมูล Aiven MySQL
    await pool.query(
      "INSERT INTO dynamic_qr_tokens (token, room_code, is_consumed) VALUES (?, ?, FALSE)",
      [token, roomCode]
    );

    // ประกอบ URL ปลายทางสำหรับให้สมาร์ตโฟนสแกนเพื่อเข้าสู่หน้าลงทะเบียน/เปิดประตู
    const qrUrl = `${baseUrl}/register?token=${token}&room=${roomCode}`;

    return NextResponse.json({
      success: true,
      token: token,
      qr_url: qrUrl,
      room_code: roomCode,
      expires_in_seconds: 30, // กำหนดอายุการใช้งานแสดงผลบนหน้าจอ Preview
    }, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0, must-revalidate",
      },
    });

  } catch (error: any) {
    console.error("[QR Generate API] Critical Error:", error);
    return NextResponse.json({
      success: false,
      error: "เกิดข้อผิดพลาดในการสร้างรหัสสแกนภายในระบบ",
      details: error?.message || "Database connection failure"
    }, { status: 500 });
  }
}