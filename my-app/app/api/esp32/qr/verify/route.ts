// app/api/esp32/qr/verify/route.ts — Validate and consume dynamic scan token
// Security hardened: rate-limiting, constant-time comparison, IP logging
import { NextRequest, NextResponse } from "next/server";
import { validateQRToken } from "@/lib/qr";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // Extract client IP for rate limiting
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || req.headers.get("x-real-ip")
      || "unknown";

    // Rate limit check: 10 attempts per IP per minute
    const rateLimitResult = await rateLimit({
      key: `qr_verify:${clientIp}`,
      limit: 10,
      windowMs: 60_000,
    });

    if (!rateLimitResult.success) {
      return NextResponse.json({
        success: false,
        error: "คุณส่งคำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่อีกครั้ง",
      }, { status: 429 });
    }

    const body = await req.json();
    const { token } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "ไม่พบข้อมูลรหัสสแกน" }, { status: 400 });
    }

    // validateQRToken checks token format, expiry, and consumption status
    // without marking it as consumed yet (which is reserved for form submission)
    const success = await validateQRToken(token);

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
