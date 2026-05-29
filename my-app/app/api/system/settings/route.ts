export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getSystemSettings, updateSystemSettings } from "@/lib/db";
import { getAdminFromCookie } from "@/lib/auth";
import { sendDiscordNotification } from "@/lib/discord";
import { withRateLimit } from "@/lib/rate-limit-middleware";
import { logEvent, getRequestContext } from "@/lib/access-log";

// GET /api/system/settings — ดึงค่าการตั้งค่าระบบทั้งหมด (เฉพาะ owner เท่านั้น)
export async function GET(req: NextRequest) {
  try {
    const rateLimitRes = await withRateLimit(req, "system_settings", 60, 60);
    if (!rateLimitRes.allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }
    const admin = await getAdminFromCookie();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (admin.role !== "owner") return NextResponse.json({ error: "Permission denied" }, { status: 403 });

    const settings = await getSystemSettings();
    return NextResponse.json(
      { settings },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("[System Settings] GET error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูลตั้งค่า" }, { status: 500 });
  }
}

// POST /api/system/settings — อัปเดตค่าการตั้งค่าระบบ (เฉพาะ owner เท่านั้น)
export async function POST(req: NextRequest) {
  try {
    const rateLimitRes = await withRateLimit(req, "system_settings", 60, 60);
    if (!rateLimitRes.allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }
    const admin = await getAdminFromCookie();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (admin.role !== "owner") return NextResponse.json({ error: "Permission denied" }, { status: 403 });

    const body = await req.json();
    const {
      auto_approve_enabled,
      auto_approve_start_time,
      auto_approve_end_time,
      auto_approve_days,
      discord_webhook_register,
      discord_webhook_approve,
      discord_webhook_logs,
      discord_webhook_admin_audit,
      auto_fill_enabled,
      auto_fill_mode,
      student_id_display_mode,
    } = body;

    const updates: Record<string, string> = {};

    // ชำระล้างและตรวจสอบข้อมูลเบื้องต้น
    if (student_id_display_mode !== undefined) {
      const mode = String(student_id_display_mode).trim();
      if (["full", "masked", "hidden"].includes(mode)) {
        updates.student_id_display_mode = mode;
      }
    }
    if (auto_approve_enabled !== undefined) {
      updates.auto_approve_enabled = auto_approve_enabled === "1" || auto_approve_enabled === true ? "1" : "0";
    }
    if (auto_fill_enabled !== undefined) {
      updates.auto_fill_enabled = auto_fill_enabled === "1" || auto_fill_enabled === true ? "1" : "0";
    }
    if (auto_fill_mode !== undefined) {
      const mode = String(auto_fill_mode).trim();
      if (["auto", "manual"].includes(mode)) {
        updates.auto_fill_mode = mode;
      }
    }
    if (auto_approve_start_time !== undefined) {
      const timeRegex = /^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
      if (auto_approve_start_time === "" || timeRegex.test(auto_approve_start_time)) {
        updates.auto_approve_start_time = auto_approve_start_time;
      }
    }
    if (auto_approve_end_time !== undefined) {
      const timeRegex = /^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
      if (auto_approve_end_time === "" || timeRegex.test(auto_approve_end_time)) {
        updates.auto_approve_end_time = auto_approve_end_time;
      }
    }
    if (auto_approve_days !== undefined) {
      // ป้องกันค่าแปลกปลอมกรองเอาเฉพาะ 0-6 คั่นด้วยจุลภาค
      const days = String(auto_approve_days).split(",").map(Number).filter(d => !isNaN(d) && d >= 0 && d <= 6).join(",");
      updates.auto_approve_days = days;
    }
    if (discord_webhook_register !== undefined) {
      updates.discord_webhook_register = String(discord_webhook_register).trim();
    }
    if (discord_webhook_approve !== undefined) {
      updates.discord_webhook_approve = String(discord_webhook_approve).trim();
    }
    if (discord_webhook_logs !== undefined) {
      updates.discord_webhook_logs = String(discord_webhook_logs).trim();
    }
    if (discord_webhook_admin_audit !== undefined) {
      updates.discord_webhook_admin_audit = String(discord_webhook_admin_audit).trim();
    }

    // อัปเดตการตั้งค่าเพิ่มเติม (custom settings) เช่น รายชื่อห้องเรียน และ IP แยกห้อง
    const { custom_settings } = body;
    
    const ALLOWED_SETTING_KEYS = [
      'discord_webhook_url',
      'discord_enabled',
      'auto_approve',
      'qr_expiry_seconds',
      'max_students_per_room',
      'configured_rooms',
      // Telegram (central): bot token + chat id ต่อช่อง
      'telegram_bot_token',
      'telegram_chat_register',
      'telegram_chat_approve',
      'telegram_chat_logs',
      'telegram_chat_admin_audit',
      // LINE Messaging API (central): channel token + target id ต่อช่อง
      'line_channel_token',
      'line_target_register',
      'line_target_approve',
      'line_target_logs',
      'line_target_admin_audit',
      // เพิ่มตาม business requirements (ห้องเรียน IP และ Webhooks แยกตามห้อง)
    ];

    if (custom_settings && typeof custom_settings === 'object') {
      for (const [key, value] of Object.entries(custom_settings)) {
        if (typeof key !== 'string' || typeof value !== 'string') {
          return NextResponse.json(
            { error: "รูปแบบข้อมูลไม่ถูกต้อง" },
            { status: 400 }
          );
        }

        // Whitelist check
        const isWhitelisted = ALLOWED_SETTING_KEYS.includes(key);
        const isDynamicRoomKey = key.startsWith("room_ip_") ||
                                 key.startsWith("room_webhook_register_") ||
                                 key.startsWith("room_webhook_approve_") ||
                                 key.startsWith("room_webhook_logs_") ||
                                 key.startsWith("room_telegram_bot_token_") ||
                                 key.startsWith("room_telegram_register_") ||
                                 key.startsWith("room_telegram_approve_") ||
                                 key.startsWith("room_telegram_logs_") ||
                                 key.startsWith("room_line_channel_token_") ||
                                 key.startsWith("room_line_register_") ||
                                 key.startsWith("room_line_approve_") ||
                                 key.startsWith("room_line_logs_");
        // per-room config keys: rcfg_{ROOM}_{setting}
        const isRcfgKey = /^rcfg_[a-zA-Z0-9_-]+_[a-zA-Z0-9_]+$/.test(key);

        if (!isWhitelisted && !isDynamicRoomKey && !isRcfgKey) {
          return NextResponse.json(
            { error: `Invalid setting key: ${key}` },
            { status: 400 }
          );
        }

        if (isDynamicRoomKey) {
          const roomPart = key.replace(/^(room_ip_|room_webhook_register_|room_webhook_approve_|room_webhook_logs_|room_telegram_bot_token_|room_telegram_register_|room_telegram_approve_|room_telegram_logs_|room_line_channel_token_|room_line_register_|room_line_approve_|room_line_logs_)/, "");
          if (!/^[a-zA-Z0-9_-]+$/.test(roomPart)) {
            return NextResponse.json(
              { error: `Invalid setting key format: ${key}` },
              { status: 400 }
            );
          }
        }

        // Value type/length validation
        const valStr = value.trim();

        // 1. Length check
        if (valStr.length >= 500) {
          return NextResponse.json(
            { error: `ข้อมูลยาวเกินกำหนดสำหรับคีย์ ${key} (สูงสุด 500 ตัวอักษร)` },
            { status: 400 }
          );
        }

        // V03 fix: strict domain allowlist for webhook URLs (prevent SSRF)
        if (key.includes("webhook") || key.includes("url")) {
          if (valStr !== "") {
            const ALLOWED_WEBHOOK_HOSTS = ["discord.com", "discordapp.com", "ptb.discord.com", "canary.discord.com"];
            try {
              const parsed = new URL(valStr);
              if (parsed.protocol !== "https:" || !ALLOWED_WEBHOOK_HOSTS.includes(parsed.hostname)) {
                return NextResponse.json(
                  { error: `Webhook URL ต้องเป็น Discord URL (discord.com) เท่านั้น` },
                  { status: 400 }
                );
              }
            } catch {
              return NextResponse.json(
                { error: `รูปแบบ URL ไม่ถูกต้องสำหรับคีย์ ${key}` },
                { status: 400 }
              );
            }
          }
        }

        // 3. Number check (reasonable range)
        if (key === "qr_expiry_seconds") {
          const num = parseInt(valStr, 10);
          if (isNaN(num) || num < 5 || num > 86400) {
            return NextResponse.json(
              { error: `qr_expiry_seconds ต้องเป็นตัวเลขระหว่าง 5 ถึง 86400 วินาที` },
              { status: 400 }
            );
          }
        } else if (key === "max_students_per_room") {
          const num = parseInt(valStr, 10);
          if (isNaN(num) || num < 1 || num > 10000) {
            return NextResponse.json(
              { error: `max_students_per_room ต้องเป็นตัวเลขระหว่าง 1 ถึง 10000` },
              { status: 400 }
            );
          }
        } else if (/^\d+$/.test(valStr)) {
          const num = parseInt(valStr, 10);
          if (num < 0 || num > 1000000) {
            return NextResponse.json(
              { error: `ค่าตัวเลขสำหรับคีย์ ${key} ไม่อยู่ในช่วงที่กำหนด` },
              { status: 400 }
            );
          }
        }

        updates[key] = valStr;
      }
    }

    // ดึงการตั้งค่าเดิมมาก่อนทำการบันทึกเพื่อนำมาเปรียบเทียบหาความแตกต่างอย่างละเอียด
    const oldSettings = await getSystemSettings().catch(() => ({} as Record<string, string>));

    await updateSystemSettings(updates);

    // ─── สร้าง Changelog แบบ "อ่านเข้าใจง่าย" (มนุษย์อ่านรู้เรื่อง) ───
    // แปลง key ดิบ → ป้ายภาษาไทย และจัดการกรณีพิเศษ (เพิ่ม/ลบห้อง, ตั้ง IP ห้อง)
    const FIELD_LABELS: Record<string, string> = {
      auto_approve_enabled: "อนุมัติอัตโนมัติ",
      auto_approve_start_time: "เวลาเริ่มอนุมัติอัตโนมัติ",
      auto_approve_end_time: "เวลาสิ้นสุดอนุมัติอัตโนมัติ",
      auto_approve_days: "วันที่อนุมัติอัตโนมัติ",
      qr_expiry_seconds: "อายุ QR (วินาที)",
      max_students_per_room: "จำนวนนักศึกษาสูงสุดต่อห้อง",
      student_id_display_mode: "โหมดแสดงรหัสนักศึกษา",
      discord_webhook_register: "Discord: ช่องลงทะเบียน",
      discord_webhook_approve: "Discord: ช่องอนุมัติ",
      discord_webhook_logs: "Discord: ช่อง Logs",
      discord_webhook_admin_audit: "Discord: ช่อง Audit",
      telegram_bot_token: "Telegram: Bot Token",
      line_channel_token: "LINE: Channel Token",
    };
    const labelFor = (key: string): string => {
      if (FIELD_LABELS[key]) return FIELD_LABELS[key];
      if (key === "configured_rooms") return "รายชื่อห้องในระบบ";
      if (key.startsWith("room_ip_")) return `IP ของห้อง ${key.replace("room_ip_", "")}`;
      if (key.startsWith("room_webhook_register_")) return `Discord ลงทะเบียน (ห้อง ${key.replace("room_webhook_register_", "")})`;
      if (key.startsWith("room_webhook_approve_")) return `Discord อนุมัติ (ห้อง ${key.replace("room_webhook_approve_", "")})`;
      if (key.startsWith("room_webhook_logs_")) return `Discord Logs (ห้อง ${key.replace("room_webhook_logs_", "")})`;
      if (key.startsWith("room_telegram_")) return `Telegram (ห้อง ${key.replace(/^room_telegram_[a-z_]*?_/, "")})`;
      if (key.startsWith("room_line_")) return `LINE (ห้อง ${key.replace(/^room_line_[a-z_]*?_/, "")})`;
      if (key.startsWith("rcfg_")) return `ตั้งค่ารายห้อง (${key.replace("rcfg_", "")})`;
      return key;
    };

    const changedFields: string[] = [];
    for (const [key, newValue] of Object.entries(updates)) {
      const oldValue = oldSettings[key] || "";
      if (oldValue === newValue) continue;

      // กรณีพิเศษ: รายชื่อห้อง — สรุปเป็น "เพิ่มห้อง / ลบห้อง" ให้อ่านง่าย
      if (key === "configured_rooms") {
        const before = new Set(oldValue.split(",").map((r) => r.trim()).filter(Boolean));
        const after = new Set(newValue.split(",").map((r) => r.trim()).filter(Boolean));
        const added = [...after].filter((r) => !before.has(r));
        const removed = [...before].filter((r) => !after.has(r));
        if (added.length) changedFields.push(`• ➕ เพิ่มห้อง: ${added.join(", ")}`);
        if (removed.length) changedFields.push(`• ➖ ลบห้อง: ${removed.join(", ")}`);
        changedFields.push(`• 🏫 ห้องทั้งหมดในระบบตอนนี้: ${[...after].join(", ") || "(ไม่มี)"}`);
        continue;
      }

      // บดบังข้อมูลสำคัญ (Mask sensitive info)
      const isSensitive = key.includes("token") || key.includes("webhook") || key.includes("secret") || key.includes("url");
      let displayOld = oldValue.trim() === "" ? "(ว่าง)" : oldValue;
      let displayNew = newValue.trim() === "" ? "(ว่าง)" : newValue;
      if (isSensitive) {
        displayOld = oldValue.trim() !== "" ? `${oldValue.substring(0, 8)}…` : "(ว่าง)";
        displayNew = newValue.trim() !== "" ? `${newValue.substring(0, 8)}…` : "(ว่าง)";
      }

      changedFields.push(`• ${labelFor(key)}: ${displayOld} ➔ ${displayNew}`);
    }

    const changelogText = changedFields.length > 0
      ? `รายการที่เปลี่ยนแปลง:\n${changedFields.join("\n")}`
      : "อัปเดตการตั้งค่าระบบ (ไม่มีการเปลี่ยนแปลงค่าจริง)";

    // บันทึก log ในระบบอย่างละเอียด (เก็บ IP/อุปกรณ์/severity ผ่าน helper)
    const { ip, userAgent } = getRequestContext(req);
    await logEvent({
      action: "settings_updated",
      performedBy: admin.id,
      ip,
      userAgent,
      notes: `อัปเดตการตั้งค่าระบบโดยแอดมิน: ${admin.full_name}\n${changelogText}`,
      severity: "info",
    });

    // ยิงแจ้งเตือนเข้าระบบ Discord/Telegram/LINE logs พร้อมรายละเอียดความเปลี่ยนแปลง
    try {
      await sendDiscordNotification("settings_updated", {
        adminName: admin.full_name,
        ip,
        userAgent,
        reason: changelogText,
      }).catch((err) => console.error("[Settings Notification] failed:", err));
    } catch {}

    return NextResponse.json({ success: true, message: "บันทึกการตั้งค่าระบบเรียบร้อยแล้ว" });
  } catch (error) {
    console.error("[System Settings] POST error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการบันทึกข้อมูลตั้งค่า" }, { status: 500 });
  }
}
