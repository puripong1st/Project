// app/api/students/[id]/approve/route.ts — Approve student + open door
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
    if (admin.role !== "owner") return NextResponse.json({ error: "Permission denied — owner only" }, { status: 403 });

    const { id } = await params;
    const studentId = parseInt(id);
    if (isNaN(studentId)) return NextResponse.json({ error: "Invalid ID" }, { status: 400 });

    const pool = getPool();

    // Get student
    const [rows] = await pool.query("SELECT * FROM students WHERE id = ?", [studentId]);
    const students = rows as StudentRow[];
    if (students.length === 0) {
      return NextResponse.json({ error: "ไม่พบข้อมูลนักศึกษา" }, { status: 404 });
    }
    const student = students[0];
    if (student.status !== "pending") {
      return NextResponse.json({ error: "นักศึกษานี้ไม่ได้อยู่ในสถานะรอการอนุมัติ" }, { status: 400 });
    }

    // Update status to approved
    await pool.query(
      "UPDATE students SET status = 'approved', approved_by = ?, approved_at = NOW() WHERE id = ?",
      [admin.id, studentId]
    );

    // Open door via ESP32
    const esp32Result = await openDoor(student.student_id);

    // Update last door open
    if (esp32Result.success) {
      await pool.query("UPDATE students SET last_door_open = NOW() WHERE id = ?", [studentId]);
    }

    // Log access
    await pool.query(
      `INSERT INTO access_logs (student_id, action, performed_by, esp32_response, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [
        studentId,
        esp32Result.success ? "door_opened" : "door_failed",
        admin.id,
        esp32Result.message,
        `อนุมัติโดย: ${admin.full_name}`,
      ]
    );

    // Discord notification
    const eventType = esp32Result.success ? "student_approved" : "door_failed";
    sendDiscordNotification(eventType, {
      studentName: `${student.first_name} ${student.last_name}`,
      studentId: student.student_id,
      adminName: admin.full_name,
      esp32Response: esp32Result.message,
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: `อนุมัติสำเร็จ${esp32Result.success ? " และเปิดประตูแล้ว" : " แต่เปิดประตูไม่สำเร็จ"}`,
      esp32: esp32Result,
    });
  } catch (error) {
    console.error("[Approve] error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในระบบ" }, { status: 500 });
  }
}
