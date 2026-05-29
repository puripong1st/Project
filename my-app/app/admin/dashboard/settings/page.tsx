"use client";
import React from "react";
import { useDashboard } from "../DashboardContext";

export default function SettingsPage() {
  const {
    isOwner,
    user,
    settings,
    setSettings,
    handleSaveSettings,
    handleTestWebhook,
    settingsLoading,
    setConfirmPassword,
    setDeleteModalOpen,
    showToast,
    fetchSystemStatus,
    fetchAll,
    fetchLogs
  } = useDashboard();

  if (!user || !isOwner) return null;

  return (
    <div className="animate-fade-in" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>
      <div className="premium-card" style={{ padding: 28, textAlign: "left" }}>
        <h3 style={{ fontSize: 16.5, fontWeight: 900, color: "var(--text-primary)", borderBottom: "1px solid var(--border)", paddingBottom: 12, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
          ⚙️ ตั้งค่าลิงก์ Discord Webhook กลาง (Central System Discord Webhook Setup)
        </h3>

        <div>
          <span style={{ fontSize: 13, fontWeight: 900, color: "var(--smartaccess-purple-dark)", display: "block", marginBottom: 14 }}>
            🔔 ตั้งค่า Discord Webhook ส่วนกลาง (Central Notification Webhooks)
          </span>
          <p style={{ color: "var(--text-secondary)", fontSize: 12, marginBottom: 18, lineHeight: "1.4" }}>
            กำหนด Webhook ส่วนกลางสำหรับการรับข่าวสารเมื่อห้องนั้นๆ ไม่ได้ตั้ง Discord Webhook แยกเฉพาะห้องไว้
          </p>

          <form onSubmit={handleSaveSettings} style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 640 }}>
            {[
              { label: "คำขอลงทะเบียนเข้าห้องใหม่", key: "discord_webhook_register" as const, type: "register" as const, placeholder: "https://discord.com/api/webhooks/..." },
              { label: "อนุมัติสิทธิ์ / เปิดประตูสำเร็จ", key: "discord_webhook_approve" as const, type: "approve" as const, placeholder: "https://discord.com/api/webhooks/..." },
              { label: "Log จราจร / ความปลอดภัย", key: "discord_webhook_logs" as const, type: "logs" as const, placeholder: "https://discord.com/api/webhooks/..." },
              { label: "Log การบำรุงรักษาระบบ / แอดมิน", key: "discord_webhook_admin_audit" as const, type: "admin_audit" as const, placeholder: "https://discord.com/api/webhooks/..." }
            ].map((field, idx) => (
              <div key={idx}>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                  {field.label} *
                </label>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input
                    className="smartaccess-input"
                    type="text"
                    placeholder={field.placeholder}
                    value={settings[field.key] || ""}
                    onChange={e => setSettings((s: any) => ({ ...s, [field.key]: e.target.value }))}
                    style={{ flex: 1, padding: "8px 12px", fontSize: 12.5 }}
                  />
                  <button
                    type="button"
                    onClick={() => handleTestWebhook(settings[field.key], field.type)}
                    className="btn-ghost"
                    style={{ padding: "8px 12px", fontSize: 11.5, borderRadius: 8, flexShrink: 0, fontWeight: 700 }}
                  >
                    ทดสอบ
                  </button>
                </div>
              </div>
            ))}

            <button
              type="submit"
              disabled={settingsLoading}
              className="btn-success"
              style={{
                padding: "10px 22px", borderRadius: 10, fontSize: 13, fontWeight: 800, alignSelf: "flex-start",
                background: "linear-gradient(135deg, var(--smartaccess-purple) 0%, var(--edu-pink) 100%)",
                color: "#fff", border: "none", cursor: "pointer", boxShadow: "0 4px 10px rgba(124,58,237,0.2)",
                marginTop: 8
              }}
            >
              {settingsLoading ? "⏳ กำลังบันทึก..." : "💾 บันทึก Webhooks ส่วนกลาง"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
