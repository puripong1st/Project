// app/api/esp32/qr/verify/route.ts - Validate dynamic scan token and issue offline grant
import { NextRequest, NextResponse } from "next/server";
import { createOfflineGrant, validateQRToken } from "@/lib/qr";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/client-ip";

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIp(req);

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
    const { token, room } = body;
    const roomCode = typeof room === "string" && room.trim() ? room.trim() : "default";

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "ไม่พบข้อมูลรหัสสแกน" }, { status: 400 });
    }

    const success = await validateQRToken(token, roomCode);

    if (success) {
      return NextResponse.json({
        success: true,
        offline_grant: createOfflineGrant(roomCode),
        offline_grant_expires_in: 600,
        message: "สแกน QR Code สำเร็จ เข้าสู่หน้าลงทะเบียนเรียบร้อย",
      }, { status: 200 });
    }

    return NextResponse.json({
      success: false,
      error: "QR Code นี้ถูกสแกนและใช้งานไปแล้วโดยผู้อื่น หรือหมดอายุแล้ว กรุณาสแกนรหัสใหม่ที่หน้าห้องเรียน",
    }, { status: 400 });
  } catch (error) {
    console.error("[QR Verify API] error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการตรวจสอบรหัสสแกน" }, { status: 500 });
  }
}
