// app/api/students/route.ts — GET list + POST register
import { NextRequest, NextResponse } from "next/server";
import { getPool, initDatabase, StudentRow, getSystemSettings } from "@/lib/db";
import { getAdminFromCookie } from "@/lib/auth";
import { sendDiscordNotification } from "@/lib/discord";
import { RMUTP_FACULTIES } from "@/lib/faculties";
import { openDoor } from "@/lib/esp32";
import { consumeOfflineGrant, consumeQRToken } from "@/lib/qr";
import { rateLimit } from "@/lib/rate-limit";
import crypto from "crypto";
import { getClientIp } from "@/lib/client-ip";
import DOMPurify from "isomorphic-dompurify";

let initialized = false;
async function ensureInit() {
  if (!initialized) {
    await initDatabase();
    initialized = true;
  }
}

function runBackground(task: Promise<unknown>, label: string): void {
  task.catch((err) => console.error(`[Students] Background ${label} failed:`, err));
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
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "300", 10) || 300, 1), 500);

    const pool = getPool();
    let query = `
      SELECT s.*, a.full_name as approver_name
      FROM students s
      LEFT JOIN admin_users a ON s.approved_by = a.id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    let paramIndex = 1;
    if (status && status !== "all") {
      query += ` AND s.status = $${paramIndex++}`;
      params.push(status);
    }
    if (faculty) {
      query += ` AND s.faculty = $${paramIndex++}`;
      params.push(faculty);
    }
    if (search) {
      const p1 = paramIndex++;
      const p2 = paramIndex++;
      const p3 = paramIndex++;
      query += ` AND (s.first_name ILIKE $${p1} OR s.last_name ILIKE $${p2} OR s.student_id ILIKE $${p3})`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    query += ` ORDER BY s.registered_at DESC LIMIT $${paramIndex++}`;
    params.push(limit);

    const { rows } = await pool.query(query, params);
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

    // Extract client IP securely
    const ip = getClientIp(req);

    // Durable Rate Limit (Vercel/Serverless friendly): 5 attempts per IP per minute
    const rateLimitResult = await rateLimit({
      key: `register:${ip}`,
      limit: 5,
      windowMs: 60 * 1000,
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: "คุณส่งคำขอลงทะเบียนมากเกินไป กรุณาลองใหม่ในอีก 1 นาที" },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { title, first_name, last_name, student_id, year, faculty, branch, requested_room, token, offline_id, offline_created_at, offline_grant } = body;
    const offlineId = typeof offline_id === "string" ? offline_id.trim().slice(0, 80) : "";
    const offlineCreatedAt = typeof offline_created_at === "string" ? offline_created_at : "";
    const isOfflineReplay = !!offlineId && !!offlineCreatedAt;

    // Sanitize input to prevent XSS
    const sanitizeHTML = (input: string): string => {
      return DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
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

    // ─── [Dynamic QR Single-Use Verification] ───
    // ตรวจสอบและ Consume Token ทันทีเสี้ยววินาทีที่ยื่นฟอร์มสมัคร 
    // หาก Token นี้ไม่มีในระบบ, หมดอายุ (เกิน 60s), หรือเคยถูกใช้งาน (Consume) ไปแล้ว ให้ปฏิเสธการลงทะเบียนทันที!
    // สิ่งนี้ช่วยป้องกันการแชร์ลิงก์ให้คนอื่นไปกดสมัครต่อ หรือการเปิดลิงก์เดิมลงทะเบียนซ้ำได้อย่างเด็ดขาด 100%!
    const isTokenValid = isOfflineReplay
      ? await consumeOfflineGrant(typeof offline_grant === "string" ? offline_grant : "", sanitizedRequestedRoom)
      : await consumeQRToken(token || "", sanitizedRequestedRoom);
    if (!isTokenValid) {
      return NextResponse.json(
        { error: "ลิงก์สแกน QR Code นี้หมดอายุแล้วหรือถูกใช้งานโดยผู้อื่นไปแล้ว กรุณาสแกน QR Code ใหม่อีกครั้งที่หน้าห้องปฏิบัติการ" },
        { status: 403 }
      );
    }

    const pool = getPool();

    if (isOfflineReplay) {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS offline_submissions (
          offline_id VARCHAR(80) PRIMARY KEY,
          student_id VARCHAR(30) NOT NULL,
          requested_room VARCHAR(50) NOT NULL DEFAULT 'default',
          received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          client_created_at TIMESTAMP,
          status VARCHAR(20) NOT NULL DEFAULT 'accepted'
        )
      `);
      const { rows: duplicateOfflineRows } = await pool.query(
        "SELECT offline_id FROM offline_submissions WHERE offline_id = $1 LIMIT 1",
        [offlineId]
      );
      if (duplicateOfflineRows.length > 0) {
        return NextResponse.json({
          success: true,
          duplicate: true,
          message: "Offline submission was already synchronized.",
          status: "pending",
        }, { status: 200 });
      }
    }

    // Check duplicate student_id securely for intelligent re-entry / re-submission
    const { rows: existing } = await pool.query(
      "SELECT id, status, student_id FROM students WHERE student_id = $1 LIMIT 1",
      [sanitizedStudentId]
    );
    const existingStudents = existing as StudentRow[];

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
    const shouldAutoApprove = !isOfflineReplay && autoApproveEnabled && isWorkingDay && isWithinTimeRange;

    const recordOfflineSubmission = async (status: string) => {
      if (!isOfflineReplay) return;
      await pool.query(
        `INSERT INTO offline_submissions (offline_id, student_id, requested_room, client_created_at, status)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (offline_id) DO NOTHING`,
        [offlineId, sanitizedStudentId, sanitizedRequestedRoom, new Date(offlineCreatedAt), status]
      );
    };

    if (existingStudents.length > 0) {
      const existingStudent = existingStudents[0];
      const newBypassToken = crypto.randomBytes(24).toString("hex");

      if (shouldAutoApprove) {
        // Auto-approve working hours: instant approval and door trigger!
        const esp32Result = await openDoor(existingStudent.student_id, sanitizedRequestedRoom);

        await pool.query(
          `UPDATE students 
           SET title = $1, first_name = $2, last_name = $3, year = $4, faculty = $5, branch = $6, status = 'approved', bypass_token = $7, rejection_reason = NULL, approved_by = NULL, approved_at = CURRENT_TIMESTAMP, last_door_open = CURRENT_TIMESTAMP, requested_room = $8 
           WHERE id = $9`,
          [sanitizedTitle, sanitizedFirstName, sanitizedLastName, yearNum, sanitizedFaculty, sanitizedBranch, newBypassToken, sanitizedRequestedRoom, existingStudent.id]
        );

        runBackground(pool.query(
          `INSERT INTO access_logs (student_id, action, notes, esp32_response, room_code) VALUES ($1, $2, $3, $4, $5)`,
          [
            existingStudent.id,
            esp32Result.success ? "door_opened" : "door_failed",
            "อนุมัติเข้าห้องและเปิดประตูอัตโนมัติในช่วงเวลาให้บริการ (Auto-Approve)",
            esp32Result.message,
            sanitizedRequestedRoom
          ]
        ), "auto-approve existing access log");

        sendDiscordNotification(esp32Result.success ? "student_approved" : "door_failed", {
          studentName: `${sanitizedTitle}${sanitizedFirstName} ${sanitizedLastName}`,
          studentId: existingStudent.student_id,
          adminName: "ระบบอนุมัติอัตโนมัติ (Auto-Approve)",
          esp32Response: esp32Result.message,
          room: sanitizedRequestedRoom,
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
          await recordOfflineSubmission("pending");
          if (isOfflineReplay) {
            return NextResponse.json({
              success: true,
              message: "Offline submission synchronized; request is pending admin approval.",
              id: existingStudent.id,
              status: "pending",
            }, { status: 200 });
          }
          return NextResponse.json({ error: "ข้อมูลของท่านอยู่ในขั้นตอนรอเจ้าหน้าที่ตรวจสอบสิทธิ์ กรุณาอย่าส่งคำขอซ้ำ" }, { status: 409 });
        }

        await pool.query(
          `UPDATE students 
           SET title = $1, first_name = $2, last_name = $3, year = $4, faculty = $5, branch = $6, status = 'pending', bypass_token = $7, rejection_reason = NULL, approved_by = NULL, approved_at = NULL, registered_at = CURRENT_TIMESTAMP, requested_room = $8 
           WHERE id = $9`,
          [sanitizedTitle, sanitizedFirstName, sanitizedLastName, yearNum, sanitizedFaculty, sanitizedBranch, newBypassToken, sanitizedRequestedRoom, existingStudent.id]
        );
        await recordOfflineSubmission("pending");

        runBackground(pool.query(
          "INSERT INTO access_logs (student_id, action, notes, room_code) VALUES ($1, 'registered', $2, $3)",
          [existingStudent.id, `ส่งคำขอลงทะเบียนเข้าห้องอีกครั้ง นอกเวลาให้บริการอัตโนมัติ (จาก IP: ${ip})`, sanitizedRequestedRoom]
        ), "pending existing access log");

        sendDiscordNotification("student_registered", {
          studentName: `${sanitizedTitle} ${sanitizedFirstName} ${sanitizedLastName}`,
          studentId: existingStudent.student_id,
          faculty: sanitizedFaculty,
          branch: sanitizedBranch,
          year: yearNum,
          room: sanitizedRequestedRoom,
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
      const { rows: result } = await pool.query(
        `INSERT INTO students (title, first_name, last_name, student_id, year, faculty, branch, status, ip_address, bypass_token, approved_at, last_door_open, requested_room)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'approved', $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, $10) RETURNING id`,
        [sanitizedTitle, sanitizedFirstName, sanitizedLastName, sanitizedStudentId, yearNum, sanitizedFaculty, sanitizedBranch, ip, bypassToken, sanitizedRequestedRoom]
      );
      const insertId = result[0].id;

      const esp32Result = await openDoor(sanitizedStudentId, sanitizedRequestedRoom);

      runBackground(pool.query(
        `INSERT INTO access_logs (student_id, action, notes, esp32_response, room_code) VALUES ($1, $2, $3, $4, $5)`,
        [
          insertId,
          esp32Result.success ? "door_opened" : "door_failed",
          "ลงทะเบียนสำเร็จและได้รับการอนุมัติเข้าห้องอัตโนมัติ (Auto-Approve)",
          esp32Result.message,
          sanitizedRequestedRoom
        ]
      ), "auto-approve new access log");

      sendDiscordNotification(esp32Result.success ? "student_approved" : "door_failed", {
        studentName: `${sanitizedTitle}${sanitizedFirstName} ${sanitizedLastName}`,
        studentId: sanitizedStudentId,
        adminName: "ระบบอนุมัติอัตโนมัติ (Auto-Approve)",
        esp32Response: esp32Result.message,
        room: sanitizedRequestedRoom,
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
      const { rows: result } = await pool.query(
        `INSERT INTO students (title, first_name, last_name, student_id, year, faculty, branch, status, ip_address, bypass_token, requested_room)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8, $9, $10) RETURNING id`,
        [sanitizedTitle, sanitizedFirstName, sanitizedLastName, sanitizedStudentId, yearNum, sanitizedFaculty, sanitizedBranch, ip, bypassToken, sanitizedRequestedRoom]
      );
      const insertId = result[0].id;
      await recordOfflineSubmission("pending");

      runBackground(pool.query(
        "INSERT INTO access_logs (student_id, action, notes, room_code) VALUES ($1, 'registered', $2, $3)",
        [insertId, `ลงทะเบียนนอกช่วงเวลาบริการจาก IP: ${ip} (รออนุมัติปกติ)`, sanitizedRequestedRoom]
      ), "pending new access log");

      sendDiscordNotification("student_registered", {
        studentName: `${sanitizedTitle} ${sanitizedFirstName} ${sanitizedLastName}`,
        studentId: sanitizedStudentId,
        faculty: sanitizedFaculty,
        branch: sanitizedBranch,
        year: yearNum,
        room: sanitizedRequestedRoom,
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

