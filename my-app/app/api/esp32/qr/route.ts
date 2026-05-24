// app/api/esp32/qr/route.ts — Return QR code PNG for ESP32 display
// Uses database-backed dynamic one-time tokens (no legacy HMAC rotation)
import { NextRequest, NextResponse } from "next/server";
import { generateQRCodeBuffer, getOrCreateActiveQRToken } from "@/lib/qr";

/**
 * Detect the network IP address for the QR code URL.
 * Uses NEXT_PUBLIC_APP_URL if set to a non-localhost value,
 * otherwise uses the request's Host header.
 */
function getNetworkUrl(req: NextRequest): string {
  // If explicitly configured with a non-localhost URL, use that
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  if (configuredUrl && !configuredUrl.includes("localhost") && !configuredUrl.includes("127.0.0.1")) {
    return configuredUrl;
  }

  // Otherwise, try to derive from request headers
  const host = req.headers.get("host") || "localhost:3000";

  // If the request came via network IP, use that
  if (!host.includes("localhost") && !host.includes("127.0.0.1")) {
    const protocol = req.headers.get("x-forwarded-proto") || "http";
    return `${protocol}://${host}`;
  }

  // Fallback: use the configured URL or localhost
  return configuredUrl || `http://${host}`;
}

export async function GET(req: NextRequest) {
  try {
    // Always use the database-backed dynamic token (no query param override)
    const token = await getOrCreateActiveQRToken();

    // Build the QR target URL (no custom URL override — prevents SSRF/phishing)
    const baseUrl = getNetworkUrl(req);
    const target = `${baseUrl}/?scan=${token}`;

    const buffer = await generateQRCodeBuffer(target);

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "Access-Control-Allow-Origin": "*",
        // SECURITY: Do NOT expose token or URL in headers.
        // ESP32 can poll /api/esp32/display for the active_token if needed.
      },
    });
  } catch (error) {
    console.error("[ESP32/QR] error:", error);
    return NextResponse.json({ error: "Failed to generate QR" }, { status: 500 });
  }
}
