"use client";
import React from "react";
import {
  BarChart3,
  Rocket,
  Clock,
  Target,
  GraduationCap,
  FileText,
  CheckCircle2,
  DoorOpen,
  XCircle,
  Zap,
  Flame,
  Settings,
  Lock,
  ClipboardList,
  RefreshCw,
  UploadCloud,
  Download,
  Trash2,
  Save,
  Loader2,
  FolderOpen,
} from "lucide-react";
import { useDashboard, defaultRoomConfig } from "../DashboardContext";
import EmptyState from "../../../components/EmptyState";

const GridSkeleton = () => (
  <div className="room-card-grid animate-fade-in" style={{ marginTop: 24 }}>
    {[1, 2, 3].map(i => (
      <div key={i} className="room-config-card" style={{ height: 180, display: "flex", flexDirection: "column", gap: 16, animation: "pulse-soft 2s infinite" }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ width: 42, height: 42, borderRadius: 8, background: "var(--border-medium)" }} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ height: 18, width: "60%", background: "var(--border-medium)", borderRadius: 4 }} />
            <div style={{ height: 12, width: "40%", background: "var(--border)", borderRadius: 3 }} />
          </div>
        </div>
        <div style={{ flex: 1, background: "var(--border)", borderRadius: 8 }} />
      </div>
    ))}
  </div>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

export default function RoomsPage() {
  const {
    isOwner,
    user,
    roomsList,
    setRoomsList,
    systemStatus,
    testResults,
    testingRoom,
    handleTestConnection,
    unlockingRoom,
    handleDirectUnlockRoom,
    handleOpenRoomDetails,
    handleRemoveRoom,
    toggleRoomSettings,
    expandedRoomSettings,
    roomConfigs,
    setRoomConfig,
    saveSingleRoomSettings,
    roomSaving,
    newRoomCode,
    setNewRoomCode,
    newRoomIp,
    setNewRoomIp,
    handleAddRoom,
    firmwareLogsLoading,
    firmwareLogs,
    fetchFirmwareLogs,
    fetchSystemStatus,
    firmwareVersionInput,
    setFirmwareVersionInput,
    firmwarePublicUrlInput,
    setFirmwarePublicUrlInput,
    firmwareFile,
    setFirmwareFile,
    firmwareReleasesLoading,
    firmwareReleases,
    fetchFirmwares,
    showToast,
    analyticsData,
    analyticsLoading,
    fetchAnalytics,
    allStudents,
    logs,
    handleSaveSettings,
    settingsLoading,
    handleUploadFirmware
  } = useDashboard();

  const [pageLoading, setPageLoading] = React.useState(true);
  React.useEffect(() => {
    const t = setTimeout(() => setPageLoading(false), 450);
    return () => clearTimeout(t);
  }, []);

  if (!user || !isOwner) return null;

  return (
    <div className="animate-fade-in room-manager-shell">
      <section className="dashboard-section-card" style={{ padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap", marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 900, color: "var(--smartaccess-purple)", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 6 }}>
              Room Inventory
            </div>
            <h2 style={{ margin: 0, color: "var(--text-primary)", fontSize: 24, fontWeight: 900, lineHeight: 1.2 }}>
              จัดการห้องเรียนและบอร์ด ESP32
            </h2>
            <p style={{ color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.6, margin: "8px 0 0" }}>
              เพิ่ม แก้ไข IP ทดสอบการเชื่อมต่อ และเปิดหน้าตั้งค่า API/Webhook/Arduino ของแต่ละห้องได้จากที่เดียว
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={() => {
                fetchSystemStatus();
                showToast("รีเฟรชสถานะบอร์ดแล้ว", "success");
              }}
              className="btn-secondary"
              style={{ borderRadius: 8, padding: "11px 18px", fontSize: 13 }}
            >
              รีเฟรชสถานะบอร์ด
            </button>
          </div>
        </div>

        {/* Dynamic SVG Analytics Dashboard - Zero Dependency */}
        <div
          className="premium-card animate-fade-in"
          style={{
            padding: 24,
            marginTop: 20,
            background: "var(--bg-secondary)",
            border: "1.5px solid var(--smartaccess-purple-pale)",
            borderRadius: 16,
            boxShadow: "var(--shadow-md)"
          }}
        >
          <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: 14, marginBottom: 20 }}>
            <h3 style={{ fontSize: 16.5, fontWeight: 900, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><BarChart3 size={16} /> รายงานสถิติและบทวิเคราะห์เชิงลึก (Zero-Dependency SVG Analytics Dashboard)</span>
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: 12.5, margin: "6px 0 0", lineHeight: 1.4 }}>
              ข้อมูลวิเคราะห์อัตราการเข้าเรียนสูงสุดแยกตามช่วงเวลา คณะวิชา และอัตราความสำเร็จของคำขอประมวลผลแบบ Real-time จากประวัติ logs
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>

            {/* Chart 1: Hour Distribution */}
            <div style={{ padding: 16, background: "var(--bg-primary)", border: "1px solid var(--border)", borderRadius: 12 }}>
              <h4 style={{ fontSize: 13.5, fontWeight: 800, color: "var(--smartaccess-purple-dark)", marginTop: 0, marginBottom: 12 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Clock size={15} /> ช่วงชั่วโมงที่มีการเข้าออกสูงสุด (Peak Access Hours)</span>
              </h4>
              <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", height: 130, gap: 8, paddingTop: 10, paddingBottom: 5 }}>
                {(() => {
                  const hoursCount = Array(9).fill(0); // 08:00 to 16:00
                  logs.forEach(l => {
                    if (!l.timestamp) return;
                    const hr = new Date(l.timestamp).getHours();
                    if (hr >= 8 && hr <= 16) {
                      hoursCount[hr - 8]++;
                    }
                  });
                  const maxVal = Math.max(...hoursCount, 1);
                  return hoursCount.map((cnt, i) => {
                    const pct = (cnt / maxVal) * 90;
                    const hrLabel = `${String(i + 8).padStart(2, "0")}`;
                    return (
                      <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, height: "100%", justifyContent: "flex-end" }}>
                        <span style={{ fontSize: 9.5, fontWeight: 800, color: "var(--text-secondary)", marginBottom: 4 }}>{cnt}</span>
                        <div
                          style={{
                            width: "100%",
                            height: `${Math.max(pct, 5)}%`,
                            background: "linear-gradient(to top, var(--smartaccess-purple) 0%, var(--edu-pink) 100%)",
                            borderRadius: "4px 4px 0 0",
                            transition: "height 0.3s ease",
                            minHeight: cnt > 0 ? 6 : 2
                          }}
                          title={`ช่วงเวลา ${hrLabel}:00 น. | ทั้งหมด ${cnt} ครั้ง`}
                        />
                        <span style={{ fontSize: 9.5, color: "var(--text-secondary)", marginTop: 6, fontWeight: 700 }}>{hrLabel}</span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            {/* Chart 2: Success/Failure Ratio */}
            <div style={{ padding: 16, background: "var(--bg-primary)", border: "1px solid var(--border)", borderRadius: 12, display: "flex", flexDirection: "column" }}>
              <h4 style={{ fontSize: 13.5, fontWeight: 800, color: "var(--smartaccess-purple-dark)", marginTop: 0, marginBottom: 12 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Target size={15} /> อัตราการตรวจสอบสำเร็จ (Request Handling Success)</span>
              </h4>
              <div style={{ display: "flex", flex: 1, alignItems: "center", justifyContent: "space-around", gap: 16, height: 130 }}>
                {(() => {
                  const approved = allStudents.filter(s => s.status === "approved").length;
                  const rejected = allStudents.filter(s => s.status === "rejected").length;
                  const pending = allStudents.filter(s => s.status === "pending").length;
                  const total = approved + rejected + pending || 1;

                  const pctApp = Math.round((approved / total) * 100);
                  const pctRej = Math.round((rejected / total) * 100);
                  const pctPen = Math.round((pending / total) * 100);

                  return (
                    <>
                      <div style={{ position: "relative", width: 90, height: 90 }}>
                        <svg width="90" height="90" viewBox="0 0 32 32" style={{ transform: "rotate(-90deg)", borderRadius: "50%" }}>
                          <circle r="16" cx="16" cy="16" fill="transparent" stroke="#EF4444" strokeWidth="32" />
                          <circle r="16" cx="16" cy="16" fill="transparent" stroke="#10B981" strokeWidth="32"
                            strokeDasharray={`${pctApp} 100`} />
                        </svg>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 11.5 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10B981", display: "inline-block" }} />
                          <span style={{ fontWeight: 800, color: "var(--text-primary)" }}>อนุมัติ ({pctApp}%)</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#EF4444", display: "inline-block" }} />
                          <span style={{ fontWeight: 800, color: "var(--text-primary)" }}>ปฏิเสธ ({pctRej}%)</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#F59E0B", display: "inline-block" }} />
                          <span style={{ fontWeight: 800, color: "var(--text-primary)" }}>รอคิว ({pctPen}%)</span>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>

            {/* Chart 3: Department Ratios */}
            <div style={{ padding: 16, background: "var(--bg-primary)", border: "1px solid var(--border)", borderRadius: 12 }}>
              <h4 style={{ fontSize: 13.5, fontWeight: 800, color: "var(--smartaccess-purple-dark)", marginTop: 0, marginBottom: 12 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><GraduationCap size={15} /> สัดส่วนการเข้าใช้งานจำแนกตามภาควิชา (Department Ratios)</span>
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, height: 130, justifyContent: "center" }}>
                {(() => {
                  const deptCounts: Record<string, number> = {};
                  allStudents.forEach(s => {
                    const d = s.branch || "อื่นๆ";
                    deptCounts[d] = (deptCounts[d] || 0) + 1;
                  });
                  const sorted = Object.entries(deptCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
                  const total = allStudents.length || 1;

                  return sorted.map(([dept, count], idx) => {
                    const pct = Math.round((count / total) * 100);
                    const colors = ["var(--smartaccess-purple)", "var(--edu-pink)", "#3B82F6"];
                    return (
                      <div key={dept} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, fontWeight: 800, color: "var(--text-primary)" }}>
                          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>{dept}</span>
                          <span>{count} คน ({pct}%)</span>
                        </div>
                        <div style={{ width: "100%", height: 7, background: "rgba(255,255,255,0.05)", borderRadius: 4, overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: colors[idx % colors.length], borderRadius: 4 }} />
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

          </div>
        </div>

        {/* ─── Analytics from API ─── */}
        {analyticsData && (
          <div style={{ marginTop: 20 }}>
            {analyticsData.kpi && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 20 }}>
                {[
                  { label: "ลงทะเบียน (7 วัน)", value: analyticsData.kpi.reg_7d, color: "#7C3AED", icon: <FileText size={22} /> },
                  { label: "อนุมัติ (7 วัน)", value: analyticsData.kpi.approved_7d, color: "#10B981", icon: <CheckCircle2 size={22} /> },
                  { label: "เปิดประตู (7 วัน)", value: analyticsData.kpi.opens_7d, color: "#3B82F6", icon: <DoorOpen size={22} /> },
                  { label: "ปฏิเสธ (7 วัน)", value: analyticsData.kpi.rejected_7d, color: "#EF4444", icon: <XCircle size={22} /> },
                  { label: "ลงทะเบียน (24 ชม.)", value: analyticsData.kpi.reg_24h, color: "#F59E0B", icon: <Clock size={22} /> },
                  { label: "เปิดประตู (24 ชม.)", value: analyticsData.kpi.opens_24h, color: "#06B6D4", icon: <Zap size={22} /> },
                ].map(({ label, value, color, icon }) => (
                  <div key={label} style={{ padding: "14px 16px", background: "var(--bg-primary)", border: "1px solid var(--border)", borderRadius: 12, textAlign: "center" }}>
                    <div style={{ marginBottom: 4, color, display: "flex", justifyContent: "center" }}>{icon}</div>
                    <div style={{ fontSize: 26, fontWeight: 900, color }}>{value ?? 0}</div>
                    <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2, lineHeight: 1.3 }}>{label}</div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
              {/* Heatmap */}
              {analyticsData.heatmap && analyticsData.heatmap.length > 0 && (
                <div style={{ padding: 16, background: "var(--bg-primary)", border: "1px solid var(--border)", borderRadius: 12, gridColumn: "1 / -1" }}>
                  <h4 style={{ fontSize: 13.5, fontWeight: 800, color: "var(--smartaccess-purple-dark)", marginTop: 0, marginBottom: 14 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Flame size={14} /> Heatmap ชั่วโมงพีค (30 วัน) — แต่ละแถว = วันในสัปดาห์, แต่ละคอลัมน์ = ชั่วโมง 0–23</span>
                  </h4>
                  <div style={{ overflowX: "auto" }}>
                    <div style={{ minWidth: 560 }}>
                      <div style={{ display: "flex", gap: 2, marginBottom: 2, paddingLeft: 38 }}>
                        {Array.from({ length: 24 }, (_, h) => (
                          <div key={h} style={{ flex: 1, fontSize: 9, color: "var(--text-secondary)", textAlign: "center", fontWeight: 700 }}>{h}</div>
                        ))}
                      </div>
                      {["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."].map((day, di) => {
                        const grid: number[] = Array(24).fill(0);
                        analyticsData.heatmap!.forEach((r: any) => {
                          if (r.day_of_week === di) grid[r.hour] = Number(r.count);
                        });
                        const maxVal = Math.max(...analyticsData.heatmap!.map((r: any) => Number(r.count)), 1);
                        return (
                          <div key={di} style={{ display: "flex", alignItems: "center", gap: 2, marginBottom: 2 }}>
                            <div style={{ width: 34, fontSize: 10, fontWeight: 800, color: "var(--text-secondary)", flexShrink: 0 }}>{day}</div>
                            {grid.map((val, hi) => {
                              const intensity = val / maxVal;
                              const alpha = intensity > 0 ? 0.1 + intensity * 0.85 : 0;
                              return (
                                <div
                                  key={hi}
                                  title={`${day} ${hi}:00 — ${val} ครั้ง`}
                                  style={{
                                    flex: 1,
                                    height: 16,
                                    borderRadius: 3,
                                    background: alpha > 0 ? `rgba(124,58,237,${alpha})` : "var(--bg-secondary)",
                                    border: "1px solid var(--border)",
                                  }}
                                />
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
          <button
            type="button"
            onClick={fetchAnalytics}
            disabled={analyticsLoading}
            className="btn-secondary"
            style={{ borderRadius: 8, padding: "8px 16px", fontSize: 12 }}
          >
            {analyticsLoading ? "กำลังโหลด..." : "รีเฟรช Analytics"}
          </button>
        </div>
      </section>

      {/* Grid room configs */}
      <section style={{ marginTop: 24 }}>
        {pageLoading ? (
          <GridSkeleton />
        ) : roomsList.length === 0 ? (
          <EmptyState
            title="ยังไม่มีห้องเรียนในระบบ"
            description="เพิ่มรหัสห้องเรียนและที่อยู่ IP หรือที่อยู่บอร์ดโฮสต์ใหม่ด้านล่าง เพื่อเริ่มต้นการเชื่อมต่อระบบ"
            illustration="rooms"
          />
        ) : (
          <div className="room-card-grid">
            {roomsList.map((roomItem, idx) => {
              const liveDev = systemStatus?.esp32Devices?.find((d: any) => d.room === roomItem.room);
              const testRes = testResults[roomItem.room];
              const isOnline = liveDev ? liveDev.online : testRes?.online || false;

              return (
                <article className="room-config-card" key={`room-tab-${idx}`}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                    <span style={{ width: 42, height: 42, borderRadius: 8, background: "var(--smartaccess-purple-pale)", color: "var(--smartaccess-purple-dark)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 900 }}>
                      {idx + 1}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <h3 style={{ fontSize: 17, fontWeight: 900, color: "var(--text-primary)", margin: 0 }}>ห้อง {roomItem.room}</h3>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 3 }}>
                        IP: <code style={{ color: "#059669", fontWeight: 800 }}>{roomItem.ip}</code>
                      </div>
                    </div>
                  </div>
                  <span style={{ borderRadius: 99, padding: "5px 10px", fontSize: 11.5, fontWeight: 900, background: isOnline ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)", color: isOnline ? "#10B981" : "#F87171", border: `1px solid ${isOnline ? "rgba(16,185,129,0.24)" : "rgba(239,68,68,0.24)"}` }}>
                    {isOnline ? "ONLINE" : "OFFLINE"}
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                  <div>
                    <label className="field-label">รหัสห้อง</label>
                    <input
                      className="smartaccess-input"
                      value={roomItem.room}
                      onChange={e => {
                        const newVal = e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "");
                        setRoomsList(prev => prev.map((rm, i) => i === idx ? { ...rm, room: newVal } : rm));
                      }}
                      style={{ fontFamily: "monospace" }}
                    />
                  </div>
                  <div>
                    <label className="field-label">IP Address / Domain</label>
                    <input
                      className="smartaccess-input"
                      value={roomItem.ip}
                      onChange={e => setRoomsList(prev => prev.map((rm, i) => i === idx ? { ...rm, ip: e.target.value } : rm))}
                      style={{ fontFamily: "monospace" }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 8 }}>
                  <button type="button" onClick={() => handleTestConnection(roomItem.room)} disabled={testingRoom === roomItem.room} className="btn-secondary" style={{ borderRadius: 8, padding: "10px 12px", fontSize: 12 }}>
                    {testingRoom === roomItem.room ? "กำลังทดสอบ..." : "เทส Polling"}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDirectUnlockRoom(roomItem.room)}
                    disabled={unlockingRoom === roomItem.room}
                    className="btn-secondary"
                    style={{ borderRadius: 8, padding: "10px 12px", fontSize: 12, borderColor: "rgba(16,185,129,0.35)", color: "#059669" }}
                  >
                    {unlockingRoom === roomItem.room ? "กำลังปลดล็อก..." : "ปลดล็อกด่วน"}
                  </button>
                  <button type="button" onClick={() => handleOpenRoomDetails(roomItem.room, roomItem.ip)} className="btn-primary" style={{ borderRadius: 8, padding: "10px 12px", fontSize: 12 }}>
                    ตั้งค่า API
                  </button>
                  <button type="button" onClick={() => handleRemoveRoom(roomItem.room)} className="btn-ghost" title="ลบห้อง" style={{ borderRadius: 8, padding: "10px 12px", color: "#DC2626", borderColor: "rgba(220,38,38,0.2)" }}>
                    <TrashIcon />
                  </button>
                </div>

                {/* Per-Room Settings Panel */}
                <div style={{ marginTop: 12 }}>
                  <button
                    type="button"
                    onClick={() => toggleRoomSettings(roomItem.room)}
                    style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border)", background: expandedRoomSettings.has(roomItem.room) ? "var(--smartaccess-purple-pale)" : "transparent", color: expandedRoomSettings.has(roomItem.room) ? "var(--smartaccess-purple)" : "var(--text-secondary)", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Settings size={14} /> ตั้งค่าการอนุมัติ & หน้าจอ ESP32</span>
                    <span style={{ fontSize: 10 }}>{expandedRoomSettings.has(roomItem.room) ? "▲" : "▼"}</span>
                  </button>

                  {expandedRoomSettings.has(roomItem.room) && (() => {
                    const cfg = roomConfigs[roomItem.room] ?? defaultRoomConfig();
                    const Toggle = ({ on, onToggle }: { on: boolean; onToggle: () => void }) => (
                      <button type="button" onClick={onToggle} style={{ width: 44, height: 24, borderRadius: 13, background: on ? "linear-gradient(135deg,var(--smartaccess-purple),var(--edu-pink))" : "rgba(255,255,255,0.08)", border: "1px solid var(--border)", position: "relative", cursor: "pointer", padding: 0, flexShrink: 0, display: "flex", alignItems: "center" }}>
                        <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#FFF", position: "absolute", left: on ? 22 : 3, transition: "left 0.2s cubic-bezier(0.4,0,0.2,1)", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
                      </button>
                    );
                    const activeDays = cfg.auto_approve_days ? cfg.auto_approve_days.split(",").map(Number).filter(n => !isNaN(n)) : [];
                    const dayDefs = [{ val: 1, label: "จ.", color: "#EAB308" }, { val: 2, label: "อ.", color: "#EC4899" }, { val: 3, label: "พ.", color: "#10B981" }, { val: 4, label: "พฤ.", color: "#F97316" }, { val: 5, label: "ศ.", color: "#3B82F6" }, { val: 6, label: "ส.", color: "#8B5CF6" }, { val: 0, label: "อา.", color: "#EF4444" }];
                    return (
                      <div className="animate-fade-in" style={{ marginTop: 8, padding: 16, background: "rgba(124,58,237,0.03)", border: "1px solid var(--border)", borderRadius: 10, display: "flex", flexDirection: "column", gap: 14 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: 13, color: "var(--text-primary)" }}>เข้าห้องอัตโนมัติไม่ต้องรออนุมัติ</div>
                            <div style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.4 }}>นักศึกษาใหม่ยื่นในเวลาบริการ อนุมัติผ่านเข้าห้องทันที</div>
                          </div>
                          <Toggle on={cfg.auto_approve_enabled} onToggle={() => setRoomConfig(roomItem.room, { auto_approve_enabled: !cfg.auto_approve_enabled })} />
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 12, background: "rgba(0,0,0,0.12)", borderRadius: 8, border: "1px solid var(--border)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: 13, color: "var(--text-primary)" }}>ช่วยกรอกข้อมูลอัตโนมัติ (Auto-fill)</div>
                              <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>ดึงชั้นปี คณะ สาขาจากนักศึกษาเดิมกรอกให้อัตโนมัติ</div>
                            </div>
                            <Toggle on={cfg.auto_fill_enabled} onToggle={() => setRoomConfig(roomItem.room, { auto_fill_enabled: !cfg.auto_fill_enabled })} />
                          </div>
                          {cfg.auto_fill_enabled && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                              {[{ val: "auto", label: "เด้งขึ้นมาให้เองอัตโนมัติ (Auto Pop-up)" }, { val: "manual", label: "แสดงปุ่มให้กดเลือกเอง (Manual Confirmation)" }].map(o => (
                                <label key={o.val} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12 }}>
                                  <input type="radio" name={`auto_fill_mode_${roomItem.room}`} value={o.val} checked={cfg.auto_fill_mode === o.val} onChange={() => setRoomConfig(roomItem.room, { auto_fill_mode: o.val })} style={{ accentColor: "var(--smartaccess-purple)" }} />
                                  {o.label}
                                </label>
                              ))}
                            </div>
                          )}
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          <label style={{ fontSize: 12, fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 5 }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Lock size={13} /> ความปลอดภัยหน้าจอ ESP32 (รหัสนักศึกษาล่าสุด)</span>
                          </label>
                          <select value={cfg.student_id_display_mode} onChange={e => setRoomConfig(roomItem.room, { student_id_display_mode: e.target.value })} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-primary)", color: "var(--text-primary)", fontSize: 12.5, outline: "none" }}>
                            <option value="full">โชว์รหัสแบบเต็ม (Full ID)</option>
                            <option value="masked">เซ็นเซอร์บางส่วน (Masked ID)</option>
                            <option value="hidden">ปิดการแสดงผล (Hidden)</option>
                          </select>
                        </div>

                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                          <div>
                            <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 4 }}>เวลาเริ่มบริการ</label>
                            <input type="time" value={cfg.auto_approve_start_time} onChange={e => setRoomConfig(roomItem.room, { auto_approve_start_time: e.target.value })} style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-primary)", color: "var(--text-primary)", fontSize: 13 }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 4 }}>เวลาปิดบริการ</label>
                            <input type="time" value={cfg.auto_approve_end_time} onChange={e => setRoomConfig(roomItem.room, { auto_approve_end_time: e.target.value })} style={{ width: "100%", padding: "7px 10px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-primary)", color: "var(--text-primary)", fontSize: 13 }} />
                          </div>
                        </div>

                        <div>
                          <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 8 }}>วันเปิดให้บริการอัตโนมัติ</label>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                            {dayDefs.map(day => {
                              const isOn = activeDays.includes(day.val);
                              return (
                                <button type="button" key={day.val} onClick={() => {
                                  const updated = isOn ? activeDays.filter(d => d !== day.val) : [...activeDays, day.val];
                                  updated.sort((a, b) => a - b);
                                  setRoomConfig(roomItem.room, { auto_approve_days: updated.join(",") });
                                }} style={{ padding: "5px 9px", borderRadius: 14, border: isOn ? `1.5px solid ${day.color}` : "1.5px solid var(--border)", background: isOn ? `${day.color}15` : "transparent", color: isOn ? "var(--text-primary)" : "var(--text-secondary)", fontSize: 11.5, fontWeight: isOn ? 700 : 500, cursor: "pointer" }}>
                                  {day.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Per-Room Individual Save Button */}
                <div style={{ marginTop: 12 }}>
                  <button
                    type="button"
                    onClick={() => saveSingleRoomSettings(roomItem.room, roomItem.ip)}
                    disabled={roomSaving[roomItem.room]}
                    className="btn-primary"
                    style={{
                      width: "100%",
                      justifyContent: "center",
                      borderRadius: 8,
                      padding: "10px 14px",
                      fontSize: 13,
                      fontWeight: 800,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      background: "linear-gradient(135deg, var(--smartaccess-purple) 0%, var(--edu-pink) 100%)",
                      border: "none",
                      color: "#fff",
                      transition: "all 0.2s ease",
                      boxShadow: "0 4px 12px rgba(124, 58, 237, 0.15)"
                    }}
                  >
                    <span style={{ display: "inline-flex" }}>{roomSaving[roomItem.room] ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}</span>
                    <span>{roomSaving[roomItem.room] ? "กำลังบันทึก..." : "บันทึกการตั้งค่าห้องนี้"}</span>
                  </button>
                </div>
              </article>
            );
          })}
          </div>
        )}
      </section>

      {/* Add room form */}
      <section className="room-form-band" style={{ marginTop: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 900, color: "var(--text-primary)", margin: "0 0 14px" }}>เพิ่มห้อง / บอร์ดใหม่</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, alignItems: "end" }}>
          <div>
            <label className="field-label">รหัสห้อง</label>
            <input className="smartaccess-input" placeholder="เช่น CE-403" value={newRoomCode} onChange={e => setNewRoomCode(e.target.value)} />
          </div>
          <div>
            <label className="field-label">IP Address / Domain</label>
            <input className="smartaccess-input" placeholder="เช่น 192.168.1.102" value={newRoomIp} onChange={e => setNewRoomIp(e.target.value)} />
          </div>
          <button type="button" onClick={() => handleAddRoom()} className="btn-primary" style={{ borderRadius: 8, minHeight: 46 }}>
            เพิ่มห้องลงรายการ
          </button>
        </div>
      </section>

      {/* OTA Firmware Control Center Card */}
      <div className="premium-card" style={{ padding: 26, marginTop: 24, borderLeft: "4px solid var(--smartaccess-purple)", background: "var(--bg-secondary)" }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--smartaccess-purple)" }}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          ระบบจัดการและกระจายเฟิร์มแวร์แบบไร้สาย (OTA Firmware Control Center)
        </h3>
        <p style={{ color: "var(--text-secondary)", fontSize: 12.5, marginBottom: 20 }}>
          อัปเดตและเผยแพร่ซอฟต์แวร์ของบอร์ดควบคุมหน้าห้องเรียนแบบไร้สาย (Cloud HTTPS OTA) โดยสตรีมไฟล์ไบเนรีตรงไปเก็บบนคลังคลาวด์ <strong>Supabase Storage (0% Vercel CPU Load)</strong> ได้ฟรีถาวร
        </p>

        {/* OTA Activity Logs */}
        <div style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", borderRadius: 10, padding: 18, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)" }}><span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><ClipboardList size={14} /> บันทึกกิจกรรม OTA แบบละเอียด</span></span>
            <button
              onClick={fetchFirmwareLogs}
              style={{ padding: "4px 10px", background: "none", border: "1px solid var(--border-medium)", color: "var(--smartaccess-purple)", fontSize: 11, borderRadius: 6, fontWeight: 700, cursor: "pointer" }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><RefreshCw size={13} /> รีเฟรช</span>
            </button>
          </div>
          {firmwareLogsLoading ? (
            <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-secondary)", fontSize: 12.5 }}>กำลังโหลด...</div>
          ) : firmwareLogs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-muted)", fontSize: 12 }}>ยังไม่มีบันทึกกิจกรรม OTA ในระบบ</div>
          ) : (
            <div style={{ maxHeight: 220, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
              {firmwareLogs.map((log: any) => {
                const isOtaTrigger = log.action === "firmware_ota_triggered";
                const isDelete = (log.notes || "").includes("ลบเฟิร์มแวร์");
                const icon = isOtaTrigger ? <Download size={16} /> : isDelete ? <Trash2 size={16} /> : <Rocket size={16} />;
                const color = isOtaTrigger ? "#3B82F6" : isDelete ? "#EF4444" : "#7C3AED";
                return (
                  <div key={log.id} style={{ padding: "8px 12px", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderLeft: `3px solid ${color}`, borderRadius: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <span style={{ fontSize: 12, color: "var(--text-primary)", fontWeight: 600 }}>
                        {icon} {log.notes || log.action}
                      </span>
                      <span style={{ fontSize: 10, color: "var(--text-muted)", whiteSpace: "nowrap", flexShrink: 0 }}>
                        {new Date(log.timestamp).toLocaleString("th-TH", { timeZone: "Asia/Bangkok", year: "2-digit", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    {log.ip_address && (
                      <span style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 2, display: "block" }}>
                        IP: {log.ip_address} · ห้อง: {log.room_code || "-"}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20, marginBottom: 24 }}>
          {/* Upload firmware form */}
          <div style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", borderRadius: 10, padding: 18 }}>
            <span style={{ display: "block", fontSize: 13, fontWeight: 800, color: "var(--text-primary)", marginBottom: 12 }}><span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><UploadCloud size={14} /> อัปโหลดเฟิร์มแวร์รุ่นใหม่ (.bin)</span></span>

            <form onSubmit={async (e) => {
              e.preventDefault();
              if (!firmwareVersionInput || !firmwarePublicUrlInput) {
                showToast("กรุณากรอกเวอร์ชันและลิงก์จัดเก็บไฟล์ให้ครบถ้วน", "error");
                return;
              }
              if (!/^[0-9.]+$/.test(firmwareVersionInput)) {
                showToast("เลขเวอร์ชันต้องเป็นตัวเลขและจุดทศนิยมเท่านั้น (ตัวอย่าง: 1.0.2)", "error");
                return;
              }

              // Use context function
              handleUploadFirmware(e);
            }} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 4 }}>รุ่นซอฟต์แวร์ (Version) *</label>
                <input
                  className="smartaccess-input"
                  placeholder="เช่น 1.0.2 (ห้ามใส่ v)"
                  value={firmwareVersionInput}
                  onChange={e => setFirmwareVersionInput(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 4 }}>ลิงก์ไฟล์ไบนารี (.bin public URL) *</label>
                <input
                  type="url"
                  className="smartaccess-input"
                  placeholder="วางลิงก์ CDN หรือ Supabase Storage..."
                  value={firmwarePublicUrlInput}
                  onChange={e => setFirmwarePublicUrlInput(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>คำอธิบาย: ระบบจะปล่อยอัปเดตให้อุปกรณ์ ESP32 ทุกเครื่องเช็กไฟล์ใหม่ผ่านเครือข่ายอินเทอร์เน็ตทันที</span>
              </div>

              <button
                type="submit"
                disabled={settingsLoading}
                className="btn-primary"
                style={{ width: "100%", justifyContent: "center", borderRadius: 8, padding: "10px 14px", fontSize: 13 }}
              >
                {settingsLoading ? <><Loader2 size={14} className="animate-spin" /> กำลังบันทึก...</> : <><Rocket size={14} /> เปิดตัวปล่อยอัปเดตแบบไร้สาย (Deploy OTA)</>}
              </button>
            </form>
          </div>

          {/* Catalog list */}
          <div style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", borderRadius: 10, padding: 18 }}>
            <span style={{ display: "block", fontSize: 13, fontWeight: 800, color: "var(--text-primary)", marginBottom: 12 }}><span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><FolderOpen size={14} /> แค็ตตาล็อกเฟิร์มแวร์ทั้งหมด</span></span>
            {firmwareReleasesLoading ? (
              <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-secondary)", fontSize: 12.5 }}>กำลังโหลด...</div>
            ) : firmwareReleases.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-muted)", fontSize: 12 }}>ยังไม่มีไฟล์เฟิร์มแวร์ในคลังคลาวด์</div>
            ) : (
              <div style={{ maxHeight: 280, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                {firmwareReleases.map((release: any) => (
                  <div key={release.id} style={{ padding: "10px 12px", background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: 12.5, color: "var(--smartaccess-purple-dark)" }}>Version {release.version}</div>
                      <div style={{ fontSize: 10, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>{release.url}</div>
                      <div style={{ fontSize: 9.5, color: "var(--text-secondary)", marginTop: 4 }}>
                        ปล่อยเมื่อ: {new Date(release.uploaded_at).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        if (!confirm(`ต้องการลบเฟิร์มแวร์รุ่น ${release.version} ใช่หรือไม่?`)) return;
                        try {
                          const res = await fetch(`/api/system/firmware?id=${release.id}`, { method: "DELETE" });
                          if (res.ok) {
                            showToast(`ลบเฟิร์มแวร์รุ่น ${release.version} สำเร็จ`, "success");
                            fetchFirmwares();
                            fetchFirmwareLogs();
                            fetchSystemStatus();
                          }
                        } catch {
                          showToast("ลบเฟิร์มแวร์ไม่สำเร็จ", "error");
                        }
                      }}
                      className="btn-danger-light"
                      style={{ padding: "6px 10px", borderRadius: 6, fontSize: 11, fontWeight: 700 }}
                    >
                      ลบ
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
