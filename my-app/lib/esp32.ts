// lib/esp32.ts — ESP32 HTTP client with mock mode + retry
const ESP32_IP = process.env.ESP32_IP || "192.168.1.100";
const ESP32_PORT = process.env.ESP32_PORT || "80";
const MOCK_MODE = process.env.ESP32_MOCK_MODE === "true";
const BASE_URL = `http://${ESP32_IP}:${ESP32_PORT}`;

export interface ESP32Response {
  success: boolean;
  message: string;
  mock?: boolean;
  timestamp?: string;
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 5000): Promise<Response> {
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
      return await fetchWithTimeout(url, options, 5000);
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise((r) => setTimeout(r, 1000 * (i + 1))); // exponential backoff
    }
  }
  throw new Error("Max retries reached");
}

/**
 * Send door open command to ESP32
 */
export async function openDoor(studentId?: string): Promise<ESP32Response> {
  if (MOCK_MODE) {
    console.log("[ESP32 Mock] Simulating door open for student:", studentId);
    await new Promise((r) => setTimeout(r, 500)); // simulate delay
    return {
      success: true,
      message: "🔓 [MOCK] ประตูเปิดสำเร็จ (โหมดทดสอบ)",
      mock: true,
      timestamp: new Date().toISOString(),
    };
  }

  try {
    const response = await retryFetch(`${BASE_URL}/door/open`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, timestamp: new Date().toISOString() }),
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        message: data.message || "ประตูเปิดสำเร็จ",
        timestamp: new Date().toISOString(),
      };
    }
    return {
      success: false,
      message: `ESP32 ตอบกลับ: ${response.status} ${response.statusText}`,
    };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Connection failed";
    console.error("[ESP32] Door open failed:", msg);
    return {
      success: false,
      message: `ไม่สามารถติดต่อ ESP32: ${msg}`,
    };
  }
}

/**
 * Get ESP32 status
 */
export async function getESP32Status(): Promise<{ online: boolean; doorStatus?: string; ip: string; mock: boolean }> {
  if (MOCK_MODE) {
    return { online: true, doorStatus: "closed", ip: ESP32_IP, mock: true };
  }
  try {
    const response = await fetchWithTimeout(`${BASE_URL}/status`, {}, 3000);
    const data = await response.json();
    return { online: true, doorStatus: data.door_status, ip: ESP32_IP, mock: false };
  } catch {
    return { online: false, ip: ESP32_IP, mock: false };
  }
}

/**
 * Send display update to ESP32 (for the TFT display)
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
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return response.ok;
  } catch {
    return false;
  }
}
