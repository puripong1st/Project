"use client";
import React from "react";
import dynamic from "next/dynamic";
import { useDashboard } from "./DashboardContext";

// Lazy-load แต่ละแท็บ — โค้ดของแท็บจะถูกดาวน์โหลดเฉพาะตอนเปิดแท็บนั้นจริง
// (เดิม import ตรงทั้ง 8 แท็บ ทำให้ JS ของทุกแท็บถูกส่งมาพร้อมกันตั้งแต่แรก)
const Loading = () => (
  <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
    กำลังโหลด...
  </div>
);

const PendingPage = dynamic(() => import("./pending/page"), { loading: Loading });
const IotPage = dynamic(() => import("./iot/page"), { loading: Loading });
const AllPage = dynamic(() => import("./all/page"), { loading: Loading });
const AdminsPage = dynamic(() => import("./admins/page"), { loading: Loading });
const RoomsPage = dynamic(() => import("./rooms/page"), { loading: Loading });
const SettingsPage = dynamic(() => import("./settings/page"), { loading: Loading });
const GuidePage = dynamic(() => import("./guide/page"), { loading: Loading });
const HealthPage = dynamic(() => import("./health/page"), { loading: Loading });

export default function DashboardIndexPage() {
  const { tab, user } = useDashboard();

  if (!user) return null;
  const isOwner = user.role === "owner";

  return (
    <>
      {tab === "pending" && <PendingPage />}
      {tab === "iot" && <IotPage />}
      {tab === "all" && <AllPage />}
      {tab === "admins" && isOwner && <AdminsPage />}
      {tab === "rooms" && isOwner && <RoomsPage />}
      {tab === "settings" && isOwner && <SettingsPage />}
      {tab === "guide" && <GuidePage />}
      {tab === "health" && <HealthPage />}
    </>
  );
}
