// app/api/admin-users/route.ts — List + Create admin users (owner only)
import { NextRequest, NextResponse } from "next/server";
import { getPool, initDatabase, AdminRow } from "@/lib/db";
import { getAdminFromCookie, validatePasswordPolicy, validateUsername } from "@/lib/auth";
import { withRateLimit } from "@/lib/rate-limit-middleware";
import bcrypt from "bcryptjs";
import { sendDiscordNotification } from "@/lib/discord";

let initialized = false;
async function ensureInit() {
  if (!initialized) {
    await initDatabase();
    initialized = true;
  }
}

export async function GET(req: NextRequest) {
  try {
    await ensureInit();
    const rateLimitRes = await withRateLimit(req, "admin_users", 30, 60);
    if (!rateLimitRes.allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const admin = await getAdminFromCookie();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (admin.role !== "owner") return NextResponse.json({ error: "Permission denied" }, { status: 403 });

    const pool = getPool();
    const { rows } = await pool.query(
      "SELECT id, username, full_name, role, is_active, created_at, last_login, allowed_rooms FROM admin_users ORDER BY created_at DESC"
    );
    return NextResponse.json({ admins: rows });
  } catch (error: any) {
    console.error("[Admin GET Error]", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด: " + (error?.message || String(error)) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureInit();
    const rateLimitRes = await withRateLimit(req, "admin_users", 30, 60);
    if (!rateLimitRes.allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const admin = await getAdminFromCookie();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (admin.role !== "owner") return NextResponse.json({ error: "Permission denied" }, { status: 403 });

    const { username, password, full_name, role, allowed_rooms } = await req.json();
    if (!username || !password || !full_name || !role) {
      return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบ" }, { status: 400 });
    }
    if (!["owner", "door_operator", "log_viewer"].includes(role)) {
      return NextResponse.json({ error: "Role ไม่ถูกต้อง" }, { status: 400 });
    }

    const userCheck = validateUsername(username);
    if (!userCheck.ok) {
      return NextResponse.json({ error: userCheck.error }, { status: 400 });
    }

    const passCheck = validatePasswordPolicy(password);
    if (!passCheck.ok) {
      return NextResponse.json({ error: passCheck.error }, { status: 400 });
    }

    const sanitizedFullName = full_name.replace(/<[^>]*>/g, '').slice(0, 100);
    const sanitizedAllowedRooms = typeof allowed_rooms === "string"
      ? allowed_rooms.replace(/[^a-zA-Z0-9_,-]/g, "").slice(0, 1000)
      : null;

    const pool = getPool();
    const { rows: existing } = await pool.query("SELECT id FROM admin_users WHERE username = $1", [username]);
    if ((existing as AdminRow[]).length > 0) {
      return NextResponse.json({ error: "Username นี้มีอยู่แล้ว" }, { status: 409 });
    }

    const hash = await bcrypt.hash(password, 12);
    await pool.query(
      "INSERT INTO admin_users (username, password_hash, full_name, role, allowed_rooms) VALUES ($1, $2, $3, $4, $5)",
      [username, hash, sanitizedFullName, role, sanitizedAllowedRooms]
    );

    // บันทึก Log ละเอียดลง access_logs
    const logText = `สร้างบัญชีผู้ดูแลระบบใหม่: ${sanitizedFullName} (Username: ${username}, Role: ${role}, ขอบเขตห้อง: ${sanitizedAllowedRooms || 'ทุกห้องเรียน (*)'})`;
    await pool.query(
      "INSERT INTO access_logs (action, performed_by, notes) VALUES ('admin_created', $1, $2)",
      [admin.id, logText]
    ).catch(err => console.error("[Admin Create Log] failed:", err));

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
                req.headers.get("x-real-ip") || "ไม่ทราบ";

    // ส่งแจ้งเตือนแบบละเอียด
    await sendDiscordNotification("admin_modified", {
      adminName: admin.full_name,
      adminUsername: admin.username,
      adminRole: admin.role,
      ip,
      reason: `➕ ลงทะเบียนเพิ่มสิทธิ์ผู้ดูแลระบบใหม่สำเร็จ:\n• บัญชีที่สร้าง: **${sanitizedFullName}** (Username: \`${username}\`)\n• สิทธิ์การทำงาน (Role): **${role}**\n• ขอบเขตห้องเรียนปฏิบัติการ: **${sanitizedAllowedRooms || "ทุกห้องเรียน (*)"}**`,
    }).catch(err => console.error("[Admin Create Notification] failed:", err));

    return NextResponse.json({ success: true, message: "สร้าง Admin สำเร็จ" }, { status: 201 });
  } catch (error: any) {
    console.error("[Admin GET Error]", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด: " + (error?.message || String(error)) }, { status: 500 });
  }
}
