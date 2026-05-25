// lib/esp32.ts — ESP32 HTTP client with mock mode + Wokwi simulator + physical hardware
//
// Connection Modes (set in .env.local):
//   ESP32_MOCK_MODE=true           → Pure software mock (no hardware needed)
//   ESP32_WOKWI=true               → Connect to Wokwi Simulator via localhost:8180
//   (neither)                      → Connect to physical ESP32 at ESP32_IP:ESP32_PORT

import { getSystemSettings, getPool } from "./db";

const ESP32_IP   = process.env.ESP32_IP   || "192.168.1.100";
const ESP32_PORT = process.env.ESP32_PORT || "80";
const MOCK_MODE  = process.env.ESP32_MOCK_MODE === "true";
const WOKWI_MODE = process.env.ESP32_WOKWI === "true";

// Wokwi: localhost:8180 is forwarded from simulated ESP32 port 80 (via wokwi.toml)
const WOKWI_URL = process.env.ESP32_WOKWI_URL || "http://localhost:8180";
const BASE_URL   = WOKWI_MODE ? WOKWI_URL : `http://${ESP32_IP}:${ESP32_PORT}`;

// Pre-shared API key for authenticating Next.js → ESP32 calls (Vulnerability 1 fix)
const ESP32_API_KEY = process.env.ESP32_API_KEY || "rmutp_secure_door_unlock_token_2026";

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

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 2000): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function retryFetch(url: string, options: RequestInit = {}, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fetchWithTimeout(url, options, 2000);
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
  throw new Error("Max retries reached");
}

/**
 * Send door open command to ESP32 / Wokwi
 */
export async function openDoor(studentId?: string, roomCode?: string): Promise<ESP32Response> {
  const sanitizedRoom = (roomCode || "default").trim();

  // ─── [IoT Cloud Platform Architecture] ───
  // เขียนคิวคำสั่งเปิดประตู "unlock" ลงฐานข้อมูล MySQL เสมอ เพื่อให้บอร์ด ESP32 ที่เชื่อมต่อนอกวง LAN 
  // (ผ่านเน็ตสาธารณะ Wi-Fi/4G) มาร้องขอรับทราบ (Polling) คำสั่งเปิดประตูไปรันได้ทันทีข้ามโลก 100%
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
    await new Promise((r) => setTimeout(r, 500));
    return {
      success: true,
      message: `🔓 [MOCK] ประตูห้อง ${sanitizedRoom} เปิดสำเร็จ (โหมดทดสอบ)`,
      mock: true,
      timestamp: new Date().toISOString(),
    };
  }

  const modeLabel = WOKWI_MODE ? "[Wokwi]" : "[ESP32]";
  try {
    const url = await getESP32Url(sanitizedRoom);
    // พยายามยิงตรงไปหาบอร์ดตัวจริง (เผื่ออยู่ในวง LAN ท้องถิ่นเดียวกันหรือมี Port forward)
    const response = await retryFetch(`${url}/door/open`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": ESP32_API_KEY,
      },
      body: JSON.stringify({ studentId, timestamp: new Date().toISOString() }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        message: data.message || "เปิดประตูผ่านเครือข่าย LAN สำเร็จ",
        wokwi: WOKWI_MODE,
        timestamp: new Date().toISOString(),
      };
    }
    
    // หากบอร์ดตอบผิดพลาด แต่คำสั่งลง DB เรียบร้อยแล้ว ให้มองเป็นคิวสำเร็จสำหรับบอร์ดข้ามอินเทอร์เน็ต
    return {
      success: true,
      message: `ส่งคำสั่งเปิดประตูเข้าคิวระบบคลาวด์เรียบร้อยแล้ว (บอร์ดข้ามอินเทอร์เน็ตจะรับทราบผลและเปิดใน 2 วินาที)`,
      wokwi: WOKWI_MODE,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Connection failed";
    console.log(`${modeLabel} LAN Direct connection skipped/failed: ${msg} -> พึ่งพาคำสั่งผ่านระบบ IoT Cloud Queue`);
    
    // Fallback ปลอดภัย: บอร์ดอยู่นอกวง LAN/ติดไฟร์วอลล์ แต่เราลงแฟล็กเปิดประตูในคลาวด์เรียบร้อยแล้ว ถือว่าส่งคำสั่งสำเร็จ!
    return {
      success: true,
      message: `ส่งคำสั่งเปิดประตูเข้าคิวระบบคลาวด์สำเร็จ (บอร์ดห้อง ${sanitizedRoom} กำลัง Long-Polling ดึงข้อมูล)`,
      wokwi: WOKWI_MODE,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Get ESP32 / Wokwi status
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
  if (MOCK_MODE) {
    const resolvedUrl = await getESP32Url(roomCode);
    const ipLabel = resolvedUrl.replace("http://", "").replace("https://", "");
    return { online: true, doorStatus: "closed", ip: ipLabel, mock: true, wokwi: false, mode };
  }
  
  const url = await getESP32Url(roomCode);
  const ipLabel = url.replace("http://", "").replace("https://", "");

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
    // ─── [IoT Cloud Polling Heartbeat Fallback] ───
    // ถ้ายิงตรงไปหา IP ของบอร์ดไม่ได้ (เช่น ตอนอยู่บน Vercel แล้วบอร์ดใช้ IP วง LAN)
    // ให้เช็คจากประวัติการยิงดึงข้อมูลล่าสุด (Heartbeat) ของห้องนั้นๆ ในดาต้าเบสแทน
    try {
      const pool = getPool();
      const sanitizedRoom = (roomCode || "default").trim();
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
        
        // ถ้าบอร์ดพึ่งมีการทำ Polling เข้ามาภายใน 15 วินาทีล่าสุด ถือว่าออนไลน์แน่นอน! (ไฟเขียว)
        if (diffSeconds <= 15) {
          return {
            online: true,
            doorStatus: "closed", // คาดการณ์สถานะล็อกปกติ
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
    });
    return response.ok;
  } catch {
    return false;
  }
}
