"use client";
import React from "react";
import { useDashboard } from "../DashboardContext";

type ChannelType = "register" | "approve" | "logs" | "admin_audit";

const CHANNEL_ROWS: { label: string; type: ChannelType }[] = [
  { label: "คำขอลงทะเบียนเข้าห้องใหม่", type: "register" },
  { label: "อนุมัติสิทธิ์ / เปิดประตูสำเร็จ", type: "approve" },
  { label: "Log จราจร / ความปลอดภัย", type: "logs" },
  { label: "Log การบำรุงรักษาระบบ / แอดมิน", type: "admin_audit" },
];

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

  if (!user || !isOwner) return null;

  const raw = (k: string) => rawSettings[k] || "";
  const setRaw = (k: string, v: string) => setRawSettings((s: Record<string, string>) => ({ ...s, [k]: v }));

  const cardStyle: React.CSSProperties = { padding: 28, textAlign: "left" };
  const headingStyle: React.CSSProperties = { fontSize: 16.5, fontWeight: 900, color: "var(--text-primary)", borderBottom: "1px solid var(--border)", paddingBottom: 12, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 };
  const labelStyle: React.CSSProperties = { display: "block", fontSize: 12.5, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 };
  const saveBtnStyle: React.CSSProperties = { padding: "10px 22px", borderRadius: 10, fontSize: 13, fontWeight: 800, alignSelf: "flex-start", background: "linear-gradient(135deg, var(--smartaccess-purple) 0%, var(--edu-pink) 100%)", color: "#fff", border: "none", cursor: "pointer", boxShadow: "0 4px 10px rgba(124,58,237,0.2)", marginTop: 8 };

  return (
    <div className="animate-fade-in" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>
      {/* ─── Discord ─── */}
      <div className="premium-card" style={cardStyle}>
        <h3 style={headingStyle}>⚙️ ตั้งค่าลิงก์ Discord Webhook กลาง (Central System Discord Webhook Setup)</h3>
        <div>
          <span style={{ fontSize: 13, fontWeight: 900, color: "var(--smartaccess-purple-dark)", display: "block", marginBottom: 14 }}>
            🔔 ตั้งค่า Discord Webhook ส่วนกลาง (Central Notification Webhooks)
          </span>
          <p style={{ color: "var(--text-secondary)", fontSize: 12, marginBottom: 18, lineHeight: "1.4" }}>
            กำหนด Webhook ส่วนกลางสำหรับการรับข่าวสารเมื่อห้องนั้นๆ ไม่ได้ตั้ง Discord Webhook แยกเฉพาะห้องไว้
          </p>
          <form onSubmit={handleSaveSettings} style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 640 }}>
            {[
              { label: "คำขอลงทะเบียนเข้าห้องใหม่", key: "discord_webhook_register" as const, type: "register" as const },
              { label: "อนุมัติสิทธิ์ / เปิดประตูสำเร็จ", key: "discord_webhook_approve" as const, type: "approve" as const },
              { label: "Log จราจร / ความปลอดภัย", key: "discord_webhook_logs" as const, type: "logs" as const },
              { label: "Log การบำรุงรักษาระบบ / แอดมิน", key: "discord_webhook_admin_audit" as const, type: "admin_audit" as const },
            ].map((field, idx) => (
              <div key={idx}>
                <label style={labelStyle}>{field.label} *</label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    className="smartaccess-input"
                    type="text"
                    placeholder="https://discord.com/api/webhooks/..."
                    value={settings[field.key] || ""}
                    onChange={e => setSettings((s: typeof settings) => ({ ...s, [field.key]: e.target.value }))}
                    style={{ flex: 1, padding: "8px 12px", fontSize: 12.5 }}
                  />
                  <button type="button" onClick={() => handleTestWebhook(settings[field.key], field.type)} className="btn-ghost" style={{ padding: "8px 12px", fontSize: 11.5, borderRadius: 8, flexShrink: 0, fontWeight: 700 }}>
                    ทดสอบ
                  </button>
                </div>
              </div>
            ))}
            <button type="submit" disabled={settingsLoading} className="btn-success" style={saveBtnStyle}>
              {settingsLoading ? "⏳ กำลังบันทึก..." : "💾 บันทึก Webhooks ส่วนกลาง"}
            </button>
          </form>
        </div>
      </div>

      {/* ─── Telegram ─── */}
      <div className="premium-card" style={cardStyle}>
        <h3 style={headingStyle}>✈️ ตั้งค่าแจ้งเตือนผ่าน Telegram (Telegram Bot Notifications)</h3>
        <p style={{ color: "var(--text-secondary)", fontSize: 12, marginBottom: 14, lineHeight: "1.5" }}>
          สร้างบอทกับ <b>@BotFather</b> เพื่อรับ <b>Bot Token</b> แล้วหา <b>Chat ID</b> ของกลุ่ม/ห้องแชต (เช่นผ่าน @userinfobot)
          จากนั้นเชิญบอทเข้ากลุ่ม — ฟรี ไม่จำกัดจำนวนข้อความ
        </p>
        <form onSubmit={handleSaveSettings} style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 640 }}>
          <div>
            <label style={labelStyle}>Telegram Bot Token *</label>
            <input className="smartaccess-input" type="text" placeholder="123456789:ABCdef..." value={raw("telegram_bot_token")} onChange={e => setRaw("telegram_bot_token", e.target.value)} style={{ width: "100%", padding: "8px 12px", fontSize: 12.5 }} />
          </div>
          {CHANNEL_ROWS.map((row) => {
            const key = `telegram_chat_${row.type}`;
            return (
              <div key={key}>
                <label style={labelStyle}>Chat ID — {row.label}</label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input className="smartaccess-input" type="text" placeholder="-1001234567890 หรือ 123456789" value={raw(key)} onChange={e => setRaw(key, e.target.value)} style={{ flex: 1, padding: "8px 12px", fontSize: 12.5 }} />
                  <button type="button" onClick={() => handleTestWebhook("", row.type, "default", { channel: "telegram", botToken: raw("telegram_bot_token"), chatId: raw(key) })} className="btn-ghost" style={{ padding: "8px 12px", fontSize: 11.5, borderRadius: 8, flexShrink: 0, fontWeight: 700 }}>
                    ทดสอบ
                  </button>
                </div>
              </div>
            );
          })}
          <button type="submit" disabled={settingsLoading} className="btn-success" style={saveBtnStyle}>
            {settingsLoading ? "⏳ กำลังบันทึก..." : "💾 บันทึกการตั้งค่า Telegram"}
          </button>
        </form>
      </div>

      {/* ─── LINE ─── */}
      <div className="premium-card" style={cardStyle}>
        <h3 style={headingStyle}>💬 ตั้งค่าแจ้งเตือนผ่าน LINE (LINE Messaging API)</h3>
        <p style={{ color: "var(--text-secondary)", fontSize: 12, marginBottom: 8, lineHeight: "1.5" }}>
          สร้าง <b>Messaging API Channel</b> ใน LINE Developers Console เพื่อรับ <b>Channel Access Token</b> และใช้ <b>User ID / Group ID</b> เป็น Target
          (LINE Notify ปิดบริการแล้วตั้งแต่ มี.ค. 2025)
        </p>
        <p style={{ color: "#B45309", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 8, padding: "8px 12px", fontSize: 11.5, marginBottom: 16, lineHeight: "1.5" }}>
          ⚠️ ข้อจำกัด LINE ฟรี: ส่งข้อความแบบ push ได้ ~500 ข้อความ/เดือน หากต้องการปริมาณมาก แนะนำใช้ Telegram หรือ Discord เป็นช่องหลัก
        </p>
        <form onSubmit={handleSaveSettings} style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 640 }}>
          <div>
            <label style={labelStyle}>LINE Channel Access Token *</label>
            <input className="smartaccess-input" type="text" placeholder="long-lived channel access token..." value={raw("line_channel_token")} onChange={e => setRaw("line_channel_token", e.target.value)} style={{ width: "100%", padding: "8px 12px", fontSize: 12.5 }} />
          </div>
          {CHANNEL_ROWS.map((row) => {
            const key = `line_target_${row.type}`;
            return (
              <div key={key}>
                <label style={labelStyle}>Target ID (User/Group) — {row.label}</label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input className="smartaccess-input" type="text" placeholder="Uxxxxxxxx หรือ Cxxxxxxxx" value={raw(key)} onChange={e => setRaw(key, e.target.value)} style={{ flex: 1, padding: "8px 12px", fontSize: 12.5 }} />
                  <button type="button" onClick={() => handleTestWebhook("", row.type, "default", { channel: "line", channelToken: raw("line_channel_token"), targetId: raw(key) })} className="btn-ghost" style={{ padding: "8px 12px", fontSize: 11.5, borderRadius: 8, flexShrink: 0, fontWeight: 700 }}>
                    ทดสอบ
                  </button>
                </div>
              </div>
            );
          })}
          <button type="submit" disabled={settingsLoading} className="btn-success" style={saveBtnStyle}>
            {settingsLoading ? "⏳ กำลังบันทึก..." : "💾 บันทึกการตั้งค่า LINE"}
          </button>
        </form>
      </div>
    </div>
  );
}
