"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

interface Student {
  id: number;
  title: string;
  first_name: string;
  last_name: string;
  student_id: string;
  year: number;
  faculty: string;
  branch: string;
  status: "pending" | "approved" | "rejected";
  registered_at: string;
  approved_at?: string;
  rejection_reason?: string;
  approver_name?: string;
  last_door_open?: string;
  ip_address?: string;
  requested_room?: string;
}

interface AdminUser {
  id: number;
  username: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  last_login?: string;
  allowed_rooms?: string | null;
}

interface AccessLog {
  id: number;
  student_name?: string;
  student_code?: string;
  action: string;
  admin_name?: string;
  timestamp: string;
  esp32_response?: string;
  notes?: string;
  requested_room?: string;
}

interface CurrentUser {
  id: number;
  username: string;
  full_name: string;
  role: "owner" | "door_operator" | "log_viewer";
}

function formatDateTime(dt: string | null | undefined): string {
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

// ─── Pending Auto-Reject Countdown (5 นาทีตรงกับ lib/auto-reject.ts) ───
const PENDING_TIMEOUT_SECONDS = 300;
function PendingCountdown({ registeredAt }: { registeredAt: string }) {
  const [remaining, setRemaining] = useState<number>(() => {
    const elapsed = (Date.now() - new Date(registeredAt).getTime()) / 1000;
    return Math.max(0, Math.ceil(PENDING_TIMEOUT_SECONDS - elapsed));
  });
  useEffect(() => {
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
const ClockIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);

const UsersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const SettingsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const TVIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
    <polyline points="17 2 12 7 7 2" />
  </svg>
);

const LogoutIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const UnlockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 9.9-1" />
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const CrossIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const SaveIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

const FileTextIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4 }}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 6 }}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 6 }}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const AlertIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 6 }}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const TerminalIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 6 }}>
    <polyline points="4 17 10 11 4 5" />
    <line x1="12" y1="19" x2="20" y2="19" />
  </svg>
);

const CrownIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
    <path d="M3 20h18" />
  </svg>
);

const KeyIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3" />
  </svg>
);

const SuccessBadgeIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const IdCardIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4 }}>
    <rect x="3" y="4" width="18" height="16" rx="2" ry="2" />
    <line x1="7" y1="8" x2="17" y2="8" />
    <line x1="7" y1="12" x2="17" y2="12" />
    <line x1="7" y1="16" x2="13" y2="16" />
  </svg>
);

const GraduationIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4 }}>
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
  </svg>
);

const FacultyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4 }}>
    <path d="M4 22V4c0-.5.2-1 .6-1.4C5 2.2 5.5 2 6 2h12c.5 0 1 .2 1.4.6.4.4.6.9.6 1.4v18" />
    <path d="M10 6h4" />
    <path d="M10 10h4" />
    <path d="M10 14h4" />
    <path d="M10 18h4" />
  </svg>
);

const BranchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4 }}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const MenuIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4 }}>
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const ACTION_METADATA: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  registered: { label: "ลงทะเบียนใหม่", icon: <FileTextIcon />, color: "var(--smartaccess-purple)" },
  approved: { label: "อนุมัติสิทธิ์", icon: <CheckIcon />, color: "#10B981" },
  rejected: { label: "ปฏิเสธสิทธิ์", icon: <CrossIcon />, color: "#EF4444" },
  door_opened: { label: "ผ่านประตูสำเร็จ", icon: <UnlockIcon />, color: "#10B981" },
  door_failed: { label: "ผ่านประตูล้มเหลว", icon: <AlertIcon />, color: "#F59E0B" },
  export_pdf: { label: "จัดทำรายงาน PDF", icon: <SaveIcon />, color: "#3B82F6" },
  maintenance_cleanup: { label: "บำรุงรักษาระบบ", icon: <TerminalIcon />, color: "#7C3AED" },
  maintenance_purge: { label: "ล้างประวัติระบบ", icon: <TrashIcon />, color: "#D97706" },
};

function getLogActionMetadata(log: AccessLog) {
  if (log.action === "rejected" && log.esp32_response === "System Cleanup") {
    return ACTION_METADATA.maintenance_cleanup;
  }
  if (log.action === "rejected" && log.esp32_response === "System Format") {
    return ACTION_METADATA.maintenance_purge;
  }
  return ACTION_METADATA[log.action] || { label: log.action, icon: <TerminalIcon />, color: "var(--text-primary)" };
}

function isAccessRejectedLog(log: AccessLog): boolean {
  return log.action === "rejected" && !["System Cleanup", "System Format"].includes(log.esp32_response || "");
}

function renderLogNotes(notes?: string) {
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
              color: "#D97706", // Amber color
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

const IDLE_TIMEOUT = 15 * 60 * 1000; // 15 นาที
const WARNING_BEFORE = 2 * 60 * 1000; // เตือนล่วงหน้า 2 นาที

function useIdleTimer(onTimeout: () => void, onWarning: (isWarning: boolean) => void) {
  const timeoutTimerRef = useRef<any>(null);
  const warningTimerRef = useRef<any>(null);

  const resetTimer = useCallback(() => {
    if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);

    onWarning(false);

    warningTimerRef.current = setTimeout(() => {
      onWarning(true);
    }, IDLE_TIMEOUT - WARNING_BEFORE);

    timeoutTimerRef.current = setTimeout(() => {
      onTimeout();
    }, IDLE_TIMEOUT);
  }, [onTimeout, onWarning]);

  useEffect(() => {
    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    const handleActivity = () => {
      resetTimer();
    };

    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });

    resetTimer();

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      if (timeoutTimerRef.current) clearTimeout(timeoutTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    };
  }, [resetTimer]);

  return { resetTimer };
}

export default function AdminDashboard() {
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);

  const handleTimeout = useCallback(() => {
    fetch("/api/auth/logout", { method: "POST" })
      .finally(() => {
        router.push("/admin/login?reason=idle");
      });
  }, [router]);

  const handleWarning = useCallback((isWarning: boolean) => {
    setShowWarning(isWarning);
  }, []);

  const { resetTimer } = useIdleTimer(handleTimeout, handleWarning);

  return (
    <>
      <AdminDashboardInner />
      {showWarning && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15,17,23,0.75)",
          backdropFilter: "blur(4px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 99999,
        }}>
          <div style={{
            background: "#1E1E2E",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16,
            padding: 32,
            maxWidth: 400,
            width: "90%",
            textAlign: "center",
            boxShadow: "0 20px 50px rgba(0,0,0,0.5)"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 16,
              color: "var(--smartaccess-purple)"
            }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2h12" />
                <path d="M6 22h12" />
                <path d="M6 2v4a6 6 0 0 0 12 0V2" />
                <path d="M18 22v-4a6 6 0 0 0-12 0v4" />
              </svg>
            </div>
            <h3 style={{
              fontSize: 18,
              fontWeight: 800,
              color: "#F0F4F0",
              marginBottom: 12
            }}>
              ไม่มีกิจกรรมมาระยะหนึ่งแล้ว
            </h3>
            <p style={{
              fontSize: 14,
              color: "#9EA8A0",
              lineHeight: 1.5,
              marginBottom: 24
            }}>
              Session ของคุณจะหมดอายุภายใน 2 นาที กดเพื่อต่ออายุ Session
            </p>
            <button
              onClick={resetTimer}
              style={{
                width: "100%",
                padding: "12px 24px",
                borderRadius: 10,
                background: "linear-gradient(135deg, var(--smartaccess-purple) 0%, var(--edu-pink) 100%)",
                color: "#fff",
                border: "none",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(124,58,237,0.3)",
                transition: "all 0.2s"
              }}
            >
              ต่ออายุ Session
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function AdminDashboardInner() {
  const router = useRouter();
  const [tab, setTab] = useState<"pending" | "all" | "admins" | "settings" | "rooms" | "guide" | "iot">("pending");
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [pending, setPending] = useState<Student[]>([]);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [pendingRoomFilter, setPendingRoomFilter] = useState<string>("all");
  const lastPendingCountRef = useRef(0);

  const playSoftChime = useCallback(() => {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const now = ctx.currentTime;

      // Soft Bell main tone
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(880, now); // A5 tone
      osc1.frequency.exponentialRampToValueAtTime(1320, now + 0.12); // Ramp to E6

      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      // Warm undertone
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(523.25, now); // C5 chord tone

      gain2.gain.setValueAtTime(0.06, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.6);
      osc2.stop(now + 0.6);
    } catch (err) {
      console.error("Web Audio API not supported or deferred:", err);
    }
  }, []);

  const [allStudents, setAll] = useState<Student[]>([]);
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: number; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [settings, setSettings] = useState({
    auto_approve_enabled: false,
    auto_approve_start_time: "09:00",
    auto_approve_end_time: "16:00",
    auto_approve_days: "1,2,3,4,5",
    discord_webhook_register: "",
    discord_webhook_approve: "",
    discord_webhook_logs: "",
    discord_webhook_admin_audit: "",
    auto_fill_enabled: true,
    auto_fill_mode: "auto",
    student_id_display_mode: "full",
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [roomSaving, setRoomSaving] = useState<Record<string, boolean>>({});
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [rawSettings, setRawSettings] = useState<Record<string, string>>({});
  const [activeRoomDetails, setActiveRoomDetails] = useState<{ room: string; ip: string } | null>(null);
  const [roomDetailsTab, setRoomDetailsTab] = useState<"api" | "webhook" | "arduino">("api");
  const [roomWebhookRegisterInput, setRoomWebhookRegisterInput] = useState("");
  const [roomWebhookApproveInput, setRoomWebhookApproveInput] = useState("");
  const [roomWebhookLogsInput, setRoomWebhookLogsInput] = useState("");
  const [roomDetailsLoading, setRoomDetailsLoading] = useState(false);
  const [originUrl] = useState(() => (typeof window !== "undefined" ? window.location.origin : ""));

  // Multi-Room dynamic states
  const [roomsList, setRoomsList] = useState<{ room: string; ip: string }[]>([]);
  const [newRoomCode, setNewRoomCode] = useState("");

  // Per-room settings (auto_approve, auto_fill, student_id_display_mode)
  interface RoomConfig { auto_approve_enabled: boolean; auto_approve_start_time: string; auto_approve_end_time: string; auto_approve_days: string; auto_fill_enabled: boolean; auto_fill_mode: string; student_id_display_mode: string; }
  const defaultRoomConfig = (): RoomConfig => ({ auto_approve_enabled: false, auto_approve_start_time: "09:00", auto_approve_end_time: "16:00", auto_approve_days: "1,2,3,4,5", auto_fill_enabled: true, auto_fill_mode: "auto", student_id_display_mode: "full" });
  const [roomConfigs, setRoomConfigs] = useState<Record<string, RoomConfig>>({});
  const [expandedRoomSettings, setExpandedRoomSettings] = useState<Set<string>>(new Set());
  const toggleRoomSettings = (room: string) => setExpandedRoomSettings(prev => { const n = new Set(prev); n.has(room) ? n.delete(room) : n.add(room); return n; });
  const setRoomConfig = (room: string, patch: Partial<RoomConfig>) => setRoomConfigs(prev => ({ ...prev, [room]: { ...(prev[room] ?? defaultRoomConfig()), ...patch } }));
  const [newRoomIp, setNewRoomIp] = useState("");
  const [testingRoom, setTestingRoom] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { online: boolean; ip: string; mode: string }>>({});
  const [firmwareMode, setFirmwareMode] = useState<"wokwi" | "physical">("physical");

  // Premium Dashboard Features (2026-05)
  // Multi-select state for bulk student requests in the pending queue
  const [selectedPendingIds, setSelectedPendingIds] = useState<number[]>([]);
  // Bulk operations loading indicator
  const [bulkLoading, setBulkLoading] = useState(false);

  // ─── Mobile Swipe-to-Action state ────────────────────────────────────────
  const touchStartX = useRef<Record<number, number>>({});
  const [swipeOffset, setSwipeOffset] = useState<Record<number, number>>({}); // px
  const [swipeAction, setSwipeAction] = useState<Record<number, "approve" | "reject" | null>>({});

  const handleTouchStart = (id: number, e: React.TouchEvent) => {
    touchStartX.current[id] = e.touches[0].clientX;
  };
  const handleTouchMove = (id: number, e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - (touchStartX.current[id] || 0);
    const clamped = Math.max(-80, Math.min(80, dx));
    setSwipeOffset(prev => ({ ...prev, [id]: clamped }));
    setSwipeAction(prev => ({ ...prev, [id]: clamped > 40 ? "approve" : clamped < -40 ? "reject" : null }));
  };
  const handleTouchEnd = (id: number, name: string) => {
    const action = swipeAction[id];
    setSwipeOffset(prev => ({ ...prev, [id]: 0 }));
    setSwipeAction(prev => ({ ...prev, [id]: null }));
    if (action === "approve") {
      if (navigator.vibrate) navigator.vibrate(50);
      handleApprove(id);
    } else if (action === "reject") {
      if (navigator.vibrate) navigator.vibrate([30, 20, 30]);
      setRejectModal({ id, name });
    }
  };

  // ─── Analytics state ──────────────────────────────────────────────────────
  const [analyticsData, setAnalyticsData] = useState<{
    heatmap?: { day_of_week: number; hour: number; count: number }[];
    admin_stats?: { full_name: string; role: string; approved_count: number; rejected_count: number; door_opened_count?: number; approval_rate_pct: number | null }[];
    room_utilization?: { room: string; door_opens: number; approvals: number; active_days: number }[];
    kpi?: { reg_7d: number; approved_7d: number; opens_7d: number; rejected_7d: number; reg_24h: number; opens_24h: number };
  } | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const analyticsLoadingRef = useRef(false);
  const fetchAnalytics = useCallback(async () => {
    if (analyticsLoadingRef.current) return;
    analyticsLoadingRef.current = true;
    setAnalyticsLoading(true);
    try {
      const r = await fetch("/api/system/analytics");
      if (r.ok) setAnalyticsData(await r.json());
    } finally {
      analyticsLoadingRef.current = false;
      setAnalyticsLoading(false);
    }
  }, []);

  // Bulk Approve handler
  async function handleBulkApprove() {
    if (selectedPendingIds.length === 0) return;
    if (!confirm(`ต้องการอนุมัติคำขอที่เลือกทั้งหมดจำนวน ${selectedPendingIds.length} รายการ และสั่งเปิดประตู ใช่หรือไม่?`)) return;
    setBulkLoading(true);
    let successCount = 0;
    let failCount = 0;
    try {
      await Promise.all(
        selectedPendingIds.map(async (id) => {
          try {
            const r = await fetch(`/api/students/${id}/approve`, { method: "POST" });
            if (r.ok) {
              successCount++;
            } else {
              failCount++;
            }
          } catch {
            failCount++;
          }
        })
      );
      showToast(`⚡ อนุมัติแบบกลุ่มสำเร็จ: อนุมัติสำเร็จ ${successCount} รายการ${failCount > 0 ? `, ล้มเหลว ${failCount} รายการ` : ""}`, successCount > 0 ? "success" : "error");
      setSelectedPendingIds([]);
      fetchPending();
      if (tab === "all") {
        fetchAll();
        fetchLogs();
      }
    } catch {
      showToast("เกิดข้อผิดพลาดเครือข่ายในการดำเนินการแบบกลุ่ม", "error");
    } finally {
      setBulkLoading(false);
    }
  }

  // Bulk Reject handler
  async function handleBulkReject() {
    if (selectedPendingIds.length === 0) return;
    const reason = prompt("กรุณาระบุเหตุผลการปฏิเสธคำขอทั้งหมดที่เลือก:", "ไม่ได้รับสิทธิ์เข้าใช้ระบบแบบกลุ่มโดยแอดมิน");
    if (reason === null) return; // cancelled
    setBulkLoading(true);
    let successCount = 0;
    let failCount = 0;
    try {
      await Promise.all(
        selectedPendingIds.map(async (id) => {
          try {
            const r = await fetch(`/api/students/${id}/reject`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ reason }),
            });
            if (r.ok) {
              successCount++;
            } else {
              failCount++;
            }
          } catch {
            failCount++;
          }
        })
      );
      showToast(`❌ ปฏิเสธแบบกลุ่มสำเร็จ: ดำเนินการสำเร็จ ${successCount} รายการ${failCount > 0 ? `, ล้มเหลว ${failCount} รายการ` : ""}`, "error");
      setSelectedPendingIds([]);
      fetchPending();
      if (tab === "all") {
        fetchAll();
        fetchLogs();
      }
    } catch {
      showToast("เกิดข้อผิดพลาดเครือข่ายในการดำเนินการแบบกลุ่ม", "error");
    } finally {
      setBulkLoading(false);
    }
  }

  const fetchSettings = useCallback(async () => {
    try {
      const r = await fetch("/api/system/settings");
      if (r.ok) {
        const data = await r.json();
        if (data.settings) {
          setRawSettings(data.settings || {});
          setSettings({
            auto_approve_enabled: data.settings.auto_approve_enabled === "1",
            auto_approve_start_time: data.settings.auto_approve_start_time || "09:00",
            auto_approve_end_time: data.settings.auto_approve_end_time || "16:00",
            auto_approve_days: data.settings.auto_approve_days || "1,2,3,4,5",
            discord_webhook_register: data.settings.discord_webhook_register || "",
            discord_webhook_approve: data.settings.discord_webhook_approve || "",
            discord_webhook_logs: data.settings.discord_webhook_logs || "",
            discord_webhook_admin_audit: data.settings.discord_webhook_admin_audit || "",
            auto_fill_enabled: data.settings.auto_fill_enabled === "1",
            auto_fill_mode: data.settings.auto_fill_mode || "auto",
            student_id_display_mode: data.settings.student_id_display_mode || "full",
          });

          // Parse dynamic configured rooms
          const confRooms = data.settings.configured_rooms || "CE-401,CE-402";
          const rooms = confRooms.split(",").filter(Boolean).map((rm: string) => ({
            room: rm,
            ip: data.settings[`room_ip_${rm}`] || "192.168.1.100"
          }));
          setRoomsList(rooms);

          // Load per-room configs
          const configs: Record<string, RoomConfig> = {};
          rooms.forEach(({ room: rm }: { room: string }) => {
            configs[rm] = {
              auto_approve_enabled: data.settings[`rcfg_${rm}_auto_approve_enabled`] === "1",
              auto_approve_start_time: data.settings[`rcfg_${rm}_auto_approve_start_time`] || "09:00",
              auto_approve_end_time: data.settings[`rcfg_${rm}_auto_approve_end_time`] || "16:00",
              auto_approve_days: data.settings[`rcfg_${rm}_auto_approve_days`] || "1,2,3,4,5",
              auto_fill_enabled: data.settings[`rcfg_${rm}_auto_fill_enabled`] !== "0",
              auto_fill_mode: data.settings[`rcfg_${rm}_auto_fill_mode`] || "auto",
              student_id_display_mode: data.settings[`rcfg_${rm}_student_id_display_mode`] || "full",
            };
          });
          setRoomConfigs(configs);
        }
      }
    } catch (err) {
      console.error("Failed to fetch settings", err);
    } finally {
      setSettingsLoaded(true);
    }
  }, []);

  const handleOpenRoomDetails = (room: string, ip: string) => {
    setActiveRoomDetails({ room, ip });
    setRoomDetailsTab("api");
    setRoomWebhookRegisterInput(rawSettings[`room_webhook_register_${room}`] || "");
    setRoomWebhookApproveInput(rawSettings[`room_webhook_approve_${room}`] || "");
    setRoomWebhookLogsInput(rawSettings[`room_webhook_logs_${room}`] || "");
  };

  const handleSaveRoomWebhook = async () => {
    if (!activeRoomDetails) return;
    setRoomDetailsLoading(true);
    try {
      const response = await fetch("/api/system/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          custom_settings: {
            [`room_webhook_register_${activeRoomDetails.room}`]: roomWebhookRegisterInput,
            [`room_webhook_approve_${activeRoomDetails.room}`]: roomWebhookApproveInput,
            [`room_webhook_logs_${activeRoomDetails.room}`]: roomWebhookLogsInput,
          }
        })
      });
      if (response.ok) {
        showToast(`บันทึก Webhook ประจำห้อง ${activeRoomDetails.room} สำเร็จ`, "success");
        await fetchSettings();
      } else {
        showToast("บันทึกไม่สำเร็จ กรุณาลองใหม่", "error");
      }
    } catch {
      showToast("เกิดข้อผิดพลาดเครือข่าย", "error");
    } finally {
      setRoomDetailsLoading(false);
    }
  };

  const handleTestWebhook = async (webhookUrl: string, type: "register" | "approve" | "logs" | "admin_audit", room?: string) => {
    if (!webhookUrl || !webhookUrl.trim().startsWith("https://discord.com/api/webhooks/")) {
      showToast(" ลิงก์ Discord Webhook ไม่ถูกต้อง หรือไม่ได้ระบุ", "error");
      return;
    }
    showToast(" กำลังส่งข้อความทดสอบ...", "success");
    try {
      const response = await fetch("/api/system/test-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: webhookUrl.trim(),
          type,
          room: room || "default"
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        showToast(" ส่งข้อความทดสอบเข้า Discord สำเร็จเรียบร้อยแล้ว!", "success");
      } else {
        showToast(data.error || "เกิดข้อผิดพลาดในการส่งบอท Discord", "error");
      }
    } catch {
      showToast("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์", "error");
    }
  };

  const copyToClipboard = (text: string) => {
    if (typeof window !== "undefined" && navigator && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => showToast(" คัดลอกสำเร็จ", "success"))
        .catch(() => fallbackCopyToClipboard(text));
    } else {
      fallbackCopyToClipboard(text);
    }
  };

  const fallbackCopyToClipboard = (text: string) => {
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);
      if (successful) {
        showToast(" คัดลอกสำเร็จ (ผ่านระบบสำรอง)", "success");
      } else {
        showToast(" ไม่สามารถคัดลอกได้โดยอัตโนมัติ กรุณาก็อปปี้ด้วยตนเอง", "error");
      }
    } catch {
      showToast(" ไม่สามารถคัดลอกได้ กรุณาก็อปปี้ด้วยตนเอง", "error");
    }
  };

  const getConfigCode = (roomCode: string, origin: string, mode: "wokwi" | "physical" = "physical") => {
    const wifiBlock = mode === "wokwi"
      ? `const char *ssid     = "Wokwi-GUEST";
const char *password = "";`
      : `const char *ssid     = "YOUR_WIFI_SSID";      // ← แก้เป็นชื่อ Wi-Fi จริง
const char *password = "YOUR_WIFI_PASSWORD"; // ← แก้เป็นรหัส Wi-Fi จริง`;

    const certBlock = mode === "wokwi"
      ? `// Wokwi Simulator — ไม่ต้องใช้ CA Certificate (setInsecure() ถูกใช้แทน)
// สำหรับบอร์ดจริงให้เปลี่ยนโหมดเป็น Physical ESP32 เพื่อดู CA Cert`
      : `// --- TLS Security: Root CA Certificate ---
// ⚠️  Wokwi builds (#define WOKWI_SIM) skip this and use setInsecure() instead.
// Production: replace with full ISRG Root X1 PEM from https://letsencrypt.org/certs/isrgrootx1.pem
const char *root_ca_cert =
"-----BEGIN CERTIFICATE-----\\n"
"MIIFazCCA1OgAwIBAgIRAIIRxZ96RhG2Hae8TZtOGMEwDQYJKoZIhvcNAQELBQAw\\n"
"TzELMAkGA1UEBhMCVVMxKTAnBgNVBAoTIEludGVybmV0IFNlY3VyaXR5IFJlc2Vh\\n"
"cmNoIEdyb3VwMRUwEwYDVQQDEwxJU1JHIFJvb3QgWDEwHhcNMTUwNjA0MTEwNDM4\\n"
"WhcNMzUwNjA0MTEwNDM4WjBPMQswCQYDVQQGEwJVUzEpMCcGA1UEChMgSW50ZXJu\\n"
"ZXQgU2VjdXJpdHkgUmVzZWFyY2ggR3JvdXAxFTATBgNVBAMTDElTUkcgUm9vdCBY\\n"
"MTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBAK3oJHP0FDfzmHwXyEFD\\n"
"aVY+5gE2Dux6ClJHdEEXJKmcfcPChBkuv3Gz/kOHegC6MyTPd50rtW71mMR6ZkvF\\n"
"m5yOYyFL9PJA65geg8gCyRFyat6J4Rg8L3AzoU3dZCPqy8gKKHWMVfuxgpJEnt4f\\n"
"mCjOt21KKOAQCFAJUsT18H3OPC9CDH5SM5KC9CTWgrOB8Uo18m1751g6M6Wd095M\\n"
"O44692GUP8xQG07xEQ2g5K31LCT79kXyNdc29F2574cVH6k8xmMAlvJMm5mOKMJp\\n"
"sX1d8Yc/CJsxYtxnD+LJDlzUWD+MnP+xO8N1jYNL8mHiHqAm7k5jJMgTDH//fjv\\n"
"oE04k3X6xQ5gYMBW4JN5+9GHRopz7NXaqimD9g2qy0n3Ri3d0ZPPgLKFbCXVpOoX\\n"
"1RQ0PAvEkQqYSqBEqGhNFGFUAKxBNAiSl7VPvb5gqxUhTbNDsGJvXhOaOTlIMFqX\\n"
"aVlUy+I2nXlBxwv8JW7Iqjlq4GRdTmfCgBKNbTJ7Bz7j5MXiSJOXsMx1FxnTNw8\\n"
"A8S/UNKUj6AZVdClZl0XOjDwVOXkJrFEiUiYYOeBQAqI/gT3UNJeFsEkw8HwJq5u\\n"
"QhHJBX4P4jGVJtEnOmFxTL67KGAiZxCmXjUHOMONVWnolWaBDPLbLZLCVIVnVqyN\\n"
"AgMBAAGjQjBAMA4GA1UdDwEB/wQEAwIBBjAPBgNVHRMBAf8EBTADAQH/MB0GA1Ud\\n"
"DgQWBBR5tFnme7bl5AFzgAiIyBpY9umbbjANBgkqhkiG9w0BAQsFAAOCAgEAVR9Y\\n"
"qbyyqFDQDLHYGmkgJykIyrJzA/kRMG5m0GSCAB6g9LHb0O5+MIFJRbK3MCnZWXy2\\n"
"tA/yTX/yW/3c+h6I2WvHVq+IjTRy5xqmV5i8LI5z4I+JG+uBCuoaF8wONOlCVBi\\n"
"DPbL8h7xuvx3L0NNFm0R/F4t7fMl5rC8NHrgmUQg1B9bZL6D6O/4W/fPCdxL6bvC\\n"
"pTFJjbzB3WH3R0oq9bM3lFKR7mN9Jmvur1S5jMKp1TNkEOy6XP+/TYH5T+WH5J5W\\n"
"P3m4TbSH3yXSqBJ7FNdG3fNrC7Vy26bCf7sBfWPkWbxj8HHV3rH5Z9bv/ZZxXGv\\n"
"LgZuiGqkJgwF7tZVMN9X6stREq2cSfSfFCXiEFKbWECuq/FKw3nI2wT+yBMNqxaB\\n"
"SdUNRN3D3/fToX7WvXQ7OqJzI6MWFQ/x7mBPW5ub9l3DjjECVETzgamRMeibNWCI\\n"
"Jv1EaNLCq1M+HVriNBMBzIJ43Y07IFo7zqt/2MwAXQBoCQh0O8yECNovWmwSfn+m\\n"
"hLtN2stCoJGQDqXXKLJRO3NJGF8QFLAk37LoxLSl+G7kQ5DXMv55XUaH0PPGT4Zs\\n"
"7k2UrX/bIIv7ZCGSm16QHFY9TxlXhTbBJGh/Q0hm7KyM1GRr2Cv5PomXS3P2Bz+r\\n"
"VV+7FvKYzv5hRMiWjK6TBJLR7SqiGcDOF2cFvCJFxrJfzMhD1qU=\\n"
"-----END CERTIFICATE-----\\n";`;

    return `/*
  ========================================================================
  SmartAccess Door Access Controller - Configuration for ESP32
  ห้องปฏิบัติการเรียนการสอน: Classroom ${roomCode}
  โหมด: ${mode === "wokwi" ? "Wokwi Simulator" : "Physical ESP32 Board"}
  ========================================================================
*/

#ifndef CONFIG_H
#define CONFIG_H

// --- WiFi Configuration ---
${wifiBlock}

// --- IoT Cloud Server Configuration ---
const char *server_url = "${origin}/api/esp32/display?room=${roomCode}";
const char *room_code  = "${roomCode}";

// --- Security Provisioning: Shared Pre-shared API Key ---
// ⚠️ IMPORTANT: ใส่ค่าจาก ESP32_API_KEY ใน Vercel Environment Variables
// ห้ามนำ key จริงขึ้น version control
const char *api_key = "YOUR_UNIQUE_ESP32_API_KEY_HERE";

${certBlock}

#endif // CONFIG_H`;
  };

  const getArduinoCode = (roomCode: string, origin: string, mode: "wokwi" | "physical" = "physical") => {
    const wokwiDefine = mode === "wokwi"
      ? `#define WOKWI_SIM  // Wokwi Simulator mode — NEVER deploy to production with this defined!`
      : `// #define WOKWI_SIM  // Uncomment ONLY when running in Wokwi Simulator — NEVER in production!`;
    return `/*
  ==============================================================
  SmartAccess Door Access Controller - Firmware for ESP32
  ห้องปฏิบัติการเรียนการสอน: Classroom ${roomCode}
  โหมด: ${mode === "wokwi" ? "Wokwi Simulator" : "Physical ESP32 Board"}
  ระบบรองรับการรันผ่านคลาวด์ Vercel (HTTPS WiFiClientSecure)
  ==============================================================
*/
${wokwiDefine}
#define DEBUG_MODE false  // ⚠️ Set true for development ONLY

#if DEBUG_MODE
  #define DBG(x) Serial.println(x)
  #define DBGF(fmt, ...) Serial.printf(fmt, __VA_ARGS__)
#else
  #define DBG(x)
  #define DBGF(fmt, ...)
#endif

#include "ricmoo_qrcode.h"
#include <Adafruit_GFX.h>
#include <Adafruit_ILI9341.h>
#include <ArduinoJson.h> // ติดตั้งผ่าน Library Manager (เวอร์ชัน 6.x)
#include <FS.h>
#include <HTTPClient.h>
#ifndef WOKWI_SIM
#include <HTTPUpdate.h> // สำหรับระบบดึงข้อมูลอัปเดต HTTPS OTA
#include <WebServer.h> // สำหรับระบบบริการเว็บอัปเดตระยะใกล้ LAN OTA
#include <ElegantOTA.h> // สำหรับบริการ ElegantOTA เว็บเซิร์ฟเวอร์บอร์ด
#endif
#include <SPI.h>
#include <SPIFFS.h>
#include <WiFi.h>
#include <WiFiClientSecure.h> // สำหรับรัน HTTPS บนระบบคลาวด์ Vercel
#include <mbedtls/md.h>
#include <time.h> // สำหรับ NTP time sync (ใช้ใน HMAC timestamp)

#include "config.h"

// เวอร์ชันซอฟต์แวร์ปัจจุบันของบอร์ด
const char* CURRENT_VERSION = "1.0.0";
const char* FIRMWARE_URL = "https://project-sigma-ivory-21.vercel.app/api/esp32/firmware-ota";

#ifndef WOKWI_SIM
WebServer localServer(80); // พอร์ตเว็บเซิร์ฟเวอร์สำหรับคิวและ ElegantOTA
bool localServerStarted = false;
#endif


// ─── Compile-time production safety guard ───────────────────────────────────
// Prevents accidentally shipping a Wokwi simulation build to a real device.
#ifdef PRODUCTION
  #ifdef WOKWI_SIM
    #error "WOKWI_SIM must not be defined in production builds!"
  #endif
#endif
// ────────────────────────────────────────────────────────────────────────────

// --- การต่อขาอุปกรณ์ (Hardware Pins) ---
#define TFT_CS 15
#define TFT_RST 4
#define TFT_DC 2
#define RELAY_PIN 12  // รีเลย์ประตู (GPIO 12)
#define LED_WIFI 14   // WiFi Status LED (GPIO 14)
#define LED_REJECT 26 // Reject LED (GPIO 26)
#define BUZZER_PIN 27 // Buzzer (GPIO 27)

Adafruit_ILI9341 tft = Adafruit_ILI9341(TFT_CS, TFT_DC, TFT_RST);

// ─── Adaptive Polling ────────────────────────────────────────────────────────
// เร่งความเร็ว polling เมื่อตรวจพบกิจกรรม ชะลอลงเมื่อ idle ประหยัด API call
const unsigned long POLL_FAST   = 200;   // ms — มีคำสั่งรอ / เพิ่งปลดล็อก
const unsigned long POLL_NORMAL = 1000;  // ms — ทำงานปกติ
const unsigned long POLL_SLOW   = 5000;  // ms — idle ต่อเนื่อง 5 รอบ
unsigned long currentPollDelay  = POLL_NORMAL;
int idleCycles = 0; // นับรอบที่ไม่มีกิจกรรม
String lastEtag = ""; // ETag จาก server สำหรับ 304 check

// ─── TFT Dirty-region tracking ───────────────────────────────────────────────
// เก็บค่าเดิม — วาดเฉพาะส่วนที่เปลี่ยน ไม่ fillScreen ทั้งหน้าทุกรอบ
int last_queue_count = -1;
String last_approved_name = "";
String last_active_token = "";
String last_server_time = "";
String last_status_text = "";
String ip_address_str = "0.0.0.0";

// ฟังก์ชันสำหรับสร้างและวาดภาพ QR Code แท้ๆ ที่สแกนได้ด้วยโทรศัพท์มือถือ 100%!
void drawQRCode(String qrText, int startX, int startY, int boxSize) {
  QRCode qrcode;

  // ใช้ QR Code Version 7 (45x45 modules) รองรับ URL ยาวสูงสุด 154 ตัวอักษร
  int qrVersion = 7;
  if (qrText.length() > 154) {
    qrVersion = 9; // ถ้าข้อความยาวมากเป็นพิเศษ ให้สลับเป็น Version 9 (53x53 modules)
  }

  uint8_t qrcodeData[qrcode_getBufferSize(qrVersion)];
  qrcode_initText(&qrcode, qrcodeData, qrVersion, ECC_LOW, qrText.c_str());

  // ขยายพิกเซลบล็อก (Scale) ให้ใหญ่พอที่จะใช้โทรศัพท์สแกนได้คมชัด
  int scale = 2;
  int qrRealSize = qrcode.size * scale;

  // คำนวณขอบขาว (Quiet Zone) ให้อยู่กึ่งกลางกล่องเฟรมพอดี
  int paddingX = (boxSize - qrRealSize) / 2;
  int paddingY = (boxSize - qrRealSize) / 2;

  // วาดพื้นหลังสีขาวบริสุทธิ์
  tft.fillRect(startX, startY, boxSize, boxSize, ILI9341_WHITE);

  // วาดโมดูลจุดสีดำของรหัส QR
  for (uint8_t y = 0; y < qrcode.size; y++) {
    for (uint8_t x = 0; x < qrcode.size; x++) {
      if (qrcode_getModule(&qrcode, x, y)) {
        tft.fillRect(startX + paddingX + (x * scale),
                     startY + paddingY + (y * scale), scale, scale,
                     ILI9341_BLACK);
      }
    }
  }
}

// 1. หน้าจอหลักโหมดสแตนด์บาย (Idle Mode) — ดีไซน์พรีเมียมถอดแบบมาจาก Next.js
// esp32-preview
void drawMainScreen(int queueCount, String lastApprovedName, String timeStr,
                    String qrText) {
  // พื้นหลังสีน้ำเงินดำหรูหรา #06070D
  tft.fillScreen(tft.color565(6, 7, 13));

  // --- ส่วนหัว (Top Status Bar) #0E111C ---
  tft.fillRect(0, 0, 320, 20, tft.color565(14, 17, 28));
  tft.drawFastHLine(0, 20, 320, tft.color565(40, 40, 50)); // เส้นใต้เมนู

  tft.setTextSize(1);
  tft.setTextColor(tft.color565(226, 232, 240)); // สีตัวอักษรขาวสว่าง #E2E8F0
  tft.setCursor(8, 6);
  tft.print("SmartAccess DOOR ACCESS  ");

  // ปุ่มตราสัญลักษณ์ ACTIVE สีเขียวมะนาว
  tft.setTextColor(tft.color565(16, 185, 129)); // #10B981
  tft.print("ACTIVE");

  // นาฬิกาดิจิทัลเรียลไทม์ฝั่งขวา
  tft.setCursor(265, 6);
  tft.print(timeStr);

  // --- กล่องแสดงผล QR Code สแกนผ่านทางด้านซ้าย ---
  // วาดเฟรมกรอบโค้งสองชั้นสีกระจกเขียวเรืองแสงแบบ Glassmorphism
  tft.drawRoundRect(10, 32, 120, 120, 6, tft.color565(16, 185, 129));
  tft.drawRoundRect(11, 33, 118, 118, 5, tft.color565(16, 185, 129));

  // แสดงผลภาพคีย์ QR Code ที่สแกนได้จริง
  if (qrText.length() > 0) {
    drawQRCode(qrText, 13, 35, 114);
  } else {
    // หากข้อมูลยังโหลดไม่เสร็จสิ้น
    tft.fillRect(13, 35, 114, 114, ILI9341_WHITE);
    tft.setTextColor(ILI9341_BLACK);
    tft.setCursor(40, 85);
    tft.print("Loading QR...");
  }

  // คำแนะนำภาษาอังกฤษสีเหลืองทองเรืองแสง
  tft.setTextColor(tft.color565(255, 215, 0)); // #FFD700
  tft.setCursor(24, 162);
  tft.print("SCAN FOR ACCESS");

  // --- การ์ดฝั่งขวา: รายละเอียดห้องและคิวผู้ขออนุมัติ ---
  tft.setTextSize(1);
  tft.setTextColor(tft.color565(240, 244, 240)); // สีขาวงาช้าง #F0F4F0
  tft.setCursor(145, 36);
  tft.print("ROOM: ");
  tft.print(room_code);

  tft.setTextColor(tft.color565(59, 130, 246)); // สีฟ้าพรีเมียม #3B82F6
  tft.setCursor(145, 48);
  tft.print("LAB DOOR CONTROLLER");

  // การ์ดแสดงคิวสีเหลืองเหล้าองุ่น PENDING REQUESTS
  tft.fillRoundRect(145, 65, 165, 50, 6, tft.color565(24, 16, 1));
  tft.drawRoundRect(145, 65, 165, 50, 6,
                    tft.color565(245, 158, 11)); // ขอบสีส้มเหลือง

  tft.setTextColor(tft.color565(245, 158, 11));
  tft.setCursor(153, 75);
  tft.print("PENDING REQUESTS");
  tft.setTextColor(tft.color565(156, 163, 175)); // สีเทา
  tft.setCursor(153, 90);
  tft.print("QUEUE COUNTER");

  // ตัวเลขคิวใหญ่พิเศษขนาด 3 เท่า
  tft.setTextSize(3);
  tft.setTextColor(tft.color565(245, 158, 11));
  tft.setCursor(275, 78);
  tft.print(queueCount);

  // การ์ดผู้ได้รับการอนุมัติล่าสุด LATEST APPROVED
  tft.setTextSize(1);
  if (lastApprovedName.length() > 0) {
    tft.fillRoundRect(145, 125, 165, 45, 6,
                      tft.color565(1, 18, 12)); // แถบพื้นหลังเขียวเข้ม
    tft.drawRoundRect(145, 125, 165, 45, 6,
                      tft.color565(16, 185, 129)); // ขอบเขียวสว่าง

    tft.setTextColor(tft.color565(16, 185, 129));
    tft.setCursor(153, 133);
    tft.print("LATEST APPROVED");

    tft.setTextColor(ILI9341_WHITE);
    tft.setCursor(153, 148);
    tft.print("ID: " + lastApprovedName);
  } else {
    // กรอบประวัติว่างกรณีไม่มีข้อมูล
    tft.drawRoundRect(145, 125, 165, 45, 6, tft.color565(60, 70, 60));
    tft.setTextColor(tft.color565(107, 122, 112));
    tft.setCursor(160, 143);
    tft.print("NO RECENT ACCESS");
  }

  // --- แถบข้อมูลด้านล่างสุด (Bottom Status Bar) #0A0B10 ---
  tft.fillRect(0, 220, 320, 20, tft.color565(10, 11, 16));
  tft.drawFastHLine(0, 220, 320, tft.color565(30, 30, 40));

  tft.setTextSize(1);
  tft.setTextColor(tft.color565(107, 122, 112));
  tft.setCursor(8, 226);
  tft.print("SmartAccess Faculty of Education");

  // แสดงค่าหมายเลขไอพีแอดเดรสของอุปกรณ์
  tft.setTextColor(tft.color565(16, 185, 129));
  tft.setCursor(240, 226);
  tft.print(ip_address_str);
}

// 2. หน้าจอกำลังตรวจสอบข้อมูล (Scanning/Processing Mode)
void drawScanningScreen() {
  tft.fillScreen(tft.color565(3, 8, 15)); // สีน้ำเงินมหาสมุทรเข้ม #03080F

  // วงแหวนเรืองแสงสีฟ้าจำลองตัวอ่านกำลังประมวลผล
  tft.drawCircle(160, 70, 30, tft.color565(59, 130, 246));
  tft.drawCircle(160, 70, 31, tft.color565(59, 130, 246));
  tft.fillCircle(160, 70, 8, tft.color565(59, 130, 246));

  tft.setTextSize(3);
  tft.setTextColor(tft.color565(59, 130, 246)); // #3B82F6
  tft.setCursor(45, 125);
  tft.print("PROCESSING...");

  tft.setTextSize(1);
  tft.setTextColor(ILI9341_WHITE);
  tft.setCursor(75, 165);
  tft.print("VERIFYING REQUEST WITH SERVER");

  tft.setTextColor(tft.color565(107, 122, 112));
  tft.setCursor(85, 185);
  tft.print("SECURE CLOUD ACCESS VALIDATION");
}

// 3. หน้าจอปลดล็อกผ่านสำเร็จ (Access Granted Mode) — สีเขียวสะท้อนแสงหรูหราดีไซน์พรีเมียม
void drawUnlockedScreen(String approvedName, String studentId) {
  tft.fillScreen(tft.color565(3, 12, 5)); // สีเขียวเข้มสไตล์ฟอเรสต์ #030C05

  // วงกลมไฟสีเขียวสลักตราถูก
  tft.fillCircle(160, 65, 32, tft.color565(6, 78, 59));    // กรอบใน
  tft.drawCircle(160, 65, 32, tft.color565(16, 185, 129)); // เส้นขอบสีเขียวเรืองแสง
  tft.drawCircle(160, 65, 33, tft.color565(16, 185, 129));

  // เครื่องหมาย ถูก (v)
  tft.setTextColor(ILI9341_WHITE);
  tft.setTextSize(3);
  tft.setCursor(151, 55);
  tft.print("v");

  tft.setTextSize(3);
  tft.setTextColor(tft.color565(16, 185, 129));
  tft.setCursor(35, 115);
  tft.print("ACCESS GRANTED");

  tft.setTextSize(1);
  tft.setTextColor(tft.color565(255, 215, 0));
  tft.setCursor(65, 148);
  tft.print("DOOR UNLOCKED (ACCESSING)...");

  // ตลับแคปซูลสำหรับครอบชื่อผู้เข้าใช้ห้องปฏิบัติการ
  tft.fillRoundRect(30, 168, 260, 26, 13, tft.color565(30, 30, 40));
  tft.drawRoundRect(30, 168, 260, 26, 13, tft.color565(50, 50, 60));
  tft.setTextColor(ILI9341_WHITE);
  tft.setTextSize(1);

  // แสดงผลสถานะผู้เข้าใช้เป็นภาษาอังกฤษพรีเมียมแทนการแสดงชื่อภาษาไทยเพื่อเลี่ยงฟอนต์ต่างดาว
  String statusMsg = "VERIFIED MEMBER";
  int nameX = 160 - (statusMsg.length() * 3);
  tft.setCursor(nameX, 177);
  tft.print(statusMsg);

  // รหัสประจำตัวของนักศึกษา
  tft.setTextColor(tft.color565(156, 163, 175));
  int idX = 160 - (studentId.length() * 3);
  if (idX < 35)
    idX = 35;
  tft.setCursor(idX, 202);
  tft.print(studentId);
}

// 4. หน้าจอสำหรับกรณีระบบไม่อนุมัติ (Access Denied Mode) — แดงเรืองแสง
void drawRejectedScreen() {
  tft.fillScreen(tft.color565(15, 3, 3)); // สีแดงเข้มมืด #0F0303

  // วงแหวนแดงสลัก X
  tft.fillCircle(160, 65, 32, tft.color565(127, 29, 29));
  tft.drawCircle(160, 65, 32, tft.color565(239, 68, 68));
  tft.drawCircle(160, 65, 33, tft.color565(239, 68, 68));

  tft.setTextColor(ILI9341_WHITE);
  tft.setTextSize(3);
  tft.setCursor(151, 55);
  tft.print("X");

  tft.setTextSize(3);
  tft.setTextColor(tft.color565(239, 68, 68));
  tft.setCursor(45, 115);
  tft.print("ACCESS DENIED");

  tft.setTextSize(1);
  tft.setTextColor(tft.color565(255, 199, 199));
  tft.setCursor(85, 148);
  tft.print("REJECTED ACCESS ATTEMPT");

  tft.setTextColor(tft.color565(156, 163, 175));
  tft.setCursor(55, 180);
  tft.print("PLEASE CONTACT CLASSROOM INSTRUCTOR");
}

// ─── Persistent TLS Connection (HTTP Keep-alive) ─────────────────────────────
// ประกาศนอก loop() เพื่อให้ reuse TLS session ข้ามรอบ poll → ลด TLS handshake
#ifndef WOKWI_SIM
WiFiClientSecure persistentTlsClient;
bool tlsClientInitialized = false;
#endif

// ─── Offline Mode Configurations & Helper Functions (Prompt 18) ─────────────
bool is_offline_mode = false;
int api_fail_count = 0;
unsigned long last_student_sync = 0;
unsigned long last_log_sync = 0;
const unsigned long SYNC_STUDENTS_INTERVAL = 300000; // 5 minutes
const unsigned long SYNC_LOGS_INTERVAL = 60000;     // 1 minute

String cached_qr_key = "";
const char* cache_students_file = "/student_cache.json";
const char* cache_logs_file = "/offline_logs.json";
const char* cache_key_file = "/qr_key.bin";

// Forward declarations
bool validateOfflineQR(String grant);
void triggerDoorOpenOffline(String grant);
void saveOfflineLog(String student_id);
void syncStudentCache();
void syncOfflineLogs();

#ifndef WOKWI_SIM
void onOTAStart() {
  Serial.println("[Local OTA] เริ่มต้นกระบวนการแฟลชเฟิร์มแวร์ผ่าน LAN");
  tft.fillScreen(ILI9341_BLACK);
  tft.setTextColor(ILI9341_YELLOW);
  tft.setTextSize(2);
  tft.setCursor(10, 40);
  tft.println("LOCAL OTA ACTIVE");
  tft.setTextSize(1);
  tft.setCursor(10, 80);
  tft.setTextColor(ILI9341_WHITE);
  tft.println("Flashing firmware via Local Network...");
}

void onOTAEnd(bool success) {
  tft.fillScreen(ILI9341_BLACK);
  if (success) {
    tft.setTextColor(ILI9341_GREEN);
    tft.setTextSize(2);
    tft.setCursor(10, 40);
    tft.println("OTA SUCCESSFUL");
    tft.setTextSize(1);
    tft.setCursor(10, 80);
    tft.setTextColor(ILI9341_WHITE);
    tft.println("Rebooting device now...");
    delay(2000);
  } else {
    tft.setTextColor(ILI9341_RED);
    tft.setTextSize(2);
    tft.setCursor(10, 40);
    tft.println("OTA FAILED");
    tft.setTextSize(1);
    tft.setCursor(10, 80);
    tft.setTextColor(ILI9341_WHITE);
    tft.println("Please check network and retry.");
    delay(5000);
  }
}

// ─── OTA Progress Bar บน TFT ─────────────────────────────────────────────────
void onOTAProgress(int current, int total) {
  if (total <= 0) return;
  int pct = (current * 100) / total;
  int barW = (pct * 280) / 100;
  // Progress bar background
  tft.drawRect(20, 130, 280, 16, ILI9341_WHITE);
  tft.fillRect(21, 131, barW, 14, tft.color565(124, 58, 237));
  // เคลียร์ + วาดตัวเลข %
  tft.fillRect(20, 155, 160, 16, ILI9341_BLACK);
  tft.setTextColor(ILI9341_WHITE);
  tft.setTextSize(1);
  tft.setCursor(20, 155);
  tft.print(pct);
  tft.print("% (");
  tft.print(current / 1024);
  tft.print(" / ");
  tft.print(total / 1024);
  tft.println(" KB)");
}

void performHTTPSOTA() {
  WiFiClientSecure secureClient;
  secureClient.setInsecure();

  tft.fillScreen(ILI9341_BLACK);
  tft.setTextColor(ILI9341_YELLOW);
  tft.setTextSize(2);
  tft.setCursor(10, 30);
  tft.println("SMARTACCESS OTA");
  tft.drawFastHLine(10, 60, 300, tft.color565(124, 58, 237));
  tft.setCursor(10, 80);
  tft.setTextColor(ILI9341_WHITE);
  tft.setTextSize(1);
  tft.println("Connecting to update server...");
  tft.setCursor(10, 100);
  tft.println("Please wait, do not power off.");

  httpUpdate.rebootOnUpdate(true);
  httpUpdate.addHeader("x-esp32-version", CURRENT_VERSION);
  httpUpdate.addHeader("Authorization", "Bearer SUPER_SECURE_ESP32_ACCESS_TOKEN");
  // แนบ callback แสดง progress bar
  httpUpdate.onProgress(onOTAProgress);

  tft.fillRect(10, 80, 300, 20, ILI9341_BLACK);
  tft.setCursor(10, 80);
  tft.setTextColor(ILI9341_WHITE);
  tft.setTextSize(1);
  tft.println("Downloading firmware...");

  t_httpUpdate_return ret = httpUpdate.update(secureClient, FIRMWARE_URL);
  if (ret == HTTP_UPDATE_FAILED) {
    tft.fillScreen(ILI9341_BLACK);
    tft.setTextColor(ILI9341_RED);
    tft.setTextSize(2);
    tft.setCursor(10, 40);
    tft.println("OTA FAILED");
    tft.setTextSize(1);
    tft.setCursor(10, 80);
    tft.setTextColor(ILI9341_WHITE);
    tft.print("Error: ");
    tft.println(httpUpdate.getLastErrorString());
    delay(5000);
  }
}
#endif // !WOKWI_SIM

void startLocalServer() {
#ifndef WOKWI_SIM
  if (!localServerStarted) {
    // กำหนด ElegantOTA Web Endpoint & Callbacks
    ElegantOTA.begin(&localServer);
    ElegantOTA.onStart(onOTAStart);
    ElegantOTA.onEnd(onOTAEnd);

    localServer.begin();
    localServerStarted = true;
    DBG("Local web server started on port 80 with ElegantOTA.");
  }
#endif
}

String base64Decode(String input) {
  input.replace("-", "+");
  input.replace("_", "/");
  while (input.length() % 4) {
    input += "=";
  }
  int len = input.length();
  uint8_t* out = (uint8_t*)malloc(len);
  int decoded_len = 0;
  const char* lookup = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  int bits = 0;
  int val = 0;
  for (int i = 0; i < len; i++) {
    char c = input[i];
    if (c == '=') break;
    const char* p = strchr(lookup, c);
    if (!p) continue;
    int idx = p - lookup;
    val = (val << 6) | idx;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out[decoded_len++] = (val >> bits) & 0xFF;
    }
  }
  String res = "";
  for (int i = 0; i < decoded_len; i++) {
    res += (char)out[i];
  }
  free(out);
  return res;
}

// Hex-encoded HMAC-SHA256 — ตรงกับ Node.js crypto.createHmac('sha256', key).digest('hex')
// ใช้สำหรับ x-hmac-signature header ที่ server ตรวจสอบ
String generateHMACHex(String payload, String key) {
  uint8_t hmacResult[32];
  mbedtls_md_context_t ctx;
  mbedtls_md_init(&ctx);
  mbedtls_md_setup(&ctx, mbedtls_md_info_from_type(MBEDTLS_MD_SHA256), 1);
  mbedtls_md_hmac_starts(&ctx, (const unsigned char *)key.c_str(), key.length());
  mbedtls_md_hmac_update(&ctx, (const unsigned char *)payload.c_str(), payload.length());
  mbedtls_md_hmac_finish(&ctx, hmacResult);
  mbedtls_md_free(&ctx);
  char hexBuf[65];
  for (int i = 0; i < 32; i++) {
    sprintf(hexBuf + i * 2, "%02x", hmacResult[i]);
  }
  hexBuf[64] = '\\0';
  return String(hexBuf);
}

// Base64url-encoded HMAC-SHA256 (ใช้สำหรับ offline grant validation)
String generateHMAC(String payload, String key) {
  uint8_t hmacResult[32];
  mbedtls_md_context_t ctx;
  mbedtls_md_type_t md_type = MBEDTLS_MD_SHA256;
  mbedtls_md_init(&ctx);
  mbedtls_md_setup(&ctx, mbedtls_md_info_from_type(md_type), 1);
  mbedtls_md_hmac_starts(&ctx, (const unsigned char*)key.c_str(), key.length());
  mbedtls_md_hmac_update(&ctx, (const unsigned char*)payload.c_str(), payload.length());
  mbedtls_md_hmac_finish(&ctx, hmacResult);
  mbedtls_md_free(&ctx);

  String encoded = "";
  const char* lookup = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  int bits = 0;
  int val = 0;
  for (int i = 0; i < 32; i++) {
    val = (val << 8) | hmacResult[i];
    bits += 8;
    while (bits >= 6) {
      bits -= 6;
      encoded += lookup[(val >> bits) & 0x3F];
    }
  }
  if (bits > 0) {
    encoded += lookup[(val << (6 - bits)) & 0x3F];
  }
  return encoded;
}

bool validateOfflineQR(String grant) {
  if (cached_qr_key == "") {
    DBG("No cached QR signing key. Cannot validate offline.");
    return false;
  }
  int dotIdx = grant.indexOf(".");
  if (dotIdx == -1) return false;
  
  String encodedPayload = grant.substring(0, dotIdx);
  String signature = grant.substring(dotIdx + 1);
  
  String expectedSignature = generateHMAC(encodedPayload, cached_qr_key);
  if (!secureCompare(signature.c_str(), expectedSignature.c_str())) {
    DBG("Offline signature verification failed!");
    return false;
  }
  
  String decoded = base64Decode(encodedPayload);
  StaticJsonDocument<384> doc;
  DeserializationError err = deserializeJson(doc, decoded);
  if (err) {
    DBG("Failed to parse decoded payload JSON!");
    return false;
  }
  
  const char* room = doc["room"];
  const char* student_id = doc["student_id"];
  
  if (String(room) != String(room_code)) {
    DBG("Room mismatch in offline grant!");
    return false;
  }
  
  if (!SPIFFS.exists(cache_students_file)) {
    DBG("No student cache JSON file exists!");
    return false;
  }
  
  File f = SPIFFS.open(cache_students_file, "r");
  if (!f) return false;
  
  StaticJsonDocument<2048> cacheDoc;
  DeserializationError cacheErr = deserializeJson(cacheDoc, f);
  f.close();
  if (cacheErr) {
    DBG("Failed to parse student cache JSON file!");
    return false;
  }
  
  JsonArray arr = cacheDoc.as<JsonArray>();
  bool found = false;
  for (JsonVariant v : arr) {
    if (v.as<String>() == String(student_id)) {
      found = true;
      break;
    }
  }
  if (!found) {
    DBG("Student ID not found in local offline cache!");
    return false;
  }
  DBG("Offline QR validation successful!");
  return true;
}

void saveOfflineLog(String student_id) {
  StaticJsonDocument<1536> logDoc;
  if (SPIFFS.exists(cache_logs_file)) {
    File f = SPIFFS.open(cache_logs_file, "r");
    if (f) {
      deserializeJson(logDoc, f);
      f.close();
    }
  }
  JsonArray logs;
  if (logDoc.containsKey("logs")) {
    logs = logDoc["logs"].as<JsonArray>();
  } else {
    logs = logDoc.to<JsonArray>();
  }
  if (logs.size() >= 50) {
    logs.remove(0);
  }
  JsonObject newLog = logs.createNestedObject();
  newLog["student_id"] = student_id;
  newLog["action"] = "door_opened_offline";
  newLog["timestamp"] = millis() / 1000;
  File f = SPIFFS.open(cache_logs_file, "w");
  if (f) {
    serializeJson(logDoc, f);
    f.close();
    DBG("Saved offline access log to SPIFFS.");
  }
}

void triggerDoorOpenOffline(String grant) {
  int dotIdx = grant.indexOf(".");
  String encodedPayload = grant.substring(0, dotIdx);
  String decoded = base64Decode(encodedPayload);
  StaticJsonDocument<256> doc;
  deserializeJson(doc, decoded);
  String student_id = doc["student_id"].as<String>();
  
  saveOfflineLog(student_id);
  
  Serial.println("[INFO] Door unlocked");
  DBG("🔓 OFFLINE ACCESS GRANTED! Opening door...");
  
  drawScanningScreen();
  tone(BUZZER_PIN, 1500, 100);
  delay(1200);
  
  drawUnlockedScreen("OFFLINE MEMBER", student_id);
  digitalWrite(RELAY_PIN, HIGH);
  
  tone(BUZZER_PIN, 1000, 150);
  delay(180);
  tone(BUZZER_PIN, 1500, 150);
  delay(180);
  tone(BUZZER_PIN, 2000, 300);
  
  int countdownMs = 3800;
  int stepSize = 320 / 38;
  for (int i = 0; i < 38; i++) {
    tft.fillRect(0, 236, 320 - (i * stepSize), 4, tft.color565(16, 185, 129));
    tft.fillRect(320 - (i * stepSize), 236, stepSize, 4, tft.color565(6, 78, 59));
    delay(100);
  }
  digitalWrite(RELAY_PIN, LOW);
  Serial.println("[INFO] Door locked");
  DBG("🔒 Door auto locked (Offline).");
  tone(BUZZER_PIN, 800, 250);
  
  last_queue_count = -1;
  last_approved_name = "FORCE_REDRAW";
  last_active_token = "FORCE_REDRAW";
}

#ifndef WOKWI_SIM
void handleLocalValidation() {
  WiFiClient client = localServer.available();
  if (!client) return;
  DBG("New client connected to local offline validation server.");
  unsigned long timeout = millis() + 2000;
  String req = "";
  while (client.connected() && millis() < timeout) {
    if (client.available()) {
      char c = client.read();
      req += c;
      if (req.endsWith("\\r\\n\\r\\n")) break;
    }
  }
  if (req.indexOf("POST /door/open") != -1) {
    // ─── [Real-Time HTTP Push opening from Next.js (Online Mode)] ───
    client.println("HTTP/1.1 200 OK");
    client.println("Content-Type: application/json; charset=utf-8");
    client.println("Connection: close");
    client.println();
    client.println("{\\"success\\":true}");
    client.stop();

    // Extract studentId from request body if present
    String studentId = "";
    int bodyIdx = req.indexOf("\\r\\n\\r\\n");
    if (bodyIdx != -1) {
      String body = req.substring(bodyIdx + 4);
      int sIdIdx = body.indexOf("\\"studentId\\"");
      if (sIdIdx != -1) {
        int colonIdx = body.indexOf(":", sIdIdx);
        if (colonIdx != -1) {
          int quoteStart = body.indexOf("\\"", colonIdx);
          if (quoteStart != -1) {
            int quoteEnd = body.indexOf("\\"", quoteStart + 1);
            if (quoteEnd != -1) {
              studentId = body.substring(quoteStart + 1, quoteEnd);
            }
          }
        }
      }
    }

    Serial.println("[INFO] Real-time Door unlocked via HTTP Push");
    DBG("🔓 REAL-TIME ACCESS GRANTED! Opening door...");

    drawScanningScreen();
    tone(BUZZER_PIN, 1500, 100);
    delay(1200);

    drawUnlockedScreen("VERIFIED MEMBER", studentId != "" ? studentId : "ONLINE STUDENT");
    digitalWrite(RELAY_PIN, HIGH);

    tone(BUZZER_PIN, 1000, 150);
    delay(180);
    tone(BUZZER_PIN, 1500, 150);
    delay(180);
    tone(BUZZER_PIN, 2000, 300);

    int stepSize = 320 / 38;
    for (int i = 0; i < 38; i++) {
      tft.fillRect(0, 236, 320 - (i * stepSize), 4, tft.color565(16, 185, 129));
      tft.fillRect(320 - (i * stepSize), 236, stepSize, 4, tft.color565(6, 78, 59));
      delay(100);
    }
    digitalWrite(RELAY_PIN, LOW);
    Serial.println("[INFO] Door locked");
    DBG("🔒 Door auto locked (Real-time).");
    tone(BUZZER_PIN, 800, 250);

    last_queue_count = -1;
    last_approved_name = "FORCE_REDRAW";
    last_active_token = "FORCE_REDRAW";
    return;
  }

  if (req.indexOf("POST /unlock") != -1 || req.indexOf("GET /unlock") != -1) {
    int grantIdx = req.indexOf("grant=");
    if (grantIdx != -1) {
      int endIdx = req.indexOf(" ", grantIdx);
      if (endIdx == -1) endIdx = req.indexOf("\\r", grantIdx);
      String grant = req.substring(grantIdx + 6, endIdx);
      grant.replace("%2E", ".");
      grant.replace("%2D", "-");
      grant.replace("%5F", "_");
      
      bool valid = validateOfflineQR(grant);
      if (valid) {
        client.println("HTTP/1.1 200 OK");
        client.println("Content-Type: text/plain; charset=utf-8");
        client.println("Connection: close");
        client.println();
        client.println("ACCESS GRANTED");
        triggerDoorOpenOffline(grant);
      } else {
        client.println("HTTP/1.1 403 Forbidden");
        client.println("Content-Type: text/plain; charset=utf-8");
        client.println("Connection: close");
        client.println();
        client.println("ACCESS DENIED");
      }
    }
  } else {
    client.println("HTTP/1.1 200 OK");
    client.println("Content-Type: text/html; charset=utf-8");
    client.println("Connection: close");
    client.println();
    client.println("<!DOCTYPE html><html><head><meta charset='utf-8'><title>SmartAccess Offline Mode</title></head>");
    client.println("<body style='font-family:sans-serif; text-align:center; padding:50px;'>");
    client.println("<h1 style='color:#F59E0B;'>⚠️ OFFLINE MODE ACTIVE</h1>");
    client.println("<p>ระบบอยู่ในโหมดออฟไลน์ (อินเทอร์เน็ตขัดข้อง)</p>");
    client.println("<p>กรุณาสแกนคีย์ QR โค้ดปลดล็อกของท่านเพื่อยืนยันสิทธิ์กับบอร์ดโดยตรง</p>");
    client.println("</body></html>");
  }
  delay(1);
  client.stop();
}
#endif // !WOKWI_SIM


void syncStudentCache() {
  if (WiFi.status() != WL_CONNECTED) return;
  HTTPClient http;
  String syncUrl = String(server_url) + "&sync=1";
  static WiFiClientSecure secureClient;
  WiFiClientSecure *client = &secureClient;
#ifdef WOKWI_SIM
  client->setInsecure();
#else
  client->setCACert(root_ca_cert);
#endif
  http.begin(*client, syncUrl);
  http.addHeader("x-api-key", api_key);
  int httpCode = http.GET();
  if (httpCode == 200) {
    String payload = http.getString();
    StaticJsonDocument<2048> doc;
    DeserializationError error = deserializeJson(doc, payload);
    if (!error) {
      if (doc.containsKey("qr_key")) {
        const char* key = doc["qr_key"];
        cached_qr_key = String(key);
        File f = SPIFFS.open(cache_key_file, "w");
        if (f) {
          f.print(cached_qr_key);
          f.close();
          DBG("Synced and saved QR signing key.");
        }
      }
      if (doc.containsKey("students")) {
        File f = SPIFFS.open(cache_students_file, "w");
        if (f) {
          serializeJson(doc["students"], f);
          f.close();
          DBG("Synced and saved approved student list to SPIFFS.");
        }
      }
    }
  }
  http.end();
}

void syncOfflineLogs() {
  if (WiFi.status() != WL_CONNECTED) return;
  if (!SPIFFS.exists(cache_logs_file)) return;
  File f = SPIFFS.open(cache_logs_file, "r");
  if (!f) return;
  String content = f.readString();
  f.close();
  HTTPClient http;
  String logUrl = String(server_url);
  logUrl.replace("display", "logs/sync");
  static WiFiClientSecure secureClient;
  WiFiClientSecure *client = &secureClient;
#ifdef WOKWI_SIM
  client->setInsecure();
#else
  client->setCACert(root_ca_cert);
#endif
  http.begin(*client, logUrl);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-api-key", api_key);
  int httpCode = http.POST(content);
  if (httpCode == 200 || httpCode == 201) {
    SPIFFS.remove(cache_logs_file);
    DBG("Successfully synchronized and cleared offline access logs.");
  }
  http.end();
}

void setup() {
  Serial.begin(115200);
  Serial.println("[BOOT] System starting...");

  // Initialize SPIFFS cache storage
  if (!SPIFFS.begin(true)) {
    Serial.println("[ERROR] SPIFFS mount failed!");
  } else {
    Serial.println("[INFO] SPIFFS mounted successfully.");
    if (SPIFFS.exists(cache_key_file)) {
      File f = SPIFFS.open(cache_key_file, "r");
      if (f) {
        cached_qr_key = f.readString();
        f.close();
        DBG("Loaded cached QR signing key from SPIFFS.");
      }
    }
  }

  // 定義อินพุตเอาต์พุตพิน
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(LED_WIFI, OUTPUT);
  pinMode(LED_REJECT, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);

  digitalWrite(RELAY_PIN, LOW); // ค่าดีฟอลต์ประตูล็อกเสมอ
  digitalWrite(LED_WIFI, LOW);
  digitalWrite(LED_REJECT, LOW);

  // สตาร์ตการทำงานหน้าจอ TFT LCD
  tft.begin();
  tft.setRotation(1); // แนวนอน (Landscape)

  // วาดหน้าจอกำลังล็อกอินเครือข่าย Wi-Fi
  tft.fillScreen(tft.color565(6, 7, 13));
  tft.fillRect(0, 0, 320, 45, tft.color565(14, 17, 28));
  tft.drawRect(0, 45, 320, 2, tft.color565(16, 185, 129));

  tft.setTextColor(ILI9341_WHITE);
  tft.setTextSize(2);
  tft.setCursor(20, 12);
  tft.print("SmartAccess DOOR ACCESS");

  tft.setTextSize(2);
  tft.setTextColor(tft.color565(59, 130, 246));
  tft.setCursor(40, 100);
  tft.print("CONNECTING WIFI...");

  tft.setTextSize(1);
  tft.setTextColor(tft.color565(156, 163, 175));
  tft.setCursor(40, 140);
  tft.print("SSID Virtual Router: Wokwi-GUEST");

  DBG("Connecting to Wi-Fi...");
  WiFi.begin(ssid, password);

  // ระบบกะพริบไฟสถานะระหว่างรอ WiFi
  bool wifi_led_state = false;
  while (WiFi.status() != WL_CONNECTED) {
    wifi_led_state = !wifi_led_state;
    digitalWrite(LED_WIFI, wifi_led_state ? HIGH : LOW);
    delay(400);
    DBG(".");
  }

  digitalWrite(LED_WIFI, HIGH); // สว่างค้างเมื่อเชื่อมต่อได้แล้ว
  DBG("\\nWiFi connected successfully!");

  // ─── NTP Time Sync (จำเป็นสำหรับ HMAC timestamp) ───────────────────
  // UTC+7 (Bangkok ICT) — offset 7*3600 = 25200
  configTime(25200, 0, "pool.ntp.org", "time.cloudflare.com");
  // รอให้ได้เวลาจริงจาก NTP (สูงสุด 5 วินาที)
  {
    int ntp_wait = 0;
    while (time(nullptr) < 1000000000UL && ntp_wait < 50) {
      delay(100);
      ntp_wait++;
    }
  }
  Serial.println("[INFO] NTP synced: " + String((long)time(nullptr)));

  // บันทึก IP แอดมินของบอร์ดสำหรับการนำไปแสดง
  ip_address_str = WiFi.localIP().toString();

  // เสียงดนตรีบูตระบบเสร็จสิ้นพร้อมใช้ (Sweet boot melody)
  tone(BUZZER_PIN, 1200, 150);
  delay(180);
  tone(BUZZER_PIN, 1600, 250);

  // สตาร์ตเซิร์ฟเวอร์เว็บท้องถิ่นเพื่อการซิงค์แบบเรียลไทม์ (Real-Time Push)
#ifndef WOKWI_SIM
  startLocalServer();
#endif

  // วาดแผงหน้าจอหลักเริ่มต้น
  drawMainScreen(0, "", "12:00:00", "");
}

void loop() {
  // Always run local web server to handle real-time push commands immediately
#ifndef WOKWI_SIM
  handleLocalValidation();
#endif
  
  // จัดการ OTA เว็บโฮสต์เครือข่ายภายใน LAN
#ifndef WOKWI_SIM
  ElegantOTA.loop();
#endif

  if (is_offline_mode) {
    // Status indicators
    bool hasCache = SPIFFS.exists(cache_students_file);
    if (hasCache) {
      static unsigned long lastBlink = 0;
      static bool ledState = false;
      if (millis() - lastBlink > 1000) {
        lastBlink = millis();
        ledState = !ledState;
        digitalWrite(LED_WIFI, ledState ? HIGH : LOW);
        digitalWrite(LED_REJECT, LOW);
      }

      unsigned long sec = millis() / 1000;
      unsigned long hh = (sec / 3600) % 24;
      unsigned long mm = (sec / 60) % 60;
      unsigned long ss = sec % 60;
      char timeBuf[10];
      snprintf(timeBuf, sizeof(timeBuf), "%02d:%02d:%02d", (int)hh, (int)mm,
               (int)ss);

      static unsigned long lastScreenUpdate = 0;
      if (millis() - lastScreenUpdate > 5000) {
        lastScreenUpdate = millis();
        drawMainScreen(0, "OFFLINE CACHE ACTIVE", String(timeBuf), "");
      }
    } else {
      digitalWrite(LED_WIFI, LOW);
      digitalWrite(LED_REJECT, HIGH);

      static unsigned long lastScreenUpdate = 0;
      if (millis() - lastScreenUpdate > 5000) {
        lastScreenUpdate = millis();
        tft.fillScreen(tft.color565(15, 3, 3));
        tft.setTextColor(tft.color565(239, 68, 68));
        tft.setTextSize(3);
        tft.setCursor(45, 80);
        tft.print("OFFLINE MODE");
        tft.setTextSize(2);
        tft.setTextColor(ILI9341_WHITE);
        tft.setCursor(55, 130);
        tft.print("NO CACHED DATA");
      }
    }
  }

  // Non-blocking cloud polling
  static unsigned long lastPollTime = 0;
  if (WiFi.status() == WL_CONNECTED && !is_offline_mode) {
    digitalWrite(LED_WIFI, HIGH);

    if (millis() - lastPollTime >= currentPollDelay) {
      lastPollTime = millis();

      // ดึงเวลาปัจจุบันจำลอง
      String time_str = "12:00:00";
      // คำนวณเวลาแบบง่าย (ชั่วโมง:นาที:วินาที)
      unsigned long sec = millis() / 1000;
      unsigned long hh = (sec / 3600) % 24;
      unsigned long mm = (sec / 60) % 60;
      unsigned long ss = sec % 60;
      char timeBuf[10];
      snprintf(timeBuf, sizeof(timeBuf), "%02d:%02d:%02d", (int)hh, (int)mm,
               (int)ss);
      time_str = String(timeBuf);

      HTTPClient http;
      if (String(server_url).startsWith("https://")) {
#ifdef WOKWI_SIM
        // Wokwi: ใช้ local secureClient ธรรมดา (ไม่มี persistent session ใน simulator)
        static WiFiClientSecure simClient;
        simClient.setInsecure();
        http.begin(simClient, server_url);
#else
        // Physical: ใช้ persistentTlsClient (reuse TLS session — ลด handshake 200-400ms ต่อรอบ)
        if (!tlsClientInitialized) {
          persistentTlsClient.setCACert(root_ca_cert);
          tlsClientInitialized = true;
        }
        // setReuse: บอก HTTPClient ไม่ปิด connection หลัง request
        http.setReuse(true);
        http.begin(persistentTlsClient, server_url);
#endif
      } else {
        http.begin(server_url);
      }

      http.setTimeout(5000);
      http.addHeader("Content-Type", "application/json");
      http.addHeader("x-api-key", api_key);
      http.addHeader("x-esp32-version", CURRENT_VERSION);

      // HMAC-SHA256 timestamp authentication (V11 fix)
      time_t nowTs = time(nullptr);
      String timestampStr = String((long)nowTs);
      String hmacPayload = timestampStr + ":/api/esp32/display";
      String signature = generateHMACHex(hmacPayload, String(api_key));
      http.addHeader("x-timestamp", timestampStr);
      http.addHeader("x-hmac-signature", signature);
      if (lastEtag.length() > 0) {
        http.addHeader("If-None-Match", lastEtag);
      }

      int httpCode = http.GET();

      // ─── 304 Not Modified: state ไม่เปลี่ยน ไม่ต้อง parse JSON ───
      if (httpCode == 304) {
        idleCycles++;
        if (idleCycles >= 5) {
          currentPollDelay = POLL_SLOW;
        }
        http.end();
        return;
      }

      if (httpCode == 200) {
        // Extract ETag for next request
        String newEtag = http.header("ETag");
        if (newEtag.length() > 0) {
          lastEtag = newEtag;
        }
        api_fail_count = 0;
        is_offline_mode = false;
        if (millis() - last_student_sync > SYNC_STUDENTS_INTERVAL) {
          last_student_sync = millis();
          syncStudentCache();
        }
        if (millis() - last_log_sync > SYNC_LOGS_INTERVAL) {
          last_log_sync = millis();
          syncOfflineLogs();
        }
        String payload = http.getString();
        StaticJsonDocument<768> doc;
        DeserializationError error = deserializeJson(doc, payload);

        if (!error) {
          // ตรวจสอบสัญญาณอัปเกรดซอฟต์แวร์เฟิร์มแวร์แบบไร้สาย (HTTPS Cloud OTA Update)
          bool update_available = doc["update_available"] | false;
          if (update_available) {
            Serial.println("[OTA] ตรวจพบซอฟต์แวร์รุ่นใหม่บนระบบคลาวด์! เริ่มอัปเดตทันที...");
            http.end();
#ifndef WOKWI_SIM
            performHTTPSOTA();
#endif
            return;
          }

          const char *door_trigger = doc["door_trigger"]; // "open" หรือ "idle"
          int pending_count = doc["pending_count"];
          const char *server_time_text = doc["server_time_text"];
          if (server_time_text && strlen(server_time_text) >= 8) {
            time_str = String(server_time_text).substring(0, 8);
          }

          // อ่านประวัติและชื่อล่าสุด
          String approvedName = "";
          String studentId = "";
          if (doc.containsKey("last_approved") &&
              !doc["last_approved"].isNull()) {
            approvedName = doc["last_approved"]["name"].as<String>();
            studentId = doc["last_approved"]["student_id"].as<String>();
          }

          // รับค่าคีย์ลงทะเบียนและ active token ล่าสุดจากคลาวด์เซิร์ฟเวอร์
          const char *active_token = doc["active_token"];
          const char *register_url = doc["register_url"];
          const char *requested_room = doc["requested_room"];

          // สร้างหน้าลิงก์สแกน QR Code ประจำตัวบอร์ดแบบสมบูรณ์
          String qrText = "";
          if (active_token && register_url && requested_room) {
            String regUrl = String(register_url);
            int idx = regUrl.indexOf("/?room=");
            String baseUrl = "";
            if (idx != -1) {
              baseUrl = regUrl.substring(0, idx);
            } else {
              baseUrl = "${origin || "https://project-sigma-ivory-21.vercel.app"}";
            }
            qrText = baseUrl + "/?scan=" + String(active_token) +
                     "&room=" + String(requested_room);
          }

          DBGF("Door command: %s | Queue: %d\\n", door_trigger ? door_trigger : "NULL", pending_count);

          // ─── Adaptive Polling: ปรับความเร็วตาม activity ───
          if (String(door_trigger) == "open") {
            idleCycles = 0;
            currentPollDelay = POLL_FAST;
          } else if (pending_count != last_queue_count ||
                     studentId != last_approved_name ||
                     (active_token && String(active_token) != last_active_token)) {
            idleCycles = 0;
            currentPollDelay = POLL_NORMAL;
          } else {
            idleCycles++;
            if (idleCycles >= 5) currentPollDelay = POLL_SLOW;
          }

          // --- ลำดับการอนุมัติปลดล็อกประตู (UNLOCKED SEQUENCE) ---
          if (String(door_trigger) == "open") {
            Serial.println("[INFO] Door unlocked");
            DBG("🔓 UNLOCK SIGNAL RECEIVED! Opening door...");

            // ขั้น 1: วาดหน้าจอกำลังประมวลผล (Scanning) สั้นๆ แล้วไปแสดงผลอนุมัติทันที
            drawScanningScreen();
            tone(BUZZER_PIN, 1500, 100);
            delay(300);

            // ขั้น 2: แสดงหน้าจออนุมัติ (Access Granted)
            drawUnlockedScreen(approvedName, studentId);

            // ส่งสัญญาณพอร์ตบวกไประดมการเปิดรีเลย์จริง
            digitalWrite(RELAY_PIN, HIGH);

            // เล่นเพลงเสียงระดับสูงหวานหรูหราต้อนรับ
            tone(BUZZER_PIN, 1000, 150);
            delay(180);
            tone(BUZZER_PIN, 1500, 150);
            delay(180);
            tone(BUZZER_PIN, 2000, 300);

            // ลูปแสดงเกจคูลดาวน์เวลาเปิดประตูก่อนที่จะกลับมาล็อก
            // (ช่วยเพิ่มแอนิเมชันเกจลดเวลาประดับบนจอจำลองให้เหมือน esp32-preview)
            int stepSize = 320 / 38;
            for (int i = 0; i < 38; i++) {
              tft.fillRect(0, 236, 320 - (i * stepSize), 4,
                           tft.color565(16, 185, 129));
              tft.fillRect(320 - (i * stepSize), 236, stepSize, 4,
                           tft.color565(6, 78, 59));
              delay(100);
            }

            digitalWrite(RELAY_PIN, LOW); // ดึงพินกลับคืนประตูล็อก
            Serial.println("[INFO] Door locked");
            DBG("🔒 Door auto locked.");

            // เสียงติ๊ดสั้นเมื่อประตูล็อกกลับคืน
            tone(BUZZER_PIN, 800, 250);

            // บังคับให้ล้างค่าเก่าเพื่อรีดรอการวาดหน้าหลักสแตนด์บายรอบใหม่
            last_queue_count = -1;
            last_approved_name = "FORCE_REDRAW";
            last_active_token = "FORCE_REDRAW";
          }
          // --- ส่วนลดการกะพริบ: โหลดข้อมูลใหม่เฉพาะจุดที่มีการอัปเดตสเตตัส ---
          else if (pending_count != last_queue_count ||
                   studentId != last_approved_name ||
                   (active_token && String(active_token) != last_active_token)) {
            last_queue_count = pending_count;
            last_approved_name = studentId;
            if (active_token)
              last_active_token = String(active_token);

            drawMainScreen(pending_count, studentId, time_str, qrText);
          } else {
            // หากไม่มีคำสั่งและข้อมูลไม่เปลี่ยน แต่อยากให้อัปเดตเฉพาะนาฬิกา
            tft.setTextSize(1);
            tft.fillRect(265, 0, 55, 20,
                         tft.color565(14, 17, 28)); // ล้างแถบเวลาเก่า
            tft.setTextColor(tft.color565(16, 185, 129));
            tft.setCursor(265, 6);
            tft.print(time_str);
          }
        }
      } else {
        Serial.println("[ERROR] Connection failed");
        DBGF("HTTP Error: %d\\n", httpCode);
        api_fail_count++;
        if (api_fail_count >= 5) {
          if (!is_offline_mode) {
            is_offline_mode = true;
            DBG("Entering offline fallback mode due to consecutive API "
                "failures.");
          }
        }
      }
      http.end();
    }
  } else if (WiFi.status() != WL_CONNECTED) {
    // กะพริบเตือนกรณีสัญญาณเครือข่ายสูญหาย
    digitalWrite(LED_WIFI, LOW);
    delay(250);
    digitalWrite(LED_WIFI, HIGH);
    delay(250);
  }
}

// ─── Security Hardening Helper: Constant-Time Comparison (VULN-036) ──────────
// Prevents Timing Attacks when comparing sensitive keys or passwords.
bool secureCompare(const char* a, const char* b) {
  size_t lenA = strlen(a);
  size_t lenB = strlen(b);
  size_t len = (lenA > lenB) ? lenA : lenB;
  
  volatile uint8_t result = lenA ^ lenB;
  for (size_t i = 0; i < len; i++) {
    uint8_t ca = (i < lenA) ? a[i] : 0;
    uint8_t cb = (i < lenB) ? b[i] : 0;
    result |= ca ^ cb;
  }
  return result == 0;
}

// NOTE: The following rate limiting block is prepared for future local web server implementation:
/*
void handleLocalWebServerRequest() {
  static unsigned long lastRequest = 0;
  static int requestCount = 0;
  if (millis() - lastRequest < 60000) {
    requestCount++;
    if (requestCount > 30) {  // max 30 req/min
      // server.send(429, "text/plain", "Too many requests");
      return;
    }
  } else {
    requestCount = 0;
    lastRequest = millis();
  }
}
*/`;
  };

  const highlightArduinoCode = (code: string) => {
    // 1. Escape HTML first
    const safeCode = code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // 2. Tokenize using a single regex that matches comments, strings, preprocessors, keywords, built-ins, and numbers.
    const tokenRegex = new RegExp(
      [
        // 1. Multi-line comments
        `(\\/\\*[\\s\\S]*?\\*\\/)`,
        // 2. Single-line comments
        `(\\/\\/.*)`,
        // 3. Double-quoted strings
        `("[^"\\\\\\r\\n]*(?:\\\\.[^"\\\\\\r\\n]*)*")`,
        // 4. Preprocessor directives
        `(#include\\s+&lt;[^&]+&gt;|#include\\s+"[^"]+"|#define\\s+\\w+)`,
        // 5. Keywords (types, control statements, class names)
        `\\b(void|const|char|int|float|double|bool|while|if|else|new|return|setup|loop|String|StaticJsonDocument|DeserializationError|Adafruit_ILI9341|Adafruit_GFX|SPI)\\b`,
        // 6. Arduino / ESP32 Built-in objects, functions, and constants
        `\\b(Serial|pinMode|digitalWrite|delay|WiFi|HTTPClient|WiFiClientSecure|deserializeJson|OUTPUT|INPUT|HIGH|LOW|WL_CONNECTED|tft|begin|setRotation|fillScreen|fillRect|drawRoundRect|fillCircle|setTextColor|setTextSize|setCursor|print|println|tone|ILI9341_WHITE|ILI9341_BLACK|ILI9341_GREEN|ILI9341_YELLOW|ILI9341_RED|RELAY_PIN|TFT_CS|TFT_DC|TFT_RST|LED_WIFI|LED_REJECT|BUZZER_PIN)\\b`,
        // 7. Numbers
        `\\b(\\d+|0x[0-9A-Fa-f]+)\\b`
      ].join("|"),
      "g"
    );

    // Replace matched tokens with styled spans
    return safeCode.replace(tokenRegex, (match, mComment1, mComment2, mString, mPreproc, mKeyword, mBuiltin, mNumber) => {
      if (mComment1 || mComment2) {
        return `<span style="color: #7CA668; font-style: italic;">${match}</span>`;
      }
      if (mString) {
        return `<span style="color: #CE9178;">${match}</span>`;
      }
      if (mPreproc) {
        return `<span style="color: #C586C0; font-weight: bold;">${match}</span>`;
      }
      if (mKeyword) {
        return `<span style="color: #569CD6; font-weight: bold;">${match}</span>`;
      }
      if (mBuiltin) {
        const isConstant = /^(OUTPUT|INPUT|HIGH|LOW|WL_CONNECTED|ILI9341_WHITE|ILI9341_BLACK|ILI9341_GREEN|ILI9341_YELLOW|ILI9341_RED|RELAY_PIN|TFT_CS|TFT_DC|TFT_RST|LED_WIFI|LED_REJECT|BUZZER_PIN)$/.test(match);
        const color = isConstant ? "#DCDCAA" : "#4FC1FF";
        const weight = isConstant ? "bold" : "normal";
        return `<span style="color: ${color}; font-weight: ${weight};">${match}</span>`;
      }
      if (mNumber) {
        return `<span style="color: #B5CEA8;">${match}</span>`;
      }
      return match;
    });
  };

  const saveSettings = async (e: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    setSettingsLoading(true);

    // Prepare room custom settings to be dynamically saved
    const custom_settings: Record<string, string> = {};
    custom_settings["configured_rooms"] = roomsList.map(r => r.room).join(",");
    roomsList.forEach(r => {
      custom_settings[`room_ip_${r.room}`] = r.ip;
      const cfg = roomConfigs[r.room] ?? defaultRoomConfig();
      custom_settings[`rcfg_${r.room}_auto_approve_enabled`] = cfg.auto_approve_enabled ? "1" : "0";
      custom_settings[`rcfg_${r.room}_auto_approve_start_time`] = cfg.auto_approve_start_time;
      custom_settings[`rcfg_${r.room}_auto_approve_end_time`] = cfg.auto_approve_end_time;
      custom_settings[`rcfg_${r.room}_auto_approve_days`] = cfg.auto_approve_days;
      custom_settings[`rcfg_${r.room}_auto_fill_enabled`] = cfg.auto_fill_enabled ? "1" : "0";
      custom_settings[`rcfg_${r.room}_auto_fill_mode`] = cfg.auto_fill_mode;
      custom_settings[`rcfg_${r.room}_student_id_display_mode`] = cfg.student_id_display_mode;
    });

    try {
      const r = await fetch("/api/system/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...settings,
          auto_approve_enabled: settings.auto_approve_enabled ? "1" : "0",
          auto_fill_enabled: settings.auto_fill_enabled ? "1" : "0",
          custom_settings
        }),
      });
      const data = await r.json();
      if (r.ok) {
        showToast("บันทึกการตั้งค่าระบบและรายการห้องเรียนสำเร็จ", "success");
        fetchSettings();
      } else {
        showToast(data.error || "ไม่สามารถบันทึกได้", "error");
      }
    } catch {
      showToast("เกิดข้อผิดพลาดการบันทึกข้อมูล", "error");
    } finally {
      setSettingsLoading(false);
    }
  };

  const saveSingleRoomSettings = async (roomCode: string, ipAddress: string) => {
    setRoomSaving(prev => ({ ...prev, [roomCode]: true }));

    const custom_settings: Record<string, string> = {};
    custom_settings["configured_rooms"] = roomsList.map(r => r.room).join(",");
    custom_settings[`room_ip_${roomCode}`] = ipAddress;
    
    const cfg = roomConfigs[roomCode] ?? defaultRoomConfig();
    custom_settings[`rcfg_${roomCode}_auto_approve_enabled`] = cfg.auto_approve_enabled ? "1" : "0";
    custom_settings[`rcfg_${roomCode}_auto_approve_start_time`] = cfg.auto_approve_start_time;
    custom_settings[`rcfg_${roomCode}_auto_approve_end_time`] = cfg.auto_approve_end_time;
    custom_settings[`rcfg_${roomCode}_auto_approve_days`] = cfg.auto_approve_days;
    custom_settings[`rcfg_${roomCode}_auto_fill_enabled`] = cfg.auto_fill_enabled ? "1" : "0";
    custom_settings[`rcfg_${roomCode}_auto_fill_mode`] = cfg.auto_fill_mode;
    custom_settings[`rcfg_${roomCode}_student_id_display_mode`] = cfg.student_id_display_mode;

    try {
      const r = await fetch("/api/system/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...settings,
          auto_approve_enabled: settings.auto_approve_enabled ? "1" : "0",
          auto_fill_enabled: settings.auto_fill_enabled ? "1" : "0",
          custom_settings
        }),
      });
      const data = await r.json();
      if (r.ok) {
        showToast(`บันทึกการตั้งค่าห้อง ${roomCode} สำเร็จ`, "success");
        fetchSettings();
      } else {
        showToast(data.error || "ไม่สามารถบันทึกได้", "error");
      }
    } catch {
      showToast("เกิดข้อผิดพลาดการบันทึกข้อมูล", "error");
    } finally {
      setRoomSaving(prev => ({ ...prev, [roomCode]: false }));
    }
  };

  const handleTestConnection = async (roomCode: string) => {
    setTestingRoom(roomCode);
    try {
      const res = await fetch(`/api/esp32/status?room=${roomCode}`);
      const data = await res.json();
      if (res.ok && data.online) {
        setTestResults(prev => ({ ...prev, [roomCode]: { online: true, ip: data.ip, mode: data.mode } }));
        showToast(` เชื่อมต่อบอร์ดห้อง ${roomCode} (${data.ip}) สำเร็จ!`, "success");
      } else {
        setTestResults(prev => ({ ...prev, [roomCode]: { online: false, ip: data.ip || "ไม่ระบุ", mode: data.mode || "physical" } }));
        showToast(` ไม่สามารถเชื่อมต่อกับบอร์ดห้อง ${roomCode} (${data.ip || "ไม่ระบุ"})`, "error");
      }
    } catch {
      setTestResults(prev => ({ ...prev, [roomCode]: { online: false, ip: "error", mode: "physical" } }));
      showToast(` ไม่สามารถติดต่อเซิร์ฟเวอร์เพื่อทดสอบห้อง ${roomCode}`, "error");
    } finally {
      setTestingRoom(null);
    }
  };

  const [unlockingRoom, setUnlockingRoom] = useState<string | null>(null);
  const [recentlyUnlockedRooms, setRecentlyUnlockedRooms] = useState<Record<string, boolean>>({});

  const handleDirectUnlockRoom = async (roomCode: string) => {
    setUnlockingRoom(roomCode);
    try {
      const res = await fetch("/api/system/unlock-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ room: roomCode }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(` ปลดล็อกประตูห้อง ${roomCode} สำเร็จ!`, "success");
        // Trigger a 5-second glowing active unlock animation in the client UI
        setRecentlyUnlockedRooms(prev => ({ ...prev, [roomCode]: true }));
        setTimeout(() => {
          setRecentlyUnlockedRooms(prev => ({ ...prev, [roomCode]: false }));
        }, 5000);
        fetchSystemStatus(); // update online status and locked status
      } else {
        showToast(data.error || `ไม่สามารถเปิดประตูห้อง ${roomCode} ได้`, "error");
      }
    } catch {
      showToast("เกิดข้อผิดพลาดการเชื่อมต่อระบบปลดล็อก", "error");
    } finally {
      setUnlockingRoom(null);
    }
  };

  const handleAddRoom = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e) e.preventDefault();
    const code = newRoomCode.trim().toUpperCase();
    const ip = newRoomIp.trim();
    if (!code || !ip) {
      showToast("กรุณากรอกรหัสห้องเรียนและ IP Address", "error");
      return;
    }
    // Block special characters in room code for safety
    if (!/^[A-Z0-9_-]{2,20}$/.test(code)) {
      showToast("รหัสห้องเรียนต้องเป็นตัวอักษรภาษาอังกฤษ ตัวเลข - หรือ _ เท่านั้น", "error");
      return;
    }
    if (roomsList.some(r => r.room === code)) {
      showToast("รหัสห้องเรียนนี้มีอยู่แล้ว", "error");
      return;
    }
    const updatedRooms = [...roomsList, { room: code, ip }];
    setRoomsList(updatedRooms);
    setNewRoomCode("");
    setNewRoomIp("");

    setSettingsLoading(true);
    const custom_settings: Record<string, string> = {};
    custom_settings["configured_rooms"] = updatedRooms.map(r => r.room).join(",");
    updatedRooms.forEach(r => {
      custom_settings[`room_ip_${r.room}`] = r.ip;
    });

    try {
      const r = await fetch("/api/system/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...settings,
          auto_approve_enabled: settings.auto_approve_enabled ? "1" : "0",
          auto_fill_enabled: settings.auto_fill_enabled ? "1" : "0",
          custom_settings
        }),
      });
      const data = await r.json();
      if (r.ok) {
        showToast(`เพิ่มห้อง ${code} ลงในระบบและบันทึกข้อมูลเรียบร้อยแล้ว`, "success");
        fetchSettings();
        fetchSystemStatus();
      } else {
        showToast(data.error || "ไม่สามารถบันทึกห้องเรียนใหม่ได้", "error");
      }
    } catch {
      showToast("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์", "error");
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleRemoveRoom = async (roomCode: string) => {
    if (!confirm(`ต้องการลบห้อง ${roomCode} และข้อมูลบอร์ดควบคุมทั้งหมดออกจากระบบ ใช่หรือไม่?`)) return;
    const updatedRooms = roomsList.filter(r => r.room !== roomCode);
    setRoomsList(updatedRooms);

    setSettingsLoading(true);
    const custom_settings: Record<string, string> = {};
    custom_settings["configured_rooms"] = updatedRooms.map(r => r.room).join(",");
    updatedRooms.forEach(r => {
      custom_settings[`room_ip_${r.room}`] = r.ip;
    });

    try {
      const r = await fetch("/api/system/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...settings,
          auto_approve_enabled: settings.auto_approve_enabled ? "1" : "0",
          auto_fill_enabled: settings.auto_fill_enabled ? "1" : "0",
          custom_settings
        }),
      });
      const data = await r.json();
      if (r.ok) {
        showToast(`ลบห้อง ${roomCode} และอัปเดตระบบเรียบร้อยแล้ว`, "success");
        fetchSettings();
        fetchSystemStatus();
      } else {
        showToast(data.error || "ไม่สามารถบันทึกการลบห้องเรียนได้", "error");
      }
    } catch {
      showToast("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์", "error");
    } finally {
      setSettingsLoading(false);
    }
  };

  // Unified Filters (Tab 2: ทำเนียบ & ประวัติเข้าออก)
  const [searchQ, setSearchQ] = useState("");
  const [filterStatus, setFilter] = useState("all");

  // Unified Date Range selection (Initialized to 2026-05-23 which is system launch)
  const [startDate, setStartDate] = useState("2026-05-23");
  const [endDate, setEndDate] = useState(() => new Date().toLocaleDateString("en-CA"));

  const [logFilter, setLogFilter] = useState("all");
  const [logSearch, setLogSearch] = useState("");
  const [logPageSize, setLogPageSize] = useState(10);
  const [logCurrentPage, setLogCurrentPage] = useState(1);

  const [newAdmin, setNewAdmin] = useState({ username: "", password: "", full_name: "", role: "door_operator" });
  const [newAdminAllowedRooms, setNewAdminAllowedRooms] = useState<string[]>([]);
  const [editingAdmin, setEditingAdmin] = useState<any | null>(null);
  const [editAdminForm, setEditAdminForm] = useState({ full_name: "", role: "door_operator" });
  const [editAdminAllowedRooms, setEditAdminAllowedRooms] = useState<string[]>([]);
  const [editAdminLoading, setEditAdminLoading] = useState(false);
  const [currentTime, setTime] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [systemStatus, setSystemStatus] = useState<{
    serviceState?: "online" | "degraded" | "offline";
    degraded?: boolean;
    mode?: string;
    postgresql: { online: boolean; host: string; database: string; error: string };
    esp32: { online: boolean; doorStatus: string; ip: string; mock: boolean; room?: string };
    esp32Devices?: { room: string; online: boolean; ip: string; doorStatus: string; mock: boolean; mode: string; activeToken?: string }[];
    discord: { configured: boolean };
    logSummary: { total: number; active: number; expired: number; retentionDays: number };
  } | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [, setDeleteType] = useState<"expired" | "all">("expired");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Firmware releases states
  const [firmwareReleases, setFirmwareReleases] = useState<any[]>([]);
  const [firmwareReleasesLoading, setFirmwareReleasesLoading] = useState(false);
  const [firmwareUploadLoading, setFirmwareUploadLoading] = useState(false);
  const [firmwareVersionInput, setFirmwareVersionInput] = useState("");
  const [firmwarePublicUrlInput, setFirmwarePublicUrlInput] = useState("");
  const [firmwareFile, setFirmwareFile] = useState<File | null>(null);
  const [firmwareLogs, setFirmwareLogs] = useState<any[]>([]);
  const [firmwareLogsLoading, setFirmwareLogsLoading] = useState(false);


  const fetchFirmwares = useCallback(async () => {
    setFirmwareReleasesLoading(true);
    try {
      const r = await fetch("/api/system/firmware");
      if (r.ok) {
        const data = await r.json();
        setFirmwareReleases(data.releases || []);
      }
    } catch (err) {
      console.error("Failed to fetch firmware list", err);
    } finally {
      setFirmwareReleasesLoading(false);
    }
  }, []);

  const fetchFirmwareLogs = useCallback(async () => {
    setFirmwareLogsLoading(true);
    try {
      const r = await fetch("/api/logs?action=firmware&limit=50");
      if (r.ok) {
        const data = await r.json();
        setFirmwareLogs(data.logs || []);
      }
    } catch (err) {
      console.error("Failed to fetch firmware logs", err);
    } finally {
      setFirmwareLogsLoading(false);
    }
  }, []);

  const [healthData, setHealthData] = useState<{
    status: "healthy" | "degraded" | "unhealthy";
    timestamp: string;
    components: {
      database: { status: "up" | "down"; latency_ms: number };
      rate_limiter: { status: "up" | "down" };
      memory: { rss_mb: number; heap_used_mb: number };
    };
    server_time: string;
    last_qr_scan: string | null;
  } | null>(null);

  const fetchHealthData = useCallback(async () => {
    try {
      const r = await fetch("/api/system/health");
      if (r.ok) {
        const d = await r.json();
        setHealthData(d);
      }
    } catch {
      // ignore
    }
  }, []);

  const fetchSystemStatus = useCallback(async () => {
    try {
      const r = await fetch("/api/system/status");
      const d = await r.json();
      if (r.ok) {
        setSystemStatus(d);
      }
    } catch (err) {
      console.error("Failed to fetch system status", err);
    }
  }, []);

  // Clock
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleString("th-TH", {
      timeZone: "Asia/Bangkok", year: "numeric", month: "long", day: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
    }));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Auth check
  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.json())
      .then(d => {
        if (d.error) router.push("/admin/login");
        else setUser(d.user);
      })
      .catch(() => router.push("/admin/login"));
  }, [router]);

  useEffect(() => {
    if (user?.role !== "owner") return;
    setTimeout(() => {
      fetchSettings();
    }, 0);
  }, [user, fetchSettings]);

  // Fetch pending list
  const fetchPending = useCallback(async () => {
    try {
      const r = await fetch("/api/students/pending");
      const d = await r.json();
      const list = d.students || [];
      setPending(list);

      // Trigger auditory bell chime if queue size increases
      if (list.length > lastPendingCountRef.current) {
        if (audioEnabled) {
          playSoftChime();
        }
      }
      lastPendingCountRef.current = list.length;
    } catch (err) {
      console.error("Failed to fetch pending list", err);
    }
  }, [audioEnabled, playSoftChime]);

  // Fetch all students directory
  const fetchAll = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterStatus !== "all") params.set("status", filterStatus);
    if (searchQ) params.set("search", searchQ);
    const r = await fetch(`/api/students?${params}`);
    const d = await r.json();
    setAll(d.students || []);
  }, [filterStatus, searchQ]);

  // Fetch Access logs
  const fetchLogs = useCallback(async () => {
    const r = await fetch("/api/logs");
    const d = await r.json();
    setLogs(d.logs || []);
  }, []);

  const fetchAdmins = useCallback(async () => {
    const r = await fetch("/api/admin-users");
    const d = await r.json();
    setAdmins(d.admins || []);
  }, []);

  useEffect(() => {
    if (user?.role === "owner") {
      fetchAdmins();
    }
  }, [user, fetchAdmins]);

  // ─── SSE real-time subscription (replaces 10s interval polling) ───
  useEffect(() => {
    if (!user) return;

    // Fallback initial load while SSE connects
    fetchPending();
    fetchLogs();

    const es = new EventSource("/api/sse");

    const applySnapshot = (data: { pending: Student[]; logs: AccessLog[] }) => {
      if (Array.isArray(data.pending)) setPending(data.pending);
      if (Array.isArray(data.logs)) setLogs(data.logs);
    };

    es.addEventListener("snapshot", (e: MessageEvent) => {
      try { applySnapshot(JSON.parse(e.data)); } catch { /* ignore */ }
    });
    es.addEventListener("update", (e: MessageEvent) => {
      try { applySnapshot(JSON.parse(e.data)); } catch { /* ignore */ }
    });
    es.onerror = () => {
      // SSE reconnects automatically; fall back to manual poll on persistent error
      es.close();
      const iv = setInterval(() => { fetchPending(); fetchLogs(); }, 10000);
      return () => clearInterval(iv);
    };

    return () => es.close();
  }, [user, fetchPending, fetchLogs]);

  // Polling System Status
  useEffect(() => {
    if (!user) return;
    setTimeout(() => {
      fetchSystemStatus();
    }, 0);
    const interval = setInterval(fetchSystemStatus, 15000);
    return () => clearInterval(interval);
  }, [fetchSystemStatus, user]);

  // Polling System Health (every 30s)
  useEffect(() => {
    if (!user) return;
    fetchHealthData();
    const interval = setInterval(fetchHealthData, 30000);
    return () => clearInterval(interval);
  }, [fetchHealthData, user]);

  useEffect(() => {
    if (settingsLoaded || roomsList.length > 0 || !systemStatus?.esp32Devices?.length) return;
    const esp32Devices = systemStatus.esp32Devices;
    queueMicrotask(() => {
      setRoomsList(
        esp32Devices.map(device => ({
          room: device.room,
          ip: device.ip || "192.168.1.100",
        }))
      );
    });
  }, [settingsLoaded, roomsList.length, systemStatus?.esp32Devices]);

  // Auto-pruning expired logs (>90 days) on startup
  useEffect(() => {
    if (user?.role === "owner") {
      fetchFirmwares();
      fetchFirmwareLogs();
      const autoPrune = async () => {
        try {
          const r = await fetch("/api/system/logs/cleanup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ type: "expired" })
          });
          const d = await r.json();
          if (r.ok && d.affectedRows > 0) {
            showToast(`ระบบบำรุงรักษาอัตโนมัติ: ล้างข้อมูลจราจรหมดอายุ (>90 วัน) ออกแล้ว ${d.affectedRows} รายการ`, "success");
            fetchSystemStatus();
            fetchAll();
            fetchLogs();
          }
        } catch (err) {
          console.error("Failed to auto prune expired logs", err);
        }
      };
      const timer = setTimeout(autoPrune, 3000);
      return () => clearTimeout(timer);
    }
  }, [user, fetchSystemStatus, fetchAll, fetchLogs]);

  useEffect(() => {
    if ((tab === "all" || tab === "rooms" || tab === "pending") && (user?.role === "owner" || user?.role === "log_viewer")) {
      setTimeout(() => {
        fetchAll();
        fetchLogs();
      }, 0);
    }
    if (tab === "admins" && user?.role === "owner") {
      setTimeout(() => {
        fetchAdmins();
      }, 0);
    }
    if (tab === "settings" && user?.role === "owner") {
      setTimeout(() => {
        fetchSettings();
      }, 0);
    }
    if (tab === "rooms") {
      fetchAnalytics();
    }
  }, [tab, user, fetchAll, fetchLogs, fetchAdmins, fetchSettings, fetchAnalytics]);

  useEffect(() => {
    if (tab === "all") {
      setTimeout(() => {
        fetchAll();
      }, 0);
    }
  }, [filterStatus, searchQ, fetchAll, tab]);

  // Approve request
  async function handleApprove(id: number) {
    setLoadingId(id);
    try {
      const r = await fetch(`/api/students/${id}/approve`, { method: "POST" });
      const d = await r.json();
      if (r.ok) {
        showToast(d.message);
        fetchPending();
        if (tab === "all") {
          fetchAll();
          fetchLogs();
        }
      } else {
        showToast(d.error, "error");
      }
    } catch {
      showToast("เกิดข้อผิดพลาดในการอนุมัติ", "error");
    } finally {
      setLoadingId(null);
    }
  }

  // Reject request
  async function handleReject() {
    if (!rejectModal) return;
    setLoadingId(rejectModal.id);
    try {
      const r = await fetch(`/api/students/${rejectModal.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      });
      const d = await r.json();
      if (r.ok) {
        showToast(d.message, "error");
        setRejectModal(null);
        setRejectReason("");
        fetchPending();
        if (tab === "all") {
          fetchAll();
          fetchLogs();
        }
      } else {
        showToast(d.error, "error");
      }
    } catch {
      showToast("เกิดข้อผิดพลาด", "error");
    } finally {
      setLoadingId(null);
    }
  }

  // Remote open door
  async function handleOpenDoor(id: number) {
    setLoadingId(id);
    try {
      const r = await fetch(`/api/students/${id}/door`, { method: "POST" });
      const d = await r.json();
      if (r.ok) {
        showToast(d.message, d.success ? "success" : "error");
        if (tab === "all") fetchLogs();
      } else {
        showToast(d.error, "error");
      }
    } catch {
      showToast("เกิดข้อผิดพลาดในการสั่งเปิดประตู", "error");
    } finally {
      setLoadingId(null);
    }
  }

  // Delete student request
  async function handleDelete(id: number, name: string) {
    if (!confirm(`ลบข้อมูลของ "${name}" ออกจากระบบใช่ไหม? การดำเนินการนี้ไม่สามารถย้อนกลับได้`)) return;
    const r = await fetch(`/api/students/${id}`, { method: "DELETE" });
    const d = await r.json();
    if (r.ok) {
      showToast("ลบข้อมูลนักศึกษาสำเร็จ");
      fetchAll();
      fetchLogs();
    } else {
      showToast(d.error, "error");
    }
  }

  // Delete admin user
  async function handleDeleteAdmin(id: number) {
    if (!confirm("ต้องการถอนสิทธิ์ผู้ดูแลระบบ (Admin) ท่านนี้ใช่ไหม?")) return;
    const r = await fetch(`/api/admin-users/${id}`, { method: "DELETE" });
    const d = await r.json();
    if (r.ok) {
      showToast("ถอนสิทธิ์ Admin เรียบร้อยแล้ว");
      fetchAdmins();
    } else {
      showToast(d.error, "error");
    }
  }

  // Create admin user
  async function handleCreateAdmin(e: React.FormEvent) {
    e.preventDefault();
    const roomsPayload = newAdmin.role === "owner" ? null : newAdminAllowedRooms.join(",");
    const r = await fetch("/api/admin-users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newAdmin, allowed_rooms: roomsPayload }),
    });
    const d = await r.json();
    if (r.ok) {
      showToast("เพิ่มผู้ดูแลระบบใหม่สำเร็จ");
      setNewAdmin({ username: "", password: "", full_name: "", role: "door_operator" });
      setNewAdminAllowedRooms([]);
      fetchAdmins();
    } else {
      showToast(d.error, "error");
    }
  }

  // Update admin user
  async function handleUpdateAdmin(e: React.FormEvent) {
    e.preventDefault();
    if (!editingAdmin) return;
    setEditAdminLoading(true);
    try {
      const roomsPayload = editAdminForm.role === "owner" ? null : editAdminAllowedRooms.join(",");
      const r = await fetch(`/api/admin-users/${editingAdmin.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...editAdminForm, allowed_rooms: roomsPayload }),
      });
      const d = await r.json();
      if (r.ok) {
        showToast("แก้ไขข้อมูลผู้ดูแลระบบสำเร็จ");
        setEditingAdmin(null);
        fetchAdmins();
      } else {
        showToast(d.error, "error");
      }
    } catch {
      showToast("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์", "error");
    } finally {
      setEditAdminLoading(false);
    }
  }

  // PDF Export with date range constraints
  async function handleExportPDFWithDateRange(filterType: string, start: string, end: string) {
    setPdfLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("filter", filterType);
      if (start) params.set("startDate", start);
      if (end) params.set("endDate", end);

      const r = await fetch(`/api/export/pdf?${params}`);
      if (!r.ok) throw new Error("Export failed");
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `smartaccess_report_${filterType}_${start || "launch"}_to_${end || "today"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      showToast("สร้างและส่งออกรายงาน PDF สำเร็จ");
      fetchLogs(); // Reload logs to record PDF export action
    } catch {
      showToast("ไม่สามารถสร้างไฟล์รายงาน PDF ตามช่วงเวลานี้ได้", "error");
    } finally {
      setPdfLoading(false);
    }
  }

  // PDF Individual Card Export
  async function handleExportSingleStudentPDF(id: number, name: string) {
    setLoadingId(id);
    try {
      const r = await fetch(`/api/export/pdf?id=${id}`);
      if (!r.ok) throw new Error("Export failed");
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `student_card_${id}_${name.replace(/\s+/g, "_")}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(`ส่งออกประวัติของ ${name} สำเร็จ`);
      fetchLogs();
    } catch {
      showToast("ไม่สามารถส่งออก PDF ประวัติรายบุคคลได้", "error");
    } finally {
      setLoadingId(null);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  }

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="animate-spin" style={{ width: 42, height: 42, border: "4px solid rgba(124,58,237,0.2)", borderTopColor: "var(--smartaccess-purple)", borderRadius: "50%" }} />
      </div>
    );
  }

  const isOwner = user.role === "owner";
  const pendingCount = pending.length;

  // React Client-Side Filters for the Merged Tab
  const filteredStudents = allStudents.filter(s => {
    const regDate = s.registered_at.split("T")[0]; // YYYY-MM-DD
    if (filterStatus !== "all" && s.status !== filterStatus) return false;
    if (startDate && regDate < startDate) return false;
    if (endDate && regDate > endDate) return false;
    return true;
  });

  const exportSummary = {
    total: filteredStudents.length,
    approved: filteredStudents.filter(s => s.status === "approved").length,
    pending: filteredStudents.filter(s => s.status === "pending").length,
    rejected: filteredStudents.filter(s => s.status === "rejected").length,
  };

  const filteredLogs = logs.filter(log => {
    if (logFilter !== "all" && log.action !== logFilter) return false;

    const logDate = log.timestamp.split("T")[0]; // YYYY-MM-DD
    if (startDate && logDate < startDate) return false;
    if (endDate && logDate > endDate) return false;

    if (logSearch) {
      const q = logSearch.toLowerCase();
      const matchName = log.student_name?.toLowerCase().includes(q) || false;
      const matchCode = log.student_code?.toLowerCase().includes(q) || false;
      const matchAdmin = log.admin_name?.toLowerCase().includes(q) || false;
      const matchNotes = log.notes?.toLowerCase().includes(q) || false;
      return matchName || matchCode || matchAdmin || matchNotes;
    }
    return true;
  });

  const totalFilteredLogs = filteredLogs.length;
  const totalLogPages = Math.ceil(totalFilteredLogs / logPageSize) || 1;
  const displayedLogs = filteredLogs.slice((logCurrentPage - 1) * logPageSize, logCurrentPage * logPageSize);

  const filteredPending = pending.filter(s => {
    if (pendingRoomFilter === "all") return true;
    return s.requested_room === pendingRoomFilter;
  });

  // Calculate daily statistics on client
  const getStats = () => {
    const localBangkok = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
    const y = localBangkok.getFullYear();
    const m = String(localBangkok.getMonth() + 1).padStart(2, "0");
    const d = String(localBangkok.getDate()).padStart(2, "0");
    const todayStrStr = `${y}-${m}-${d}`;

    const doorOpensToday = logs.filter(log => {
      if (!log.timestamp) return false;
      // en-CA locale returns YYYY-MM-DD format
      const logDate = new Date(log.timestamp).toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
      return logDate === todayStrStr && log.action === "door_opened";
    }).length;

    const bypassToday = logs.filter(log => {
      if (!log.timestamp) return false;
      const logDate = new Date(log.timestamp).toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
      return logDate === todayStrStr && log.action === "door_opened" && (log.notes?.includes("Bypass") || log.notes?.includes("สแกนซ้ำ"));
    }).length;

    const onlineBoards = systemStatus?.esp32Devices?.filter(dev => dev.online).length || 0;
    const totalBoards = systemStatus?.esp32Devices?.length || 0;

    return {
      doorOpensToday,
      bypassToday,
      onlineBoards,
      totalBoards
    };
  };

  const stats = getStats();

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      <style dangerouslySetInnerHTML={{
        __html: `
        @media (min-width: 768px) {
          .desktop-hide-trigger {
            display: none !important;
          }
        }
        .dashboard-section-card {
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 8px;
          box-shadow: var(--shadow-sm);
        }
        .settings-map {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
          gap: 10px;
        }
        .settings-map-item {
          border: 1px solid var(--border);
          border-radius: 8px;
          background: #fff;
          padding: 12px 14px;
          display: flex;
          gap: 10px;
          align-items: flex-start;
          min-height: 86px;
        }
        .settings-map-index {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: var(--smartaccess-purple-pale);
          color: var(--smartaccess-purple-dark);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 800;
          flex: 0 0 auto;
        }
        .export-hub {
          display: grid;
          grid-template-columns: minmax(260px, 0.9fr) minmax(320px, 1.1fr);
          gap: 18px;
          padding: 22px;
          margin-bottom: 24px;
        }
        .export-summary-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }
        .export-stat {
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--bg-primary);
          padding: 12px;
        }
        .field-label {
          display: block;
          font-size: 12px;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 6px;
        }
        @media (max-width: 900px) {
          .export-hub {
            grid-template-columns: 1fr;
          }
        }
        .room-manager-shell {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 18px;
        }
        .room-overview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px;
        }
        .room-stat-card {
          background: #fff;
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 16px;
          box-shadow: var(--shadow-sm);
        }
        .room-card-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(330px, 1fr));
          gap: 14px;
        }
        .room-config-card {
          background: #fff;
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 18px;
          box-shadow: var(--shadow-sm);
        }
        .room-form-band {
          background: var(--bg-secondary);
          border: 1px dashed var(--smartaccess-purple-light);
          border-radius: 8px;
          padding: 18px;
        }
      ` }} />
      {/* Toast Notification */}
      {toast && (
        <div className={`toast ${toast.type === "success" ? "toast-success" : "toast-error"}`}>
          <span>{toast.type === "success" ? <CheckIcon /> : <AlertIcon />}</span>
          <span style={{ marginLeft: 6 }}>{toast.msg}</span>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(30, 27, 75, 0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 24 }}>
          <div className="premium-card animate-fade-in" style={{ maxWidth: 440, width: "100%", padding: 28, background: "#fff" }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
              <CrossIcon /> ปฏิเสธคำขอการลงทะเบียน
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: 13.5, marginBottom: 16 }}>
              นักศึกษา: <strong style={{ color: "var(--smartaccess-purple-dark)" }}>{rejectModal.name}</strong>
            </p>
            <textarea
              className="smartaccess-input"
              placeholder="กรุณาระบุเหตุผลการปฏิเสธสิทธิ์ (เพื่อแสดงบนใบประวัติ PDF)"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              style={{ minHeight: 100, resize: "vertical", marginBottom: 20 }}
            />
            <div style={{ display: "flex", gap: 12 }}>
              <button
                className="btn-secondary"
                style={{ flex: 1, padding: "10px" }}
                onClick={() => { setRejectModal(null); setRejectReason(""); }}
              >
                ยกเลิก
              </button>
              <button
                className="btn-danger"
                style={{ flex: 1, padding: "10px" }}
                onClick={handleReject}
                disabled={loadingId === rejectModal.id}
              >
                {loadingId === rejectModal.id ? "กำลังดำเนินการ..." : "ยืนยันปฏิเสธ"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Room IoT & Webhook Settings Modal ─── */}
      {activeRoomDetails && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(30, 27, 75, 0.5)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 24 }}>
          <div className="premium-card animate-scale-in" style={{ maxWidth: 860, width: "100%", maxHeight: "90vh", padding: 0, background: "var(--bg-secondary)", border: "1px solid var(--border)", position: "relative", overflow: "hidden" }}>

            {/* Close button */}
            <button
              type="button"
              onClick={() => setActiveRoomDetails(null)}
              style={{ position: "absolute", top: 18, right: 18, width: 36, height: 36, borderRadius: 8, background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}
            >
              ✕
            </button>

            <div style={{ padding: "24px 28px 18px", borderBottom: "1px solid var(--border)", background: "linear-gradient(135deg, rgba(124,58,237,0.06), rgba(219,39,119,0.04))" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 10px", borderRadius: 8, background: "#fff", border: "1px solid var(--border)", color: "var(--smartaccess-purple-dark)", fontSize: 12, fontWeight: 900, marginBottom: 10 }}>
                ESP32 Room Setup
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 900, color: "var(--text-primary)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                ห้อง {activeRoomDetails.room}
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: 13, margin: "6px 0 0" }}>
                IP / Domain ของบอร์ด: <code style={{ color: "var(--smartaccess-purple)", fontWeight: 800 }}>{activeRoomDetails.ip}</code>
              </p>
            </div>

            {/* Modal Tabs selector */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8, margin: "18px 28px", background: "var(--bg-primary)", padding: 6, borderRadius: 8, border: "1px solid var(--border)" }}>
              {[
                { id: "api", label: "API & URLs", icon: <TerminalIcon /> },
                { id: "webhook", label: "Discord Webhook", icon: <FileTextIcon /> },
                { id: "arduino", label: "Arduino โค้ดบอร์ด (.ino)", icon: <SaveIcon /> }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setRoomDetailsTab(tab.id as typeof roomDetailsTab)}
                  style={{
                    flex: 1,
                    padding: "11px 12px",
                    borderRadius: 8,
                    fontSize: 12.5,
                    fontWeight: 800,
                    cursor: "pointer",
                    border: "none",
                    background: roomDetailsTab === tab.id ? "linear-gradient(135deg, var(--smartaccess-purple) 0%, var(--edu-pink) 100%)" : "transparent",
                    color: roomDetailsTab === tab.id ? "#fff" : "var(--text-secondary)",
                    boxShadow: roomDetailsTab === tab.id ? "0 8px 18px rgba(124,58,237,0.18)" : "none",
                    transition: "all 0.2s"
                  }}
                >
                  <span style={{ marginRight: 6, display: "inline-flex", alignItems: "center", verticalAlign: "middle" }}>{tab.icon}</span>{tab.label}
                </button>
              ))}
            </div>

            {/* Modal Content Panels */}
            <div style={{ minHeight: 300, maxHeight: "calc(90vh - 190px)", overflowY: "auto", padding: "0 28px 28px" }}>

              {/* TAB 1: API & URLs */}
              {roomDetailsTab === "api" && (() => {
                const liveRoomDev = systemStatus?.esp32Devices?.find(d => d.room === activeRoomDetails.room);
                const currentToken = liveRoomDev?.activeToken || "";
                const registrationUrl = `${originUrl}/?scan=${currentToken}&room=${activeRoomDetails.room}`;

                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }} className="animate-fade-in">
                    {[
                      {
                        label: " 1. API ดึงค่าสเตตัสบอร์ด & ทริกเปิดประตู (Display Polling API)",
                        desc: "สำหรับฝั่งบอร์ด ESP32 คอยยิงดึงสถานะจอและแฟล็กปลดล็อกทุกๆ 2 วินาที",
                        url: `${originUrl}/api/esp32/display?room=${activeRoomDetails.room}`,
                        btnLabel: "🧪 ทดสอบ API"
                      },
                      {
                        label: "🖼️ 2. API รูปภาพ QR Code ประจำห้อง (Dynamic PNG QR)",
                        desc: "ส่งกลับผลลัพธ์เป็นไฟล์รูปภาพสแกน PNG ล่าสุดสำหรับนำไปใช้วาดบน LCD",
                        url: `${originUrl}/api/esp32/qr?room=${activeRoomDetails.room}`,
                        btnLabel: "🧪 ทดสอบ API"
                      },
                      {
                        label: "📝 3. ลิงก์ตรงหน้าลงทะเบียนนักศึกษา (Student Registration URL) [Dynamic Token Sync]",
                        desc: "ใช้สแกนลงทะเบียนขอผ่านทางของห้องปฏิบัติการนี้โดยเฉพาะ ซิงก์กับ QR Code บนบอร์ดหน้าห้องเรียน",
                        url: registrationUrl,
                        btnLabel: "🚀 ทดสอบสแกนสด",
                        isRegistration: true
                      }
                    ].map((item, idx) => (
                      <div key={idx} style={{ padding: 16, background: "rgba(255,255,255,0.01)", borderRadius: 12, border: "1px solid var(--border)", textAlign: "left" }}>
                        <div style={{ fontSize: 12.5, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>{item.label}</div>
                        <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 10 }}>{item.desc}</div>
                        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                          <code style={{ flex: 1, padding: "10px 14px", background: "#0F172A", borderRadius: 8, fontSize: 11, color: "#38BDF8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", border: "1.5px solid var(--border)", fontFamily: "Consolas, Monaco, monospace", fontWeight: 700 }}>
                            {item.url}
                          </code>
                          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                            <button
                              type="button"
                              onClick={() => {
                                window.open(item.url, '_blank');
                                showToast(item.isRegistration ? "🚀 เปิดหน้าทดสอบสแกนลงทะเบียนสำเร็จ" : "🌐 เปิดหน้าทดสอบ API เรียบร้อย", "success");
                              }}
                              className="btn-ghost"
                              style={{
                                padding: "8px 12px",
                                fontSize: 11,
                                borderRadius: 8,
                                fontWeight: 700,
                                borderColor: item.isRegistration ? "var(--edu-pink)" : "var(--smartaccess-purple-light)",
                                color: item.isRegistration ? "var(--edu-pink)" : "var(--smartaccess-purple-dark)"
                              }}
                            >
                              {item.btnLabel}
                            </button>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(item.url)}
                              className="btn-ghost"
                              style={{ padding: "8px 12px", fontSize: 11, borderRadius: 8, fontWeight: 700 }}
                            >
                              ก็อปปี้
                            </button>
                          </div>
                        </div>

                        {item.isRegistration && (
                          <div style={{ marginTop: 14, padding: "12px 14px", background: "rgba(139,92,246,0.03)", border: "1.5px dashed rgba(139,92,246,0.15)", borderRadius: 10 }}>
                            <div style={{ fontSize: 11.5, fontWeight: 800, color: "var(--smartaccess-purple)", display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                              🛡️ ระบบความปลอดภัยและกฎการหมุนเวียน Token:
                            </div>
                            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 10.5, color: "var(--text-secondary)", lineHeight: "1.5", display: "flex", flexDirection: "column", gap: 4 }}>
                              <li>
                                <strong style={{ color: "var(--text-primary)" }}>การหมุนเวียนคีย์ (Rotation):</strong> ลิงก์และ QR Code จะซิงก์กันเสมอ และหมุนเวียนเปลี่ยนคีย์ใหม่โดยอัตโนมัติทุกๆ <span style={{ color: "var(--edu-pink)", fontWeight: 700 }}>60 วินาที</span> ตามหน้าจอหลักของบอร์ดหน้าห้องเรียน
                              </li>
                              <li>
                                <strong style={{ color: "var(--text-primary)" }}>อายุการใช้กรอก (Expiry):</strong> แต่ละคีย์มีอายุการกรอกลงทะเบียนได้ไม่เกิน <span style={{ color: "var(--smartaccess-purple)", fontWeight: 700 }}>5 นาที (300 วินาที)</span> เพื่อให้เวลาผู้ใช้กรอกแบบฟอร์ม
                              </li>
                              <li>
                                <strong style={{ color: "var(--text-primary)" }}>ใช้งานครั้งเดียว (One-Time Token):</strong> เมื่ออนุมัติหรือส่งข้อมูลสำเร็จ คีย์นั้นจะใช้ไม่ได้อีกทันทีเพื่อความปลอดภัย หากแอดมินต้องการทดสอบใหม่ ให้กลับมาที่หน้านี้แล้วกดปุ่ม <span style={{ color: "var(--edu-pink)", fontWeight: 700 }}>🚀 ทดสอบสแกนสด</span> อีกครั้ง
                              </li>
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* TAB 2: Discord Webhook */}
              {roomDetailsTab === "webhook" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16, textAlign: "left" }} className="animate-fade-in">
                  <div style={{ padding: 14, background: "rgba(139,92,246,0.03)", border: "1px dashed rgba(139,92,246,0.25)", borderRadius: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "var(--smartaccess-purple-dark)" }}>🔔 ระบบแจ้งเตือนเฉพาะกลุ่มห้องเรียน (Traffic Webhook Isolation)</span>
                    <p style={{ color: "var(--text-secondary)", fontSize: 11.5, margin: "6px 0 0 0", lineHeight: "1.4" }}>
                      ท่านสามารถระบุ Discord Webhook ประจำห้องเรียนห้องนี้ได้โดยเฉพาะ เพื่อส่งข้อมูลความปลอดภัยแยกขาดตามห้องปฏิบัติการได้แบบ 3 แชนแนล (สแกน, อนุมัติ, และบันทึกระบบ)
                    </p>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                        📝 1. คำขอลงทะเบียนเข้าห้องใหม่ (Register Webhook)
                      </label>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <input
                          className="smartaccess-input"
                          placeholder="วางลิงก์ https://discord.com/api/webhooks/..."
                          value={roomWebhookRegisterInput}
                          onChange={e => setRoomWebhookRegisterInput(e.target.value)}
                          style={{ flex: 1, padding: "10px 14px", fontSize: 12.5 }}
                        />
                        <button
                          type="button"
                          onClick={() => handleTestWebhook(roomWebhookRegisterInput, "register", activeRoomDetails.room)}
                          className="btn-ghost"
                          style={{ padding: "10px 14px", fontSize: 11.5, borderRadius: 10, flexShrink: 0, fontWeight: 700 }}
                        >
                          ทดสอบส่ง
                        </button>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                        🚪 2. แจ้งเตือนอนุมัติสิทธิ์ / เปิดประตูสำเร็จ (Approve/Reject Webhook)
                      </label>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <input
                          className="smartaccess-input"
                          placeholder="วางลิงก์ https://discord.com/api/webhooks/..."
                          value={roomWebhookApproveInput}
                          onChange={e => setRoomWebhookApproveInput(e.target.value)}
                          style={{ flex: 1, padding: "10px 14px", fontSize: 12.5 }}
                        />
                        <button
                          type="button"
                          onClick={() => handleTestWebhook(roomWebhookApproveInput, "approve", activeRoomDetails.room)}
                          className="btn-ghost"
                          style={{ padding: "10px 14px", fontSize: 11.5, borderRadius: 10, flexShrink: 0, fontWeight: 700 }}
                        >
                          🧪 ทดสอบส่ง
                        </button>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                        📊 3. บันทึก Log จราจร/บอร์ดออฟไลน์ (Logs Webhook)
                      </label>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <input
                          className="smartaccess-input"
                          placeholder="วางลิงก์ https://discord.com/api/webhooks/..."
                          value={roomWebhookLogsInput}
                          onChange={e => setRoomWebhookLogsInput(e.target.value)}
                          style={{ flex: 1, padding: "10px 14px", fontSize: 12.5 }}
                        />
                        <button
                          type="button"
                          onClick={() => handleTestWebhook(roomWebhookLogsInput, "logs", activeRoomDetails.room)}
                          className="btn-ghost"
                          style={{ padding: "10px 14px", fontSize: 11.5, borderRadius: 10, flexShrink: 0, fontWeight: 700 }}
                        >
                          🧪 ทดสอบส่ง
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveRoomWebhook}
                    disabled={roomDetailsLoading}
                    className="btn-success"
                    style={{
                      padding: "10px 20px",
                      borderRadius: 10,
                      fontWeight: 800,
                      fontSize: 12.5,
                      alignSelf: "flex-end",
                      background: "linear-gradient(135deg, var(--smartaccess-purple) 0%, var(--edu-pink) 100%)",
                      color: "#fff",
                      boxShadow: "0 4px 10px rgba(124,58,237,0.2)",
                      border: "none",
                      cursor: "pointer",
                      marginTop: 8
                    }}
                  >
                    {roomDetailsLoading ? "⏳ กำลังเซฟ..." : "💾 บันทึก Webhooks ทั้งหมดประจำห้อง"}
                  </button>
                </div>
              )}

              {/* TAB 3: Arduino .ino Code Generator */}
              {roomDetailsTab === "arduino" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16, textAlign: "left" }} className="animate-fade-in">
                  <div style={{ padding: 14, background: "rgba(16,185,129,0.03)", border: "1px dashed rgba(16,185,129,0.25)", borderRadius: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "#059669" }}>🔌 Secure IoT C++ (.ino) Code Generator</span>
                    <p style={{ color: "var(--text-secondary)", fontSize: 11.5, margin: "6px 0 0 0", lineHeight: "1.4" }}>
                      เพื่อความปลอดภัยขั้นสูง ระบบได้ทำการแยกการตั้งค่าความลับ (WiFi, API Key, CA Cert) ออกจากโค้ดระบบควบคุมหลักอย่างเป็นระบบ โดยแยกเป็นไฟล์ <code>config.h</code> และ <code>esp32.ino</code> ดังแสดงด้านล่างนี้
                    </p>
                  </div>

                  {/* Firmware Mode Toggle */}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", flexShrink: 0 }}>🎯 เลือกโหมด:</span>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        type="button"
                        onClick={() => setFirmwareMode("physical")}
                        style={{
                          padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer",
                          background: firmwareMode === "physical" ? "#3B82F6" : "rgba(255,255,255,0.06)",
                          color: firmwareMode === "physical" ? "#fff" : "var(--text-secondary)",
                          border: firmwareMode === "physical" ? "1.5px solid #3B82F6" : "1.5px solid rgba(255,255,255,0.1)",
                          transition: "all 0.15s"
                        }}
                      >
                        🔧 บอร์ด ESP32 จริง
                      </button>
                      <button
                        type="button"
                        onClick={() => setFirmwareMode("wokwi")}
                        style={{
                          padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer",
                          background: firmwareMode === "wokwi" ? "#10B981" : "rgba(255,255,255,0.06)",
                          color: firmwareMode === "wokwi" ? "#fff" : "var(--text-secondary)",
                          border: firmwareMode === "wokwi" ? "1.5px solid #10B981" : "1.5px solid rgba(255,255,255,0.1)",
                          transition: "all 0.15s"
                        }}
                      >
                        🧪 Wokwi Simulator
                      </button>
                    </div>
                    <span style={{ fontSize: 11, color: firmwareMode === "wokwi" ? "#10B981" : "#3B82F6", fontWeight: 600, marginLeft: 4 }}>
                      {firmwareMode === "wokwi" ? "— ใช้ setInsecure() แทน CA Cert / SSID: Wokwi-GUEST" : "— ใช้ CA Cert ตรวจสอบ HTTPS / ต้องใส่ SSID จริง"}
                    </span>
                  </div>

                  {/* Wokwi warning banner */}
                  {firmwareMode === "wokwi" && (
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 14px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.35)", borderRadius: 8 }}>
                      <span style={{ fontSize: 15 }}>⚠️</span>
                      <span style={{ fontSize: 11.5, color: "#F59E0B", lineHeight: 1.5, fontWeight: 600 }}>
                        โค้ดนี้สำหรับ Wokwi Simulator เท่านั้น — ห้ามใช้บนบอร์ดจริง
                        <span style={{ display: "block", fontWeight: 400, color: "var(--text-secondary)", marginTop: 2 }}>
                          โหมด Wokwi ใช้ <code style={{ background: "rgba(255,255,255,0.06)", padding: "1px 5px", borderRadius: 4 }}>setInsecure()</code> แทน CA Certificate เพราะ Wokwi ไม่รองรับ TLS จริง — สำหรับ deploy บอร์ดจริงให้เปลี่ยนโหมดเป็น &quot;บอร์ด ESP32 จริง&quot;
                        </span>
                      </span>
                    </div>
                  )}

                  {/* 1. config.h code block */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text-primary)" }}>1. ไฟล์การตั้งค่าความลับ (config.h)</span>
                    <p style={{ color: "var(--text-secondary)", fontSize: 11.5, margin: "2px 0 6px 0", lineHeight: 1.4 }}>
                      โปรดสร้างไฟล์ชื่อ <code>config.h</code> ไว้ในโฟลเดอร์เดียวกับโปรเจกต์ Arduino ของท่าน แล้วคัดลอกโค้ดด้านล่างนี้ไปใส่ เพื่อแยกความลับและคีย์ความปลอดภัยออกจากไฟล์โปรแกรมหลัก (อย่าลืมแก้ไข API Key ให้เป็นคีย์ที่ปลอดภัยและไม่ซ้ำกันในแต่ละบอร์ด)
                    </p>

                    {/* ⚠️ API Key placeholder warning */}
                    <div style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 10,
                      padding: "10px 14px",
                      background: "rgba(245,158,11,0.08)",
                      border: "1px solid rgba(245,158,11,0.4)",
                      borderRadius: 8,
                      marginBottom: 6
                    }}>
                      <span style={{ fontSize: 15, lineHeight: 1, marginTop: 1 }}>⚠️</span>
                      <span style={{ fontSize: 11.5, color: "#F59E0B", lineHeight: 1.5, fontWeight: 600 }}>
                        API Key เป็น placeholder — กรุณาขอ key จริงจาก administrator
                        <span style={{ display: "block", fontWeight: 400, color: "var(--text-secondary)", marginTop: 2 }}>
                          แก้ไขบรรทัด <code style={{ background: "rgba(255,255,255,0.06)", padding: "1px 5px", borderRadius: 4 }}>api_key</code> ใน config.h ด้วยค่า <code style={{ background: "rgba(255,255,255,0.06)", padding: "1px 5px", borderRadius: 4 }}>ESP32_API_KEY</code> จาก Vercel Environment Variables — ห้ามนำ key จริงขึ้น version control
                        </span>
                      </span>
                    </div>

                    <div style={{ position: "relative" }}>
                      <button
                        type="button"
                        onClick={() => {
                          const codeElement = document.getElementById("arduino-config-block");
                          if (codeElement) {
                            copyToClipboard(codeElement.textContent || "");
                          }
                        }}
                        style={{
                          position: "absolute",
                          top: 12,
                          right: 12,
                          padding: "6px 12px",
                          borderRadius: 8,
                          fontSize: 11,
                          fontWeight: 800,
                          background: "rgba(255,255,255,0.08)",
                          border: "1px solid rgba(255,255,255,0.15)",
                          color: "#E2E8F0",
                          cursor: "pointer",
                          zIndex: 10
                        }}
                      >
                        📋 คัดลอก config.h
                      </button>
                      <pre
                        id="arduino-config-block"
                        style={{
                          margin: 0,
                          padding: "46px 20px 20px 20px",
                          background: "#0F172A",
                          borderRadius: 12,
                          border: "1.5px solid rgba(255,255,255,0.1)",
                          fontFamily: "Consolas, Monaco, monospace",
                          fontSize: 11.5,
                          color: "#E2E8F0",
                          overflowX: "auto",
                          whiteSpace: "pre",
                          maxHeight: 240,
                          textAlign: "left",
                          lineHeight: 1.5
                        }}
                        dangerouslySetInnerHTML={{
                          __html: highlightArduinoCode(getConfigCode(activeRoomDetails.room, originUrl, firmwareMode))
                        }}
                      />
                    </div>
                  </div>

                  {/* 2. esp32.ino code block */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text-primary)" }}>2. ไฟล์โปรแกรมหลัก (esp32.ino)</span>
                    <p style={{ color: "var(--text-secondary)", fontSize: 11.5, margin: "2px 0 6px 0", lineHeight: 1.4 }}>
                      ไฟล์โค้ดหลักเพื่อควบคุมบอร์ด การดึงสถานะ และควบคุมประตู (ซึ่งจะนำเข้าไฟล์ <code>config.h</code> ด้านบนเข้ามาทำงานร่วมกันแบบปลอดภัยและรองรับการตรวจ HTTPS TLS Certificate)
                    </p>
                    <div style={{ position: "relative" }}>
                      <button
                        type="button"
                        onClick={() => {
                          const codeElement = document.getElementById("arduino-code-block");
                          if (codeElement) {
                            copyToClipboard(codeElement.textContent || "");
                          }
                        }}
                        style={{
                          position: "absolute",
                          top: 12,
                          right: 12,
                          padding: "6px 12px",
                          borderRadius: 8,
                          fontSize: 11,
                          fontWeight: 800,
                          background: "rgba(255,255,255,0.08)",
                          border: "1px solid rgba(255,255,255,0.15)",
                          color: "#E2E8F0",
                          cursor: "pointer",
                          zIndex: 10
                        }}
                      >
                        📋 คัดลอก esp32.ino
                      </button>
                      <pre
                        id="arduino-code-block"
                        style={{
                          margin: 0,
                          padding: "46px 20px 20px 20px",
                          background: "#0F172A",
                          borderRadius: 12,
                          border: "1.5px solid rgba(255,255,255,0.1)",
                          fontFamily: "Consolas, Monaco, monospace",
                          fontSize: 11.5,
                          color: "#E2E8F0",
                          overflowX: "auto",
                          whiteSpace: "pre",
                          maxHeight: 340,
                          textAlign: "left",
                          lineHeight: 1.5
                        }}
                        dangerouslySetInnerHTML={{
                          __html: highlightArduinoCode(getArduinoCode(activeRoomDetails.room, originUrl, firmwareMode))
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ── Secure Log Deletion Password Confirmation Modal ── */}
      {deleteModalOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(30, 27, 75, 0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 16 }}>
          <div className="premium-card animate-scale-in" style={{ width: "100%", maxWidth: 440, padding: 28, background: "var(--bg-secondary)", border: "1px solid rgba(220, 38, 38, 0.2)", boxShadow: "0 25px 50px -12px rgba(220, 38, 38, 0.25)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#FEF2F2", border: "2px solid #FCA5A5", display: "flex", alignItems: "center", justifyContent: "center", color: "#DC2626" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div>
                <h3 style={{ fontSize: 17, fontWeight: 800, color: "var(--text-primary)" }}>ยืนยันสิทธิ์แอดมินสูงสุด</h3>
                <p style={{ fontSize: 11.5, color: "#DC2626", fontWeight: 700, marginTop: 2 }}>⚠️ คำเตือน: ข้อมูลจะถูกลบถาวร ไม่สามารถกู้คืนได้</p>
              </div>
            </div>

            <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 18, lineHeight: 1.5 }}>
              การสั่งลบข้อมูล Log ที่ยังไม่ครบอายุความ 90 วัน อาจมีความผิดตาม พ.ร.บ. คอมพิวเตอร์ หากไม่มีเหตุจำเป็นอย่างยิ่งยวด กรุณากรอกรหัสผ่านบัญชีแอดมินสูงสุดของคุณเพื่อตรวจสอบความถูกต้องและอนุมัติการดำเนินงาน
            </p>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                รหัสผ่านของผู้ดูแลระบบ (Owner Password) *
              </label>
              <input
                type="password"
                className="smartaccess-input"
                placeholder="กรอกรหัสผ่านเข้าสู่ระบบของคุณ..."
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                style={{ border: "1px solid #FCA5A5" }}
                disabled={deleteLoading}
              />
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button
                className="btn-secondary"
                style={{ flex: 1, padding: "10px" }}
                onClick={() => { setDeleteModalOpen(false); setConfirmPassword(""); }}
                disabled={deleteLoading}
              >
                ยกเลิก
              </button>
              <button
                className="btn-danger"
                style={{ flex: 1, padding: "10px" }}
                disabled={deleteLoading}
                onClick={async () => {
                  if (!confirmPassword) {
                    showToast("กรุณากรอกรหัสผ่านเพื่ออนุมัติ", "error");
                    return;
                  }
                  setDeleteLoading(true);
                  try {
                    const r = await fetch("/api/system/logs/cleanup", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ type: "all", password: confirmPassword })
                    });
                    const d = await r.json();
                    if (r.ok) {
                      showToast(d.message, "success");
                      setDeleteModalOpen(false);
                      setConfirmPassword("");
                      fetchSystemStatus();
                      fetchAll();
                      fetchLogs();
                    } else {
                      showToast(d.error, "error");
                    }
                  } catch {
                    showToast("เกิดข้อผิดพลาดภายในระบบ", "error");
                  } finally {
                    setDeleteLoading(false);
                  }
                }}
              >
                {deleteLoading ? "กำลังยืนยัน..." : "อนุมัติลบถาวร"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Responsive Dashboard Shell */}
      <div style={{ display: "flex", minHeight: "100vh", flexDirection: "row", maxWidth: "100vw", overflowX: "hidden" }}>

        {/* Sidebar Navigation */}
        <aside className={`sidebar-responsive ${mobileMenuOpen ? 'open' : ''}`}>
          <div style={{ padding: "24px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{ width: 40, height: 40, borderRadius: "12px", background: "linear-gradient(135deg, var(--smartaccess-purple) 0%, var(--edu-pink) 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: "0 4px 10px rgba(124,58,237,0.2)" }}
            >
              <LockIcon />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "var(--smartaccess-purple-dark)", letterSpacing: "0.5px" }}>SmartAccess</div>
              <div style={{ fontSize: 10.5, color: "var(--text-secondary)", fontWeight: 600 }}>บอร์ดควบคุมครุศาสตร์</div>
            </div>
            <button
              className="desktop-hide-trigger"
              onClick={() => setMobileMenuOpen(false)}
              style={{ marginLeft: "auto", background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "var(--text-secondary)" }}
            >
              <CrossIcon />
            </button>
          </div>

          <div style={{ padding: "16px 20px" }}>
            <div style={{ padding: "12px 14px", background: "var(--smartaccess-purple-pale)", border: "1px solid var(--border)", borderRadius: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.full_name}
              </div>
              <div style={{ fontSize: 10.5, color: isOwner ? "var(--edu-pink)" : "var(--smartaccess-purple)", fontWeight: 700, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                <span>{isOwner ? <CrownIcon /> : <KeyIcon />}</span>
                <span>{isOwner ? "Owner (เจ้าของห้อง)" : "Door Operator"}</span>
              </div>
            </div>
          </div>

          <nav style={{ flex: 1, padding: "0 12px" }}>
            {[
              ...((isOwner || user.role === "log_viewer") ? [
                { id: "pending", icon: <ClockIcon />, label: "รายการรออนุมัติ", badge: pendingCount },
              ] : []),
              {
                id: "rooms",
                icon: <TVIcon />,
                label: "ห้องเรียน & ESP32",
                badge: roomsList.length,
                badgeColor: "#7C3AED"
              },
              ...((isOwner || user.role === "log_viewer") ? [
                { id: "all", icon: <UsersIcon />, label: "ทำเนียบ & ประวัติเข้าออก", badge: 0 },
              ] : []),
              ...(isOwner ? [
                { id: "admins", icon: <KeyIcon />, label: "ผู้ดูแลระบบ", badge: 0 },
                { id: "settings", icon: <SettingsIcon />, label: "ตั้งค่าระบบ & Webhook", badge: 0 },
              ] : []),
              { id: "guide", icon: <FileTextIcon />, label: "คู่มือการใช้งานระบบ", badge: 0 },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setTab(item.id as typeof tab);
                  setMobileMenuOpen(false);
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "none",
                  background: tab === item.id ? "var(--smartaccess-purple-pale)" : "transparent",
                  color: tab === item.id ? "var(--smartaccess-purple)" : "var(--text-secondary)",
                  fontSize: 13.5,
                  fontWeight: tab === item.id ? 700 : 500,
                  cursor: "pointer",
                  marginBottom: 4,
                  textAlign: "left"
                }}
              >
                <span>{item.icon}</span>
                <span style={{ flex: 1, marginLeft: 8 }}>{item.label}</span>
                {item.badge > 0 && (
                  <span style={{ background: item.badgeColor || "var(--edu-pink)", color: "#fff", borderRadius: "99px", padding: "1px 8px", fontSize: 10.5, fontWeight: 800 }}>
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <div style={{ padding: "16px", borderTop: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 10 }}>
            <a
              href="/esp32-preview"
              target="_blank"
              className="btn-secondary"
              style={{ padding: "10px", borderRadius: 12, fontSize: 12.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            >
              <TVIcon />
              <span>จอจำลอง ESP32 LCD</span>
            </a>
            <button
              onClick={handleLogout}
              className="btn-ghost"
              style={{ width: "100%", borderRadius: 12, fontSize: 12.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
            >
              <LogoutIcon />
              <span>ลงชื่อออกจากระบบ</span>
            </button>
          </div>
        </aside>

        {mobileMenuOpen && (
          <div
            style={{ position: "fixed", inset: 0, background: "rgba(30, 27, 75, 0.2)", backdropFilter: "blur(2px)", zIndex: 9990 }}
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        {/* Main Content Area */}
        <main className="main-content-responsive" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Header Mobile and Topbar */}
          <header style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button
                className="desktop-hide-trigger btn-secondary"
                onClick={() => setMobileMenuOpen(true)}
                style={{ padding: "8px 12px", borderRadius: 8, fontSize: 13, position: "relative", zIndex: 9950 }}
              >
                <MenuIcon /> เปิดเมนู
              </button>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.5px" }}>
                  {tab === "pending" && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: "#F59E0B", display: "inline-flex" }}>
                        <ClockIcon />
                      </span>
                      <span>ตรวจสอบสิทธิ์รออนุมัติ</span>
                    </span>
                  )}
                  {tab === "iot" && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: "var(--smartaccess-purple)", display: "inline-flex" }}>
                        <TVIcon />
                      </span>
                      <span>สถานะบอร์ด IoT ทั้งหมด (Multi-Room)</span>
                    </span>
                  )}
                  {tab === "all" && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <UsersIcon />
                      <span>ทำเนียบ & ประวัติเข้าออกห้อง</span>
                    </span>
                  )}
                  {tab === "admins" && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <KeyIcon />
                      <span>จัดการสิทธิ์ผู้ดูแลระบบ</span>
                    </span>
                  )}
                  {tab === "settings" && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <SettingsIcon />
                      <span>ตั้งค่าระบบ & Webhook</span>
                    </span>
                  )}
                  {tab === "guide" && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <FileTextIcon />
                      <span>คู่มือการใช้งานระบบ & IoT</span>
                    </span>
                  )}
                </h2>
                <div style={{ fontSize: 11.5, color: "var(--text-secondary)", fontWeight: 500, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                  <ClockIcon />
                  <span>{currentTime}</span>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ textAlign: "center", padding: "8px 16px", background: "var(--edu-pink-pale)", borderRadius: 12, border: "1px solid rgba(219,39,119,0.15)" }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: "var(--edu-pink)" }}>{pendingCount}</div>
                <div style={{ fontSize: 10, color: "var(--text-secondary)", fontWeight: 700 }}>รออนุมัติสะสม</div>
              </div>
            </div>
          </header>

          {/* Inner Content Area */}
          <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>

            {/* ── Premium Metric Summary Cards Grid ── */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 20 }} className="animate-fade-in">
              {/* Card 1: Pending Queue */}
              <div className="premium-card hover-card" style={{ padding: 20, background: "var(--bg-secondary)", display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(245, 158, 11, 0.1)", border: "1.5px solid rgba(245, 158, 11, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#F59E0B" }}>
                  <ClockIcon className="w-6 h-6" />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 700 }}>คิวรอตรวจสอบ</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: pending.length > 0 ? "#F59E0B" : "var(--text-primary)", display: "flex", alignItems: "baseline", gap: 6, marginTop: 2 }}>
                    <span>{pending.length}</span>
                    <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 600 }}>คน</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Online Boards */}
              <div className="premium-card hover-card" style={{ padding: 20, background: "var(--bg-secondary)", display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(16, 185, 129, 0.1)", border: "1.5px solid rgba(16, 185, 129, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#10B981" }}>
                  <TVIcon />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 700 }}>ห้องออนไลน์ (IoT)</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: "var(--text-primary)", display: "flex", alignItems: "baseline", gap: 6, marginTop: 2 }}>
                    <span>{stats.onlineBoards}</span>
                    <span style={{ fontSize: 14, color: "var(--text-secondary)", fontWeight: 600 }}>/ {stats.totalBoards} บอร์ด</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Accesses Today */}
              <div className="premium-card hover-card" style={{ padding: 20, background: "var(--bg-secondary)", display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(59, 130, 246, 0.1)", border: "1.5px solid rgba(59, 130, 246, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#3B82F6" }}>
                  <UnlockIcon />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 700 }}>ปลดล็อกสำเร็จวันนี้</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: "var(--text-primary)", display: "flex", alignItems: "baseline", gap: 6, marginTop: 2 }}>
                    <span>{stats.doorOpensToday}</span>
                    <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 600 }}>ครั้ง</span>
                  </div>
                </div>
              </div>

              {/* Card 4: Bypass Today */}
              <div className="premium-card hover-card" style={{ padding: 20, background: "var(--bg-secondary)", display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(219, 39, 119, 0.1)", border: "1.5px solid rgba(219, 39, 119, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--edu-pink)" }}>
                  <KeyIcon className="w-5 h-5" />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 700 }}>ผ่านทางลัด (Bypass) วันนี้</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: "var(--text-primary)", display: "flex", alignItems: "baseline", gap: 6, marginTop: 2 }}>
                    <span>{stats.bypassToday}</span>
                    <span style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 600 }}>ครั้ง</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Sleek System Health Bar ── */}
            {systemStatus && (
              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", padding: "12px 18px", background: "rgba(124, 58, 237, 0.03)", borderRadius: 14, border: "1px solid var(--border)", marginBottom: 24, alignItems: "center" }} className="animate-fade-in">
                <span style={{ fontSize: 11.5, fontWeight: 800, color: "var(--smartaccess-purple)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  🏥 สเตตัสระบบกลาง:
                </span>

                {/* Database status */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-secondary)", fontWeight: 600 }}>
                  <span className="badge badge-approved" style={{ display: "inline-flex", padding: "2px 8px", fontSize: 10, background: systemStatus.postgresql.online ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.08)", color: systemStatus.postgresql.online ? "#10B981" : "#EF4444", borderColor: systemStatus.postgresql.online ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.2)" }}>
                    <span className={systemStatus.postgresql.online ? 'animate-pulse-ring' : ''} style={{ width: 6, height: 6, borderRadius: "50%", background: systemStatus.postgresql.online ? "#10B981" : "#EF4444", display: "inline-block", marginRight: 4 }} />
                    ฐานข้อมูล Supabase: {systemStatus.postgresql.online ? "ONLINE" : "OFFLINE"}
                  </span>
                </div>

                {/* Discord webhook status */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-secondary)", fontWeight: 600 }}>
                  <span className="badge" style={{ display: "inline-flex", padding: "2px 8px", fontSize: 10, background: systemStatus.discord.configured ? "rgba(59, 130, 246, 0.08)" : "rgba(245, 158, 11, 0.08)", color: systemStatus.discord.configured ? "#3B82F6" : "#F59E0B", borderColor: systemStatus.discord.configured ? "rgba(59, 130, 246, 0.2)" : "rgba(245, 158, 11, 0.2)" }}>
                    แจ้งเตือน Discord: {systemStatus.discord.configured ? "เชื่อมต่อแล้ว" : "ไม่ได้กำหนดค่า"}
                  </span>
                </div>

                {/* Active user status */}
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6, fontSize: 11.5, color: "var(--text-secondary)", fontWeight: 600 }}>
                  <span>ผู้ล็อกอินปัจจุบัน:</span>
                  <strong style={{ color: "var(--text-primary)" }}>{user?.full_name}</strong>
                  <span style={{ fontSize: 9.5, padding: "2px 6px", background: "var(--smartaccess-purple-pale)", border: "1px solid var(--border)", borderRadius: 6, color: "var(--smartaccess-purple)", fontWeight: 800 }}>
                    {user?.role === "owner" ? "Owner (สูงสุด)" : "Door Operator"}
                  </span>
                </div>
              </div>
            )}

            {/* ── Pending Tab ── */}
            {tab === "pending" && (
              <div className="animate-fade-in">
                {/* Dynamic Classroom Selector Tabs & Sound Control */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 16 }}>
                  {/* Classroom Selector */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", background: "rgba(124, 58, 237, 0.04)", padding: 6, borderRadius: 14, border: "1px solid rgba(124, 58, 237, 0.08)" }}>
                    <button
                      onClick={() => setPendingRoomFilter("all")}
                      style={{
                        padding: "8px 16px",
                        borderRadius: 10,
                        border: "none",
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: "pointer",
                        background: pendingRoomFilter === "all" ? "linear-gradient(135deg, var(--smartaccess-purple) 0%, var(--edu-pink) 100%)" : "transparent",
                        color: pendingRoomFilter === "all" ? "#ffffff" : "var(--text-secondary)",
                        boxShadow: pendingRoomFilter === "all" ? "0 4px 12px rgba(124, 58, 237, 0.2)" : "none",
                        transition: "all 0.2s ease"
                      }}
                    >
                      🚪 ทุกห้องเรียน ({pending.length})
                    </button>
                    {roomsList.map(r => {
                      const count = pending.filter(s => s.requested_room === r.room).length;
                      return (
                        <button
                          key={r.room}
                          onClick={() => setPendingRoomFilter(r.room)}
                          style={{
                            padding: "8px 16px",
                            borderRadius: 10,
                            border: "none",
                            fontSize: 13,
                            fontWeight: 700,
                            cursor: "pointer",
                            background: pendingRoomFilter === r.room ? "linear-gradient(135deg, var(--smartaccess-purple) 0%, var(--edu-pink) 100%)" : "transparent",
                            color: pendingRoomFilter === r.room ? "#ffffff" : "var(--text-secondary)",
                            boxShadow: pendingRoomFilter === r.room ? "0 4px 12px rgba(124, 58, 237, 0.2)" : "none",
                            transition: "all 0.2s ease"
                          }}
                        >
                          ห้อง {r.room} ({count})
                        </button>
                      );
                    })}
                  </div>

                  {/* Audio Controls */}
                  <button
                    onClick={() => {
                      setAudioEnabled(!audioEnabled);
                      if (!audioEnabled) {
                        playSoftChime(); // Play test sound on enable so user knows it works!
                      }
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 16px",
                      borderRadius: 12,
                      border: "1px solid " + (audioEnabled ? "rgba(16, 185, 129, 0.2)" : "var(--border)"),
                      background: audioEnabled ? "rgba(16, 185, 129, 0.05)" : "var(--bg-secondary)",
                      color: audioEnabled ? "#10B981" : "var(--text-secondary)",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                      boxShadow: "var(--shadow-sm)"
                    }}
                  >
                    <span>{audioEnabled ? "🔊 เสียงเตือนคิว: เปิด" : "🔇 เสียงเตือนคิว: ปิด"}</span>
                  </button>
                </div>

                {filteredPending.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "80px 40px", background: "var(--bg-secondary)", borderRadius: 20, border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--smartaccess-purple-pale)", border: "2px solid var(--smartaccess-purple-light)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, color: "var(--smartaccess-purple)" }}>
                      <SuccessBadgeIcon />
                    </div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)" }}>
                      {pending.length === 0 ? "ตรวจสอบรายการรออนุมัติเสร็จสิ้น" : "ไม่มีคิวค้างสำหรับห้องเรียนนี้"}
                    </h3>
                    <p style={{ color: "var(--text-secondary)", fontSize: 13.5, marginTop: 6 }}>
                      {pending.length === 0
                        ? "ไม่มีคำขอเปิดประตูค้างอยู่ ระบบจะคอยอัปเดตข้อมูลผู้ยื่นคำขอใหม่ทุกๆ 10 วินาที"
                        : "ไม่มีคำขอรออนุมัติสำหรับรหัสห้องที่ท่านเลือกกรองอยู่ในขณะนี้"}
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 16 }}>
                    {/* Bulk Actions Panel (2026-05) */}
                    <div
                      className="premium-card animate-fade-in"
                      style={{
                        padding: "14px 20px",
                        background: "rgba(124, 58, 237, 0.03)",
                        border: "1.5px dashed var(--smartaccess-purple-light)",
                        borderRadius: 14,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: 16,
                        boxShadow: "var(--shadow-sm)"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13.5, fontWeight: 700, color: "var(--text-primary)", cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            style={{ width: 16, height: 16, cursor: "pointer", accentColor: "var(--smartaccess-purple)" }}
                            checked={selectedPendingIds.length === filteredPending.length && filteredPending.length > 0}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedPendingIds(filteredPending.map(s => s.id));
                              } else {
                                setSelectedPendingIds([]);
                              }
                            }}
                          />
                          <span>เลือกทั้งหมด ({selectedPendingIds.length} / {filteredPending.length} คำขอ)</span>
                        </label>
                      </div>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <button
                          onClick={handleBulkApprove}
                          disabled={selectedPendingIds.length === 0 || bulkLoading}
                          className="btn-primary"
                          style={{
                            padding: "8px 16px",
                            borderRadius: 8,
                            fontSize: 12.5,
                            fontWeight: 700,
                            opacity: selectedPendingIds.length === 0 ? 0.6 : 1,
                            cursor: selectedPendingIds.length === 0 ? "not-allowed" : "pointer"
                          }}
                        >
                          ⚡ อนุมัติกลุ่ม ({selectedPendingIds.length})
                        </button>
                        <button
                          onClick={handleBulkReject}
                          disabled={selectedPendingIds.length === 0 || bulkLoading}
                          className="btn-danger"
                          style={{
                            padding: "8px 16px",
                            borderRadius: 8,
                            fontSize: 12.5,
                            fontWeight: 700,
                            opacity: selectedPendingIds.length === 0 ? 0.6 : 1,
                            cursor: selectedPendingIds.length === 0 ? "not-allowed" : "pointer"
                          }}
                        >
                          ✕ ปฏิเสธกลุ่ม ({selectedPendingIds.length})
                        </button>
                      </div>
                    </div>

                    {filteredPending.map(s => (
                      <div key={s.id} className="premium-card hover-card" style={{ padding: 22 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
                          <div style={{ flex: 1, minWidth: 260 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                              <input
                                type="checkbox"
                                style={{ width: 18, height: 18, cursor: "pointer", accentColor: "var(--smartaccess-purple)", marginRight: 6 }}
                                checked={selectedPendingIds.includes(s.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedPendingIds(prev => [...prev, s.id]);
                                  } else {
                                    setSelectedPendingIds(prev => prev.filter(id => id !== s.id));
                                  }
                                }}
                              />
                              <div style={{ width: 44, height: 44, borderRadius: "12px", background: "var(--smartaccess-purple-pale)", border: "1.5px solid var(--smartaccess-purple-light)", color: "var(--smartaccess-purple)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16 }}>
                                {s.first_name[0]}
                              </div>
                              <div>
                                <h4 style={{ fontWeight: 800, fontSize: 15.5, color: "var(--text-primary)" }}>
                                  {s.title}{s.first_name} {s.last_name}
                                </h4>
                                <div style={{ fontSize: 12.5, color: "var(--smartaccess-purple)", fontWeight: 700, fontFamily: "monospace", display: "flex", alignItems: "center" }}>
                                  <IdCardIcon />
                                  <span style={{ marginLeft: 4 }}>{s.student_id}</span>
                                </div>
                              </div>
                            </div>

                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                              {s.requested_room && s.requested_room !== "default" && (
                                <span style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(219,39,119,0.12) 100%)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 8, padding: "4px 10px", fontSize: 11.5, color: "var(--smartaccess-purple-dark)", fontWeight: 800, display: "flex", alignItems: "center" }}>
                                  🚪 คำขอเข้าห้อง: {s.requested_room}
                                </span>
                              )}
                              <span style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", borderRadius: 8, padding: "4px 10px", fontSize: 11.5, color: "var(--text-secondary)", fontWeight: 600, display: "flex", alignItems: "center" }}>
                                <GraduationIcon />
                                <span style={{ marginLeft: 4 }}>ชั้นปีที่ {s.year}</span>
                              </span>
                              <span style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", borderRadius: 8, padding: "4px 10px", fontSize: 11.5, color: "var(--text-secondary)", fontWeight: 600, display: "flex", alignItems: "center" }}>
                                <FacultyIcon />
                                <span style={{ marginLeft: 4 }}>{s.faculty}</span>
                              </span>
                              <span style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", borderRadius: 8, padding: "4px 10px", fontSize: 11.5, color: "var(--text-secondary)", fontWeight: 600, display: "flex", alignItems: "center" }}>
                                <BranchIcon />
                                <span style={{ marginLeft: 4 }}>{s.branch}</span>
                              </span>
                              <PendingCountdown registeredAt={s.registered_at} />
                            </div>

                            <div style={{ fontSize: 11.5, color: "var(--text-secondary)", fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
                              <ClockIcon />
                              <span>ยื่นสมัครเมื่อ: {formatDateTime(s.registered_at)}</span>
                            </div>
                          </div>

                          {/* Mobile swipe hint (shows only on touch devices first time) */}
                          <div className="mobile-swipe-hint" style={{ fontSize: 10.5, color: "var(--text-secondary)", marginBottom: 6, display: "flex", alignItems: "center", gap: 4, opacity: 0.6 }}>
                            <span style={{ display: "none" }} className="swipe-hint-text">← ปัดซ้าย=ปฏิเสธ | ปัดขวา=อนุมัติ →</span>
                          </div>

                          <div
                            style={{
                              display: "flex", gap: 10, flexWrap: "wrap",
                              transform: `translateX(${swipeOffset[s.id] || 0}px)`,
                              transition: (swipeOffset[s.id] || 0) === 0 ? "transform 0.3s cubic-bezier(0.4,0,0.2,1)" : "none",
                              position: "relative",
                            }}
                            onTouchStart={(e) => handleTouchStart(s.id, e)}
                            onTouchMove={(e) => handleTouchMove(s.id, e)}
                            onTouchEnd={() => handleTouchEnd(s.id, `${s.first_name} ${s.last_name}`)}
                          >
                            {/* Swipe action indicator */}
                            {swipeAction[s.id] && (
                              <div style={{
                                position: "absolute", inset: 0, borderRadius: 10,
                                background: swipeAction[s.id] === "approve" ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)",
                                border: `2px solid ${swipeAction[s.id] === "approve" ? "#10B981" : "#EF4444"}`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: 20, fontWeight: 900, zIndex: 1,
                                color: swipeAction[s.id] === "approve" ? "#10B981" : "#EF4444",
                              }}>
                                {swipeAction[s.id] === "approve" ? "✓ อนุมัติ" : "✗ ปฏิเสธ"}
                              </div>
                            )}
                            <button
                              className="btn-primary"
                              style={{ padding: "10px 18px", borderRadius: 10, fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}
                              onClick={() => handleApprove(s.id)}
                              disabled={loadingId === s.id}
                            >
                              <UnlockIcon />
                              <span>อนุมัติ + สั่งเปิดประตู</span>
                            </button>
                            <button
                              className="btn-danger"
                              style={{ padding: "10px 18px", borderRadius: 10, fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}
                              onClick={() => setRejectModal({ id: s.id, name: `${s.first_name} ${s.last_name}` })}
                              disabled={loadingId === s.id}
                            >
                              <CrossIcon />
                              <span>ปฏิเสธคำขอ</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Dynamic IoT All Classroom Boards Status Tab ── */}
            {tab === "iot" && (
              <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                {/* 1. Header Control Panel Card */}
                <div className="premium-card" style={{ padding: 26 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
                    <div style={{ flex: 1, minWidth: 260, textAlign: "left" }}>
                      <h3 style={{ fontSize: 17, fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
                        🔌 แผงควบคุมเครือข่ายฮาร์ดแวร์ IoT & ห้องปฏิบัติการทั้งหมด (Classroom Gateway Hub)
                      </h3>
                      <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 6, marginBottom: 0, lineHeight: 1.4 }}>
                        แสดงสถานะการเชื่อมต่อเครือข่ายบอร์ดไมโครคอนโทรลเลอร์ ESP32 ของห้องปฏิบัติการทั้งหมด {roomsList.length} ห้องแบบ Real-time คุณสามารถสั่งทดสอบสถานะการ Long-polling หรือสั่งปลดล็อกระยะไกลด่วนได้จากที่นี่
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        fetchSystemStatus();
                        showToast("📡 รีเฟรชสถานะเครือข่ายบอร์ดสำเร็จ", "success");
                      }}
                      className="btn-primary"
                      style={{ padding: "10px 20px", borderRadius: 12, fontSize: 13, fontWeight: 700 }}
                    >
                      🔄 รีเฟรชสถานะบอร์ด
                    </button>
                  </div>

                  {/* Summary counter badges */}
                  <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
                    <span style={{ background: "rgba(16,185,129,0.08)", border: "1.5px solid rgba(16,185,129,0.2)", borderRadius: 10, padding: "6px 14px", fontSize: 12, color: "#059669", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 6 }}>
                      <span className="animate-pulse-ring" style={{ width: 6, height: 6, borderRadius: "50%", background: "#059669" }} />
                      ออนไลน์ทั้งหมด: {systemStatus?.esp32Devices?.filter(d => d.online).length || 0} บอร์ด
                    </span>
                    <span style={{ background: "rgba(220,38,38,0.08)", border: "1.5px solid rgba(220,38,38,0.2)", borderRadius: 10, padding: "6px 14px", fontSize: 12, color: "#DC2626", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 6 }}>
                      ออฟไลน์: {roomsList.length - (systemStatus?.esp32Devices?.filter(d => d.online).length || 0)} บอร์ด
                    </span>
                    <span style={{ background: "var(--smartaccess-purple-pale)", border: "1.5px solid var(--border-medium)", borderRadius: 10, padding: "6px 14px", fontSize: 12, color: "var(--smartaccess-purple-dark)", fontWeight: 700 }}>
                      รวมห้องปฏิบัติการทั้งหมด: {roomsList.length} ห้อง
                    </span>
                  </div>
                </div>

                {/* 2. Responsive Card Grid list */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
                  {roomsList.length === 0 ? (
                    <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "80px 40px", background: "var(--bg-secondary)", borderRadius: 20, border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
                      <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>ไม่พบรายการห้องปฏิบัติการ</h3>
                      <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 6 }}>
                        กรุณาไปที่แท็บ &quot;ตั้งค่าระบบ & Webhook&quot; เพื่อเพิ่มห้องควบคุมในระบบ
                      </p>
                    </div>
                  ) : (
                    roomsList.map((roomItem) => {
                      // Find live status from systemStatus API response
                      const liveDev = systemStatus?.esp32Devices?.find(d => d.room === roomItem.room);
                      const isOnlineDirect = liveDev ? liveDev.online : false;
                      const doorOpen = liveDev ? liveDev.doorStatus === "open" : false;
                      const isMock = liveDev ? liveDev.mock : false;
                      const activeIp = liveDev ? liveDev.ip : roomItem.ip;
                      const isRecentlyUnlocked = recentlyUnlockedRooms[roomItem.room] === true;

                      // ─── Active IoT Telemetry Heartbeat Diagnostics (2026-05) ───
                      const lastSeenStr = rawSettings[`room_last_seen_${roomItem.room}`];
                      let connectionStatus: "online" | "degraded" | "offline" = "offline";
                      let lastSeenLabel = "ไม่พบการเชื่อมต่อ";

                      if (lastSeenStr) {
                        const lastSeenTime = new Date(lastSeenStr).getTime();
                        const diffSeconds = (Date.now() - lastSeenTime) / 1000;
                        if (diffSeconds <= 12) {
                          connectionStatus = "online";
                        } else if (diffSeconds <= 120) {
                          connectionStatus = "degraded";
                        } else {
                          connectionStatus = "offline";
                        }

                        if (diffSeconds < 60) {
                          lastSeenLabel = `Fresh: ${Math.ceil(diffSeconds)} วินาทีก่อน`;
                        } else {
                          lastSeenLabel = `${Math.floor(diffSeconds / 60)} นาทีที่แล้ว`;
                        }
                      } else if (isOnlineDirect) {
                        connectionStatus = "online";
                        lastSeenLabel = "ออนไลน์";
                      }

                      const isOnline = connectionStatus === "online" || connectionStatus === "degraded";

                      return (
                        <div
                          key={roomItem.room}
                          className="premium-card hover-card animate-scale-in"
                          style={{
                            padding: 24,
                            display: "flex",
                            flexDirection: "column",
                            gap: 16,
                            background: isRecentlyUnlocked
                              ? "rgba(16, 185, 129, 0.03)"
                              : "var(--bg-secondary)",
                            border: isRecentlyUnlocked
                              ? "2px solid #10B981"
                              : connectionStatus === "online"
                                ? "1.5px solid rgba(16, 185, 129, 0.25)"
                                : connectionStatus === "degraded"
                                  ? "1.5px solid rgba(245, 158, 11, 0.25)"
                                  : "1px solid var(--border)",
                            boxShadow: isRecentlyUnlocked
                              ? "0 8px 30px rgba(16, 185, 129, 0.15)"
                              : isOnline
                                ? "0 8px 24px rgba(16, 185, 129, 0.04)"
                                : "var(--shadow-sm)",
                            transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                            position: "relative",
                            overflow: "hidden"
                          }}
                        >
                          {/* Recently unlocked animated pulse background glow */}
                          {isRecentlyUnlocked && (
                            <div className="animate-ping" style={{ position: "absolute", inset: 0, background: "rgba(16, 185, 129, 0.02)", pointerEvents: "none" }} />
                          )}

                          {/* Card Top row info */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                            <div style={{ textAlign: "left" }}>
                              <h4 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
                                🚪 ห้องปฏิบัติการ: {roomItem.room}
                                {isMock && (
                                  <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 4, background: "#FFFBEB", color: "#D97706", border: "1px solid rgba(217,119,6,0.2)", fontWeight: 800 }}>MOCK</span>
                                )}
                              </h4>

                              <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4, fontFamily: "monospace" }}>
                                ที่อยู่: {activeIp}
                              </div>
                            </div>

                            {/* Active Diagnostics Telemetry badge */}
                            <span
                              className={`badge`}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                padding: "4px 8px",
                                borderRadius: 6,
                                fontSize: 11,
                                fontWeight: 800,
                                background: connectionStatus === "online"
                                  ? "rgba(16, 185, 129, 0.08)"
                                  : connectionStatus === "degraded"
                                    ? "rgba(245, 158, 11, 0.08)"
                                    : "rgba(220, 68, 68, 0.08)",
                                color: connectionStatus === "online"
                                  ? "#059669"
                                  : connectionStatus === "degraded"
                                    ? "#D97706"
                                    : "#DC2626",
                                border: connectionStatus === "online"
                                  ? "1px solid rgba(16, 185, 129, 0.2)"
                                  : connectionStatus === "degraded"
                                    ? "1px solid rgba(245, 158, 11, 0.2)"
                                    : "1px solid rgba(220, 68, 68, 0.2)"
                              }}
                              title={`สัญญาณบอร์ดล่าสุด: ${lastSeenLabel}`}
                            >
                              <span
                                className={connectionStatus === "online" ? 'animate-pulse-ring' : ''}
                                style={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: "50%",
                                  background: connectionStatus === "online"
                                    ? "#059669"
                                    : connectionStatus === "degraded"
                                      ? "#D97706"
                                      : "#DC2626",
                                  display: "inline-block"
                                }}
                              />
                              {connectionStatus === "online" ? "🟢 ONLINE" : connectionStatus === "degraded" ? "🟡 SLOW (LATENCY)" : "🔴 OFFLINE"}
                            </span>
                          </div>

                          <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: 14, background: "rgba(124, 58, 237, 0.02)", borderRadius: 12, border: "1px solid var(--border)", textAlign: "left" }}>

                            {/* Door lock state */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)" }}>กลอนประตูบอร์ด:</span>
                              <span
                                style={{
                                  fontSize: 13,
                                  fontWeight: 800,
                                  color: isRecentlyUnlocked || doorOpen ? "#10B981" : "var(--text-primary)",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 6
                                }}
                              >
                                {isRecentlyUnlocked ? (
                                  <span className="animate-bounce" style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                                    <span>🔓 UNLOCKED (เปิดด่วน)</span>
                                  </span>
                                ) : doorOpen ? (
                                  "🔓 ปลดล็อกอยู่"
                                ) : (
                                  "🔒 ปิดล็อกแน่นหนา"
                                )}
                              </span>
                            </div>

                            {/* Notifications set */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)" }}>แจ้งเตือนเฉพาะห้อง (Webhooks):</span>
                              <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--smartaccess-purple-dark)" }}>
                                {rawSettings[`room_webhook_register_${roomItem.room}`] ? "🔔 เปิดใช้งาน" : "⚪ ปิดใช้งาน"}
                              </span>
                            </div>
                          </div>

                          {/* Quick remote controls */}
                          <div style={{ display: "flex", gap: 10, marginTop: "auto", paddingTop: 10, zIndex: 10 }}>

                            <button
                              type="button"
                              onClick={() => handleTestConnection(roomItem.room)}
                              disabled={testingRoom === roomItem.room}
                              className="btn-ghost"
                              style={{ flex: 1, padding: "10px", borderRadius: 10, fontSize: 11.5, display: "flex", gap: 4, alignItems: "center", justifyContent: "center", fontWeight: 700 }}
                            >
                              {testingRoom === roomItem.room ? (
                                <span className="animate-spin" style={{ display: "inline-block", width: 12, height: 12, border: "2px solid rgba(0,0,0,0.2)", borderTopColor: "var(--smartaccess-purple)", borderRadius: "50%" }} />
                              ) : (
                                <span>📡 เทส Polling</span>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDirectUnlockRoom(roomItem.room)}
                              disabled={unlockingRoom === roomItem.room}
                              className="btn-primary"
                              style={{
                                flex: 1,
                                padding: "10px",
                                borderRadius: 10,
                                fontSize: 11.5,
                                display: "flex",
                                gap: 4,
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 700,
                                background: isRecentlyUnlocked
                                  ? "#10B981"
                                  : "linear-gradient(135deg, var(--smartaccess-purple) 0%, var(--edu-pink) 100%)",
                                border: "none",
                                boxShadow: isRecentlyUnlocked ? "0 4px 12px rgba(16, 185, 129, 0.3)" : "none",
                                transition: "all 0.3s ease"
                              }}
                            >
                              {unlockingRoom === roomItem.room ? (
                                <span className="animate-spin" style={{ display: "inline-block", width: 12, height: 12, border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "#fff", borderRadius: "50%" }} />
                              ) : isRecentlyUnlocked ? (
                                <span>✔ ปลดล็อกสำเร็จ</span>
                              ) : (
                                <span>⚡ ปลดล็อกด่วน</span>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenRoomDetails(roomItem.room, activeIp)}
                              className="btn-ghost"
                              style={{ padding: "10px", borderRadius: 10, color: "var(--smartaccess-purple)", borderColor: "var(--smartaccess-purple-light)", display: "flex", alignItems: "center", justifyContent: "center" }}
                              title="ตั้งค่า API & คัดลอกโค้ด Arduino บอร์ดห้องนี้"
                            >

                            </button>
                          </div>

                        </div>
                      );
                    })
                  )}
                </div>

              </div>
            )}

            {/* ── UNIFIED ทำเนียบ & ประวัติเข้าออก Tab ── */}
            {tab === "all" && (isOwner || user.role === "log_viewer") && (
              <div className="animate-fade-in">

                {/* Export PDF Hub */}
                <div className="dashboard-section-card export-hub">
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 10px", borderRadius: 8, background: "var(--smartaccess-purple-pale)", color: "var(--smartaccess-purple-dark)", fontSize: 11.5, fontWeight: 800, marginBottom: 10 }}>
                        <CalendarIcon /> PDF Export
                      </div>
                      <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", marginBottom: 6 }}>ส่งออกรายงานตามช่วงเวลา</h3>
                      <p style={{ color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.6, margin: 0 }}>
                        เลือกช่วงวันที่และสถานะก่อนส่งออก ระบบจะกรองทั้งตารางด้านล่างและไฟล์ PDF ให้ตรงกัน ลดความสับสนก่อนดาวน์โหลด
                      </p>
                    </div>

                    <div className="export-summary-grid">
                      {[
                        { label: "รวมในรายงาน", value: exportSummary.total, color: "var(--smartaccess-purple-dark)" },
                        { label: "อนุมัติแล้ว", value: exportSummary.approved, color: "#059669" },
                        { label: "รออนุมัติ", value: exportSummary.pending, color: "#D97706" },
                        { label: "ปฏิเสธ", value: exportSummary.rejected, color: "#DC2626" },
                      ].map(item => (
                        <div className="export-stat" key={item.label}>
                          <div style={{ fontSize: 22, fontWeight: 800, color: item.color, lineHeight: 1 }}>{item.value}</div>
                          <div style={{ fontSize: 11.5, color: "var(--text-secondary)", fontWeight: 700, marginTop: 5 }}>{item.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14, alignItems: "end" }}>
                    <div>
                      <label className="field-label">วันที่เริ่มต้น</label>
                      <input type="date" className="smartaccess-input" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </div>
                    <div>
                      <label className="field-label">วันที่สิ้นสุด</label>
                      <input type="date" className="smartaccess-input" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>
                    <div>
                      <label htmlFor="filter_status" className="field-label">สถานะในรายงาน</label>
                      <select id="filter_status" className="smartaccess-input" value={filterStatus} onChange={e => setFilter(e.target.value)}>
                        <option value="all">ทุกสถานะ</option>
                        <option value="pending">รออนุมัติ</option>
                        <option value="approved">อนุมัติแล้ว</option>
                        <option value="rejected">ปฏิเสธ</option>
                      </select>
                    </div>
                    <button
                      onClick={() => handleExportPDFWithDateRange(filterStatus, startDate, endDate)}
                      disabled={pdfLoading || exportSummary.total === 0}
                      className="btn-primary"
                      style={{ minHeight: 46, width: "100%", borderRadius: 8, fontSize: 13, gap: 8 }}
                    >
                      {pdfLoading ? (
                        <>
                          <span className="animate-spin" style={{ display: "inline-block", width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%" }} />
                          <span>กำลังสร้าง PDF...</span>
                        </>
                      ) : (
                        <>
                          <SaveIcon />
                          <span>ดาวน์โหลด PDF</span>
                        </>
                      )}
                    </button>
                    <div style={{ gridColumn: "1 / -1", fontSize: 12, color: "var(--text-secondary)", background: "var(--bg-primary)", border: "1px solid var(--border)", padding: "10px 12px", borderRadius: 8 }}>
                      ไฟล์จะใช้รูปแบบรายงานใหม่ที่มีหัวเอกสารชัดเจน ตารางอ่านง่าย และแยกสถานะด้วยสีในแต่ละแถว
                    </div>
                  </div>
                </div>

                {/* ── Unified Date-Range PDF Export Hub Card ── */}
                <div className="premium-card" style={{ display: "none", padding: 26, marginBottom: 24 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
                    <CalendarIcon /> ตั้งค่าช่วงเวลาเพื่อประมวลผล & บันทึกรายงาน PDF
                  </h3>
                  <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 20 }}>
                    คุณสามารถเลือกกำหนดวันเริ่มต้นจัดตั้งระบบจนถึงสิ้นสุดสถิติ เพื่อกรองข้อมูลการเข้าใช้งานและทำเนียบนักศึกษา พร้อมดาวน์โหลดเอกสาร PDF แนวนอน (Landscape) ที่กว้างขวาง แสดงวันเวลาประวัติระบบครบถ้วนอย่างเป็นทางการ
                  </p>

                  {/* Grid fields layout */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 20 }}>

                    {/* Date picker: Start */}
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                        เริ่มต้นวันที่ (Start Date) *
                      </label>
                      <input
                        type="date"
                        className="smartaccess-input"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        style={{ padding: "10px 14px" }}
                      />
                    </div>

                    {/* Date picker: End */}
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                        สิ้นสุดวันที่ (End Date) *
                      </label>
                      <input
                        type="date"
                        className="smartaccess-input"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        style={{ padding: "10px 14px" }}
                      />
                    </div>

                    {/* Status filter select */}
                    <div>
                      <label htmlFor="filter_status" style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                        กรองสถานะสิทธิ์คำขอ *
                      </label>
                      <select
                        id="filter_status"
                        className="smartaccess-input"
                        value={filterStatus}
                        onChange={e => setFilter(e.target.value)}
                        style={{ padding: "10px 14px" }}
                      >
                        <option value="all">แสดงสิทธิ์ทุกประเภท</option>
                        <option value="pending">เฉพาะอยู่ระหว่างรออนุมัติ</option>
                        <option value="approved">เฉพาะได้รับสิทธิ์ผ่านประตู</option>
                        <option value="rejected">เฉพาะถูกยกเลิก/ปฏิเสธสิทธิ์</option>
                      </select>
                    </div>

                    {/* Action Exporter Button */}
                    <div style={{ display: "flex", alignItems: "flex-end" }}>
                      <button
                        onClick={() => handleExportPDFWithDateRange(filterStatus, startDate, endDate)}
                        disabled={pdfLoading}
                        className="btn-primary hover-card"
                        style={{ width: "100%", padding: "11px 16px", borderRadius: 12, fontSize: 13, gap: 6, display: "flex" }}
                      >
                        {pdfLoading ? (
                          <>
                            <span className="animate-spin" style={{ display: "inline-block", width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%" }} />
                            <span>กำลังประมวลผล...</span>
                          </>
                        ) : (
                          <>
                            <SaveIcon />
                            <span>💾 บันทึกรายงาน PDF ช่วงเวลานี้</span>
                          </>
                        )}
                      </button>
                    </div>

                  </div>

                  {/* Date range helpers */}
                  <div style={{ fontSize: 11.5, color: "var(--text-secondary)", background: "var(--smartaccess-purple-pale)", border: "1px solid var(--border)", padding: "10px 16px", borderRadius: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, color: "var(--smartaccess-purple-dark)" }}>ระบบเปิดตัวเมื่อ: 23/05/2569 (เริ่มต้นนับแต่วันที่ยึดระบบ)</span>
                    <span style={{ color: "var(--text-muted)" }}>|</span>
                    <span>ตารางและสถิติด้านล่างจะกรองตามช่วงเวลาที่คุณเลือกแบบเรียลไทม์ทันที!</span>
                  </div>
                </div>

                {/* ── System Health Card ── */}
                <div className="premium-card" style={{ padding: 24, marginBottom: 24, borderLeft: "4px solid " + (healthData?.status === "healthy" ? "#10B981" : healthData?.status === "degraded" ? "#F59E0B" : healthData ? "#EF4444" : "var(--border)") }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
                    <div>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "4px 10px", borderRadius: 8, background: healthData?.status === "healthy" ? "rgba(16,185,129,0.1)" : healthData?.status === "degraded" ? "rgba(245,158,11,0.1)" : healthData ? "rgba(239,68,68,0.1)" : "var(--bg-primary)", color: healthData?.status === "healthy" ? "#059669" : healthData?.status === "degraded" ? "#D97706" : healthData ? "#DC2626" : "var(--text-secondary)", fontSize: 11.5, fontWeight: 800, marginBottom: 8 }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" /></svg>
                        {healthData ? (healthData.status === "healthy" ? "HEALTHY" : healthData.status === "degraded" ? "DEGRADED" : "UNHEALTHY") : "กำลังตรวจสอบ..."}
                      </div>
                      <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
                        System Health Monitor
                      </h3>
                      {healthData && (
                        <p style={{ color: "var(--text-secondary)", fontSize: 12, marginTop: 4 }}>
                          อัปเดตล่าสุด: {new Date(healthData.timestamp).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })} · Auto-refresh ทุก 30 วินาที
                        </p>
                      )}
                    </div>
                    <button
                      onClick={fetchHealthData}
                      style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "1px solid var(--border)", background: "var(--bg-primary)", color: "var(--text-secondary)" }}
                    >
                      ↻ รีเฟรช
                    </button>
                  </div>

                  {healthData ? (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
                      {/* DB */}
                      <div style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6, textTransform: "uppercase" }}>Database</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: healthData.components.database.status === "up" ? "#10B981" : "#EF4444", display: "inline-block" }} />
                          <span style={{ fontSize: 13, fontWeight: 800, color: healthData.components.database.status === "up" ? "#059669" : "#DC2626" }}>
                            {healthData.components.database.status === "up" ? "Online" : "Offline"}
                          </span>
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: healthData.components.database.latency_ms > 300 ? "#F59E0B" : "var(--text-primary)" }}>
                          {healthData.components.database.latency_ms} ms
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Latency</div>
                      </div>

                      {/* Rate Limiter */}
                      <div style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6, textTransform: "uppercase" }}>Rate Limiter</div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: healthData.components.rate_limiter.status === "up" ? "#10B981" : "#EF4444", display: "inline-block" }} />
                          <span style={{ fontSize: 13, fontWeight: 800, color: healthData.components.rate_limiter.status === "up" ? "#059669" : "#DC2626" }}>
                            {healthData.components.rate_limiter.status === "up" ? "Active" : "Down"}
                          </span>
                        </div>
                      </div>

                      {/* Memory */}
                      <div style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6, textTransform: "uppercase" }}>Memory</div>
                        <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)" }}>{healthData.components.memory.rss_mb} MB</div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>RSS · Heap {healthData.components.memory.heap_used_mb} MB</div>
                      </div>

                      {/* Server Time */}
                      <div style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6, textTransform: "uppercase" }}>เวลาเซิร์ฟเวอร์</div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)" }}>
                          {healthData.server_time}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>Asia/Bangkok</div>
                      </div>

                      {/* Last QR Scan */}
                      <div style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6, textTransform: "uppercase" }}>Last QR Scan</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.4 }}>
                          {healthData.last_qr_scan
                            ? new Date(healthData.last_qr_scan).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })
                            : "ยังไม่มีข้อมูล"}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text-secondary)", fontSize: 13 }}>
                      <span className="animate-spin" style={{ display: "inline-block", width: 16, height: 16, border: "2px solid rgba(124,58,237,0.2)", borderTopColor: "var(--smartaccess-purple)", borderRadius: "50%", marginRight: 8 }} />
                      กำลังโหลดข้อมูล Health...
                    </div>
                  )}
                </div>

                {/* ── Log Data Retention & Maintenance Compliance Card ── */}
                <div className="premium-card" style={{ padding: 26, marginBottom: 24, borderLeft: "4px solid var(--edu-pink)", background: "var(--bg-secondary)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 12 }}>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--edu-pink)" }}>
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                        ศูนย์รักษาความปลอดภัยและบำรุงรักษาข้อมูล (Log Compliance Hub)
                      </h3>
                      <p style={{ color: "var(--text-secondary)", fontSize: 12.5, marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                        <span>⚖️ ปฏิบัติตาม พ.ร.บ. ว่าด้วยการกระทำความผิดเกี่ยวกับคอมพิวเตอร์ มาตรา 26 (ต้องจัดเก็บประวัติไม่น้อยกว่า 90 วัน)</span>
                      </p>
                    </div>
                    {systemStatus && (
                      <div style={{ display: "flex", gap: 8 }}>
                        <div style={{ padding: "6px 12px", background: "var(--bg-primary)", border: "1px solid var(--border)", borderRadius: 8, textAlign: "center" }}>
                          <span style={{ display: "block", fontSize: 14, fontWeight: 800, color: "var(--text-primary)" }}>{systemStatus.logSummary.total}</span>
                          <span style={{ fontSize: 9, color: "var(--text-secondary)", fontWeight: 700 }}>ประวัติทั้งหมด</span>
                        </div>
                        <div style={{ padding: "6px 12px", background: "#ECFDF5", border: "1px solid rgba(5, 150, 105, 0.15)", borderRadius: 8, textAlign: "center" }}>
                          <span style={{ display: "block", fontSize: 14, fontWeight: 800, color: "#059669" }}>{systemStatus.logSummary.active}</span>
                          <span style={{ fontSize: 9, color: "#059669", fontWeight: 700 }}>อยู่ระหว่างเก็บรักษา</span>
                        </div>
                        <div style={{ padding: "6px 12px", background: systemStatus.logSummary.expired > 0 ? "#FEF2F2" : "var(--bg-primary)", border: "1px solid var(--border)", borderRadius: 8, textAlign: "center" }}>
                          <span style={{ display: "block", fontSize: 14, fontWeight: 800, color: systemStatus.logSummary.expired > 0 ? "#DC2626" : "var(--text-primary)" }}>{systemStatus.logSummary.expired}</span>
                          <span style={{ fontSize: 9, color: "var(--text-secondary)", fontWeight: 700 }}>หมดอายุ (&gt;90 วัน)</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 20 }}>
                    ระบบจัดเก็บบันทึกจราจรทางคอมพิวเตอร์เพื่อความปลอดภัยในการเข้าออกห้อง โดยจะเก็บรักษาข้อมูลอย่างถูกต้องตามกฎหมาย หากแอดมินระดับสูงสุดต้องการลบประวัติที่<strong>หมดอายุ (เกิน 90 วัน)</strong> สามารถทำได้ฟรีทันที แต่หากต้องการล้างข้อมูล<strong>ทั้งหมด (รวมข้อมูลไม่ถึง 90 วัน)</strong> ระบบความปลอดภัยจะบังคับให้ยืนยันรหัสผ่านเพื่อป้องกันภัยคุกคาม
                  </p>

                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <button
                      onClick={async () => {
                        try {
                          const r = await fetch("/api/system/logs/cleanup", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ type: "expired" })
                          });
                          const d = await r.json();
                          if (r.ok) {
                            showToast(d.message, "success");
                            fetchSystemStatus();
                            fetchAll();
                            fetchLogs();
                          } else {
                            showToast(d.error, "error");
                          }
                        } catch {
                          showToast("เกิดข้อผิดพลาดในการล้างข้อมูล", "error");
                        }
                      }}
                      className="btn-secondary"
                      style={{ padding: "10px 18px", borderRadius: 10, fontSize: 13, borderColor: "var(--smartaccess-purple-light)", color: "var(--smartaccess-purple)" }}
                    >
                      ล้างข้อมูล Log หมดอายุ (&gt; 90 วัน)
                    </button>

                    <button
                      onClick={() => {
                        setDeleteType("all");
                        setConfirmPassword("");
                        setDeleteModalOpen(true);
                      }}
                      className="btn-danger"
                      style={{ padding: "10px 18px", borderRadius: 10, fontSize: 13, display: "inline-flex", alignItems: "center", gap: 6 }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                      ล้างข้อมูลประวัติทั้งหมดในระบบ (ลบถาวร)
                    </button>
                  </div>
                </div>



                {/* ── SECTION 1: ทำเนียบรายชื่อนักศึกษา (Student Directory Table) ── */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
                    <UsersIcon /> 1. ทำเนียบและทำระเบียนรายชื่อผู้ยื่นคำขอรับสิทธิ์เข้าห้อง
                  </h3>

                  {/* Search and Filters */}
                  <div style={{ display: "flex", gap: 10, width: "100%", maxWidth: 360 }}>
                    <input
                      className="smartaccess-input"
                      placeholder="ค้นหาด้วยชื่อจริง หรือ รหัสนักศึกษา..."
                      value={searchQ}
                      onChange={e => setSearchQ(e.target.value)}
                      style={{ padding: "8px 12px" }}
                    />
                  </div>
                </div>

                <div className="premium-card" style={{ overflow: "hidden", marginBottom: 36 }}>
                  <div className="smartaccess-table-container">
                    <table className="smartaccess-table">
                      <thead>
                        <tr>
                          <th style={{ width: 40, textAlign: "center" }}>#</th>
                          <th style={{ width: 140 }}>รหัสนักศึกษา</th>
                          <th>ชื่อ - นามสกุลจริง</th>
                          <th>คณะ / ภาควิชาที่สังกัด</th>
                          <th style={{ width: 60, textAlign: "center" }}>ชั้นปี</th>
                          <th style={{ width: 100, textAlign: "center" }}>ห้องเรียน</th>
                          <th style={{ width: 90, textAlign: "center" }}>สถานะสิทธิ์</th>
                          <th>วันที่บันทึกระบบ</th>
                          <th style={{ width: 140, textAlign: "center" }}>จัดการข้อมูล</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.length === 0 ? (
                          <tr>
                            <td colSpan={9} style={{ textAlign: "center", padding: 50, color: "var(--text-secondary)" }}>
                              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, justifyContent: "center" }}>
                                <AlertIcon />
                                <span>ไม่พบระเบียนข้อมูลนักศึกษาในช่วงเวลานี้</span>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          filteredStudents.map((s, i) => (
                            <tr key={s.id}>
                              <td style={{ color: "var(--text-muted)", fontSize: 12, textAlign: "center" }}>{i + 1}</td>
                              <td>
                                <span style={{ color: "var(--smartaccess-purple-dark)", fontWeight: 800, fontSize: 13, fontFamily: "monospace" }}>
                                  {s.student_id}
                                </span>
                              </td>
                              <td>
                                <div style={{ fontWeight: 700 }}>
                                  <span style={{ color: "var(--text-muted)", fontSize: 12, marginRight: 4, fontWeight: 500 }}>
                                    {s.title}
                                  </span>
                                  {s.first_name} {s.last_name}
                                </div>
                              </td>
                              <td>
                                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{s.faculty}</div>
                                <div style={{ fontSize: 10.5, color: "var(--text-secondary)" }}>{s.branch}</div>
                              </td>
                              <td style={{ textAlign: "center", fontWeight: 600 }}>ปี {s.year}</td>
                              <td style={{ textAlign: "center" }}>
                                <span style={{
                                  fontSize: 12,
                                  fontWeight: 800,
                                  color: s.requested_room && s.requested_room !== "default" ? "var(--smartaccess-purple-dark)" : "var(--text-secondary)",
                                  background: s.requested_room && s.requested_room !== "default" ? "var(--smartaccess-purple-pale)" : "transparent",
                                  padding: s.requested_room && s.requested_room !== "default" ? "4px 10px" : "0",
                                  border: s.requested_room && s.requested_room !== "default" ? "1px solid rgba(124,58,237,0.2)" : "none",
                                  borderRadius: 8,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4
                                }}>
                                  {s.requested_room && s.requested_room !== "default" ? `🚪 ${s.requested_room}` : "default"}
                                </span>
                              </td>
                              <td style={{ textAlign: "center" }}>
                                <span className={`badge ${s.status === "approved" ? "badge-approved" : s.status === "rejected" ? "badge-rejected" : "badge-pending"}`}>
                                  <ClockIcon className="w-3 h-3" />
                                  {s.status === "approved" ? "อนุมัติแล้ว" : s.status === "rejected" ? "ปฏิเสธ" : "รออนุมัติ"}
                                </span>
                              </td>
                              <td>
                                <div style={{ fontSize: 11.5, color: "var(--text-secondary)" }}>
                                  {formatDateTime(s.registered_at)}
                                </div>
                                {s.approved_at && (
                                  <div style={{ color: "#059669", marginTop: 2, fontSize: 10.5, fontWeight: 700 }}>
                                    ✓ {formatDateTime(s.approved_at)}
                                  </div>
                                )}
                              </td>
                              <td>
                                <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                                  <button
                                    onClick={() => handleExportSingleStudentPDF(s.id, `${s.first_name} ${s.last_name}`)}
                                    title="พิมพ์บัตรรายงาน PDF"
                                    className="btn-ghost"
                                    style={{ padding: "5px 10px", borderRadius: 8, fontSize: 12, fontWeight: 600, display: "flex", gap: 4, alignItems: "center" }}
                                  >
                                    <SaveIcon />
                                    <span>การ์ด</span>
                                  </button>

                                  {s.status === "approved" && user.role !== "log_viewer" && (
                                    <button
                                      onClick={() => handleOpenDoor(s.id)}
                                      disabled={loadingId === s.id}
                                      style={{ padding: "6px 10px", background: "#ECFDF5", border: "1px solid #10B981", borderRadius: 8, color: "#059669", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", gap: 4, alignItems: "center" }}
                                    >
                                      <UnlockIcon />
                                      <span>เปิด</span>
                                    </button>
                                  )}

                                  {isOwner && (
                                    <button
                                      onClick={() => handleDelete(s.id, `${s.first_name} ${s.last_name}`)}
                                      style={{ padding: "6px 8px", background: "#FEF2F2", border: "1px solid #EF4444", borderRadius: 8, color: "#DC2626", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center" }}
                                    >
                                      <TrashIcon />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ── SECTION 2: บันทึกความปลอดภัยและการเข้าออก (Access & Activity Logs Table) ── */}

                {/* Enterprise Logs Stats Mini Summary */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 16 }}>
                  <div className="stat-card" style={{ borderLeft: "4px solid var(--smartaccess-purple)", padding: "14px 20px" }}>
                    <div style={{ fontSize: 11.5, color: "var(--text-secondary)", fontWeight: 700 }}>บันทึกประวัติในช่วงนี้</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "var(--smartaccess-purple-dark)", marginTop: 4 }}>{filteredLogs.length} รายการ</div>
                  </div>
                  <div className="stat-card" style={{ borderLeft: "4px solid #10B981", padding: "14px 20px" }}>
                    <div style={{ fontSize: 11.5, color: "var(--text-secondary)", fontWeight: 700 }}>ปลดล็อคประตูสำเร็จ</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#059669", marginTop: 4 }}>
                      {filteredLogs.filter(l => l.action === "door_opened" || l.action === "approved").length} ครั้ง
                    </div>
                  </div>
                  <div className="stat-card" style={{ borderLeft: "4px solid #EF4444", padding: "14px 20px" }}>
                    <div style={{ fontSize: 11.5, color: "var(--text-secondary)", fontWeight: 700 }}>ปฏิเสธสิทธิ์/เตือนความปลอดภัย</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "#DC2626", marginTop: 4 }}>
                      {filteredLogs.filter(l => isAccessRejectedLog(l) || l.action === "door_failed").length} ครั้ง
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 12, marginBottom: 14, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
                    <TerminalIcon /> 2. บันทึกประวัติความปลอดภัย และการผ่านเข้าออกห้องปฏิบัติการ (Audit Logs)
                  </h3>

                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                    {/* Item Limit Selector (10, 25, 50 items) */}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.02)", padding: 4, borderRadius: 10, border: "1px solid rgba(255,255,255,0.05)" }}>
                      <span style={{ fontSize: 12, color: "var(--text-secondary)", padding: "0 6px", fontWeight: 700 }}>แสดง:</span>
                      {[10, 25, 50].map(size => (
                        <button
                          key={size}
                          type="button"
                          onClick={() => { setLogPageSize(size); setLogCurrentPage(1); }}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 800,
                            cursor: "pointer",
                            border: "none",
                            background: logPageSize === size ? "linear-gradient(135deg, var(--smartaccess-purple) 0%, var(--edu-pink) 100%)" : "transparent",
                            color: logPageSize === size ? "#fff" : "var(--text-secondary)",
                            boxShadow: logPageSize === size ? "0 2px 8px rgba(124, 58, 237, 0.2)" : "none",
                            transition: "all 0.2s"
                          }}
                        >
                          {size}
                        </button>
                      ))}
                    </div>

                    {/* Search Input */}
                    <div style={{ width: 220 }}>
                      <input
                        className="smartaccess-input"
                        placeholder="ค้นหาประวัติ..."
                        value={logSearch}
                        onChange={e => { setLogSearch(e.target.value); setLogCurrentPage(1); }}
                        style={{ padding: "8px 12px", fontSize: 12.5 }}
                      />
                    </div>
                  </div>
                </div>

                {/* ── Filter Pills Tabs ── */}
                <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap", background: "rgba(255, 255, 255, 0.02)", padding: 6, borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)" }}>
                  {[
                    { value: "all", label: "ทั้งหมด", color: "var(--text-secondary)", icon: <TerminalIcon /> },
                    { value: "door_opened", label: "ผ่านประตูสำเร็จ", color: "#10B981", icon: <UnlockIcon /> },
                    { value: "door_failed", label: "ปฏิเสธสิทธิ์/ล้มเหลว", color: "#EF4444", icon: <AlertIcon /> },
                    { value: "approved", label: "อนุมัติสิทธิ์สมัคร", color: "#7C3AED", icon: <CheckIcon /> },
                    { value: "rejected", label: "ปฏิเสธสิทธิ์สมัคร", color: "#F59E0B", icon: <CrossIcon /> },
                    { value: "registered", label: "ลงทะเบียนใหม่", color: "#3B82F6", icon: <FileTextIcon /> },
                    { value: "export_pdf", label: "ส่งออก PDF", color: "#EC4899", icon: <SaveIcon /> }
                  ].map(t => (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => { setLogFilter(t.value); setLogCurrentPage(1); }}
                      style={{
                        padding: "8px 16px",
                        borderRadius: 8,
                        fontSize: 12.5,
                        fontWeight: 700,
                        cursor: "pointer",
                        border: "none",
                        background: logFilter === t.value ? "linear-gradient(135deg, var(--smartaccess-purple) 0%, var(--edu-pink) 100%)" : "transparent",
                        color: logFilter === t.value ? "#fff" : t.color,
                        boxShadow: logFilter === t.value ? "0 4px 12px rgba(124, 58, 237, 0.25)" : "none",
                        transition: "all 0.2s ease"
                      }}
                    >
                      <span style={{ marginRight: 6, display: "inline-flex", alignItems: "center", verticalAlign: "middle" }}>{t.icon}</span>{t.label}
                    </button>
                  ))}
                </div>

                <div className="premium-card" style={{ overflow: "hidden" }}>
                  <div className="smartaccess-table-container">
                    <table className="smartaccess-table">
                      <thead>
                        <tr>
                          <th style={{ width: 40, textAlign: "center" }}>#</th>
                          <th style={{ width: 145 }}>ประเภทกิจกรรมระบบ</th>
                          <th>ผู้ได้รับผลสิทธิ์ / อุปกรณ์บอร์ด</th>
                          <th style={{ width: 140 }}>รหัสนักศึกษา</th>
                          <th>เจ้าหน้าที่รับผิดชอบ</th>
                          <th>วันเวลาดำเนินการอย่างละเอียด</th>
                          <th>ประวัติระบบและบันทึกรายละเอียด (System Audit Notes)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayedLogs.length === 0 ? (
                          <tr>
                            <td colSpan={7} style={{ textAlign: "center", padding: 40, color: "var(--text-secondary)" }}>
                              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, justifyContent: "center" }}>
                                <AlertIcon />
                                <span>ไม่พบข้อมูลบันทึกความปลอดภัยในช่วงเวลานี้</span>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          displayedLogs.map((log, i) => {
                            const act = getLogActionMetadata(log);
                            return (
                              <tr key={log.id}>
                                <td style={{ color: "var(--text-muted)", fontSize: 12, textAlign: "center" }}>{(logCurrentPage - 1) * logPageSize + i + 1}</td>
                                <td>
                                  <span style={{ display: "inline-flex", gap: 6, alignItems: "center", fontSize: 13, color: act.color, fontWeight: 800 }}>
                                    <span>{act.icon}</span> <span>{act.label}</span>
                                  </span>
                                </td>
                                <td>
                                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                    <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>
                                      {log.student_name || "เครื่องรับสัญญาณประตู / ESP32"}
                                    </div>
                                    {log.requested_room && log.requested_room !== "default" && (
                                      <span style={{
                                        alignSelf: "flex-start",
                                        fontSize: 10,
                                        fontWeight: 800,
                                        background: "linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(219,39,119,0.12) 100%)",
                                        border: "1px solid rgba(124,58,237,0.25)",
                                        color: "var(--smartaccess-purple-dark)",
                                        padding: "2px 8px",
                                        borderRadius: 6
                                      }}>
                                        🚪 ห้อง: {log.requested_room}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td>
                                  <span style={{ color: "var(--smartaccess-purple-dark)", fontWeight: 700, fontFamily: "monospace", fontSize: 12.5 }}>
                                    {log.student_code || "-"}
                                  </span>
                                </td>
                                <td style={{ fontSize: 12.5, color: "var(--text-secondary)", fontWeight: 600 }}>
                                  {log.admin_name || "ระบบเครื่องเซิร์ฟเวอร์"}
                                </td>
                                <td style={{ fontSize: 11.5, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                                  {formatDateTime(log.timestamp)}
                                </td>
                                <td style={{ fontSize: 11.5, maxWidth: 280 }}>
                                  {log.notes ? (
                                    <div
                                      style={{
                                        background: "var(--bg-primary)",
                                        border: "1px solid var(--border)",
                                        padding: "10px 14px",
                                        borderRadius: 10,
                                        fontFamily: "inherit",
                                        fontSize: 11,
                                        color: "var(--text-primary)",
                                        boxShadow: "inset 0 1px 2px rgba(0,0,0,0.02)"
                                      }}
                                    >
                                      {renderLogNotes(log.notes)}
                                    </div>
                                  ) : (
                                    <span style={{ color: "var(--text-muted)" }}>-</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* ── Pagination Footer ── */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, padding: "0 4px", flexWrap: "wrap", gap: 12 }}>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                    แสดงรายการที่ <strong>{totalFilteredLogs === 0 ? 0 : (logCurrentPage - 1) * logPageSize + 1}</strong> ถึง <strong>{Math.min(logCurrentPage * logPageSize, totalFilteredLogs)}</strong> จากทั้งหมด <strong>{totalFilteredLogs}</strong> รายการ
                  </div>

                  {totalLogPages > 1 && (
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <button
                        type="button"
                        disabled={logCurrentPage === 1}
                        onClick={() => setLogCurrentPage(prev => Math.max(prev - 1, 1))}
                        className="btn-secondary"
                        style={{ padding: "6px 12px", fontSize: 12.5, borderRadius: 8, opacity: logCurrentPage === 1 ? 0.4 : 1, cursor: logCurrentPage === 1 ? "not-allowed" : "pointer" }}
                      >
                        ◀ ย้อนกลับ
                      </button>

                      {Array.from({ length: totalLogPages }, (_, idx) => idx + 1).map(p => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setLogCurrentPage(p)}
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            fontSize: 12.5,
                            fontWeight: 700,
                            cursor: "pointer",
                            border: logCurrentPage === p ? "1px solid var(--smartaccess-purple)" : "1px solid rgba(255,255,255,0.08)",
                            background: logCurrentPage === p ? "linear-gradient(135deg, var(--smartaccess-purple) 0%, var(--edu-pink) 100%)" : "rgba(255,255,255,0.02)",
                            color: logCurrentPage === p ? "#fff" : "var(--text-secondary)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            transition: "all 0.2s"
                          }}
                        >
                          {p}
                        </button>
                      ))}

                      <button
                        type="button"
                        disabled={logCurrentPage === totalLogPages}
                        onClick={() => setLogCurrentPage(prev => Math.min(prev + 1, totalLogPages))}
                        className="btn-secondary"
                        style={{ padding: "6px 12px", fontSize: 12.5, borderRadius: 8, opacity: logCurrentPage === totalLogPages ? 0.4 : 1, cursor: logCurrentPage === totalLogPages ? "not-allowed" : "pointer" }}
                      >
                        ถัดไป ▶
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Admin Management Tab (Owner Only) ────────────── */}
            {tab === "admins" && isOwner && (
              <div className="animate-fade-in" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 24 }}>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24, alignItems: "start" }}>

                  {/* Admin List table card */}
                  <div className="premium-card" style={{ overflow: "hidden" }}>
                    <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--border)", background: "var(--smartaccess-purple-pale)" }}>
                      <h3 style={{ fontSize: 15, fontWeight: 800, color: "var(--smartaccess-purple-dark)", display: "flex", alignItems: "center", gap: 6 }}>
                        <UsersIcon /> บัญชีรายชื่อผู้ดูแลระบบทั้งหมด
                      </h3>
                    </div>
                    <div className="smartaccess-table-container" style={{ border: "none", borderRadius: 0 }}>
                      <table className="smartaccess-table">
                        <thead>
                          <tr>
                            <th>ชื่อ - นามสกุลแอดมิน</th>
                            <th>Username</th>
                            <th style={{ textAlign: "center" }}>ระดับสิทธิ์</th>
                            <th>ห้องปฏิบัติการที่ดูแล</th>
                            <th>ล็อกอินล่าสุด</th>
                            <th style={{ width: 80 }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {admins.map(a => {
                            const allowedRoomsStr = a.role === "owner" ? "ทุกห้อง (Owner)" : (a.allowed_rooms ? (a.allowed_rooms === "*" ? "ทุกห้อง (*)" : a.allowed_rooms) : "ยังไม่ได้ระบุห้อง");
                            return (
                              <tr key={a.id}>
                                <td><div style={{ fontWeight: 700 }}>{a.full_name}</div></td>
                                <td><span style={{ color: "var(--text-secondary)", fontSize: 13, fontWeight: 500 }}>{a.username}</span></td>
                                <td style={{ textAlign: "center" }}>
                                  <span className={`badge ${a.role === "owner" ? "badge-approved" : (a.role === "log_viewer" ? "badge-rejected" : "badge-pending")}`}>
                                    {a.role === "owner" ? (
                                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><CrownIcon className="w-3 h-3" /> Owner</span>
                                    ) : a.role === "log_viewer" ? (
                                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><ClockIcon className="w-3 h-3" /> Viewer</span>
                                    ) : (
                                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><KeyIcon className="w-3 h-3" /> Operator</span>
                                    )}
                                  </span>
                                </td>
                                <td>
                                  <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-secondary)" }}>
                                    {allowedRoomsStr}
                                  </span>
                                </td>
                                <td style={{ fontSize: 11.5, color: "var(--text-secondary)" }}>
                                  {formatDateTime(a.last_login)}
                                </td>
                                <td>
                                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                                    <button
                                      onClick={() => {
                                        setEditingAdmin(a);
                                        setEditAdminForm({ full_name: a.full_name, role: a.role });
                                        setEditAdminAllowedRooms(a.allowed_rooms ? a.allowed_rooms.split(",") : []);
                                      }}
                                      style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--smartaccess-purple)" }}
                                      title="แก้ไขขอบเขตสิทธิ์"
                                    >

                                    </button>
                                    {a.id !== user.id && (
                                      <button
                                        onClick={() => handleDeleteAdmin(a.id)}
                                        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "var(--text-danger)" }}
                                        title="ถอดถอนสิทธิ์"
                                      >
                                        <TrashIcon />
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Create Admin form card */}
                  <div className="premium-card" style={{ padding: 24 }}>
                    <h3 style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)", marginBottom: 20 }}>
                      <PlusIcon /> แต่งตั้ง / เพิ่มผู้ดูแลระบบท่านใหม่
                    </h3>
                    <form onSubmit={handleCreateAdmin}>
                      {[
                        { key: "full_name", label: "ชื่อ - นามสกุล เจ้าหน้าที่", type: "text", placeholder: "เช่น นายสมชาย รักดี" },
                        { key: "username", label: "Username ที่ต้องการใช้", type: "text", placeholder: "เช่น somchai_admin" },
                        { key: "password", label: "กำหนดรหัสผ่าน (Password)", type: "password", placeholder: "กรอกรหัสผ่าน 6 ตัวอักษรขึ้นไป" },
                      ].map(f => (
                        <div key={f.key} style={{ marginBottom: 14 }}>
                          <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                            {f.label} *
                          </label>
                          <input
                            className="smartaccess-input"
                            type={f.type}
                            placeholder={f.placeholder}
                            value={(newAdmin as Record<string, string>)[f.key]}
                            onChange={e => setNewAdmin(a => ({ ...a, [f.key]: e.target.value }))}
                            required
                          />
                        </div>
                      ))}

                      <div style={{ marginBottom: 20 }}>
                        <label htmlFor="new_admin_role" style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                          ขอบเขตสิทธิ์ในการทำงาน (Role) *
                        </label>
                        <select
                          id="new_admin_role"
                          className="smartaccess-input"
                          value={newAdmin.role}
                          onChange={e => setNewAdmin(a => ({ ...a, role: e.target.value }))}
                        >
                          <option value="door_operator">Door Operator (เปิดประตูได้อย่างเดียว)</option>
                          <option value="log_viewer">Log Viewer (ดูประวัติและสถิติการเข้าออกห้องได้อย่างเดียว)</option>
                          <option value="owner">Owner (เจ้าของสิทธิ์อนุมัติสิทธิ์และจัดการ)</option>
                        </select>
                      </div>

                      {newAdmin.role !== "owner" && (
                        <div style={{ marginBottom: 20, padding: 14, borderRadius: 10, border: "1px dashed var(--border)", background: "rgba(255,255,255,0.01)" }}>
                          <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>
                            ห้องเรียนที่อนุญาตให้เข้าถึง / จัดการได้ *
                          </label>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginBottom: 10 }}>
                            <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer", fontWeight: 700, color: "var(--smartaccess-purple)" }}>
                              <input
                                type="checkbox"
                                checked={newAdminAllowedRooms.includes("*")}
                                onChange={e => {
                                  if (e.target.checked) {
                                    setNewAdminAllowedRooms(["*"]);
                                  } else {
                                    setNewAdminAllowedRooms([]);
                                  }
                                }}
                              />
                              ทุกห้องเรียน (*)
                            </label>
                          </div>

                          {!newAdminAllowedRooms.includes("*") && (
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 10 }}>
                              {roomsList.map(r => (
                                <label key={r.room} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, cursor: "pointer" }}>
                                  <input
                                    type="checkbox"
                                    checked={newAdminAllowedRooms.includes(r.room)}
                                    onChange={e => {
                                      if (e.target.checked) {
                                        setNewAdminAllowedRooms(prev => [...prev.filter(x => x !== "*"), r.room]);
                                      } else {
                                        setNewAdminAllowedRooms(prev => prev.filter(x => x !== r.room));
                                      }
                                    }}
                                  />
                                  {r.room}
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <button
                        type="submit"
                        className="btn-primary"
                        style={{ width: "100%", justifyContent: "center", borderRadius: 12, padding: "12px" }}
                      >
                        <CheckIcon />
                        <span style={{ marginLeft: 6 }}>ยืนยันแต่งตั้งแอดมินใหม่</span>
                      </button>
                    </form>
                  </div>

                </div>
              </div>
            )}

            {tab === "rooms" && isOwner && (
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
                      <button onClick={saveSettings} disabled={settingsLoading} className="btn-primary" style={{ borderRadius: 8, padding: "11px 18px", fontSize: 13 }}>
                        {settingsLoading ? "กำลังบันทึก..." : "บันทึกห้องทั้งหมด"}
                      </button>
                    </div>
                  </div>

                  {/* Dynamic SVG Analytics Dashboard - Zero Dependency (2026-05) */}
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
                        📊 รายงานสถิติและบทวิเคราะห์เชิงลึก (Zero-Dependency SVG Analytics Dashboard)
                      </h3>
                      <p style={{ color: "var(--text-secondary)", fontSize: 12.5, margin: "6px 0 0", lineHeight: 1.4 }}>
                        ข้อมูลวิเคราะห์อัตราการเข้าเรียนสูงสุดแยกตามช่วงเวลา คณะวิชา และอัตราความสำเร็จของคำขอประมวลผลแบบ Real-time จากประวัติ logs
                      </p>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24 }}>

                      {/* Chart 1: Hour Distribution */}
                      <div style={{ padding: 16, background: "var(--bg-primary)", border: "1px solid var(--border)", borderRadius: 12 }}>
                        <h4 style={{ fontSize: 13.5, fontWeight: 800, color: "var(--smartaccess-purple-dark)", marginTop: 0, marginBottom: 12 }}>
                          ⏰ ช่วงชั่วโมงที่มีการเข้าออกสูงสุด (Peak Access Hours)
                        </h4>
                        <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", height: 130, gap: 8, paddingTop: 10, paddingBottom: 5 }}>
                          {(() => {
                            // Compute hours from logs
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
                              const pct = (cnt / maxVal) * 90; // max height 90%
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
                          🎯 อัตราการตรวจสอบสำเร็จ (Request Handling Success)
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
                                  {/* Simple dynamic SVG Pie chart */}
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
                          🎓 สัดส่วนการเข้าใช้งานจำแนกตามภาควิชา (Department Ratios)
                        </h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: 10, height: 130, justifyContent: "center" }}>
                          {(() => {
                            // Compute department counts
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

                      {/* KPI Cards */}
                      {analyticsData.kpi && (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 20 }}>
                          {[
                            { label: "ลงทะเบียน (7 วัน)", value: analyticsData.kpi.reg_7d, color: "#7C3AED", icon: "📝" },
                            { label: "อนุมัติ (7 วัน)", value: analyticsData.kpi.approved_7d, color: "#10B981", icon: "✅" },
                            { label: "เปิดประตู (7 วัน)", value: analyticsData.kpi.opens_7d, color: "#3B82F6", icon: "🚪" },
                            { label: "ปฏิเสธ (7 วัน)", value: analyticsData.kpi.rejected_7d, color: "#EF4444", icon: "❌" },
                            { label: "ลงทะเบียน (24 ชม.)", value: analyticsData.kpi.reg_24h, color: "#F59E0B", icon: "🕐" },
                            { label: "เปิดประตู (24 ชม.)", value: analyticsData.kpi.opens_24h, color: "#06B6D4", icon: "⚡" },
                          ].map(({ label, value, color, icon }) => (
                            <div key={label} style={{ padding: "14px 16px", background: "var(--bg-primary)", border: "1px solid var(--border)", borderRadius: 12, textAlign: "center" }}>
                              <div style={{ fontSize: 22, marginBottom: 4 }}>{icon}</div>
                              <div style={{ fontSize: 26, fontWeight: 900, color }}>{value ?? 0}</div>
                              <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2, lineHeight: 1.3 }}>{label}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>

                        {/* Peak Hours Heatmap */}
                        {analyticsData.heatmap && analyticsData.heatmap.length > 0 && (
                          <div style={{ padding: 16, background: "var(--bg-primary)", border: "1px solid var(--border)", borderRadius: 12, gridColumn: "1 / -1" }}>
                            <h4 style={{ fontSize: 13.5, fontWeight: 800, color: "var(--smartaccess-purple-dark)", marginTop: 0, marginBottom: 14 }}>
                              🔥 Heatmap ชั่วโมงพีค (30 วัน) — แต่ละแถว = วันในสัปดาห์, แต่ละคอลัมน์ = ชั่วโมง 0–23
                            </h4>
                            {(() => {
                              const days = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];
                              const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
                              analyticsData.heatmap!.forEach(r => { grid[r.day_of_week][r.hour] = Number(r.count); });
                              const maxVal = Math.max(...analyticsData.heatmap!.map(r => Number(r.count)), 1);
                              return (
                                <div style={{ overflowX: "auto" }}>
                                  <div style={{ minWidth: 560 }}>
                                    {/* Hour header */}
                                    <div style={{ display: "flex", gap: 2, marginBottom: 2, paddingLeft: 38 }}>
                                      {Array.from({ length: 24 }, (_, h) => (
                                        <div key={h} style={{ flex: 1, fontSize: 9, color: "var(--text-secondary)", textAlign: "center", fontWeight: 700 }}>{h}</div>
                                      ))}
                                    </div>
                                    {/* Day rows */}
                                    {days.map((day, di) => (
                                      <div key={di} style={{ display: "flex", alignItems: "center", gap: 2, marginBottom: 2 }}>
                                        <div style={{ width: 34, fontSize: 10, fontWeight: 800, color: "var(--text-secondary)", flexShrink: 0 }}>{day}</div>
                                        {grid[di].map((val, hi) => {
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
                                    ))}
                                  </div>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, fontSize: 10, color: "var(--text-secondary)" }}>
                                    <span>น้อย</span>
                                    {[0.1, 0.3, 0.55, 0.75, 0.95].map(a => (
                                      <div key={a} style={{ width: 14, height: 14, borderRadius: 3, background: `rgba(124,58,237,${a})` }} />
                                    ))}
                                    <span>มาก</span>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}

                        {/* Admin Approval Stats */}
                        {analyticsData.admin_stats && analyticsData.admin_stats.length > 0 && (
                          <div style={{ padding: 16, background: "var(--bg-primary)", border: "1px solid var(--border)", borderRadius: 12 }}>
                            <h4 style={{ fontSize: 13.5, fontWeight: 800, color: "var(--smartaccess-purple-dark)", marginTop: 0, marginBottom: 12 }}>
                              👤 สถิติการอนุมัติของแอดมิน (30 วัน)
                            </h4>
                            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                              {analyticsData.admin_stats.map(a => (
                                <div key={a.full_name} style={{ padding: "10px 12px", background: "var(--bg-secondary)", borderRadius: 10, border: "1px solid var(--border)" }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                                    <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)" }}>{a.full_name}</span>
                                    <span style={{
                                      fontSize: 11, fontWeight: 900, padding: "2px 8px", borderRadius: 99,
                                      background: a.approval_rate_pct != null && Number(a.approval_rate_pct) >= 80 ? "rgba(16,185,129,0.15)" : "rgba(245,158,11,0.15)",
                                      color: a.approval_rate_pct != null && Number(a.approval_rate_pct) >= 80 ? "#10B981" : "#F59E0B",
                                    }}>
                                      {a.approval_rate_pct != null ? `${a.approval_rate_pct}%` : "N/A"}
                                    </span>
                                  </div>
                                  <div style={{ display: "flex", gap: 10, fontSize: 11 }}>
                                    <span style={{ color: "#10B981", fontWeight: 700 }}>✅ {a.approved_count}</span>
                                    <span style={{ color: "#EF4444", fontWeight: 700 }}>❌ {a.rejected_count}</span>
                                    <span style={{ color: "#3B82F6", fontWeight: 700 }}>🚪 {a.door_opened_count ?? 0}</span>
                                  </div>
                                  <div style={{ marginTop: 6, height: 5, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
                                    <div style={{
                                      height: "100%",
                                      width: `${a.approval_rate_pct ?? 0}%`,
                                      background: "linear-gradient(90deg, #7C3AED, #10B981)",
                                      borderRadius: 99,
                                    }} />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Room Utilization */}
                        {analyticsData.room_utilization && analyticsData.room_utilization.length > 0 && (
                          <div style={{ padding: 16, background: "var(--bg-primary)", border: "1px solid var(--border)", borderRadius: 12 }}>
                            <h4 style={{ fontSize: 13.5, fontWeight: 800, color: "var(--smartaccess-purple-dark)", marginTop: 0, marginBottom: 12 }}>
                              🏫 การใช้งานของแต่ละห้อง (30 วัน)
                            </h4>
                            {(() => {
                              const maxOpens = Math.max(...analyticsData.room_utilization!.map(r => Number(r.door_opens)), 1);
                              return (
                                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                                  {analyticsData.room_utilization!.map(r => (
                                    <div key={r.room}>
                                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4 }}>
                                        <span>ห้อง {r.room}</span>
                                        <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>
                                          🚪 {r.door_opens} | ✅ {r.approvals} | 📅 {r.active_days} วัน
                                        </span>
                                      </div>
                                      <div style={{ height: 8, background: "var(--bg-secondary)", borderRadius: 99, overflow: "hidden", border: "1px solid var(--border)" }}>
                                        <div style={{
                                          height: "100%",
                                          width: `${Math.round((Number(r.door_opens) / maxOpens) * 100)}%`,
                                          background: "linear-gradient(90deg, #7C3AED, #DB2777)",
                                          borderRadius: 99,
                                        }} />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              );
                            })()}
                          </div>
                        )}

                      </div>

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
                    </div>
                  )}

                  {!analyticsData && !analyticsLoading && (
                    <div style={{ marginTop: 16, textAlign: "center" }}>
                      <button type="button" onClick={fetchAnalytics} className="btn-secondary" style={{ borderRadius: 8, padding: "10px 20px", fontSize: 13 }}>
                        📊 โหลด Analytics Dashboard
                      </button>
                    </div>
                  )}
                  {analyticsLoading && (
                    <div style={{ marginTop: 16, textAlign: "center", color: "var(--text-secondary)", fontSize: 13 }}>
                      ⏳ กำลังโหลดข้อมูล Analytics...
                    </div>
                  )}

                </section>

                <section className="room-card-grid">
                  {roomsList.length === 0 ? (
                    <div className="room-config-card" style={{ gridColumn: "1 / -1", textAlign: "center", padding: 42 }}>
                      <h3 style={{ fontSize: 18, fontWeight: 900, color: "var(--text-primary)", marginBottom: 8 }}>ยังไม่มีห้องเรียนในระบบ</h3>
                      <p style={{ color: "var(--text-secondary)", fontSize: 13, margin: 0 }}>เพิ่มรหัสห้องและ IP บอร์ดด้านล่าง แล้วกดบันทึกห้องทั้งหมด</p>
                    </div>
                  ) : (
                    roomsList.map((roomItem, idx) => {
                      const liveDev = systemStatus?.esp32Devices?.find(d => d.room === roomItem.room);
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
                            <span style={{ borderRadius: 99, padding: "5px 10px", fontSize: 11.5, fontWeight: 900, background: isOnline ? "#ECFDF5" : "#FEF2F2", color: isOnline ? "#059669" : "#DC2626", border: `1px solid ${isOnline ? "rgba(5,150,105,0.24)" : "rgba(220,38,38,0.24)"}` }}>
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

                          {/* ── Per-Room Settings Panel ─────────────────────────── */}
                          <div style={{ marginTop: 12 }}>
                            <button
                              type="button"
                              onClick={() => toggleRoomSettings(roomItem.room)}
                              style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 12px", borderRadius: 8, border: "1px solid var(--border)", background: expandedRoomSettings.has(roomItem.room) ? "var(--smartaccess-purple-pale)" : "transparent", color: expandedRoomSettings.has(roomItem.room) ? "var(--smartaccess-purple)" : "var(--text-secondary)", fontSize: 12.5, fontWeight: 700, cursor: "pointer" }}
                            >
                              <span>⚙️ ตั้งค่าการอนุมัติ & หน้าจอ ESP32</span>
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

                                  {/* Auto Approve toggle */}
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                                    <div>
                                      <div style={{ fontWeight: 800, fontSize: 13, color: "var(--text-primary)" }}>เข้าห้องอัตโนมัติไม่ต้องรออนุมัติ</div>
                                      <div style={{ fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.4 }}>นักศึกษาใหม่ยื่นในเวลาบริการ อนุมัติผ่านเข้าห้องทันที</div>
                                    </div>
                                    <Toggle on={cfg.auto_approve_enabled} onToggle={() => setRoomConfig(roomItem.room, { auto_approve_enabled: !cfg.auto_approve_enabled })} />
                                  </div>

                                  {/* Auto Fill toggle */}
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

                                  {/* Student ID display mode */}
                                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                                    <label style={{ fontSize: 12, fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 5 }}>
                                      🔒 ความปลอดภัยหน้าจอ ESP32 (รหัสนักศึกษาล่าสุด)
                                    </label>
                                    <select value={cfg.student_id_display_mode} onChange={e => setRoomConfig(roomItem.room, { student_id_display_mode: e.target.value })} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border)", background: "var(--bg-primary)", color: "var(--text-primary)", fontSize: 12.5, outline: "none" }}>
                                      <option value="full">โชว์รหัสแบบเต็ม (Full ID)</option>
                                      <option value="masked">เซ็นเซอร์บางส่วน (Masked ID)</option>
                                      <option value="hidden">ปิดการแสดงผล (Hidden)</option>
                                    </select>
                                  </div>

                                  {/* Service hours */}
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

                                  {/* Service days */}
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

                          {/* 💾 ปุ่มบันทึกการตั้งค่าห้องเรียนนี้ */}
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
                              <span>{roomSaving[roomItem.room] ? "⏳" : "💾"}</span>
                              <span>{roomSaving[roomItem.room] ? "กำลังบันทึก..." : "บันทึกการตั้งค่าห้องนี้"}</span>
                            </button>
                          </div>
                        </article>
                      );
                    })
                  )}
                </section>

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

                {/* ── OTA Firmware Control Center Card ── */}
                <div className="premium-card" style={{ padding: 26, marginTop: 24, borderLeft: "4px solid var(--smartaccess-purple)", background: "var(--bg-secondary)" }}>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--smartaccess-purple)" }}>
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                    </svg>
                    ระบบจัดการและกระจายเฟิร์มแวร์แบบไร้สาย (OTA Firmware Control Center)
                  </h3>
                  <p style={{ color: "var(--text-secondary)", fontSize: 12.5, marginBottom: 20 }}>
                    อัปเดตและเผยแพร่ซอฟต์แวร์ของบอร์ดควบคุมหน้าห้องเรียนแบบไร้สาย (Cloud HTTPS OTA) โดยสตรีมไฟล์ไบเนรีตรงไปเก็บบนคลังคลาวด์ <strong>Supabase Storage (0% Vercel CPU Load)</strong> ได้ฟรีถาว
                  </p>

                  {/* OTA Activity Logs */}
                  <div style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", borderRadius: 10, padding: 18, marginBottom: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)" }}>📋 บันทึกกิจกรรม OTA แบบละเอียด</span>
                      <button
                        onClick={fetchFirmwareLogs}
                        style={{ padding: "4px 10px", background: "none", border: "1px solid var(--border-medium)", color: "var(--smartaccess-purple)", fontSize: 11, borderRadius: 6, fontWeight: 700, cursor: "pointer" }}
                      >
                        🔄 รีเฟรช
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
                          const icon = isOtaTrigger ? "⬇️" : isDelete ? "🗑️" : "🚀";
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
                      <span style={{ display: "block", fontSize: 13, fontWeight: 800, color: "var(--text-primary)", marginBottom: 12 }}>⚡ อัปโหลดเฟิร์มแวร์รุ่นใหม่ (.bin)</span>

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

                        setFirmwareUploadLoading(true);
                        try {
                          const fileToSend = firmwareFile || new File(["MOCK_DATA"], `v_${firmwareVersionInput.replace(/\./g, '_')}.bin`);
                          const fd = new FormData();
                          fd.append("file", fileToSend);
                          fd.append("version", firmwareVersionInput);
                          fd.append("public_url", firmwarePublicUrlInput);

                          const res = await fetch("/api/system/firmware/upload", {
                            method: "POST",
                            body: fd
                          });
                          const data = await res.json();
                          if (res.ok) {
                            showToast(data.message, "success");
                            setFirmwareVersionInput("");
                            setFirmwarePublicUrlInput("");
                            setFirmwareFile(null);
                            fetchFirmwares();
                            fetchFirmwareLogs();
                            fetchSystemStatus();
                          } else {
                            showToast(data.error || "เกิดข้อผิดพลาดในการอัปโหลด", "error");
                          }
                        } catch {
                          showToast("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์", "error");
                        } finally {
                          setFirmwareUploadLoading(false);
                        }
                      }} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        <div>
                          <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 4 }}>รุ่นซอฟต์แวร์ (Version) *</label>
                          <input
                            className="smartaccess-input"
                            placeholder="ตัวอย่าง: 1.0.2"
                            value={firmwareVersionInput}
                            onChange={e => setFirmwareVersionInput(e.target.value)}
                            style={{ padding: "6px 10px", fontSize: 12.5 }}
                            required
                          />
                        </div>

                        <div>
                          <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 4 }}>Supabase Storage Public URL *</label>
                          <input
                            className="smartaccess-input"
                            placeholder="วาง Public URL ลิงก์ตรงของไฟล์ .bin บน Supabase Storage..."
                            value={firmwarePublicUrlInput}
                            onChange={e => setFirmwarePublicUrlInput(e.target.value)}
                            style={{ padding: "6px 10px", fontSize: 12.5 }}
                            required
                          />
                        </div>

                        <div>
                          <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 4 }}>เลือกไฟล์ไบนารีบนคอมพิวเตอร์ (สำหรับคำนวณ MD5 Checksum) *</label>
                          <input
                            type="file"
                            accept=".bin"
                            onChange={e => {
                              if (e.target.files && e.target.files.length > 0) {
                                setFirmwareFile(e.target.files[0]);
                              }
                            }}
                            style={{ fontSize: 11.5, color: "var(--text-secondary)" }}
                          />
                        </div>

                        <button
                          type="submit"
                          className="btn-primary"
                          disabled={firmwareUploadLoading}
                          style={{ padding: "10px", fontSize: 12.5, fontWeight: 800, borderRadius: 8, marginTop: 4, width: "100%", background: "linear-gradient(135deg, var(--smartaccess-purple) 0%, var(--edu-pink) 100%)", color: "#fff", border: "none", cursor: "pointer" }}
                        >
                          {firmwareUploadLoading ? "⏳ กำลังบันทึก..." : "🚀 เปิดตัวปล่อยอัปเดตแบบไร้สาย (Deploy OTA)"}
                        </button>
                      </form>
                    </div>

                    {/* Releases History list */}
                    <div style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", borderRadius: 10, padding: 18, maxHeight: 310, overflowY: "auto" }}>
                      <span style={{ display: "block", fontSize: 13, fontWeight: 800, color: "var(--text-primary)", marginBottom: 12 }}>📜 ประวัติการปล่อยเวอร์ชันไร้สาย</span>

                      {firmwareReleasesLoading ? (
                        <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-secondary)", fontSize: 12.5 }}>
                          กำลังโหลดข้อมูล...
                        </div>
                      ) : firmwareReleases.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)", fontSize: 12 }}>
                          ยังไม่มีประวัติการอัปโหลดเฟิร์มแวร์แบบไร้สายในระบบ
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          {firmwareReleases.map(release => (
                            <div key={release.id} style={{ padding: 10, background: "var(--bg-secondary)", border: "1px solid var(--border)", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div>
                                <span style={{ fontSize: 12.5, fontWeight: 800, color: "var(--smartaccess-purple-dark)" }}>รุ่น v{release.version}</span>
                                <span style={{ display: "block", fontSize: 10.5, color: "var(--text-muted)", marginTop: 2 }}>
                                  MD5: {release.checksum_md5.substring(0, 10)}... · {(release.file_size / 1024).toFixed(1)} KB
                                </span>
                                <span style={{ display: "block", fontSize: 9.5, color: "var(--text-muted)", marginTop: 1 }}>
                                  {new Date(release.uploaded_at).toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}
                                </span>
                              </div>
                              <button
                                onClick={async () => {
                                  if (!confirm(`ต้องการถอนและลบประวัติเฟิร์มแวร์รุ่น ${release.version} ออกจากระบบ ใช่หรือไม่?`)) return;
                                  try {
                                    const res = await fetch(`/api/system/firmware?id=${release.id}`, { method: "DELETE" });
                                    const data = await res.json();
                                    if (res.ok) {
                                      showToast(data.message, "success");
                                      fetchFirmwares();
                                      fetchFirmwareLogs();
                                      fetchSystemStatus();
                                    } else {
                                      showToast(data.error, "error");
                                    }
                                  } catch {
                                    showToast("ลบข้อมูลไม่สำเร็จ", "error");
                                  }
                                }}
                                style={{ padding: "4px 8px", background: "none", border: "1px solid rgba(220,38,38,0.25)", color: "#EF4444", fontSize: 11, borderRadius: 6, fontWeight: 700, cursor: "pointer" }}
                              >
                                ถอน
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── System & Discord Settings Tab (Owner Only) ────────────── */}
            {tab === "settings" && isOwner && (
              <div className="animate-fade-in" style={{ maxWidth: 680, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>

                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "var(--smartaccess-purple)", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 4 }}>Webhook Settings</div>
                    <h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--text-primary)", margin: 0 }}>Discord Webhooks</h2>
                    <p style={{ fontSize: 12.5, color: "var(--text-secondary)", margin: "6px 0 0", lineHeight: 1.5 }}>
                      ค่าตั้งต้นสำหรับทุกห้อง — ห้องที่ไม่ได้ตั้ง Webhook เฉพาะจะใช้ค่านี้
                    </p>
                  </div>
                  <button
                    onClick={saveSettings}
                    disabled={settingsLoading}
                    className="btn-primary"
                    style={{ borderRadius: 10, padding: "11px 22px", fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}
                  >
                    {settingsLoading ? (
                      <><span className="animate-spin" style={{ display: "inline-block", width: 13, height: 13, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%" }} /> กำลังบันทึก...</>
                    ) : (
                      <><SaveIcon /> บันทึก</>
                    )}
                  </button>
                </div>

                {/* Webhook fields */}
                <div className="premium-card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
                  {[
                    { label: "คำขอลงทะเบียนเข้าห้องใหม่", key: "discord_webhook_register" as const, type: "register" as const, placeholder: "https://discord.com/api/webhooks/..." },
                    { label: "อนุมัติสิทธิ์ / เปิดประตูสำเร็จ", key: "discord_webhook_approve" as const, type: "approve" as const, placeholder: "https://discord.com/api/webhooks/..." },
                    { label: "Log จราจร / ความปลอดภัย", key: "discord_webhook_logs" as const, type: "logs" as const, placeholder: "https://discord.com/api/webhooks/..." },
                    { label: "Admin เข้า/ออกระบบ (Audit)", key: "discord_webhook_admin_audit" as const, type: "admin_audit" as const, placeholder: "https://discord.com/api/webhooks/...", badge: "Security" },
                  ].map(({ label, key, type, placeholder, badge }) => (
                    <div key={key}>
                      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 7 }}>
                        {label}
                        {badge && (
                          <span style={{ fontSize: 10.5, fontWeight: 700, color: "#f59e0b", background: "rgba(245,158,11,0.12)", padding: "1px 7px", borderRadius: 6 }}>{badge}</span>
                        )}
                      </label>
                      <div style={{ display: "flex", gap: 8 }}>
                        <input
                          className="smartaccess-input"
                          type="url"
                          placeholder={placeholder}
                          value={settings[key] || ""}
                          onChange={e => setSettings(s => ({ ...s, [key]: e.target.value }))}
                          style={{ flex: 1, fontSize: 12.5 }}
                        />
                        <button
                          type="button"
                          onClick={() => handleTestWebhook(settings[key] || "", type)}
                          className="btn-ghost"
                          style={{ padding: "10px 14px", fontSize: 12, borderRadius: 10, flexShrink: 0, fontWeight: 700 }}
                        >
                          🧪 ทดสอบ
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            )}

            {/* ── User Guide Tab (Available for all Admins) ────────────── */}
            {tab === "guide" && (
              <div className="animate-fade-in" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 24 }}>

                {/* 📚 Premium User Manual Guide Panel */}
                <div className="premium-card" style={{ padding: 32, background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>

                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    borderBottom: "1.5px solid var(--border)",
                    paddingBottom: 20,
                    marginBottom: 28
                  }}>
                    <div style={{
                      width: 52,
                      height: 52,
                      borderRadius: "16px",
                      background: "linear-gradient(135deg, var(--smartaccess-purple) 0%, var(--edu-pink) 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontSize: 26,
                      boxShadow: "0 6px 16px rgba(124,58,237,0.25)",
                      flexShrink: 0 // ป้องกันไม่ให้ไอคอนกล่องถูกบีบอัดขนาดบนหน้าจอขนาดกลาง/เล็ก
                    }}>
                      📚
                    </div>
                    <div>
                      <h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--smartaccess-purple-dark)", margin: 0 }}>
                        คู่มือการใช้งานระบบ & IoT Controller (ACCS User Manual)
                      </h2>
                      <p style={{ fontSize: 12.5, color: "var(--text-secondary)", margin: "4px 0 0" }}>
                        คู่มือแนะนำการบริหารจัดการระบบควบคุมกลอนประตูอัจฉริยะ โหมดซอฟต์แวร์จำลอง และการต่อบอร์ดจริงข้ามเครือข่ายอย่างละเอียด
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 18, textAlign: "left" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                      {[
                        { title: "หน้าคิวรอตรวจสอบ", text: "ใช้ดูคำขอใหม่ อนุมัติ หรือปฏิเสธพร้อมเหตุผล" },
                        { title: "สถานะบอร์ด IoT", text: "ใช้ดูห้อง CE-401/CE-402 ปลดล็อกด่วน และทดสอบ Polling" },
                        { title: "ทำเนียบ & Export PDF", text: "ใช้ค้นหาประวัติ กรองช่วงวันที่ และดาวน์โหลดรายงาน" },
                        { title: "ตั้งค่าระบบ & Webhook", text: "ใช้เพิ่มห้อง ตั้ง IP ตั้ง Discord และบันทึกค่าระบบ" },
                      ].map(item => (
                        <div key={item.title} style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 14, background: "var(--bg-primary)" }}>
                          <div style={{ fontSize: 13, fontWeight: 900, color: "var(--text-primary)", marginBottom: 5 }}>{item.title}</div>
                          <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>{item.text}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{ padding: 16, border: "1px solid rgba(16,185,129,0.24)", background: "#ECFDF5", borderRadius: 8 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 900, color: "#047857", marginBottom: 8 }}>เริ่มใช้งานประจำวัน</h3>
                      <ol style={{ margin: 0, paddingLeft: 20, color: "var(--text-primary)", fontSize: 13, lineHeight: 1.8 }}>
                        <li>เข้าแผงผู้ดูแล แล้วดูการ์ดด้านบนก่อนว่ามีคิวรอตรวจสอบกี่คน และบอร์ดออนไลน์กี่บอร์ด</li>
                        <li>เปิดแท็บ <strong>สถานะบอร์ด IoT ทั้งหมด</strong> เพื่อตรวจว่าแต่ละห้องมีรายการแสดงขึ้นมา เช่น CE-401 หรือ CE-402</li>
                        <li>ถ้าบอร์ดไม่ออนไลน์ ให้กด <strong>เทส Polling</strong> ที่การ์ดห้องนั้นก่อน แล้วตรวจ IP/อินเทอร์เน็ตของบอร์ด</li>
                        <li>กลับไปแท็บ <strong>คิวรอตรวจสอบ</strong> เพื่ออนุมัติหรือปฏิเสธคำขอของนักศึกษา</li>
                      </ol>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
                      <section style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 18 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 900, color: "var(--text-primary)", marginBottom: 10 }}>1. รับคำขอและอนุมัติสิทธิ์</h3>
                        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.8 }}>
                          <li>นักศึกษาสแกน QR หน้าห้อง แล้วกรอกข้อมูลในฟอร์ม</li>
                          <li>คำขอจะเข้าแท็บ <strong>คิวรอตรวจสอบ</strong> พร้อมห้องที่ขอใช้สิทธิ์</li>
                          <li>ตรวจชื่อ รหัสนักศึกษา คณะ สาขา และห้องให้ถูกต้อง</li>
                          <li>กด <strong>อนุมัติ</strong> เพื่อให้สิทธิ์ หรือกด <strong>ปฏิเสธ</strong> แล้วใส่เหตุผล</li>
                          <li>หลังอนุมัติ ระบบจะบันทึกผู้อนุมัติ เวลา และแสดงในประวัติ/PDF</li>
                        </ul>
                      </section>

                      <section style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 18 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 900, color: "var(--text-primary)", marginBottom: 10 }}>2. ปลดล็อกประตู</h3>
                        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.8 }}>
                          <li>ถ้าต้องเปิดให้รายบุคคล ให้ไปที่แท็บ <strong>ทำเนียบ & ประวัติเข้าออก</strong> แล้วกด <strong>เปิด</strong> ในแถวนักศึกษาที่อนุมัติแล้ว</li>
                          <li>ถ้าต้องเปิดห้องทันที ให้ไปที่แท็บ <strong>ห้องเรียน & ESP32</strong> แล้วกด <strong>ปลดล็อกด่วน</strong> ที่การ์ดห้อง</li>
                          <li>ดูตัวเลข <strong>ปลดล็อกสำเร็จวันนี้</strong> เพื่อเช็กว่าคำสั่งถูกบันทึกแล้ว</li>
                          <li>ถ้าเปิดไม่ได้ ให้ดูว่าการ์ดห้องขึ้นออนไลน์หรือไม่ และลองกด <strong>เทส Polling</strong></li>
                        </ul>
                      </section>

                      <section style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 18 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 900, color: "var(--text-primary)", marginBottom: 10 }}>3. เพิ่มหรือแก้ไขห้อง IoT</h3>
                        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.8 }}>
                          <li>เปิดแท็บ <strong>ห้องเรียน & ESP32</strong></li>
                          <li>ไปที่ส่วนเพิ่มห้อง / บอร์ดใหม่</li>
                          <li>กรอกรหัสห้อง เช่น <strong>CE-401</strong> และ IP ของบอร์ด เช่น <strong>192.168.1.100</strong></li>
                          <li>กดเพิ่มห้อง แล้วกด <strong>บันทึกทั้งหมด</strong> เพื่อให้ห้องแสดงในหน้า IoT หลังเปิดเว็บใหม่หรือ deploy ใหม่</li>
                          <li>ถ้าห้องมี Discord แยก ให้กดปุ่มตั้งค่าของห้องนั้น แล้วใส่ Webhook เฉพาะห้อง</li>
                        </ul>
                      </section>

                      <section style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 18 }}>
                        <h3 style={{ fontSize: 15, fontWeight: 900, color: "var(--text-primary)", marginBottom: 10 }}>4. Export PDF และค้นหาประวัติ</h3>
                        <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.8 }}>
                          <li>ไปที่แท็บ <strong>ทำเนียบ & ประวัติเข้าออก</strong></li>
                          <li>เลือกวันที่เริ่มต้น วันที่สิ้นสุด และสถานะที่ต้องการ</li>
                          <li>ตรวจกล่องสรุปจำนวนรายการก่อนดาวน์โหลด</li>
                          <li>กด <strong>ดาวน์โหลด PDF</strong> เพื่อออกเอกสารรวม</li>
                          <li>ถ้าต้องการเอกสารรายบุคคล ให้กดปุ่ม <strong>การ์ด</strong> ในแถวนักศึกษาคนนั้น</li>
                        </ul>
                      </section>
                    </div>

                    <div style={{ border: "1px solid rgba(217,119,6,0.24)", background: "#FFFBEB", borderRadius: 8, padding: 16 }}>
                      <h3 style={{ fontSize: 15, fontWeight: 900, color: "#B45309", marginBottom: 10 }}>แก้ปัญหาที่พบบ่อย</h3>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
                        {[
                          { q: "เข้าเว็บแล้วไม่เห็นห้อง IoT", a: "ไปที่ตั้งค่าระบบ ตรวจว่ามีห้องอยู่ในรายการ แล้วกดบันทึกทั้งหมดอีกครั้ง" },
                          { q: "บอร์ดขึ้น OFFLINE", a: "ตรวจไฟเลี้ยง/อินเทอร์เน็ตบอร์ด ตรวจ IP แล้วกดเทส Polling" },
                          { q: "Discord ไม่แจ้งเตือน", a: "ตรวจ Webhook ส่วนกลางหรือ Webhook เฉพาะห้อง แล้วกดทดสอบส่ง" },
                          { q: "PDF ไม่มีข้อมูล", a: "ตรวจช่วงวันที่และสถานะที่เลือก ถ้ากรองแคบเกินไปให้เลือกทุกสถานะหรือขยายช่วงวันที่" },
                        ].map(item => (
                          <div key={item.q} style={{ background: "#FFFFFF", border: "1px solid rgba(217,119,6,0.18)", borderRadius: 8, padding: 12 }}>
                            <div style={{ fontSize: 12.5, fontWeight: 900, color: "var(--text-primary)", marginBottom: 4 }}>{item.q}</div>
                            <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>{item.a}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>
        </main>
      </div>

      {/* ── EDIT ADMIN MODAL ── */}
      {editingAdmin && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(15, 23, 42, 0.75)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: 16
        }}>
          <div className="premium-card animate-fade-in" style={{ width: "100%", maxWidth: 480, padding: 24, background: "var(--bg-primary)", position: "relative" }}>
            <button
              onClick={() => setEditingAdmin(null)}
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                background: "rgba(255,255,255,0.05)",
                border: "none",
                borderRadius: "50%",
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-secondary)",
                cursor: "pointer",
                fontWeight: "bold",
                fontSize: 16
              }}
            >
              ✕
            </button>

            <h3 style={{ fontSize: 18, fontWeight: 900, color: "var(--text-primary)", marginBottom: 6, display: "flex", alignItems: "center", gap: 8 }}>
              ✏️ แก้ไขสิทธิ์แอดมิน: <span style={{ color: "var(--smartaccess-purple)" }}>{editingAdmin.username}</span>
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 20 }}>
              ปรับปรุงชื่อ ตำแหน่ง และขอบเขตการดูแลห้องปฏิบัติการของ {editingAdmin.full_name}
            </p>

            <form onSubmit={handleUpdateAdmin}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                  ชื่อ - นามสกุล เจ้าหน้าที่ *
                </label>
                <input
                  className="smartaccess-input"
                  type="text"
                  value={editAdminForm.full_name}
                  onChange={e => setEditAdminForm(a => ({ ...a, full_name: e.target.value }))}
                  required
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label htmlFor="edit_admin_role" style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                  ขอบเขตสิทธิ์ในการทำงาน (Role) *
                </label>
                <select
                  id="edit_admin_role"
                  className="smartaccess-input"
                  value={editAdminForm.role}
                  onChange={e => setEditAdminForm(a => ({ ...a, role: e.target.value }))}
                >
                  <option value="door_operator">Door Operator (เปิดประตูได้อย่างเดียว)</option>
                  <option value="log_viewer">Log Viewer (ดูประวัติและสถิติการเข้าออกห้องได้อย่างเดียว)</option>
                  <option value="owner">Owner (เจ้าของสิทธิ์อนุมัติสิทธิ์และจัดการ)</option>
                </select>
              </div>

              {editAdminForm.role !== "owner" && (
                <div style={{ marginBottom: 20, padding: 14, borderRadius: 10, border: "1px dashed var(--border)", background: "rgba(255,255,255,0.01)" }}>
                  <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>
                    ห้องเรียนที่อนุญาตให้เข้าถึง / จัดการได้ *
                  </label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginBottom: 10 }}>
                    <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer", fontWeight: 700, color: "var(--smartaccess-purple)" }}>
                      <input
                        type="checkbox"
                        checked={editAdminAllowedRooms.includes("*")}
                        onChange={e => {
                          if (e.target.checked) {
                            setEditAdminAllowedRooms(["*"]);
                          } else {
                            setEditAdminAllowedRooms([]);
                          }
                        }}
                      />
                      ทุกห้องเรียน (*)
                    </label>
                  </div>

                  {!editAdminAllowedRooms.includes("*") && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 10 }}>
                      {roomsList.map(r => (
                        <label key={r.room} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={editAdminAllowedRooms.includes(r.room)}
                            onChange={e => {
                              if (e.target.checked) {
                                setEditAdminAllowedRooms(prev => [...prev.filter(x => x !== "*"), r.room]);
                              } else {
                                setEditAdminAllowedRooms(prev => prev.filter(x => x !== r.room));
                              }
                            }}
                          />
                          {r.room}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
                <button
                  type="button"
                  onClick={() => setEditingAdmin(null)}
                  className="btn-secondary"
                  style={{ flex: 1, justifyContent: "center", borderRadius: 12, padding: "12px" }}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={editAdminLoading}
                  className="btn-primary"
                  style={{ flex: 1, justifyContent: "center", borderRadius: 12, padding: "12px" }}
                >
                  {editAdminLoading ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
