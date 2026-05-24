// app/api/esp32/qr/route.ts — Generate and manage dynamic QR access tokens
import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // ดึงค่า URL หลักอัตโนมัติจาก Header ของ Vercel
    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;

    const { searchParams } = new URL(req.url);
    const roomCode = searchParams.get("room") || "default";

    // เรียกใช้ Connection Pool
    const pool = getPool();

    // สร้าง Secure Random Token 
    const token = crypto.randomBytes(16).toString("hex");

    // บันทึก Token ลงฐานข้อมูล Aiven MySQL
    await pool.query(
      "INSERT INTO dynamic_qr_tokens (token, room_code, is_consumed) VALUES (?, ?, FALSE)",
      [token, roomCode]
    );

    // ประกอบ URL ปลายทางสำหรับให้โทรศัพท์สแกนเข้าสู่หน้าระบบ
    const qrUrl = `${baseUrl}/register?token=${token}&room=${roomCode}`;

    // ─── ปรับปรุงการส่งข้อมูล (Data Payload Protection) ───
    // ส่งคีย์สแตนดาร์ดออกไปเบิ้ลทุกรูปแบบ เพื่อซัพพอร์ต Logic ตัวแปรของหน้าบ้านทุกค่าย
    return NextResponse.json({
      success: true,

      // ตัวแปรกลุ่ม Token
      token: token,

      // ตัวแปรกลุ่ม URL สแกน (ส่งเบิ้ล 3 แบบยอดนิยมเพื่อดักทุกโครงสร้างหน้าบ้าน)
      qr_url: qrUrl,   // Snake case
      qrUrl: qrUrl,    // Camel case
      qrCode: qrUrl,   // ดักกรณีกระโดดไปเรียกคีย์โค้ดตรงๆ
      url: qrUrl,      // ดักกรณีดึงสั้นๆ

      // ตัวแปรกลุ่ม Room Code
      room_code: roomCode,
      roomCode: roomCode,

      expires_in_seconds: 30,
      expiresIn: 30
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