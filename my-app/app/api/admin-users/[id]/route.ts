// app/api/admin-users/[id]/route.ts — Delete admin user
import { NextRequest, NextResponse } from "next/server";
import { getPool, initDatabase } from "@/lib/db";
import { getAdminFromCookie, invalidateAdminActiveCache } from "@/lib/auth";
import { sendDiscordNotification } from "@/lib/discord";

let initialized = false;
async function ensureInit() {
  if (!initialized) {
    await initDatabase();
    initialized = true;
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureInit();
    const admin = await getAdminFromCookie();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (admin.role !== "owner") return NextResponse.json({ error: "Permission denied" }, { status: 403 });

    const { id } = await params;
    const targetId = parseInt(id, 10);
    if (isNaN(targetId)) {
      return NextResponse.json({ error: "ID แอดมินต้องเป็นตัวเลข" }, { status: 400 });
    }

    if (admin.id === targetId) {
      return NextResponse.json({ error: "ไม่สามารถลบบัญชีตัวเองได้" }, { status: 400 });
    }

    const pool = getPool();
    // Prevent deleting owner
    const { rows: checkRows } = await pool.query("SELECT username, full_name, role FROM admin_users WHERE id = $1", [targetId]);
    if (checkRows.length === 0) {
      return NextResponse.json({ error: "ไม่พบแอดมินคนนี้" }, { status: 404 });
    }
    const targetAdmin = checkRows[0];
    if (targetAdmin.role === "owner") {
      return NextResponse.json({ error: "ไม่สามารถลบหรือถอนสิทธิ์บัญชีประเภท Owner ได้" }, { status: 400 });
    }

    await pool.query("DELETE FROM admin_users WHERE id = $1", [targetId]);
    // V02 fix: clear the is_active cache so deleted admin is rejected immediately
    invalidateAdminActiveCache(targetId);

    // บันทึก Log ละเอียดลง access_logs
    await pool.query(
      "INSERT INTO access_logs (action, performed_by, notes) VALUES ('admin_deleted', $1, $2)",
      [admin.id, `ถอนสิทธิ์/ลบบัญชีแอดมิน: ${targetAdmin.full_name} (Username: ${targetAdmin.username}, Role: ${targetAdmin.role})`]
    ).catch(err => console.error("[Admin Delete Log] failed:", err));

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
                req.headers.get("x-real-ip") || "ไม่ทราบ";

    // ส่งแจ้งเตือนแบบละเอียด
    await sendDiscordNotification("admin_modified", {
      adminName: admin.full_name,
      adminUsername: admin.username,
      adminRole: admin.role,
      ip,
      reason: `❌ ถอนสิทธิ์/ลบบัญชีแอดมินสำเร็จ:\n• บัญชีที่ถูกลบ: **${targetAdmin.full_name}** (Username: \`${targetAdmin.username}\`)\n• สิทธิ์เดิม (Role): **${targetAdmin.role}**`,
    }).catch(err => console.error("[Admin Delete Notification] failed:", err));

    return NextResponse.json({ success: true, message: "ลบ Admin สำเร็จ" });
  } catch {
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureInit();
    const admin = await getAdminFromCookie();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (admin.role !== "owner") return NextResponse.json({ error: "Permission denied" }, { status: 403 });

    const { id } = await params;
    const targetId = parseInt(id, 10);
    if (isNaN(targetId)) {
      return NextResponse.json({ error: "ID แอดมินต้องเป็นตัวเลข" }, { status: 400 });
    }

    const pool = getPool();
    // Prevent editing owner
    const { rows: checkRows } = await pool.query("SELECT username, full_name, role, allowed_rooms FROM admin_users WHERE id = $1", [targetId]);
    if (checkRows.length === 0) {
      return NextResponse.json({ error: "ไม่พบแอดมินคนนี้" }, { status: 404 });
    }
    const targetAdmin = checkRows[0];
    if (targetAdmin.role === "owner") {
      return NextResponse.json({ error: "ไม่สามารถแก้ไขข้อมูลบัญชีประเภท Owner ได้" }, { status: 400 });
    }

    const { full_name, role, allowed_rooms } = await req.json();
    if (!full_name || !role) {
      return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบ" }, { status: 400 });
    }

    if (!["owner", "door_operator", "log_viewer"].includes(role)) {
      return NextResponse.json({ error: "Role ไม่ถูกต้อง" }, { status: 400 });
    }

    const sanitizedFullName = full_name.replace(/<[^>]*>/g, '').slice(0, 100);
    const sanitizedAllowedRooms = typeof allowed_rooms === "string"
      ? allowed_rooms.replace(/[^a-zA-Z0-9_,-]/g, "").slice(0, 1000)
      : null;

    await pool.query(
      `UPDATE admin_users 
       SET full_name = $1, role = $2, allowed_rooms = $3 
       WHERE id = $4`,
      [sanitizedFullName, role, sanitizedAllowedRooms, targetId]
    );

    // Clear active cache for this admin
    invalidateAdminActiveCache(targetId);

    // ทำการเปรียบเทียบค่าความเปลี่ยนแปลงของแอดมิน
    const adminDiff: string[] = [];
    if (targetAdmin.full_name !== sanitizedFullName) {
      adminDiff.push(`• ชื่อ-นามสกุล: ${targetAdmin.full_name} ➔ ${sanitizedFullName}`);
    }
    if (targetAdmin.role !== role) {
      adminDiff.push(`• บทบาท (Role): ${targetAdmin.role} ➔ ${role}`);
    }
    const oldRooms = targetAdmin.allowed_rooms || "ทุกห้องเรียน (*)";
    const newRooms = sanitizedAllowedRooms || "ทุกห้องเรียน (*)";
    if (oldRooms !== newRooms) {
      adminDiff.push(`• ขอบเขตห้อง: ${oldRooms} ➔ ${newRooms}`);
    }

    const diffText = adminDiff.length > 0 ? adminDiff.join("\n") : "ไม่มีการเปลี่ยนแปลงข้อมูลจริง";

    // บันทึก Log ละเอียดลง access_logs
    await pool.query(
      "INSERT INTO access_logs (action, performed_by, notes) VALUES ('admin_updated', $1, $2)",
      [admin.id, `แก้ไขข้อมูลแอดมิน: ${targetAdmin.full_name} (Username: ${targetAdmin.username})\nรายละเอียดความเปลี่ยนแปลง:\n${diffText}`]
    ).catch(err => console.error("[Admin Update Log] failed:", err));

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
                req.headers.get("x-real-ip") || "ไม่ทราบ";

    // ส่งแจ้งเตือนแบบละเอียด
    await sendDiscordNotification("admin_modified", {
      adminName: admin.full_name,
      adminUsername: admin.username,
      adminRole: admin.role,
      ip,
      reason: `✏️ แก้ไขข้อมูลผู้ดูแลระบบสำเร็จ (Username: \`${targetAdmin.username}\`):\n${diffText}`,
    }).catch(err => console.error("[Admin Update Notification] failed:", err));

    return NextResponse.json({ success: true, message: "แก้ไขข้อมูล Admin สำเร็จ" });
  } catch (error) {
    console.error("[Admin Update Error]", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการแก้ไขข้อมูล" }, { status: 500 });
  }
}
