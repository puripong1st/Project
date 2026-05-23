// app/api/students/[id]/route.ts — GET single + DELETE
import { NextRequest, NextResponse } from "next/server";
import { getPool, initDatabase, StudentRow } from "@/lib/db";
import { getAdminFromCookie } from "@/lib/auth";

let initialized = false;
async function ensureInit() {
  if (!initialized) {
    await initDatabase();
    initialized = true;
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await ensureInit();
    const { id } = await params;
    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT s.*, a.full_name as approver_name FROM students s
       LEFT JOIN admin_users a ON s.approved_by = a.id
       WHERE s.id = ?`,
      [parseInt(id)]
    );
    const students = rows as StudentRow[];
    if (students.length === 0) {
      return NextResponse.json({ error: "ไม่พบข้อมูลนักศึกษา" }, { status: 404 });
    }
    return NextResponse.json({ student: students[0] });
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
    const pool = getPool();
    await pool.query("DELETE FROM access_logs WHERE student_id = ?", [parseInt(id)]);
    await pool.query("DELETE FROM students WHERE id = ?", [parseInt(id)]);
    return NextResponse.json({ success: true, message: "ลบข้อมูลสำเร็จ" });
  } catch {
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
