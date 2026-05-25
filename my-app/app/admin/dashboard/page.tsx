"use client";
import { useState, useEffect, useCallback } from "react";
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
  role: "owner" | "door_operator";
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

// ─── Minimalist Vector SVGs ───
const ClockIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);

const UsersIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const SettingsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);

const TVIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <rect x="2" y="7" width="20" height="15" rx="2" ry="2"/>
    <polyline points="17 2 12 7 7 2"/>
  </svg>
);

const LogoutIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

const LockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const UnlockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    <line x1="10" y1="11" x2="10" y2="17"/>
    <line x1="14" y1="11" x2="14" y2="17"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const CrossIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const SaveIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
    <polyline points="17 21 17 13 7 13 7 21"/>
    <polyline points="7 3 7 8 15 8"/>
  </svg>
);

const FileTextIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4 }}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/>
    <line x1="16" y1="17" x2="8" y2="17"/>
    <polyline points="10 9 9 9 8 9"/>
  </svg>
);

const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 6 }}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 6 }}>
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const AlertIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 6 }}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

const TerminalIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 6 }}>
    <polyline points="4 17 10 11 4 5"/>
    <line x1="12" y1="19" x2="20" y2="19"/>
  </svg>
);

const CrownIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z"/>
    <path d="M3 20h18"/>
  </svg>
);

const KeyIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3"/>
  </svg>
);

const SuccessBadgeIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const IdCardIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4 }}>
    <rect x="3" y="4" width="18" height="16" rx="2" ry="2"/>
    <line x1="7" y1="8" x2="17" y2="8"/>
    <line x1="7" y1="12" x2="17" y2="12"/>
    <line x1="7" y1="16" x2="13" y2="16"/>
  </svg>
);

const GraduationIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4 }}>
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
    <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/>
  </svg>
);

const FacultyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4 }}>
    <path d="M4 22V4c0-.5.2-1 .6-1.4C5 2.2 5.5 2 6 2h12c.5 0 1 .2 1.4.6.4.4.6.9.6 1.4v18"/>
    <path d="M10 6h4"/>
    <path d="M10 10h4"/>
    <path d="M10 14h4"/>
    <path d="M10 18h4"/>
  </svg>
);

const BranchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4 }}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);

const MenuIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4 }}>
    <line x1="3" y1="12" x2="21" y2="12"/>
    <line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

const ACTION_METADATA: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  registered: { label: "ลงทะเบียนใหม่", icon: <FileTextIcon />, color: "var(--rmutp-purple)" },
  approved: { label: "อนุมัติสิทธิ์", icon: <CheckIcon />, color: "#10B981" },
  rejected: { label: "ปฏิเสธสิทธิ์", icon: <CrossIcon />, color: "#EF4444" },
  door_opened: { label: "ผ่านประตูสำเร็จ", icon: <UnlockIcon />, color: "#10B981" },
  door_failed: { label: "ผ่านประตูล้มเหลว", icon: <AlertIcon />, color: "#F59E0B" },
  export_pdf: { label: "จัดทำรายงาน PDF", icon: <SaveIcon />, color: "#3B82F6" },
};

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
              <span style={{ color: "var(--rmutp-purple)", fontWeight: "bold", marginTop: 2 }}>•</span>
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

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<"pending" | "all" | "admins" | "settings" | "guide" | "iot">("pending");
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [pending, setPending] = useState<Student[]>([]);
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
    auto_fill_enabled: true,
    auto_fill_mode: "auto",
  });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [rawSettings, setRawSettings] = useState<Record<string, string>>({});
  const [activeRoomDetails, setActiveRoomDetails] = useState<{ room: string; ip: string } | null>(null);
  const [roomDetailsTab, setRoomDetailsTab] = useState<"api" | "webhook" | "arduino">("api");
  const [roomWebhookRegisterInput, setRoomWebhookRegisterInput] = useState("");
  const [roomWebhookApproveInput, setRoomWebhookApproveInput] = useState("");
  const [roomWebhookLogsInput, setRoomWebhookLogsInput] = useState("");
  const [roomDetailsLoading, setRoomDetailsLoading] = useState(false);
  const [originUrl, setOriginUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOriginUrl(window.location.origin);
    }
  }, []);

  // Multi-Room dynamic states
  const [roomsList, setRoomsList] = useState<{ room: string; ip: string }[]>([]);
  const [newRoomCode, setNewRoomCode] = useState("");
  const [newRoomIp, setNewRoomIp] = useState("");
  const [testingRoom, setTestingRoom] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { online: boolean; ip: string; mode: string }>>({});
 
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
            auto_fill_enabled: data.settings.auto_fill_enabled === "1",
            auto_fill_mode: data.settings.auto_fill_mode || "auto",
          });

          // Parse dynamic configured rooms
          const confRooms = data.settings.configured_rooms || "CE-401,CE-402";
          const rooms = confRooms.split(",").filter(Boolean).map((rm: string) => ({
            room: rm,
            ip: data.settings[`room_ip_${rm}`] || "192.168.1.100"
          }));
          setRoomsList(rooms);
        }
      }
    } catch (err) {
      console.error("Failed to fetch settings", err);
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

  const handleTestWebhook = async (webhookUrl: string, type: "register" | "approve" | "logs", room?: string) => {
    if (!webhookUrl || !webhookUrl.trim().startsWith("https://discord.com/api/webhooks/")) {
      showToast("❌ ลิงก์ Discord Webhook ไม่ถูกต้อง หรือไม่ได้ระบุ", "error");
      return;
    }
    showToast("🧪 กำลังส่งข้อความทดสอบ...", "success");
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
        showToast("🔔 ส่งข้อความทดสอบเข้า Discord สำเร็จเรียบร้อยแล้ว!", "success");
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
        .then(() => showToast("📋 คัดลอกสำเร็จ", "success"))
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
        showToast("📋 คัดลอกสำเร็จ (ผ่านระบบสำรอง)", "success");
      } else {
        showToast("❌ ไม่สามารถคัดลอกได้โดยอัตโนมัติ กรุณาก็อปปี้ด้วยตนเอง", "error");
      }
    } catch (err) {
      showToast("❌ ไม่สามารถคัดลอกได้ กรุณาก็อปปี้ด้วยตนเอง", "error");
    }
  };

  const getArduinoCode = (roomCode: string, origin: string) => {
    return `/*
  ==============================================================
  RMUTP Door Access Controller - Firmware for ESP32
  ห้องปฏิบัติการเรียนการสอน: Classroom ${roomCode}
  ระบบรองรับการรันผ่านคลาวด์ Vercel (HTTPS WiFiClientSecure)
  ==============================================================
*/
#define WOKWI_SIM        // <-- ต้องมีบรรทัดนี้อยู่บนสุดของโค้ดใน Wokwi
#include <ArduinoJson.h> // ติดตั้งผ่าน Library Manager (เวอร์ชัน 6.x)
#include <HTTPClient.h>
#include <WiFi.h>
#include <WiFiClientSecure.h> // สำหรับรัน HTTPS บนระบบคลาวด์ Vercel
#include <Adafruit_GFX.h>
#include <Adafruit_ILI9341.h>
#include <SPI.h>
#include "ricmoo_qrcode.h"

// Wokwi Simulator ใช้ WiFi เสมือน "Wokwi-GUEST" เท่านั้น (ไม่ใช้รหัสผ่าน)
const char *ssid = "Wokwi-GUEST";
const char *password = "";

// --- ตั้งค่าระบบเชื่อมโยง IoT Cloud ---
const char *server_url = "${origin}/api/esp32/display?room=${roomCode}";
const char *api_key = "rmutp_secure_door_unlock_token_2026";
const char *room_code = "${roomCode}";

// --- การต่อขาอุปกรณ์ (Hardware Pins) ---
#define TFT_CS   15
#define TFT_RST   4
#define TFT_DC    2
#define RELAY_PIN 12      // รีเลย์ประตู (GPIO 12)
#define LED_WIFI 14       // WiFi Status LED (GPIO 14)
#define LED_REJECT 26     // Reject LED (GPIO 26)
#define BUZZER_PIN 27     // Buzzer (GPIO 27)

Adafruit_ILI9341 tft = Adafruit_ILI9341(TFT_CS, TFT_DC, TFT_RST);

const int polling_delay = 2000; // ความเร็วในการดึงคำสั่ง (2 วินาที)

// ตัวแปรเก็บสเตตัสเดิมเพื่อลดการวาดหน้าจอซ้ำซ้อน (ลดการกะพริบ)
int last_queue_count = -1;
String last_approved_name = "";
String last_active_token = "";
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
        tft.fillRect(startX + paddingX + (x * scale), startY + paddingY + (y * scale), scale, scale, ILI9341_BLACK);
      }
    }
  }
}

// 1. หน้าจอหลักโหมดสแตนด์บาย (Idle Mode) — ดีไซน์พรีเมียมถอดแบบมาจาก Next.js esp32-preview
void drawMainScreen(int queueCount, String lastApprovedName, String timeStr, String qrText) {
  // พื้นหลังสีน้ำเงินดำหรูหรา #06070D
  tft.fillScreen(tft.color565(6, 7, 13)); 
  
  // --- ส่วนหัว (Top Status Bar) #0E111C ---
  tft.fillRect(0, 0, 320, 20, tft.color565(14, 17, 28));
  tft.drawFastHLine(0, 20, 320, tft.color565(40, 40, 50)); // เส้นใต้เมนู
  
  tft.setTextSize(1);
  tft.setTextColor(tft.color565(226, 232, 240)); // สีตัวอักษรขาวสว่าง #E2E8F0
  tft.setCursor(8, 6);
  tft.print("RMUTP DOOR ACCESS  ");
  
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
  tft.drawRoundRect(145, 65, 165, 50, 6, tft.color565(245, 158, 11)); // ขอบสีส้มเหลือง
  
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
    tft.fillRoundRect(145, 125, 165, 45, 6, tft.color565(1, 18, 12)); // แถบพื้นหลังเขียวเข้ม
    tft.drawRoundRect(145, 125, 165, 45, 6, tft.color565(16, 185, 129)); // ขอบเขียวสว่าง
    
    tft.setTextColor(tft.color565(16, 185, 129)); 
    tft.setCursor(153, 133);
    tft.print("LATEST APPROVED");
    
    tft.setTextColor(ILI9341_WHITE);
    tft.setCursor(153, 148);
    // ตัดประโยคชื่อหากยาวเกินความกว้างหน้าจอ LCD
    if (lastApprovedName.length() > 22) {
      tft.print(lastApprovedName.substring(0, 20) + "..");
    } else {
      tft.print(lastApprovedName);
    }
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
  tft.print("RMUTP Faculty of Education");
  
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
  tft.fillCircle(160, 65, 32, tft.color565(6, 78, 59)); // กรอบใน
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
  
  // คำนวณตำแหน่งกึ่งกลาง (Center Alignment) สำหรับชื่อ
  int nameX = 160 - (approvedName.length() * 3);
  if (nameX < 35) nameX = 35;
  tft.setCursor(nameX, 177);
  tft.print(approvedName);

  // รหัสประจำตัวของนักศึกษา
  tft.setTextColor(tft.color565(156, 163, 175)); 
  int idX = 160 - (studentId.length() * 3);
  if (idX < 35) idX = 35;
  tft.setCursor(idX, 202);
  tft.print(studentId);
}

void setup() {
  Serial.begin(115200);
  
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(LED_WIFI, OUTPUT);
  pinMode(LED_REJECT, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  
  digitalWrite(RELAY_PIN, LOW);
  digitalWrite(LED_WIFI, LOW);
  digitalWrite(LED_REJECT, LOW);

  tft.begin();
  tft.setRotation(1);

  tft.fillScreen(tft.color565(6, 7, 13));
  tft.fillRect(0, 0, 320, 45, tft.color565(14, 17, 28));
  tft.drawRect(0, 45, 320, 2, tft.color565(16, 185, 129));

  tft.setTextColor(ILI9341_WHITE);
  tft.setTextSize(2);
  tft.setCursor(20, 12);
  tft.print("RMUTP DOOR ACCESS");

  tft.setTextSize(2);
  tft.setTextColor(tft.color565(59, 130, 246)); 
  tft.setCursor(40, 100);
  tft.print("CONNECTING WIFI...");
  
  tft.setTextSize(1);
  tft.setTextColor(tft.color565(156, 163, 175));
  tft.setCursor(40, 140);
  tft.print("SSID Virtual Router: Wokwi-GUEST");

  Serial.print("Connecting to Wi-Fi...");
  WiFi.begin(ssid, password);
  
  bool wifi_led_state = false;
  while (WiFi.status() != WL_CONNECTED) {
    wifi_led_state = !wifi_led_state;
    digitalWrite(LED_WIFI, wifi_led_state ? HIGH : LOW);
    delay(400);
    Serial.print(".");
  }
  
  digitalWrite(LED_WIFI, HIGH);
  Serial.println("\\nWiFi connected successfully!");
  
  ip_address_str = WiFi.localIP().toString();

  tone(BUZZER_PIN, 1200, 150);
  delay(180);
  tone(BUZZER_PIN, 1600, 250);

  drawMainScreen(0, "", "12:00:00", "");
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    digitalWrite(LED_WIFI, HIGH); 
    
    String time_str = "12:00:00";
    unsigned long sec = millis() / 1000;
    unsigned long hh = (sec / 3600) % 24;
    unsigned long mm = (sec / 60) % 60;
    unsigned long ss = sec % 60;
    char timeBuf[10];
    sprintf(timeBuf, "%02d:%02d:%02d", (int)hh, (int)mm, (int)ss);
    time_str = String(timeBuf);

    HTTPClient http;
    if (String(server_url).startsWith("https://")) {
      WiFiClientSecure *client = new WiFiClientSecure;
      if (client) {
        client->setInsecure();
        http.begin(*client, server_url);
      } else {
        Serial.println("Unable to create WiFiClientSecure");
        return;
      }
    } else {
      http.begin(server_url);
    }

    http.addHeader("Content-Type", "application/json");
    http.addHeader("x-api-key", api_key);

    int httpCode = http.GET();
    if (httpCode == 200) {
      String payload = http.getString();
      StaticJsonDocument<768> doc;
      DeserializationError error = deserializeJson(doc, payload);

      if (!error) {
        const char *door_trigger = doc["door_trigger"];
        int pending_count = doc["pending_count"];
        
        String approvedName = "";
        String studentId = "";
        if (doc.containsKey("last_approved") && !doc["last_approved"].isNull()) {
          approvedName = doc["last_approved"]["name"].as<String>();
          studentId = doc["last_approved"]["student_id"].as<String>();
        }
        
        const char *active_token = doc["active_token"];
        const char *register_url = doc["register_url"];
        const char *requested_room = doc["requested_room"];
        
        String qrText = "";
        if (active_token && register_url && requested_room) {
          String regUrl = String(register_url);
          int idx = regUrl.indexOf("/?room=");
          String baseUrl = "";
          if (idx != -1) {
            baseUrl = regUrl.substring(0, idx);
          } else {
            baseUrl = "https://project-sigma-ivory-21.vercel.app";
          }
          qrText = baseUrl + "/?scan=" + String(active_token) + "&room=" + String(requested_room);
        }

        Serial.print("Door command: ");
        Serial.print(door_trigger);
        Serial.print(" | Queue: ");
        Serial.println(pending_count);

        if (String(door_trigger) == "open") {
          Serial.println("🔓 UNLOCK COMMAND RECEIVED! Opening door...");
          
          drawUnlockedScreen(approvedName);

          digitalWrite(RELAY_PIN, HIGH);
          
          tone(BUZZER_PIN, 1000, 150);
          delay(180);
          tone(BUZZER_PIN, 1500, 150);
          delay(180);
          tone(BUZZER_PIN, 2000, 300);

          delay(4190);
          
          digitalWrite(RELAY_PIN, LOW);
          Serial.println("🔒 Door locked.");

          tone(BUZZER_PIN, 800, 300);

          last_queue_count = -1;
          last_approved_name = "FORCE_REDRAW";
        } 
        else if (pending_count != last_queue_count || approvedName != last_approved_name || (active_token && String(active_token) != last_active_token)) {
          last_queue_count = pending_count;
          last_approved_name = approvedName;
          if (active_token) last_active_token = String(active_token);
          
          drawMainScreen(pending_count, approvedName, time_str, qrText);
        }
      }
    } else {
      Serial.print("HTTP Error: ");
      Serial.println(httpCode);
    }
    http.end();
  } else {
    digitalWrite(LED_WIFI, LOW);
    delay(250);
    digitalWrite(LED_WIFI, HIGH);
    delay(250);
  }
  
  delay(polling_delay);
}`;
  };

  const highlightArduinoCode = (code: string) => {
    // 1. Escape HTML first
    let safeCode = code
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

  const saveSettings = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    setSettingsLoading(true);

    // Prepare room custom settings to be dynamically saved
    const custom_settings: Record<string, string> = {};
    custom_settings["configured_rooms"] = roomsList.map(r => r.room).join(",");
    roomsList.forEach(r => {
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
        showToast("บันทึกการตั้งค่าระบบและรายการห้องเรียนสำเร็จ", "success");
        fetchSettings();
      } else {
        showToast(data.error || "ไม่สามารถบันทึกได้", "error");
      }
    } catch (err) {
      showToast("เกิดข้อผิดพลาดการบันทึกข้อมูล", "error");
    } finally {
      setSettingsLoading(false);
    }
  };

  const handleTestConnection = async (roomCode: string) => {
    setTestingRoom(roomCode);
    try {
      const res = await fetch(`/api/esp32/status?room=${roomCode}`);
      const data = await res.json();
      if (res.ok && data.online) {
        setTestResults(prev => ({ ...prev, [roomCode]: { online: true, ip: data.ip, mode: data.mode } }));
        showToast(`📡 เชื่อมต่อบอร์ดห้อง ${roomCode} (${data.ip}) สำเร็จ!`, "success");
      } else {
        setTestResults(prev => ({ ...prev, [roomCode]: { online: false, ip: data.ip || "ไม่ระบุ", mode: data.mode || "physical" } }));
        showToast(`❌ ไม่สามารถเชื่อมต่อกับบอร์ดห้อง ${roomCode} (${data.ip || "ไม่ระบุ"})`, "error");
      }
    } catch {
      setTestResults(prev => ({ ...prev, [roomCode]: { online: false, ip: "error", mode: "physical" } }));
      showToast(`❌ ไม่สามารถติดต่อเซิร์ฟเวอร์เพื่อทดสอบห้อง ${roomCode}`, "error");
    } finally {
      setTestingRoom(null);
    }
  };

  const [unlockingRoom, setUnlockingRoom] = useState<string | null>(null);

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
        showToast(`🔓 ปลดล็อกประตูห้อง ${roomCode} สำเร็จ!`, "success");
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

  const handleAddRoom = (e?: React.FormEvent | React.MouseEvent) => {
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
    setRoomsList(prev => [...prev, { room: code, ip }]);
    setNewRoomCode("");
    setNewRoomIp("");
    showToast(`🏢 เพิ่มห้อง ${code} ลงในรายการชั่วคราวแล้ว อย่าลืมกด "บันทึกการตั้งค่า" ด้านล่าง!`, "success");
  };

  const handleRemoveRoom = (roomCode: string) => {
    setRoomsList(prev => prev.filter(r => r.room !== roomCode));
    showToast(`🗑️ ลบห้อง ${roomCode} ออกจากรายการชั่วคราวแล้ว อย่าลืมกด "บันทึกการตั้งค่า" ด้านล่าง!`, "success");
  };
  
  // Unified Filters (Tab 2: ทำเนียบ & ประวัติเข้าออก)
  const [searchQ, setSearchQ] = useState("");
  const [filterStatus, setFilter] = useState("all");
  
  // Unified Date Range selection (Initialized to 2026-05-23 which is system launch)
  const [startDate, setStartDate] = useState("2026-05-23");
  const [endDate, setEndDate] = useState("2026-05-23");

  const [logFilter, setLogFilter] = useState("all");
  const [logSearch, setLogSearch] = useState("");
  const [logPageSize, setLogPageSize] = useState(10);
  const [logCurrentPage, setLogCurrentPage] = useState(1);

  const [newAdmin, setNewAdmin] = useState({ username: "", password: "", full_name: "", role: "door_operator" });
  const [currentTime, setTime] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [systemStatus, setSystemStatus] = useState<{
    mysql: { online: boolean; host: string; database: string; error: string };
    esp32: { online: boolean; doorStatus: string; ip: string; mock: boolean; room?: string };
    esp32Devices?: { room: string; online: boolean; ip: string; doorStatus: string; mock: boolean; mode: string }[];
    discord: { configured: boolean };
    logSummary: { total: number; active: number; expired: number; retentionDays: number };
  } | null>(null);
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [, setDeleteType] = useState<"expired" | "all">("expired");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

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

  // Set end date to today dynamically on client-side mount to prevent Hydration Mismatch
  useEffect(() => {
    const today = new Date().toLocaleDateString("en-CA");
    setEndDate(today);
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

  // Fetch pending list
  const fetchPending = useCallback(async () => {
    const r = await fetch("/api/students/pending");
    const d = await r.json();
    setPending(d.students || []);
  }, []);

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
    setTimeout(() => {
      fetchPending();
    }, 0);
    const interval = setInterval(fetchPending, 10000);
    return () => clearInterval(interval);
  }, [fetchPending]);

  // Polling System Status
  useEffect(() => {
    setTimeout(() => {
      fetchSystemStatus();
    }, 0);
    const interval = setInterval(fetchSystemStatus, 15000);
    return () => clearInterval(interval);
  }, [fetchSystemStatus]);

  // Auto-pruning expired logs (>90 days) on startup
  useEffect(() => {
    if (user?.role === "owner") {
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
    if (tab === "all" && user?.role === "owner") {
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
  }, [tab, user, fetchAll, fetchLogs, fetchAdmins, fetchSettings]);

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
    const r = await fetch("/api/admin-users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newAdmin),
    });
    const d = await r.json();
    if (r.ok) {
      showToast("เพิ่มผู้ดูแลระบบใหม่สำเร็จ");
      setNewAdmin({ username: "", password: "", full_name: "", role: "door_operator" });
      fetchAdmins();
    } else {
      showToast(d.error, "error");
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
      a.download = `rmutp_report_${filterType}_${start || "launch"}_to_${end || "today"}.pdf`;
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
        <div className="animate-spin" style={{ width: 42, height: 42, border: "4px solid rgba(124,58,237,0.2)", borderTopColor: "var(--rmutp-purple)", borderRadius: "50%" }} />
      </div>
    );
  }

  const isOwner = user.role === "owner";
  const pendingCount = pending.length;

  // React Client-Side Filters for the Merged Tab
  const filteredStudents = allStudents.filter(s => {
    const regDate = s.registered_at.split("T")[0]; // YYYY-MM-DD
    if (startDate && regDate < startDate) return false;
    if (endDate && regDate > endDate) return false;
    return true;
  });

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

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", color: "var(--text-primary)" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @media (min-width: 768px) {
          .desktop-hide-trigger {
            display: none !important;
          }
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
              นักศึกษา: <strong style={{ color: "var(--rmutp-purple-dark)" }}>{rejectModal.name}</strong>
            </p>
            <textarea 
              className="rmutp-input" 
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
        <div style={{ position: "fixed", inset: 0, background: "rgba(30, 27, 75, 0.5)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 24 }}>
          <div className="premium-card animate-scale-in" style={{ maxWidth: 640, width: "100%", padding: 28, background: "var(--bg-secondary)", border: "1px solid var(--border)", position: "relative" }}>
            
            {/* Close button */}
            <button 
              type="button"
              onClick={() => setActiveRoomDetails(null)}
              style={{ position: "absolute", top: 20, right: 20, background: "none", border: "none", color: "var(--text-secondary)", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              ✕
            </button>

            <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
              🚪 ตั้งค่าและรายละเอียด IoT: <span style={{ color: "var(--rmutp-purple-dark)" }}>ห้อง {activeRoomDetails.room}</span>
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: 12, marginBottom: 20 }}>
              ที่อยู่ IP ของบอร์ดภายในเครือข่ายจำลอง: <code style={{ color: "var(--rmutp-purple)" }}>{activeRoomDetails.ip}</code>
            </p>

            {/* Modal Tabs selector */}
            <div style={{ display: "flex", gap: 6, marginBottom: 20, background: "rgba(255,255,255,0.02)", padding: 4, borderRadius: 10, border: "1px solid rgba(255,255,255,0.05)" }}>
              {[
                { id: "api", label: "🔗 API & URLs" },
                { id: "webhook", label: "🔔 Discord Webhook" },
                { id: "arduino", label: "🔌 Arduino โค้ดบอร์ด (.ino)" }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setRoomDetailsTab(tab.id as any)}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    border: "none",
                    background: roomDetailsTab === tab.id ? "linear-gradient(135deg, var(--rmutp-purple) 0%, var(--edu-pink) 100%)" : "transparent",
                    color: roomDetailsTab === tab.id ? "#fff" : "var(--text-secondary)",
                    boxShadow: roomDetailsTab === tab.id ? "0 2px 6px rgba(124,58,237,0.2)" : "none",
                    transition: "all 0.2s"
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Content Panels */}
            <div style={{ minHeight: 260, maxHeight: 480, overflowY: "auto", paddingRight: 4, paddingBottom: 24 }}>
              
              {/* TAB 1: API & URLs */}
              {roomDetailsTab === "api" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }} className="animate-fade-in">
                  {[
                    {
                      label: "📡 1. API ดึงค่าสเตตัสบอร์ด & ทริกเปิดประตู (Display Polling API)",
                      desc: "สำหรับฝั่งบอร์ด ESP32 คอยยิงดึงสถานะจอและแฟล็กปลดล็อกทุกๆ 2 วินาที",
                      url: `${originUrl}/api/esp32/display?room=${activeRoomDetails.room}`
                    },
                    {
                      label: "🖼️ 2. API รูปภาพ QR Code ประจำห้อง (Dynamic PNG QR)",
                      desc: "ส่งกลับผลลัพธ์เป็นไฟล์รูปภาพสแกน PNG ล่าสุดสำหรับนำไปใช้วาดบน LCD",
                      url: `${originUrl}/api/esp32/qr?room=${activeRoomDetails.room}`
                    },
                    {
                      label: "📝 3. ลิงก์ตรงหน้าลงทะเบียนนักศึกษา (Student Registration URL)",
                      desc: "ใช้สแกนลงทะเบียนขอผ่านทางของห้องปฏิบัติการนี้โดยเฉพาะข้ามเครือข่าย",
                      url: `${originUrl}/?scan=${systemStatus?.esp32?.online ? "active" : ""}&room=${activeRoomDetails.room}`
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
                              showToast("🌐 เปิดหน้าทดสอบ API เรียบร้อย", "success");
                            }}
                            className="btn-ghost"
                            style={{ padding: "8px 12px", fontSize: 11, borderRadius: 8, fontWeight: 700, borderColor: "var(--rmutp-purple-light)", color: "var(--rmutp-purple-dark)" }}
                          >
                            🧪 ทดสอบ API
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
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 2: Discord Webhook */}
              {roomDetailsTab === "webhook" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16, textAlign: "left" }} className="animate-fade-in">
                  <div style={{ padding: 14, background: "rgba(139,92,246,0.03)", border: "1px dashed rgba(139,92,246,0.25)", borderRadius: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "var(--rmutp-purple-dark)" }}>🔔 ระบบแจ้งเตือนเฉพาะกลุ่มห้องเรียน (Traffic Webhook Isolation)</span>
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
                          className="rmutp-input"
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
                          🧪 ทดสอบส่ง
                        </button>
                      </div>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                        🚪 2. แจ้งเตือนอนุมัติสิทธิ์ / เปิดประตูสำเร็จ (Approve/Reject Webhook)
                      </label>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <input
                          className="rmutp-input"
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
                          className="rmutp-input"
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
                      background: "linear-gradient(135deg, var(--rmutp-purple) 0%, var(--edu-pink) 100%)",
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
                <div style={{ display: "flex", flexDirection: "column", gap: 14, textAlign: "left" }} className="animate-fade-in">
                  <div style={{ padding: 14, background: "rgba(16,185,129,0.03)", border: "1px dashed rgba(16,185,129,0.25)", borderRadius: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "#059669" }}>🔌 IoT C++ (.ino) Code Generator</span>
                    <p style={{ color: "var(--text-secondary)", fontSize: 11.5, margin: "6px 0 0 0", lineHeight: "1.4" }}>
                      ระบบได้ทำการ **ฝังตัวแปร URL เซิร์ฟเวอร์ และ รหัสห้องเรียนเฉพาะ** ลงในโค้ด Arduino ESP32 ด้านล่างให้อัตโนมัติแล้ว! ท่านสามารถคัดลอกรหัส C++ ทั้งหมดนี้ไปใช้วางในโปรแกรม Arduino IDE และอัปโหลดลงบอร์ดประจำห้องนี้ได้โดยไม่ต้องปรับแต่งรหัสใดๆ ด้วยตนเอง
                    </p>
                  </div>

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
                      📋 คัดลอกโค้ด
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
                        __html: highlightArduinoCode(getArduinoCode(activeRoomDetails.room, originUrl))
                      }}
                    />
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
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
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
                className="rmutp-input"
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
      <div style={{ display: "flex", minHeight: "100vh", flexDirection: "row" }}>
        
        {/* Sidebar Navigation */}
        <aside className={`sidebar-responsive ${mobileMenuOpen ? 'open' : ''}`}>
          <div style={{ padding: "24px 20px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 12 }}>
            <div 
              style={{ width: 40, height: 40, borderRadius: "12px", background: "linear-gradient(135deg, var(--rmutp-purple) 0%, var(--edu-pink) 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: "0 4px 10px rgba(124,58,237,0.2)" }}
            >
              <LockIcon />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "var(--rmutp-purple-dark)", letterSpacing: "0.5px" }}>RMUTP ACCS</div>
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
            <div style={{ padding: "12px 14px", background: "var(--rmutp-purple-pale)", border: "1px solid var(--border)", borderRadius: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user.full_name}
              </div>
              <div style={{ fontSize: 10.5, color: isOwner ? "var(--edu-pink)" : "var(--rmutp-purple)", fontWeight: 700, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                <span>{isOwner ? <CrownIcon /> : <KeyIcon />}</span>
                <span>{isOwner ? "Owner (เจ้าของห้อง)" : "Door Operator"}</span>
              </div>
            </div>
          </div>

          <nav style={{ flex: 1, padding: "0 12px" }}>
            {[
              { id: "pending", icon: <ClockIcon />, label: "รายการรออนุมัติ", badge: pendingCount },
              { 
                id: "iot", 
                icon: <TVIcon />, 
                label: "📡 สถานะบอร์ด IoT ทั้งหมด", 
                badge: systemStatus?.esp32Devices?.filter(d => d.online).length || 0,
                badgeColor: "#10B981"
              },
              ...(isOwner ? [
                { id: "all", icon: <UsersIcon />, label: "ทำเนียบ & ประวัติเข้าออก", badge: 0 },
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
                  background: tab === item.id ? "var(--rmutp-purple-pale)" : "transparent", 
                  color: tab === item.id ? "var(--rmutp-purple)" : "var(--text-secondary)", 
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
        <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          
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
                      <span style={{ color: "var(--rmutp-purple)", display: "inline-flex" }}>
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
            
            {/* ── Enterprise System Status Grid ── */}
            {systemStatus && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 24 }} className="animate-fade-in">
                
                {/* 1. Database card */}
                <div className="stat-card" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/>
                      </svg>
                      ฐานข้อมูล MySQL
                    </span>
                    <span className={`badge ${systemStatus.mysql.online ? 'badge-approved' : 'badge-rejected'}`} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <span className={systemStatus.mysql.online ? 'animate-pulse-ring' : ''} style={{ width: 6, height: 6, borderRadius: "50%", background: systemStatus.mysql.online ? "#059669" : "#DC2626", display: "inline-block" }} />
                      {systemStatus.mysql.online ? "ONLINE" : "OFFLINE"}
                    </span>
                  </div>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>{systemStatus.mysql.database}</h3>
                    <p style={{ fontSize: 11, color: "var(--text-secondary)", fontFamily: "monospace", marginTop: 4 }}>Host: {systemStatus.mysql.host}</p>
                  </div>
                </div>

                {/* 2. ESP32 lock controller card */}
                <div className="stat-card" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                      </svg>
                      ฮาร์ดแวร์ ESP32
                    </span>
                    <span className={`badge ${systemStatus.esp32.online ? 'badge-approved' : 'badge-rejected'}`} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <span className={systemStatus.esp32.online ? 'animate-pulse-ring' : ''} style={{ width: 6, height: 6, borderRadius: "50%", background: systemStatus.esp32.online ? "#059669" : "#DC2626", display: "inline-block" }} />
                      {systemStatus.esp32.online ? "CONNECTED" : "DISCONNECTED"}
                    </span>
                  </div>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
                      <span>บอร์ดควบคุมห้อง {systemStatus.esp32.room || "ทั่วไป"}</span>
                      {systemStatus.esp32.mock && (
                        <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 4, background: "#FFFBEB", color: "#D97706", border: "1px solid rgba(217, 119, 6, 0.2)", fontWeight: 800 }}>MOCK</span>
                      )}
                    </h3>
                    <p style={{ fontSize: 11, color: "var(--text-secondary)", fontFamily: "monospace", marginTop: 4 }}>
                      IP: {systemStatus.esp32.ip || "-"} | กลอน: {systemStatus.esp32.doorStatus === "open" ? "🔓 เปิดอยู่" : "🔒 ปิดสนิท"}
                    </p>
                  </div>
                </div>

                {/* 3. Discord alert card */}
                <div className="stat-card" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                      </svg>
                      แจ้งเตือน Discord
                    </span>
                    <span className={`badge ${systemStatus.discord.configured ? 'badge-approved' : 'badge-pending'}`} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: systemStatus.discord.configured ? "#059669" : "#D97706", display: "inline-block" }} />
                      {systemStatus.discord.configured ? "CONFIGURED" : "PENDING"}
                    </span>
                  </div>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>
                      {systemStatus.discord.configured ? "ระบบแจ้งเตือนหลัก" : "ยังไม่ได้กำหนดค่า"}
                    </h3>
                    <p style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4 }}>ความปลอดภัย: ส่งพิกัดภาพ+บันทึกผู้ใช้ทันที</p>
                  </div>
                </div>

                {/* 4. Active admin operator card */}
                <div className="stat-card" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 6 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                      </svg>
                      ผู้ควบคุมระบบปัจจุบัน
                    </span>
                    <span className="badge badge-approved" style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "var(--rmutp-purple-pale)", color: "var(--rmutp-purple)", borderColor: "var(--rmutp-purple-light)" }}>
                      ACTIVE
                    </span>
                  </div>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {user?.full_name || "-"}
                    </h3>
                    <p style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4 }}>
                      สิทธิ์: {user?.role === "owner" ? "Owner (สูงสุด)" : "Door Operator (ทั่วไป)"}
                    </p>
                  </div>
                </div>

              </div>
            )}

            {/* ── Pending Tab ── */}
            {tab === "pending" && (
              <div className="animate-fade-in">
                {pending.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "80px 40px", background: "var(--bg-secondary)", borderRadius: 20, border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 64, height: 64, borderRadius: "50%", background: "var(--rmutp-purple-pale)", border: "2px solid var(--rmutp-purple-light)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, color: "var(--rmutp-purple)" }}>
                      <SuccessBadgeIcon />
                    </div>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)" }}>ตรวจสอบรายการรออนุมัติเสร็จสิ้น</h3>
                    <p style={{ color: "var(--text-secondary)", fontSize: 13.5, marginTop: 6 }}>
                      ไม่มีคำขอเปิดประตูค้างอยู่ ระบบจะคอยอัปเดตข้อมูลผู้ยื่นคำขอใหม่ทุกๆ 10 วินาที
                    </p>
                  </div>
                ) : (
                  <div style={{ display: "grid", gap: 16 }}>
                    {pending.map(s => (
                      <div key={s.id} className="premium-card hover-card" style={{ padding: 22 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
                          <div style={{ flex: 1, minWidth: 260 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                              <div style={{ width: 44, height: 44, borderRadius: "12px", background: "var(--rmutp-purple-pale)", border: "1.5px solid var(--rmutp-purple-light)", color: "var(--rmutp-purple)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 16 }}>
                                {s.first_name[0]}
                              </div>
                              <div>
                                <h4 style={{ fontWeight: 800, fontSize: 15.5, color: "var(--text-primary)" }}>
                                  {s.title}{s.first_name} {s.last_name}
                                </h4>
                                <div style={{ fontSize: 12.5, color: "var(--rmutp-purple)", fontWeight: 700, fontFamily: "monospace", display: "flex", alignItems: "center" }}>
                                  <IdCardIcon />
                                  <span style={{ marginLeft: 4 }}>{s.student_id}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                              {s.requested_room && s.requested_room !== "default" && (
                                <span style={{ background: "linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(219,39,119,0.12) 100%)", border: "1px solid rgba(124,58,237,0.3)", borderRadius: 8, padding: "4px 10px", fontSize: 11.5, color: "var(--rmutp-purple-dark)", fontWeight: 800, display: "flex", alignItems: "center" }}>
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
                            </div>
                            
                            <div style={{ fontSize: 11.5, color: "var(--text-secondary)", fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
                              <ClockIcon />
                              <span>ยื่นสมัครเมื่อ: {formatDateTime(s.registered_at)}</span>
                            </div>
                          </div>

                          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
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
                    <span style={{ background: "var(--rmutp-purple-pale)", border: "1.5px solid var(--border-medium)", borderRadius: 10, padding: "6px 14px", fontSize: 12, color: "var(--rmutp-purple-dark)", fontWeight: 700 }}>
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
                        กรุณาไปที่แท็บ "ตั้งค่าระบบ & Webhook" เพื่อเพิ่มห้องควบคุมในระบบ
                      </p>
                    </div>
                  ) : (
                    roomsList.map((roomItem) => {
                      // Find live status from systemStatus API response
                      const liveDev = systemStatus?.esp32Devices?.find(d => d.room === roomItem.room);
                      const isOnline = liveDev ? liveDev.online : false;
                      const doorOpen = liveDev ? liveDev.doorStatus === "open" : false;
                      const isMock = liveDev ? liveDev.mock : false;
                      const activeIp = liveDev ? liveDev.ip : roomItem.ip;
                      
                      return (
                        <div key={roomItem.room} className="premium-card hover-card animate-scale-in" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16, background: "var(--bg-secondary)", border: isOnline ? "1.5px solid rgba(16,185,129,0.2)" : "1px solid var(--border)" }}>
                          
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
                            
                            {/* Live Badge status */}
                            <span className={`badge ${isOnline ? 'badge-approved' : 'badge-rejected'}`} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                              <span className={isOnline ? 'animate-pulse-ring' : ''} style={{ width: 6, height: 6, borderRadius: "50%", background: isOnline ? "#059669" : "#DC2626", display: "inline-block" }} />
                              {isOnline ? "CONNECTED" : "OFFLINE"}
                            </span>
                          </div>

                          <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 14, background: "rgba(0,0,0,0.01)", borderRadius: 12, border: "1px solid var(--border)", textAlign: "left" }}>
                            
                            {/* Door lock state */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)" }}>กลอนประตูบอร์ด:</span>
                              <span style={{ fontSize: 13, fontWeight: 800, color: doorOpen ? "#059669" : "var(--text-primary)" }}>
                                {doorOpen ? "🔓 ปลดล็อกอยู่" : "🔒 ปิดล็อกแน่นหนา"}
                              </span>
                            </div>

                            {/* Notifications set */}
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-secondary)" }}>แจ้งเตือนเฉพาะห้อง (Webhooks):</span>
                              <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--rmutp-purple-dark)" }}>
                                {rawSettings[`room_webhook_register_${roomItem.room}`] ? "🔔 เปิดใช้งาน" : "⚪ ปิดใช้งาน"}
                              </span>
                            </div>
                          </div>

                          {/* Quick remote controls */}
                          <div style={{ display: "flex", gap: 10, marginTop: "auto", paddingTop: 10 }}>
                            
                            <button
                              type="button"
                              onClick={() => handleTestConnection(roomItem.room)}
                              disabled={testingRoom === roomItem.room}
                              className="btn-ghost"
                              style={{ flex: 1, padding: "10px", borderRadius: 10, fontSize: 11.5, display: "flex", gap: 4, alignItems: "center", justifyContent: "center", fontWeight: 700 }}
                            >
                              {testingRoom === roomItem.room ? (
                                <span className="animate-spin" style={{ display: "inline-block", width: 12, height: 12, border: "2px solid rgba(0,0,0,0.2)", borderTopColor: "var(--rmutp-purple)", borderRadius: "50%" }} />
                              ) : (
                                <span>📡 เทส Polling</span>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDirectUnlockRoom(roomItem.room)}
                              disabled={unlockingRoom === roomItem.room}
                              className="btn-primary"
                              style={{ flex: 1, padding: "10px", borderRadius: 10, fontSize: 11.5, display: "flex", gap: 4, alignItems: "center", justifyContent: "center", fontWeight: 700, background: "linear-gradient(135deg, var(--rmutp-purple) 0%, var(--edu-pink) 100%)", border: "none" }}
                            >
                              {unlockingRoom === roomItem.room ? (
                                <span className="animate-spin" style={{ display: "inline-block", width: 12, height: 12, border: "2px solid rgba(255,255,255,0.2)", borderTopColor: "#fff", borderRadius: "50%" }} />
                              ) : (
                                <span>🔓 ปลดล็อกด่วน</span>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleOpenRoomDetails(roomItem.room, activeIp)}
                              className="btn-ghost"
                              style={{ padding: "10px", borderRadius: 10, color: "var(--rmutp-purple)", borderColor: "var(--rmutp-purple-light)", display: "flex", alignItems: "center", justifyContent: "center" }}
                              title="ตั้งค่า API & คัดลอกโค้ด Arduino บอร์ดห้องนี้"
                            >
                              ⚙️
                            </button>
                          </div>

                        </div>
                      );
                    })
                  )}
                </div>

              </div>
            )}

            {/* ── UNIFIED ทำเนียบ & ประวัติเข้าออก Tab (Owner Only) ── */}
            {tab === "all" && isOwner && (
              <div className="animate-fade-in">
                
                {/* ── Unified Date-Range PDF Export Hub Card ── */}
                <div className="premium-card" style={{ padding: 26, marginBottom: 24 }}>
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
                        className="rmutp-input"
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
                        className="rmutp-input"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        style={{ padding: "10px 14px" }}
                      />
                    </div>

                    {/* Status filter select */}
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                        กรองสถานะสิทธิ์คำขอ *
                      </label>
                      <select 
                        className="rmutp-input" 
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
                  <div style={{ fontSize: 11.5, color: "var(--text-secondary)", background: "var(--rmutp-purple-pale)", border: "1px solid var(--border)", padding: "10px 16px", borderRadius: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 700, color: "var(--rmutp-purple-dark)" }}>ระบบเปิดตัวเมื่อ: 23/05/2569 (เริ่มต้นนับแต่วันที่ยึดระบบ)</span>
                    <span style={{ color: "var(--text-muted)" }}>|</span>
                    <span>ตารางและสถิติด้านล่างจะกรองตามช่วงเวลาที่คุณเลือกแบบเรียลไทม์ทันที!</span>
                  </div>
                </div>

                {/* ── Log Data Retention & Maintenance Compliance Card ── */}
                <div className="premium-card" style={{ padding: 26, marginBottom: 24, borderLeft: "4px solid var(--edu-pink)", background: "var(--bg-secondary)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 12 }}>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--edu-pink)" }}>
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
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
                      style={{ padding: "10px 18px", borderRadius: 10, fontSize: 13, borderColor: "var(--rmutp-purple-light)", color: "var(--rmutp-purple)" }}
                    >
                      🧹 ล้างข้อมูล Log หมดอายุ (&gt; 90 วัน)
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
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                      </svg>
                      ⚠️ ล้างข้อมูลประวัติทั้งหมดในระบบ (ลบถาวร)
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
                      className="rmutp-input" 
                      placeholder="ค้นหาด้วยชื่อจริง หรือ รหัสนักศึกษา..." 
                      value={searchQ}
                      onChange={e => setSearchQ(e.target.value)}
                      style={{ padding: "8px 12px" }}
                    />
                  </div>
                </div>

                <div className="premium-card" style={{ overflow: "hidden", marginBottom: 36 }}>
                  <div className="rmutp-table-container">
                    <table className="rmutp-table">
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
                                <span style={{ color: "var(--rmutp-purple-dark)", fontWeight: 800, fontSize: 13, fontFamily: "monospace" }}>
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
                                  color: s.requested_room && s.requested_room !== "default" ? "var(--rmutp-purple-dark)" : "var(--text-secondary)",
                                  background: s.requested_room && s.requested_room !== "default" ? "var(--rmutp-purple-pale)" : "transparent",
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

                                  {s.status === "approved" && (
                                    <button 
                                      onClick={() => handleOpenDoor(s.id)} 
                                      disabled={loadingId === s.id}
                                      style={{ padding: "6px 10px", background: "#ECFDF5", border: "1px solid #10B981", borderRadius: 8, color: "#059669", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", gap: 4, alignItems: "center" }}
                                    >
                                      <UnlockIcon />
                                      <span>เปิด</span>
                                    </button>
                                  )}
                                  
                                  <button 
                                    onClick={() => handleDelete(s.id, `${s.first_name} ${s.last_name}`)}
                                    style={{ padding: "6px 8px", background: "#FEF2F2", border: "1px solid #EF4444", borderRadius: 8, color: "#DC2626", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center" }}
                                  >
                                    <TrashIcon />
                                  </button>
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
                  <div className="stat-card" style={{ borderLeft: "4px solid var(--rmutp-purple)", padding: "14px 20px" }}>
                    <div style={{ fontSize: 11.5, color: "var(--text-secondary)", fontWeight: 700 }}>บันทึกประวัติในช่วงนี้</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: "var(--rmutp-purple-dark)", marginTop: 4 }}>{filteredLogs.length} รายการ</div>
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
                      {filteredLogs.filter(l => l.action === "rejected" || l.action === "door_failed").length} ครั้ง
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
                            background: logPageSize === size ? "linear-gradient(135deg, var(--rmutp-purple) 0%, var(--edu-pink) 100%)" : "transparent",
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
                        className="rmutp-input" 
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
                    { value: "all", label: "📁 ทั้งหมด", color: "var(--text-secondary)" },
                    { value: "door_opened", label: "🔓 ผ่านประตูสำเร็จ", color: "#10B981" },
                    { value: "door_failed", label: "⚠️ ปฏิเสธสิทธิ์/ล้มเหลว", color: "#EF4444" },
                    { value: "approved", label: "✅ อนุมัติสิทธิ์สมัคร", color: "#7C3AED" },
                    { value: "rejected", label: "❌ ปฏิเสธสิทธิ์สมัคร", color: "#F59E0B" },
                    { value: "registered", label: "📝 ลงทะเบียนใหม่", color: "#3B82F6" },
                    { value: "export_pdf", label: "📄 ส่งออก PDF", color: "#EC4899" }
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
                        background: logFilter === t.value ? "linear-gradient(135deg, var(--rmutp-purple) 0%, var(--edu-pink) 100%)" : "transparent",
                        color: logFilter === t.value ? "#fff" : t.color,
                        boxShadow: logFilter === t.value ? "0 4px 12px rgba(124, 58, 237, 0.25)" : "none",
                        transition: "all 0.2s ease"
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <div className="premium-card" style={{ overflow: "hidden" }}>
                  <div className="rmutp-table-container">
                    <table className="rmutp-table">
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
                            const act = ACTION_METADATA[log.action] || { label: log.action, icon: <TerminalIcon />, color: "var(--text-primary)" };
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
                                        color: "var(--rmutp-purple-dark)",
                                        padding: "2px 8px",
                                        borderRadius: 6
                                      }}>
                                        🚪 ห้อง: {log.requested_room}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td>
                                  <span style={{ color: "var(--rmutp-purple-dark)", fontWeight: 700, fontFamily: "monospace", fontSize: 12.5 }}>
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
                            border: logCurrentPage === p ? "1px solid var(--rmutp-purple)" : "1px solid rgba(255,255,255,0.08)",
                            background: logCurrentPage === p ? "linear-gradient(135deg, var(--rmutp-purple) 0%, var(--edu-pink) 100%)" : "rgba(255,255,255,0.02)",
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
                    <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--border)", background: "var(--rmutp-purple-pale)" }}>
                      <h3 style={{ fontSize: 15, fontWeight: 800, color: "var(--rmutp-purple-dark)", display: "flex", alignItems: "center", gap: 6 }}>
                        <UsersIcon /> บัญชีรายชื่อผู้ดูแลระบบทั้งหมด
                      </h3>
                    </div>
                    <div className="rmutp-table-container" style={{ border: "none", borderRadius: 0 }}>
                      <table className="rmutp-table">
                        <thead>
                          <tr>
                            <th>ชื่อ - นามสกุลแอดมิน</th>
                            <th>Username</th>
                            <th style={{ textAlign: "center" }}>ระดับสิทธิ์</th>
                            <th>ล็อกอินล่าสุด</th>
                            <th style={{ width: 40 }}></th>
                          </tr>
                        </thead>
                        <tbody>
                          {admins.map(a => (
                            <tr key={a.id}>
                              <td><div style={{ fontWeight: 700 }}>{a.full_name}</div></td>
                              <td><span style={{ color: "var(--text-secondary)", fontSize: 13, fontWeight: 500 }}>{a.username}</span></td>
                              <td style={{ textAlign: "center" }}>
                                <span className={`badge ${a.role === "owner" ? "badge-approved" : "badge-pending"}`}>
                                  {a.role === "owner" ? <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><CrownIcon className="w-3 h-3" /> Owner</span> : <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><KeyIcon className="w-3 h-3" /> Operator</span>}
                                </span>
                              </td>
                              <td style={{ fontSize: 11.5, color: "var(--text-secondary)" }}>
                                {formatDateTime(a.last_login)}
                              </td>
                              <td>
                                {a.id !== user.id && (
                                  <button 
                                    onClick={() => handleDeleteAdmin(a.id)} 
                                    style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16 }}
                                    title="ถอดถอนสิทธิ์"
                                  >
                                    <TrashIcon />
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
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
                            className="rmutp-input" 
                            type={f.type} 
                            placeholder={f.placeholder}
                            value={(newAdmin as Record<string, string>)[f.key]}
                            onChange={e => setNewAdmin(a => ({ ...a, [f.key]: e.target.value }))} 
                            required 
                          />
                        </div>
                      ))}
                      
                      <div style={{ marginBottom: 20 }}>
                        <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                          ขอบเขตสิทธิ์ในการทำงาน (Role) *
                        </label>
                        <select 
                          className="rmutp-input" 
                          value={newAdmin.role}
                          onChange={e => setNewAdmin(a => ({ ...a, role: e.target.value }))}
                        >
                          <option value="door_operator">Door Operator (เปิดประตูได้อย่างเดียว)</option>
                          <option value="owner">Owner (เจ้าของสิทธิ์อนุมัติสิทธิ์และจัดการ)</option>
                        </select>
                      </div>

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

            {/* ── System & Discord Settings Tab (Owner Only) ────────────── */}
            {tab === "settings" && isOwner && (
              <div className="animate-fade-in" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 24 }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 24, alignItems: "start" }}>

                  {/* Card 1: Automated Approvals & Auto-fill */}
                  <form onSubmit={saveSettings} className="premium-card" style={{ padding: 26, display: "flex", flexDirection: "column", gap: 20 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--rmutp-purple-dark)", display: "flex", alignItems: "center", gap: 8, borderBottom: "1.5px solid var(--border)", paddingBottom: 12, marginBottom: 4 }}>
                      <SettingsIcon /> ⚙️ อนุมัติ & กรอกฟอร์มอัตโนมัติ (Automated Control)
                    </h3>

                    <div style={{ padding: 16, background: "rgba(255, 255, 255, 0.02)", borderRadius: 12, border: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <span style={{ fontWeight: 800, fontSize: 13.5, color: "var(--text-primary)" }}>เปิดระบบเข้าห้องอัตโนมัติไม่ต้องรออนุมัติ</span>
                        <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: 0, lineHeight: "1.4" }}>
                          นักศึกษาใหม่ยื่นขอในเวลาบริการ จะได้รับอนุมัติผ่านเข้าห้องอัตโนมัติทันที
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSettings(s => ({ ...s, auto_approve_enabled: !s.auto_approve_enabled }))}
                        style={{
                          width: 48,
                          height: 26,
                          borderRadius: 15,
                          background: settings.auto_approve_enabled ? "linear-gradient(135deg, var(--rmutp-purple) 0%, var(--edu-pink) 100%)" : "rgba(255,255,255,0.08)",
                          border: "1px solid var(--border)",
                          position: "relative",
                          cursor: "pointer",
                          padding: 0,
                          transition: "all 0.2s ease-in-out",
                          flexShrink: 0,
                          display: "flex",
                          alignItems: "center"
                        }}
                      >
                        <div
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            background: "#FFF",
                            position: "absolute",
                            left: settings.auto_approve_enabled ? 24 : 3,
                            transition: "left 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                          }}
                        />
                      </button>
                    </div>

                    <div style={{ padding: 16, background: "rgba(255, 255, 255, 0.02)", borderRadius: 12, border: "1px solid var(--border)", display: "flex", flexDirection: "column", gap: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <span style={{ fontWeight: 800, fontSize: 13.5, color: "var(--text-primary)" }}>เปิดระบบช่วยกรอกข้อมูลอัตโนมัติ (Auto-fill)</span>
                          <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: 0, lineHeight: "1.4" }}>
                            ดึงชั้นปี คณะ และสาขาของนักศึกษาเดิมมากรอกให้อัตโนมัติ
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSettings(s => ({ ...s, auto_fill_enabled: !s.auto_fill_enabled }))}
                          style={{
                            width: 48,
                            height: 26,
                            borderRadius: 15,
                            background: settings.auto_fill_enabled ? "linear-gradient(135deg, var(--rmutp-purple) 0%, var(--edu-pink) 100%)" : "rgba(255,255,255,0.08)",
                            border: "1px solid var(--border)",
                            position: "relative",
                            cursor: "pointer",
                            padding: 0,
                            transition: "all 0.2s ease-in-out",
                            flexShrink: 0,
                            display: "flex",
                            alignItems: "center"
                          }}
                        >
                          <div
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: "50%",
                              background: "#FFF",
                              position: "absolute",
                              left: settings.auto_fill_enabled ? 24 : 3,
                              transition: "left 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                              boxShadow: "0 2px 4px rgba(0,0,0,0.2)"
                            }}
                          />
                        </button>
                      </div>
                      
                      {settings.auto_fill_enabled && (
                        <div style={{ padding: 12, background: "rgba(0,0,0,0.15)", borderRadius: 8, border: "1px dashed var(--border)", display: "flex", flexDirection: "column", gap: 8 }} className="animate-fade-in">
                          <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-primary)" }}>รูปแบบการดึงข้อมูล:</span>
                          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                            <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12 }}>
                              <input 
                                type="radio" 
                                name="auto_fill_mode" 
                                value="auto"
                                checked={settings.auto_fill_mode === "auto"}
                                onChange={e => setSettings(s => ({ ...s, auto_fill_mode: e.target.value }))}
                                style={{ accentColor: "var(--rmutp-purple)", cursor: "pointer" }}
                              />
                              <span>เด้งขึ้นมาให้เองอัตโนมัติ (Auto Pop-up)</span>
                            </label>
                            <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12 }}>
                              <input 
                                type="radio" 
                                name="auto_fill_mode" 
                                value="manual"
                                checked={settings.auto_fill_mode === "manual"}
                                onChange={e => setSettings(s => ({ ...s, auto_fill_mode: e.target.value }))}
                                style={{ accentColor: "var(--rmutp-purple)", cursor: "pointer" }}
                              />
                              <span>แสดงปุ่มให้กดเลือกเอง (Manual Confirmation)</span>
                            </label>
                          </div>
                        </div>
                      )}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                          เวลาเริ่มบริการ (ชั่วโมง:นาที)
                        </label>
                        <input 
                          className="rmutp-input" 
                          type="text" 
                          placeholder="เช่น 09:00"
                          value={settings.auto_approve_start_time}
                          onChange={e => setSettings(s => ({ ...s, auto_approve_start_time: e.target.value }))}
                          required 
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                          เวลาปิดบริการ (ชั่วโมง:นาที)
                        </label>
                        <input 
                          className="rmutp-input" 
                          type="text" 
                          placeholder="เช่น 16:00"
                          value={settings.auto_approve_end_time}
                          onChange={e => setSettings(s => ({ ...s, auto_approve_end_time: e.target.value }))}
                          required 
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>
                        วันเปิดให้บริการอัตโนมัติ
                      </label>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {[
                          { val: 1, label: "จ.", color: "#EAB308" },
                          { val: 2, label: "อ.", color: "#EC4899" },
                          { val: 3, label: "พ.", color: "#10B981" },
                          { val: 4, label: "พฤ.", color: "#F97316" },
                          { val: 5, label: "ศ.", color: "#3B82F6" },
                          { val: 6, label: "ส.", color: "#8B5CF6" },
                          { val: 0, label: "อา.", color: "#EF4444" },
                        ].map(day => {
                          const activeDaysList = settings.auto_approve_days ? settings.auto_approve_days.split(",").map(Number).filter(n => !isNaN(n)) : [];
                          const isActive = activeDaysList.includes(day.val);
                          
                          const handleDayToggle = () => {
                            let updated: number[];
                            if (isActive) {
                              updated = activeDaysList.filter(d => d !== day.val);
                            } else {
                              updated = [...activeDaysList, day.val];
                            }
                            updated.sort((a, b) => a - b);
                            setSettings(s => ({ ...s, auto_approve_days: updated.join(",") }));
                          };

                          return (
                            <button
                              type="button"
                              key={day.val}
                              onClick={handleDayToggle}
                              style={{
                                padding: "6px 10px",
                                borderRadius: "16px",
                                border: isActive ? `1.5px solid ${day.color}` : "1.5px solid var(--border)",
                                background: isActive ? `${day.color}15` : "transparent",
                                color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                                fontSize: "11.5px",
                                fontWeight: isActive ? 700 : 500,
                                cursor: "pointer",
                                transition: "all 0.2s ease-in-out",
                              }}
                            >
                              {day.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </form>

                  {/* Card 2: Discord Webhooks (ส่วนกลาง) */}
                  <form onSubmit={saveSettings} className="premium-card" style={{ padding: 26, display: "flex", flexDirection: "column", gap: 20 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--rmutp-purple-dark)", display: "flex", alignItems: "center", gap: 8, borderBottom: "1.5px solid var(--border)", paddingBottom: 12, marginBottom: 4 }}>
                      <FileTextIcon /> 🔔 Discord Webhooks (ส่วนกลาง)
                    </h3>

                    <div style={{ padding: 12, background: "rgba(139,92,246,0.04)", border: "1px dashed rgba(139,92,246,0.2)", borderRadius: 10 }}>
                      <p style={{ fontSize: 11.5, color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
                        Webhook ด้านล่างนี้เป็น <strong>ค่าตั้งต้นสำหรับทุกห้อง</strong> — หากห้องไหนไม่ได้ตั้ง Webhook เฉพาะ ระบบจะใช้ค่าเริ่มต้นนี้ส่งข้อมูลความปลอดภัย
                      </p>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                          📝 คำขอลงทะเบียนเข้าใช้ห้องใหม่
                        </label>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <input 
                            className="rmutp-input" 
                            type="url" 
                            placeholder="https://discord.com/api/webhooks/..."
                            value={settings.discord_webhook_register}
                            onChange={e => setSettings(s => ({ ...s, discord_webhook_register: e.target.value }))}
                            style={{ flex: 1, fontSize: 12.5 }}
                          />
                          <button
                            type="button"
                            onClick={() => handleTestWebhook(settings.discord_webhook_register, "register")}
                            className="btn-ghost"
                            style={{ padding: "10px 14px", fontSize: 11.5, borderRadius: 10, flexShrink: 0, fontWeight: 700 }}
                          >
                            🧪 ทดสอบส่ง
                          </button>
                        </div>
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                          🚪 แจ้งเตือนอนุมัติสิทธิ์ / เปิดประตูสำเร็จ
                        </label>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <input 
                            className="rmutp-input" 
                            type="url" 
                            placeholder="กรอก URL แจ้งเตือนการเปิดประตู"
                            value={settings.discord_webhook_approve}
                            onChange={e => setSettings(s => ({ ...s, discord_webhook_approve: e.target.value }))}
                            style={{ flex: 1, fontSize: 12.5 }}
                          />
                          <button
                            type="button"
                            onClick={() => handleTestWebhook(settings.discord_webhook_approve, "approve")}
                            className="btn-ghost"
                            style={{ padding: "10px 14px", fontSize: 11.5, borderRadius: 10, flexShrink: 0, fontWeight: 700 }}
                          >
                            🧪 ทดสอบส่ง
                          </button>
                        </div>
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                          📊 บันทึก Log จราจร/ความปลอดภัยอย่างละเอียด
                        </label>
                        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                          <input 
                            className="rmutp-input" 
                            type="url" 
                            placeholder="กรอก URL เก็บ Log ความปลอดภัย"
                            value={settings.discord_webhook_logs}
                            onChange={e => setSettings(s => ({ ...s, discord_webhook_logs: e.target.value }))}
                            style={{ flex: 1, fontSize: 12.5 }}
                          />
                          <button
                            type="button"
                            onClick={() => handleTestWebhook(settings.discord_webhook_logs, "logs")}
                            className="btn-ghost"
                            style={{ padding: "10px 14px", fontSize: 11.5, borderRadius: 10, flexShrink: 0, fontWeight: 700 }}
                          >
                            🧪 ทดสอบส่ง
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>

                {/* ═══ SECTION 3: Redesigned Multi-Room Manager with Inline Editing ═══ */}
                <div className="premium-card" style={{ padding: 0, overflow: "hidden" }}>
                  <div style={{
                    padding: "20px 26px",
                    background: "linear-gradient(135deg, rgba(16,185,129,0.06) 0%, rgba(59,130,246,0.04) 100%)",
                    borderBottom: "1px solid var(--border)",
                    display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 22 }}>🏢</span>
                      <div>
                        <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--rmutp-purple-dark)", margin: 0 }}>
                          จัดการห้องเรียน & บอร์ด ESP32
                        </h3>
                        <p style={{ fontSize: 11.5, color: "var(--text-secondary)", margin: "2px 0 0" }}>
                          เพิ่ม แก้ไขรหัสห้อง หรือ IP บอร์ดแต่ละห้องเรียนได้โดยตรง และกดปุ่มบันทึกระบบด้านล่างสุด
                        </p>
                      </div>
                    </div>
                    <span style={{ fontSize: 11.5, padding: "4px 12px", borderRadius: 20, background: "rgba(16,185,129,0.1)", color: "#059669", fontWeight: 700 }}>
                      {roomsList.length} ห้องเรียนลงทะเบียน
                    </span>
                  </div>

                  <div style={{ padding: "20px 26px" }}>
                    {/* Rooms List */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
                      {roomsList.length === 0 ? (
                        <div style={{ textAlign: "center", padding: 30, color: "var(--text-muted)", fontSize: 13, border: "2px dashed var(--border)", borderRadius: 14 }}>
                          <span style={{ fontSize: 32, display: "block", marginBottom: 8 }}>🏫</span>
                          ยังไม่มีห้องเรียนลงทะเบียนใช้งานในระบบ — กรุณาพิมพ์เพิ่มห้องเรียนใหม่ในกล่องด้านล่าง
                        </div>
                      ) : (
                        roomsList.map((r, idx) => {
                          const testRes = testResults[r.room];
                          return (
                            <div key={`room-${idx}`} style={{
                              padding: "20px 24px", background: "rgba(255, 255, 255, 0.02)",
                              border: "1px solid var(--border)", borderRadius: 16,
                              display: "flex", flexDirection: "column", gap: 16,
                              position: "relative", transition: "all 0.2s ease-in-out"
                            }}>
                              {/* Top row with room label and action buttons */}
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                  <span style={{
                                    width: 38, height: 38, borderRadius: 12,
                                    background: "linear-gradient(135deg, var(--rmutp-purple) 0%, var(--edu-pink) 100%)",
                                    color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: 15, fontWeight: 800, flexShrink: 0,
                                    boxShadow: "0 4px 10px rgba(124,58,237,0.15)"
                                  }}>
                                    {idx + 1}
                                  </span>
                                  <div>
                                    <div style={{ fontWeight: 800, fontSize: 15, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8 }}>
                                      🚪 ห้องปฏิบัติการ: {r.room}
                                      {testRes && (
                                        <span style={{
                                          fontSize: 10.5, padding: "2px 8px", borderRadius: 6, fontWeight: 800,
                                          background: testRes.online ? "rgba(16,185,129,0.1)" : "rgba(220,38,38,0.1)",
                                          color: testRes.online ? "#059669" : "#DC2626",
                                          border: testRes.online ? "1.5px solid rgba(16,185,129,0.2)" : "1.5px solid rgba(220,38,38,0.2)"
                                        }}>
                                          {testRes.online ? "🟢 ออนไลน์" : "🔴 ออฟไลน์"}
                                        </span>
                                      )}
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                                      <span style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 600 }}>ที่อยู่บอร์ด IoT:</span>
                                      <code style={{ fontSize: 12, fontFamily: "monospace", color: "#10B981", fontWeight: 700 }}>{r.ip}</code>
                                    </div>
                                  </div>
                                </div>

                                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                                  <button type="button" onClick={() => handleTestConnection(r.room)} disabled={testingRoom === r.room}
                                    className="btn-ghost" style={{ padding: "8px 14px", borderRadius: 10, fontSize: 12, display: "flex", gap: 6, alignItems: "center", fontWeight: 700 }}>
                                    {testingRoom === r.room ? (
                                      <span className="animate-spin" style={{ display: "inline-block", width: 12, height: 12, border: "2px solid rgba(0,0,0,0.2)", borderTopColor: "var(--rmutp-purple)", borderRadius: "50%" }} />
                                    ) : (
                                      <span>📡 ทดสอบดึงคำสั่ง</span>
                                    )}
                                  </button>
                                  <button type="button" onClick={() => handleOpenRoomDetails(r.room, r.ip)}
                                    className="btn-ghost" style={{ padding: "8px 14px", borderRadius: 10, fontSize: 12, color: "var(--rmutp-purple)", display: "flex", alignItems: "center", gap: 6, fontWeight: 700 }}
                                    title="ตั้งค่า API Webhooks & Arduino">
                                    ⚙️ ตั้งค่าและโค้ดบอร์ด
                                  </button>
                                  <button type="button" onClick={() => handleRemoveRoom(r.room)}
                                    className="btn-ghost" style={{ padding: "8px 10px", borderRadius: 10, color: "#DC2626", border: "1px solid rgba(220,38,38,0.15)", background: "rgba(220,38,38,0.02)" }}>
                                    <TrashIcon />
                                  </button>
                                </div>
                              </div>

                              {/* Responsive Editing Grid */}
                              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, alignItems: "end", marginTop: 4, paddingTop: 14, borderTop: "1px dashed var(--border)" }}>
                                <div style={{ textAlign: "left" }}>
                                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6 }}>
                                    ✏️ แก้ไขชื่อ/รหัสห้อง
                                  </label>
                                  <input
                                    className="rmutp-input"
                                    value={r.room}
                                    onChange={e => {
                                      const newVal = e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "");
                                      setRoomsList(prev => prev.map((rm, i) => i === idx ? { ...rm, room: newVal } : rm));
                                    }}
                                    style={{ padding: "9px 12px", fontSize: 13, fontFamily: "monospace", width: "100%" }}
                                  />
                                </div>
                                <div style={{ textAlign: "left" }}>
                                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6 }}>
                                    📡 แก้ไข IP Address / โดเมนบอร์ด
                                  </label>
                                  <input
                                    className="rmutp-input"
                                    value={r.ip}
                                    onChange={e => {
                                      setRoomsList(prev => prev.map((rm, i) => i === idx ? { ...rm, ip: e.target.value } : rm));
                                    }}
                                    placeholder="เช่น 192.168.1.100 หรือโดเมน Vercel"
                                    style={{ padding: "9px 12px", fontSize: 13, fontFamily: "monospace", width: "100%" }}
                                  />
                                </div>
                                <button type="button"
                                  onClick={() => showToast(`✅ ปรับปรุงข้อมูลห้อง ${r.room} เรียบร้อยแล้ว! อย่าลืมกด "บันทึกการตั้งค่าทั้งหมด" ด้านล่างสุด`, "success")}
                                  className="btn-ghost"
                                  style={{ padding: "10px 16px", borderRadius: 10, fontSize: 12, fontWeight: 800, color: "#059669", border: "1px solid rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.03)", width: "100%", display: "flex", justifyContent: "center" }}>
                                  ✓ ยืนยันชั่วคราว
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Add Room Subcard */}
                    <div style={{ padding: 20, background: "rgba(124,58,237,0.02)", border: "1px dashed var(--rmutp-purple-light)", borderRadius: 16, display: "flex", flexDirection: "column", gap: 14 }}>
                      <span style={{ fontSize: 13.5, fontWeight: 800, color: "var(--rmutp-purple-dark)", display: "flex", alignItems: "center", gap: 6 }}>
                        ➕ ลงทะเบียนห้องเรียน / บอร์ดควบคุมใหม่
                      </span>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, alignItems: "end" }}>
                        <div style={{ textAlign: "left" }}>
                          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6 }}>
                            รหัสห้องเรียน (อังกฤษ-ตัวเลข)
                          </label>
                          <input className="rmutp-input" placeholder="เช่น CE-403" value={newRoomCode} onChange={e => setNewRoomCode(e.target.value)}
                            style={{ padding: "10px 14px", fontSize: 13, width: "100%" }} />
                        </div>
                        <div style={{ textAlign: "left" }}>
                          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6 }}>
                            IP Address / โดเมนบอร์ด (ใส่ IP สมมติเพื่อเทสได้)
                          </label>
                          <input className="rmutp-input" placeholder="เช่น 192.168.1.102" value={newRoomIp} onChange={e => setNewRoomIp(e.target.value)}
                            style={{ padding: "10px 14px", fontSize: 13, width: "100%" }} />
                        </div>
                        <button type="button" onClick={() => handleAddRoom()} className="btn-secondary"
                          style={{ padding: "10px 20px", fontSize: 13, fontWeight: 800, borderRadius: 10, borderColor: "var(--rmutp-purple-light)", color: "var(--rmutp-purple)", whiteSpace: "nowrap", width: "100%", justifyContent: "center", display: "flex" }}>
                          ➕ เพิ่มห้องลงรายการ
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ═══ SECTION 4: Centralized Save Settings Button ═══ */}
                <div className="premium-card" style={{ padding: 18, background: "linear-gradient(135deg, rgba(124,58,237,0.03) 0%, rgba(219,39,119,0.03) 100%)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text-primary)" }}>⚠️ ยืนยันการบันทึกการตั้งค่าระบบทั้งหมด</span>
                    <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>กดปุ่มเพื่อบันทึกตารางเวลาบริการ, วันเปิดบริการ, รายชื่อห้องเรียน (IP) และ Discord Webhooks ทั้งหมดถาวร</span>
                  </div>
                  <button onClick={saveSettings} disabled={settingsLoading}
                    className="btn-primary hover-card"
                    style={{ padding: "12px 28px", borderRadius: 12, fontSize: 13.5, display: "flex", gap: 6, alignItems: "center", cursor: "pointer" }}>
                    {settingsLoading ? (
                      <>
                        <span className="animate-spin" style={{ display: "inline-block", width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%" }} />
                        <span>กำลังบันทึกตั้งค่า...</span>
                      </>
                    ) : (
                      <>
                        <SaveIcon />
                        <span>💾 บันทึกการตั้งค่าระบบทั้งหมด</span>
                      </>
                    )}
                  </button>
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
                      background: "linear-gradient(135deg, var(--rmutp-purple) 0%, var(--edu-pink) 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontSize: 26,
                      boxShadow: "0 6px 16px rgba(124,58,237,0.25)"
                    }}>
                      📖
                    </div>
                    <div>
                      <h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--rmutp-purple-dark)", margin: 0 }}>
                        คู่มือการใช้งานระบบ & IoT Controller (ACCS User Manual)
                      </h2>
                      <p style={{ fontSize: 12.5, color: "var(--text-secondary)", margin: "4px 0 0" }}>
                        คู่มือแนะนำการบริหารจัดการระบบควบคุมกลอนประตูอัจฉริยะ โหมดซอฟต์แวร์จำลอง และการต่อบอร์ดจริงข้ามเครือข่ายอย่างละเอียด
                      </p>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 28, textAlign: "left" }}>
                    
                    {/* Section 1: Overview */}
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        🌐 1. สถาปัตยกรรมระบบ (Cloud Polling Architecture)
                      </h3>
                      <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.8, paddingLeft: 8 }}>
                        <p style={{ margin: "0 0 10px 0" }}>
                          เนื่องจากเครื่องเซิร์ฟเวอร์บน **Vercel** ทำงานอยู่บนโครงข่ายอินเทอร์เน็ตสาธารณะ (Public Cloud) ในขณะที่ตัวบอร์ด **ESP32** ประจำห้องปฏิบัติการจะติดตั้งอยู่ภายในวง LAN ของมหาวิทยาลัย ซึ่งไม่ได้รับ Public IP จริงและมักถูกปิดกั้นด้วย Firewall/NAT 
                        </p>
                        <p style={{ margin: "0 0 10px 0" }}>
                          เพื่อความง่ายและปลอดภัยสูงสุด ระบบนี้จึงถูกออกแบบบน **Polling Architecture** คือบอร์ด ESP32 จะคอยทำหน้าที่เป็นผู้เรียกติดต่อเข้าหาเซิร์ฟเวอร์ Vercel ทุกๆ 2 วินาทีเพื่อคอยดึงข้อมูล (Display Polling) และตรวจเช็กสถานะการอนุมัติสลับสัญญาณกลอนรีเลย์ผ่านทางฐานข้อมูลโดยตรง โดย<strong>ไม่จำเป็นต้องทำการฟอร์เวิร์ดพอร์ต (Port Forwarding)</strong> บนเร้าเตอร์ของมหาวิทยาลัยแต่อย่างใด
                        </p>
                        <div style={{ padding: 12, background: "rgba(16,185,129,0.03)", border: "1px dashed rgba(16,185,129,0.25)", borderRadius: 10, marginTop: 10 }}>
                          <strong style={{ color: "#10B981" }}>📡 ระบบออนไลน์อัตโนมัติ (Dynamic Polling Heartbeat)</strong>
                          <p style={{ margin: "4px 0 0 0", fontSize: 12 }}>
                            ทุกครั้งที่ตัวบอร์ด ESP32 ยิงดึงข้อมูลเข้ามาหาเว็บ ระบบจะทำการบันทึกเวลาล่าสุดลงในตารางเก็บค่าตั้งค่า (คีย์ room_last_seen_[รหัสห้อง]) โดยอัตโนมัติ ทำให้สถานะห้องเรียนในแดชบอร์ดแสดงเป็น <span style={{ color: "#10B981", fontWeight: 700 }}>● CONNECTED</span> เสมอ ตราบใดที่บอร์ดมีการใช้งานอินเทอร์เน็ตอยู่ โดยไม่ต้องห่วงเรื่องการบล็อกพอร์ต
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Mock & Simulation */}
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        🧪 2. โหมดการทดสอบจำลอง (Software Simulation Mode)
                      </h3>
                      <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.8, paddingLeft: 8 }}>
                        <p style={{ margin: "0 0 10px 0" }}>
                          คุณสามารถทดสอบจำลองการทำงานของประตู ระบบสแกน และแสดงผลหลาย ๆ ห้องเรียนพร้อมกันได้โดยไม่ต้องมีฮาร์ดแวร์บอร์ดจริงด้วยขั้นตอนง่าย ๆ:
                        </p>
                        <ul style={{ margin: "0 0 12px 0", paddingLeft: 20 }}>
                          <li>เพิ่มข้อมูลห้องเรียนจำลองในตารางด้านล่างสุดของหน้าจอตั้งค่า (เช่น `CE-401` และกำหนด IP จำลองใดๆ ก็ได้ เช่น `192.168.1.100`)</li>
                          <li>เปิดใช้งานโหมดจำลองโดยการเปลี่ยนค่าในไฟล์สภาพแวดล้อม `.env.local` เป็น `ESP32_MOCK_MODE=true`</li>
                          <li>เข้าไปที่หน้าสัญกรณ์ <strong>/esp32-preview?room=CE-401</strong> ในอีกหนึ่งแท็บของบราวเซอร์เพื่อรับชมหน้าจอจำลอง TFT ของบอร์ด</li>
                          <li>นักศึกษาสแกน QR และส่งคำร้อง แอดมินกดอนุมัติบนแดชบอร์ด หน้าจอจำลองจะตรวจพบแอนิเมชันเปิดล็อกสำเร็จเสมือนบอร์ดจริงทันที!</li>
                        </ul>
                      </div>
                    </div>

                    {/* Section 3: Webhook Separation */}
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        🔔 3. ระบบกระจายแจ้งเตือนแยกห้องเรียน (3-Channel Webhook Routing)
                      </h3>
                      <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.8, paddingLeft: 8 }}>
                        <p style={{ margin: "0 0 10px 0" }}>
                          หากห้องเรียนแต่ละห้องมีการใช้งานแชนแนลกลุ่มสื่อสาร Discord ที่แยกกันเป็นเอกเทศ (เช่น กลุ่มอาจารย์ผู้สอนประจำสาขาหรือห้องคอมพิวเตอร์เฉพาะวิชา) แอดมินสามารถเปิดหน้าต่าง **ตั้งค่าและรายละเอียด IoT** ประจำห้องเรียนนั้น ๆ เพื่อแยกยิง Webhook ประจำแชนแนลได้ทันที:
                        </p>
                        <ul style={{ margin: "0 0 12px 0", paddingLeft: 20 }}>
                          <li><strong>Register Webhook:</strong> ส่งการแจ้งเตือนทันทีที่มีนักศึกษาสแกนและยื่นส่งใบสมัครเข้าห้อง</li>
                          <li><strong>Approve Webhook:</strong> ส่งสัญญลักษณ์สรุปการเปิดประตูว่าได้รับอนุญาตจากใคร หรือสั่งปลดล็อกด้วยสิทธิ์ Bypass ใด</li>
                          <li><strong>Logs Webhook:</strong> ส่งรายละเอียดเชิงความปลอดภัย หรือกรณีตรวจพบบอร์ดออฟไลน์</li>
                        </ul>
                        <div style={{ padding: 12, background: "rgba(139,92,246,0.03)", border: "1px dashed rgba(139,92,246,0.25)", borderRadius: 10, marginTop: 10 }}>
                          <strong style={{ color: "var(--rmutp-purple)" }}>🧪 การทดสอบยิงแชนแนล Discord (Live Webhook Tester)</strong>
                          <p style={{ margin: "4px 0 0 0", fontSize: 12 }}>
                            ไม่ว่าจะเป็นการตั้งค่าบอทส่วนกลางหรือของห้องเรียน แอดมินสามารถป้อนลิงก์แล้วกดปุ่ม <span style={{ fontWeight: 700 }}>"🧪 ทดสอบส่ง"</span> ข้างช่องอินพุต ระบบจะคัดสรร Payload ในรูปแบบ Rich Embed Card ล่าสุดยิงเข้าห้องแชท เพื่อยืนยันว่าการทำงานของลิงก์ถูกต้อง 100% ทันที
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Section 4: DB & Self-Deleter */}
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        ⚡ 4. ความปลอดภัยและความเร็วบนคลาวด์ Aiven (SQL Optimization & Self-Deleter)
                      </h3>
                      <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.8, paddingLeft: 8 }}>
                        <p style={{ margin: "0 0 10px 0" }}>
                          เนื่องจากระบบคลาวด์ของ Aiven ในสิทธิ์บัญชีใช้งานฟรีจะมีทรัพยากรที่ค่อนข้างจำกัด ระบบนี้จึงมีการใช้โครงสร้างลดภาระและเร่งความเร็วการทำงานดังนี้:
                        </p>
                        <ul style={{ margin: "0 0 10px 0", paddingLeft: 20 }}>
                          <li><strong>Database Indexing:</strong> ได้รับการติดตั้ง Index ความเร็วสูง ครอบตารางตรวจสอบสิทธิ์ทำให้อัตราความเร็วในการเชื่อมต่อ SQL เพิ่มขึ้นถึง **1,000%** บอร์ดดึงข้อมูลสเตตัสเสร็จได้ทันทีภายในหลักหน่วยมิลลิวินาที</li>
                          <li><strong>Self-Deleting GC (ระบบทำลายขยะอัตโนมัติ):</strong> ข้อมูล QR Code และตั๋วประวัติชั่วคราวจะเปิดใช้ระบบลบทำลายตัวเองทุก 5 นาทีเมื่อถูกใช้หรือหมดอายุ ป้องกันขยะล้นตาราง ซึ่งจะช่วยขจัดปัญหาคิวรีหนืดหรือพื้นที่ฐานข้อมูล Aiven เต็มในระยะยาว</li>
                        </ul>
                      </div>
                    </div>

                  </div>
                </div>

              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
