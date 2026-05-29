// lib/access-log.ts — ตัวบันทึก access_logs แบบรวมศูนย์
// เป้าหมาย: ทุก log มี IP + อุปกรณ์ + ห้อง (room_code) + ระดับความสำคัญ (severity) ครบและสม่ำเสมอ
import { getPool } from "./db";

export type LogSeverity = "info" | "warning" | "critical";

// ── ระดับความสำคัญเริ่มต้นต่อ action ── (override ได้ผ่าน opts.severity)
const SEVERITY_BY_ACTION: Record<string, LogSeverity> = {
  // ปกติ
  registered: "info",
  approved: "info",
  door_opened: "info",
  bypass_opened: "info",
  admin_login: "info",
  admin_logout: "info",
  export_pdf: "info",
  settings_updated: "info",
  firmware_deployed: "info",
  firmware_ota_triggered: "info",
  admin_created: "info",
  admin_updated: "info",
  // ควรจับตา
  rejected: "warning",
  door_failed: "warning",
  bypass_denied: "warning",
  bypass_rate_limited: "warning",
  qr_expired: "warning",
  qr_invalid: "warning",
  login_rate_limited: "warning",
  settings_update_failed: "warning",
  admin_deleted: "warning",
  // อันตราย/ความปลอดภัย
  admin_login_failed: "warning",
  esp32_offline: "critical",
  hmac_invalid: "critical",
  unauthorized_access: "critical",
};

export function severityForAction(action: string): LogSeverity {
  return SEVERITY_BY_ACTION[action] || "info";
}

/** แยก browser/device จาก User-Agent (ใช้แสดงผลในแจ้งเตือน/รายงาน) */
export function parseDevice(ua: string): { browser: string; device: string } {
  if (!ua) return { browser: "ไม่ทราบ", device: "ไม่ทราบ" };
  let browser = "Other";
  if (ua.includes("Edg/")) browser = "Microsoft Edge";
  else if (ua.includes("Chrome/") && !ua.includes("Chromium/")) browser = "Google Chrome";
  else if (ua.includes("Firefox/")) browser = "Mozilla Firefox";
  else if (ua.includes("Safari/") && !ua.includes("Chrome/")) browser = "Apple Safari";
  else if (ua.includes("OPR/") || ua.includes("Opera/")) browser = "Opera";

  let device = "Desktop";
  if (/Android/i.test(ua)) device = "Android Mobile";
  else if (/iPhone|iPad|iPod/i.test(ua)) device = "iOS Device";
  else if (/Windows Phone/i.test(ua)) device = "Windows Phone";
  else if (/Windows/i.test(ua)) device = "Windows PC";
  else if (/Macintosh|Mac OS/i.test(ua)) device = "Mac";
  else if (/Linux/i.test(ua)) device = "Linux";
  return { browser, device };
}

/** ดึง IP + User-Agent จาก request (รองรับ proxy ของ Vercel) */
export function getRequestContext(req: Request): { ip: string; userAgent: string } {
  const h = req.headers;
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    h.get("x-real-ip")?.trim() ||
    "unknown";
  const userAgent = (h.get("user-agent") || "").slice(0, 300);
  return { ip, userAgent };
}

export interface LogEventOptions {
  action: string;
  /** id ของแถวในตาราง students (ถ้ามี) */
  studentId?: number | null;
  /** id ของแอดมินผู้ดำเนินการ (ถ้ามี) */
  performedBy?: number | null;
  room?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  esp32Response?: string | null;
  notes?: string | null;
  details?: string | null;
  method?: string | null;
  severity?: LogSeverity;
}

/**
 * บันทึก 1 เหตุการณ์ลง access_logs ครบทุกมิติ
 * ออกแบบให้ "ไม่ throw" — การบันทึก log ห้ามทำให้ business flow ล้ม
 */
export async function logEvent(opts: LogEventOptions): Promise<void> {
  try {
    const pool = getPool();
    const severity = opts.severity || severityForAction(opts.action);
    await pool.query(
      `INSERT INTO access_logs
         (student_id, action, performed_by, esp32_response, notes, details,
          room_code, method, ip_address, user_agent, severity)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        opts.studentId ?? null,
        opts.action,
        opts.performedBy ?? null,
        opts.esp32Response ?? null,
        opts.notes ?? null,
        opts.details ?? null,
        (opts.room && opts.room.trim()) || "default",
        opts.method ?? null,
        opts.ip ?? null,
        opts.userAgent ? opts.userAgent.slice(0, 300) : null,
        severity,
      ]
    );
  } catch (e) {
    console.error("[access-log] failed to write log:", opts.action, e);
  }
}

/** สะดวก: บันทึก log โดยดึง ip/userAgent จาก request ให้อัตโนมัติ */
export async function logEventFromRequest(
  req: Request,
  opts: Omit<LogEventOptions, "ip" | "userAgent">
): Promise<void> {
  const ctx = getRequestContext(req);
  return logEvent({ ...opts, ip: ctx.ip, userAgent: ctx.userAgent });
}
