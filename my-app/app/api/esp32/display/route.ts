// app/api/esp32/display/route.ts — Edge Runtime (Vercel CDN Edge, cold start < 50ms)
// ใช้ Supabase REST API + Web Crypto แทน pg + Node crypto
export const runtime = "edge";
export const preferredRegion = "sin1"; // Singapore — ใกล้ประเทศไทยที่สุด

import { NextRequest, NextResponse } from "next/server";
import { hmacSHA256, sha1Hex, secureEqual } from "@/lib/edge-crypto";
import { sbGetSettings, sbUpdate, sbUpsert } from "@/lib/supabase-edge";
import { cacheGet, cacheSet } from "@/lib/kv-cache";

const ALLOWED_ORIGIN = (
  process.env.NEXT_PUBLIC_APP_URL || "https://project-sigma-ivory-21.vercel.app"
).replace(/\/$/, "");

const CORS = {
  "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-api-key, x-timestamp, x-hmac-signature, x-esp32-version, If-None-Match",
  Vary: "Origin",
} as const;

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const SB_HEADERS = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
};

// ─── Edge-compatible HMAC security check ─────────────────────────────────────
async function verifyEdgeSecurity(
  req: NextRequest,
  endpointPath: string
): Promise<{ allowed: boolean; error?: NextResponse }> {
  const apiKey = process.env.ESP32_API_KEY;
  if (!apiKey) {
    return { allowed: false, error: NextResponse.json({ error: "Server misconfigured" }, { status: 503 }) };
  }

  const clientApiKey = req.headers.get("x-api-key");
  if (!clientApiKey || !secureEqual(clientApiKey, apiKey)) {
    return { allowed: false, error: NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: CORS }) };
  }

  const timestampStr = req.headers.get("x-timestamp");
  const providedSig = req.headers.get("x-hmac-signature");
  if (!timestampStr || !providedSig) {
    return { allowed: false, error: NextResponse.json({ error: "Missing Signature" }, { status: 401, headers: CORS }) };
  }

  const ts = parseInt(timestampStr, 10);
  const now = Math.floor(Date.now() / 1000);
  if (isNaN(ts) || Math.abs(now - ts) > 60) {
    return { allowed: false, error: NextResponse.json({ error: "Token Expired" }, { status: 401, headers: CORS }) };
  }

  const expected = await hmacSHA256(`${timestampStr}:${endpointPath}`, apiKey);
  if (!secureEqual(expected, providedSig)) {
    return { allowed: false, error: NextResponse.json({ error: "Invalid Signature" }, { status: 401, headers: CORS }) };
  }

  return { allowed: true };
}

// ─── Simple edge rate limiter via KV (bucket per API key, 60 req/min) ────────
async function edgeRateLimit(req: NextRequest): Promise<boolean> {
  // For authenticated ESP32 devices (HMAC-verified), rate limiting is secondary
  // Vercel Edge already handles DDoS at infrastructure level
  // We do a lightweight check via KV if available
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",").pop()?.trim() || "unknown";
    const key = `rl:esp32display:${ip}`;
    const cached = await cacheGet<number>(key);
    const count = (cached ?? 0) + 1;
    if (count > 120) return false; // 120 req/min max per IP
    await cacheSet(key, count, 60);
    return true;
  } catch {
    return true; // always allow if KV unavailable
  }
}

// ─── Supabase REST query helpers ──────────────────────────────────────────────
async function sbFetch(path: string, options?: RequestInit) {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: { ...SB_HEADERS, ...(options?.headers as Record<string, string> || {}) },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(req: NextRequest) {
  try {
    // Rate limit check (lightweight)
    if (!(await edgeRateLimit(req))) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": "60", ...CORS } });
    }

    // HMAC Security
    const sec = await verifyEdgeSecurity(req, "/api/esp32/display");
    if (!sec.allowed) return sec.error!;

    const host = req.headers.get("host") || "localhost:3000";
    const proto = req.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${proto}://${host}`;
    const { searchParams } = new URL(req.url);
    const room = (searchParams.get("room") || "default").trim();

    // ─── [KV Cache] อ่าน system_settings จาก Redis ก่อน ──────────────────
    const SETTINGS_TTL = 15; // 15s cache — สั้นพอให้ per-room settings อัปเดตทันใช้
    const cacheKey = "system_settings:all";
    let allSettings = await cacheGet<Record<string, string>>(cacheKey);

    if (!allSettings) {
      // Cache miss → ดึงจาก Supabase
      const settRes = await sbFetch("system_settings?select=setting_key,setting_value");
      if (settRes.ok) {
        const rows: { setting_key: string; setting_value: string }[] = await settRes.json();
        allSettings = Object.fromEntries(rows.map((r) => [r.setting_key, r.setting_value]));
        await cacheSet(cacheKey, allSettings, SETTINGS_TTL);
      } else {
        allSettings = {};
      }
    }

    // ─── [Parallel DB queries via Supabase REST] ──────────────────────────
    const [pendingRes, lastApprovedRes, tokenRes, firmwareRes] = await Promise.all([
      // 1. Count pending students for this room
      sbFetch(`students?status=eq.pending&requested_room=eq.${encodeURIComponent(room)}&select=count`, {
        headers: { Prefer: "count=exact" },
      }),
      // 2. Last approved student
      sbFetch(
        `students?status=eq.approved&requested_room=eq.${encodeURIComponent(room)}&approved_at=not.is.null&select=first_name,last_name,student_id,approved_at&order=approved_at.desc&limit=1`
      ),
      // 3. Active QR token
      sbFetch(
        `dynamic_qr_tokens?is_consumed=eq.false&room_code=eq.${encodeURIComponent(room)}&select=token&order=created_at.desc&limit=1`
      ),
      // 4. Latest firmware version
      sbFetch("firmware_releases?select=version&order=uploaded_at.desc&limit=1"),
    ]);

    // ─── Door command check ───────────────────────────────────────────────
    const doorCmdKey = `room_cmd_${room}`;
    const doorCmd = allSettings[doorCmdKey];
    let doorTrigger = "idle";
    if (doorCmd === "unlock") {
      doorTrigger = "open";
      // Consume command (fire-and-forget)
      sbUpdate("system_settings", { setting_key: doorCmdKey }, {
        setting_value: "consumed",
        updated_at: new Date().toISOString(),
      });
      // Also invalidate cache so next poll sees consumed state
      await cacheSet(cacheKey, { ...allSettings, [doorCmdKey]: "consumed" }, SETTINGS_TTL);
    }

    // ─── Parse pending count ──────────────────────────────────────────────
    let pendingCount = 0;
    if (pendingRes.ok) {
      const countHeader = pendingRes.headers.get("content-range"); // "0-0/5"
      if (countHeader) {
        pendingCount = parseInt(countHeader.split("/")[1] || "0", 10);
      } else {
        const rows: unknown[] = await pendingRes.json();
        pendingCount = Array.isArray(rows) ? rows.length : 0;
      }
    }

    // ─── Last approved student ────────────────────────────────────────────
    const lastApprovedRows: { first_name: string; last_name: string; student_id: string; approved_at: string }[] =
      lastApprovedRes.ok ? await lastApprovedRes.json() : [];
    const lastStudent = lastApprovedRows[0];

    // ─── Student ID display mode (per-room → fallback global) ────────────
    const displayMode =
      allSettings[`rcfg_${room}_student_id_display_mode`] ||
      allSettings["student_id_display_mode"] ||
      "full";

    let displayStudentId = "";
    if (lastStudent) {
      const rawId = lastStudent.student_id;
      if (displayMode === "hidden") {
        displayStudentId = "HIDDEN";
      } else if (displayMode === "masked") {
        displayStudentId =
          rawId.length <= 6 ? "****" : rawId.substring(0, Math.max(1, rawId.length - 6)) + "******";
      } else {
        displayStudentId = rawId;
      }
    }

    // ─── Active QR token ──────────────────────────────────────────────────
    const tokenRows: { token: string }[] = tokenRes.ok ? await tokenRes.json() : [];
    let activeToken = tokenRows[0]?.token;

    if (!activeToken) {
      // Generate new token via internal API (avoids pg dependency in Edge)
      try {
        const genRes = await fetch(
          `${appUrl}/api/esp32/qr/token?room=${encodeURIComponent(room)}`,
          { headers: { "x-internal": process.env.JWT_SECRET || "" } }
        );
        if (genRes.ok) {
          const td = await genRes.json();
          activeToken = td.token;
        }
      } catch { /* use undefined */ }
    }

    // ─── Firmware OTA check ───────────────────────────────────────────────
    const clientVer = req.headers.get("x-esp32-version") || "1.0.0";
    const fwRows: { version: string }[] = firmwareRes.ok ? await firmwareRes.json() : [];
    const serverVer = fwRows[0]?.version || "1.0.0";
    const updateAvailable = clientVer !== serverVer;

    // ─── Heartbeat (fire-and-forget) ──────────────────────────────────────
    sbUpsert("system_settings", {
      setting_key: `room_last_seen_${room}`,
      setting_value: new Date().toISOString(),
    }, "setting_key");

    // ─── Server time (Bangkok UTC+7) ──────────────────────────────────────
    const now = new Date();
    const serverTimeIso = now.toISOString();
    const serverTimeText = now.toLocaleTimeString("th-TH", {
      timeZone: "Asia/Bangkok",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
    });

    const payload = {
      title: "SmartAccess Door Access",
      subtitle: "คณะครุศาสตร์อุตสาหกรรม มทร.พระนคร",
      active_token: activeToken,
      qr_url: `${appUrl}/api/esp32/qr?room=${room}`,
      register_url: `${appUrl}/?room=${room}`,
      pending_count: pendingCount,
      last_approved: lastStudent
        ? {
            name: `${lastStudent.first_name} ${lastStudent.last_name}`,
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
      update_available: updateAvailable,
      firmware_version: serverVer,
      display: {
        width: 320, height: 240, orientation: "landscape",
        color_theme: { bg: "#000000", primary: "#4CAF50", secondary: "#FFD700", text: "#FFFFFF", error: "#F44336" },
      },
    };

    // ─── ETag (skip when door open) ───────────────────────────────────────
    if (doorTrigger === "idle") {
      const etagSrc = `${pendingCount}|${lastStudent?.student_id || ""}|${activeToken || ""}|${updateAvailable}|${serverVer}`;
      const etagHex = await sha1Hex(etagSrc);
      const etag = `"${etagHex.slice(0, 16)}"`;

      if (req.headers.get("if-none-match") === etag) {
        return new NextResponse(null, {
          status: 304,
          headers: { ETag: etag, "Cache-Control": "no-store", ...CORS },
        });
      }
      return NextResponse.json(payload, {
        headers: { "Cache-Control": "no-store", ETag: etag, ...CORS },
      });
    }

    return NextResponse.json(payload, { headers: { "Cache-Control": "no-store", ...CORS } });
  } catch (error) {
    console.error("[ESP32/Display Edge]", error);
    return NextResponse.json({ error: "ระบบไม่พร้อม" }, { status: 503, headers: CORS });
  }
}

export async function POST(req: NextRequest) {
  const sec = await verifyEdgeSecurity(req, "/api/esp32/display");
  if (!sec.allowed) return sec.error!;
  try {
    const body = await req.json();
    console.log("[ESP32] status POST:", body);
    return NextResponse.json({ received: true, server_time: new Date().toISOString() }, { headers: CORS });
  } catch {
    return NextResponse.json({ received: false }, { status: 400, headers: CORS });
  }
}
