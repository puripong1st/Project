// lib/edge-crypto.ts — Web Crypto API helpers (Edge Runtime compatible)
// ใช้แทน Node.js crypto module ใน Edge Runtime

const enc = new TextEncoder();

/** HMAC-SHA256 hex string — replaces crypto.createHmac('sha256', key).update(msg).digest('hex') */
export async function hmacSHA256(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** SHA-1 hex (for ETag) — replaces crypto.createHash('sha1').update(str).digest('hex') */
export async function sha1Hex(str: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-1", enc.encode(str));
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Constant-time string comparison (prevents timing attacks) */
export function secureEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}
