// app/api/esp32/display/route.ts — JSON display state for ESP32 polling
import { NextRequest, NextResponse } from "next/server";
import { initDatabase, getPool } from "@/lib/db";
import { getOrCreateActiveQRToken } from "@/lib/qr";

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
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const { searchParams } = new URL(req.url);
    const room = (searchParams.get("room") || "default").trim();

    const pool = getPool();

    // ─── [IoT Cloud Polling command check] ───
    // ตรวจสอบว่าแอดมินพึ่งกดยอมรับอนุมัติเปิดประตูสำหรับห้องนี้หรือไม่
    let doorTrigger = "idle";
    const [settingRows] = await pool.query(
      "SELECT setting_value FROM system_settings WHERE setting_key = ?",
      [`room_cmd_${room}`]
    );
    const settings = settingRows as { setting_value: string }[];
    if (settings.length > 0 && settings[0].setting_value === "unlock") {
      doorTrigger = "open";
      // ทำการล้างสถานะในทันที (Consume) เพื่อป้องกันการเปิดซ้ำซ้อนใน Polling รอบถัดไป
      await pool.query(
        "UPDATE system_settings SET setting_value = 'consumed', updated_at = NOW() WHERE setting_key = ?",
        [`room_cmd_${room}`]
      );
      console.log(`[IoT Cloud API] Command 'unlock' consumed by device for room: ${room}`);
    }

    // Count pending students for this specific room
    const [pendingRows] = await pool.query(
      "SELECT COUNT(*) as count FROM students WHERE status = 'pending' AND requested_room = ?",
      [room]
    );
    const pendingCount = (pendingRows as { count: number }[])[0].count;

    // Get last approved student for this specific room
    const [lastApproved] = await pool.query(
      `SELECT CONCAT(first_name, ' ', last_name) as name, student_id, approved_at
       FROM students WHERE status = 'approved' AND approved_at IS NOT NULL AND requested_room = ?
       ORDER BY approved_at DESC LIMIT 1`,
      [room]
    );

    const lastStudent = (lastApproved as { name: string; student_id: string; approved_at: Date }[])[0];

    const activeToken = await getOrCreateActiveQRToken();

    // Only expose the active_token if the caller authenticates with ESP32 API key
    const esp32ApiKey = process.env.ESP32_API_KEY || "rmutp_secure_door_unlock_token_2026";
    const callerKey = req.headers.get("x-api-key") || "";
    const isAuthenticatedDevice = callerKey === esp32ApiKey;

    let activeTokenVal: string | undefined;
    if (isAuthenticatedDevice) {
      activeTokenVal = activeToken;
    }

    return NextResponse.json(
      {
        // Display info for ESP32
        title: "RMUTP Door Access",
        subtitle: "มหาวิทยาลัยเทคโนโลยีราชมงคลพระนคร",
        ...(isAuthenticatedDevice && { active_token: activeTokenVal }),
        qr_url: `${appUrl}/api/esp32/qr?room=${room}`,
        register_url: `${appUrl}/?room=${room}`,
        pending_count: pendingCount,
        last_approved: lastStudent
          ? {
              name: lastStudent.name,
              student_id: lastStudent.student_id,
              time: lastStudent.approved_at,
            }
          : null,
        server_time: new Date().toISOString(),
        status: "online",
        door_trigger: doorTrigger,
        requested_room: room,
        // Display dimensions hint for LAFVIN 3.2" (320x240)
        display: {
          width: 320,
          height: 240,
          orientation: "landscape",
          color_theme: {
            bg: "#000000",
            primary: "#4CAF50",
            secondary: "#FFD700",
            text: "#FFFFFF",
            error: "#F44336",
          },
        },
      },
      {
        headers: {
          "Cache-Control": "no-store",
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("[ESP32/Display] error:", error);
    return NextResponse.json(
      { status: "error", message: "Server error", server_time: new Date().toISOString() },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
}

// ESP32 can POST its status here
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("[ESP32] Status update received:", body);
    return NextResponse.json(
      { received: true, server_time: new Date().toISOString() },
      { headers: { "Access-Control-Allow-Origin": "*" } }
    );
  } catch {
    return NextResponse.json({ received: false }, { status: 400 });
  }
}
