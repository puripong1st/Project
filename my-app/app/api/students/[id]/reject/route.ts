// app/api/students/[id]/reject/route.ts — Reject student
import { NextRequest, NextResponse } from "next/server";
import { getPool, initDatabase, StudentRow } from "@/lib/db";
import { getAdminFromCookie } from "@/lib/auth";
import { sendDiscordNotification } from "@/lib/discord";
import { logEvent, getRequestContext } from "@/lib/access-log";

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
    const sanitizedReason = typeof reason === "string"
      ? reason.replace(/<[^>]*>/g, "").trim().slice(0, 500)
      : "";
    const finalReason = sanitizedReason || "ไม่ผ่านการตรวจสอบ";

    const pool = getPool();
    const { rows } = await pool.query("SELECT * FROM students WHERE id = $1", [studentId]);
    const students = rows as StudentRow[];
    if (students.length === 0) {
      return NextResponse.json({ error: "ไม่พบข้อมูลนักศึกษา" }, { status: 404 });
    }
    const student = students[0];

    await pool.query(
      "UPDATE students SET status = 'rejected', approved_by = $1, approved_at = CURRENT_TIMESTAMP, rejection_reason = $2 WHERE id = $3",
      [admin.id, finalReason, studentId]
    );

    const { ip, userAgent } = getRequestContext(req);
    await logEvent({
      action: "rejected",
      studentId,
      performedBy: admin.id,
      room: student.requested_room,
      ip,
      userAgent,
      notes: `เหตุผล: ${finalReason} | โดย: ${admin.full_name}`,
      severity: "warning",
    });

    await sendDiscordNotification("student_rejected", {
      studentName: `${student.first_name} ${student.last_name}`,
      studentId: student.student_id,
      adminName: admin.full_name,
      reason: finalReason,
      room: student.requested_room,
      ip,
      userAgent,
    }).catch((err) => console.error("[Reject Notification] failed:", err));

    return NextResponse.json({ success: true, message: "ปฏิเสธคำขอสำเร็จ" });
  } catch (error) {
    console.error("[Reject] error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในระบบ" }, { status: 500 });
  }
}
