// app/api/students/[id]/door/route.ts — Open door for approved student (door_operator allowed)
import { NextRequest, NextResponse } from "next/server";
import { getPool, initDatabase, StudentRow } from "@/lib/db";
import { getAdminFromCookie, canOperateRoom } from "@/lib/auth";
import { openDoor } from "@/lib/esp32";
import { sendDiscordNotification } from "@/lib/discord";
import { logEvent, getRequestContext } from "@/lib/access-log";

let initialized = false;
async function ensureInit() {
  if (!initialized) {
    await initDatabase();
    initialized = true;
  }
}

function runBackground(task: Promise<unknown>, label: string): void {
  task.catch((err) => console.error(`[Door] Background ${label} failed:`, err));
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureInit();
    const admin = await getAdminFromCookie();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (admin.role !== "owner" && admin.role !== "door_operator") {
      return NextResponse.json({ error: "สิทธิ์ไม่เพียงพอในการเปิดประตู" }, { status: 403 });
    }

    const { id } = await params;
    const studentId = parseInt(id);
    if (isNaN(studentId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const pool = getPool();
    const { rows } = await pool.query("SELECT * FROM students WHERE id = $1", [studentId]);
    const students = rows as StudentRow[];
    if (students.length === 0) {
      return NextResponse.json({ error: "ไม่พบข้อมูลนักศึกษา" }, { status: 404 });
    }
    const student = students[0];
    if (student.status !== "approved") {
      return NextResponse.json({ error: "นักศึกษานี้ยังไม่ได้รับการอนุมัติ" }, { status: 400 });
    }

    if (!canOperateRoom(admin, student.requested_room)) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์ควบคุมห้องนี้" }, { status: 403 });
    }

    const esp32Result = await openDoor(student.student_id, student.requested_room);

    if (esp32Result.success) {
      runBackground(
        pool.query("UPDATE students SET last_door_open = CURRENT_TIMESTAMP WHERE id = $1", [studentId]),
        "last_door_open update"
      );
    }

    const { ip, userAgent } = getRequestContext(req);
    runBackground(logEvent({
      action: esp32Result.success ? "door_opened" : "door_failed",
      studentId,
      performedBy: admin.id,
      room: student.requested_room,
      ip,
      userAgent,
      esp32Response: esp32Result.message,
      notes: `สั่งเปิดประตูโดย: ${admin.full_name}`,
      method: "admin_manual",
      severity: esp32Result.success ? "info" : "warning",
    }), "access log");

    await sendDiscordNotification(esp32Result.success ? "door_opened" : "door_failed", {
      studentName: `${student.first_name} ${student.last_name}`,
      studentId: student.student_id,
      adminName: admin.full_name,
      esp32Response: esp32Result.message,
      room: student.requested_room,
      ip,
      userAgent,
    }).catch((err) => console.error("[Door Notification] failed:", err));

    return NextResponse.json({ success: esp32Result.success, message: esp32Result.message, esp32: esp32Result });
  } catch (error) {
    console.error("[Door] error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในระบบ" }, { status: 500 });
  }
}
