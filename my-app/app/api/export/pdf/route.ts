// app/api/export/pdf/route.ts — Export students or single student as PDF
import { NextRequest, NextResponse } from "next/server";
import { getPool, initDatabase, StudentRow } from "@/lib/db";
import { getAdminFromCookie } from "@/lib/auth";
import { withRateLimit } from "@/lib/rate-limit-middleware";
import { generateStudentsPDF, generateSingleStudentPDF } from "@/lib/pdf";
import { getClientIp } from "@/lib/client-ip";

let initialized = false;
async function ensureInit() {
  if (!initialized) {
    await initDatabase();
    initialized = true;
  }
}

export async function GET(req: NextRequest) {
  try {
    await ensureInit();
    const rateLimitRes = await withRateLimit(req, "export_pdf", 5, 60);
    if (!rateLimitRes.allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }
    const admin = await getAdminFromCookie();
    if (!admin) {
      return NextResponse.json({ error: "กรุณาเข้าสู่ระบบก่อนดำเนินการ" }, { status: 401 });
    }
    if (admin.role !== "owner" && admin.role !== "log_viewer") {
      return NextResponse.json({ error: "สิทธิ์การเข้าถึงไม่เพียงพอ" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const idParam = searchParams.get("id");
    const filter = searchParams.get("filter") || "all";
    
    // New Date Range parameters
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const pool = getPool();
    const now = new Date();
    const formattedDate = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, "0")}${now.getDate().toString().padStart(2, "0")}`;

    if (idParam) {
      // ─── Export Single Student Detailed Card ───────────────────────────
      const { rows } = await pool.query(
        `SELECT s.*, a.full_name as approver_name
         FROM students s
         LEFT JOIN admin_users a ON s.approved_by = a.id
         WHERE s.id = $1`,
        [idParam]
      );

      const students = rows as StudentRow[];
      if (students.length === 0) {
        return NextResponse.json({ error: "ไม่พบข้อมูลนักศึกษาที่ระบุ" }, { status: 404 });
      }

      const student = students[0];

      if (admin.role === "log_viewer") {
        const allowed = admin.allowed_rooms && (admin.allowed_rooms.split(",").includes("*") || admin.allowed_rooms.split(",").includes(student.requested_room));
        if (!allowed) {
          return NextResponse.json({ error: "ไม่มีสิทธิ์ดาวน์โหลดข้อมูลของห้องนี้" }, { status: 403 });
        }
      }

      const pdfBuffer = await generateSingleStudentPDF(student, admin.full_name);

      await pool.query(
        "INSERT INTO access_logs (student_id, action, performed_by, notes) VALUES ($1, 'export_pdf', $2, $3)",
        [
          student.id,
          admin.id,
          `ส่งออกรายงาน PDF ประวัติรายบุคคล: ${student.title}${student.first_name} ${student.last_name} (${student.student_id})`
        ]
      );

      const ip = getClientIp(req);
      await pool.query(
        `INSERT INTO access_logs (student_id, action, room, method, ip_address, details)
         VALUES (NULL, 'PDF_EXPORT', 'ALL', 'admin', $1, $2)`,
        [
          ip,
          JSON.stringify({
            admin_id: admin.id,
            admin_name: admin.full_name,
            record_count: students.length,
            filters: { filter, startDate, endDate }
          })
        ]
      );

      const cleanName = `${student.first_name}_${student.last_name}`.replace(/\s+/g, "_");
      const filename = `student_card_${student.student_id}_${cleanName}_${formattedDate}.pdf`;

      return new NextResponse(pdfBuffer as unknown as BodyInit, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
          "Content-Length": pdfBuffer.length.toString(),
        },
      });
    } else {
      // ─── Export Student List with Date Range Filters ───────────────────
      let query = `
        SELECT s.*, a.full_name as approver_name
        FROM students s
        LEFT JOIN admin_users a ON s.approved_by = a.id
        WHERE 1=1
      `;
      const params: any[] = [];
      let paramIndex = 1;

      if (admin.role === "log_viewer") {
        if (!admin.allowed_rooms) {
          return NextResponse.json({ error: "ไม่มีสิทธิ์ดาวน์โหลดข้อมูล" }, { status: 403 });
        }
        const allowedRooms = admin.allowed_rooms.split(",").map((r) => r.trim());
        if (!allowedRooms.includes("*")) {
          query += ` AND s.requested_room = ANY($${paramIndex++}::varchar[])`;
          params.push(allowedRooms);
        }
      }
      
      if (filter !== "all") {
        query += ` AND s.status = $${paramIndex++}`;
        params.push(filter);
      }

      if (startDate) {
        query += ` AND s.registered_at >= $${paramIndex++}`;
        params.push(`${startDate} 00:00:00`);
      }

      if (endDate) {
        query += ` AND s.registered_at <= $${paramIndex++}`;
        params.push(`${endDate} 23:59:59`);
      }

      query += " ORDER BY s.registered_at DESC";

      const { rows } = await pool.query(query, params);
      const students = rows as StudentRow[];

      const pdfBuffer = await generateStudentsPDF(students, admin.full_name, filter, startDate || undefined, endDate || undefined);

      await pool.query(
        "INSERT INTO access_logs (student_id, action, performed_by, notes) VALUES (NULL, 'export_pdf', $1, $2)",
        [
          admin.id,
          `ส่งออกรายงาน PDF แบบรายชื่อรวม: filter=${filter} ช่วงเวลา=${startDate || "เริ่มต้น"} ถึง ${endDate || "ปัจจุบัน"} จำนวน ${students.length} รายการ`
        ]
      );

      const ip = getClientIp(req);
      await pool.query(
        `INSERT INTO access_logs (student_id, action, room, method, ip_address, details)
         VALUES (NULL, 'PDF_EXPORT', 'ALL', 'admin', $1, $2)`,
        [
          ip,
          JSON.stringify({
            admin_id: admin.id,
            admin_name: admin.full_name,
            record_count: students.length,
            filters: { filter, startDate, endDate }
          })
        ]
      );

      const filename = `smartaccess_students_report_${filter}_${formattedDate}.pdf`;

      return new NextResponse(pdfBuffer as unknown as BodyInit, {
        status: 200,
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}"`,
          "Content-Length": pdfBuffer.length.toString(),
        },
      });
    }
  } catch (error) {
    console.error("[PDF Export API] error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการสร้างไฟล์ PDF" }, { status: 500 });
  }
}
