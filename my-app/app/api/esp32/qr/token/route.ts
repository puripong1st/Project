// app/api/esp32/qr/token/route.ts — Internal endpoint for Edge runtime to create QR tokens
// Only callable from internal (Edge display route) via x-internal header
import { NextRequest, NextResponse } from "next/server";
import { initDatabase } from "@/lib/db";
import { getOrCreateActiveQRToken } from "@/lib/qr";

let initialized = false;

export async function GET(req: NextRequest) {
  // Verify internal-only call
  const internalKey = req.headers.get("x-internal");
  if (!internalKey || internalKey !== process.env.JWT_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!initialized) { await initDatabase(); initialized = true; }

  const room = (new URL(req.url).searchParams.get("room") || "default").trim();
  try {
    const token = await getOrCreateActiveQRToken(room);
    return NextResponse.json({ token });
  } catch (e) {
    console.error("[QR Token internal]", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
