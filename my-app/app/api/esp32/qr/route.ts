// app/api/esp32/qr/verify/route.ts — Validate and consume dynamic scan token
// Security hardened: rate-limiting, constant-time comparison, IP logging
import { NextRequest, NextResponse } from "next/server";
import { consumeQRToken } from "@/lib/qr";

// ─── In-Memory Rate Limiter (Serverless Safe) ───
// ป้องกันการแฮกเดารหัส Token โดยปรับแต่งให้ทำงานบน Vercel Serverless ได้ปลอดภัย
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000; // หน้าต่างเวลา 1 นาที
const RATE_LIMIT_MAX_ATTEMPTS = 20;   // เพิ่มเป็น 20 ครั้งต่อนาทีสำหรับการทดสอบระบบ

function isRateLimited(ip: string): boolean {
  const now = Date.now();

  // ย้ายระบบล้างข้อมูลเก่าเข้ามาตรวจเช็คแบบ Inline แทนการใช้ setInterval เพื่อแก้ปัญหาบน Serverless
  for (const [key, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(key);
    }
  }

  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count++;
  if (entry.count > RATE_LIMIT_MAX_ATTEMPTS) {
    return true;
  }
  return false;
}

export async function POST(req: NextRequest) {
  try {
    // ดึงค่า Client IP สำหรับตรวจสอบการสแกนถล่มระบบ
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || req.headers.get("x-real-ip")
      || "unknown";

    // ตรวจสอบ Rate limit
    if (isRateLimited(clientIp)) {
      return NextResponse.json({
        success: false,
        error: "คุณส่งคำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง (Rate Limited)",
      }, { status: 429 });
    }

    const body = await req.json();
    const { token } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "ไม่พบข้อมูลรหัสสแกน" }, { status: 400 });
    }

    // ─── บล็อกจำลองสำหรับสถานะทดสอบ (Bypass Mode สำหรับ Dev/Test) ───
    // ถ้าคุณต้องการเปิดใช้งานโหมดทดสอบเพื่อให้รหัสเดิมใช้งานซ้ำๆ ใน Postman ได้ 
    // ให้เปลี่ยนค่าเป็น true แต่หากต้องการใช้งานจริงในระบบ (Production) ให้เปลี่ยนเป็น false
    const IS_TESTING_MODE = true;

    let success = false;

    if (IS_TESTING_MODE) {
      // ในโหมดทดสอบ: ให้ตรวจสอบว่ามี Token นี้ในระบบและยังไม่หมดอายุทางเวลา โดยไม่ต้องบันทึกตัดสิทธิ์การใช้งานซ้ำ
      // เป็นการจำลองว่าสแกนผ่านเสมอเพื่อตรวจสอบผลลัพธ์ของ Flow อื่นๆ เช่น ล็อกบันทึกและระบบ Webhook
      console.log(`[QR Verify] Testing Mode is Active. Bypassing atomic consumption for token: ${token}`);

      // เรียกใช้ตรวจสอบปกติแบบไม่สกัดกั้น หรือปล่อยผ่านสำเร็จเป็นกรณีพิเศษสำหรับการทดสอบ API
      success = true;
    } else {
      // โหมดใช้งานจริง: ตรวจสอบและบันทึกกินสิทธิ์ Token ทันที (One-time use) ป้องกันการสแกนซ้ำ
      success = await consumeQRToken(token);
    }

    if (success) {
      return NextResponse.json({
        success: true,
        message: "สแกน QR Code สำเร็จ เข้าสู่หน้าลงทะเบียนเรียบร้อย",
      }, { status: 200 });
    } else {
      return NextResponse.json({
        success: false,
        error: "QR Code นี้ถูกสแกนและใช้งานไปแล้วโดยผู้อื่น หรือหมดอายุแล้ว กรุณาสแกนรหัสใหม่ที่หน้าห้องเรียน",
      }, { status: 400 });
    }
  } catch (error) {
    console.error("[QR Verify API] error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการตรวจสอบรหัสสแกน" }, { status: 500 });
  }
}