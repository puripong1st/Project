// lib/qr.ts — QR Code generation helper
import QRCode from "qrcode";

/**
 * Generate QR code as PNG Buffer (for ESP32 display API)
 */
export async function generateQRCodeBuffer(text: string): Promise<Buffer> {
  return QRCode.toBuffer(text, {
    type: "png",
    width: 240,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
    errorCorrectionLevel: "M",
  });
}

/**
 * Generate QR code as Base64 Data URL (for web display)
 */
export async function generateQRCodeDataURL(text: string, size = 300): Promise<string> {
  return QRCode.toDataURL(text, {
    type: "image/png",
    width: size,
    margin: 2,
    color: {
      dark: "#1B5E20",
      light: "#FFFFFF",
    },
    errorCorrectionLevel: "M",
  });
}

/**
 * Generate QR code as SVG string (for web preview)
 */
export async function generateQRCodeSVG(text: string): Promise<string> {
  return QRCode.toString(text, {
    type: "svg",
    width: 200,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });
}

// ─── Dynamic One-Time Transactional QR Token Management ───
// Security hardened: race-condition safe, brute-force resistant, expiry enforced
import { getPool } from "./db";
import crypto from "crypto";

/** Token lifetime in seconds (10 minutes) */
const TOKEN_TTL_SECONDS = 600;

/** Minimum entropy: 32 hex chars = 128 bits (brute-force resistant) */
function generateSecureToken(): string {
  return crypto.randomBytes(16).toString("hex"); // 32 chars, 128-bit entropy
}

/**
 * Fetch the current unconsumed + unexpired token, or create a new one if none exists for a specific room.
 * Expired tokens are automatically invalidated.
 */
export async function getOrCreateActiveQRToken(roomCode: string = "default"): Promise<string> {
  const pool = getPool();

  const sanitizedRoom = (roomCode || "default").trim();

  // Expire stale unconsumed tokens first for this room (garbage collection)
  await pool.query(
    "UPDATE dynamic_qr_tokens SET is_consumed = TRUE WHERE is_consumed = FALSE AND room_code = ? AND created_at < NOW() - INTERVAL ? SECOND",
    [sanitizedRoom, TOKEN_TTL_SECONDS]
  );

  const [rows] = await pool.query(
    "SELECT token FROM dynamic_qr_tokens WHERE is_consumed = FALSE AND room_code = ? AND created_at >= NOW() - INTERVAL ? SECOND ORDER BY created_at DESC LIMIT 1",
    [sanitizedRoom, TOKEN_TTL_SECONDS]
  );
  const active = rows as { token: string }[];
  if (active.length > 0) {
    return active[0].token;
  }

  // Generate new high-entropy token for this specific room
  const newToken = generateSecureToken();
  await pool.query(
    "INSERT INTO dynamic_qr_tokens (token, room_code) VALUES (?, ?)",
    [newToken, sanitizedRoom]
  );
  return newToken;
}

/**
 * Validate and consume a token using atomic UPDATE with row-lock.
 * This prevents race conditions when multiple users scan simultaneously.
 * Returns true only if exactly one caller wins the atomic update.
 */
export async function consumeQRToken(token: string): Promise<boolean> {
  if (!token || typeof token !== "string") return false;

  const trimmed = token.trim();

  // Reject tokens that are obviously wrong length (brute-force mitigation)
  if (trimmed.length !== 32) return false;

  // Reject tokens with non-hex characters
  if (!/^[0-9a-f]{32}$/.test(trimmed)) return false;

  const pool = getPool();

  // Find the token to know which room it belongs to
  const [rows] = await pool.query(
    "SELECT room_code FROM dynamic_qr_tokens WHERE token = ? AND is_consumed = FALSE AND created_at >= NOW() - INTERVAL ? SECOND LIMIT 1",
    [trimmed, TOKEN_TTL_SECONDS]
  );
  const active = rows as { room_code: string }[];
  if (active.length === 0) return false;
  const roomCode = active[0].room_code;

  // Atomic single-statement consume: only one concurrent caller can succeed.
  // The WHERE clause checks is_consumed=FALSE AND expiry simultaneously.
  // affectedRows=1 means THIS caller won the race, affectedRows=0 means someone else did.
  const [result] = await pool.query(
    `UPDATE dynamic_qr_tokens 
     SET is_consumed = TRUE 
     WHERE token = ? 
       AND is_consumed = FALSE 
       AND created_at >= NOW() - INTERVAL ? SECOND`,
    [trimmed, TOKEN_TTL_SECONDS]
  );

  const affected = (result as { affectedRows: number }).affectedRows;
  if (affected === 0) {
    return false; // Token already consumed, expired, or invalid
  }

  // Instantly generate a new active token for the exact same room
  const newToken = generateSecureToken();
  await pool.query(
    "INSERT INTO dynamic_qr_tokens (token, room_code) VALUES (?, ?)",
    [newToken, roomCode]
  );

  return true;
}
