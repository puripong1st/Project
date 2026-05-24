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

    // The 5-minute bypass window is calculated strictly from the original administrator approval time
    const approvedAt = student.approved_at ? new Date(student.approved_at).getTime() : 0;
    const recentTime = approvedAt;

    if (recentTime === 0) {
      return NextResponse.json({ error: "ไม่พบประวัติการอนุมัติล่าสุดเพื่อประมวลผล Bypass" }, { status: 400 });
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

    // Calculate detailed bypass metrics
    const lastEventTimeStr = new Date(recentTime).toLocaleTimeString("th-TH", { timeZone: "Asia/Bangkok" });
    const minutesAgo = Math.floor(diffSeconds / 60);
    const secondsAgo = Math.floor(diffSeconds % 60);
    const reasonText = `⚡ ผ่านเข้าห้องเรียนสำเร็จด้วยสิทธิ์ Bypass อัตโนมัติ (สแกนซ้ำภายใน 5 นาที)\n• มีประวัติเปิดประตูหรือได้รับอนุมัติล่าสุดเมื่อเวลา: ${lastEventTimeStr} น.\n• ระยะเวลาที่ผ่านไป: ${minutesAgo} นาที ${secondsAgo} วินาที (ไม่เกิน 300 วินาที)\n• ระบบอนุญาตให้ปลดล็อกประตูได้ทันทีโดยไม่ต้องลงทะเบียนซ้ำ`;

    // Trigger physical door unlock via ESP32 API
    const esp32Result = await openDoor(student.student_id, student.requested_room);

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
        reasonText, 
        esp32Result.message
      ]
    );

    // Send notification to Discord channel
    sendDiscordNotification(esp32Result.success ? "door_opened" : "door_failed", {
      studentName: `${student.first_name} ${student.last_name}`,
      studentId: student.student_id,
      adminName: "ระบบอัตโนมัติ (Bypass)",
      esp32Response: esp32Result.message,
      reason: reasonText,
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
