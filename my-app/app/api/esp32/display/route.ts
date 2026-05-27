// app/api/esp32/display/route.ts — JSON display state for ESP32 polling
// OPTIMIZED: All independent DB queries run in parallel with Promise.all
import { NextRequest, NextResponse } from "next/server";
import { initDatabase, getPool } from "@/lib/db";
import { getOrCreateActiveQRToken } from "@/lib/qr";
import { getAdminFromCookie } from "@/lib/auth";
import { withRateLimit } from "@/lib/rate-limit-middleware";

// Restrict CORS to the configured app origin only — never open wildcard in production
const ALLOWED_ORIGIN = (process.env.NEXT_PUBLIC_APP_URL || "https://project-sigma-ivory-21.vercel.app").replace(/\/$/, "");

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-api-key",
  "Vary": "Origin",
} as const;

let initialized = false;
async function ensureInit() {
  if (!initialized) {
    await initDatabase();
    initialized = true;
  }
}

// ─── OPTIONS — preflight handler for browser CORS ───────────────────────────
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function GET(req: NextRequest) {
  try {
    await ensureInit();
    const rateLimitRes = await withRateLimit(req, "esp32_display", 60, 60);
    if (!rateLimitRes.allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": "60", ...CORS_HEADERS } }
      );
    }
    const host = req.headers.get("host") || "localhost:3000";
    const protocol = req.headers.get("x-forwarded-proto") || (host.includes("localhost") || host.includes("127.0.0.1") ? "http" : "https");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;

    const { searchParams } = new URL(req.url);
    const room = (searchParams.get("room") || "default").trim();

    const pool = getPool();

    // ─── [OPTIMIZATION: Run all independent DB queries in parallel] ───
    // แทนที่จะรันทีละ query แบบ sequential (รวม ~150-300ms)
    // รัน query ทั้งหมดพร้อมกันใน Promise.all (รวมเหลือแค่ ~50-100ms)
    const [
      settingRows,
      pendingRows,
      lastApproved,
      modeRows,
      tokenRows,
    ] = await Promise.all([
      // 1. Check for pending unlock command (IoT Cloud Polling)
      pool.query(
        "SELECT setting_value FROM system_settings WHERE setting_key = $1",
        [`room_cmd_${room}`]
      ),
      // 2. Count pending students for this room
      pool.query(
        "SELECT COUNT(*) as count FROM students WHERE status = 'pending' AND requested_room = $1",
        [room]
      ),
      // 3. Get last approved student
      pool.query(
        `SELECT CONCAT(first_name, ' ', last_name) as name, student_id, approved_at
         FROM students WHERE status = 'approved' AND approved_at IS NOT NULL AND requested_room = $1
         ORDER BY approved_at DESC LIMIT 1`,
        [room]
      ),
      // 4. Fetch student ID display mode
      pool.query(
        "SELECT setting_value FROM system_settings WHERE setting_key = 'student_id_display_mode'"
      ),
      // 5. Fetch active QR token (Optimize: Query in parallel with other display info)
      pool.query(
        "SELECT token FROM dynamic_qr_tokens WHERE is_consumed = FALSE AND room_code = $1 AND created_at >= CURRENT_TIMESTAMP - INTERVAL '1 second' * $2 ORDER BY created_at DESC LIMIT 1",
        [room, 60] // TOKEN_ROTATION_SECONDS is 60
      ),
    ]);

    // ─── [IoT Cloud Polling command check] ───
    let doorTrigger = "idle";
    const settings = settingRows.rows as { setting_value: string }[];
    if (settings.length > 0 && settings[0].setting_value === "unlock") {
      doorTrigger = "open";
      // Consume the command immediately to prevent re-trigger on next poll
      // Run fire-and-forget (no await) so it doesn't delay the response
      pool.query(
        "UPDATE system_settings SET setting_value = 'consumed', updated_at = CURRENT_TIMESTAMP WHERE setting_key = $1",
        [`room_cmd_${room}`]
      ).then(() => {
        console.log(`[IoT Cloud API] Command 'unlock' consumed by device for room: ${room}`);
      }).catch(err => {
        console.error("[IoT Cloud API] Failed to consume unlock command:", err);
      });
    }

    const pendingCount = (pendingRows.rows as { count: number }[])[0].count;
    const lastStudent = (lastApproved.rows as { name: string; student_id: string; approved_at: Date }[])[0];
    const displayMode = modeRows.rows[0]?.setting_value || "full";

    let displayStudentId = "";
    if (lastStudent) {
      const rawId = lastStudent.student_id;
      if (displayMode === "hidden") {
        displayStudentId = "HIDDEN";
      } else if (displayMode === "masked") {
        if (rawId.length <= 6) {
          displayStudentId = "****";
        } else {
          const visibleLen = Math.max(1, rawId.length - 6);
          displayStudentId = rawId.substring(0, visibleLen) + "*".repeat(rawId.length - visibleLen);
        }
      } else {
        displayStudentId = rawId; // full mode
      }
    }

    // ─── [Dynamic QR Token Optimization] ───
    // If the active token already exists (96%+ of the time), use it directly from the parallel query
    // This avoids a sequential database round-trip!
    let activeToken = (tokenRows.rows as { token: string }[])[0]?.token;
    if (!activeToken) {
      activeToken = await getOrCreateActiveQRToken(room);
    }

    // ─── IoT Polling Heartbeat — fire-and-forget (non-blocking) ───
    // ไม่ต้อง await เพราะ Heartbeat ไม่ใช่ข้อมูลวิกฤต — ส่งไปในพื้นหลัง
    pool.query(
      `INSERT INTO system_settings (setting_key, setting_value) 
       VALUES ($1, $2) 
       ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value`,
      [`room_last_seen_${room}`, new Date().toISOString()]
    ).catch(heartbeatErr => {
      console.error("[IoT Polling Heartbeat] Failed to update heartbeat:", heartbeatErr);
    });

    // Only expose the active_token if the caller authenticates with ESP32 API key
    const esp32ApiKey = process.env.ESP32_API_KEY || "rmutp_secure_door_unlock_token_placeholder";
    
    if (
      process.env.NODE_ENV === "production" &&
      (!process.env.ESP32_API_KEY || process.env.ESP32_API_KEY === "rmutp_secure_door_unlock_token_placeholder")
    ) {
      throw new Error(
        "Production Security Error: ESP32_API_KEY is using the default placeholder value. " +
        "You MUST configure a secure, unique ESP32_API_KEY environment variable in your production environment."
      );
    }
    
    const callerKey = req.headers.get("x-api-key") || "";
    const isAuthenticatedDevice = callerKey === esp32ApiKey;

    let activeTokenVal: string | undefined;
    if (isAuthenticatedDevice) {
      activeTokenVal = activeToken;
    }

    const now = new Date();
    const serverTimeIso = now.toISOString();
    const serverTimeText = now.toLocaleTimeString("th-TH", {
      timeZone: "Asia/Bangkok",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

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
              student_id: displayStudentId,
              time: lastStudent.approved_at,
            }
          : null,
        server_time: serverTimeIso,
        server_time_text: serverTimeText,
        timezone: "Asia/Bangkok",
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
          "Content-Type": "application/json",
          ...CORS_HEADERS,
        },
      }
    );
  } catch (error) {
    console.error("[ESP32/Display] error:", error);
    return NextResponse.json(
      { error: "ระบบไม่พร้อม กรุณาลองใหม่" },
      { status: 503, headers: { ...CORS_HEADERS } }
    );
  }
}

// ESP32 can POST its status here
export async function POST(req: NextRequest) {
  try {
    const rateLimitRes = await withRateLimit(req, "esp32_display", 60, 60);
    if (!rateLimitRes.allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": "60", ...CORS_HEADERS } }
      );
    }
    // Authenticate: accept either a valid ESP32 API key (for IoT devices) or an admin cookie (for browser-side calls)
    const esp32ApiKey = process.env.ESP32_API_KEY || "rmutp_secure_door_unlock_token_placeholder";
    const callerKey = req.headers.get("x-api-key") || "";
    const isAuthenticatedDevice = callerKey === esp32ApiKey;

    if (!isAuthenticatedDevice) {
      const admin = await getAdminFromCookie();
      if (!admin) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401, headers: { ...CORS_HEADERS } }
        );
      }
    }

    const body = await req.json();
    console.log("[ESP32] Status update received:", body);
    return NextResponse.json(
      { received: true, server_time: new Date().toISOString() },
      { headers: { ...CORS_HEADERS } }
    );
  } catch {
    return NextResponse.json({ received: false }, { status: 400 });
  }
}
