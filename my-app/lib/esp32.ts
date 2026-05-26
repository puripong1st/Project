// lib/esp32.ts — ESP32 HTTP client with mock mode + Wokwi simulator + physical hardware
//
// Connection Modes (set in .env.local):
//   ESP32_MOCK_MODE=true           → Pure software mock (no hardware needed)
//   ESP32_WOKWI=true               → Connect to Wokwi Simulator via localhost:8180
//   (neither)                      → Connect to physical ESP32 at ESP32_IP:ESP32_PORT
//
// OPTIMIZATION (2026-05): openDoor now returns immediately after writing to DB queue
//   LAN direct-connect is attempted in background (non-blocking fire-and-forget)
//   getESP32Status skips LAN ping for private IPs on cloud environments

import { getSystemSettings, getPool } from "./db";

const ESP32_IP   = process.env.ESP32_IP   || "192.168.1.100";
const ESP32_PORT = process.env.ESP32_PORT || "80";
const MOCK_MODE  = process.env.ESP32_MOCK_MODE === "true";
const WOKWI_MODE = process.env.ESP32_WOKWI === "true";

// Wokwi: localhost:8180 is forwarded from simulated ESP32 port 80 (via wokwi.toml)
const WOKWI_URL = process.env.ESP32_WOKWI_URL || "http://localhost:8180";
const BASE_URL   = WOKWI_MODE ? WOKWI_URL : `http://${ESP32_IP}:${ESP32_PORT}`;

// Pre-shared API key for authenticating Next.js → ESP32 calls
const ESP32_API_KEY = process.env.ESP32_API_KEY || "rmutp_secure_door_unlock_token_placeholder";

function verifyApiKeySecurity() {
  if (
    ESP32_API_KEY === "rmutp_secure_door_unlock_token_placeholder" &&
    process.env.NODE_ENV === "production"
  ) {
    throw new Error(
      "Production Security Error: ESP32_API_KEY is using the default placeholder value. " +
      "You MUST configure a secure, unique ESP32_API_KEY environment variable in your production environment."
    );
  }
}

export type ESP32ConnectionMode = "mock" | "wokwi" | "physical";

/** Returns which connection mode is active (useful for UI status panels) */
export function getESP32Mode(): ESP32ConnectionMode {
  if (MOCK_MODE)  return "mock";
  if (WOKWI_MODE) return "wokwi";
  return "physical";
}

/** Returns the active base URL being used */
export function getESP32BaseUrl(): string { return BASE_URL; }

/**
 * Detect if a URL/IP is a private LAN IP address.
 * When running on cloud (Vercel), we cannot reach private IPs, so we skip direct ping.
 */
function isPrivateLanUrl(url: string): boolean {
  // Extract host from URL or treat as IP
  const host = url.replace(/^https?:\/\//, "").split(/[/:]/)[0];
  return (
    /^192\.168\./.test(host) ||
    /^10\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
    host === "localhost" ||
    host === "127.0.0.1"
  );
}

/**
 * Detect if we are running in a cloud/serverless environment (Vercel, etc.)
 * In cloud environments, we cannot reach private LAN IPs.
 */
function isCloudEnvironment(): boolean {
  return !!(
    process.env.VERCEL ||
    process.env.VERCEL_ENV ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.FUNCTION_NAME // GCP
  );
}

/**
 * Resolves the URL for a specific classroom dynamically.
 * If the room is default or not found, it falls back to the configured BASE_URL.
 */
export async function getESP32Url(roomCode?: string): Promise<string> {
  const sanitizedRoom = (roomCode || "default").trim();
  if (sanitizedRoom === "default") {
    return BASE_URL;
  }
  
  try {
    const settings = await getSystemSettings();
    const roomIpKey = `room_ip_${sanitizedRoom}`;
    const roomIp = settings[roomIpKey];
    if (roomIp) {
      const ip = roomIp.trim();
      if (ip.startsWith("http://") || ip.startsWith("https://")) {
        return ip;
      }
      return `http://${ip}`;
    }
  } catch (err) {
    console.error("Failed to fetch room IP from database settings:", err);
  }
  
  return BASE_URL;
}

export interface ESP32Response {
  success: boolean;
  message: string;
  mock?: boolean;
  wokwi?: boolean;
  timestamp?: string;
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 1500): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Fire-and-forget LAN direct attempt — runs completely in background.
 * Does NOT block or retry. Failure is silent (already handled by DB queue).
 */
function tryLanDirectBackground(url: string, studentId: string | undefined, roomCode: string): void {
  // Run in background, no await, no retry
  fetchWithTimeout(`${url}/door/open`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": ESP32_API_KEY,
    },
    body: JSON.stringify({ studentId, timestamp: new Date().toISOString() }),
  }, 1500).then(res => {
    if (res.ok) {
      console.log(`[ESP32 LAN] Direct connection succeeded for room: ${roomCode}`);
    }
  }).catch(() => {
    // Silent: DB queue already handles delivery — LAN direct is just a fast-path bonus
  });
}

/**
 * Send door open command to ESP32 / Wokwi.
 * 
 * OPTIMIZED: Returns immediately after writing IoT cloud DB queue (<20ms).
 * LAN direct-connect is attempted in background only if not on cloud environment.
 */
export async function openDoor(studentId?: string, roomCode?: string): Promise<ESP32Response> {
  verifyApiKeySecurity();
  const sanitizedRoom = (roomCode || "default").trim();

  // ─── [IoT Cloud Platform Architecture] ───
  // เขียนคิวคำสั่งเปิดประตู "unlock" ลงฐานข้อมูล เพื่อให้ ESP32 ที่เชื่อมต่อนอกวง LAN
  // (ผ่านเน็ตสาธารณะ Wi-Fi/4G) มาร้องขอรับทราบ (Polling) คำสั่งเปิดประตู
  try {
    const pool = getPool();
    await pool.query(
      `INSERT INTO system_settings (setting_key, setting_value, updated_at) 
       VALUES ($1, $2, CURRENT_TIMESTAMP) 
       ON CONFLICT (setting_key) DO UPDATE SET setting_value = $3, updated_at = CURRENT_TIMESTAMP`,
      [`room_cmd_${sanitizedRoom}`, "unlock", "unlock"]
    );
    console.log(`[IoT Cloud] Command 'unlock' queued in DB for room: ${sanitizedRoom}`);
  } catch (dbErr) {
    console.error("[IoT Cloud] Failed to queue unlock command in DB system_settings:", dbErr);
  }

  if (MOCK_MODE) {
    console.log(`[ESP32 Mock] Simulating door open for room: ${sanitizedRoom} student:`, studentId);
    return {
      success: true,
      message: `🔓 [MOCK] ประตูห้อง ${sanitizedRoom} เปิดสำเร็จ (โหมดทดสอบ)`,
      mock: true,
      timestamp: new Date().toISOString(),
    };
  }

  // ─── [Optimized: Non-blocking LAN Direct Background Attempt] ───
  // ถ้าไม่ได้รันบนระบบคลาวด์ และบอร์ดอยู่ในวง LAN เดียวกัน ลองยิงตรงใน background (fire-and-forget)
  // ไม่บล็อกการทำงาน — คิวใน DB คือระบบหลักและได้บันทึกแล้ว
  if (!isCloudEnvironment()) {
    // Only attempt LAN direct if NOT on Vercel/cloud (where it would always timeout)
    getESP32Url(sanitizedRoom).then(url => {
      if (!isPrivateLanUrl(url)) return; // Only try LAN IPs in background
      tryLanDirectBackground(url, studentId, sanitizedRoom);
    }).catch(() => {});
  }

  return {
    success: true,
    message: `ส่งคำสั่งเปิดประตูเข้าคิวระบบคลาวด์เรียบร้อยแล้ว (บอร์ดห้อง ${sanitizedRoom} จะรับทราบและเปิดประตูใน 2 วินาที)`,
    wokwi: WOKWI_MODE,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get ESP32 / Wokwi status.
 *
 * OPTIMIZED: When running in cloud env with private LAN IPs, skip direct ping entirely
 * and rely solely on Heartbeat timestamp from DB (instant, <10ms).
 */
export async function getESP32Status(roomCode?: string): Promise<{
  online: boolean;
  doorStatus?: string;
  ip: string;
  mock: boolean;
  wokwi: boolean;
  mode: ESP32ConnectionMode;
}> {
  const mode = getESP32Mode();
  const sanitizedRoom = (roomCode || "default").trim();

  if (MOCK_MODE) {
    const resolvedUrl = await getESP32Url(roomCode);
    const ipLabel = resolvedUrl.replace("http://", "").replace("https://", "");
    return { online: true, doorStatus: "closed", ip: ipLabel, mock: true, wokwi: false, mode };
  }
  
  const url = await getESP32Url(roomCode);
  const ipLabel = url.replace("http://", "").replace("https://", "");

  // ─── [Optimization: Skip LAN ping when on cloud with private IP] ───
  // Vercel/cloud cannot reach private LAN IPs (192.168.x.x, 10.x.x.x, etc.)
  // Attempting to connect would always timeout after 1+ second — skip and use Heartbeat DB
  const shouldSkipDirectPing = isCloudEnvironment() && isPrivateLanUrl(url);

  if (!shouldSkipDirectPing) {
    try {
      const response = await fetchWithTimeout(`${url}/status`, {}, 1000);
      const data = await response.json();
      return {
        online: true,
        doorStatus: data.door_status,
        ip: WOKWI_MODE ? "localhost:8180" : ipLabel,
        mock: false,
        wokwi: WOKWI_MODE,
        mode,
      };
    } catch {
      // Fall through to Heartbeat check below
    }
  }

  // ─── [IoT Cloud Polling Heartbeat Fallback] ───
  // เช็คจากประวัติการดึงข้อมูลล่าสุด (Heartbeat) ของห้องนั้นๆ ในฐานข้อมูลแทน
  try {
    const pool = getPool();
    const { rows } = await pool.query(
      "SELECT setting_value FROM system_settings WHERE setting_key = $1",
      [`room_last_seen_${sanitizedRoom}`]
    );
    const settings = rows as { setting_value: string }[];
    if (settings.length > 0) {
      const lastSeenStr = settings[0].setting_value;
      const lastSeen = new Date(lastSeenStr).getTime();
      const now = new Date().getTime();
      const diffSeconds = (now - lastSeen) / 1000;
      
      // ถ้าบอร์ดเพิ่ง Heartbeat มาไม่เกิน 120 วินาที ถือว่าออนไลน์
      if (diffSeconds <= 120) {
        return {
          online: true,
          doorStatus: "closed",
          ip: WOKWI_MODE ? "localhost:8180" : ipLabel,
          mock: false,
          wokwi: WOKWI_MODE,
          mode,
        };
      }
    }
  } catch (dbErr) {
    console.error("[Status Heartbeat Fallback] Database check failed:", dbErr);
  }

  return {
    online: false,
    ip: WOKWI_MODE ? "localhost:8180" : ipLabel,
    mock: false,
    wokwi: WOKWI_MODE,
    mode,
  };
}

/**
 * Send display update to ESP32 / Wokwi
 */
export async function updateESP32Display(
  payload: {
    type: "qr" | "approved" | "rejected" | "idle";
    message?: string;
    studentName?: string;
  },
  roomCode?: string
): Promise<boolean> {
  verifyApiKeySecurity();
  if (MOCK_MODE) {
    console.log(`[ESP32 Mock] Display update for room ${roomCode || "default"}:`, payload);
    return true;
  }
  try {
    const url = await getESP32Url(roomCode);
    const response = await fetchWithTimeout(`${url}/display`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": ESP32_API_KEY,
      },
      body: JSON.stringify(payload),
    }, 1500);
    return response.ok;
  } catch {
    return false;
  }
}
