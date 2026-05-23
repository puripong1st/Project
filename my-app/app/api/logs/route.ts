// app/api/logs/route.ts — Access logs
import { NextRequest, NextResponse } from "next/server";
import { getPool, initDatabase } from "@/lib/db";
import { getAdminFromCookie } from "@/lib/auth";

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
    const admin = await getAdminFromCookie();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (admin.role !== "owner") return NextResponse.json({ error: "Permission denied" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "100");

    const pool = getPool();
    const [rows] = await pool.query(
      `SELECT al.*, 
        CONCAT(s.first_name, ' ', s.last_name) as student_name,
        s.student_id as student_code,
        a.full_name as admin_name
       FROM access_logs al
       LEFT JOIN students s ON al.student_id = s.id
       LEFT JOIN admin_users a ON al.performed_by = a.id
       ORDER BY al.timestamp DESC
       LIMIT ?`,
      [limit]
    );
    return NextResponse.json({ logs: rows });
  } catch (error) {
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
