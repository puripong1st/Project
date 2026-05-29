// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getPool, initDatabase, AdminRow } from "@/lib/db";
import { signToken, setAuthCookie } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import bcrypt from "bcryptjs";
import { getClientIp } from "@/lib/client-ip";
import { sendDiscordNotification } from "@/lib/discord";
import { logEvent } from "@/lib/access-log";

let initialized = false;
async function ensureInit() {
  if (!initialized) {
    await initDatabase();
    initialized = true;
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureInit();

    // Get IP address from headers securely
    const ip = getClientIp(req);

    // Durable Rate Limit (Vercel/Serverless friendly)
    const rateLimitResult = await rateLimit({
      key: `login:${ip}`,
      limit: 5,
      windowMs: 60 * 1000,
    });

    const ua = req.headers.get("user-agent") || "";

    if (!rateLimitResult.success) {
      await logEvent({
        action: "login_rate_limited",
        ip,
        userAgent: ua,
        severity: "warning",
        notes: "พยายามล็อกอินถี่เกินกำหนด (จำกัด 5 ครั้ง/นาที ต่อ IP)",
      });
      // แจ้งเตือนความปลอดภัย (อาจเป็นการเดารหัสผ่าน)
      await sendDiscordNotification("security_alert", {
        alertTitle: "ตรวจพบการล็อกอินถี่ผิดปกติ",
        alertDetail: "มี IP พยายามล็อกอินเกินขีดจำกัด (อาจเป็น Brute-force)",
        ip,
        userAgent: ua,
      }).catch(() => {});
      return NextResponse.json(
        { error: "พยายามล็อกอินมากเกินไป กรุณาลองใหม่ในอีก 1 นาที" },
        { status: 429 }
      );
    }

    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: "กรุณากรอก username และ password" }, { status: 400 });
    }

    const pool = getPool();
    const { rows } = await pool.query(
      "SELECT * FROM admin_users WHERE username = $1 AND is_active = true",
      [username]
    );

    const admins = rows as AdminRow[];
    if (admins.length === 0) {
      // Fire-and-forget: failed login alert (unknown username)
      await sendDiscordNotification("admin_login_failed", {
        adminUsername: String(username).substring(0, 30),
        ip,
        userAgent: ua,
        reason: "ไม่พบ Username ในระบบ หรือบัญชีถูกระงับ",
      }).catch((err) => console.error("[Login Failed Notification] failed:", err));
      await logEvent({
        action: "admin_login_failed",
        ip,
        userAgent: ua,
        severity: "warning",
        details: ua.substring(0, 300),
        notes: `Username: ${String(username).substring(0, 30)} — ไม่พบในระบบ`,
      });
      return NextResponse.json({ error: "username หรือ password ไม่ถูกต้อง" }, { status: 401 });
    }

    const admin = admins[0];
    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) {
      // Fire-and-forget: failed login alert (wrong password)
      await sendDiscordNotification("admin_login_failed", {
        adminUsername: admin.username,
        adminName: admin.full_name,
        adminRole: admin.role,
        ip,
        userAgent: ua,
        reason: "Password ไม่ถูกต้อง",
      }).catch((err) => console.error("[Login Failed Notification] failed:", err));
      await logEvent({
        action: "admin_login_failed",
        performedBy: admin.id,
        ip,
        userAgent: ua,
        severity: "warning",
        details: ua.substring(0, 300),
        notes: "Password ไม่ถูกต้อง",
      });
      return NextResponse.json({ error: "username หรือ password ไม่ถูกต้อง" }, { status: 401 });
    }

    const token = signToken({
      id: admin.id,
      username: admin.username,
      full_name: admin.full_name,
      role: admin.role,
      allowed_rooms: admin.allowed_rooms,
    });

    const cookieOpts = setAuthCookie(token);
    const response = NextResponse.json({
      success: true,
      user: { id: admin.id, username: admin.username, full_name: admin.full_name, role: admin.role, allowed_rooms: admin.allowed_rooms },
    });

    response.cookies.set(cookieOpts);

    // Fire-and-forget: update last_login + Discord notify + audit log
    pool.query("UPDATE admin_users SET last_login = NOW() WHERE id = $1", [admin.id])
      .catch((err) => console.error("[Auth] Failed to update last_login:", err));

    await sendDiscordNotification("admin_login", {
      adminName: admin.full_name,
      adminUsername: admin.username,
      adminRole: admin.role,
      ip,
      userAgent: ua,
    }).catch((err) => console.error("[Login Notification] failed:", err));

    await logEvent({
      action: "admin_login",
      performedBy: admin.id,
      ip,
      userAgent: ua,
      severity: "info",
      details: ua.substring(0, 300),
      notes: `เข้าสู่ระบบสำเร็จ — Role: ${admin.role}`,
    });

    return response;
  } catch (error) {
    console.error("[Auth] Login error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในระบบ" }, { status: 500 });
  }
}
