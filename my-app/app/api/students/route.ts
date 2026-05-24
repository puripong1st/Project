// app/api/students/route.ts — GET list + POST register
import { NextRequest, NextResponse } from "next/server";
import { getPool, initDatabase, StudentRow } from "@/lib/db";
import { getAdminFromCookie } from "@/lib/auth";
import { sendDiscordNotification } from "@/lib/discord";
import { RMUTP_FACULTIES } from "@/lib/faculties";
import { openDoor } from "@/lib/esp32";
import crypto from "crypto";

let initialized = false;
async function ensureInit() {
  if (!initialized) {
    await initDatabase();
    initialized = true;
  }
}

// GET /api/students — list all students (admin only)
export async function GET(req: NextRequest) {
  try {
    await ensureInit();
    const admin = await getAdminFromCookie();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (admin.role !== "owner") return NextResponse.json({ error: "Permission denied" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const faculty = searchParams.get("faculty");
    const search = searchParams.get("search");

    const pool = getPool();
    let query = `
      SELECT s.*, a.full_name as approver_name
      FROM students s
      LEFT JOIN admin_users a ON s.approved_by = a.id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (status && status !== "all") {
      query += " AND s.status = ?";
      params.push(status);
    }
    if (faculty) {
      query += " AND s.faculty = ?";
      params.push(faculty);
    }
    if (search) {
      query += " AND (s.first_name LIKE ? OR s.last_name LIKE ? OR s.student_id LIKE ?)";
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    query += " ORDER BY s.registered_at DESC";

    const [rows] = await pool.query(query, params);
    return NextResponse.json({ students: rows as StudentRow[] });
  } catch (error) {
    console.error("[Students] GET error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในระบบ" }, { status: 500 });
  }
}

// POST /api/students — register new student (public)
export async function POST(req: NextRequest) {
  try {
    await ensureInit();
    const body = await req.json();
    const { title, first_name, last_name, student_id, year, faculty, branch } = body;

    // Validation
    if (!title || !["นาย", "นางสาว", "นาง"].includes(title)) {
      return NextResponse.json({ error: "กรุณาเลือกคำนำหน้า" }, { status: 400 });
    }
    if (!first_name?.trim()) return NextResponse.json({ error: "กรุณากรอกชื่อ" }, { status: 400 });
    if (!last_name?.trim()) return NextResponse.json({ error: "กรุณากรอกนามสกุล" }, { status: 400 });
    if (!student_id?.trim()) return NextResponse.json({ error: "กรุณากรอกรหัสนักศึกษา" }, { status: 400 });
    // รองรับ: ตัวเลขล้วน (8-13 หลัก) หรือรูปแบบ XXXXXXXXXXXX-X
    const idRegex = /^\d{8,13}$|^\d{9,12}-\d{1}$/;
    if (!idRegex.test(student_id.trim())) {
      return NextResponse.json({ error: "รูปแบบรหัสนักศึกษาไม่ถูกต้อง เช่น 036650504008-4" }, { status: 400 });
    }
    if (!year || year < 1 || year > 4) return NextResponse.json({ error: "กรุณาเลือกชั้นปี" }, { status: 400 });
    if (!faculty || !RMUTP_FACULTIES[faculty]) {
      return NextResponse.json({ error: "กรุณาเลือกคณะที่ถูกต้อง" }, { status: 400 });
    }
    if (!branch || !RMUTP_FACULTIES[faculty].includes(branch)) {
      return NextResponse.json({ error: "กรุณาเลือกสาขาที่ถูกต้อง" }, { status: 400 });
    }

    const pool = getPool();

    // Check duplicate student_id securely for intelligent re-entry / re-submission
    const [existing] = await pool.query(
      "SELECT * FROM students WHERE student_id = ?",
      [student_id.trim()]
    );
    const existingStudents = existing as StudentRow[];

    // Get client IP
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";

    if (existingStudents.length > 0) {
      const existingStudent = existingStudents[0];

      if (existingStudent.status === "approved") {
        // Returning approved student! Trigger instant re-entry bypass (open door + renew token)
        const newBypassToken = crypto.randomBytes(24).toString("hex");
        
        // Open the door lock via ESP32 integration
        const esp32Result = await openDoor(existingStudent.student_id);

        if (esp32Result.success) {
          await pool.query(
            "UPDATE students SET bypass_token = ?, last_door_open = NOW() WHERE id = ?",
            [newBypassToken, existingStudent.id]
          );
        } else {
          await pool.query(
            "UPDATE students SET bypass_token = ? WHERE id = ?",
            [newBypassToken, existingStudent.id]
          );
        }

        // Log the re-entry action inside access_logs
        await pool.query(
          `INSERT INTO access_logs (student_id, action, notes, esp32_response) VALUES (?, ?, ?, ?)`,
          [
            existingStudent.id, 
            esp32Result.success ? "door_opened" : "door_failed", 
            "ผ่านเข้าห้องเรียนสำเร็จด้วยระบบสิทธิ์อนุมัติเดิม (Re-entry)",
            esp32Result.message
          ]
        );

        // Send non-blocking Discord notification
        sendDiscordNotification(esp32Result.success ? "door_opened" : "door_failed", {
          studentName: `${existingStudent.title}${existingStudent.first_name} ${existingStudent.last_name}`,
          studentId: existingStudent.student_id,
          adminName: "ระบบสิทธิ์เดิม (Re-entry)",
          esp32Response: esp32Result.message,
        }).catch(() => {});

        return NextResponse.json({
          success: true,
          reEntry: true,
          message: "ยินดีต้อนรับกลับ! ระบบตรวจพบสิทธิ์อนุมัติของท่าน จึงได้ทำการปลดล็อกประตูให้ทันที",
          id: existingStudent.id,
          title: existingStudent.title,
          first_name: existingStudent.first_name,
          last_name: existingStudent.last_name,
          student_id: existingStudent.student_id,
          bypass_token: newBypassToken,
          status: "approved"
        }, { status: 200 });
      }

      if (existingStudent.status === "rejected") {
        // Returning rejected student! Allow them to re-register/update their details and reset to pending
        const newBypassToken = crypto.randomBytes(24).toString("hex");
        
        await pool.query(
          `UPDATE students 
           SET title = ?, first_name = ?, last_name = ?, year = ?, faculty = ?, branch = ?, status = 'pending', bypass_token = ?, rejection_reason = NULL, approved_by = NULL, approved_at = NULL, registered_at = NOW() 
           WHERE id = ?`,
          [title, first_name.trim(), last_name.trim(), year, faculty, branch, newBypassToken, existingStudent.id]
        );

        // Log the re-registration action
        await pool.query(
          "INSERT INTO access_logs (student_id, action, notes) VALUES (?, 'registered', ?)",
          [existingStudent.id, `แก้ไขข้อมูลและยื่นลงทะเบียนเข้าห้องอีกครั้งสำเร็จ (จาก IP: ${ip})`]
        );

        // Send non-blocking Discord notification
        sendDiscordNotification("student_registered", {
          studentName: `${title} ${first_name.trim()} ${last_name.trim()}`,
          studentId: student_id.trim(),
          faculty,
          branch,
          year,
        }).catch(() => {});

        return NextResponse.json({
          success: true,
          message: "ระบบได้ทำการบันทึกและส่งคำขอลงทะเบียนของท่านใหม่อีกครั้งแล้ว",
          id: existingStudent.id,
          bypass_token: newBypassToken,
          status: "pending"
        }, { status: 200 });
      }

      // If status is pending, block double submission
      return NextResponse.json({ error: "ข้อมูลของท่านอยู่ในขั้นตอนรอเจ้าหน้าที่ตรวจสอบสิทธิ์ กรุณาอย่าส่งคำขอซ้ำ" }, { status: 409 });
    }

    // Generate secure device bypass token
    const bypassToken = crypto.randomBytes(24).toString("hex");

    // Insert student
    const [result] = await pool.query(
      `INSERT INTO students (title, first_name, last_name, student_id, year, faculty, branch, status, ip_address, bypass_token)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
      [title, first_name.trim(), last_name.trim(), student_id.trim(), year, faculty, branch, ip, bypassToken]
    );

    const insertId = (result as { insertId: number }).insertId;

    // Insert access log
    await pool.query(
      "INSERT INTO access_logs (student_id, action, notes) VALUES (?, 'registered', ?)",
      [insertId, `ลงทะเบียนจาก IP: ${ip}`]
    );

    // Send Discord notification (non-blocking)
    sendDiscordNotification("student_registered", {
      studentName: `${title} ${first_name.trim()} ${last_name.trim()}`,
      studentId: student_id.trim(),
      faculty,
      branch,
      year,
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: "ลงทะเบียนสำเร็จ รอการอนุมัติจาก Admin",
      id: insertId,
      bypass_token: bypassToken,
    }, { status: 201 });
  } catch (error) {
    console.error("[Students] POST error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในระบบ" }, { status: 500 });
  }
}
