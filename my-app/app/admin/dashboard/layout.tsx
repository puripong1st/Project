"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { DashboardProvider, useDashboard } from "./DashboardContext";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "../../components/ThemeProvider";
import DashboardCharts from "../../components/DashboardCharts";
import { AnimatedCounter } from "../../components/AnimatedCounter";

// formatDateTime function copy
function formatDateTimeLocal(dt: string | null | undefined): string {
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

// Countdown timer copy (since it's small and used in pending list, but we can declare it here or import it)
const PENDING_TIMEOUT_SECONDS = 300;
function PendingCountdownLocal({ registeredAt }: { registeredAt: string }) {
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

const ActivityIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 6 }}>
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
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

const MenuIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4 }}>
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

// ─── Idle timer hook copy ───
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

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProvider>
      <InnerLayout>{children}</InnerLayout>
    </DashboardProvider>
  );
}

const MetricCardSkeleton = () => (
  <div className="premium-card" style={{ padding: 20, background: "var(--bg-secondary)", display: "flex", alignItems: "center", gap: 16, animation: "pulse-soft 2s infinite" }}>
    <div style={{ width: 48, height: 48, borderRadius: 14, background: "var(--border-medium)" }} />
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ height: 24, width: "60%", background: "var(--border-medium)", borderRadius: 6 }} />
      <div style={{ height: 14, width: "40%", background: "var(--border)", borderRadius: 4 }} />
    </div>
  </div>
);

const ChartsSkeleton = () => (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20, marginBottom: 24 }} className="animate-fade-in">
    {[1, 2, 3].map(i => (
      <div key={i} className="premium-card" style={{ padding: 20, background: "var(--bg-secondary)", height: 320, display: "flex", flexDirection: "column", gap: 16, animation: "pulse-soft 2s infinite" }}>
        <div style={{ height: 20, width: "50%", background: "var(--border-medium)", borderRadius: 6 }} />
        <div style={{ flex: 1, background: "var(--border)", borderRadius: 12 }} />
      </div>
    ))}
  </div>
);

function InnerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const {
    tab, setTab,
    user,
    pendingCount,
    roomsList,
    stats,
    currentTime,
    toast,
    rejectModal,
    setRejectModal,
    rejectReason,
    setRejectReason,
    handleReject,
    loadingId,
    activeRoomDetails,
    setActiveRoomDetails,
    roomDetailsTab,
    setRoomDetailsTab,
    systemStatus,
    originUrl,
    roomWebhookRegisterInput,
    setRoomWebhookRegisterInput,
    roomWebhookApproveInput,
    setRoomWebhookApproveInput,
    roomWebhookLogsInput,
    setRoomWebhookLogsInput,
    roomTgRegisterInput, setRoomTgRegisterInput,
    roomTgApproveInput, setRoomTgApproveInput,
    roomTgLogsInput, setRoomTgLogsInput,
    roomLineRegisterInput, setRoomLineRegisterInput,
    roomLineApproveInput, setRoomLineApproveInput,
    roomLineLogsInput, setRoomLineLogsInput,
    roomTgTokenInput, setRoomTgTokenInput,
    roomLineTokenInput, setRoomLineTokenInput,
    handleSaveRoomWebhook,
    handleTestWebhook,
    roomDetailsLoading,
    firmwareMode,
    setFirmwareMode,
    copyToClipboard,
    getConfigCode,
    getArduinoCode,
    deleteModalOpen,
    setDeleteModalOpen,
    confirmPassword,
    setConfirmPassword,
    deleteLoading,
    setSystemStatus,
    fetchSystemStatus,
    fetchAll,
    fetchLogs,
    handleLogout,
    mobileMenuOpen,
    setMobileMenuOpen,
    showToast,
    rawSettings,
    setEditingAdmin,
    analyticsData,
    analyticsLoading,
    exportSummary
  } = useDashboard();

  const [showWarning, setShowWarning] = useState(false);
  // ช่องทางแจ้งเตือนที่กำลังตั้งค่าใน room modal (segmented selector)
  const [roomNotifyChannel, setRoomNotifyChannel] = useState<"discord" | "telegram" | "line">("discord");

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

  // Sync tab with pathname on load / path change and reset modal states
  useEffect(() => {
    if (pathname) {
      const endPath = pathname.split("/").pop();
      if (endPath && ["pending", "all", "admins", "settings", "rooms", "guide", "iot", "health"].includes(endPath)) {
        setTab(endPath as any);
      }
      // Reset open modal states when changing route/tab
      setEditingAdmin(null);
      setActiveRoomDetails(null);
    }
  }, [pathname, setTab, setEditingAdmin, setActiveRoomDetails]);

  const isOwner = user?.role === "owner";

  // Highlight Arduino C++ code helper in Layout
  const highlightArduinoCode = (code: string) => {
    const safeCode = code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    const tokenRegex = new RegExp(
      [
        `(\\/\\*[\\s\\S]*?\\*\\/)`,
        `(\\/\\/.*)`,
        `("[^"\\\\\\r\\n]*(?:\\\\.[^"\\\\\\r\\n]*)*")`,
        `(#include\\s+&lt;[^&]+&gt;|#include\\s+"[^"]+"|#define\\s+\\w+)`,
        `\\b(void|const|char|int|float|double|bool|while|if|else|new|return|setup|loop|String|StaticJsonDocument|DeserializationError|Adafruit_ILI9341|Adafruit_GFX|SPI)\\b`,
        `\\b(Serial|pinMode|digitalWrite|delay|WiFi|HTTPClient|WiFiClientSecure|deserializeJson|OUTPUT|INPUT|HIGH|LOW|WL_CONNECTED|tft|begin|setRotation|fillScreen|fillRect|drawRoundRect|fillCircle|setTextColor|setTextSize|setCursor|print|println|tone|ILI9341_WHITE|ILI9341_BLACK|ILI9341_GREEN|ILI9341_YELLOW|ILI9341_RED|RELAY_PIN|TFT_CS|TFT_DC|TFT_RST|LED_WIFI|LED_REJECT|BUZZER_PIN)\\b`,
        `\\b(\\d+|0x[0-9A-Fa-f]+)\\b`
      ].join("|"),
      "g"
    );

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

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="animate-spin" style={{ width: 42, height: 42, border: "4px solid rgba(124,58,237,0.2)", borderTopColor: "var(--smartaccess-purple)", borderRadius: "50%" }} />
      </div>
    );
  }

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
          background: var(--bg-secondary);
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
          background: var(--bg-secondary);
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
          background: var(--bg-secondary);
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

      {/* Rejection Reason Modal */}
      {rejectModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(30, 27, 75, 0.4)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", zIndex: 9999, padding: 24 }}>
          <div className="premium-card animate-fade-in" style={{ maxWidth: 440, width: "100%", padding: 28, background: "var(--bg-secondary)" }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
              <CrossIcon /> ปฏิเสธคำขอการลงทะเบียน
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: 13.5, marginBottom: 16 }}>
              นักศึกษา: <strong style={{ color: "var(--smartaccess-purple)" }}>{rejectModal.name}</strong>
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
            <button
              type="button"
              onClick={() => setActiveRoomDetails(null)}
              style={{ position: "absolute", top: 18, right: 18, width: 36, height: 36, borderRadius: 8, background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2 }}
            >
              ✕
            </button>

            <div style={{ padding: "24px 28px 18px", borderBottom: "1px solid var(--border)", background: "linear-gradient(135deg, rgba(124,58,237,0.06), rgba(219,39,119,0.04))" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 10px", borderRadius: 8, background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--smartaccess-purple)", fontSize: 12, fontWeight: 900, marginBottom: 10 }}>
                ESP32 Room Setup
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 900, color: "var(--text-primary)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                ห้อง {activeRoomDetails.room}
              </h3>
              <p style={{ color: "var(--text-secondary)", fontSize: 13, margin: "6px 0 0" }}>
                IP / Domain ของบอร์ด: <code style={{ color: "var(--smartaccess-purple)", fontWeight: 800 }}>{activeRoomDetails.ip}</code>
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8, margin: "18px 28px", background: "var(--bg-primary)", padding: 6, borderRadius: 8, border: "1px solid var(--border)" }}>
              {[
                { id: "api", label: "API & URLs", icon: <TerminalIcon /> },
                { id: "webhook", label: "ระบบแจ้งเตือน", icon: <FileTextIcon /> },
                { id: "arduino", label: "Arduino โค้ดบอร์ด (.ino)", icon: <SaveIcon /> }
              ].map(tabItem => (
                <button
                  key={tabItem.id}
                  type="button"
                  onClick={() => setRoomDetailsTab(tabItem.id as typeof roomDetailsTab)}
                  style={{
                    flex: 1,
                    padding: "11px 12px",
                    borderRadius: 8,
                    fontSize: 12.5,
                    fontWeight: 800,
                    cursor: "pointer",
                    border: "none",
                    background: roomDetailsTab === tabItem.id ? "linear-gradient(135deg, var(--smartaccess-purple) 0%, var(--edu-pink) 100%)" : "transparent",
                    color: roomDetailsTab === tabItem.id ? "#fff" : "var(--text-secondary)",
                    boxShadow: roomDetailsTab === tabItem.id ? "0 8px 18px rgba(124,58,237,0.18)" : "none",
                    transition: "all 0.2s"
                  }}
                >
                  <span style={{ marginRight: 6, display: "inline-flex", alignItems: "center", verticalAlign: "middle" }}>{tabItem.icon}</span>{tabItem.label}
                </button>
              ))}
            </div>

            <div style={{ minHeight: 300, maxHeight: "calc(90vh - 190px)", overflowY: "auto", padding: "0 28px 28px" }}>
              {roomDetailsTab === "api" && (() => {
                const liveRoomDev = systemStatus?.esp32Devices?.find((d: any) => d.room === activeRoomDetails.room);
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

              {roomDetailsTab === "webhook" && (() => {
                const CH = {
                  discord: { name: "Discord", icon: "🟣", color: "#7C3AED", tint: "rgba(124,58,237,0.08)" },
                  telegram: { name: "Telegram", icon: "✈️", color: "#229ED9", tint: "rgba(34,158,217,0.08)" },
                  line: { name: "LINE", icon: "💬", color: "#06C755", tint: "rgba(6,199,85,0.08)" },
                } as const;
                const room = activeRoomDetails.room;
                const mkTest = (type: "register" | "approve" | "logs", val: string) => () => {
                  if (roomNotifyChannel === "discord") return handleTestWebhook(val, type, room);
                  if (roomNotifyChannel === "telegram") return handleTestWebhook("", type, room, { channel: "telegram", botToken: roomTgTokenInput.trim() || rawSettings["telegram_bot_token"], chatId: val });
                  return handleTestWebhook("", type, room, { channel: "line", channelToken: roomLineTokenInput.trim() || rawSettings["line_channel_token"], targetId: val });
                };
                const rows = roomNotifyChannel === "discord"
                  ? [
                      { label: "📝 ลงทะเบียนเข้าห้องใหม่", val: roomWebhookRegisterInput, set: setRoomWebhookRegisterInput, type: "register" as const, ph: "https://discord.com/api/webhooks/..." },
                      { label: "🚪 อนุมัติ / เปิดประตูสำเร็จ", val: roomWebhookApproveInput, set: setRoomWebhookApproveInput, type: "approve" as const, ph: "https://discord.com/api/webhooks/..." },
                      { label: "📊 Log จราจร / บอร์ดออฟไลน์", val: roomWebhookLogsInput, set: setRoomWebhookLogsInput, type: "logs" as const, ph: "https://discord.com/api/webhooks/..." },
                    ]
                  : roomNotifyChannel === "telegram"
                  ? [
                      { label: "📝 ลงทะเบียนเข้าห้องใหม่", val: roomTgRegisterInput, set: setRoomTgRegisterInput, type: "register" as const, ph: "Chat ID เช่น -1001234567890" },
                      { label: "🚪 อนุมัติ / เปิดประตูสำเร็จ", val: roomTgApproveInput, set: setRoomTgApproveInput, type: "approve" as const, ph: "Chat ID เช่น -1001234567890" },
                      { label: "📊 Log จราจร / บอร์ดออฟไลน์", val: roomTgLogsInput, set: setRoomTgLogsInput, type: "logs" as const, ph: "Chat ID เช่น -1001234567890" },
                    ]
                  : [
                      { label: "📝 ลงทะเบียนเข้าห้องใหม่", val: roomLineRegisterInput, set: setRoomLineRegisterInput, type: "register" as const, ph: "User/Group ID เช่น Uxxxx หรือ Cxxxx" },
                      { label: "🚪 อนุมัติ / เปิดประตูสำเร็จ", val: roomLineApproveInput, set: setRoomLineApproveInput, type: "approve" as const, ph: "User/Group ID เช่น Uxxxx หรือ Cxxxx" },
                      { label: "📊 Log จราจร / บอร์ดออฟไลน์", val: roomLineLogsInput, set: setRoomLineLogsInput, type: "logs" as const, ph: "User/Group ID เช่น Uxxxx หรือ Cxxxx" },
                    ];
                const active = CH[roomNotifyChannel];
                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16, textAlign: "left" }} className="animate-fade-in">
                    <div style={{ padding: 14, background: "rgba(139,92,246,0.03)", border: "1px dashed rgba(139,92,246,0.25)", borderRadius: 10 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: "var(--smartaccess-purple-dark)" }}>🔔 การแจ้งเตือนเฉพาะห้อง {activeRoomDetails.room} (Per-Room Notification Routing)</span>
                      <p style={{ color: "var(--text-secondary)", fontSize: 11.5, margin: "6px 0 0 0", lineHeight: "1.5" }}>
                        ตั้งปลายทางแยกเฉพาะห้องนี้ได้ 3 แชนแนล (ลงทะเบียน / อนุมัติ / Log) หากเว้นว่างจะใช้ค่าส่วนกลางจากแท็บ &quot;ตั้งค่าระบบ&quot;
                        {roomNotifyChannel !== "discord" && <> — สามารถระบุ Token แยกเฉพาะห้องได้ (หากเว้นว่างจะใช้ Token ส่วนกลางจากระบบ)</>}
                      </p>
                    </div>

                    {/* Segmented channel selector */}
                    <div style={{ display: "flex", gap: 8, background: "var(--bg-primary)", padding: 6, borderRadius: 10, border: "1px solid var(--border)" }}>
                      {(["discord", "telegram", "line"] as const).map(ch => (
                        <button
                          key={ch}
                          type="button"
                          onClick={() => setRoomNotifyChannel(ch)}
                          style={{
                            flex: 1, padding: "9px 12px", borderRadius: 8, fontSize: 12.5, fontWeight: 800, cursor: "pointer",
                            background: roomNotifyChannel === ch ? CH[ch].color : "transparent",
                            color: roomNotifyChannel === ch ? "#fff" : "var(--text-secondary)",
                            border: roomNotifyChannel === ch ? `1.5px solid ${CH[ch].color}` : "1.5px solid transparent",
                            boxShadow: roomNotifyChannel === ch ? `0 6px 14px ${CH[ch].tint}` : "none",
                            transition: "all 0.15s"
                          }}
                        >
                          {CH[ch].icon} {CH[ch].name}
                        </button>
                      ))}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: 16, borderRadius: 12, background: active.tint, border: `1px solid ${active.color}22` }}>
                      {roomNotifyChannel === "telegram" && (
                        <div style={{ borderBottom: `1px dashed ${active.color}33`, paddingBottom: 12, marginBottom: 4 }}>
                          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                            🔑 Telegram Bot Token เฉพาะห้องนี้ (เว้นว่างไว้เพื่อใช้บอร์ดตัวกลาง)
                          </label>
                          <input
                            className="smartaccess-input"
                            placeholder="ตัวอย่าง: 123456789:ABC..."
                            value={roomTgTokenInput}
                            onChange={e => setRoomTgTokenInput(e.target.value)}
                            style={{ width: "100%", padding: "10px 14px", fontSize: 12.5 }}
                          />
                        </div>
                      )}

                      {roomNotifyChannel === "line" && (
                        <div style={{ borderBottom: `1px dashed ${active.color}33`, paddingBottom: 12, marginBottom: 4 }}>
                          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                            🔑 LINE Channel Access Token เฉพาะห้องนี้ (เว้นว่างไว้เพื่อใช้บอร์ดตัวกลาง)
                          </label>
                          <input
                            className="smartaccess-input"
                            placeholder="กรอก Access Token เฉพาะห้องนี้..."
                            value={roomLineTokenInput}
                            onChange={e => setRoomLineTokenInput(e.target.value)}
                            style={{ width: "100%", padding: "10px 14px", fontSize: 12.5 }}
                          />
                        </div>
                      )}
                      {rows.map((f, i) => (
                        <div key={i}>
                          <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>{f.label}</label>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <input
                              className="smartaccess-input"
                              placeholder={f.ph}
                              value={f.val}
                              onChange={e => f.set(e.target.value)}
                              style={{ flex: 1, padding: "10px 14px", fontSize: 12.5 }}
                            />
                            <button
                              type="button"
                              onClick={mkTest(f.type, f.val)}
                              className="btn-ghost"
                              style={{ padding: "10px 14px", fontSize: 11.5, borderRadius: 10, flexShrink: 0, fontWeight: 700, borderColor: `${active.color}66`, color: active.color }}
                            >
                              🧪 ทดสอบ
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* sticky footer — กันปุ่มถูก modal clip/กลืน */}
                    <div style={{ position: "sticky", bottom: 0, marginTop: 4, paddingTop: 14, paddingBottom: 4, background: "linear-gradient(to top, var(--bg-secondary) 70%, transparent)", display: "flex", justifyContent: "flex-end" }}>
                      <button
                        type="button"
                        onClick={handleSaveRoomWebhook}
                        disabled={roomDetailsLoading}
                        className="btn-success"
                        style={{
                          padding: "12px 22px", borderRadius: 10, fontWeight: 800, fontSize: 13,
                          background: "linear-gradient(135deg, var(--smartaccess-purple) 0%, var(--edu-pink) 100%)",
                          color: "#fff", boxShadow: "0 6px 16px rgba(124,58,237,0.28)", border: "none", cursor: "pointer"
                        }}
                      >
                        {roomDetailsLoading ? "⏳ กำลังเซฟ..." : "💾 บันทึกการแจ้งเตือนประจำห้อง"}
                      </button>
                    </div>
                  </div>
                );
              })()}

              {roomDetailsTab === "arduino" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16, textAlign: "left" }} className="animate-fade-in">
                  <div style={{ padding: 14, background: "rgba(16,185,129,0.03)", border: "1px dashed rgba(16,185,129,0.25)", borderRadius: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "#059669" }}>🔌 Secure IoT C++ (.ino) Code Generator</span>
                    <p style={{ color: "var(--text-secondary)", fontSize: 11.5, margin: "6px 0 0 0", lineHeight: "1.4" }}>
                      เพื่อความปลอดภัยขั้นสูง ระบบได้ทำการแยกการตั้งค่าความลับ (WiFi, API Key, CA Cert) ออกจากโค้ดระบบควบคุมหลักอย่างเป็นระบบ โดยแยกเป็นไฟล์ <code>config.h</code> และ <code>esp32.ino</code> ดังแสดงด้านล่างนี้
                    </p>
                  </div>

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

                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text-primary)" }}>1. ไฟล์การตั้งค่าความลับ (config.h)</span>
                    <p style={{ color: "var(--text-secondary)", fontSize: 11.5, margin: "2px 0 6px 0", lineHeight: 1.4 }}>
                      โปรดสร้างไฟล์ชื่อ <code>config.h</code> ไว้ในโฟลเดอร์เดียวกับโปรเจกต์ Arduino ของท่าน แล้วคัดลอกโค้ดด้านล่างนี้ไปใส่ เพื่อแยกความลับและคีย์ความปลอดภัยออกจากไฟล์โปรแกรมหลัก (อย่าลืมแก้ไข API Key ให้เป็นคีย์ที่ปลอดภัยและไม่ซ้ำกันในแต่ละบอร์ด)
                    </p>

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

                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text-primary)" }}>2. esp32.ino (ไฟล์โปรแกรมหลัก)</span>
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
                <span>{isOwner ? "Owner (เจ้าของระบบ)" : user.role === "log_viewer" ? "Viewer (ผู้เยี่ยมชม)" : "Door Operator"}</span>
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
                { id: "settings", icon: <SettingsIcon />, label: "ตั้งค่าการแจ้งเตือน", badge: 0 },
              ] : []),
              { id: "health", icon: <ActivityIcon />, label: "สถานะเซิร์ฟเวอร์ & DB", badge: 0 },
              { id: "guide", icon: <FileTextIcon />, label: "คู่มือการใช้งานระบบ", badge: 0 },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setTab(item.id as typeof tab);
                  setMobileMenuOpen(false);
                  router.push(`/admin/dashboard/${item.id}`);
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
            <button
              type="button"
              onClick={toggleTheme}
              className="btn-secondary"
              style={{ padding: "10px", borderRadius: 12, fontSize: 12.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer" }}
            >
              {theme === "light" ? "🌙 โหมดมืด (Dark Mode)" : "☀️ โหมดสว่าง (Light Mode)"}
            </button>
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
                  {tab === "rooms" && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: "var(--smartaccess-purple)", display: "inline-flex" }}>
                        <TVIcon />
                      </span>
                      <span>ห้องเรียน & ESP32</span>
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
                      <span>ตั้งค่าการแจ้งเตือน</span>
                    </span>
                  )}
                   {tab === "guide" && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <FileTextIcon />
                      <span>คู่มือการใช้งานระบบ & IoT</span>
                    </span>
                  )}
                  {tab === "health" && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <ActivityIcon />
                      <span>สถานะและความเสถียรของระบบ (System Health)</span>
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
              {!systemStatus ? (
                <>
                  <MetricCardSkeleton />
                  <MetricCardSkeleton />
                  <MetricCardSkeleton />
                  <MetricCardSkeleton />
                </>
              ) : (
                <>
                  {/* Card 1: Pending Queue */}
                  <div className="premium-card hover-card hover-spin" style={{ padding: 20, background: "var(--bg-secondary)", display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(245, 158, 11, 0.1)", border: "1.5px solid rgba(245, 158, 11, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#F59E0B" }}>
                      <ClockIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <div style={{ fontSize: 24, fontWeight: 900, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                        <AnimatedCounter value={pendingCount} suffix=" คน" />
                      </div>
                      <div style={{ fontSize: 11.5, color: "var(--text-secondary)", fontWeight: 700, marginTop: 2 }}>กำลังรออนุมัติสิทธิ์</div>
                    </div>
                  </div>

                  {/* Card 2: Door Opens Today */}
                  <div className="premium-card hover-card hover-spin" style={{ padding: 20, background: "var(--bg-secondary)", display: "flex", alignItems: "center", gap: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(16, 185, 129, 0.1)", border: "1.5px solid rgba(16, 185, 129, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#10B981" }}>
                      <UnlockIcon />
                    </div>
                    <div>
                      <div style={{ fontSize: 24, fontWeight: 900, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                        <AnimatedCounter value={stats.doorOpensToday} suffix=" ครั้ง" />
                      </div>
                      <div style={{ fontSize: 11.5, color: "var(--text-secondary)", fontWeight: 700, marginTop: 2 }}>
                        ผ่านประตูวันนี้ (Bypass: <AnimatedCounter value={stats.bypassToday} />)
                      </div>
                    </div>
                  </div>

                  {/* Card 3: ESP32 Hardware Status */}
                  <div
                    className="premium-card hover-card hover-spin"
                    onClick={() => {
                      setTab("rooms");
                      router.push("/admin/dashboard/rooms");
                    }}
                    style={{ padding: 20, background: "var(--bg-secondary)", display: "flex", alignItems: "center", gap: 16, cursor: "pointer" }}
                  >
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(124, 58, 237, 0.1)", border: "1.5px solid rgba(124, 58, 237, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--smartaccess-purple)" }}>
                      <TVIcon />
                    </div>
                    <div>
                      <div style={{ fontSize: 24, fontWeight: 900, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums" }}>
                        <AnimatedCounter value={stats.onlineBoards} /> / <AnimatedCounter value={stats.totalBoards} suffix=" บอร์ด" />
                      </div>
                      <div style={{ fontSize: 11.5, color: "var(--text-secondary)", fontWeight: 700, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: stats.onlineBoards > 0 ? "#10B981" : "#EF4444" }} />
                        <span>บอร์ดเชื่อมต่อออนไลน์อยู่</span>
                      </div>
                    </div>
                  </div>

                  {/* Card 4: Discord Webhook Status */}
                  <div
                    className="premium-card hover-card hover-spin"
                    onClick={() => {
                      setTab("settings");
                      router.push("/admin/dashboard/settings");
                    }}
                    style={{ padding: 20, background: "var(--bg-secondary)", display: "flex", alignItems: "center", gap: 16, cursor: "pointer" }}
                  >
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: "rgba(219, 39, 119, 0.1)", border: "1.5px solid rgba(219, 39, 119, 0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--edu-pink)" }}>
                      <SettingsIcon />
                    </div>
                    <div>
                      <div style={{ fontSize: 24, fontWeight: 900, color: "var(--text-primary)" }}>
                        {systemStatus?.discord?.configured ? "เชื่อมต่อ" : "ไม่ได้ใส่"}
                      </div>
                      <div style={{ fontSize: 11.5, color: "var(--text-secondary)", fontWeight: 700, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: systemStatus?.discord?.configured ? "#10B981" : "#F59E0B" }} />
                        <span>ช่องทางแจ้งเตือน</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* ── Recharts Analytics Section (Shown only in the landing pending requests view) ── */}
            {tab === "pending" && (
              <>
                {(analyticsLoading || !analyticsData) ? (
                  <ChartsSkeleton />
                ) : (
                  <DashboardCharts analyticsData={analyticsData} exportSummary={exportSummary} />
                )}
              </>
            )}

            {/* Render children sub-routes pages with active fadeInUp animation on tab change */}
            <div key={tab} className="animate-fade-in">
              {children}
            </div>

          </div>
        </main>
      </div>

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
    </div>
  );
}
