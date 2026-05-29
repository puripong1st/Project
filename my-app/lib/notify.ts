// lib/notify.ts — ตัวส่งแจ้งเตือนรวมศูนย์หลายช่องทาง (Discord + Telegram + LINE)
// สร้างข้อความ 1 ครั้งจาก lib/discord.ts แล้วกระจายไปยังทุกช่องที่ตั้งค่าไว้
import { getSystemSettings } from "./db";
import {
  buildEventMessage,
  sendDiscordChannels,
  notifyCategory,
  type DiscordEventType,
  type NotifyData,
  type DiscordEmbed,
} from "./discord";

const TELEGRAM_API = "https://api.telegram.org";
const LINE_PUSH_API = "https://api.line.me/v2/bot/message/push";

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// แปลง embed → ข้อความตัวอักษรล้วน (สำหรับ Telegram/LINE ที่ไม่รองรับ embed)
// ลบ backtick/markdown ของ Discord ออก และตัดความยาวกันเกิน limit
function formatPlainText(embed: DiscordEmbed): string {
  const clean = (v: string) => v.replace(/`/g, "").replace(/\*\*/g, "");
  const lines: string[] = [];
  lines.push(clean(embed.title));
  if (embed.description) lines.push(clean(embed.description));
  lines.push("");
  for (const f of embed.fields) {
    lines.push(`• ${clean(f.name)}: ${clean(f.value)}`);
  }
  if (embed.footer?.text) {
    lines.push("");
    lines.push(clean(embed.footer.text));
  }
  return lines.join("\n").slice(0, 4000);
}

// ── Resolver: room override → central fallback ──
type Cat = ReturnType<typeof notifyCategory>;

function resolveTelegramChat(settings: Record<string, string>, cat: Cat, room: string): string {
  const roomVal = room ? settings[`room_telegram_${cat.room}_${room}`] : "";
  const central = settings[`telegram_chat_${cat.central}`]
    || (cat.central === "admin_audit" ? settings["telegram_chat_logs"] : "");
  return (roomVal || central || "").trim();
}

function resolveLineTarget(settings: Record<string, string>, cat: Cat, room: string): string {
  const roomVal = room ? settings[`room_line_${cat.room}_${room}`] : "";
  const central = settings[`line_target_${cat.central}`]
    || (cat.central === "admin_audit" ? settings["line_target_logs"] : "");
  return (roomVal || central || "").trim();
}

export async function sendTelegram(botToken: string, chatId: string, text: string): Promise<{ ok: boolean; error?: string }> {
  try {
    let actualChatId = chatId.trim();
    let threadId: number | undefined = undefined;

    if (actualChatId.includes(":")) {
      const parts = actualChatId.split(":");
      actualChatId = parts[0].trim();
      const parsedThread = parseInt(parts[1].trim(), 10);
      if (!isNaN(parsedThread)) {
        threadId = parsedThread;
      }
    }

    const payload: Record<string, any> = {
      chat_id: actualChatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    };

    if (threadId !== undefined) {
      payload.message_thread_id = threadId;
    }

    const res = await fetch(`${TELEGRAM_API}/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      console.error("[Notify] Telegram API error response:", errBody);
      return {
        ok: false,
        error: errBody.description || `Telegram responded with status ${res.status}`,
      };
    }

    return { ok: true };
  } catch (error: any) {
    console.error("[Notify] Telegram send failed:", error);
    return { ok: false, error: error?.message || "Connection failed" };
  }
}

export async function sendLine(channelToken: string, to: string, text: string): Promise<boolean> {
  try {
    const res = await fetch(LINE_PUSH_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${channelToken}`,
      },
      body: JSON.stringify({
        to,
        messages: [{ type: "text", text: text.slice(0, 4900) }],
      }),
    });
    return res.ok;
  } catch (error) {
    console.error("[Notify] LINE push failed:", error);
    return false;
  }
}

/**
 * ส่งแจ้งเตือน 1 event ไปยังทุกช่องทางที่ตั้งค่าไว้ (Discord + Telegram + LINE)
 * คืนค่า boolean ของผล Discord เพื่อความเข้ากันได้กับ sendDiscordNotification เดิม
 */
export async function sendNotification(eventType: DiscordEventType, data: NotifyData): Promise<boolean> {
  let settings: Record<string, string> = {};
  try {
    settings = await getSystemSettings();
  } catch (error) {
    console.error("[Notify] Failed to load settings:", error);
  }

  const embed = buildEventMessage(eventType, data);
  if (!embed) return false;

  const cat = notifyCategory(eventType);
  const room = data.room ? data.room.trim() : "";

  // ── Telegram (HTML) ──
  const roomTgToken = room ? (settings[`room_telegram_bot_token_${room}`] || "").trim() : "";
  const tgToken = roomTgToken || (settings["telegram_bot_token"] || "").trim();
  const tgChat = tgToken ? resolveTelegramChat(settings, cat, room) : "";

  // ── LINE Messaging API (plain text) ──
  const roomLineToken = room ? (settings[`room_line_channel_token_${room}`] || "").trim() : "";
  const lineToken = roomLineToken || (settings["line_channel_token"] || "").trim();
  const lineTo = lineToken ? resolveLineTarget(settings, cat, room) : "";

  const plain = (tgChat || lineTo) ? formatPlainText(embed) : "";
  const tgText = (tgChat)
    ? `<b>${escapeHtml(embed.title)}</b>\n${escapeHtml(formatPlainText(embed).split("\n").slice(1).join("\n"))}`
    : "";

  const tasks: Promise<boolean>[] = [
    sendDiscordChannels(eventType, data, embed, settings),
  ];
  if (tgToken && tgChat) tasks.push(sendTelegram(tgToken, tgChat, tgText).then(r => r.ok));
  if (lineToken && lineTo) tasks.push(sendLine(lineToken, lineTo, plain));

  const results = await Promise.allSettled(tasks);
  // ผล Discord อยู่ index 0
  const discordResult = results[0];
  return discordResult.status === "fulfilled" ? discordResult.value : false;
}
