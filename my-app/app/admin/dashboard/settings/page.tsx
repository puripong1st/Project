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
      <div className="premium-card" style={{ padding: 24, textAlign: "left" }}>
        <h3 style={{ fontSize: 16.5, fontWeight: 900, color: "var(--text-primary)", borderBottom: "1px solid var(--border)", paddingBottom: 12, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
          ⚙️ ตั้งค่าลิงก์ Discord Webhook กลางและบำรุงรักษาระบบ (Central System Discord Setup & Purge)
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 24 }}>
          {/* Form config discord webhooks */}
          <div style={{ borderRight: "1px solid var(--border)", paddingRight: 24 }}>
            <span style={{ fontSize: 13, fontWeight: 900, color: "var(--smartaccess-purple-dark)", display: "block", marginBottom: 14 }}>
              🔔 ตั้งค่า Discord Webhook ส่วนกลาง (Central Notification Webhooks)
            </span>
            <p style={{ color: "var(--text-secondary)", fontSize: 11.5, marginBottom: 18, lineHeight: "1.4" }}>
              กำหนด Webhook ส่วนกลางสำหรับการรับข่าวสารเมื่อห้องนั้นๆ ไม่ได้ตั้ง Discord Webhook แยกเฉพาะห้องไว้
            </p>

            <form onSubmit={handleSaveSettings} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {[
                { label: "คำขอลงทะเบียนเข้าห้องใหม่", key: "discord_webhook_register" as const, type: "register" as const, placeholder: "https://discord.com/api/webhooks/..." },
                { label: "อนุมัติสิทธิ์ / เปิดประตูสำเร็จ", key: "discord_webhook_approve" as const, type: "approve" as const, placeholder: "https://discord.com/api/webhooks/..." },
                { label: "Log จราจร / ความปลอดภัย", key: "discord_webhook_logs" as const, type: "logs" as const, placeholder: "https://discord.com/api/webhooks/..." },
                { label: "Log การบำรุงรักษาระบบ / แอดมิน", key: "discord_webhook_admin_audit" as const, type: "admin_audit" as const, placeholder: "https://discord.com/api/webhooks/..." }
              ].map((field, idx) => (
                <div key={idx}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
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
                  padding: "10px 22px", borderRadius: 10, fontSize: 13, fontWeight: 800, alignSelf: "flex-end",
                  background: "linear-gradient(135deg, var(--smartaccess-purple) 0%, var(--edu-pink) 100%)",
                  color: "#fff", border: "none", cursor: "pointer", boxShadow: "0 4px 10px rgba(124,58,237,0.2)",
                  marginTop: 8
                }}
              >
                {settingsLoading ? "⏳ กำลังบันทึก..." : "💾 บันทึก Webhooks ส่วนกลาง"}
              </button>
            </form>
          </div>

          {/* Maintenance clean prune panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <span style={{ fontSize: 13, fontWeight: 900, color: "#DC2626", display: "block" }}>
              🛠️ การบำรุงรักษาและเคลียร์ประวัติจราจร (Log Pruning & Hardware Format)
            </span>

            <div style={{ padding: 14, background: "rgba(220,38,38,0.03)", border: "1px dashed rgba(220,38,38,0.25)", borderRadius: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#DC2626", display: "block" }}>พ.ร.บ. คอมพิวเตอร์ และนโยบายลบข้อมูล</span>
              <p style={{ color: "var(--text-secondary)", fontSize: 11.5, margin: "6px 0 0 0", lineHeight: "1.45" }}>
                ระบบจะเคลียร์ Log จราจรอัจฉริยะที่<strong>มีอายุเกิน 90 วันออกโดยอัตโนมัติ</strong>บน Startup เพื่อบำรุงรักษาพื้นที่ Supabase PostgreSQL ของคุณให้รันเสถียรที่สุด (PDPA Compliance)
              </p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <button
                onClick={async () => {
                  if (!confirm("ระบบจะบังคับสั่งงานเคลียร์ Log หมดอายุ (>90 วัน) ทันที ต้องการดำเนินการไหม?")) return;
                  try {
                    const r = await fetch("/api/system/logs/cleanup", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ type: "expired" })
                    });
                    const d = await r.json();
                    if (r.ok) {
                      showToast(`ลบและจัดสรรพื้นที่สำเร็จ: ลบข้อมูลเก่าสำเร็จ ${d.affectedRows} แถว`, "success");
                      fetchSystemStatus();
                      fetchAll();
                      fetchLogs();
                    } else {
                      showToast(d.error, "error");
                    }
                  } catch {
                    showToast("เกิดข้อผิดพลาดในการต่อเซิร์ฟเวอร์", "error");
                  }
                }}
                className="btn-danger-light"
                style={{ padding: "10px", width: "100%", borderRadius: 10, fontSize: 12.5, fontWeight: 700 }}
              >
                Prune Log หมดอายุทันที (&gt;90 วัน)
              </button>

              <button
                onClick={() => {
                  setConfirmPassword("");
                  setDeleteModalOpen(true);
                }}
                className="btn-danger"
                style={{
                  padding: "10px", width: "100%", borderRadius: 10, fontSize: 12.5, fontWeight: 800,
                  background: "linear-gradient(135deg, #EF4444 0%, #B91C1C 100%)",
                  color: "#fff", border: "none", cursor: "pointer", boxShadow: "0 4px 10px rgba(239,68,68,0.2)"
                }}
              >
                🔥 ล้างฐานข้อมูล Log จราจรทั้งหมดถาวร
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
