// lib/discord.ts — Discord webhook notifications + shared event-message builder
const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || "";

export type DiscordEventType =
  | "student_registered"
  | "student_approved"
  | "student_rejected"
  | "door_opened"
  | "door_failed"
  | "esp32_offline"
  | "admin_login"
  | "admin_logout"
  | "admin_login_failed"
  | "firmware_deployed"
  | "firmware_ota_triggered"
  | "settings_updated"
  | "admin_modified"
  | "pdf_exported"
  | "security_alert"
  | "system_summary";

export interface DiscordEmbed {
  title: string;
  description: string;
  color: number;
  fields: { name: string; value: string; inline?: boolean }[];
  footer?: { text: string };
  timestamp?: string;
}

const COLORS = {
  info: 0x3498db,      // Blue
  success: 0x2ecc71,   // Green
  warning: 0xf39c12,   // Orange
  error: 0xe74c3c,     // Red
  purple: 0x9b59b6,    // Purple
};

function parseUserAgent(ua: string): { browser: string; device: string } {
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

export interface NotifyData {
  studentName?: string;
  studentId?: string;
  faculty?: string;
  branch?: string;
  year?: number;
  adminName?: string;
  adminUsername?: string;
  adminRole?: string;
  reason?: string;
  esp32Response?: string;
  room?: string;
  ip?: string;
  userAgent?: string;
  firmwareVersion?: string;
  firmwareChecksum?: string;
  firmwareSize?: number;
  previousVersion?: string;
  // สำหรับ security_alert
  alertTitle?: string;
  alertDetail?: string;
  // สำหรับ system_summary (สรุปรายวัน/สัปดาห์)
  summary?: {
    period: string;        // เช่น "วันนี้ (29 พ.ค. 2026)" หรือ "7 วันล่าสุด"
    total: number;
    doorOpened: number;
    doorFailed: number;
    registered: number;
    approved: number;
    rejected: number;
    bypassRateLimited: number;
    loginFailed: number;
    critical: number;
    topRoom?: string;
  };
}

/**
 * แมป event → หมวดหมู่ช่องแจ้งเตือน
 * - `central`: คีย์ช่องกลาง (มี admin_audit แยกสำหรับ event ของแอดมิน/เฟิร์มแวร์)
 * - `room`: คีย์ override รายห้อง (มีแค่ 3 หมวด: register/approve/logs)
 */
export function notifyCategory(eventType: DiscordEventType): {
  central: "register" | "approve" | "logs" | "admin_audit";
  room: "register" | "approve" | "logs";
} {
  if (eventType === "student_registered") return { central: "register", room: "register" };
  if (
    eventType === "student_approved" ||
    eventType === "student_rejected" ||
    eventType === "door_opened" ||
    eventType === "door_failed"
  ) {
    return { central: "approve", room: "approve" };
  }
  if (eventType === "esp32_offline" || eventType === "security_alert") return { central: "logs", room: "logs" };
  // admin_login / admin_logout / admin_login_failed / firmware_* / system_summary
  return { central: "admin_audit", room: "logs" };
}

/**
 * Entry point เดิม (callers ทั้งหมดเรียกตัวนี้) — delegate ไปยัง dispatcher รวมศูนย์
 * lib/notify.ts ที่ส่งทั้ง Discord + Telegram + LINE
 * ใช้ dynamic import เพื่อตัด circular dependency (notify.ts import จาก discord.ts)
 */
export async function sendDiscordNotification(
  eventType: DiscordEventType,
  data: NotifyData
): Promise<boolean> {
  const { sendNotification } = await import("./notify");
  return sendNotification(eventType, data);
}

/**
 * สร้าง embed/ข้อความตามประเภท event (ใช้ร่วมกันทุกช่องทาง)
 */
export function buildEventMessage(
  eventType: DiscordEventType,
  data: NotifyData
): DiscordEmbed | undefined {
  const now = new Date().toLocaleString("th-TH", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  let embed: DiscordEmbed | undefined;

  switch (eventType) {
    case "student_registered": {
      const deviceInfo = parseUserAgent(data.userAgent || "");
      embed = {
        title: "📝 นักศึกษาลงทะเบียนใหม่",
        description: `มีนักศึกษาลงทะเบียนขอเข้าห้องใหม่ รอเจ้าหน้าที่อนุมัติ`,
        color: COLORS.info,
        fields: [
          { name: "👤 ชื่อ-นามสกุล", value: data.studentName || "-", inline: true },
          { name: "🎓 รหัสนักศึกษา", value: data.studentId || "-", inline: true },
          { name: "📚 ชั้นปี", value: `ปีที่ ${data.year || "-"}`, inline: true },
          { name: "🏛️ คณะ", value: data.faculty || "-", inline: true },
          { name: "📖 สาขา", value: data.branch || "-", inline: true },
          { name: "🚪 ขอสิทธิ์เข้าห้อง", value: data.room || "-", inline: true },
          { name: "🌐 IP ผู้ขอสิทธิ์", value: `\`${data.ip || "ไม่ทราบ"}\``, inline: true },
          { name: "💻 อุปกรณ์", value: deviceInfo.device, inline: true },
          { name: "🌍 Browser", value: deviceInfo.browser, inline: true },
          { name: "⏰ เวลา", value: now, inline: false },
        ],
        footer: { text: "ระบบ SmartAccess Door Access" },
        timestamp: new Date().toISOString(),
      };
      break;
    }

    case "student_approved":
      embed = {
        title: "✅ อนุมัติและเปิดประตูสำเร็จ",
        description: `Admin ได้อนุมัตินักศึกษาและสั่งเปิดประตูแล้ว`,
        color: COLORS.success,
        fields: [
          { name: "👤 นักศึกษา", value: data.studentName || "-", inline: true },
          { name: "🎓 รหัส", value: data.studentId || "-", inline: true },
          { name: "📚 คณะ/สาขา", value: `${data.faculty || "-"} / ${data.branch || "-"} (ปี ${data.year || "-"})`, inline: false },
          { name: "👨‍💼 อนุมัติโดย", value: data.adminName || "-", inline: true },
          { name: "🚪 ห้องปฏิบัติการ", value: data.room || "-", inline: true },
          { name: "🚪 ESP32 Response", value: `\`${data.esp32Response || "สั่งเปิดประตูสำเร็จ"}\``, inline: false },
          { name: "⏰ เวลา", value: now, inline: false },
        ],
        footer: { text: "ระบบ SmartAccess Door Access" },
        timestamp: new Date().toISOString(),
      };
      break;

    case "student_rejected":
      embed = {
        title: "❌ ปฏิเสธคำขอเข้าห้อง",
        description: `Admin ได้ปฏิเสธคำขอของนักศึกษา`,
        color: COLORS.error,
        fields: [
          { name: "👤 นักศึกษา", value: data.studentName || "-", inline: true },
          { name: "🎓 รหัส", value: data.studentId || "-", inline: true },
          { name: "📚 คณะ/สาขา", value: `${data.faculty || "-"} / ${data.branch || "-"} (ปี ${data.year || "-"})`, inline: false },
          { name: "👨‍💼 ปฏิเสธโดย", value: data.adminName || "-", inline: true },
          { name: "🚪 ห้องปฏิบัติการ", value: data.room || "-", inline: true },
          { name: "📝 เหตุผล", value: `\`${data.reason || "ไม่ระบุ"}\``, inline: false },
          { name: "⏰ เวลา", value: now, inline: false },
        ],
        footer: { text: "ระบบ SmartAccess Door Access" },
        timestamp: new Date().toISOString(),
      };
      break;

    case "door_opened": {
      const dev = parseUserAgent(data.userAgent || "");
      embed = {
        title: "🚪 ประตูเปิดแล้ว",
        description: data.reason ? `🔓 เข้าห้องสำเร็จด้วยสิทธิ์ Bypass` : `ระบบสั่งเปิดประตูสำเร็จ`,
        color: COLORS.success,
        fields: [
          { name: "👤 นักศึกษา / บุคคล", value: data.studentName || "-", inline: true },
          { name: "🎓 รหัสนักศึกษา", value: data.studentId || "-", inline: true },
          { name: "🚪 ห้องเรียน", value: data.room || "-", inline: true },
          { name: "📡 ESP32", value: `\`${data.esp32Response || "OK"}\``, inline: true },
          ...(data.adminName ? [{ name: "👨‍💼 ดำเนินการโดย", value: data.adminName, inline: true }] : []),
          ...(data.ip ? [{ name: "🌐 IP Address", value: `\`${data.ip}\``, inline: true }] : []),
          ...(data.userAgent ? [{ name: "💻 อุปกรณ์", value: dev.device, inline: true }, { name: "🌍 Browser", value: dev.browser, inline: true }] : []),
          ...(data.reason ? [{ name: "ℹ️ รายละเอียด / สิทธิ์ Bypass", value: data.reason, inline: false }] : []),
          { name: "⏰ เวลา", value: now, inline: false },
        ],
        footer: { text: "ระบบ SmartAccess Door Access" },
        timestamp: new Date().toISOString(),
      };
      break;
    }

    case "door_failed": {
      const dev = parseUserAgent(data.userAgent || "");
      embed = {
        title: "⚠️ เปิดประตูไม่สำเร็จ",
        description: data.reason ? `❌ เปิดประตูด้วยสิทธิ์ Bypass ล้มเหลว` : `ไม่สามารถส่งคำสั่งไปยัง ESP32 ได้`,
        color: COLORS.warning,
        fields: [
          { name: "👤 นักศึกษา / บุคคล", value: data.studentName || "-", inline: true },
          { name: "🎓 รหัสนักศึกษา", value: data.studentId || "-", inline: true },
          { name: "🚪 ห้องเรียน", value: data.room || "-", inline: true },
          { name: "❌ ข้อผิดพลาด", value: `\`${data.esp32Response || "Timeout"}\``, inline: false },
          ...(data.ip ? [{ name: "🌐 บอร์ด IP", value: `\`${data.ip}\``, inline: true }] : []),
          ...(data.userAgent ? [{ name: "💻 อุปกรณ์", value: dev.device, inline: true }, { name: "🌍 Browser", value: dev.browser, inline: true }] : []),
          ...(data.reason ? [{ name: "ℹ️ รายละเอียด / สิทธิ์ Bypass", value: data.reason, inline: false }] : []),
          { name: "⏰ เวลา", value: now, inline: false },
        ],
        footer: { text: "ระบบ SmartAccess Door Access" },
        timestamp: new Date().toISOString(),
      };
      break;
    }

    case "esp32_offline":
      embed = {
        title: "🔴 ESP32 ออฟไลน์",
        description: `ไม่สามารถติดต่อ ESP32 ได้ (Heartbeat Timeout)`,
        color: COLORS.error,
        fields: [
          { name: "🚪 ห้องเรียนที่ขาดติดต่อ", value: data.room || "-", inline: true },
          { name: "🌐 IP Address บอร์ด", value: `\`${data.ip || "ไม่ระบุ"}\``, inline: true },
          { name: "⏰ เวลา", value: now, inline: false },
        ],
        footer: { text: "ระบบ SmartAccess Door Access" },
        timestamp: new Date().toISOString(),
      };
      break;

    case "admin_login": {
      const roleLabel = data.adminRole === "owner"
        ? "👑 Owner (ผู้ดูแลสูงสุด)"
        : data.adminRole === "log_viewer"
          ? "📊 Log Viewer (ดูประวัติอย่างเดียว)"
          : "🔑 Door Operator";
      const deviceInfo = parseUserAgent(data.userAgent || "");
      embed = {
        title: "🔐 แอดมินเข้าสู่ระบบ",
        description: `**${data.adminName || data.adminUsername || "-"}** เข้าสู่ระบบสำเร็จ`,
        color: COLORS.purple,
        fields: [
          { name: "👤 ชื่อ-นามสกุล", value: data.adminName || "-", inline: true },
          { name: "🏷️ Username", value: `\`${data.adminUsername || "-"}\``, inline: true },
          { name: "🎭 ตำแหน่ง", value: roleLabel, inline: true },
          { name: "🌐 IP Address", value: `\`${data.ip || "ไม่ทราบ"}\``, inline: true },
          { name: "💻 อุปกรณ์", value: deviceInfo.device, inline: true },
          { name: "🌍 Browser", value: deviceInfo.browser, inline: true },
          { name: "⏰ เวลาเข้าสู่ระบบ", value: now, inline: false },
        ],
        footer: { text: "SmartAccess Admin Audit Log" },
        timestamp: new Date().toISOString(),
      };
      break;
    }

    case "admin_logout": {
      const roleLabel = data.adminRole === "owner"
        ? "👑 Owner (ผู้ดูแลสูงสุด)"
        : data.adminRole === "log_viewer"
          ? "📊 Log Viewer (ดูประวัติอย่างเดียว)"
          : "🔑 Door Operator";
      embed = {
        title: "🚪 แอดมินออกจากระบบ",
        description: `**${data.adminName || data.adminUsername || "-"}** ออกจากระบบแล้ว`,
        color: COLORS.info,
        fields: [
          { name: "👤 ชื่อ-นามสกุล", value: data.adminName || "-", inline: true },
          { name: "🏷️ Username", value: `\`${data.adminUsername || "-"}\``, inline: true },
          { name: "🎭 ตำแหน่ง", value: roleLabel, inline: true },
          { name: "🌐 IP Address", value: `\`${data.ip || "ไม่ทราบ"}\``, inline: true },
          { name: "⏰ เวลาออกจากระบบ", value: now, inline: false },
        ],
        footer: { text: "SmartAccess Admin Audit Log" },
        timestamp: new Date().toISOString(),
      };
      break;
    }

    case "admin_login_failed": {
      const deviceInfo = parseUserAgent(data.userAgent || "");
      embed = {
        title: "⚠️ พยายามเข้าสู่ระบบล้มเหลว",
        description: `มีการพยายามล็อกอินด้วย Username **\`${data.adminUsername || "-"}\`** แต่ไม่สำเร็จ`,
        color: COLORS.warning,
        fields: [
          { name: "🏷️ Username ที่ใช้", value: `\`${data.adminUsername || "-"}\``, inline: true },
          { name: "🌐 IP Address", value: `\`${data.ip || "ไม่ทราบ"}\``, inline: true },
          { name: "💻 อุปกรณ์", value: deviceInfo.device, inline: true },
          { name: "🌍 Browser", value: deviceInfo.browser, inline: true },
          { name: "📝 เหตุผล", value: data.reason || "Username หรือ Password ไม่ถูกต้อง", inline: false },
          { name: "⏰ เวลา", value: now, inline: false },
        ],
        footer: { text: "SmartAccess Admin Audit Log — Security Alert" },
        timestamp: new Date().toISOString(),
      };
      break;
    }

    case "firmware_deployed":
      embed = {
        title: "🚀 ปล่อยเฟิร์มแวร์ใหม่แล้ว (OTA Deployed)",
        description: `แอดมินเปิดตัวเฟิร์มแวร์รุ่นใหม่สำหรับบอร์ด ESP32 ทุกตัว บอร์ดจะได้รับการอัปเดตโดยอัตโนมัติในรอบ Polling ถัดไป`,
        color: COLORS.purple,
        fields: [
          { name: "📦 เวอร์ชันใหม่", value: `\`v${data.firmwareVersion || "-"}\``, inline: true },
          { name: "👨‍💼 อัปโหลดโดย", value: data.adminName || "-", inline: true },
          { name: "🔐 MD5 Checksum", value: `\`${data.firmwareChecksum || "-"}\``, inline: false },
          { name: "📏 ขนาดไฟล์", value: data.firmwareSize ? `${(data.firmwareSize / 1024).toFixed(1)} KB` : "-", inline: true },
          { name: "⏰ เวลาปล่อยอัปเดต", value: now, inline: true },
        ],
        footer: { text: "SmartAccess OTA Firmware Control Center" },
        timestamp: new Date().toISOString(),
      };
      break;

    case "firmware_ota_triggered":
      embed = {
        title: "⬇️ ESP32 กำลังดาวน์โหลดเฟิร์มแวร์ใหม่",
        description: `บอร์ด ESP32 ตรวจพบเวอร์ชันใหม่และเริ่มดาวน์โหลดอัตโนมัติผ่าน Cloud HTTPS OTA`,
        color: COLORS.info,
        fields: [
          { name: "🔄 เวอร์ชันเก่า", value: `\`v${data.previousVersion || "?"}\``, inline: true },
          { name: "📦 เวอร์ชันใหม่", value: `\`v${data.firmwareVersion || "-"}\``, inline: true },
          { name: "🚪 ห้องปฏิบัติการ", value: data.room || "-", inline: true },
          { name: "🌐 IP บอร์ด", value: `\`${data.ip || "ไม่ทราบ"}\``, inline: true },
          { name: "🔐 MD5 Checksum", value: `\`${data.firmwareChecksum || "-"}\``, inline: false },
          { name: "⏰ เวลาเริ่มดาวน์โหลด", value: now, inline: false },
        ],
        footer: { text: "SmartAccess OTA Firmware Control Center" },
        timestamp: new Date().toISOString(),
      };
      break;

    case "settings_updated":
      embed = {
        title: "⚙️ อัปเดตการตั้งค่าระบบเสร็จสมบูรณ์",
        description: `มีการแก้ไขข้อมูลตัวแปรระบบและการตั้งค่าโดยแอดมิน`,
        color: COLORS.warning,
        fields: [
          { name: "👨‍💼 ดำเนินการโดย", value: data.adminName || "-", inline: true },
          { name: "🌐 IP Address", value: `\`${data.ip || "ไม่ทราบ"}\``, inline: true },
          { name: "📝 รายละเอียดการเปลี่ยนการตั้งค่า", value: data.reason || "ไม่มีการเปลี่ยนแปลงค่าสำคัญ", inline: false },
          { name: "⏰ เวลาดำเนินการ", value: now, inline: false },
        ],
        footer: { text: "SmartAccess System Settings Log" },
        timestamp: new Date().toISOString(),
      };
      break;

    case "admin_modified":
      embed = {
        title: "👥 บันทึกการจัดการสิทธิ์แอดมิน (Admin User Audit)",
        description: `มีการสร้าง แก้ไข หรือถอนสิทธิ์ผู้ดูแลระบบ/เจ้าหน้าที่ดำเนินการ`,
        color: COLORS.purple,
        fields: [
          { name: "👨‍💼 ดำเนินการโดย", value: data.adminName || "-", inline: true },
          { name: "🌐 IP Address", value: `\`${data.ip || "ไม่ทราบ"}\``, inline: true },
          { name: "📝 รายละเอียดการทำรายการ", value: data.reason || "-", inline: false },
          { name: "⏰ เวลาดำเนินการ", value: now, inline: false },
        ],
        footer: { text: "SmartAccess Security Directory Logs" },
        timestamp: new Date().toISOString(),
      };
      break;

    case "pdf_exported":
      embed = {
        title: "📥 ส่งออกรายงานระบบสำเร็จ (PDF Report Exported)",
        description: `มีผู้ดูแลระบบทำการส่งออกเอกสารรายงานข้อมูลความปลอดภัย PDF ของระบบ`,
        color: COLORS.success,
        fields: [
          { name: "👨‍💼 ผู้ส่งออกรายงาน", value: `${data.adminName || "-"} (Username: ${data.adminUsername || "-"})`, inline: true },
          { name: "🛡️ สิทธิ์การใช้งาน (Role)", value: data.adminRole || "-", inline: true },
          { name: "🌐 IP Address", value: `\`${data.ip || "ไม่ทราบ"}\``, inline: true },
          { name: "📝 รายละเอียดการส่งออก", value: data.reason || "-", inline: false },
          { name: "⏰ เวลาดำเนินการ", value: now, inline: false },
        ],
        footer: { text: "SmartAccess Security Report Center" },
        timestamp: new Date().toISOString(),
      };
      break;

    case "security_alert": {
      const dev = parseUserAgent(data.userAgent || "");
      embed = {
        title: `🚨 ${data.alertTitle || "แจ้งเตือนความปลอดภัย"}`,
        description: data.alertDetail || "ตรวจพบเหตุการณ์ที่ควรตรวจสอบด้านความปลอดภัย",
        color: COLORS.error,
        fields: [
          ...(data.adminUsername ? [{ name: "🏷️ Username", value: `\`${data.adminUsername}\``, inline: true }] : []),
          ...(data.studentId ? [{ name: "🎓 รหัสนักศึกษา", value: data.studentId, inline: true }] : []),
          ...(data.room ? [{ name: "🚪 ห้องเรียน", value: data.room, inline: true }] : []),
          { name: "🌐 IP Address", value: `\`${data.ip || "ไม่ทราบ"}\``, inline: true },
          ...(data.userAgent ? [{ name: "💻 อุปกรณ์", value: dev.device, inline: true }, { name: "🌍 Browser", value: dev.browser, inline: true }] : []),
          ...(data.reason ? [{ name: "📝 รายละเอียด", value: data.reason, inline: false }] : []),
          { name: "⏰ เวลา", value: now, inline: false },
        ],
        footer: { text: "SmartAccess Security Alert" },
        timestamp: new Date().toISOString(),
      };
      break;
    }

    case "system_summary": {
      const s = data.summary;
      embed = {
        title: "📊 รายงานสรุปการใช้งานระบบ",
        description: s ? `สรุปเหตุการณ์ช่วง **${s.period}**` : "สรุปการใช้งานระบบ",
        color: COLORS.info,
        fields: s
          ? [
              { name: "📈 เหตุการณ์ทั้งหมด", value: `${s.total}`, inline: true },
              { name: "🚪 เปิดประตูสำเร็จ", value: `${s.doorOpened}`, inline: true },
              { name: "⚠️ เปิดประตูล้มเหลว", value: `${s.doorFailed}`, inline: true },
              { name: "📝 ลงทะเบียนใหม่", value: `${s.registered}`, inline: true },
              { name: "✅ อนุมัติ", value: `${s.approved}`, inline: true },
              { name: "❌ ปฏิเสธ", value: `${s.rejected}`, inline: true },
              { name: "🛑 Bypass ถี่เกิน", value: `${s.bypassRateLimited}`, inline: true },
              { name: "🔐 ล็อกอินล้มเหลว", value: `${s.loginFailed}`, inline: true },
              { name: "🚨 เหตุ critical", value: `${s.critical}`, inline: true },
              ...(s.topRoom ? [{ name: "🏆 ห้องที่ใช้งานมากสุด", value: s.topRoom, inline: false }] : []),
              { name: "⏰ สร้างรายงานเมื่อ", value: now, inline: false },
            ]
          : [{ name: "⏰ เวลา", value: now, inline: false }],
        footer: { text: "SmartAccess Periodic Summary" },
        timestamp: new Date().toISOString(),
      };
      break;
    }
  }

  // แทรกแท็กระบุห้องเรียนลงใน Embed ก่อนทำการส่ง เพื่อความชัดเจนและเรียบร้อยใน Discord
  if (data.room && embed) {
    embed.fields.push({ name: "🚪 ห้องเรียน", value: data.room, inline: true });
  }

  return embed;
}

/**
 * ส่ง Discord (target webhook + audit log webhook) — ตรรกะเดิมทุกประการ
 * แยกออกมาให้ dispatcher (lib/notify.ts) เรียกใช้
 */
export async function sendDiscordChannels(
  eventType: DiscordEventType,
  data: NotifyData,
  embed: DiscordEmbed,
  settings: Record<string, string>
): Promise<boolean> {
  let targetWebhookUrl = "";
  let logWebhookUrl = "";

  const sanitizedRoom = data.room ? data.room.trim() : "";

  // ─── [IoT Cloud Room-Specific 3-Channel Webhook Routing] ───
  if (sanitizedRoom) {
    const roomRegWebhook = settings[`room_webhook_register_${sanitizedRoom}`] || "";
    const roomApproveWebhook = settings[`room_webhook_approve_${sanitizedRoom}`] || "";
    const roomLogsWebhook = settings[`room_webhook_logs_${sanitizedRoom}`] || "";

    if (eventType === "student_registered") {
      targetWebhookUrl = roomRegWebhook || settings.discord_webhook_register || "";
    } else if (
      eventType === "student_approved" ||
      eventType === "student_rejected" ||
      eventType === "door_opened" ||
      eventType === "door_failed"
    ) {
      targetWebhookUrl = roomApproveWebhook || settings.discord_webhook_approve || "";
    } else if (
      eventType === "esp32_offline" ||
      eventType === "admin_login" ||
      eventType === "admin_logout" ||
      eventType === "admin_login_failed" ||
      eventType === "firmware_deployed" ||
      eventType === "firmware_ota_triggered"
    ) {
      targetWebhookUrl = roomLogsWebhook || settings.discord_webhook_logs || settings.discord_webhook_admin_audit || "";
    }

    logWebhookUrl = roomLogsWebhook || settings.discord_webhook_logs || "";
  } else {
    if (eventType === "student_registered") {
      targetWebhookUrl = settings.discord_webhook_register || "";
    } else if (
      eventType === "student_approved" ||
      eventType === "student_rejected" ||
      eventType === "door_opened" ||
      eventType === "door_failed"
    ) {
      targetWebhookUrl = settings.discord_webhook_approve || "";
    } else if (
      eventType === "admin_login" ||
      eventType === "admin_logout" ||
      eventType === "admin_login_failed" ||
      eventType === "firmware_deployed" ||
      eventType === "firmware_ota_triggered"
    ) {
      targetWebhookUrl = settings.discord_webhook_admin_audit || settings.discord_webhook_logs || "";
    }
    logWebhookUrl = settings.discord_webhook_logs || "";
  }

  // Fallback to environment variable if database configuration is missing
  if (!targetWebhookUrl) {
    targetWebhookUrl = WEBHOOK_URL;
  }

  if (!targetWebhookUrl && !logWebhookUrl) {
    return false;
  }

  let success = false;

  if (targetWebhookUrl) {
    try {
      const response = await fetch(targetWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "SmartAccess Door Access",
          avatar_url: "https://www.rmutp.ac.th/icon/favicon-96x96.png",
          embeds: [embed],
        }),
      });
      success = response.ok;
    } catch (error) {
      console.error("[Discord] Target Webhook failed:", error);
    }
  }

  if (logWebhookUrl && logWebhookUrl !== targetWebhookUrl) {
    try {
      await fetch(logWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "SmartAccess Audit Log Bot",
          avatar_url: "https://www.rmutp.ac.th/icon/favicon-96x96.png",
          content: `📊 **[SYSTEM LOG]** ตรวจพบเหตุการณ์ประเภท \`${eventType}\``,
          embeds: [embed],
        }),
      });
    } catch (error) {
      console.error("[Discord] Log Webhook failed:", error);
    }
  }

  return success;
}
