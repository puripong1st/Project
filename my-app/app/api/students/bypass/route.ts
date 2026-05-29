// app/api/students/bypass/route.ts — Secure public bypass entry endpoint within 5 minutes
import { NextRequest, NextResponse } from "next/server";
import { getPool, initDatabase, StudentRow } from "@/lib/db";
import { openDoor } from "@/lib/esp32";
import { sendDiscordNotification } from "@/lib/discord";
import { rateLimit } from "@/lib/rate-limit";
import { logEvent, getRequestContext } from "@/lib/access-log";

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
    const { ip, userAgent } = getRequestContext(req);
    const body = await req.json();
    const { id, student_id, bypass_token } = body;

    if (!id || !student_id || !bypass_token) {
      return NextResponse.json({ error: "ข้อมูลสำหรับ Bypass ไม่ครบถ้วน" }, { status: 400 });
    }

    const pool = getPool();

    // Query student matching exact credentials securely, computing time difference directly in PostgreSQL to avoid local timezone parsing bugs!
    const { rows } = await pool.query(
      `SELECT *, EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - approved_at)) as diff_seconds 
       FROM students 
       WHERE id = $1 AND student_id = $2 AND bypass_token = $3`,
      [id, student_id.trim(), bypass_token.trim()]
    );
    const students = rows as (StudentRow & { diff_seconds: number | null })[];

    if (students.length === 0) {
      return NextResponse.json({ error: "ข้อมูลตรวจสอบสิทธิ์อุปกรณ์ไม่ถูกต้อง" }, { status: 404 });
    }

    const student = students[0];
    const room = student.requested_room || "default";

    // Durable Rate Limit (Vercel/Serverless friendly): student_id + room (e.g. max 1 attempt per 30 seconds)
    const rateLimitResult = await rateLimit({
      key: `bypass:${student.student_id}:${room}`,
      limit: 1,
      windowMs: 30 * 1000,
    });

    if (!rateLimitResult.success) {
      await logEvent({
        action: "bypass_rate_limited",
        studentId: student.id,
        room,
        ip,
        userAgent,
        severity: "warning",
        notes: `เรียกใช้ Bypass ถี่เกินกำหนด (จำกัด 1 ครั้ง/30 วินาที) — รหัสนักศึกษา ${student.student_id}`,
      });
      return NextResponse.json(
        { error: "คุณเปิดประตูซ้ำถี่เกินไป กรุณารอสักครู่" },
        { status: 429 }
      );
    }

    // V09 fix: normalize all rejection responses to same status (403) to avoid state disclosure
    if (student.status !== "approved") {
      return NextResponse.json({ error: "ข้อมูลตรวจสอบสิทธิ์อุปกรณ์ไม่ถูกต้อง" }, { status: 403 });
    }

    if (student.diff_seconds === null) {
      return NextResponse.json({ error: "ข้อมูลตรวจสอบสิทธิ์อุปกรณ์ไม่ถูกต้อง" }, { status: 403 });
    }

    const diffSeconds = Number(student.diff_seconds);

    // V10 fix: directional check — reject negative (future approved_at) and expired
    if (diffSeconds < 0 || diffSeconds > 300) {
      return NextResponse.json({
        expired: true,
        error: "เกินกำหนดเวลา 5 นาทีแล้ว กรุณากรอกข้อมูลลงทะเบียนเพื่อยื่นสิทธิ์ใหม่"
      }, { status: 400 });
    }

    // Calculate detailed bypass metrics
    const approvedAt = student.approved_at ? new Date(student.approved_at) : new Date();
    const lastEventTimeStr = approvedAt.toLocaleTimeString("th-TH", { timeZone: "Asia/Bangkok" });
    const minutesAgo = Math.floor(Math.abs(diffSeconds) / 60);
    const secondsAgo = Math.floor(Math.abs(diffSeconds) % 60);
    const reasonText = `⚡ ผ่านเข้าห้องเรียนสำเร็จด้วยสิทธิ์ Bypass อัตโนมัติ (สแกนซ้ำภายใน 5 นาที)\n• มีประวัติเปิดประตูหรือได้รับอนุมัติล่าสุดเมื่อเวลา: ${lastEventTimeStr} น.\n• ระยะเวลาที่ผ่านไป: ${minutesAgo} นาที ${secondsAgo} วินาที (ไม่เกิน 300 วินาที)\n• ระบบอนุญาตให้ปลดล็อกประตูได้ทันทีโดยไม่ต้องลงทะเบียนซ้ำ`;

    // Trigger physical door unlock via ESP32 API
    const esp32Result = await openDoor(student.student_id, student.requested_room);

    if (esp32Result.success) {
      // Update last_door_open timestamp
      await pool.query("UPDATE students SET last_door_open = CURRENT_TIMESTAMP WHERE id = $1", [student.id]);
    }

    // Log the bypass entry event inside PostgreSQL (Supabase) access_logs — ครบ IP/อุปกรณ์/severity
    await logEvent({
      action: esp32Result.success ? "door_opened" : "door_failed",
      studentId: student.id,
      room,
      ip,
      userAgent,
      esp32Response: esp32Result.message,
      notes: reasonText,
      method: "bypass_5min",
      severity: esp32Result.success ? "info" : "warning",
    });

    // Send notification to Discord channel
    await sendDiscordNotification(esp32Result.success ? "door_opened" : "door_failed", {
      studentName: `${student.first_name} ${student.last_name}`,
      studentId: student.student_id,
      adminName: "ระบบอัตโนมัติ (Bypass)",
      esp32Response: esp32Result.message,
      reason: reasonText,
      room: student.requested_room,
      ip,
      userAgent,
    }).catch((err) => console.error("[Bypass Notification] failed:", err));

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
