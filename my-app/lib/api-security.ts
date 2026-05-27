import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// ============================================================================
// ESP32 Zero-Trust API Security Module
// Implements: Strict API Key, HMAC-SHA256 payload signing, IP Allowlisting, User-Agent filtering
// ============================================================================

export interface SecurityCheckResult {
  allowed: boolean;
  errorResponse?: NextResponse;
  clientIp?: string;
}

export function verifyEsp32Security(req: NextRequest, endpointPath: string): SecurityCheckResult {
  const esp32ApiKey = process.env.ESP32_API_KEY || "rmutp_secure_door_unlock_token_placeholder";
  
  // 1. Strict User-Agent Checking (Optional but recommended for IoT)
  const userAgent = req.headers.get("user-agent") || "";
  if (userAgent.toLowerCase().includes("curl") || userAgent.toLowerCase().includes("postman")) {
    console.warn(`[Security] Blocked suspicious User-Agent: ${userAgent}`);
    return { allowed: false, errorResponse: new NextResponse(null, { status: 403 }) };
  }

  // 2. IP Allowlisting (If configured)
  const forwardedFor = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  const clientIp = forwardedFor ? forwardedFor.split(",")[0].trim() : (realIp || "unknown");
  
  const allowedIps = process.env.ALLOWED_IP_RANGES;
  if (allowedIps && allowedIps !== "*") {
    const ipList = allowedIps.split(",").map(ip => ip.trim());
    if (!ipList.includes(clientIp) && !ipList.includes("127.0.0.1") && !ipList.includes("::1")) {
      console.warn(`[Security] Blocked unauthorized IP: ${clientIp}`);
      return { allowed: false, errorResponse: new NextResponse(null, { status: 403 }) };
    }
  }

  // 3. Strict API Key Validation
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey || apiKey !== esp32ApiKey) {
    console.warn(`[Security] Unauthorized or missing API Key from IP: ${clientIp}`);
    return { allowed: false, errorResponse: new NextResponse(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } }) };
  }

  // 4. HMAC-SHA256 Payload Signing (Anti Replay Attack)
  // Required headers: x-timestamp (unix epoch string), x-hmac-signature (hex encoded)
  const timestampStr = req.headers.get("x-timestamp");
  const providedSignature = req.headers.get("x-hmac-signature");

  if (!timestampStr || !providedSignature) {
    console.warn(`[Security] Missing HMAC headers from IP: ${clientIp}. Enforcing strict HMAC.`);
    return { allowed: false, errorResponse: new NextResponse(JSON.stringify({ error: "Missing Signature" }), { status: 401, headers: { "Content-Type": "application/json" } }) };
  }

  const timestamp = parseInt(timestampStr, 10);
  const currentTimestamp = Math.floor(Date.now() / 1000);

  // Replay Attack Window: +/- 60 seconds
  if (isNaN(timestamp) || Math.abs(currentTimestamp - timestamp) > 60) {
    console.warn(`[Security] Timestamp expired or invalid (Replay Attack Prevention). IP: ${clientIp}, TS: ${timestamp}, Current: ${currentTimestamp}`);
    return { allowed: false, errorResponse: new NextResponse(JSON.stringify({ error: "Token Expired" }), { status: 401, headers: { "Content-Type": "application/json" } }) };
  }

  // Calculate Expected HMAC
  // Payload format: "timestamp:endpointPath" -> e.g. "1716800000:/api/esp32/display"
  // For simplicity, we just sign the timestamp and path
  const payloadToSign = `${timestampStr}:${endpointPath}`;
  const expectedSignature = crypto.createHmac('sha256', esp32ApiKey).update(payloadToSign).digest('hex');

  if (expectedSignature !== providedSignature) {
    console.warn(`[Security] HMAC Signature mismatch from IP: ${clientIp}`);
    return { allowed: false, errorResponse: new NextResponse(JSON.stringify({ error: "Invalid Signature" }), { status: 401, headers: { "Content-Type": "application/json" } }) };
  }

  return { allowed: true, clientIp };
}
