// app/api/esp32/qr/route.ts — Return QR code PNG for ESP32 display
// QR code contains a rotating token that changes every 5 minutes
import { NextRequest, NextResponse } from "next/server";
import { generateQRCodeBuffer } from "@/lib/qr";
import crypto from "crypto";

// Secret key for generating time-based tokens
const QR_SECRET = process.env.JWT_SECRET || "rmutp-qr-secret-2026";

/**
 * Generate a time-based token that rotates every 5 minutes.
 * Uses HMAC-SHA256 with the current 5-minute window index.
 */
function generateRotatingToken(): { token: string; expiresAt: number } {
  const windowMs = 5 * 60 * 1000; // 5 minutes
  const currentWindow = Math.floor(Date.now() / windowMs);
  const expiresAt = (currentWindow + 1) * windowMs; // End of current window

  const hmac = crypto.createHmac("sha256", QR_SECRET);
  hmac.update(`rmutp_qr_${currentWindow}`);
  const token = hmac.digest("hex").substring(0, 16); // Short 16-char token

  return { token, expiresAt };
}

/**
 * Validate a QR token — accepts current window AND previous window
 * (to handle edge cases where someone scans right at the boundary)
 */
export function validateQRToken(token: string): boolean {
  const windowMs = 5 * 60 * 1000;
  const currentWindow = Math.floor(Date.now() / windowMs);

  // Check current window
  const hmacCurrent = crypto.createHmac("sha256", QR_SECRET);
  hmacCurrent.update(`rmutp_qr_${currentWindow}`);
  const currentToken = hmacCurrent.digest("hex").substring(0, 16);
  if (token === currentToken) return true;

  // Check previous window (grace period)
  const hmacPrev = crypto.createHmac("sha256", QR_SECRET);
  hmacPrev.update(`rmutp_qr_${currentWindow - 1}`);
  const prevToken = hmacPrev.digest("hex").substring(0, 16);
  if (token === prevToken) return true;

  return false;
}

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
    const { searchParams } = new URL(req.url);
    const { token } = generateRotatingToken();

    // Allow custom URL override via query param, otherwise build dynamic URL
    const customUrl = searchParams.get("url");
    let target: string;

    if (customUrl) {
      target = customUrl;
    } else {
      const baseUrl = getNetworkUrl(req);
      target = `${baseUrl}/?scan=${token}`;
    }

    const buffer = await generateQRCodeBuffer(target);

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "Access-Control-Allow-Origin": "*",
        "X-QR-Token": token,
        "X-QR-URL": target,
      },
    });
  } catch (error) {
    console.error("[ESP32/QR] error:", error);
    return NextResponse.json({ error: "Failed to generate QR" }, { status: 500 });
  }
}
