"use client";
import React from "react";
import { AccessLog } from "./DashboardContext";

// --- Time and Date Helpers ---
export function formatDateTime(dt: string | null | undefined): string {
  if (!dt) return "-";
  const d = new Date(dt);
  const day = d.getDate().toString().padStart(2, "0");
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const year = d.getFullYear() + 543;
  const h = d.getHours().toString().padStart(2, "0");
  const m = d.getMinutes().toString().padStart(2, "0");
  const s = d.getSeconds().toString().padStart(2, "0");
  return `${day}/${month}/${year} ${h}:${m}:${s} น.`;
}

const PENDING_TIMEOUT_SECONDS = 300;
export function PendingCountdown({ registeredAt }: { registeredAt: string }) {
  const [remaining, setRemaining] = React.useState<number>(() => {
    const elapsed = (Date.now() - new Date(registeredAt).getTime()) / 1000;
    return Math.max(0, Math.ceil(PENDING_TIMEOUT_SECONDS - elapsed));
  });
  React.useEffect(() => {
    const startMs = new Date(registeredAt).getTime();
    const tick = () => {
      const elapsed = (Date.now() - startMs) / 1000;
      setRemaining(Math.max(0, Math.ceil(PENDING_TIMEOUT_SECONDS - elapsed)));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [registeredAt]);

  const mm = Math.floor(remaining / 60).toString().padStart(2, "0");
  const ss = (remaining % 60).toString().padStart(2, "0");
  const expired = remaining <= 0;
  const urgent = remaining > 0 && remaining <= 60;

  const bg = expired
    ? "linear-gradient(135deg, rgba(239,68,68,0.18), rgba(220,38,38,0.12))"
    : urgent
      ? "linear-gradient(135deg, rgba(249,115,22,0.18), rgba(234,88,12,0.12))"
      : "linear-gradient(135deg, rgba(124,58,237,0.15), rgba(219,39,119,0.12))";
  const border = expired
    ? "1px solid rgba(239,68,68,0.45)"
    : urgent
      ? "1px solid rgba(249,115,22,0.45)"
      : "1px solid rgba(124,58,237,0.3)";
  const color = expired ? "#DC2626" : urgent ? "#EA580C" : "var(--smartaccess-purple-dark, #5B21B6)";

  return (
    <span
      title={expired ? "เลยกำหนดอนุมัติแล้ว — รอ auto-reject" : "เวลาที่เหลือก่อนถูกปฏิเสธอัตโนมัติ (5 นาที)"}
      style={{
        background: bg,
        border,
        borderRadius: 8,
        padding: "4px 10px",
        fontSize: 11.5,
        color,
        fontWeight: 800,
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontVariantNumeric: "tabular-nums",
      }}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 2h12M6 22h12M6 2v4a6 6 0 0 0 12 0V2M18 22v-4a6 6 0 0 0-12 0v4" />
      </svg>
      {expired ? (
        <span>หมดเวลาแล้ว</span>
      ) : (
        <>
          <span>หมดเวลาใน</span>
          <span style={{ fontSize: 12.5, letterSpacing: 0.5 }}>{mm}:{ss}</span>
        </>
      )}
    </span>
  );
}

// ─── Minimalist Vector SVGs ───
export const ClockIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);

export const UsersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
  </svg>
);

export const SettingsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

export const TVIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
    <polyline points="17 2 12 7 7 2" />
  </svg>
);

export const UnlockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 9.9-1" />
  </svg>
);

export const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

export const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export const CrossIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export const SaveIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

export const FileTextIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4 }}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

export const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 6 }}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

export const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 6 }}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export const AlertIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 6 }}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

export const TerminalIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 6 }}>
    <polyline points="4 17 10 11 4 5" />
    <line x1="12" y1="19" x2="20" y2="19" />
  </svg>
);

export const CrownIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
    <path d="M3 20h18" />
  </svg>
);

export const KeyIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3" />
  </svg>
);

export const IdCardIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4 }}>
    <rect x="3" y="4" width="18" height="16" rx="2" ry="2" />
    <line x1="7" y1="8" x2="17" y2="8" />
    <line x1="7" y1="12" x2="17" y2="12" />
    <line x1="7" y1="16" x2="13" y2="16" />
  </svg>
);

export const GraduationIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4 }}>
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
  </svg>
);

export const FacultyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4 }}>
    <path d="M4 22V4c0-.5.2-1 .6-1.4C5 2.2 5.5 2 6 2h12c.5 0 1 .2 1.4.6.4.4.6.9.6 1.4v18" />
    <path d="M10 6h4" />
    <path d="M10 10h4" />
    <path d="M10 14h4" />
    <path d="M10 18h4" />
  </svg>
);

export const BranchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4 }}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

export const ACTION_METADATA: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  registered: { label: "ลงทะเบียนใหม่", icon: <FileTextIcon />, color: "var(--smartaccess-purple)" },
  approved: { label: "อนุมัติสิทธิ์", icon: <CheckIcon />, color: "#10B981" },
  rejected: { label: "ปฏิเสธสิทธิ์", icon: <CrossIcon />, color: "#EF4444" },
  door_opened: { label: "ผ่านประตูสำเร็จ", icon: <UnlockIcon />, color: "#10B981" },
  door_failed: { label: "ผ่านประตูล้มเหลว", icon: <AlertIcon />, color: "#F59E0B" },
  export_pdf: { label: "จัดทำรายงาน PDF", icon: <SaveIcon />, color: "#3B82F6" },
  maintenance_cleanup: { label: "บำรุงรักษาระบบ", icon: <TerminalIcon />, color: "#7C3AED" },
  maintenance_purge: { label: "ล้างประวัติระบบ", icon: <TrashIcon />, color: "#D97706" },
  // ── เหตุการณ์เพิ่มเติม / ความปลอดภัย ──
  bypass_rate_limited: { label: "Bypass ถี่เกินกำหนด", icon: <AlertIcon />, color: "#F59E0B" },
  bypass_denied: { label: "Bypass ถูกปฏิเสธ", icon: <CrossIcon />, color: "#EF4444" },
  qr_expired: { label: "QR หมดอายุ", icon: <AlertIcon />, color: "#F59E0B" },
  qr_invalid: { label: "QR ไม่ถูกต้อง", icon: <CrossIcon />, color: "#EF4444" },
  login_rate_limited: { label: "ล็อกอินถี่เกินไป", icon: <AlertIcon />, color: "#F59E0B" },
  admin_login: { label: "แอดมินเข้าสู่ระบบ", icon: <CheckIcon />, color: "#3B82F6" },
  admin_logout: { label: "แอดมินออกจากระบบ", icon: <TerminalIcon />, color: "#6B7280" },
  admin_login_failed: { label: "ล็อกอินล้มเหลว", icon: <AlertIcon />, color: "#EF4444" },
  admin_created: { label: "สร้างผู้ดูแลระบบ", icon: <CheckIcon />, color: "#10B981" },
  admin_updated: { label: "แก้ไขผู้ดูแลระบบ", icon: <FileTextIcon />, color: "#3B82F6" },
  admin_deleted: { label: "ลบผู้ดูแลระบบ", icon: <TrashIcon />, color: "#D97706" },
  settings_updated: { label: "อัปเดตการตั้งค่า", icon: <FileTextIcon />, color: "#7C3AED" },
  firmware_deployed: { label: "ปล่อยเฟิร์มแวร์ใหม่", icon: <SaveIcon />, color: "#7C3AED" },
  firmware_ota_triggered: { label: "ESP32 ดาวน์โหลด OTA", icon: <TerminalIcon />, color: "#3B82F6" },
  student_deleted: { label: "ลบข้อมูลนักศึกษา", icon: <TrashIcon />, color: "#D97706" },
  esp32_offline: { label: "ESP32 ออฟไลน์", icon: <AlertIcon />, color: "#EF4444" },
  hmac_invalid: { label: "ลายเซ็น HMAC ผิด", icon: <AlertIcon />, color: "#EF4444" },
  unauthorized_access: { label: "เข้าถึงโดยไม่ได้รับสิทธิ์", icon: <AlertIcon />, color: "#EF4444" },
};

/** ย่อ User-Agent → "อุปกรณ์ · เบราว์เซอร์" สำหรับแสดงในตาราง logs */
export function formatDeviceFromUA(ua?: string): string {
  if (!ua) return "ไม่ทราบ";
  let browser = "Other";
  if (ua.includes("Edg/")) browser = "Edge";
  else if (ua.includes("Chrome/") && !ua.includes("Chromium/")) browser = "Chrome";
  else if (ua.includes("Firefox/")) browser = "Firefox";
  else if (ua.includes("Safari/") && !ua.includes("Chrome/")) browser = "Safari";
  else if (ua.includes("OPR/") || ua.includes("Opera/")) browser = "Opera";

  let device = "Desktop";
  if (/Android/i.test(ua)) device = "Android";
  else if (/iPhone|iPad|iPod/i.test(ua)) device = "iOS";
  else if (/Windows/i.test(ua)) device = "Windows";
  else if (/Macintosh|Mac OS/i.test(ua)) device = "Mac";
  else if (/Linux/i.test(ua)) device = "Linux";
  return `${device} · ${browser}`;
}

export function getLogActionMetadata(log: AccessLog) {
  if (log.action === "rejected" && log.esp32_response === "System Cleanup") {
    return ACTION_METADATA.maintenance_cleanup;
  }
  if (log.action === "rejected" && log.esp32_response === "System Format") {
    return ACTION_METADATA.maintenance_purge;
  }
  return ACTION_METADATA[log.action] || { label: log.action, icon: <TerminalIcon />, color: "var(--text-primary)" };
}

export function isAccessRejectedLog(log: AccessLog): boolean {
  return log.action === "rejected" && !["System Cleanup", "System Format"].includes(log.esp32_response || "");
}

export function renderLogNotes(notes?: string) {
  if (!notes) return <span style={{ color: "var(--text-muted)" }}>-</span>;

  const lines = notes.split("\n");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (trimmed.startsWith("•")) {
          return (
            <div key={idx} style={{
              fontSize: "11px",
              color: "var(--text-secondary)",
              display: "flex",
              alignItems: "flex-start",
              gap: 6,
              paddingLeft: 8,
              lineHeight: 1.4
            }}>
              <span style={{ color: "var(--smartaccess-purple)", fontWeight: "bold", marginTop: 2 }}>•</span>
              <span>{trimmed.replace(/^•\s*/, "")}</span>
            </div>
          );
        }
        if (trimmed.startsWith("⚡")) {
          return (
            <div key={idx} style={{
              fontSize: "12px",
              fontWeight: 800,
              color: "#D97706",
              display: "flex",
              alignItems: "flex-start",
              gap: 6,
              lineHeight: 1.4,
              marginBottom: 4
            }}>
              <span style={{ marginTop: 2 }}>⚡</span>
              <span>{trimmed.replace(/^⚡\s*/, "")}</span>
            </div>
          );
        }
        return (
          <div key={idx} style={{ fontSize: "11.5px", fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.4 }}>
            {line}
          </div>
        );
      })}
    </div>
  );
}
