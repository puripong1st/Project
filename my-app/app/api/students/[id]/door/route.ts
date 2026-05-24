// app/api/students/[id]/door/route.ts — Open door for approved student (door_operator allowed)
import { NextRequest, NextResponse } from "next/server";
import { getPool, initDatabase, StudentRow } from "@/lib/db";
import { getAdminFromCookie } from "@/lib/auth";
import { openDoor } from "@/lib/esp32";
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
    // Both roles can open door

    const { id } = await params;
    const studentId = parseInt(id);
    if (isNaN(studentId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const pool = getPool();
    const [rows] = await pool.query("SELECT * FROM students WHERE id = ?", [studentId]);
    const students = rows as StudentRow[];
    if (students.length === 0) {
      return NextResponse.json({ error: "ไม่พบข้อมูลนักศึกษา" }, { status: 404 });
    }
    const student = students[0];
    if (student.status !== "approved") {
      return NextResponse.json({ error: "นักศึกษานี้ยังไม่ได้รับการอนุมัติ" }, { status: 400 });
    }

    const esp32Result = await openDoor(student.student_id, student.requested_room);

    if (esp32Result.success) {
      await pool.query("UPDATE students SET last_door_open = NOW() WHERE id = ?", [studentId]);
    }

    await pool.query(
      `INSERT INTO access_logs (student_id, action, performed_by, esp32_response, notes, room_code) VALUES (?, ?, ?, ?, ?, ?)`,
      [studentId, esp32Result.success ? "door_opened" : "door_failed", admin.id, esp32Result.message, `สั่งเปิดประตูโดย: ${admin.full_name}`, student.requested_room || 'default']
    );

    sendDiscordNotification(esp32Result.success ? "door_opened" : "door_failed", {
      studentName: `${student.first_name} ${student.last_name}`,
      studentId: student.student_id,
      adminName: admin.full_name,
      esp32Response: esp32Result.message,
      room: student.requested_room,
    }).catch(() => {});

    return NextResponse.json({ success: esp32Result.success, message: esp32Result.message, esp32: esp32Result });
  } catch (error) {
    console.error("[Door] error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในระบบ" }, { status: 500 });
  }
}
