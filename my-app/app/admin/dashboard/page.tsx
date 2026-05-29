"use client";
import React from "react";
import { useDashboard } from "./DashboardContext";
import PendingPage from "./pending/page";
import IotPage from "./iot/page";
import AllPage from "./all/page";
import AdminsPage from "./admins/page";
import RoomsPage from "./rooms/page";
import SettingsPage from "./settings/page";
import GuidePage from "./guide/page";

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
    </>
  );
}
