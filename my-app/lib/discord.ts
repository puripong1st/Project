// lib/discord.ts — Discord webhook notifications
const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || "";

export type DiscordEventType =
  | "student_registered"
  | "student_approved"
  | "student_rejected"
  | "door_opened"
  | "door_failed"
  | "esp32_offline";

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

export async function sendDiscordNotification(
  eventType: DiscordEventType,
  data: {
    studentName?: string;
    studentId?: string;
    faculty?: string;
    branch?: string;
    year?: number;
    adminName?: string;
    reason?: string;
    esp32Response?: string;
  }
): Promise<boolean> {
  if (!WEBHOOK_URL) {
    console.warn("[Discord] DISCORD_WEBHOOK_URL not set");
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

  let embed: DiscordEmbed;

  switch (eventType) {
    case "student_registered":
      embed = {
        title: "📝 นักศึกษาลงทะเบียนใหม่",
        description: `มีนักศึกษาลงทะเบียนขอเข้าห้องใหม่ รอการอนุมัติ`,
        color: COLORS.info,
        fields: [
          { name: "👤 ชื่อ-นามสกุล", value: data.studentName || "-", inline: true },
          { name: "🎓 รหัสนักศึกษา", value: data.studentId || "-", inline: true },
          { name: "📚 ชั้นปี", value: `ปีที่ ${data.year || "-"}`, inline: true },
          { name: "🏛️ คณะ", value: data.faculty || "-", inline: true },
          { name: "📖 สาขา", value: data.branch || "-", inline: true },
          { name: "⏰ เวลา", value: now, inline: false },
        ],
        footer: { text: "ระบบ RMUTP Door Access" },
        timestamp: new Date().toISOString(),
      };
      break;

    case "student_approved":
      embed = {
        title: "✅ อนุมัติและเปิดประตูสำเร็จ",
        description: `Admin ได้อนุมัตินักศึกษาและสั่งเปิดประตูแล้ว`,
        color: COLORS.success,
        fields: [
          { name: "👤 นักศึกษา", value: data.studentName || "-", inline: true },
          { name: "🎓 รหัส", value: data.studentId || "-", inline: true },
          { name: "👨‍💼 อนุมัติโดย", value: data.adminName || "-", inline: true },
          { name: "🚪 ESP32", value: data.esp32Response || "สั่งเปิดประตูแล้ว", inline: false },
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
          { name: "👨‍💼 ปฏิเสธโดย", value: data.adminName || "-", inline: true },
          { name: "📝 เหตุผล", value: data.reason || "ไม่ระบุ", inline: false },
          { name: "⏰ เวลา", value: now, inline: false },
        ],
        footer: { text: "ระบบ RMUTP Door Access" },
        timestamp: new Date().toISOString(),
      };
      break;

    case "door_opened":
      embed = {
        title: "🚪 ประตูเปิดแล้ว",
        description: `ระบบสั่งเปิดประตูสำเร็จ`,
        color: COLORS.success,
        fields: [
          { name: "👤 นักศึกษา", value: data.studentName || "-", inline: true },
          { name: "📡 ESP32", value: data.esp32Response || "OK", inline: true },
          { name: "⏰ เวลา", value: now, inline: false },
        ],
        footer: { text: "ระบบ RMUTP Door Access" },
        timestamp: new Date().toISOString(),
      };
      break;

    case "door_failed":
      embed = {
        title: "⚠️ เปิดประตูไม่สำเร็จ",
        description: `ไม่สามารถส่งคำสั่งไปยัง ESP32 ได้`,
        color: COLORS.warning,
        fields: [
          { name: "👤 นักศึกษา", value: data.studentName || "-", inline: true },
          { name: "❌ ข้อผิดพลาด", value: data.esp32Response || "Timeout", inline: true },
          { name: "⏰ เวลา", value: now, inline: false },
        ],
        footer: { text: "ระบบ RMUTP Door Access" },
        timestamp: new Date().toISOString(),
      };
      break;

    case "esp32_offline":
      embed = {
        title: "🔴 ESP32 ออฟไลน์",
        description: `ไม่สามารถติดต่อ ESP32 ได้ กรุณาตรวจสอบการเชื่อมต่อ`,
        color: COLORS.error,
        fields: [
          { name: "⏰ เวลา", value: now, inline: false },
        ],
        footer: { text: "ระบบ RMUTP Door Access" },
        timestamp: new Date().toISOString(),
      };
      break;
  }

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "RMUTP Door Access",
        avatar_url: "https://www.rmutp.ac.th/wp-content/uploads/2020/11/logo-rmutp.png",
        embeds: [embed!],
      }),
    });
    return response.ok;
  } catch (error) {
    console.error("[Discord] Webhook failed:", error);
    return false;
  }
}
