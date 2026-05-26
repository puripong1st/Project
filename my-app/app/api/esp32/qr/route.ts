// app/api/esp32/qr/route.ts — Return QR code PNG for ESP32 display
// Uses database-backed dynamic one-time tokens (no legacy HMAC rotation)
import { NextRequest, NextResponse } from "next/server";
import { generateQRCodeBuffer, getOrCreateActiveQRToken } from "@/lib/qr";
import { getAdminFromCookie } from "@/lib/auth";

const DEFAULT_ESP32_API_KEY = "rmutp_secure_door_unlock_token_placeholder";

function getConfiguredEsp32ApiKey(): string {
  const key = process.env.ESP32_API_KEY || DEFAULT_ESP32_API_KEY;
  if (
    process.env.NODE_ENV === "production" &&
    (!process.env.ESP32_API_KEY || key === DEFAULT_ESP32_API_KEY)
  ) {
    throw new Error(
      "Production Security Error: ESP32_API_KEY is missing or using the default placeholder value."
    );
  }
  return key;
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
    const esp32ApiKey = getConfiguredEsp32ApiKey();
    const callerKey = req.headers.get("x-api-key") || "";
    const isAuthenticatedDevice = callerKey === esp32ApiKey;
    const isDevelopment = process.env.NODE_ENV !== "production";
    const admin = isAuthenticatedDevice ? null : await getAdminFromCookie();

    if (!isAuthenticatedDevice && !isDevelopment && !admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const room = (searchParams.get("room") || "default").trim();

    // Always use the database-backed dynamic token for the specific room
    const token = await getOrCreateActiveQRToken(room);

    // Build the QR target URL
    const baseUrl = getNetworkUrl(req);
    const target = `${baseUrl}/?scan=${token}&room=${room}`;

    const buffer = await generateQRCodeBuffer(target);

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    });
  } catch (error) {
    console.error("[ESP32/QR] error:", error);
    return NextResponse.json({ error: "Failed to generate QR" }, { status: 500 });
  }
}
