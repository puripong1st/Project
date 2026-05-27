// lib/auth.ts — JWT helpers
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "rmutp-secret-key";

function verifyJwtSecretSecurity() {
  if (JWT_SECRET === "rmutp-secret-key" && process.env.NODE_ENV === "production") {
    throw new Error("CRITICAL SECURITY ERROR: JWT_SECRET environment variable is missing or insecurely configured in production!");
  }
}

const COOKIE_NAME = "rmutp_admin_token";

export interface AdminPayload {
  id: number;
  username: string;
  full_name: string;
  role: "owner" | "door_operator";
  allowed_rooms?: string | null;
}

export function canOperateRoom(admin: AdminPayload, roomCode: string): boolean {
  if (admin.role === "owner") return true;
  if (!admin.allowed_rooms) return false;
  const rooms = admin.allowed_rooms.split(",").map((r) => r.trim());
  return rooms.includes(roomCode);
}

export function signToken(payload: AdminPayload): string {
  verifyJwtSecretSecurity();
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "8h" });
}

export function verifyToken(token: string): AdminPayload | null {
  verifyJwtSecretSecurity();
  try {
    return jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] }) as AdminPayload;
  } catch {
    return null;
  }
}

export async function getAdminFromCookie(): Promise<AdminPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyToken(token);
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
