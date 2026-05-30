"use client";
import React, { useState, ReactNode } from "react";
import {
  FileText,
  DoorOpen,
  BarChart3,
  Wrench,
  MessageCircle,
  Send,
  MessageSquare,
  Bell,
  CheckCircle2,
  Circle,
  Key,
  FlaskConical,
  Loader2,
  Save,
} from "lucide-react";
import { useDashboard } from "../DashboardContext";

type ChannelType = "register" | "approve" | "logs" | "admin_audit";
type Provider = "discord" | "telegram" | "line";

const CHANNEL_ROWS: { label: string; type: ChannelType; icon: ReactNode }[] = [
  { label: "คำขอลงทะเบียนเข้าห้องใหม่", type: "register", icon: <FileText size={14} /> },
  { label: "อนุมัติสิทธิ์ / เปิดประตูสำเร็จ", type: "approve", icon: <DoorOpen size={14} /> },
  { label: "Log จราจร / ความปลอดภัย", type: "logs", icon: <BarChart3 size={14} /> },
  { label: "Log การบำรุงรักษา / แอดมิน", type: "admin_audit", icon: <Wrench size={14} /> },
];

const PROVIDERS: Record<Provider, { name: string; icon: ReactNode; color: string; tint: string }> = {
  discord: { name: "Discord", icon: <MessageCircle size={16} />, color: "#7C3AED", tint: "rgba(124,58,237,0.07)" },
  telegram: { name: "Telegram", icon: <Send size={16} />, color: "#229ED9", tint: "rgba(34,158,217,0.07)" },
  line: { name: "LINE", icon: <MessageSquare size={16} />, color: "#06C755", tint: "rgba(6,199,85,0.07)" },
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
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!user || !isOwner) return null;

  const raw = (k: string) => rawSettings[k] || "";
  const setRaw = (k: string, v: string) => setRawSettings((s: Record<string, string>) => ({ ...s, [k]: v }));

  // ── สถานะการตั้งค่าแต่ละช่อง ──
  const isConfigured = (p: Provider): boolean => {
    if (p === "discord") return ["register", "approve", "logs", "admin_audit"].some(t => (settings[`discord_webhook_${t}` as keyof typeof settings] as string)?.trim());
    if (p === "telegram") return !!raw("telegram_bot_token").trim();
    return !!raw("line_channel_token").trim();
  };

  const labelStyle: React.CSSProperties = { display: "block", fontSize: 12.5, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 };
  const active = PROVIDERS[provider];

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

  const configuredCount = (["discord", "telegram", "line"] as Provider[]).filter(isConfigured).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await handleSaveSettings(e);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      // handled globally
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20, maxWidth: 780 }}>
      <div className="premium-card" style={{ padding: 0, overflow: "hidden" }}>
        {/* Header แถบสีแบรนด์ */}
        <div style={{ padding: "22px 28px", background: "linear-gradient(135deg, rgba(124,58,237,0.08), rgba(219,39,119,0.05))", borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 900, color: "var(--text-primary)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <Bell size={18} /> ศูนย์ตั้งค่าการแจ้งเตือน
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: 12.5, margin: "6px 0 0", lineHeight: 1.5, maxWidth: 540 }}>
                ส่งข้อความเดียวกันไปยังทุกช่องที่เปิดไว้พร้อมกัน — ตั้ง override รายห้องได้ที่แท็บ &quot;ห้องเรียน &amp; ESP32&quot;
              </p>
            </div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 999, background: configuredCount > 0 ? "rgba(16,185,129,0.12)" : "rgba(148,163,184,0.15)", border: `1px solid ${configuredCount > 0 ? "rgba(16,185,129,0.35)" : "var(--border)"}`, color: configuredCount > 0 ? "#059669" : "var(--text-secondary)", fontSize: 12, fontWeight: 800, whiteSpace: "nowrap" }}>
              {configuredCount > 0 ? <CheckCircle2 size={13} /> : <Circle size={13} />} เปิดใช้ {configuredCount}/3 ช่องทาง
            </div>
          </div>
        </div>

        <div style={{ padding: "22px 28px 28px" }}>
          {/* Provider segmented selector + สถานะ */}
          <div style={{ display: "flex", gap: 8, background: "var(--bg-primary)", padding: 6, borderRadius: 12, border: "1px solid var(--border)", marginBottom: 22 }}>
            {(Object.keys(PROVIDERS) as Provider[]).map(p => {
              const on = isConfigured(p);
              const sel = provider === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setProvider(p)}
                  style={{
                    flex: 1, padding: "11px 12px", borderRadius: 9, fontSize: 13, fontWeight: 800, cursor: "pointer",
                    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
                    background: sel ? PROVIDERS[p].color : "transparent",
                    color: sel ? "#fff" : "var(--text-secondary)",
                    border: sel ? `1.5px solid ${PROVIDERS[p].color}` : "1.5px solid transparent",
                    boxShadow: sel ? `0 6px 16px ${PROVIDERS[p].tint}` : "none",
                    transition: "all 0.15s",
                  }}
                >
                  {PROVIDERS[p].icon} {PROVIDERS[p].name}
                  <span title={on ? "ตั้งค่าแล้ว" : "ยังไม่ตั้งค่า"} style={{ width: 8, height: 8, borderRadius: 999, background: on ? "#22C55E" : (sel ? "rgba(255,255,255,0.5)" : "var(--border-medium)"), flexShrink: 0 }} />
                </button>
              );
            })}
          </div>

          {/* การ์ดของช่องที่เลือก */}
          <div style={{ borderRadius: 14, border: `1px solid ${active.color}33`, overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: active.tint, borderBottom: `1px solid ${active.color}22` }}>
              <span style={{ fontSize: 18 }}>{active.icon}</span>
              <span style={{ fontSize: 14, fontWeight: 900, color: active.color }}>{active.name}</span>
              <span style={{ marginLeft: "auto", fontSize: 11.5, fontWeight: 700, color: isConfigured(provider) ? "#059669" : "var(--text-muted)" }}>
                {isConfigured(provider) ? "● พร้อมใช้งาน" : "○ ยังไม่ตั้งค่า"}
              </span>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16, padding: 18 }}>
              {/* คำอธิบายเฉพาะช่อง */}
              {provider === "telegram" && (
                <p style={{ color: "var(--text-secondary)", fontSize: 12, margin: 0, lineHeight: 1.55, background: active.tint, padding: "10px 14px", borderRadius: 10 }}>
                  สร้างบอทกับ <b>@BotFather</b> รับ <b>Bot Token</b> แล้วหา <b>Chat ID</b> ของกลุ่ม (เช่นผ่าน @userinfobot) จากนั้นเชิญบอทเข้ากลุ่ม — ฟรี ไม่จำกัดจำนวนข้อความ
                </p>
              )}
              {provider === "line" && (
                <p style={{ color: "#B45309", fontSize: 11.5, margin: 0, lineHeight: 1.55, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", padding: "10px 14px", borderRadius: 10 }}>
                  LINE Notify ปิดบริการแล้ว (มี.ค. 2025) ระบบใช้ <b>LINE Messaging API</b> (push) ฟรี <b>~500 ข้อความ/เดือน</b> — สร้าง Channel ใน LINE Developers Console รับ Channel Access Token และใช้ User/Group ID เป็น Target
                </p>
              )}

              {/* Token (Telegram/LINE) */}
              {tokenField && (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "8px 0 2px 0" }}>
                    <span style={{ fontSize: 11, fontWeight: 900, color: "var(--smartaccess-purple)", letterSpacing: "1px", textTransform: "uppercase" }}>🔑 Credentials & Access Keys</span>
                    <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                  </div>
                  <div style={{ background: active.tint, padding: "12px 14px", borderRadius: 10, border: `1px solid ${active.color}22` }}>
                    <label style={labelStyle}><span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Key size={13} /> {tokenField.label} *</span></label>
                    <input className="smartaccess-input" type="text" placeholder={tokenField.ph} value={raw(tokenField.key)} onChange={e => setRaw(tokenField.key, e.target.value)} style={{ width: "100%", padding: "10px 14px", fontSize: 12.5 }} />
                  </div>
                </>
              )}

              {/* Event destinations header */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "8px 0 2px 0" }}>
                <span style={{ fontSize: 11, fontWeight: 900, color: "var(--smartaccess-purple)", letterSpacing: "1px", textTransform: "uppercase" }}>🔔 Webhook & Message Routing</span>
                <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
              </div>

              {/* 4 ช่องแจ้งเตือน */}
              {CHANNEL_ROWS.map((row) => {
                const f = rowFor(row.type);
                const filled = !!f.value?.trim();
                return (
                  <div key={row.type}>
                    <label style={labelStyle}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <span style={{ width: 7, height: 7, borderRadius: 999, background: filled ? "#22C55E" : "var(--border-medium)" }} />
                        {row.icon} {row.label}
                      </span>
                    </label>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input className="smartaccess-input" type="text" placeholder={f.ph} value={f.value} onChange={e => f.onChange(e.target.value)} style={{ flex: 1, padding: "10px 14px", fontSize: 12.5 }} />
                      <button type="button" onClick={f.test} className="btn-ghost" style={{ padding: "10px 14px", fontSize: 11.5, borderRadius: 10, flexShrink: 0, fontWeight: 700, borderColor: `${active.color}66`, color: active.color, display: "inline-flex", alignItems: "center", gap: 6 }}>
                        <FlaskConical size={13} /> ทดสอบ
                      </button>
                    </div>
                  </div>
                );
              })}

              <button
                type="submit"
                disabled={settingsLoading}
                className="btn-success"
                style={{
                  padding: "12px 22px",
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 800,
                  alignSelf: "flex-start",
                  background: "linear-gradient(135deg, var(--smartaccess-purple) 0%, var(--edu-pink) 100%)",
                  color: "#fff",
                  border: "none",
                  cursor: "pointer",
                  boxShadow: "0 6px 16px rgba(124,58,237,0.25)",
                  marginTop: 4,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                {settingsLoading ? (
                  <><Loader2 size={14} className="animate-spin" /> กำลังบันทึก...</>
                ) : saveSuccess ? (
                  <span className="animate-scale-in" style={{ color: "#FFF", display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <CheckCircle2 size={14} /> บันทึกการตั้งค่าสำเร็จ!
                  </span>
                ) : (
                  <><Save size={14} /> บันทึกการตั้งค่า {active.name}</>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
