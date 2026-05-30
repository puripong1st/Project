"use client";
import React from "react";
import { useDashboard } from "../DashboardContext";

export default function IotPage() {
  const {
    healthData,
    systemStatus,
    testingRoom,
    unlockingRoom,
    recentlyUnlockedRooms,
    testResults,
    handleOpenRoomDetails,
    handleTestConnection,
    handleDirectUnlockRoom
  } = useDashboard();

  return (
    <div className="animate-fade-in" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>
      <div className="premium-card" style={{ padding: 24 }}>
        <h3 style={{ fontSize: 16.5, fontWeight: 900, color: "var(--text-primary)", borderBottom: "1px solid var(--border)", paddingBottom: 12, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
          🌐 แผงตรวจสภาพฮาร์ดแวร์ & ประตูห้องเรียนอัจฉริยะ (ESP32 Live Controller Grid)
        </h3>

        {/* Health status banner */}
        {healthData && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 24, padding: 18, background: "rgba(124,58,237,0.02)", border: "1.5px dashed var(--border)", borderRadius: 12 }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 800, color: "var(--text-secondary)", display: "block" }}>API Health Status:</span>
              <span style={{
                fontSize: 13, fontWeight: 900, display: "inline-flex", alignItems: "center", gap: 5, marginTop: 4,
                color: healthData.status === "healthy" ? "#10B981" : healthData.status === "degraded" ? "#F59E0B" : "#EF4444"
              }}>
                <span
                  style={{ width: 8, height: 8, borderRadius: "50%", background: healthData.status === "healthy" ? "#10B981" : "#EF4444" }}
                  className={healthData.status === "healthy" ? "pulse-green" : "pulse-red"}
                />
                {healthData.status === "healthy" ? "ระบบปกติ (HEALTHY)" : "มีปัญหาบางส่วน (DEGRADED)"}
              </span>
            </div>
            <div>
              <span style={{ fontSize: 11, fontWeight: 800, color: "var(--text-secondary)", display: "block" }}>Supabase DB Latency:</span>
              <span style={{ fontSize: 13, fontWeight: 900, color: "var(--text-primary)", display: "inline-block", marginTop: 4 }}>
                ⏱️ {healthData.components?.database?.latency_ms || 0} ms
              </span>
            </div>
            <div>
              <span style={{ fontSize: 11, fontWeight: 800, color: "var(--text-secondary)", display: "block" }}>Server Memory RSS:</span>
              <span style={{ fontSize: 13, fontWeight: 900, color: "var(--text-primary)", display: "inline-block", marginTop: 4 }}>
                💾 {healthData.components?.memory?.rss_mb || 0} MB
              </span>
            </div>
            <div>
              <span style={{ fontSize: 11, fontWeight: 800, color: "var(--text-secondary)", display: "block" }}>นาฬิกาเวอร์ชันระบบ:</span>
              <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--smartaccess-purple-dark)", display: "inline-block", marginTop: 4 }}>
                🕒 {healthData.server_time || "ไม่ทราบเวลา"}
              </span>
            </div>
          </div>
        )}

        {/* Grid of rooms */}
        {!systemStatus?.esp32Devices || systemStatus.esp32Devices.length === 0 ? (
          <div style={{ padding: "40px 20px", textShadow: "none", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📡</div>
            <h4 style={{ fontSize: 14, fontWeight: 900, color: "var(--text-primary)", margin: 0 }}>ไม่พบบอร์ดควบคุม ESP32 ลงทะเบียนในระบบ</h4>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6 }}>ท่านสามารถเพิ่มบอร์ด/ห้องใหม่ได้ที่เมนู &quot;ตั้งค่าระบบ & Webhook&quot;</p>
          </div>
        ) : (
          <div className="room-card-grid">
            {systemStatus.esp32Devices.map((device: any) => {
              const isTestLoading = testingRoom === device.room;
              const isQuickUnlocking = unlockingRoom === device.room;
              const recentUnlock = recentlyUnlockedRooms[device.room] || false;
              const testRes = testResults[device.room];

              return (
                <div
                  key={device.room}
                  className="room-config-card"
                  style={{
                    padding: 22,
                    background: recentUnlock ? "linear-gradient(135deg, #FAF5FF 0%, rgba(219,39,119,0.01) 100%)" : "#fff",
                    borderColor: recentUnlock ? "rgba(124,58,237,0.35)" : "var(--border)",
                    borderWidth: recentUnlock ? 2 : 1,
                    boxShadow: recentUnlock ? "0 10px 20px -5px rgba(124,58,237,0.15)" : "var(--shadow-sm)",
                    transition: "all 0.3s ease",
                    textAlign: "left"
                  }}
                >
                  <div style={{ display: "flex", justifyItems: "center", justifyContent: "between", alignItems: "center", marginBottom: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 20 }}>🏫</span>
                      <div>
                        <h4 style={{ fontSize: 16.5, fontWeight: 900, color: "var(--smartaccess-purple-dark)", margin: 0 }}>
                          ห้อง {device.room}
                        </h4>
                        <span style={{ fontSize: 10.5, color: "var(--text-secondary)", fontWeight: 600 }}>ESP32 Door Controller</span>
                      </div>
                    </div>

                    {/* Online status badge */}
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 8, fontSize: 10.5, fontWeight: 900,
                      background: device.online ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.08)",
                      color: device.online ? "#10B981" : "#EF4444",
                      border: device.online ? "1px solid rgba(16, 185, 129, 0.25)" : "1px solid rgba(239, 68, 68, 0.2)"
                    }}>
                      <span
                        style={{ width: 8, height: 8, borderRadius: "50%", background: device.online ? "#10B981" : "#EF4444" }}
                        className={device.online ? "pulse-green" : "pulse-red"}
                      />
                      {device.online ? "ONLINE" : "OFFLINE"}
                    </span>
                  </div>

                  {/* Info grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10, background: "rgba(255,255,255,0.01)", padding: 14, borderRadius: 10, border: "1px solid var(--border)", marginBottom: 16 }}>
                    <div>
                      <span style={{ fontSize: 10.5, color: "var(--text-secondary)", display: "block" }}>สลักล็อกประตู:</span>
                      <span style={{ fontSize: 12.5, fontWeight: 900, color: device.doorStatus === "unlocked" ? "#10B981" : "var(--text-primary)", display: "inline-block", marginTop: 4 }}>
                        {device.doorStatus === "unlocked" ? "🔓 เปิดออก (OPENED)" : "🔒 ปิดล็อก (LOCKED)"}
                      </span>
                    </div>
                    <div>
                      <span style={{ fontSize: 10.5, color: "var(--text-secondary)", display: "block" }}>บอร์ด IP:</span>
                      <code style={{ fontSize: 11, color: "var(--smartaccess-purple)", fontWeight: 800, display: "inline-block", marginTop: 4 }}>
                        {device.ip || "192.168.1.100"}
                      </code>
                    </div>
                    <div style={{ gridColumn: "span 2", borderTop: "1px solid var(--border)", paddingTop: 10, marginTop: 4 }}>
                      <span style={{ fontSize: 10.5, color: "var(--text-secondary)", display: "block" }}>คีย์สแกนใช้งานล่าสุด (Dynamic Token Sync):</span>
                      <code style={{ fontSize: 10.5, color: "#DB2777", fontWeight: 800, display: "inline-block", marginTop: 4, fontVariantNumeric: "tabular-nums" }}>
                        {device.activeToken ? `🔑 ${device.activeToken.substring(0, 16)}...` : "— ยังไม่มีการดึงคีย์สแกน —"}
                      </code>
                    </div>
                  </div>

                  {/* Test Connection Result Box */}
                  {testRes && (
                    <div style={{
                      marginBottom: 14, padding: "10px 12px", borderRadius: 8, fontSize: 11, lineHeight: "1.45",
                      background: testRes.online ? "#ECFDF5" : "#FEF2F2",
                      border: testRes.online ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(220,38,38,0.25)",
                      color: testRes.online ? "#047857" : "#B91C1C",
                      textAlign: "left"
                    }}>
                      <strong>ผลทดสอบ Polling:</strong> {testRes.online ? "บอร์ดตอบรับคำขอสำเร็จ" : "ติดต่อบอร์ดโดยตรงไม่ได้"} <br />
                      <span>สเตตัสตอบกลับ: IP {testRes.ip} | โหมดการรัน {testRes.mode}</span>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div style={{ display: "flex", gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => handleOpenRoomDetails(device.room, device.ip || "192.168.1.100")}
                      className="btn-ghost"
                      style={{ flex: 1, padding: "10px", borderRadius: 10, fontSize: 12, fontWeight: 700 }}
                    >
                      ⚙️ ตั้งค่าบอร์ด / โค้ด
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTestConnection(device.room)}
                      disabled={isTestLoading}
                      className="btn-secondary"
                      style={{ flex: 1.1, padding: "10px", borderRadius: 10, fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}
                    >
                      📡 {isTestLoading ? "กำลังเทส..." : "เทส Polling บอร์ด"}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDirectUnlockRoom(device.room)}
                      disabled={isQuickUnlocking}
                      className="btn-success"
                      style={{
                        flex: 1.4, padding: "10px", borderRadius: 10, fontSize: 12.5, fontWeight: 800,
                        background: recentUnlock ? "#10B981" : "linear-gradient(135deg, var(--smartaccess-purple) 0%, var(--edu-pink) 100%)",
                        boxShadow: "0 6px 14px rgba(124,58,237,0.2)",
                        color: "#fff",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 4
                      }}
                    >
                      🔓 {isQuickUnlocking ? "ปลดล็อก..." : recentUnlock ? "บอร์ดตอบกลับแล้ว" : "ปลดล็อกด่วน (Quick Unlock)"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
