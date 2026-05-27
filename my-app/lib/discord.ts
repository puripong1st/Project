// lib/discord.ts — Discord webhook notifications
import { getSystemSettings } from "./db";

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
  | "admin_login_failed";

interface DiscordEmbed {
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

export async function sendDiscordNotification(
  eventType: DiscordEventType,
  data: {
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
  }
): Promise<boolean> {
  // Load dynamic webhook URLs from database
  let targetWebhookUrl = "";
  let logWebhookUrl = "";
  
  try {
    const settings = await getSystemSettings();
    const sanitizedRoom = data.room ? data.room.trim() : "";
    
    // ─── [IoT Cloud Room-Specific 3-Channel Webhook Routing] ───
    // ค้นหาและแยกแยะช่องทาง Webhook ของห้องปฏิบัติการเป้าหมายตามประเภทกิจกรรม
    if (sanitizedRoom) {
      const roomRegWebhook = settings[`room_webhook_register_${sanitizedRoom}`] || "";
      const roomApproveWebhook = settings[`room_webhook_approve_${sanitizedRoom}`] || "";
      const roomLogsWebhook = settings[`room_webhook_logs_${sanitizedRoom}`] || "";

      // 1. กำหนด Webhook ประจำกิจกรรมระบบ
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
        eventType === "admin_login_failed"
      ) {
        targetWebhookUrl = roomLogsWebhook || settings.discord_webhook_logs || settings.discord_webhook_admin_audit || "";
      }

      // 2. กำหนด Webhook ประจำ Log จราจร/ความปลอดภัยอย่างละเอียด
      logWebhookUrl = roomLogsWebhook || settings.discord_webhook_logs || "";
      
      console.log(`[Discord Cloud] Routed room '${sanitizedRoom}' event '${eventType}' to: targetUrl=${targetWebhookUrl ? 'Configured' : 'Global Fallback'}, logUrl=${logWebhookUrl ? 'Configured' : 'Global Fallback'}`);
    } else {
      // หากไม่มีข้อมูลห้องเรียนเป้าหมาย ให้ Fallback ไปยังกิจกรรมส่วนกลาง
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
        eventType === "admin_login_failed"
      ) {
        targetWebhookUrl = settings.discord_webhook_admin_audit || settings.discord_webhook_logs || "";
      }
      logWebhookUrl = settings.discord_webhook_logs || "";
    }
  } catch (error) {
    console.error("[Discord] Failed to fetch settings from DB, using env fallback", error);
  }

  // Fallback to environment variable if database configuration is missing
  if (!targetWebhookUrl) {
    targetWebhookUrl = WEBHOOK_URL;
  }

  if (!targetWebhookUrl && !logWebhookUrl) {
    console.warn("[Discord] Webhook URL and Log Webhook URL are not set");
    return false;
  }

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
        footer: { text: "ระบบ RMUTP Door Access" },
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
        footer: { text: "ระบบ RMUTP Door Access" },
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
        footer: { text: "ระบบ RMUTP Door Access" },
        timestamp: new Date().toISOString(),
      };
      break;

    case "door_opened":
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
          ...(data.reason ? [{ name: "ℹ️ รายละเอียด / สิทธิ์ Bypass", value: data.reason, inline: false }] : []),
          { name: "⏰ เวลา", value: now, inline: false },
        ],
        footer: { text: "ระบบ RMUTP Door Access" },
        timestamp: new Date().toISOString(),
      };
      break;
  
    case "door_failed":
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
          ...(data.reason ? [{ name: "ℹ️ รายละเอียด / สิทธิ์ Bypass", value: data.reason, inline: false }] : []),
          { name: "⏰ เวลา", value: now, inline: false },
        ],
        footer: { text: "ระบบ RMUTP Door Access" },
        timestamp: new Date().toISOString(),
      };
      break;

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
        footer: { text: "ระบบ RMUTP Door Access" },
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
        footer: { text: "RMUTP Admin Audit Log" },
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
        footer: { text: "RMUTP Admin Audit Log" },
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
        footer: { text: "RMUTP Admin Audit Log — Security Alert" },
        timestamp: new Date().toISOString(),
      };
      break;
    }
  }

  // แทรกแท็กระบุห้องเรียนลงใน Embed ก่อนทำการส่ง เพื่อความชัดเจนและเรียบร้อยใน Discord
  if (data.room && embed) {
    embed.fields.push({ name: "🚪 ห้องเรียน", value: data.room, inline: true });
  }

  let success = false;

  // Send to the specific event target Webhook URL
  if (targetWebhookUrl) {
    try {
      const response = await fetch(targetWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "RMUTP Door Access",
          avatar_url: "https://www.rmutp.ac.th/wp-content/uploads/2020/11/logo-rmutp.png",
          embeds: [embed!],
        }),
      });
      success = response.ok;
    } catch (error) {
      console.error("[Discord] Target Webhook failed:", error);
    }
  }

  // Send to the comprehensive Audit Log Webhook URL
  if (logWebhookUrl) {
    try {
      await fetch(logWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "RMUTP Audit Log Bot",
          avatar_url: "https://www.rmutp.ac.th/wp-content/uploads/2020/11/logo-rmutp.png",
          content: `📊 **[SYSTEM LOG]** ตรวจพบเหตุการณ์ประเภท \`${eventType}\``,
          embeds: [embed!],
        }),
      });
    } catch (error) {
      console.error("[Discord] Log Webhook failed:", error);
    }
  }

  return success;

}
