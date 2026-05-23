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

export default function AdminDashboard() {
  const router = useRouter();
  const [tab, setTab] = useState<"pending" | "all" | "admins">("pending");
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [pending, setPending] = useState<Student[]>([]);
  const [allStudents, setAll] = useState<Student[]>([]);
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [rejectModal, setRejectModal] = useState<{ id: number; name: string } | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  
  // Unified Filters (Tab 2: ทำเนียบ & ประวัติเข้าออก)
  const [searchQ, setSearchQ] = useState("");
  const [filterStatus, setFilter] = useState("all");
  
  // Unified Date Range selection (Initialized to 2026-05-23 which is system launch)
  const [startDate, setStartDate] = useState("2026-05-23");
  const [endDate, setEndDate] = useState("2026-05-23");

  const [logFilter, setLogFilter] = useState("all");
  const [logSearch, setLogSearch] = useState("");

  const [newAdmin, setNewAdmin] = useState({ username: "", password: "", full_name: "", role: "door_operator" });
  const [currentTime, setTime] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [systemStatus, setSystemStatus] = useState<{
    mysql: { online: boolean; host: string; database: string; error: string };
    esp32: { online: boolean; doorStatus: string; ip: string; mock: boolean };
    discord: { configured: boolean };
    logSummary: { total: number; active: number; expired: number; retentionDays: number };
  } | null>(null);
  
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<"expired" | "all">("expired");
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
    fetchPending();
    const interval = setInterval(fetchPending, 10000);
    return () => clearInterval(interval);
  }, [fetchPending]);

  // Polling System Status
  useEffect(() => {
    fetchSystemStatus();
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
      fetchAll();
      fetchLogs();
    }
    if (tab === "admins" && user?.role === "owner") {
      fetchAdmins();
    }
  }, [tab, user, fetchAll, fetchLogs, fetchAdmins]);

  useEffect(() => {
    if (tab === "all") {
      fetchAll();
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
              className="md:hidden" 
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
                <span>{isOwner ? <CrownIcon className="w-3.5 h-3.5" /> : <KeyIcon className="w-3.5 h-3.5" />}</span>
                <span>{isOwner ? "Owner (เจ้าของห้อง)" : "Door Operator"}</span>
              </div>
            </div>
          </div>

          {/* Navigation Links with vector SVGs */}
          <nav style={{ flex: 1, padding: "0 12px" }}>
            {[
              { id: "pending", icon: <ClockIcon />, label: "รายการรออนุมัติ", badge: pendingCount },
              ...(isOwner ? [
                { id: "all", icon: <UsersIcon />, label: "ทำเนียบ & ประวัติเข้าออก", badge: 0 },
                { id: "admins", icon: <SettingsIcon />, label: "ผู้ดูแลระบบ", badge: 0 },
              ] : []),
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
                  <span style={{ background: "var(--edu-pink)", color: "#fff", borderRadius: "99px", padding: "1px 8px", fontSize: 10.5, fontWeight: 800 }}>
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
                        <ClockIcon className="w-5 h-5" />
                      </span>
                      <span>ตรวจสอบสิทธิ์รออนุมัติ</span>
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
                      <SettingsIcon />
                      <span>จัดการสิทธิ์แอดมิน</span>
                    </span>
                  )}
                </h2>
                <div style={{ fontSize: 11.5, color: "var(--text-secondary)", fontWeight: 500, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                  <ClockIcon className="w-3.5 h-3.5" />
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
                      <span>บอร์ดควบคุมประตู</span>
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
                              <ClockIcon className="w-3.5 h-3.5" />
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
                          <th style={{ width: 90, textAlign: "center" }}>สถานะสิทธิ์</th>
                          <th>วันที่บันทึกระบบ</th>
                          <th style={{ width: 140, textAlign: "center" }}>จัดการข้อมูล</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.length === 0 ? (
                          <tr>
                            <td colSpan={8} style={{ textAlign: "center", padding: 50, color: "var(--text-secondary)" }}>
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
                  
                  <div style={{ display: "flex", gap: 10, width: "100%", maxWidth: 450 }}>
                    <div style={{ flex: 1 }}>
                      <input 
                        className="rmutp-input" 
                        placeholder="ค้นหาบันทึกระบบด้วยคีย์เวิร์ด..." 
                        value={logSearch}
                        onChange={e => setLogSearch(e.target.value)} 
                        style={{ padding: "8px 12px" }}
                      />
                    </div>
                    <div style={{ width: 180 }}>
                      <select 
                        className="rmutp-input" 
                        value={logFilter} 
                        onChange={e => setLogFilter(e.target.value)}
                        style={{ padding: "8px 12px" }}
                      >
                        <option value="all">กรองทุกกิจกรรมระบบ</option>
                        <option value="door_opened">ผ่านประตูสำเร็จ</option>
                        <option value="door_failed">ผ่านประตูล้มเหลว/ปฏิเสธสิทธิ์</option>
                        <option value="approved">การอนุมัติสิทธิ์สมัคร</option>
                        <option value="rejected">การปฏิเสธสิทธิ์สมัคร</option>
                        <option value="registered">ประวัติการลงทะเบียน</option>
                        <option value="export_pdf">การส่งออกรายงาน PDF</option>
                      </select>
                    </div>
                  </div>
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
                        {filteredLogs.length === 0 ? (
                          <tr>
                            <td colSpan={7} style={{ textAlign: "center", padding: 40, color: "var(--text-secondary)" }}>
                              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, justifyContent: "center" }}>
                                <AlertIcon />
                                <span>ไม่พบข้อมูลบันทึกความปลอดภัยในช่วงเวลานี้</span>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          filteredLogs.map((log, i) => {
                            const act = ACTION_METADATA[log.action] || { label: log.action, icon: <TerminalIcon />, color: "var(--text-primary)" };
                            return (
                              <tr key={log.id}>
                                <td style={{ color: "var(--text-muted)", fontSize: 12, textAlign: "center" }}>{i + 1}</td>
                                <td>
                                  <span style={{ display: "inline-flex", gap: 6, alignItems: "center", fontSize: 13, color: act.color, fontWeight: 800 }}>
                                    <span>{act.icon}</span> <span>{act.label}</span>
                                  </span>
                                </td>
                                <td>
                                  <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>
                                    {log.student_name || "เครื่องรับสัญญาณประตู / ESP32"}
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
                                        padding: "6px 10px", 
                                        borderRadius: 8, 
                                        fontFamily: "monospace", 
                                        fontSize: 10.5, 
                                        color: "var(--text-primary)", 
                                        whiteSpace: "pre-wrap", 
                                        wordBreak: "break-all",
                                        boxShadow: "inset 0 1px 2px rgba(0,0,0,0.02)"
                                      }}
                                    >
                                      {log.notes}
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

          </div>
        </main>
      </div>
    </div>
  );
}
