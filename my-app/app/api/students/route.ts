// app/api/students/route.ts — GET list + POST register
import { NextRequest, NextResponse } from "next/server";
import { getPool, initDatabase, StudentRow, getSystemSettings } from "@/lib/db";
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
// POST /api/students — register new student (public)
export async function POST(req: NextRequest) {
  try {
    await ensureInit();
    const body = await req.json();
    const { title, first_name, last_name, student_id, year, faculty, branch, requested_room } = body;

    // Sanitize input to prevent XSS
    const sanitizeHTML = (input: string): string => {
      return input.replace(/<[^>]*>/g, '');
    };
    const sanitizedTitle = sanitizeHTML(title?.trim() ?? '');
    const sanitizedFirstName = sanitizeHTML(first_name?.trim() ?? '');
    const sanitizedLastName = sanitizeHTML(last_name?.trim() ?? '');
    const sanitizedStudentId = sanitizeHTML(student_id?.trim() ?? '');
    const sanitizedFaculty = sanitizeHTML(faculty?.trim() ?? '');
    const sanitizedBranch = sanitizeHTML(branch?.trim() ?? '');
    const sanitizedRequestedRoom = sanitizeHTML(requested_room?.trim() ?? 'default') || 'default';

    // Validation
    if (!sanitizedTitle || !["นาย", "นางสาว", "นาง"].includes(sanitizedTitle)) {
      return NextResponse.json({ error: "กรุณาเลือกคำนำหน้า" }, { status: 400 });
    }
    if (!sanitizedFirstName) return NextResponse.json({ error: "กรุณากรอกชื่อ" }, { status: 400 });
    if (!sanitizedLastName) return NextResponse.json({ error: "กรุณากรอกนามสกุล" }, { status: 400 });
    if (!sanitizedStudentId) return NextResponse.json({ error: "กรุณากรอกรหัสนักศึกษา" }, { status: 400 });
    // รองรับ: ตัวเลขล้วน (8-13 หลัก) หรือรูปแบบ XXXXXXXXXXXX-X
    const idRegex = /^\d{8,13}$|^\d{9,12}-\d{1}$/;
    if (!idRegex.test(sanitizedStudentId)) {
      return NextResponse.json({ error: "รูปแบบรหัสนักศึกษาไม่ถูกต้อง เช่น 036650504008-4" }, { status: 400 });
    }
    const yearNum = parseInt(year ?? '');
    if (isNaN(yearNum) || yearNum < 1 || yearNum > 4) return NextResponse.json({ error: "กรุณาเลือกชั้นปี" }, { status: 400 });
    if (!sanitizedFaculty || !RMUTP_FACULTIES[sanitizedFaculty]) {
      return NextResponse.json({ error: "กรุณาเลือกคณะที่ถูกต้อง" }, { status: 400 });
    }
    if (!sanitizedBranch || !RMUTP_FACULTIES[sanitizedFaculty].includes(sanitizedBranch)) {
      return NextResponse.json({ error: "กรุณาเลือกสาขาที่ถูกต้อง" }, { status: 400 });
    }

    const pool = getPool();

    // Check duplicate student_id securely for intelligent re-entry / re-submission
    const [existing] = await pool.query(
      "SELECT * FROM students WHERE student_id = ?",
      [sanitizedStudentId]
    );
    const existingStudents = existing as StudentRow[];

    // Get client IP
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";

    // ─── Auto-Approve Verification ───
    const settings = await getSystemSettings();
    const autoApproveEnabled = settings.auto_approve_enabled === "1";
    const autoApproveStartTime = settings.auto_approve_start_time || "09:00";
    const autoApproveEndTime = settings.auto_approve_end_time || "16:00";
    const autoApproveDays = (settings.auto_approve_days || "1,2,3,4,5").split(",").map(Number);

    // Get current time in Bangkok (ICT, UTC+7) timezone
    const now = new Date();
    const localTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
    const currentDay = localTime.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const currentHour = localTime.getHours();
    const currentMin = localTime.getMinutes();
    const currentTimeStr = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;

    const isWorkingDay = autoApproveDays.includes(currentDay);
    const isWithinTimeRange = currentTimeStr >= autoApproveStartTime && currentTimeStr <= autoApproveEndTime;
    const shouldAutoApprove = autoApproveEnabled && isWorkingDay && isWithinTimeRange;

    if (existingStudents.length > 0) {
      const existingStudent = existingStudents[0];
      const newBypassToken = crypto.randomBytes(24).toString("hex");

      if (shouldAutoApprove) {
        // Auto-approve working hours: instant approval and door trigger!
        const esp32Result = await openDoor(existingStudent.student_id, sanitizedRequestedRoom);

        await pool.query(
          `UPDATE students 
           SET title = ?, first_name = ?, last_name = ?, year = ?, faculty = ?, branch = ?, status = 'approved', bypass_token = ?, rejection_reason = NULL, approved_by = NULL, approved_at = NOW(), last_door_open = NOW(), requested_room = ? 
           WHERE id = ?`,
          [sanitizedTitle, sanitizedFirstName, sanitizedLastName, yearNum, sanitizedFaculty, sanitizedBranch, newBypassToken, sanitizedRequestedRoom, existingStudent.id]
        );

        await pool.query(
          `INSERT INTO access_logs (student_id, action, notes, esp32_response) VALUES (?, ?, ?, ?)`,
          [
            existingStudent.id,
            esp32Result.success ? "door_opened" : "door_failed",
            "อนุมัติเข้าห้องและเปิดประตูอัตโนมัติในช่วงเวลาให้บริการ (Auto-Approve)",
            esp32Result.message
          ]
        );

        sendDiscordNotification(esp32Result.success ? "student_approved" : "door_failed", {
          studentName: `${sanitizedTitle}${sanitizedFirstName} ${sanitizedLastName}`,
          studentId: existingStudent.student_id,
          adminName: "ระบบอนุมัติอัตโนมัติ (Auto-Approve)",
          esp32Response: esp32Result.message,
        }).catch(() => {});

        return NextResponse.json({
          success: true,
          message: "ยินดีต้อนรับ! ระบบได้อนุมัติสิทธิ์เข้าห้องเรียนและสั่งเปิดประตูให้ท่านอัตโนมัติเรียบร้อยแล้ว",
          id: existingStudent.id,
          title: sanitizedTitle,
          first_name: sanitizedFirstName,
          last_name: sanitizedLastName,
          student_id: existingStudent.student_id,
          bypass_token: newBypassToken,
          status: "approved"
        }, { status: 200 });

      } else {
        // Outside working hours: reset to pending and wait for admin approval
        if (existingStudent.status === "pending") {
          return NextResponse.json({ error: "ข้อมูลของท่านอยู่ในขั้นตอนรอเจ้าหน้าที่ตรวจสอบสิทธิ์ กรุณาอย่าส่งคำขอซ้ำ" }, { status: 409 });
        }

        await pool.query(
          `UPDATE students 
           SET title = ?, first_name = ?, last_name = ?, year = ?, faculty = ?, branch = ?, status = 'pending', bypass_token = ?, rejection_reason = NULL, approved_by = NULL, approved_at = NULL, registered_at = NOW(), requested_room = ? 
           WHERE id = ?`,
          [sanitizedTitle, sanitizedFirstName, sanitizedLastName, yearNum, sanitizedFaculty, sanitizedBranch, newBypassToken, sanitizedRequestedRoom, existingStudent.id]
        );

        await pool.query(
          "INSERT INTO access_logs (student_id, action, notes) VALUES (?, 'registered', ?)",
          [existingStudent.id, `ส่งคำขอลงทะเบียนเข้าห้องอีกครั้ง นอกเวลาให้บริการอัตโนมัติ (จาก IP: ${ip})`]
        );

        sendDiscordNotification("student_registered", {
          studentName: `${sanitizedTitle} ${sanitizedFirstName} ${sanitizedLastName}`,
          studentId: existingStudent.student_id,
          faculty: sanitizedFaculty,
          branch: sanitizedBranch,
          year: yearNum,
        }).catch(() => {});

        return NextResponse.json({
          success: true,
          message: "ระบบได้รับคำขอลงทะเบียนของท่านแล้ว กรุณารอเจ้าหน้าที่ตรวจสอบความถูกต้องและอนุมัติเข้าห้อง",
          id: existingStudent.id,
          bypass_token: newBypassToken,
          status: "pending"
        }, { status: 200 });
      }
    }

    // Generate secure device bypass token
    const bypassToken = crypto.randomBytes(24).toString("hex");

    if (shouldAutoApprove) {
      // New student - within working hours: auto approve!
      const [result] = await pool.query(
        `INSERT INTO students (title, first_name, last_name, student_id, year, faculty, branch, status, ip_address, bypass_token, approved_at, last_door_open, requested_room)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'approved', ?, ?, NOW(), NOW(), ?)`,
        [sanitizedTitle, sanitizedFirstName, sanitizedLastName, sanitizedStudentId, yearNum, sanitizedFaculty, sanitizedBranch, ip, bypassToken, sanitizedRequestedRoom]
      );
      const insertId = (result as { insertId: number }).insertId;

      const esp32Result = await openDoor(sanitizedStudentId, sanitizedRequestedRoom);

      await pool.query(
        `INSERT INTO access_logs (student_id, action, notes, esp32_response) VALUES (?, ?, ?, ?)`,
        [
          insertId,
          esp32Result.success ? "door_opened" : "door_failed",
          "ลงทะเบียนสำเร็จและได้รับการอนุมัติเข้าห้องอัตโนมัติ (Auto-Approve)",
          esp32Result.message
        ]
      );

      sendDiscordNotification(esp32Result.success ? "student_approved" : "door_failed", {
        studentName: `${sanitizedTitle}${sanitizedFirstName} ${sanitizedLastName}`,
        studentId: sanitizedStudentId,
        adminName: "ระบบอนุมัติอัตโนมัติ (Auto-Approve)",
        esp32Response: esp32Result.message,
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        message: "ลงทะเบียนและอนุมัติสำเร็จ ประตูปลดล็อกแล้วในช่วงเวลาให้บริการอัตโนมัติ!",
        id: insertId,
        bypass_token: bypassToken,
        status: "approved"
      }, { status: 201 });

    } else {
      // New student - outside working hours: request pending normally
      const [result] = await pool.query(
        `INSERT INTO students (title, first_name, last_name, student_id, year, faculty, branch, status, ip_address, bypass_token, requested_room)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`,
        [sanitizedTitle, sanitizedFirstName, sanitizedLastName, sanitizedStudentId, yearNum, sanitizedFaculty, sanitizedBranch, ip, bypassToken, sanitizedRequestedRoom]
      );
      const insertId = (result as { insertId: number }).insertId;

      await pool.query(
        "INSERT INTO access_logs (student_id, action, notes) VALUES (?, 'registered', ?)",
        [insertId, `ลงทะเบียนนอกช่วงเวลาบริการจาก IP: ${ip} (รออนุมัติปกติ)`]
      );

      sendDiscordNotification("student_registered", {
        studentName: `${sanitizedTitle} ${sanitizedFirstName} ${sanitizedLastName}`,
        studentId: sanitizedStudentId,
        faculty: sanitizedFaculty,
        branch: sanitizedBranch,
        year: yearNum,
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        message: "ลงทะเบียนสำเร็จเรียบร้อยแล้ว กรุณารอผู้ดูแลระบบตรวจสอบและทำการอนุมัติ",
        id: insertId,
        bypass_token: bypassToken,
        status: "pending"
      }, { status: 201 });
    }
  } catch (error) {
    console.error("[Students] POST error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในระบบ" }, { status: 500 });
  }
}

