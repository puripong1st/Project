"use client";
import React from "react";
import { useDashboard } from "../DashboardContext";
import {
  formatDateTime,
  CrownIcon,
  KeyIcon
} from "../DashboardHelpers";

export default function AdminsPage() {
  const {
    isOwner,
    user,
    newAdmin,
    setNewAdmin,
    newAdminAllowedRooms,
    setNewAdminAllowedRooms,
    roomsList,
    handleCreateAdmin,
    admins,
    handleDeleteAdmin,
    editingAdmin,
    setEditingAdmin,
    editAdminForm,
    setEditAdminForm,
    editAdminAllowedRooms,
    setEditAdminAllowedRooms,
    editAdminLoading,
    handleUpdateAdmin
  } = useDashboard();

  if (!user || !isOwner) return null;

  return (
    <div className="animate-fade-in" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>
      {/* New Admin register form card */}
      <div className="premium-card" style={{ padding: 24, textAlign: "left" }}>
        <h3 style={{ fontSize: 16.5, fontWeight: 900, color: "var(--text-primary)", borderBottom: "1px solid var(--border)", paddingBottom: 12, marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
          🔑 ลงทะเบียนเพิ่มสิทธิ์ผู้ดูแลระบบใหม่ (Add Administrator Account)
        </h3>
        <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 18 }}>
          ระบบรองรับการแบ่งสิทธิ์แบบมีขอบเขต (Role-Based Access Control) สำหรับจำกัดการมองเห็นและการอนุมัติรายห้องเรียนสำหรับ Door Operator
        </p>

        <form onSubmit={handleCreateAdmin}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                ชื่อผู้ใช้เข้าระบบ (Username) *
              </label>
              <input
                className="smartaccess-input"
                type="text"
                placeholder="ภาษาอังกฤษ / ตัวเลขเท่านั้น..."
                value={newAdmin.username}
                onChange={e => setNewAdmin((a: any) => ({ ...a, username: e.target.value }))}
                required
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                รหัสผ่านบัญชีผู้ใช้ (Password) *
              </label>
              <input
                className="smartaccess-input"
                type="password"
                placeholder="อย่างน้อย 6 ตัวอักษรขึ้นไป..."
                value={newAdmin.password}
                onChange={e => setNewAdmin((a: any) => ({ ...a, password: e.target.value }))}
                required
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                ชื่อ - นามสกุล เจ้าหน้าที่ *
              </label>
              <input
                className="smartaccess-input"
                type="text"
                placeholder="นายวิชา ใจดี..."
                value={newAdmin.full_name}
                onChange={e => setNewAdmin((a: any) => ({ ...a, full_name: e.target.value }))}
                required
              />
            </div>

            <div>
              <label htmlFor="new_admin_role" style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                ขอบเขตสิทธิ์การทำงาน (Role) *
              </label>
              <select
                id="new_admin_role"
                className="smartaccess-input"
                value={newAdmin.role}
                onChange={e => setNewAdmin((a: any) => ({ ...a, role: e.target.value }))}
              >
                <option value="door_operator">Door Operator (เปิดประตูได้อย่างเดียว)</option>
                <option value="log_viewer">Log Viewer (ดูประวัติและสถิติการเข้าออกห้องได้อย่างเดียว)</option>
                <option value="owner">Owner (เจ้าของสิทธิ์อนุมัติสิทธิ์และจัดการ)</option>
              </select>
            </div>
          </div>

          {/* RLS checklist allowed rooms */}
          {newAdmin.role !== "owner" && (
            <div style={{ marginTop: 16, padding: 14, borderRadius: 10, border: "1px dashed var(--border)", background: "rgba(255,255,255,0.01)" }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>
                ห้องเรียนที่อนุญาตให้เข้าถึง / จัดการได้ (Allowed Classroom Access) *
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
                            setNewAdminAllowedRooms((prev: any) => [...prev.filter((x: any) => x !== "*"), r.room]);
                          } else {
                            setNewAdminAllowedRooms((prev: any) => prev.filter((x: any) => x !== r.room));
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
            style={{
              marginTop: 18,
              padding: "10px 20px",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 800,
              border: "none",
              cursor: "pointer",
              background: "linear-gradient(135deg, var(--smartaccess-purple) 0%, var(--edu-pink) 100%)",
              color: "#fff",
              boxShadow: "0 6px 14px rgba(124,58,237,0.2)"
            }}
          >
            💾 สร้างและอนุมัติสิทธิ์ผู้ดูแลใหม่
          </button>
        </form>
      </div>

      {/* Table list of Admins */}
      <div className="premium-card" style={{ padding: 24 }}>
        <h3 style={{ fontSize: 16.5, fontWeight: 900, color: "var(--text-primary)", borderBottom: "1px solid var(--border)", paddingBottom: 12, marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
          👥 ทำเนียบผู้ดูแลและเจ้าหน้าที่ดำเนินงาน (Admin/Operator Directory)
        </h3>

        {admins.length === 0 ? (
          <div style={{ padding: "40px 20px", textShadow: "none", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
            <h4 style={{ fontSize: 14, fontWeight: 900, color: "var(--text-primary)", margin: 0 }}>ไม่พบรายชื่อผู้ดูแลระบบในประวัติ</h4>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border)", fontSize: 12, color: "var(--text-secondary)" }}>
                  <th style={{ padding: "12px 14px" }}>ชื่อผู้ดูแล (Full Name / Username)</th>
                  <th style={{ padding: "12px 14px" }}>สิทธิ์การทำงาน (System Role)</th>
                  <th style={{ padding: "12px 14px" }}>ขอบเขตความรับผิดชอบ (Classroom Scope)</th>
                  <th style={{ padding: "12px 14px" }}>วันเวลาลงทะเบียนแอดมิน</th>
                  <th style={{ padding: "12px 14px", textAlign: "right" }}>การจัดการ (Actions)</th>
                </tr>
              </thead>
              <tbody>
                {admins.map(admin => (
                  <tr key={admin.id} style={{ borderBottom: "1px solid var(--border)", fontSize: 12.5 }}>
                    <td style={{ padding: "14px" }}>
                      <div style={{ fontWeight: 800, color: "var(--text-primary)" }}>{admin.full_name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4 }}>ID: {admin.username}</div>
                    </td>
                    <td style={{ padding: "14px" }}>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 4, padding: "5px 10px", borderRadius: 8, fontSize: 11, fontWeight: 900,
                        background: admin.role === "owner" ? "#FDF2F8" : "var(--smartaccess-purple-pale)",
                        color: admin.role === "owner" ? "var(--edu-pink)" : "var(--smartaccess-purple-dark)"
                      }}>
                        {admin.role === "owner" ? <CrownIcon /> : <KeyIcon />}
                        {admin.role === "owner" ? "Owner (เจ้าของ)" : admin.role === "log_viewer" ? "Log Viewer" : "Door Operator"}
                      </span>
                    </td>
                    <td style={{ padding: "14px" }}>
                      <code style={{ fontSize: 11.5, color: "var(--smartaccess-purple-dark)", fontWeight: 800, background: "rgba(255,255,255,0.01)", padding: "4px 8px", borderRadius: 6, border: "1px solid var(--border)" }}>
                        {admin.role === "owner" ? "ทุกห้องเรียน (*)" : admin.allowed_rooms || "ยังไม่ได้ระบุห้องเรียน"}
                      </code>
                    </td>
                    <td style={{ padding: "14px" }}>
                      {formatDateTime(admin.created_at)}
                    </td>
                    <td style={{ padding: "14px", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        {/* Prevent owner self delete */}
                        {admin.username !== user.username && (
                          <button
                            onClick={() => handleDeleteAdmin(admin.id)}
                            className="btn-danger-light"
                            style={{ padding: "6px 10px", borderRadius: 8, fontSize: 12 }}
                          >
                            ถอนสิทธิ์
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setEditingAdmin(admin);
                            setEditAdminForm({ full_name: admin.full_name, role: admin.role });
                            setEditAdminAllowedRooms(
                              admin.allowed_rooms ? admin.allowed_rooms.split(",") : []
                            );
                          }}
                          className="btn-ghost"
                          style={{ padding: "6px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700 }}
                        >
                          ✏️ แก้ไขข้อมูล
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
                  onChange={e => setEditAdminForm((a: any) => ({ ...a, full_name: e.target.value }))}
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
                  onChange={e => setEditAdminForm((a: any) => ({ ...a, role: e.target.value }))}
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
                                setEditAdminAllowedRooms((prev: any) => [...prev.filter((x: any) => x !== "*"), r.room]);
                              } else {
                                setEditAdminAllowedRooms((prev: any) => prev.filter((x: any) => x !== r.room));
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
