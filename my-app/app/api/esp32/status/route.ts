// app/api/esp32/status/route.ts — ESP32 connection status & mode info
import { NextRequest, NextResponse } from "next/server";
import { getESP32Status, getESP32Url } from "@/lib/esp32";
import { getAdminFromCookie } from "@/lib/auth";
import { withRateLimit } from "@/lib/rate-limit-middleware";

export async function GET(req: NextRequest) {
  try {
    const rateLimitRes = await withRateLimit(req, "esp32_status", 30, 60);
    if (!rateLimitRes.allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }
    const admin = await getAdminFromCookie();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const room = searchParams.get("room") || "default";

    const status = await getESP32Status(room);
    const url    = await getESP32Url(room);

    return NextResponse.json({ ...status, url });
  } catch (error) {
    console.error("[ESP32/Status] error:", error);
    return NextResponse.json({ online: false, mode: "physical", error: "Status check failed" }, { status: 200 });
  }
}
