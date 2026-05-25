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
    const rawLimit = parseInt(searchParams.get("limit") || "100");
    const limit = isNaN(rawLimit) ? 100 : Math.min(Math.max(rawLimit, 1), 500);
    const room = searchParams.get("room") || "";

    const pool = getPool();
    let query = `SELECT al.*, 
        CONCAT(s.first_name, ' ', s.last_name) as student_name,
        s.student_id as student_code,
        s.requested_room as requested_room,
        a.full_name as admin_name
       FROM access_logs al
       LEFT JOIN students s ON al.student_id = s.id
       LEFT JOIN admin_users a ON al.performed_by = a.id`;
    
    const params: any[] = [];
    let paramIndex = 1;
    if (room && room !== "all") {
      query += ` WHERE al.room_code = $${paramIndex++}`;
      params.push(room);
    }
    
    query += ` ORDER BY al.timestamp DESC LIMIT $${paramIndex++}`;
    params.push(limit);

    const { rows } = await pool.query(query, params);
    return NextResponse.json({ logs: rows });
  } catch (error) {
    console.error("[Logs API Error]", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
