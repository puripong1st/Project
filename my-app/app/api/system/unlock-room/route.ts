// app/api/system/unlock-room/route.ts — Remote unlock classroom door (admin only)
import { NextRequest, NextResponse } from "next/server";
import { getPool, initDatabase } from "@/lib/db";
import { getAdminFromCookie, canOperateRoom } from "@/lib/auth";
import { withRateLimit } from "@/lib/rate-limit-middleware";
import { openDoor } from "@/lib/esp32";
import { sendDiscordNotification } from "@/lib/discord";

let initialized = false;
async function ensureInit() {
  if (!initialized) {
    await initDatabase();
    initialized = true;
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureInit();
    const rateLimitRes = await withRateLimit(req, "unlock-room", 10, 60);
    if (!rateLimitRes.allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const admin = await getAdminFromCookie();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const room = typeof body.room === "string" ? body.room.trim() : "";
    if (!room) return NextResponse.json({ error: "กรุณาระบุรหัสห้องเรียน" }, { status: 400 });

    if (!canOperateRoom(admin, room)) {
      return NextResponse.json({ error: "ไม่มีสิทธิ์ควบคุมห้องนี้" }, { status: 403 });
    }

    // Call openDoor for the specific room (with SYSTEM indicator to signal manual bypass)
    const esp32Result = await openDoor("SYSTEM_BYPASS", room);

    // Insert to log
    const pool = getPool();
    await pool.query(
      `INSERT INTO access_logs (student_id, action, performed_by, esp32_response, notes, room_code) VALUES (NULL, $1, $2, $3, $4, $5)`,
      [
        esp32Result.success ? "door_opened" : "door_failed", 
        admin.id, 
        esp32Result.message, 
        `แอดมินปลดล็อกด่วนระยะไกลโดย: ${admin.full_name}`, 
        room
      ]
    );

    sendDiscordNotification(esp32Result.success ? "door_opened" : "door_failed", {
      studentName: `ปลดล็อกระยะไกล (แอดมิน)`,
      studentId: "SYSTEM",
      adminName: admin.full_name,
      esp32Response: esp32Result.message,
      room: room,
    }).catch(() => {});

    return NextResponse.json({ success: esp32Result.success, message: esp32Result.message });
  } catch (error) {
    console.error("[Unlock Room] error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการปลดล็อกห้องเรียน" }, { status: 500 });
  }
}
