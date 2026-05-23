// lib/auth.ts — JWT helpers
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "rmutp-secret-key";
const COOKIE_NAME = "rmutp_admin_token";

export interface AdminPayload {
  id: number;
  username: string;
  full_name: string;
  role: "owner" | "door_operator";
}

export function signToken(payload: AdminPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "8h" });
}

export function verifyToken(token: string): AdminPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AdminPayload;
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

export function setAuthCookie(token: string): { name: string; value: string; httpOnly: boolean; maxAge: number; path: string; sameSite: "strict" } {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    maxAge: 8 * 60 * 60, // 8 hours
    path: "/",
    sameSite: "strict",
  };
}

export const COOKIE_NAME_EXPORT = COOKIE_NAME;
