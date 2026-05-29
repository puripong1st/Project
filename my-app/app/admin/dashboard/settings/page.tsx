"use client";
import React, { useState } from "react";
import { useDashboard } from "../DashboardContext";

type ChannelType = "register" | "approve" | "logs" | "admin_audit";
type Provider = "discord" | "telegram" | "line";

const CHANNEL_ROWS: { label: string; type: ChannelType; icon: string }[] = [
  { label: "คำขอลงทะเบียนเข้าห้องใหม่", type: "register", icon: "📝" },
  { label: "อนุมัติสิทธิ์ / เปิดประตูสำเร็จ", type: "approve", icon: "🚪" },
  { label: "Log จราจร / ความปลอดภัย", type: "logs", icon: "📊" },
  { label: "Log การบำรุงรักษา / แอดมิน", type: "admin_audit", icon: "🛠️" },
];

const PROVIDERS: Record<Provider, { name: string; icon: string; color: string; tint: string }> = {
  discord: { name: "Discord", icon: "🟣", color: "#7C3AED", tint: "rgba(124,58,237,0.07)" },
  telegram: { name: "Telegram", icon: "✈️", color: "#229ED9", tint: "rgba(34,158,217,0.07)" },
  line: { name: "LINE", icon: "💬", color: "#06C755", tint: "rgba(6,199,85,0.07)" },
};

export default function SettingsPage() {
  const {
    isOwner,
    user,
    settings,
    setSettings,
    rawSettings,
    setRawSettings,
    handleSaveSettings,
    handleTestWebhook,
    settingsLoading,
  } = useDashboard();

  const [provider, setProvider] = useState<Provider>("discord");

  if (!user || !isOwner) return null;

  const raw = (k: string) => rawSettings[k] || "";
  const setRaw = (k: string, v: string) => setRawSettings((s: Record<string, string>) => ({ ...s, [k]: v }));

  const labelStyle: React.CSSProperties = { display: "block", fontSize: 12.5, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 };
  const tokenWrap: React.CSSProperties = { padding: 16, borderRadius: 12, marginBottom: 18 };
  const active = PROVIDERS[provider];

  // ── ค่าและคีย์ของช่องที่เลือก ──
  const tokenField =
    provider === "discord" ? null
    : provider === "telegram" ? { key: "telegram_bot_token", label: "Telegram Bot Token", ph: "123456789:ABCdef..." }
    : { key: "line_channel_token", label: "LINE Channel Access Token", ph: "long-lived channel access token..." };

  const rowFor = (t: ChannelType) => {
    if (provider === "discord") {
      const key = `discord_webhook_${t}` as "discord_webhook_register" | "discord_webhook_approve" | "discord_webhook_logs" | "discord_webhook_admin_audit";
      return {
        value: settings[key] || "",
        onChange: (v: string) => setSettings((s: typeof settings) => ({ ...s, [key]: v })),
        ph: "https://discord.com/api/webhooks/...",
        test: () => handleTestWebhook(settings[key], t),
      };
    }
    const key = provider === "telegram" ? `telegram_chat_${t}` : `line_target_${t}`;
    return {
      value: raw(key),
      onChange: (v: string) => setRaw(key, v),
      ph: provider === "telegram" ? "Chat ID เช่น -1001234567890" : "User/Group ID เช่น Uxxxx หรือ Cxxxx",
      test: () => provider === "telegram"
        ? handleTestWebhook("", t, "default", { channel: "telegram", botToken: raw("telegram_bot_token"), chatId: raw(`telegram_chat_${t}`) })
        : handleTestWebhook("", t, "default", { channel: "line", channelToken: raw("line_channel_token"), targetId: raw(`line_target_${t}`) }),
    };
  };

  return (
    <div className="animate-fade-in" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20, maxWidth: 760 }}>
      <div className="premium-card" style={{ padding: 28, textAlign: "left" }}>
        {/* Header */}
        <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: 16, marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, fontWeight: 900, color: "var(--text-primary)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            🔔 ศูนย์ตั้งค่าการแจ้งเตือน
          </h3>
          <p style={{ color: "var(--text-secondary)", fontSize: 12.5, margin: "6px 0 0", lineHeight: 1.5 }}>
            ตั้งค่าช่องทางแจ้งเตือนส่วนกลาง — เลือกได้หลายช่องทางพร้อมกัน ระบบจะส่งข้อความเดียวกันไปทุกช่องที่ตั้งไว้
            (override รายห้องตั้งได้ในการ์ดแต่ละห้อง แท็บ &quot;ห้องเรียน &amp; ESP32&quot;)
          </p>
        </div>

        {/* Provider segmented selector */}
        <div style={{ display: "flex", gap: 8, background: "var(--bg-primary)", padding: 6, borderRadius: 10, border: "1px solid var(--border)", marginBottom: 22 }}>
          {(Object.keys(PROVIDERS) as Provider[]).map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setProvider(p)}
              style={{
                flex: 1, padding: "10px 12px", borderRadius: 8, fontSize: 13, fontWeight: 800, cursor: "pointer",
                background: provider === p ? PROVIDERS[p].color : "transparent",
                color: provider === p ? "#fff" : "var(--text-secondary)",
                border: provider === p ? `1.5px solid ${PROVIDERS[p].color}` : "1.5px solid transparent",
                boxShadow: provider === p ? `0 6px 16px ${PROVIDERS[p].tint}` : "none",
                transition: "all 0.15s",
              }}
            >
              {PROVIDERS[p].icon} {PROVIDERS[p].name}
            </button>
          ))}
        </div>

        <form onSubmit={handleSaveSettings} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* คำอธิบายเฉพาะช่อง */}
          {provider === "telegram" && (
            <div style={{ ...tokenWrap, background: active.tint, border: `1px solid ${active.color}22` }}>
              <p style={{ color: "var(--text-secondary)", fontSize: 12, margin: 0, lineHeight: 1.55 }}>
                สร้างบอทกับ <b>@BotFather</b> เพื่อรับ <b>Bot Token</b> แล้วหา <b>Chat ID</b> ของกลุ่ม (เช่นผ่าน @userinfobot) จากนั้นเชิญบอทเข้ากลุ่ม — ฟรี ไม่จำกัดจำนวนข้อความ
              </p>
            </div>
          )}
          {provider === "line" && (
            <div style={{ ...tokenWrap, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)" }}>
              <p style={{ color: "#B45309", fontSize: 11.5, margin: 0, lineHeight: 1.55 }}>
                ⚠️ LINE Notify ปิดบริการแล้ว (มี.ค. 2025) ระบบจึงใช้ <b>LINE Messaging API</b> (push) ซึ่งฟรี <b>~500 ข้อความ/เดือน</b>
                — สร้าง Channel ใน LINE Developers Console เพื่อรับ Channel Access Token และใช้ User/Group ID เป็น Target
              </p>
            </div>
          )}

          {/* Token (Telegram/LINE) */}
          {tokenField && (
            <div>
              <label style={labelStyle}>{tokenField.label} *</label>
              <input className="smartaccess-input" type="text" placeholder={tokenField.ph} value={raw(tokenField.key)} onChange={e => setRaw(tokenField.key, e.target.value)} style={{ width: "100%", padding: "10px 14px", fontSize: 12.5 }} />
            </div>
          )}

          {/* 4 ช่องแจ้งเตือน */}
          {CHANNEL_ROWS.map((row) => {
            const f = rowFor(row.type);
            return (
              <div key={row.type}>
                <label style={labelStyle}>{row.icon} {row.label}</label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input className="smartaccess-input" type="text" placeholder={f.ph} value={f.value} onChange={e => f.onChange(e.target.value)} style={{ flex: 1, padding: "10px 14px", fontSize: 12.5 }} />
                  <button type="button" onClick={f.test} className="btn-ghost" style={{ padding: "10px 14px", fontSize: 11.5, borderRadius: 10, flexShrink: 0, fontWeight: 700 }}>
                    🧪 ทดสอบ
                  </button>
                </div>
              </div>
            );
          })}

          <button type="submit" disabled={settingsLoading} className="btn-success" style={{ padding: "11px 22px", borderRadius: 10, fontSize: 13, fontWeight: 800, alignSelf: "flex-start", background: "linear-gradient(135deg, var(--smartaccess-purple) 0%, var(--edu-pink) 100%)", color: "#fff", border: "none", cursor: "pointer", boxShadow: "0 4px 10px rgba(124,58,237,0.2)", marginTop: 8 }}>
            {settingsLoading ? "⏳ กำลังบันทึก..." : `💾 บันทึกการตั้งค่า ${active.name}`}
          </button>
        </form>
      </div>
    </div>
  );
}
