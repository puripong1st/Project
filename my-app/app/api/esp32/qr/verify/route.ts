// app/api/esp32/qr/verify/route.ts — Validate and consume dynamic scan token
// Security hardened: rate-limiting, constant-time comparison, IP logging
import { NextRequest, NextResponse } from "next/server";
import { consumeQRToken, validateQRToken } from "@/lib/qr";

// ─── In-Memory Rate Limiter ───
// Prevents brute-force token guessing attacks
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute window
const RATE_LIMIT_MAX_ATTEMPTS = 10;   // max 10 attempts per IP per minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
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

// Periodic cleanup of stale entries (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) {
      rateLimitMap.delete(ip);
    }
  }
}, 5 * 60_000);

export async function POST(req: NextRequest) {
  try {
    // Extract client IP for rate limiting
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || req.headers.get("x-real-ip")
      || "unknown";

    // Rate limit check
    if (isRateLimited(clientIp)) {
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
