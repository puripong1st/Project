"use client";
import React, { useEffect, useState } from "react";
import { useDashboard } from "../DashboardContext";

export default function HealthPage() {
  const { healthData, fetchHealthData } = useDashboard();
  const [loading, setLoading] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    await fetchHealthData();
    setLoading(false);
  };

  useEffect(() => {
    fetchHealthData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchHealthData();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchHealthData]);

  if (!healthData) {
    return (
      <div style={{ textAlign: "center", padding: "80px 40px", background: "var(--bg-secondary)", borderRadius: 20 }}>
        <span className="animate-spin" style={{ display: "inline-block", width: 24, height: 24, border: "3px solid rgba(124,58,237,0.2)", borderTopColor: "var(--smartaccess-purple)", borderRadius: "50%", marginRight: 8 }} />
        <span style={{ color: "var(--text-secondary)", fontSize: 14 }}>กำลังโหลดข้อมูลสุขภาพของระบบ...</span>
      </div>
    );
  }

  const isHealthy = healthData.status === "healthy";
  const isDegraded = healthData.status === "degraded";

  return (
    <div className="animate-fade-in" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>
      
      {/* 🛡️ System Health Monitor Premium Card */}
      <div className="premium-card" style={{ padding: 32, background: "var(--bg-secondary)", border: "1px solid var(--border)", textAlign: "left" }}>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1.5px solid var(--border)", paddingBottom: 20, marginBottom: 28, flexWrap: "wrap", gap: 14 }}>
          <div>
            <span style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "5px 12px",
              borderRadius: "99px",
              fontSize: 11,
              fontWeight: 900,
              background: isHealthy ? "#ECFDF5" : isDegraded ? "#FFFBEB" : "#FEF2F2",
              color: isHealthy ? "#059669" : isDegraded ? "#D97706" : "#DC2626",
              border: `1.5px solid ${isHealthy ? "rgba(16,185,129,0.2)" : isDegraded ? "rgba(245,158,11,0.2)" : "rgba(220,38,38,0.2)"}`,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: 10
            }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: isHealthy ? "#10B981" : isDegraded ? "#F59E0B" : "#EF4444" }} />
              {healthData.status}
            </span>
            
            <h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--smartaccess-purple-dark)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              ⚡ System Health Monitor (การตรวจสอบสถานะระบบ)
            </h2>
            <p style={{ fontSize: 12.5, color: "var(--text-secondary)", margin: "4px 0 0" }}>
              อัปเดตล่าสุด: {new Date(healthData.timestamp).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })} - Auto-refresh ทุก 30 วินาที
            </p>
          </div>

          <button
            onClick={handleRefresh}
            disabled={loading}
            className="btn-ghost"
            style={{
              padding: "10px 18px",
              fontSize: 13,
              borderRadius: 12,
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              borderColor: "var(--smartaccess-purple-light)",
              color: "var(--smartaccess-purple)"
            }}
          >
            ↻ {loading ? "กำลังรีเฟรช..." : "รีเฟรชสถานะ"}
          </button>
        </div>

        {/* ── Metric Summary Cards Grid ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
          
          {/* Card 1: Database Latency */}
          <div style={{ background: "var(--bg-primary)", border: "1.5px solid var(--border)", borderRadius: 16, padding: "20px 22px" }}>
            <span style={{ fontSize: 11, fontWeight: 900, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 12 }}>DATABASE</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: healthData.components.database.status === "up" ? "#10B981" : "#EF4444" }} />
              <span style={{ fontSize: 15, fontWeight: 800, color: healthData.components.database.status === "up" ? "#059669" : "#DC2626" }}>
                {healthData.components.database.status === "up" ? "Online" : "Offline"}
              </span>
            </div>
            <div style={{ fontSize: 24, fontWeight: 900, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
              {healthData.components.database.latency_ms} ms
            </div>
            <span style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 2, display: "block" }}>Supabase Latency</span>
          </div>

          {/* Card 2: Rate Limiter Status */}
          <div style={{ background: "var(--bg-primary)", border: "1.5px solid var(--border)", borderRadius: 16, padding: "20px 22px" }}>
            <span style={{ fontSize: 11, fontWeight: 900, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 12 }}>RATE LIMITER</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: healthData.components.rate_limiter.status === "up" ? "#10B981" : "#EF4444" }} />
              <span style={{ fontSize: 15, fontWeight: 800, color: healthData.components.rate_limiter.status === "up" ? "#059669" : "#DC2626" }}>
                {healthData.components.rate_limiter.status === "up" ? "Active" : "Inactive"}
              </span>
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-primary)", marginTop: 8 }}>
              Replay Attack Protection
            </div>
            <span style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 2, display: "block" }}>Rate Limit Table check</span>
          </div>

          {/* Card 3: Memory Usage */}
          <div style={{ background: "var(--bg-primary)", border: "1.5px solid var(--border)", borderRadius: 16, padding: "20px 22px" }}>
            <span style={{ fontSize: 11, fontWeight: 900, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 12 }}>MEMORY</span>
            <div style={{ fontSize: 24, fontWeight: 900, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums", marginBottom: 4 }}>
              {healthData.components.memory.rss_mb} MB
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums" }}>
              RSS - Heap {healthData.components.memory.heap_used_mb} MB
            </div>
            <span style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 4, display: "block" }}>Vercel Node.js Usage</span>
          </div>

          {/* Card 4: Server Time */}
          <div style={{ background: "var(--bg-primary)", border: "1.5px solid var(--border)", borderRadius: 16, padding: "20px 22px" }}>
            <span style={{ fontSize: 11, fontWeight: 900, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 12 }}>เวลาเซิร์ฟเวอร์</span>
            <div style={{ fontSize: 16, fontWeight: 900, color: "var(--text-primary)", marginBottom: 4 }}>
              {healthData.server_time}
            </div>
            <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700 }}>Asia/Bangkok</span>
          </div>

          {/* Card 5: Last QR Scan */}
          <div style={{ background: "var(--bg-primary)", border: "1.5px solid var(--border)", borderRadius: 16, padding: "20px 22px" }}>
            <span style={{ fontSize: 11, fontWeight: 900, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 12 }}>LAST QR SCAN</span>
            <div style={{ fontSize: 13.5, fontWeight: 900, color: "var(--text-primary)", lineHeight: 1.4 }}>
              {healthData.last_qr_scan
                ? new Date(healthData.last_qr_scan).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })
                : "ยังไม่มีข้อมูล"}
            </div>
            <span style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 6, display: "block" }}>Last successful log</span>
          </div>

        </div>

      </div>
    </div>
  );
}
