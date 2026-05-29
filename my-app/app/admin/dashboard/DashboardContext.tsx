/* eslint-disable @typescript-eslint/no-explicit-any */
 
 
/* eslint-disable react-hooks/set-state-in-effect */
"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { getConfigCode, getArduinoCode } from "./ArduinoCode";


export interface Student {
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

export interface AdminUser {
  id: number;
  username: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: string;
  last_login?: string;
  allowed_rooms?: string | null;
}

export interface AccessLog {
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

export interface CurrentUser {
  id: number;
  username: string;
  full_name: string;
  role: "owner" | "door_operator" | "log_viewer";
}

export interface RoomConfig {
  auto_approve_enabled: boolean;
  auto_approve_start_time: string;
  auto_approve_end_time: string;
  auto_approve_days: string;
  auto_fill_enabled: boolean;
  auto_fill_mode: string;
  student_id_display_mode: string;
}

export const defaultRoomConfig = (): RoomConfig => ({
  auto_approve_enabled: false,
  auto_approve_start_time: "09:00",
  auto_approve_end_time: "16:00",
  auto_approve_days: "1,2,3,4,5",
  auto_fill_enabled: true,
  auto_fill_mode: "auto",
  student_id_display_mode: "full"
});

interface DashboardContextType {
  tab: "pending" | "all" | "admins" | "settings" | "rooms" | "guide" | "iot" | "health";
  setTab: React.Dispatch<React.SetStateAction<"pending" | "all" | "admins" | "settings" | "rooms" | "guide" | "iot" | "health">>;
  user: CurrentUser | null;
  setUser: React.Dispatch<React.SetStateAction<CurrentUser | null>>;
  pending: Student[];
  setPending: React.Dispatch<React.SetStateAction<Student[]>>;
  audioEnabled: boolean;
  setAudioEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  pendingRoomFilter: string;
  setPendingRoomFilter: React.Dispatch<React.SetStateAction<string>>;
  allStudents: Student[];
  setAll: React.Dispatch<React.SetStateAction<Student[]>>;
  logs: AccessLog[];
  setLogs: React.Dispatch<React.SetStateAction<AccessLog[]>>;
  admins: AdminUser[];
  setAdmins: React.Dispatch<React.SetStateAction<AdminUser[]>>;
  loadingId: number | null;
  setLoadingId: React.Dispatch<React.SetStateAction<number | null>>;
  toast: { msg: string; type: "success" | "error" } | null;
  setToast: React.Dispatch<React.SetStateAction<{ msg: string; type: "success" | "error" } | null>>;
  rejectModal: { id: number; name: string } | null;
  setRejectModal: React.Dispatch<React.SetStateAction<{ id: number; name: string } | null>>;
  rejectReason: string;
  setRejectReason: React.Dispatch<React.SetStateAction<string>>;
  settings: {
    auto_approve_enabled: boolean;
    auto_approve_start_time: string;
    auto_approve_end_time: string;
    auto_approve_days: string;
    discord_webhook_register: string;
    discord_webhook_approve: string;
    discord_webhook_logs: string;
    discord_webhook_admin_audit: string;
    auto_fill_enabled: boolean;
    auto_fill_mode: string;
    student_id_display_mode: string;
  };
  setSettings: React.Dispatch<React.SetStateAction<any>>;
  settingsLoading: boolean;
  setSettingsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  roomSaving: Record<string, boolean>;
  setRoomSaving: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  settingsLoaded: boolean;
  setSettingsLoaded: React.Dispatch<React.SetStateAction<boolean>>;
  rawSettings: Record<string, string>;
  setRawSettings: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  activeRoomDetails: { room: string; ip: string } | null;
  setActiveRoomDetails: React.Dispatch<React.SetStateAction<{ room: string; ip: string } | null>>;
  roomDetailsTab: "api" | "webhook" | "arduino";
  setRoomDetailsTab: React.Dispatch<React.SetStateAction<"api" | "webhook" | "arduino">>;
  playSoftChime: () => void;
  roomWebhookRegisterInput: string;
  setRoomWebhookRegisterInput: React.Dispatch<React.SetStateAction<string>>;
  roomWebhookApproveInput: string;
  setRoomWebhookApproveInput: React.Dispatch<React.SetStateAction<string>>;
  roomWebhookLogsInput: string;
  setRoomWebhookLogsInput: React.Dispatch<React.SetStateAction<string>>;
  roomTgRegisterInput: string;
  setRoomTgRegisterInput: React.Dispatch<React.SetStateAction<string>>;
  roomTgApproveInput: string;
  setRoomTgApproveInput: React.Dispatch<React.SetStateAction<string>>;
  roomTgLogsInput: string;
  setRoomTgLogsInput: React.Dispatch<React.SetStateAction<string>>;
  roomLineRegisterInput: string;
  setRoomLineRegisterInput: React.Dispatch<React.SetStateAction<string>>;
  roomLineApproveInput: string;
  setRoomLineApproveInput: React.Dispatch<React.SetStateAction<string>>;
  roomLineLogsInput: string;
  setRoomLineLogsInput: React.Dispatch<React.SetStateAction<string>>;
  roomDetailsLoading: boolean;
  setRoomDetailsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  originUrl: string;
  roomsList: { room: string; ip: string }[];
  setRoomsList: React.Dispatch<React.SetStateAction<{ room: string; ip: string }[]>>;
  newRoomCode: string;
  setNewRoomCode: React.Dispatch<React.SetStateAction<string>>;
  roomConfigs: Record<string, RoomConfig>;
  setRoomConfigs: React.Dispatch<React.SetStateAction<Record<string, RoomConfig>>>;
  expandedRoomSettings: Set<string>;
  setExpandedRoomSettings: React.Dispatch<React.SetStateAction<Set<string>>>;
  toggleRoomSettings: (room: string) => void;
  setRoomConfig: (room: string, patch: Partial<RoomConfig>) => void;
  newRoomIp: string;
  setNewRoomIp: React.Dispatch<React.SetStateAction<string>>;
  testingRoom: string | null;
  setTestingRoom: React.Dispatch<React.SetStateAction<string | null>>;
  testResults: Record<string, { online: boolean; ip: string; mode: string }>;
  setTestResults: React.Dispatch<React.SetStateAction<Record<string, { online: boolean; ip: string; mode: string }>>>;
  firmwareMode: "wokwi" | "physical";
  setFirmwareMode: React.Dispatch<React.SetStateAction<"wokwi" | "physical">>;
  selectedPendingIds: number[];
  setSelectedPendingIds: React.Dispatch<React.SetStateAction<number[]>>;
  bulkLoading: boolean;
  setBulkLoading: React.Dispatch<React.SetStateAction<boolean>>;
  swipeOffset: Record<number, number>;
  setSwipeOffset: React.Dispatch<React.SetStateAction<Record<number, number>>>;
  swipeAction: Record<number, "approve" | "reject" | null>;
  setSwipeAction: React.Dispatch<React.SetStateAction<Record<number, "approve" | "reject" | null>>>;
  touchStartX: React.MutableRefObject<Record<number, number>>;
  handleTouchStart: (id: number, e: React.TouchEvent) => void;
  handleTouchMove: (id: number, e: React.TouchEvent) => void;
  handleTouchEnd: (id: number, name: string) => void;
  analyticsData: any;
  setAnalyticsData: React.Dispatch<React.SetStateAction<any>>;
  analyticsLoading: boolean;
  setAnalyticsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  fetchAnalytics: () => Promise<void>;
  handleBulkApprove: () => Promise<void>;
  handleBulkReject: () => Promise<void>;
  fetchSettings: () => Promise<void>;
  handleOpenRoomDetails: (room: string, ip: string) => void;
  handleSaveRoomWebhook: () => Promise<void>;
  handleTestWebhook: (webhookUrl: string, type: "register" | "approve" | "logs" | "admin_audit", room?: string, opts?: { channel?: "discord" | "telegram" | "line"; botToken?: string; chatId?: string; channelToken?: string; targetId?: string }) => Promise<void>;
  handleSaveSettings: (e: React.FormEvent | React.MouseEvent) => Promise<void>;
  handleUploadFirmware: (e: React.FormEvent) => Promise<void>;
  copyToClipboard: (text: string) => void;
  getConfigCode: (roomCode: string, origin: string, mode?: "wokwi" | "physical") => string;
  getArduinoCode: (roomCode: string, origin: string, mode?: "wokwi" | "physical") => string;
  showToast: (msg: string, type?: "success" | "error") => void;
  fetchPending: () => Promise<void>;
  fetchAll: () => Promise<void>;
  fetchLogs: () => Promise<void>;
  fetchAdmins: () => Promise<void>;
  handleApprove: (id: number) => Promise<void>;
  handleReject: () => Promise<void>;
  handleOpenDoor: (id: number) => Promise<void>;
  handleDelete: (id: number, name: string) => Promise<void>;
  handleDeleteAdmin: (id: number) => Promise<void>;
  handleCreateAdmin: (e: React.FormEvent) => Promise<void>;
  handleUpdateAdmin: (e: React.FormEvent) => Promise<void>;
  handleExportPDFWithDateRange: (filterType: string, start: string, end: string) => Promise<void>;
  handleExportSingleStudentPDF: (id: number, name: string) => Promise<void>;
  handleLogout: () => Promise<void>;
  isOwner: boolean;
  pendingCount: number;
  filteredStudents: Student[];
  exportSummary: { total: number; approved: number; pending: number; rejected: number };
  filteredLogs: AccessLog[];
  totalFilteredLogs: number;
  totalLogPages: number;
  displayedLogs: AccessLog[];
  filteredPending: Student[];
  stats: { doorOpensToday: number; bypassToday: number; onlineBoards: number; totalBoards: number };
  searchQ: string;
  setSearchQ: React.Dispatch<React.SetStateAction<string>>;
  filterStatus: string;
  setFilter: React.Dispatch<React.SetStateAction<string>>;
  startDate: string;
  setStartDate: React.Dispatch<React.SetStateAction<string>>;
  endDate: string;
  setEndDate: React.Dispatch<React.SetStateAction<string>>;
  logFilter: string;
  setLogFilter: React.Dispatch<React.SetStateAction<string>>;
  logSearch: string;
  setLogSearch: React.Dispatch<React.SetStateAction<string>>;
  logPageSize: number;
  setLogPageSize: React.Dispatch<React.SetStateAction<number>>;
  logCurrentPage: number;
  setLogCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  newAdmin: any;
  setNewAdmin: React.Dispatch<React.SetStateAction<any>>;
  newAdminAllowedRooms: string[];
  setNewAdminAllowedRooms: React.Dispatch<React.SetStateAction<string[]>>;
  editingAdmin: any | null;
  setEditingAdmin: React.Dispatch<React.SetStateAction<any | null>>;
  editAdminForm: any;
  setEditAdminForm: React.Dispatch<React.SetStateAction<any>>;
  editAdminAllowedRooms: string[];
  setEditAdminAllowedRooms: React.Dispatch<React.SetStateAction<string[]>>;
  editAdminLoading: boolean;
  setEditAdminLoading: React.Dispatch<React.SetStateAction<boolean>>;
  currentTime: string;
  pdfLoading: boolean;
  setPdfLoading: React.Dispatch<React.SetStateAction<boolean>>;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  systemStatus: any;
  setSystemStatus: React.Dispatch<React.SetStateAction<any>>;
  deleteModalOpen: boolean;
  setDeleteModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  confirmPassword: string;
  setConfirmPassword: React.Dispatch<React.SetStateAction<string>>;
  deleteLoading: boolean;
  setDeleteLoading: React.Dispatch<React.SetStateAction<boolean>>;
  firmwareReleases: any[];
  setFirmwareReleases: React.Dispatch<React.SetStateAction<any[]>>;
  firmwareReleasesLoading: boolean;
  setFirmwareReleasesLoading: React.Dispatch<React.SetStateAction<boolean>>;
  firmwareUploadLoading: boolean;
  setFirmwareUploadLoading: React.Dispatch<React.SetStateAction<boolean>>;
  firmwareVersionInput: string;
  setFirmwareVersionInput: React.Dispatch<React.SetStateAction<string>>;
  firmwarePublicUrlInput: string;
  setFirmwarePublicUrlInput: React.Dispatch<React.SetStateAction<string>>;
  firmwareFile: File | null;
  setFirmwareFile: React.Dispatch<React.SetStateAction<File | null>>;
  firmwareLogs: any[];
  setFirmwareLogs: React.Dispatch<React.SetStateAction<any[]>>;
  firmwareLogsLoading: boolean;
  setFirmwareLogsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  healthData: any;
  setHealthData: React.Dispatch<React.SetStateAction<any>>;
  unlockingRoom: string | null;
  setUnlockingRoom: React.Dispatch<React.SetStateAction<string | null>>;
  recentlyUnlockedRooms: Record<string, boolean>;
  setRecentlyUnlockedRooms: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  handleAddRoom: (e?: React.FormEvent | React.MouseEvent) => Promise<void>;
  handleRemoveRoom: (roomCode: string) => Promise<void>;
  fetchSystemStatus: () => Promise<void>;
  fetchHealthData: () => Promise<void>;
  fetchFirmwares: () => Promise<void>;
  fetchFirmwareLogs: () => Promise<void>;
  saveSingleRoomSettings: (roomCode: string, ipAddress: string) => Promise<void>;
  handleTestConnection: (roomCode: string) => Promise<void>;
  handleDirectUnlockRoom: (roomCode: string) => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  // DECLARE ALL STATE HOOKS AT THE VERY TOP
  const [tab, setTab] = useState<"pending" | "all" | "admins" | "settings" | "rooms" | "guide" | "iot" | "health">("pending");
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [pending, setPending] = useState<Student[]>([]);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [pendingRoomFilter, setPendingRoomFilter] = useState<string>("all");
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
  // per-room Telegram chat id + LINE target id (3 หมวด: register/approve/logs)
  const [roomTgRegisterInput, setRoomTgRegisterInput] = useState("");
  const [roomTgApproveInput, setRoomTgApproveInput] = useState("");
  const [roomTgLogsInput, setRoomTgLogsInput] = useState("");
  const [roomLineRegisterInput, setRoomLineRegisterInput] = useState("");
  const [roomLineApproveInput, setRoomLineApproveInput] = useState("");
  const [roomLineLogsInput, setRoomLineLogsInput] = useState("");
  const [roomDetailsLoading, setRoomDetailsLoading] = useState(false);

  const [roomsList, setRoomsList] = useState<{ room: string; ip: string }[]>([]);
  const [newRoomCode, setNewRoomCode] = useState("");

  const [roomConfigs, setRoomConfigs] = useState<Record<string, RoomConfig>>({});
  const [expandedRoomSettings, setExpandedRoomSettings] = useState<Set<string>>(new Set());

  const [newRoomIp, setNewRoomIp] = useState("");
  const [testingRoom, setTestingRoom] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { online: boolean; ip: string; mode: string }>>({});
  const [firmwareMode, setFirmwareMode] = useState<"wokwi" | "physical">("physical");

  const [selectedPendingIds, setSelectedPendingIds] = useState<number[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  const [swipeOffset, setSwipeOffset] = useState<Record<number, number>>({});
  const [swipeAction, setSwipeAction] = useState<Record<number, "approve" | "reject" | null>>({});

  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const [searchQ, setSearchQ] = useState("");
  const [filterStatus, setFilter] = useState("all");
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
  const [systemStatus, setSystemStatus] = useState<any>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [firmwareReleases, setFirmwareReleases] = useState<any[]>([]);
  const [firmwareReleasesLoading, setFirmwareReleasesLoading] = useState(false);
  const [firmwareUploadLoading, setFirmwareUploadLoading] = useState(false);
  const [firmwareVersionInput, setFirmwareVersionInput] = useState("");
  const [firmwarePublicUrlInput, setFirmwarePublicUrlInput] = useState("");
  const [firmwareFile, setFirmwareFile] = useState<File | null>(null);
  const [firmwareLogs, setFirmwareLogs] = useState<any[]>([]);
  const [firmwareLogsLoading, setFirmwareLogsLoading] = useState(false);

  const [healthData, setHealthData] = useState<any>(null);
  const [unlockingRoom, setUnlockingRoom] = useState<string | null>(null);
  const [recentlyUnlockedRooms, setRecentlyUnlockedRooms] = useState<Record<string, boolean>>({});

  const lastPendingCountRef = useRef(0);
  const originUrl = typeof window !== "undefined" ? window.location.origin : "";
  const touchStartX = useRef<Record<number, number>>({});

  // Play chime
  const playSoftChime = useCallback(() => {
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.exponentialRampToValueAtTime(1320, now + 0.12);

      gain1.gain.setValueAtTime(0.12, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(523.25, now);

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

  const toggleRoomSettings = (room: string) => setExpandedRoomSettings(prev => {
    const n = new Set(prev);
    n.has(room) ? n.delete(room) : n.add(room);
    return n;
  });

  const setRoomConfig = (room: string, patch: Partial<RoomConfig>) => setRoomConfigs(prev => ({
    ...prev,
    [room]: { ...(prev[room] ?? defaultRoomConfig()), ...patch }
  }));

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

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

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

          const confRooms = data.settings.configured_rooms || "CE-401,CE-402";
          const rooms = confRooms.split(",").filter(Boolean).map((rm: string) => ({
            room: rm,
            ip: data.settings[`room_ip_${rm}`] || "192.168.1.100"
          }));
          setRoomsList(rooms);

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
    setRoomTgRegisterInput(rawSettings[`room_telegram_register_${room}`] || "");
    setRoomTgApproveInput(rawSettings[`room_telegram_approve_${room}`] || "");
    setRoomTgLogsInput(rawSettings[`room_telegram_logs_${room}`] || "");
    setRoomLineRegisterInput(rawSettings[`room_line_register_${room}`] || "");
    setRoomLineApproveInput(rawSettings[`room_line_approve_${room}`] || "");
    setRoomLineLogsInput(rawSettings[`room_line_logs_${room}`] || "");
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
            [`room_telegram_register_${activeRoomDetails.room}`]: roomTgRegisterInput,
            [`room_telegram_approve_${activeRoomDetails.room}`]: roomTgApproveInput,
            [`room_telegram_logs_${activeRoomDetails.room}`]: roomTgLogsInput,
            [`room_line_register_${activeRoomDetails.room}`]: roomLineRegisterInput,
            [`room_line_approve_${activeRoomDetails.room}`]: roomLineApproveInput,
            [`room_line_logs_${activeRoomDetails.room}`]: roomLineLogsInput,
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

  const handleTestWebhook = async (
    webhookUrl: string,
    type: "register" | "approve" | "logs" | "admin_audit",
    room?: string,
    opts?: { channel?: "discord" | "telegram" | "line"; botToken?: string; chatId?: string; channelToken?: string; targetId?: string }
  ) => {
    const channel = opts?.channel || "discord";

    // Client-side guard ต่อช่อง
    if (channel === "discord" && (!webhookUrl || !webhookUrl.trim().startsWith("https://discord.com/api/webhooks/"))) {
      showToast(" ลิงก์ Discord Webhook ไม่ถูกต้อง หรือไม่ได้ระบุ", "error");
      return;
    }
    if (channel === "telegram" && (!opts?.botToken?.trim() || !opts?.chatId?.trim())) {
      showToast(" กรุณาระบุ Telegram Bot Token และ Chat ID ให้ครบ", "error");
      return;
    }
    if (channel === "line" && (!opts?.channelToken?.trim() || !opts?.targetId?.trim())) {
      showToast(" กรุณาระบุ LINE Channel Token และ Target ID ให้ครบ", "error");
      return;
    }

    const channelLabel = channel === "telegram" ? "Telegram" : channel === "line" ? "LINE" : "Discord";
    showToast(` กำลังส่งข้อความทดสอบเข้า ${channelLabel}...`, "success");
    try {
      const response = await fetch("/api/system/test-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          url: channel === "discord" ? webhookUrl.trim() : undefined,
          type,
          room: room || "default",
          botToken: opts?.botToken?.trim(),
          chatId: opts?.chatId?.trim(),
          channelToken: opts?.channelToken?.trim(),
          targetId: opts?.targetId?.trim(),
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        showToast(data.message || ` ส่งข้อความทดสอบเข้า ${channelLabel} สำเร็จเรียบร้อยแล้ว!`, "success");
      } else {
        showToast(data.error || `เกิดข้อผิดพลาดในการส่ง ${channelLabel}`, "error");
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

  // Clock tick
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleString("th-TH", {
      timeZone: "Asia/Bangkok", year: "numeric", month: "long", day: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
    }));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  // Auth me check
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

  const fetchAll = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterStatus !== "all") params.set("status", filterStatus);
    if (searchQ) params.set("search", searchQ);
    const r = await fetch(`/api/students?${params}`);
    const d = await r.json();
    setAll(d.students || []);
  }, [filterStatus, searchQ]);

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

  const fetchHealthData = useCallback(async () => {
    try {
      const r = await fetch("/api/system/health");
      if (r.ok) {
        setHealthData(await r.json());
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (user?.role === "owner") {
      fetchAdmins();
    }
  }, [user, fetchAdmins]);

  // Real-time EventSource SSE subscription
  useEffect(() => {
    if (!user) return;

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
      es.close();
      const iv = setInterval(() => { fetchPending(); fetchLogs(); }, 15000);
      return () => clearInterval(iv);
    };

    return () => es.close();
  }, [user, fetchPending, fetchLogs]);

  // Polling states
  useEffect(() => {
    if (!user) return;
    setTimeout(() => {
      fetchSystemStatus();
    }, 0);
    const interval = setInterval(fetchSystemStatus, 30000);
    return () => clearInterval(interval);
  }, [fetchSystemStatus, user]);

  useEffect(() => {
    if (!user) return;
    fetchHealthData();
    const interval = setInterval(fetchHealthData, 60000);
    return () => clearInterval(interval);
  }, [fetchHealthData, user]);

  useEffect(() => {
    if (settingsLoaded || roomsList.length > 0 || !systemStatus?.esp32Devices?.length) return;
    const esp32Devices = systemStatus.esp32Devices;
    queueMicrotask(() => {
      setRoomsList(
        esp32Devices.map((device: any) => ({
          room: device.room,
          ip: device.ip || "192.168.1.100",
        }))
      );
    });
  }, [settingsLoaded, roomsList.length, systemStatus?.esp32Devices]);

  // Auto-pruning expired logs on startup
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
  }, [user, fetchSystemStatus, fetchAll, fetchLogs, fetchFirmwares, fetchFirmwareLogs]);

  // Watch tab switches
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

  // Handlers
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
      fetchLogs();
    } catch {
      showToast("ไม่สามารถสร้างไฟล์รายงาน PDF ตามช่วงเวลานี้ได้", "error");
    } finally {
      setPdfLoading(false);
    }
  }

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
            if (r.ok) successCount++;
            else failCount++;
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

  async function handleBulkReject() {
    if (selectedPendingIds.length === 0) return;
    const reason = prompt("กรุณาระบุเหตุผลการปฏิเสธคำขอทั้งหมดที่เลือก:", "ไม่ได้รับสิทธิ์เข้าใช้ระบบแบบกลุ่มโดยแอดมิน");
    if (reason === null) return;
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
            if (r.ok) successCount++;
            else failCount++;
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

  async function saveSingleRoomSettings(roomCode: string, ipAddress: string) {
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
  }

  async function handleSaveSettings(e: React.FormEvent | React.MouseEvent) {
    if (e) e.preventDefault();
    setSettingsLoading(true);

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

    // ช่องแจ้งเตือน Telegram + LINE ส่วนกลาง (เก็บใน rawSettings, ส่งผ่าน custom_settings)
    const NOTIFY_CHANNEL_KEYS = [
      "telegram_bot_token", "telegram_chat_register", "telegram_chat_approve", "telegram_chat_logs", "telegram_chat_admin_audit",
      "line_channel_token", "line_target_register", "line_target_approve", "line_target_logs", "line_target_admin_audit",
    ];
    NOTIFY_CHANNEL_KEYS.forEach(k => {
      if (rawSettings[k] !== undefined) custom_settings[k] = (rawSettings[k] || "").trim();
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
  }

  async function handleUploadFirmware(e: React.FormEvent) {
    if (e) e.preventDefault();
    if (!/^\d+\.\d+\.\d+$/.test(firmwareVersionInput)) {
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
  }

  async function handleTestConnection(roomCode: string) {
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
  }

  async function handleDirectUnlockRoom(roomCode: string) {
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
        setRecentlyUnlockedRooms(prev => ({ ...prev, [roomCode]: true }));
        setTimeout(() => {
          setRecentlyUnlockedRooms(prev => ({ ...prev, [roomCode]: false }));
        }, 5000);
        fetchSystemStatus();
      } else {
        showToast(data.error || `ไม่สามารถเปิดประตูห้อง ${roomCode} ได้`, "error");
      }
    } catch {
      showToast("เกิดข้อผิดพลาดการเชื่อมต่อระบบปลดล็อก", "error");
    } finally {
      setUnlockingRoom(null);
    }
  }

  async function handleAddRoom(e?: React.FormEvent | React.MouseEvent) {
    if (e) e.preventDefault();
    const code = newRoomCode.trim().toUpperCase();
    const ip = newRoomIp.trim();
    if (!code || !ip) {
      showToast("กรุณากรอกรหัสห้องเรียนและ IP Address", "error");
      return;
    }
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
  }

  async function handleRemoveRoom(roomCode: string) {
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
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  }

  // Shared computed selectors
  const isOwner = user?.role === "owner";
  const pendingCount = pending.length;

  const filteredStudents = allStudents.filter(s => {
    const regDate = s.registered_at.split("T")[0];
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

    const logDate = log.timestamp.split("T")[0];
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

  const getStats = () => {
    const localBangkok = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Bangkok" }));
    const y = localBangkok.getFullYear();
    const m = String(localBangkok.getMonth() + 1).padStart(2, "0");
    const d = String(localBangkok.getDate()).padStart(2, "0");
    const todayStrStr = `${y}-${m}-${d}`;

    const doorOpensToday = logs.filter(log => {
      if (!log.timestamp) return false;
      const logDate = new Date(log.timestamp).toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
      return logDate === todayStrStr && log.action === "door_opened";
    }).length;

    const bypassToday = logs.filter(log => {
      if (!log.timestamp) return false;
      const logDate = new Date(log.timestamp).toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });
      return logDate === todayStrStr && log.action === "door_opened" && (log.notes?.includes("Bypass") || log.notes?.includes("สแกนซ้ำ"));
    }).length;

    const onlineBoards = systemStatus?.esp32Devices?.filter((dev: any) => dev.online).length || 0;
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
    <DashboardContext.Provider value={{
      tab, setTab,
      user, setUser,
      pending, setPending,
      audioEnabled, setAudioEnabled,
      pendingRoomFilter, setPendingRoomFilter,
      allStudents, setAll,
      logs, setLogs,
      admins, setAdmins,
      loadingId, setLoadingId,
      toast, setToast,
      rejectModal, setRejectModal,
      rejectReason, setRejectReason,
      settings, setSettings,
      settingsLoading, setSettingsLoading,
      roomSaving, setRoomSaving,
      settingsLoaded, setSettingsLoaded,
      rawSettings, setRawSettings,
      activeRoomDetails, setActiveRoomDetails,
      roomDetailsTab, setRoomDetailsTab,
      playSoftChime,
      roomWebhookRegisterInput, setRoomWebhookRegisterInput,
      roomWebhookApproveInput, setRoomWebhookApproveInput,
      roomWebhookLogsInput, setRoomWebhookLogsInput,
      roomTgRegisterInput, setRoomTgRegisterInput,
      roomTgApproveInput, setRoomTgApproveInput,
      roomTgLogsInput, setRoomTgLogsInput,
      roomLineRegisterInput, setRoomLineRegisterInput,
      roomLineApproveInput, setRoomLineApproveInput,
      roomLineLogsInput, setRoomLineLogsInput,
      roomDetailsLoading, setRoomDetailsLoading,
      originUrl,
      roomsList, setRoomsList,
      newRoomCode, setNewRoomCode,
      roomConfigs, setRoomConfigs,
      expandedRoomSettings, setExpandedRoomSettings,
      toggleRoomSettings,
      setRoomConfig,
      newRoomIp, setNewRoomIp,
      testingRoom, setTestingRoom,
      testResults, setTestResults,
      firmwareMode, setFirmwareMode,
      selectedPendingIds, setSelectedPendingIds,
      bulkLoading, setBulkLoading,
      swipeOffset, setSwipeOffset,
      swipeAction, setSwipeAction,
      touchStartX,
      handleTouchStart,
      handleTouchMove,
      handleTouchEnd,
      analyticsData, setAnalyticsData,
      analyticsLoading, setAnalyticsLoading,
      fetchAnalytics,
      handleBulkApprove,
      handleBulkReject,
      fetchSettings,
      handleOpenRoomDetails,
      handleSaveRoomWebhook,
      handleTestWebhook,
      handleSaveSettings,
      handleUploadFirmware,
      copyToClipboard,
      getConfigCode,
      getArduinoCode,
      showToast,
      fetchPending,
      fetchAll,
      fetchLogs,
      fetchAdmins,
      handleApprove,
      handleReject,
      handleOpenDoor,
      handleDelete,
      handleDeleteAdmin,
      handleCreateAdmin,
      handleUpdateAdmin,
      handleExportPDFWithDateRange,
      handleExportSingleStudentPDF,
      handleLogout,
      isOwner,
      pendingCount,
      filteredStudents,
      exportSummary,
      filteredLogs,
      totalFilteredLogs,
      totalLogPages,
      displayedLogs,
      filteredPending,
      stats,
      searchQ, setSearchQ,
      filterStatus, setFilter,
      startDate, setStartDate,
      endDate, setEndDate,
      logFilter, setLogFilter,
      logSearch, setLogSearch,
      logPageSize, setLogPageSize,
      logCurrentPage, setLogCurrentPage,
      newAdmin, setNewAdmin,
      newAdminAllowedRooms, setNewAdminAllowedRooms,
      editingAdmin, setEditingAdmin,
      editAdminForm, setEditAdminForm,
      editAdminAllowedRooms, setEditAdminAllowedRooms,
      editAdminLoading, setEditAdminLoading,
      currentTime,
      pdfLoading, setPdfLoading,
      mobileMenuOpen, setMobileMenuOpen,
      systemStatus, setSystemStatus,
      deleteModalOpen, setDeleteModalOpen,
      confirmPassword, setConfirmPassword,
      deleteLoading, setDeleteLoading,
      firmwareReleases, setFirmwareReleases,
      firmwareReleasesLoading, setFirmwareReleasesLoading,
      firmwareUploadLoading, setFirmwareUploadLoading,
      firmwareVersionInput, setFirmwareVersionInput,
      firmwarePublicUrlInput, setFirmwarePublicUrlInput,
      firmwareFile, setFirmwareFile,
      firmwareLogs, setFirmwareLogs,
      firmwareLogsLoading, setFirmwareLogsLoading,
      healthData, setHealthData,
      unlockingRoom, setUnlockingRoom,
      recentlyUnlockedRooms, setRecentlyUnlockedRooms,
      handleAddRoom,
      handleRemoveRoom,
      fetchSystemStatus,
      fetchHealthData,
      fetchFirmwares,
      fetchFirmwareLogs,
      saveSingleRoomSettings,
      handleTestConnection,
      handleDirectUnlockRoom,
    }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}
