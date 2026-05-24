// app/api/students/[id]/reject/route.ts — Reject student
import { NextRequest, NextResponse } from "next/server";
import { getPool, initDatabase, StudentRow } from "@/lib/db";
import { getAdminFromCookie } from "@/lib/auth";
import { sendDiscordNotification } from "@/lib/discord";

let initialized = false;
async function ensureInit() {
  if (!initialized) {
    await initDatabase();
    initialized = true;
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureInit();
    const admin = await getAdminFromCookie();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (admin.role !== "owner") return NextResponse.json({ error: "Permission denied" }, { status: 403 });

    const { id } = await params;
    const studentId = parseInt(id);
    if (isNaN(studentId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const { reason } = await req.json();

    const pool = getPool();
    const [rows] = await pool.query("SELECT * FROM students WHERE id = ?", [studentId]);
    const students = rows as StudentRow[];
    if (students.length === 0) {
      return NextResponse.json({ error: "ไม่พบข้อมูลนักศึกษา" }, { status: 404 });
    }
    const student = students[0];

    await pool.query(
      "UPDATE students SET status = 'rejected', approved_by = ?, approved_at = NOW(), rejection_reason = ? WHERE id = ?",
      [admin.id, reason || "ไม่ผ่านการตรวจสอบ", studentId]
    );

    await pool.query(
      `INSERT INTO access_logs (student_id, action, performed_by, notes, room_code) VALUES (?, 'rejected', ?, ?, ?)`,
      [studentId, admin.id, `เหตุผล: ${reason || "ไม่ผ่านการตรวจสอบ"} | โดย: ${admin.full_name}`, student.requested_room || 'default']
    );

    sendDiscordNotification("student_rejected", {
      studentName: `${student.first_name} ${student.last_name}`,
      studentId: student.student_id,
      adminName: admin.full_name,
      reason: reason || "ไม่ผ่านการตรวจสอบ",
      room: student.requested_room,
    }).catch(() => {});

    return NextResponse.json({ success: true, message: "ปฏิเสธคำขอสำเร็จ" });
  } catch (error) {
    console.error("[Reject] error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในระบบ" }, { status: 500 });
  }
}
