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
    if (admin.role !== "owner" && admin.role !== "door_operator") {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const pool = getPool();
    let query = `SELECT id, first_name, last_name, student_id, year, faculty, branch, status, registered_at, ip_address, requested_room
       FROM students WHERE status = 'pending'`;
    const params: any[] = [];

    if (admin.role === "door_operator" && admin.allowed_rooms) {
      const allowedRooms = admin.allowed_rooms.split(",").map((r) => r.trim());
      if (!allowedRooms.includes("*")) {
        query += ` AND requested_room = ANY($1::varchar[])`;
        params.push(allowedRooms);
      }
    }

    query += ` ORDER BY registered_at DESC`;

    const { rows } = await pool.query(query, params);
    
    const sanitized = rows.map((s: any) => {
      if (admin.role !== 'owner') {
        const { ip_address, ...rest } = s;
        return rest;
      }
      return s;
    });
    
    return NextResponse.json({ students: sanitized });
  } catch (error) {
    console.error("[Students/Pending] error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
