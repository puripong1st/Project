// app/api/esp32/qr/route.ts — Return QR code PNG for ESP32 display
import { NextRequest, NextResponse } from "next/server";
import { generateQRCodeBuffer } from "@/lib/qr";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    // Default: QR points to registration form with mandatory presence token
    const target = searchParams.get("url") || `${appUrl}/?scan=rmutp_presence`;

    const buffer = await generateQRCodeBuffer(target);

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store, max-age=0",
        "Access-Control-Allow-Origin": "*", // Allow ESP32 to fetch
      },
    });
  } catch (error) {
    console.error("[ESP32/QR] error:", error);
    return NextResponse.json({ error: "Failed to generate QR" }, { status: 500 });
  }
}
