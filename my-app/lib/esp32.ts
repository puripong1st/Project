// lib/esp32.ts — ESP32 HTTP client with mock mode + Wokwi simulator + physical hardware
//
// Connection Modes (set in .env.local):
//   ESP32_MOCK_MODE=true           → Pure software mock (no hardware needed)
//   ESP32_WOKWI=true               → Connect to Wokwi Simulator via localhost:8180
//   (neither)                      → Connect to physical ESP32 at ESP32_IP:ESP32_PORT

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
export async function openDoor(studentId?: string): Promise<ESP32Response> {
  if (MOCK_MODE) {
    console.log("[ESP32 Mock] Simulating door open for student:", studentId);
    await new Promise((r) => setTimeout(r, 500));
    return {
      success: true,
      message: "🔓 [MOCK] ประตูเปิดสำเร็จ (โหมดทดสอบ)",
      mock: true,
      timestamp: new Date().toISOString(),
    };
  }

  const modeLabel = WOKWI_MODE ? "[Wokwi]" : "[ESP32]";
  try {
    const response = await retryFetch(`${BASE_URL}/door/open`, {
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
        message: data.message || "ประตูเปิดสำเร็จ",
        wokwi: WOKWI_MODE,
        timestamp: new Date().toISOString(),
      };
    }
    return {
      success: false,
      message: `${modeLabel} ตอบกลับ: ${response.status} ${response.statusText}`,
      wokwi: WOKWI_MODE,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Connection failed";
    console.error(`${modeLabel} Door open failed:`, msg);
    return {
      success: false,
      message: WOKWI_MODE
        ? `ไม่สามารถติดต่อ Wokwi (${WOKWI_URL}): ${msg} — ตรวจสอบว่า Simulator กำลังรันอยู่`
        : `ไม่สามารถติดต่อ ESP32 (${BASE_URL}): ${msg}`,
      wokwi: WOKWI_MODE,
    };
  }
}

/**
 * Get ESP32 / Wokwi status
 */
export async function getESP32Status(): Promise<{
  online: boolean;
  doorStatus?: string;
  ip: string;
  mock: boolean;
  wokwi: boolean;
  mode: ESP32ConnectionMode;
}> {
  const mode = getESP32Mode();
  if (MOCK_MODE) {
    return { online: true, doorStatus: "closed", ip: ESP32_IP, mock: true, wokwi: false, mode };
  }
  try {
    const response = await fetchWithTimeout(`${BASE_URL}/status`, {}, 3000);
    const data = await response.json();
    return {
      online: true,
      doorStatus: data.door_status,
      ip: WOKWI_MODE ? "localhost:8180" : ESP32_IP,
      mock: false,
      wokwi: WOKWI_MODE,
      mode,
    };
  } catch {
    return {
      online: false,
      ip: WOKWI_MODE ? "localhost:8180" : ESP32_IP,
      mock: false,
      wokwi: WOKWI_MODE,
      mode,
    };
  }
}

/**
 * Send display update to ESP32 / Wokwi
 */
export async function updateESP32Display(payload: {
  type: "qr" | "approved" | "rejected" | "idle";
  message?: string;
  studentName?: string;
}): Promise<boolean> {
  if (MOCK_MODE) {
    console.log("[ESP32 Mock] Display update:", payload);
    return true;
  }
  try {
    const response = await fetchWithTimeout(`${BASE_URL}/display`, {
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
