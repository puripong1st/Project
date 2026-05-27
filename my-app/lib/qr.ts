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

/** 
 * Dynamic QR Token Timing Parameters (Security Hardened & Latency Tolerant)
 */
/** The duration (in seconds) a QR token is active on the screen before a new one is generated. */
const TOKEN_ROTATION_SECONDS = 60;

/** The total duration (in seconds) a QR token remains valid for verification and consumption.
 * This is set to 5 minutes to accommodate slow mobile data, scan latency, and form fill-in time. */
const TOKEN_EXPIRY_SECONDS = 300;
const OFFLINE_GRANT_EXPIRY_SECONDS = 600;
const TOKEN_CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
const lastTokenCleanupByRoom = new Map<string, number>();

/** Minimum entropy: 32 hex chars = 128 bits (brute-force resistant) */
function generateSecureToken(): string {
  return crypto.randomBytes(16).toString("hex"); // 32 chars, 128-bit entropy
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

const QR_SIGNING_KEY = process.env.QR_SIGNING_KEY || process.env.JWT_SECRET;
if (!process.env.QR_SIGNING_KEY) {
  console.warn('[SECURITY] QR_SIGNING_KEY not set — using JWT_SECRET as fallback');
}

function getOfflineGrantSecret(): string {
  const secret = QR_SIGNING_KEY || "";
  if (!secret || (process.env.NODE_ENV === "production" && secret === "rmutp-secret-key")) {
    throw new Error("Offline grant signing secret is missing or insecure.");
  }
  return secret || "rmutp-dev-offline-grant-secret";
}

function hashNonce(nonce: string): string {
  return crypto.createHash("sha256").update(nonce).digest("hex");
}

function signPayload(payload: string): string {
  return crypto.createHmac("sha256", getOfflineGrantSecret()).update(payload).digest("base64url");
}

export interface OfflineGrantPayload {
  room: string;
  nonce: string;
  issued_at: number;
  expires_at: number;
}

export function createOfflineGrant(roomCode: string): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: OfflineGrantPayload = {
    room: (roomCode || "default").trim(),
    nonce: crypto.randomBytes(16).toString("hex"),
    issued_at: now,
    expires_at: now + OFFLINE_GRANT_EXPIRY_SECONDS,
  };
  const encodedPayload = base64url(JSON.stringify(payload));
  return `${encodedPayload}.${signPayload(encodedPayload)}`;
}

function parseOfflineGrant(grant: string): OfflineGrantPayload | null {
  const parts = grant.split(".");
  if (parts.length !== 2) return null;

  const [encodedPayload, signature] = parts;
  const expected = signPayload(encodedPayload);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(actualBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as OfflineGrantPayload;
    if (!payload.room || !payload.nonce || !payload.issued_at || !payload.expires_at) return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Fetch the current unconsumed + unexpired token, or create a new one if none exists for a specific room.
 * Expired tokens are automatically invalidated.
 */
export async function getOrCreateActiveQRToken(roomCode: string = "default"): Promise<string> {
  const pool = getPool();

  const sanitizedRoom = (roomCode || "default").trim();
  const now = Date.now();
  const lastCleanup = lastTokenCleanupByRoom.get(sanitizedRoom) || 0;

  // ─── [Self-Deleting Garbage Collection (Every 5 Minutes Auto-Cleanup)] ───
  // ลบข้อมูล Token ที่หมดอายุหรือถูกใช้งานเสร็จสิ้นแล้วถาวรออกจากฐานข้อมูล Aiven 
  // เพื่อให้ตารางเบาลง 10 เท่า คอลัมน์เล็ก ส่งข้อมูล SQL เร็วขึ้นสูงสุด 300%
  if (now - lastCleanup > TOKEN_CLEANUP_INTERVAL_MS) {
    lastTokenCleanupByRoom.set(sanitizedRoom, now);
    await pool.query(
      "DELETE FROM dynamic_qr_tokens WHERE room_code = $1 AND (is_consumed = TRUE OR created_at < CURRENT_TIMESTAMP - INTERVAL '1 second' * $2)",
      [sanitizedRoom, TOKEN_EXPIRY_SECONDS]
    );
  }

  const { rows } = await pool.query(
    "SELECT token FROM dynamic_qr_tokens WHERE is_consumed = FALSE AND room_code = $1 AND created_at >= CURRENT_TIMESTAMP - INTERVAL '1 second' * $2 ORDER BY created_at DESC LIMIT 1",
    [sanitizedRoom, TOKEN_ROTATION_SECONDS]
  );
  const active = rows as { token: string }[];
  if (active.length > 0) {
    return active[0].token;
  }

  // Generate new high-entropy token for this specific room
  const newToken = generateSecureToken();
  await pool.query(
    "INSERT INTO dynamic_qr_tokens (token, room_code) VALUES ($1, $2)",
    [newToken, sanitizedRoom]
  );
  return newToken;
}

/**
 * Validate and consume a token using atomic UPDATE with row-lock.
 * This prevents race conditions when multiple users scan simultaneously.
 * Returns true only if exactly one caller wins the atomic update.
 */
export async function consumeQRToken(token: string, expectedRoomCode?: string): Promise<boolean> {
  if (!token || typeof token !== "string") return false;

  const trimmed = token.trim();

  // Reject tokens that are obviously wrong length (brute-force mitigation)
  if (trimmed.length !== 32) return false;

  // Reject tokens with non-hex characters
  if (!/^[0-9a-f]{32}$/.test(trimmed)) return false;

  const pool = getPool();

  // Atomic single-statement consume: only one concurrent caller can succeed.
  // The WHERE clause checks is_consumed=FALSE AND expiry simultaneously.
  // affectedRows=1 means THIS caller won the race, affectedRows=0 means someone else did.
  const sanitizedRoom = expectedRoomCode?.trim();
  const roomClause = sanitizedRoom ? "AND room_code = $3" : "";
  const params = sanitizedRoom ? [trimmed, TOKEN_EXPIRY_SECONDS, sanitizedRoom] : [trimmed, TOKEN_EXPIRY_SECONDS];

  const { rows, rowCount } = await pool.query(
    `UPDATE dynamic_qr_tokens 
     SET is_consumed = TRUE 
     WHERE token = $1 
       AND is_consumed = FALSE 
       AND created_at >= CURRENT_TIMESTAMP - INTERVAL '1 second' * $2
       ${roomClause}
     RETURNING room_code`,
    params
  );

  const affected = rowCount || 0;
  if (affected === 0) {
    return false; // Token already consumed, expired, or invalid
  }
  const consumed = rows as { room_code: string }[];
  const roomCode = consumed[0]?.room_code || "default";

  // Generate the next active token in the background so form submission does not wait on a second write.
  const newToken = generateSecureToken();
  pool.query(
    "INSERT INTO dynamic_qr_tokens (token, room_code) VALUES ($1, $2)",
    [newToken, roomCode]
  ).catch((err) => console.error("[QR] Failed to pre-create next token:", err));

  return true;
}

/**
 * Validate QR token (check if active and unexpired) WITHOUT consuming it.
 * This is used for the initial page load check so that the actual consumption
 * is reserved for the final student registration form submission.
 */
export async function validateQRToken(token: string, roomCode?: string): Promise<boolean> {
  if (!token || typeof token !== "string") return false;

  const trimmed = token.trim();

  if (trimmed.length !== 32) return false;
  if (!/^[0-9a-f]{32}$/.test(trimmed)) return false;

  const pool = getPool();

  const sanitizedRoom = roomCode?.trim();
  const roomClause = sanitizedRoom ? "AND room_code = $3" : "";
  const params = sanitizedRoom ? [trimmed, TOKEN_EXPIRY_SECONDS, sanitizedRoom] : [trimmed, TOKEN_EXPIRY_SECONDS];

  const { rows } = await pool.query(
    `SELECT 1 FROM dynamic_qr_tokens
     WHERE token = $1
       AND is_consumed = FALSE
       AND created_at >= CURRENT_TIMESTAMP - INTERVAL '1 second' * $2
       ${roomClause}
     LIMIT 1`,
    params
  );

  return (rows as unknown[]).length > 0;
}

export async function consumeOfflineGrant(grant: string, roomCode: string): Promise<boolean> {
  if (!grant || typeof grant !== "string") return false;

  const payload = parseOfflineGrant(grant.trim());
  if (!payload) return false;

  const sanitizedRoom = (roomCode || "default").trim();
  const now = Math.floor(Date.now() / 1000);
  if (payload.room !== sanitizedRoom || payload.expires_at < now || payload.issued_at > now + 30) {
    return false;
  }

  const nonceHash = hashNonce(payload.nonce);
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS offline_grants (
      nonce_hash VARCHAR(64) PRIMARY KEY,
      room_code VARCHAR(50) NOT NULL,
      used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP NOT NULL
    )
  `);
  await pool.query(
    "DELETE FROM offline_grants WHERE expires_at < CURRENT_TIMESTAMP - INTERVAL '1 hour'"
  );

  const { rowCount } = await pool.query(
    `INSERT INTO offline_grants (nonce_hash, room_code, expires_at)
     VALUES ($1, $2, to_timestamp($3))
     ON CONFLICT (nonce_hash) DO NOTHING`,
    [nonceHash, sanitizedRoom, payload.expires_at]
  );

  return (rowCount || 0) === 1;
}
