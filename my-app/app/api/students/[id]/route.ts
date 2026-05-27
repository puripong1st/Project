// app/api/students/[id]/route.ts — GET single + DELETE
import { NextRequest, NextResponse } from "next/server";
import { getPool, initDatabase, StudentRow } from "@/lib/db";
import { getAdminFromCookie } from "@/lib/auth";
import { sweepExpiredPending } from "@/lib/auto-reject";

let initialized = false;
async function ensureInit() {
  if (!initialized) {
    await initDatabase();
    initialized = true;
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureInit();
    // Try to retrieve admin context (if available)
    const admin = await getAdminFromCookie();

    const { id } = await params;
    const numId = parseInt(id);
    if (isNaN(numId)) {
      return NextResponse.json({ error: "ID นักศึกษาต้องเป็นตัวเลข" }, { status: 400 });
    }

    await sweepExpiredPending();

    const pool = getPool();
    const { rows } = await pool.query(
      `SELECT s.*, a.full_name as approver_name FROM students s
       LEFT JOIN admin_users a ON s.approved_by = a.id
       WHERE s.id = $1`,
      [numId]
    );
    const students = rows as StudentRow[];
    if (students.length === 0) {
      return NextResponse.json({ error: "ไม่พบข้อมูลนักศึกษา" }, { status: 404 });
    }

    const student = students[0];

    // ─── Data Privacy Filtering ───
    if (admin) {
      // 1. If admin is logged in
      if (admin.role !== "owner") {
        // Door Operator: strip sensitive fields to prevent IDOR data leakage
        const safeStudent = Object.fromEntries(
          Object.entries(student).filter(([key]) => key !== "ip_address" && key !== "bypass_token")
        );
        return NextResponse.json({ student: safeStudent });
      }
      // Owner: return full record
      return NextResponse.json({ student });
    } else {
      // 2. If student is polling publicly to see their status:
      // Bypassing/checking token parameter to prevent IDOR (Insecure Direct Object Reference)
      const { searchParams } = new URL(req.url);
      const clientToken = searchParams.get("token");

      if (!clientToken || clientToken !== student.bypass_token) {
        return NextResponse.json(
          { error: "ไม่ได้รับอนุญาตให้ดึงข้อมูลส่วนตัวของนักศึกษารหัสนี้" },
          { status: 401 }
        );
      }

      // Strip critical secrets (bypass_token, ip_address) to prevent hijacking
      const safePublicStudent = {
        id: student.id,
        title: student.title,
        first_name: student.first_name,
        last_name: student.last_name,
        student_id: student.student_id,
        year: student.year,
        faculty: student.faculty,
        branch: student.branch,
        status: student.status,
        rejection_reason: student.rejection_reason,
        registered_at: student.registered_at,
        last_door_open: student.last_door_open,
      };
      return NextResponse.json({ student: safePublicStudent });
    }
  } catch {
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureInit();
    const admin = await getAdminFromCookie();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (admin.role !== "owner") return NextResponse.json({ error: "Permission denied" }, { status: 403 });

    const { id } = await params;
    const numId = parseInt(id, 10);
    if (isNaN(numId)) {
      return NextResponse.json({ error: "ID นักศึกษาต้องเป็นตัวเลข" }, { status: 400 });
    }
    const pool = getPool();
    // Legal Compliance (Computer Crime Act): Do NOT delete access logs. 
    // The database will automatically set student_id to NULL via ON DELETE SET NULL, 
    // retaining the crucial audit logs/traffic trails for at least 90 days.
    await pool.query("DELETE FROM students WHERE id = $1", [numId]);
    return NextResponse.json({ success: true, message: "ลบข้อมูลสำเร็จ" });
  } catch {
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
