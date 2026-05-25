// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getPool, initDatabase, AdminRow } from "@/lib/db";
import { signToken, setAuthCookie } from "@/lib/auth";
import bcrypt from "bcryptjs";

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
      return NextResponse.json({ error: "username หรือ password ไม่ถูกต้อง" }, { status: 401 });
    }

    const admin = admins[0];
    const valid = await bcrypt.compare(password, admin.password_hash);
    if (!valid) {
      return NextResponse.json({ error: "username หรือ password ไม่ถูกต้อง" }, { status: 401 });
    }

    // Update last login
    await pool.query("UPDATE admin_users SET last_login = NOW() WHERE id = $1", [admin.id]);

    const token = signToken({
      id: admin.id,
      username: admin.username,
      full_name: admin.full_name,
      role: admin.role,
    });

    const cookieOpts = setAuthCookie(token);
    const response = NextResponse.json({
      success: true,
      user: { id: admin.id, username: admin.username, full_name: admin.full_name, role: admin.role },
    });

    response.cookies.set(cookieOpts);
    return response;
  } catch (error) {
    console.error("[Auth] Login error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในระบบ" }, { status: 500 });
  }
}
