// lib/auth.ts — JWT helpers
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

// V01 fix: no fallback — app must crash loudly if secret is missing
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("FATAL: JWT_SECRET environment variable is not set. Set it in .env.local (development) or Vercel Project Settings (production).");
}

// V02 fix: in-memory cache for admin is_active check (30s TTL per admin id)
const globalForAuth = globalThis as unknown as {
  adminActiveCache?: Map<number, { isActive: boolean; expiresAt: number }>;
};

async function checkAdminIsActive(id: number): Promise<boolean> {
  const now = Date.now();
  const cache = globalForAuth.adminActiveCache ?? (globalForAuth.adminActiveCache = new Map());
  const cached = cache.get(id);
  if (cached && cached.expiresAt > now) return cached.isActive;

  try {
    const { getPool } = await import("./db");
    const pool = getPool();
    const { rows } = await pool.query("SELECT is_active FROM admin_users WHERE id = $1", [id]);
    const isActive = rows[0]?.is_active === true;
    cache.set(id, { isActive, expiresAt: now + 30_000 });
    return isActive;
  } catch {
    // fail-open: if DB unreachable, don't lock everyone out
    return true;
  }
}

export function invalidateAdminActiveCache(id: number): void {
  globalForAuth.adminActiveCache?.delete(id);
}

const COOKIE_NAME = "rmutp_admin_token";

export interface AdminPayload {
  id: number;
  username: string;
  full_name: string;
  role: "owner" | "door_operator" | "log_viewer";
  allowed_rooms?: string | null;
}

export function canOperateRoom(admin: AdminPayload, roomCode: string): boolean {
  if (admin.role === "owner") return true;
  if (!admin.allowed_rooms) return false;
  const rooms = admin.allowed_rooms.split(",").map((r) => r.trim());
  return rooms.includes("*") || rooms.includes(roomCode);
}

export function signToken(payload: AdminPayload): string {
  return jwt.sign(payload, JWT_SECRET!, { expiresIn: "8h" });
}

export function verifyToken(token: string): AdminPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET!, { algorithms: ["HS256"] }) as AdminPayload;
  } catch {
    return null;
  }
}

export async function getAdminFromCookie(): Promise<AdminPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    const payload = verifyToken(token);
    if (!payload) return null;
    // V02 fix: verify admin is still active in DB (30s cache, fail-open)
    const isActive = await checkAdminIsActive(payload.id);
    if (!isActive) return null;
    return payload;
  } catch {
    return null;
  }
}

export function setAuthCookie(token: string): {
  name: string;
  value: string;
  httpOnly: boolean;
  secure: boolean;
  maxAge: number;
  path: string;
  sameSite: "lax" | "strict" | "none";
} {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    // Vulnerability 4 fix: only send cookie over HTTPS in production
    secure: process.env.NODE_ENV === "production",
    maxAge: 8 * 60 * 60, // 8 hours
    path: "/",
    sameSite: "lax",
  };
}

export const COOKIE_NAME_EXPORT = COOKIE_NAME;

export function validatePasswordPolicy(password: string): { ok: boolean; error?: string } {
  if (password.length < 12) {
    return { ok: false, error: "รหัสผ่านต้องมีความยาวอย่างน้อย 12 ตัวอักษร" };
  }
  if (!/[A-Z]/.test(password)) {
    return { ok: false, error: "รหัสผ่านต้องมีอักษรตัวใหญ่ (A-Z) อย่างน้อย 1 ตัว" };
  }
  if (!/[a-z]/.test(password)) {
    return { ok: false, error: "รหัสผ่านต้องมีอักษรตัวเล็ก (a-z) อย่างน้อย 1 ตัว" };
  }
  if (!/[0-9]/.test(password)) {
    return { ok: false, error: "รหัสผ่านต้องมีตัวเลข (0-9) อย่างน้อย 1 ตัว" };
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { ok: false, error: "รหัสผ่านต้องมีอักขระพิเศษอย่างน้อย 1 ตัว" };
  }
  return { ok: true };
}

export function validateUsername(username: string): { ok: boolean; error?: string } {
  const usernameRegex = /^[a-zA-Z0-9_.]{3,30}$/;
  if (!usernameRegex.test(username)) {
    return { ok: false, error: "ชื่อผู้ใช้ต้องมีความยาว 3-30 ตัวอักษร และประกอบด้วยตัวอักษร, ตัวเลข, จุด (.), หรือขีดล่าง (_) เท่านั้น" };
  }
  return { ok: true };
}
