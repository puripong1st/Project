"use client";
import React, { useEffect, useState, useCallback, ReactNode } from "react";
import {
  BarChart3,
  RefreshCw,
  Cloud,
  Plug,
  Settings,
  Zap,
  RotateCw,
  Database,
  User,
  ClipboardList,
  ShieldCheck,
  MemoryStick,
  Clock,
  Smartphone,
  Globe,
  Laptop,
  MapPin,
  Rocket,
  Lightbulb,
  Server,
  Cpu,
  Boxes,
  Link2,
  Hash,
  Timer,
  Calculator,
  Package,
  HardDrive,
} from "lucide-react";
import { useDashboard } from "../DashboardContext";

// ── Types ──
interface ApiProbe {
  endpoint: string;
  label: string;
  status: "up" | "down" | "slow";
  latency_ms: number;
  http_status: number | null;
}

// ── Helper: format uptime ──
function formatUptime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

// ── Helper: status color ──
function statusColor(s: string): string {
  if (s === "up" || s === "READY" || s === "healthy") return "#10B981";
  if (s === "slow" || s === "degraded" || s === "BUILDING") return "#F59E0B";
  return "#EF4444";
}
function statusBg(s: string): string {
  if (s === "up" || s === "READY" || s === "healthy") return "#ECFDF5";
  if (s === "slow" || s === "degraded" || s === "BUILDING") return "#FFFBEB";
  return "#FEF2F2";
}
function statusBorder(s: string): string {
  if (s === "up" || s === "READY" || s === "healthy") return "rgba(16,185,129,0.2)";
  if (s === "slow" || s === "degraded" || s === "BUILDING") return "rgba(245,158,11,0.2)";
  return "rgba(220,38,38,0.2)";
}

// ── Latency Bar ──
function LatencyBar({ ms, max = 1000 }: { ms: number; max?: number }) {
  const pct = Math.min((ms / max) * 100, 100);
  const color =
    ms < 100 ? "linear-gradient(90deg, #10B981, #34D399)" :
    ms < 300 ? "linear-gradient(90deg, #F59E0B, #FBBF24)" :
    ms < 500 ? "linear-gradient(90deg, #F97316, #FB923C)" :
    "linear-gradient(90deg, #EF4444, #F87171)";
  return (
    <div style={{ background: "var(--bg-primary)", borderRadius: 6, height: 8, overflow: "hidden", flex: 1 }}>
      <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 6, transition: "width 0.6s ease" }} />
    </div>
  );
}

// ── Metric Card Component ──
function MetricCard({ title, children, icon }: { title: string; children: React.ReactNode; icon?: ReactNode }) {
  return (
    <div style={{
      background: "var(--bg-primary)",
      border: "1.5px solid var(--border)",
      borderRadius: 16,
      padding: "20px 22px",
      transition: "transform 0.2s, box-shadow 0.2s",
    }}
    className="hover-lift"
    >
      <span style={{ fontSize: 11, fontWeight: 900, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
        {icon && <span style={{ display: "inline-flex" }}>{icon}</span>}
        {title}
      </span>
      {children}
    </div>
  );
}

export default function HealthPage() {
  const { healthData, fetchHealthData } = useDashboard();
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<"overview" | "vercel" | "api" | "runtime">("overview");

  const handleRefresh = useCallback(async () => {
    setLoading(true);
    await fetchHealthData();
    setLoading(false);
  }, [fetchHealthData]);

  useEffect(() => {
    fetchHealthData();
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

  const sections = [
    { id: "overview" as const, label: "ภาพรวม", icon: <BarChart3 size={14} /> },
    { id: "vercel" as const, label: "Vercel", icon: <Cloud size={14} /> },
    { id: "api" as const, label: "API Status", icon: <Plug size={14} /> },
    { id: "runtime" as const, label: "Runtime", icon: <Settings size={14} /> },
  ];

  return (
    <div className="animate-fade-in" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>

      {/* ── Header Card ── */}
      <div className="premium-card" style={{ padding: 28, background: "var(--bg-secondary)", border: "1px solid var(--border)", textAlign: "left" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1.5px solid var(--border)", paddingBottom: 18, marginBottom: 22, flexWrap: "wrap", gap: 14 }}>
          <div>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "5px 12px", borderRadius: "99px", fontSize: 11, fontWeight: 900,
              background: statusBg(healthData.status),
              color: statusColor(healthData.status) === "#10B981" ? "#059669" : statusColor(healthData.status) === "#F59E0B" ? "#D97706" : "#DC2626",
              border: `1.5px solid ${statusBorder(healthData.status)}`,
              textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10
            }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor(healthData.status), animation: isHealthy ? "pulse 2s infinite" : undefined }} />
              {healthData.status}
            </span>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--smartaccess-purple-dark)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <Zap size={18} /> System Health Monitor
            </h2>
            <p style={{ fontSize: 12.5, color: "var(--text-secondary)", margin: "4px 0 0" }}>
              อัปเดตล่าสุด: {new Date(healthData.timestamp).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })} • Auto-refresh ทุก 30 วินาที
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="btn-ghost"
            style={{
              padding: "10px 18px", fontSize: 13, borderRadius: 12, fontWeight: 700,
              cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
              borderColor: "var(--smartaccess-purple-light)", color: "var(--smartaccess-purple)"
            }}
          >
            <RotateCw size={14} className={loading ? "animate-spin" : ""} /> {loading ? "กำลังรีเฟรช..." : "รีเฟรชสถานะ"}
          </button>
        </div>

        {/* ── Section Tabs ── */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
          {sections.map(sec => (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              style={{
                padding: "8px 16px", borderRadius: 10, border: "1.5px solid",
                borderColor: activeSection === sec.id ? "var(--smartaccess-purple)" : "var(--border)",
                background: activeSection === sec.id ? "var(--smartaccess-purple-pale)" : "var(--bg-primary)",
                color: activeSection === sec.id ? "var(--smartaccess-purple)" : "var(--text-secondary)",
                fontSize: 13, fontWeight: activeSection === sec.id ? 700 : 500,
                cursor: "pointer", transition: "all 0.2s"
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>{sec.icon} {sec.label}</span>
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════════ */}
        {/* ── SECTION: Overview ── */}
        {/* ══════════════════════════════════════════════════ */}
        {activeSection === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>

            {/* Database */}
            <MetricCard title="DATABASE" icon={<Database size={18} />}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor(healthData.components.database.status) }} />
                <span style={{ fontSize: 15, fontWeight: 800, color: healthData.components.database.status === "up" ? "#059669" : "#DC2626" }}>
                  {healthData.components.database.status === "up" ? "Online" : "Offline"}
                </span>
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                {healthData.components.database.latency_ms} ms
              </div>
              <LatencyBar ms={healthData.components.database.latency_ms} max={500} />
              <div style={{ display: "flex", gap: 12, marginTop: 10, fontSize: 10.5, color: "var(--text-muted)" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><User size={12} /> {healthData.components.database.total_students ?? "—"} รายการ</span>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><ClipboardList size={12} /> {healthData.components.database.total_logs ?? "—"} Logs</span>
              </div>
            </MetricCard>

            {/* Rate Limiter */}
            <MetricCard title="RATE LIMITER" icon={<ShieldCheck size={18} />}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: statusColor(healthData.components.rate_limiter.status) }} />
                <span style={{ fontSize: 15, fontWeight: 800, color: healthData.components.rate_limiter.status === "up" ? "#059669" : "#DC2626" }}>
                  {healthData.components.rate_limiter.status === "up" ? "Active" : "Inactive"}
                </span>
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text-primary)", marginTop: 8 }}>Replay Attack Protection</div>
              <span style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 2, display: "block" }}>Rate Limit Table check</span>
            </MetricCard>

            {/* Memory */}
            <MetricCard title="MEMORY" icon={<MemoryStick size={18} />}>
              <div style={{ fontSize: 24, fontWeight: 900, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums", marginBottom: 4 }}>
                {healthData.components.memory.rss_mb} MB
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums" }}>
                Heap {healthData.components.memory.heap_used_mb}/{healthData.components.memory.heap_total_mb ?? "?"} MB
              </div>
              {healthData.components.memory.heap_total_mb && (
                <div style={{ marginTop: 8 }}>
                  <LatencyBar ms={healthData.components.memory.heap_used_mb} max={healthData.components.memory.heap_total_mb} />
                  <span style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2, display: "block" }}>
                    {Math.round((healthData.components.memory.heap_used_mb / healthData.components.memory.heap_total_mb) * 100)}% Heap Used
                  </span>
                </div>
              )}
            </MetricCard>

            {/* Server Time */}
            <MetricCard title="เวลาเซิร์ฟเวอร์" icon={<Clock size={18} />}>
              <div style={{ fontSize: 16, fontWeight: 900, color: "var(--text-primary)", marginBottom: 4 }}>
                {healthData.server_time}
              </div>
              <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700 }}>Asia/Bangkok</span>
            </MetricCard>

            {/* Last QR Scan */}
            <MetricCard title="LAST QR SCAN" icon={<Smartphone size={18} />}>
              <div style={{ fontSize: 13.5, fontWeight: 900, color: "var(--text-primary)", lineHeight: 1.4 }}>
                {healthData.last_qr_scan
                  ? new Date(healthData.last_qr_scan).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })
                  : "ยังไม่มีข้อมูล"}
              </div>
              <span style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 6, display: "block" }}>Last successful door open</span>
            </MetricCard>

            {/* Environment */}
            <MetricCard title="ENVIRONMENT" icon={<Globe size={18} />}>
              <div style={{ fontSize: 15, fontWeight: 800, color: "var(--smartaccess-purple)" }}>
                {healthData.vercel_runtime?.environment || "unknown"}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 6 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>{healthData.vercel_runtime?.is_vercel ? <><Cloud size={13} /> Vercel Cloud</> : <><Laptop size={13} /> Local Development</>}</span>
              </div>
              {healthData.vercel_runtime?.region && (
                <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4, fontWeight: 600 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><MapPin size={12} /> Region: {healthData.vercel_runtime.region}</span>
                </div>
              )}
            </MetricCard>
          </div>
        )}

        {/* ══════════════════════════════════════════════════ */}
        {/* ── SECTION: Vercel ── */}
        {/* ══════════════════════════════════════════════════ */}
        {activeSection === "vercel" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>

            {/* Vercel Runtime */}
            <div style={{ background: "var(--bg-primary)", border: "1.5px solid var(--border)", borderRadius: 16, padding: "24px 26px" }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: "var(--smartaccess-purple-dark)", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Cloud size={16} /> Vercel Runtime Information</span>
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
                {[
                  { label: "Environment", value: healthData.vercel_runtime?.environment || "—" },
                  { label: "Region", value: healthData.vercel_runtime?.region || "N/A (Local)" },
                  { label: "Platform", value: healthData.vercel_runtime?.is_vercel ? "Vercel Serverless" : "Local Node.js" },
                  { label: "Git Branch", value: healthData.vercel_runtime?.git_ref || "—" },
                  { label: "Git SHA", value: healthData.vercel_runtime?.git_sha ? healthData.vercel_runtime.git_sha.substring(0, 8) : "—" },
                ].map((item, idx) => (
                  <div key={idx} style={{ padding: "12px 14px", background: "var(--bg-secondary)", borderRadius: 12, border: "1px solid var(--border)" }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 6 }}>{item.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", wordBreak: "break-all" }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Vercel Deployment */}
            <div style={{ background: "var(--bg-primary)", border: "1.5px solid var(--border)", borderRadius: 16, padding: "24px 26px" }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: "var(--smartaccess-purple-dark)", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Rocket size={15} /> Latest Deployment</span>
              </h3>

              {healthData.vercel_deployment ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
                  <div style={{ padding: "12px 14px", background: "var(--bg-secondary)", borderRadius: 12, border: "1px solid var(--border)" }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 6 }}>Status</span>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      padding: "3px 10px", borderRadius: "99px", fontSize: 12, fontWeight: 800,
                      background: statusBg(healthData.vercel_deployment.state),
                      color: statusColor(healthData.vercel_deployment.state) === "#10B981" ? "#059669" : statusColor(healthData.vercel_deployment.state) === "#F59E0B" ? "#D97706" : "#DC2626",
                      border: `1px solid ${statusBorder(healthData.vercel_deployment.state)}`
                    }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor(healthData.vercel_deployment.state) }} />
                      {healthData.vercel_deployment.state}
                    </span>
                  </div>
                  <div style={{ padding: "12px 14px", background: "var(--bg-secondary)", borderRadius: 12, border: "1px solid var(--border)" }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 6 }}>URL</span>
                    <a href={`https://${healthData.vercel_deployment.url}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 600, color: "var(--smartaccess-purple)", textDecoration: "none", wordBreak: "break-all" }}>
                      {healthData.vercel_deployment.url}
                    </a>
                  </div>
                  <div style={{ padding: "12px 14px", background: "var(--bg-secondary)", borderRadius: 12, border: "1px solid var(--border)" }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 6 }}>Created</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>
                      {new Date(healthData.vercel_deployment.created).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}
                    </span>
                  </div>
                  <div style={{ padding: "12px 14px", background: "var(--bg-secondary)", borderRadius: 12, border: "1px solid var(--border)" }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 6 }}>Git Commit</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", wordBreak: "break-all" }}>
                      {healthData.vercel_deployment.git_sha ? healthData.vercel_deployment.git_sha.substring(0, 8) : "—"}
                    </span>
                    {healthData.vercel_deployment.git_message && (
                      <div style={{ fontSize: 10.5, color: "var(--text-muted)", marginTop: 4, fontStyle: "italic" }}>
                        &quot;{healthData.vercel_deployment.git_message.substring(0, 60)}&quot;
                      </div>
                    )}
                  </div>
                  <div style={{ padding: "12px 14px", background: "var(--bg-secondary)", borderRadius: 12, border: "1px solid var(--border)" }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", display: "block", marginBottom: 6 }}>Branch</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>
                      {healthData.vercel_deployment.git_ref || "—"}
                    </span>
                  </div>
                </div>
              ) : (
                <div style={{ padding: "20px", background: "var(--bg-secondary)", borderRadius: 12, border: "1px solid var(--border)", textAlign: "center" }}>
                  <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                    {healthData.vercel_deployment_error || "ไม่พบข้อมูล Deployment"}
                  </span>
                  {healthData.vercel_deployment_error?.includes("not configured") && (
                    <div style={{ marginTop: 12, padding: "10px 16px", background: "#FFFBEB", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, fontSize: 12, color: "#92400E", textAlign: "left" }}>
                      <strong><span style={{ display: "inline-flex", alignItems: "center", gap: 5, verticalAlign: "middle" }}><Lightbulb size={13} /> วิธีเปิดใช้งาน:</span></strong> เพิ่มตัวแปร <code>VERCEL_TOKEN</code> และ <code>VERCEL_PROJECT_ID</code> ใน .env.local หรือ Vercel Environment Variables
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════ */}
        {/* ── SECTION: API Status ── */}
        {/* ══════════════════════════════════════════════════ */}
        {activeSection === "api" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
            <div style={{ background: "var(--bg-primary)", border: "1.5px solid var(--border)", borderRadius: 16, padding: "24px 26px" }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: "var(--smartaccess-purple-dark)", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Plug size={16} /> API Endpoint Status & Latency</span>
              </h3>

              {healthData.api_probes && healthData.api_probes.length > 0 ? (
                <div style={{ display: "grid", gap: 12 }}>
                  {(healthData.api_probes as ApiProbe[]).map((probe, idx) => (
                    <div key={idx} style={{
                      display: "flex", alignItems: "center", gap: 14, padding: "14px 18px",
                      background: "var(--bg-secondary)", borderRadius: 14, border: "1px solid var(--border)",
                      transition: "transform 0.2s",
                    }}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        width: 32, height: 32, borderRadius: 10,
                        background: statusBg(probe.status),
                        border: `1px solid ${statusBorder(probe.status)}`,
                      }}>
                        <span style={{ width: 10, height: 10, borderRadius: "50%", background: statusColor(probe.status) }} />
                      </span>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>
                          {probe.label}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "monospace" }}>
                          {probe.endpoint}
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 180 }}>
                        <LatencyBar ms={probe.latency_ms} max={2000} />
                        <span style={{
                          fontSize: 13, fontWeight: 800, fontVariantNumeric: "tabular-nums",
                          color: probe.latency_ms < 300 ? "#059669" : probe.latency_ms < 1000 ? "#D97706" : "#DC2626",
                          minWidth: 55, textAlign: "right"
                        }}>
                          {probe.latency_ms} ms
                        </span>
                      </div>

                      <span style={{
                        fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: "99px",
                        background: statusBg(probe.status),
                        color: statusColor(probe.status) === "#10B981" ? "#059669" : statusColor(probe.status) === "#F59E0B" ? "#D97706" : "#DC2626",
                        border: `1px solid ${statusBorder(probe.status)}`,
                        textTransform: "uppercase",
                      }}>
                        {probe.http_status || "ERR"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: "20px", textAlign: "center", color: "var(--text-secondary)", fontSize: 13 }}>
                  ไม่มีข้อมูล API Probes
                </div>
              )}

              <div style={{ marginTop: 16, padding: "12px 16px", background: "var(--bg-secondary)", borderRadius: 10, border: "1px solid var(--border)", fontSize: 11, color: "var(--text-muted)" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, verticalAlign: "middle" }}><Lightbulb size={13} /></span> API Probes จะทดสอบการเข้าถึงเส้นทาง API หลักของระบบโดยอัตโนมัติ ค่า Latency แสดงเวลาตอบสนองจากเซิร์ฟเวอร์ในการตรวจสอบแต่ละรอบ (วัดจากฝั่ง server-to-server ภายใน)
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════ */}
        {/* ── SECTION: Runtime ── */}
        {/* ══════════════════════════════════════════════════ */}
        {activeSection === "runtime" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
            <div style={{ background: "var(--bg-primary)", border: "1.5px solid var(--border)", borderRadius: 16, padding: "24px 26px" }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: "var(--smartaccess-purple-dark)", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                ⚙️ Node.js Runtime & Server Info
              </h3>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
                {[
                  { label: "Node.js Version", value: healthData.node_runtime?.version || "—", icon: "🟢" },
                  { label: "Platform", value: healthData.node_runtime?.platform || "—", icon: "💻" },
                  { label: "Architecture", value: healthData.node_runtime?.arch || "—", icon: "🏗️" },
                  { label: "Process Uptime", value: healthData.node_runtime?.uptime_seconds ? formatUptime(healthData.node_runtime.uptime_seconds) : "—", icon: "⏱️" },
                  { label: "Process ID", value: healthData.node_runtime?.pid?.toString() || "—", icon: "🔢" },
                  { label: "RSS Memory", value: `${healthData.components.memory.rss_mb} MB`, icon: "📊" },
                  { label: "Heap Used", value: `${healthData.components.memory.heap_used_mb} MB`, icon: "🧮" },
                  { label: "Heap Total", value: `${healthData.components.memory.heap_total_mb ?? "?"} MB`, icon: "📦" },
                  { label: "External Memory", value: `${healthData.components.memory.external_mb ?? "?"} MB`, icon: "🔗" },
                ].map((item, idx) => (
                  <div key={idx} style={{ padding: "14px 16px", background: "var(--bg-secondary)", borderRadius: 12, border: "1px solid var(--border)" }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: 4, marginBottom: 6 }}>
                      <span>{item.icon}</span> {item.label}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Memory Usage Visual */}
            <div style={{ background: "var(--bg-primary)", border: "1.5px solid var(--border)", borderRadius: 16, padding: "24px 26px" }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: "var(--smartaccess-purple-dark)", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><BarChart3 size={15} /> Memory Breakdown</span>
              </h3>
              <div style={{ display: "grid", gap: 14 }}>
                {[
                  { label: "RSS (Resident Set Size)", value: healthData.components.memory.rss_mb, max: 512, color: "#7C3AED" },
                  { label: "Heap Used", value: healthData.components.memory.heap_used_mb, max: healthData.components.memory.heap_total_mb || 256, color: "#DB2777" },
                  { label: "External (C++ Objects)", value: healthData.components.memory.external_mb ?? 0, max: 128, color: "#059669" },
                ].map((item, idx) => (
                  <div key={idx}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>{item.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>{item.value} MB</span>
                    </div>
                    <div style={{ background: "var(--bg-secondary)", borderRadius: 6, height: 10, overflow: "hidden", border: "1px solid var(--border)" }}>
                      <div style={{
                        width: `${Math.min((item.value / item.max) * 100, 100)}%`,
                        height: "100%",
                        background: `linear-gradient(90deg, ${item.color}, ${item.color}90)`,
                        borderRadius: 6,
                        transition: "width 0.6s ease"
                      }} />
                    </div>
                    <span style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2, display: "block" }}>
                      {Math.round((item.value / item.max) * 100)}% of {item.max} MB limit
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
