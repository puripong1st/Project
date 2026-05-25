// app/api/admin-users/route.ts — List + Create admin users (owner only)
import { NextRequest, NextResponse } from "next/server";
import { getPool, initDatabase, AdminRow } from "@/lib/db";
import { getAdminFromCookie } from "@/lib/auth";
import bcrypt from "bcryptjs";

let initialized = false;
async function ensureInit() {
  if (!initialized) {
    await initDatabase();
    initialized = true;
  }
}

export async function GET() {
  try {
    await ensureInit();
    const admin = await getAdminFromCookie();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (admin.role !== "owner") return NextResponse.json({ error: "Permission denied" }, { status: 403 });

    const pool = getPool();
    const { rows } = await pool.query(
      "SELECT id, username, full_name, role, is_active, created_at, last_login FROM admin_users ORDER BY created_at DESC"
    );
    return NextResponse.json({ admins: rows });
  } catch {
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureInit();
    const admin = await getAdminFromCookie();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (admin.role !== "owner") return NextResponse.json({ error: "Permission denied" }, { status: 403 });

    const { username, password, full_name, role } = await req.json();
    if (!username || !password || !full_name || !role) {
      return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบ" }, { status: 400 });
    }
    if (!["owner", "door_operator"].includes(role)) {
      return NextResponse.json({ error: "Role ไม่ถูกต้อง" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password ต้องมีอย่างน้อย 6 ตัวอักษร" }, { status: 400 });
    }

    const pool = getPool();
    const { rows: existing } = await pool.query("SELECT id FROM admin_users WHERE username = $1", [username]);
    if ((existing as AdminRow[]).length > 0) {
      return NextResponse.json({ error: "Username นี้มีอยู่แล้ว" }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 12);
    await pool.query(
      "INSERT INTO admin_users (username, password_hash, full_name, role) VALUES ($1, $2, $3, $4)",
      [username, hash, full_name, role]
    );

    return NextResponse.json({ success: true, message: "สร้าง Admin สำเร็จ" }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
