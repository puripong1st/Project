// app/api/students/pending/route.ts — GET pending students (both roles can see)
import { NextResponse } from "next/server";
import { getPool, initDatabase } from "@/lib/db";
import { getAdminFromCookie } from "@/lib/auth";

let initialized = false;
async function ensureInit() {
  if (!initialized) {
    await initDatabase();
    initialized = true;
  }
}

export async function GET() {
  try {
    await ensureInit();
    const admin = await getAdminFromCookie();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const pool = getPool();
    const { rows } = await pool.query(
      `SELECT id, first_name, last_name, student_id, year, faculty, branch, status, registered_at, ip_address, requested_room
       FROM students WHERE status = 'pending' ORDER BY registered_at DESC`
    );
    return NextResponse.json({ students: rows });
  } catch (error) {
    console.error("[Students/Pending] error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
