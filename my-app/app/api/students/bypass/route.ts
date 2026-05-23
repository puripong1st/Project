// app/api/students/bypass/route.ts — Secure public bypass entry endpoint within 5 minutes
import { NextRequest, NextResponse } from "next/server";
import { getPool, initDatabase, StudentRow } from "@/lib/db";
import { openDoor } from "@/lib/esp32";
import { sendDiscordNotification } from "@/lib/discord";

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
    const body = await req.json();
    const { id, student_id, bypass_token } = body;

    if (!id || !student_id || !bypass_token) {
      return NextResponse.json({ error: "ข้อมูลสำหรับ Bypass ไม่ครบถ้วน" }, { status: 400 });
    }

    const pool = getPool();

    // Query student matching exact credentials securely
    const [rows] = await pool.query(
      "SELECT * FROM students WHERE id = ? AND student_id = ? AND bypass_token = ?",
      [id, student_id.trim(), bypass_token.trim()]
    );
    const students = rows as StudentRow[];

    if (students.length === 0) {
      return NextResponse.json({ error: "ข้อมูลตรวจสอบสิทธิ์อุปกรณ์ไม่ถูกต้อง" }, { status: 404 });
    }

    const student = students[0];

    // Student MUST be approved by an administrator to bypass
    if (student.status !== "approved") {
      return NextResponse.json({ error: "ไม่สามารถ Bypass ได้เนื่องจากสิทธิ์ของคุณถูกระงับหรือยังไม่อนุมัติ" }, { status: 403 });
    }

    // Determine the most recent door open or approval event time
    const lastOpen = student.last_door_open ? new Date(student.last_door_open).getTime() : 0;
    const approvedAt = student.approved_at ? new Date(student.approved_at).getTime() : 0;
    const recentTime = Math.max(lastOpen, approvedAt);

    if (recentTime === 0) {
      return NextResponse.json({ error: "ไม่พบประวัติการเข้าใช้งานล่าสุดเพื่อประมวลผล Bypass" }, { status: 400 });
    }

    const now = new Date().getTime();
    const diffSeconds = (now - recentTime) / 1000;

    // Check if within 5 minutes limit (300 seconds)
    if (diffSeconds > 300) {
      return NextResponse.json({ 
        expired: true, 
        error: "เกินกำหนดเวลา 5 นาทีแล้ว กรุณากรอกข้อมูลลงทะเบียนเพื่อยื่นสิทธิ์ใหม่" 
      }, { status: 400 });
    }

    // Trigger physical door unlock via ESP32 API
    const esp32Result = await openDoor(student.student_id);

    if (esp32Result.success) {
      // Update last_door_open timestamp
      await pool.query("UPDATE students SET last_door_open = NOW() WHERE id = ?", [student.id]);
    }

    // Log the bypass entry event inside MySQL access_logs
    await pool.query(
      `INSERT INTO access_logs (student_id, action, notes, esp32_response) VALUES (?, ?, ?, ?)`,
      [
        student.id, 
        esp32Result.success ? "door_opened" : "door_failed", 
        "ผ่านเข้าห้องเรียนสำเร็จด้วยระบบ Bypass อัตโนมัติ (สแกนซ้ำภายใน 5 นาที)", 
        esp32Result.message
      ]
    );

    // Send notification to Discord channel
    sendDiscordNotification(esp32Result.success ? "door_opened" : "door_failed", {
      studentName: `${student.first_name} ${student.last_name}`,
      studentId: student.student_id,
      adminName: "ระบบอัตโนมัติ (Bypass)",
      esp32Response: esp32Result.message,
    }).catch(() => {});

    return NextResponse.json({
      success: esp32Result.success,
      message: "ปลดล็อกประตูผ่านระบบ Bypass 5 นาทีสำเร็จ",
      esp32: esp32Result,
    });
  } catch (error) {
    console.error("[Bypass Route] error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการตรวจสอบ Bypass" }, { status: 500 });
  }
}
