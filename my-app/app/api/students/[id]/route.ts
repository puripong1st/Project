// app/api/students/[id]/route.ts — GET single + DELETE
import { NextRequest, NextResponse } from "next/server";
import { getPool, initDatabase, StudentRow } from "@/lib/db";
import { getAdminFromCookie } from "@/lib/auth";
import { sweepExpiredPending } from "@/lib/auto-reject";
import { logEvent, getRequestContext } from "@/lib/access-log";
import { sendDiscordNotification } from "@/lib/discord";

let initialized = false;
async function ensureInit() {
  if (!initialized) {
    await initDatabase();
    initialized = true;
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureInit();
    // Try to retrieve admin context (if available)
    const admin = await getAdminFromCookie();

    const { id } = await params;
    if (!/^\d+$/.test(id)) {
      return NextResponse.json({ error: "ID นักศึกษาต้องเป็นตัวเลข" }, { status: 400 });
    }
    const numId = parseInt(id, 10);

    await sweepExpiredPending();

    const pool = getPool();
    const { rows } = await pool.query(
      `SELECT s.*, a.full_name as approver_name FROM students s
       LEFT JOIN admin_users a ON s.approved_by = a.id
       WHERE s.id = $1`,
      [numId]
    );
    const students = rows as StudentRow[];
    if (students.length === 0) {
      return NextResponse.json({ error: "ไม่พบข้อมูลนักศึกษา" }, { status: 404 });
    }

    const student = students[0];

    // ─── Data Privacy Filtering ───
    if (admin) {
      // 1. If admin is logged in
      if (admin.role !== "owner") {
        // Door Operator: strip sensitive fields to prevent IDOR data leakage
        const safeStudent = Object.fromEntries(
          Object.entries(student).filter(([key]) => key !== "ip_address" && key !== "bypass_token")
        );
        return NextResponse.json({ student: safeStudent });
      }
      // Owner: return full record
      return NextResponse.json({ student });
    } else {
      // 2. If student is polling publicly to see their status:
      // Bypassing/checking token parameter to prevent IDOR (Insecure Direct Object Reference)
      const { searchParams } = new URL(req.url);
      const clientToken = searchParams.get("token");

      if (!clientToken || clientToken !== student.bypass_token) {
        return NextResponse.json(
          { error: "ไม่ได้รับอนุญาตให้ดึงข้อมูลส่วนตัวของนักศึกษารหัสนี้" },
          { status: 401 }
        );
      }

      // Strip critical secrets (bypass_token, ip_address) to prevent hijacking
      const safePublicStudent = {
        id: student.id,
        title: student.title,
        first_name: student.first_name,
        last_name: student.last_name,
        student_id: student.student_id,
        year: student.year,
        faculty: student.faculty,
        branch: student.branch,
        status: student.status,
        rejection_reason: student.rejection_reason,
        registered_at: student.registered_at,
        last_door_open: student.last_door_open,
      };
      return NextResponse.json({ student: safePublicStudent });
    }
  } catch {
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
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
    if (!/^\d+$/.test(id)) {
      return NextResponse.json({ error: "ID นักศึกษาต้องเป็นตัวเลข" }, { status: 400 });
    }
    const numId = parseInt(id, 10);
    const pool = getPool();

    // ดึงข้อมูลนักศึกษาก่อนลบ — เพื่อเก็บชื่อ/รหัส/ห้องไว้ใน log+แจ้งเตือน
    // (หลังลบ student_id ใน access_logs จะถูกตั้งเป็น NULL ตาม ON DELETE SET NULL)
    const { rows: preRows } = await pool.query(
      "SELECT first_name, last_name, student_id, requested_room, status FROM students WHERE id = $1",
      [numId]
    );
    const target = (preRows as StudentRow[])[0];
    if (!target) {
      return NextResponse.json({ error: "ไม่พบข้อมูลนักศึกษา" }, { status: 404 });
    }

    // Legal Compliance (Computer Crime Act): Do NOT delete access logs.
    // The database will automatically set student_id to NULL via ON DELETE SET NULL,
    // retaining the crucial audit logs/traffic trails for at least 90 days.
    await pool.query("DELETE FROM students WHERE id = $1", [numId]);

    const studentName = `${target.first_name} ${target.last_name}`;
    const { ip, userAgent } = getRequestContext(req);

    // บันทึก audit log (student_id = null เพราะแถวถูกลบแล้ว แต่ระบุตัวตนใน notes)
    await logEvent({
      action: "student_deleted",
      performedBy: admin.id,
      room: target.requested_room,
      ip,
      userAgent,
      severity: "warning",
      notes: `ลบข้อมูลนักศึกษา: ${studentName} (รหัส ${target.student_id}, สถานะเดิม: ${target.status}) โดย ${admin.full_name}`,
    });

    // แจ้งเตือนทุกช่องทาง (Discord/Telegram/LINE)
    await sendDiscordNotification("security_alert", {
      alertTitle: "ลบข้อมูลนักศึกษาออกจากระบบ",
      alertDetail: `ผู้ดูแลระบบ **${admin.full_name}** ลบข้อมูลนักศึกษาออกจากทำเนียบ`,
      studentId: target.student_id,
      room: target.requested_room,
      reason: `ชื่อ: ${studentName} | สถานะเดิม: ${target.status}`,
      ip,
      userAgent,
    }).catch((e) => console.error("[Student Delete Notify] failed:", e));

    return NextResponse.json({ success: true, message: "ลบข้อมูลสำเร็จ" });
  } catch (error) {
    console.error("[Student DELETE] error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
