"use client";
import React from "react";
import { useDashboard } from "../DashboardContext";
import {
  formatDateTime,
  PendingCountdown,
  IdCardIcon,
  GraduationIcon,
  FacultyIcon,
  BranchIcon,
  CrossIcon,
  CheckIcon
} from "../DashboardHelpers";

export default function PendingPage() {
  const {
    filteredPending,
    selectedPendingIds,
    setSelectedPendingIds,
    bulkLoading,
    handleBulkApprove,
    handleBulkReject,
    pendingRoomFilter,
    setPendingRoomFilter,
    roomsList,
    swipeOffset,
    swipeAction,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    setRejectModal,
    loadingId,
    handleApprove
  } = useDashboard();

  return (
    <div className="animate-fade-in" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>
      <div className="premium-card" style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "between", alignItems: "center", flexWrap: "wrap", gap: 14, borderBottom: "1px solid var(--border)", paddingBottom: 18, marginBottom: 18 }}>
          <div>
            <h3 style={{ fontSize: 16.5, fontWeight: 900, color: "var(--text-primary)", margin: 0 }}>
              📥 รายการลงทะเบียนรอยืนยันสิทธิ์ ({filteredPending.length} คำขอ)
            </h3>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "4px 0 0" }}>
              นักศึกษาที่สแกน QR โค้ดหน้าห้องและส่งฟอร์มขอเข้าใช้ห้องเรียน
            </p>
          </div>

          {/* Bulk operations button panel */}
          {selectedPendingIds.length > 0 && (
            <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
              <button
                onClick={handleBulkApprove}
                disabled={bulkLoading}
                className="btn-success"
                style={{ padding: "8px 14px", fontSize: 12.5, borderRadius: 10, display: "flex", alignItems: "center", gap: 6 }}
              >
                ⚡ อนุมัติกลุ่ม ({selectedPendingIds.length})
              </button>
              <button
                onClick={handleBulkReject}
                disabled={bulkLoading}
                className="btn-danger"
                style={{ padding: "8px 14px", fontSize: 12.5, borderRadius: 10, display: "flex", alignItems: "center", gap: 6 }}
              >
                ✕ ปฏิเสธกลุ่ม
              </button>
            </div>
          )}

          {/* Filters */}
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginLeft: selectedPendingIds.length === 0 ? "auto" : "none" }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text-secondary)" }}>กรองตามห้อง:</span>
            <select
              className="smartaccess-input"
              value={pendingRoomFilter}
              onChange={e => setPendingRoomFilter(e.target.value)}
              style={{ padding: "6px 12px", fontSize: 12, width: 120, height: 32 }}
            >
              <option value="all">ทุกห้องเรียน</option>
              {roomsList.map(r => (
                <option key={r.room} value={r.room}>{r.room}</option>
              ))}
            </select>
          </div>
        </div>

        {filteredPending.length === 0 ? (
          <div style={{ padding: "60px 20px", textShadow: "none", textAlign: "center" }}>
            <div style={{ fontSize: 44, marginBottom: 12 }}>📥</div>
            <h4 style={{ fontSize: 15, fontWeight: 900, color: "var(--text-primary)", margin: 0 }}>ไม่มีคำขอลงทะเบียนใหม่รอยืนยันสิทธิ์</h4>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6 }}>เมื่อนักศึกษาสแกนขอใช้ห้องเรียนสำเร็จ คำขอจะเด้งขึ้นที่แผงควบคุมนี้แบบเรียลไทม์ทันที</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border)", fontSize: 12, color: "var(--text-secondary)" }}>
                  <th style={{ padding: "12px 14px", width: 40 }}>
                    <input
                      type="checkbox"
                      checked={selectedPendingIds.length === filteredPending.length && filteredPending.length > 0}
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedPendingIds(filteredPending.map(s => s.id));
                        } else {
                          setSelectedPendingIds([]);
                        }
                      }}
                    />
                  </th>
                  <th style={{ padding: "12px 14px" }}>นักศึกษา</th>
                  <th style={{ padding: "12px 14px" }}>ข้อมูลการศึกษา / อัตลักษณ์</th>
                  <th style={{ padding: "12px 14px" }}>ห้องที่ขอ / สัญญาณ IP</th>
                  <th style={{ padding: "12px 14px" }}>เวลาที่ขอ</th>
                  <th style={{ padding: "12px 14px", textAlign: "right" }}>การดำเนินการ (Actions)</th>
                </tr>
              </thead>
              <tbody>
                {filteredPending.map(student => {
                  const isSelected = selectedPendingIds.includes(student.id);
                  const offset = swipeOffset[student.id] || 0;
                  const actionType = swipeAction[student.id];

                  return (
                    <tr
                      key={student.id}
                      style={{
                        borderBottom: "1px solid var(--border)",
                        fontSize: 13,
                        background: isSelected ? "var(--smartaccess-purple-pale)" : "transparent",
                        position: "relative"
                      }}
                    >
                      <td style={{ padding: "16px 14px" }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedPendingIds((prev: number[]) => [...prev, student.id]);
                            } else {
                              setSelectedPendingIds((prev: number[]) => prev.filter(x => x !== student.id));
                            }
                          }}
                        />
                      </td>

                      {/* Mobile Swipe Container Wrap */}
                      <td
                        colSpan={5}
                        style={{ padding: 0 }}
                      >
                        <div
                          onTouchStart={e => handleTouchStart(student.id, e)}
                          onTouchMove={e => handleTouchMove(student.id, e)}
                          onTouchEnd={() => handleTouchEnd(student.id, student.first_name + " " + student.last_name)}
                          style={{
                            display: "flex",
                            width: "100%",
                            transform: `translateX(${offset}px)`,
                            transition: offset === 0 ? "transform 0.2s ease-out" : "none",
                            background: isSelected ? "var(--smartaccess-purple-pale)" : "var(--bg-secondary)",
                            position: "relative"
                          }}
                        >
                          {/* Left Swipe indicator (Approve) */}
                          {offset > 0 && (
                            <div style={{
                              position: "absolute", left: -offset, top: 0, bottom: 0, width: offset,
                              background: actionType === "approve" ? "#10B981" : "#059669",
                              color: "#fff", display: "flex", alignItems: "center", paddingLeft: 16,
                              fontSize: 12, fontWeight: "bold"
                            }}>
                              อนุมัติ (Release)
                            </div>
                          )}

                          {/* Right Swipe indicator (Reject) */}
                          {offset < 0 && (
                            <div style={{
                              position: "absolute", right: offset, top: 0, bottom: 0, width: -offset,
                              background: actionType === "reject" ? "#EF4444" : "#DC2626",
                              color: "#fff", display: "flex", alignItems: "center", justifyContent: "flex-end",
                              paddingRight: 16, fontSize: 12, fontWeight: "bold"
                            }}>
                              ปฏิเสธ (Reject)
                            </div>
                          )}

                          {/* Verbatim cell data rendering inside layout flex */}
                          <div style={{ display: "flex", width: "100%", alignItems: "center" }}>
                            <div style={{ padding: "16px 14px", flex: "1.1 1 0", minWidth: 160 }}>
                              <div style={{ fontWeight: 800, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
                                <span>{student.title}{student.first_name} {student.last_name}</span>
                              </div>
                              <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                                <IdCardIcon />
                                <span>รหัสนักศึกษา: {student.student_id}</span>
                              </div>
                            </div>

                            <div style={{ padding: "16px 14px", flex: "1.1 1 0", minWidth: 180 }}>
                              <div style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                                <GraduationIcon />
                                <span>ชั้นปีที่ {student.year}</span>
                              </div>
                              <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4, display: "flex", flexDirection: "column", gap: 2 }}>
                                <span><FacultyIcon /> {student.faculty}</span>
                                <span><BranchIcon /> สาขา {student.branch}</span>
                              </div>
                            </div>

                            <div style={{ padding: "16px 14px", flex: "1 1 0", minWidth: 150 }}>
                              <span style={{ background: "linear-gradient(135deg, var(--smartaccess-purple-pale) 0%, rgba(219,39,119,0.06) 100%)", border: "1px solid var(--border)", color: "var(--smartaccess-purple-dark)", borderRadius: "6px", padding: "4px 8px", fontSize: 11, fontWeight: 900 }}>
                                ห้อง {student.requested_room}
                              </span>
                              <div style={{ fontSize: 10.5, color: "var(--text-secondary)", marginTop: 8, display: "flex", alignItems: "center", gap: 4 }}>
                                <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "#10B981" }} />
                                <span>IP: {student.ip_address || "ไม่ทราบแอดเดรส"}</span>
                              </div>
                            </div>

                            <div style={{ padding: "16px 14px", flex: "1 1 0", minWidth: 150 }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>{formatDateTime(student.registered_at)}</div>
                              <div style={{ marginTop: 6 }}>
                                <PendingCountdown registeredAt={student.registered_at} />
                              </div>
                            </div>

                            <div style={{ padding: "16px 14px", flex: "0.8 1 0", minWidth: 150, display: "flex", gap: 8, justifyContent: "flex-end" }}>
                              <button
                                onClick={() => setRejectModal({ id: student.id, name: student.first_name + " " + student.last_name })}
                                disabled={loadingId === student.id}
                                className="btn-danger-light"
                                style={{ padding: "6px 10px", borderRadius: 8, fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}
                              >
                                ✕ ปฏิเสธ
                              </button>
                              <button
                                onClick={() => handleApprove(student.id)}
                                disabled={loadingId === student.id}
                                className="btn-success"
                                style={{ padding: "6px 12px", borderRadius: 8, fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}
                              >
                                {loadingId === student.id ? "..." : "✓ อนุมัติ"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
