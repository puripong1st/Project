// app/api/system/schedule/route.ts — Room schedule CRUD (owner only)
import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getAdminFromCookie } from "@/lib/auth";

let tableEnsured = false;
async function ensureTable() {
  if (tableEnsured) return;
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS room_schedules (
      id SERIAL PRIMARY KEY,
      room_code VARCHAR(50) NOT NULL,
      day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
      open_time TIME NOT NULL,
      close_time TIME NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      created_by INT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (room_code, day_of_week)
    )
  `);
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_schedule_room
      ON room_schedules (room_code, day_of_week, is_active)
  `);
  tableEnsured = true;
}

export async function GET(req: NextRequest) {
  await ensureTable();
  const admin = await getAdminFromCookie();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const room = searchParams.get("room") || "";

  const pool = getPool();
  const { rows } = await pool.query(
    `SELECT * FROM room_schedules ${room ? "WHERE room_code = $1" : ""} ORDER BY room_code, day_of_week`,
    room ? [room] : []
  );
  return NextResponse.json({ schedules: rows });
}

export async function POST(req: NextRequest) {
  await ensureTable();
  const admin = await getAdminFromCookie();
  if (!admin || admin.role !== "owner")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { room_code, day_of_week, open_time, close_time, is_active } = body;

  if (!room_code || day_of_week == null || !open_time || !close_time)
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

  const dow = parseInt(day_of_week);
  if (isNaN(dow) || dow < 0 || dow > 6)
    return NextResponse.json({ error: "Invalid day_of_week" }, { status: 400 });

  const pool = getPool();
  const { rows } = await pool.query(
    `INSERT INTO room_schedules (room_code, day_of_week, open_time, close_time, is_active, created_by, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)
     ON CONFLICT (room_code, day_of_week) DO UPDATE
       SET open_time = EXCLUDED.open_time,
           close_time = EXCLUDED.close_time,
           is_active = EXCLUDED.is_active,
           updated_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [room_code.trim(), dow, open_time, close_time, is_active !== false, admin.id]
  );
  return NextResponse.json({ schedule: rows[0] });
}

export async function DELETE(req: NextRequest) {
  await ensureTable();
  const admin = await getAdminFromCookie();
  if (!admin || admin.role !== "owner")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = parseInt(searchParams.get("id") || "");
  if (isNaN(id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

  const pool = getPool();
  await pool.query("DELETE FROM room_schedules WHERE id = $1", [id]);
  return NextResponse.json({ deleted: true });
}
