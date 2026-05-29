"use client";
import React from "react";
import { useDashboard } from "../DashboardContext";
import {
  formatDateTime,
  IdCardIcon,
  GraduationIcon,
  FacultyIcon,
  BranchIcon,
  getLogActionMetadata,
  isAccessRejectedLog,
  renderLogNotes
} from "../DashboardHelpers";

export default function AllPage() {
  const {
    isOwner,
    user,
    exportSummary,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    handleExportPDFWithDateRange,
    searchQ,
    setSearchQ,
    filterStatus,
    setFilter,
    filteredStudents,
    handleDelete,
    handleExportSingleStudentPDF,
    loadingId,
    handleOpenDoor,
    logSearch,
    setLogSearch,
    setLogCurrentPage,
    logFilter,
    setLogFilter,
    displayedLogs,
    totalFilteredLogs,
    logCurrentPage,
    totalLogPages
  } = useDashboard();

  if (!user) return null;

  return (
    <div className="animate-fade-in" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>
      {/* Export PDF Report Hub panel */}
      {(isOwner || user.role === "log_viewer") && (
        <div className="premium-card export-hub" style={{ padding: 0 }}>
          <div style={{ padding: 22, borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", justifyItems: "center", justifyContent: "center", textAlign: "left" }}>
            <h4 style={{ fontSize: 15.5, fontWeight: 900, color: "var(--smartaccess-purple-dark)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              📊 ศูนย์ประมวลและสร้างรายงานเอกสาร PDF (Automatic PDF Report Generator)
            </h4>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "8px 0 16px 0", lineHeight: "1.45" }}>
              ระบบรองรับการสร้างเอกสารและส่งออกแบบรวม (Batch PDF) ตามเงื่อนไขการค้นหาและฟิลเตอร์ช่วงวันที่ด้านล่างอย่างเป็นระบบ ถูกต้องตามพระราชบัญญัติคอมพิวเตอร์และ PDPA ทุกประการ
            </p>

            {/* Stat summary grid */}
            <div className="export-summary-grid">
              <div className="export-stat">
                <span style={{ fontSize: 10, fontWeight: 800, color: "var(--text-secondary)", display: "block" }}>คำขอที่คัดเลือก (Filtered):</span>
                <span style={{ fontSize: 16, fontWeight: 900, color: "var(--smartaccess-purple)", display: "inline-block", marginTop: 4 }}>
                  {exportSummary.total} คำขอ
                </span>
              </div>
              <div className="export-stat">
                <span style={{ fontSize: 10, fontWeight: 800, color: "var(--text-secondary)", display: "block" }}>อนุมัติผ่านสิทธิ์ (Approved):</span>
                <span style={{ fontSize: 16, fontWeight: 900, color: "#10B981", display: "inline-block", marginTop: 4 }}>
                  {exportSummary.approved} รายการ
                </span>
              </div>
              <div className="export-stat" style={{ marginTop: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: "var(--text-secondary)", display: "block" }}>คำขอปฏิเสธ (Rejected):</span>
                <span style={{ fontSize: 16, fontWeight: 900, color: "#EF4444", display: "inline-block", marginTop: 4 }}>
                  {exportSummary.rejected} รายการ
                </span>
              </div>
              <div className="export-stat" style={{ marginTop: 6 }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: "var(--text-secondary)", display: "block" }}>กำลังรออนุมัติ (Pending):</span>
                <span style={{ fontSize: 16, fontWeight: 900, color: "#F59E0B", display: "inline-block", marginTop: 4 }}>
                  {exportSummary.pending} รายการ
                </span>
              </div>
            </div>
          </div>

          {/* PDF control panel */}
          <div style={{ padding: 22, display: "flex", flexDirection: "column", gap: 14, textAlign: "left" }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text-primary)" }}>📅 1. กำหนดช่วงข้อมูลวันที่ออกรายงาน (Date Retention Range)</span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
              <div>
                <label style={{ display: "block", fontSize: 10.5, color: "var(--text-secondary)", marginBottom: 4 }}>วันที่เริ่มต้น (Date Start):</label>
                <input
                  type="date"
                  className="smartaccess-input"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  style={{ padding: "6px 10px", fontSize: 12 }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 10.5, color: "var(--text-secondary)", marginBottom: 4 }}>วันที่สิ้นสุด (Date End):</label>
                <input
                  type="date"
                  className="smartaccess-input"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  style={{ padding: "6px 10px", fontSize: 12 }}
                />
              </div>
            </div>

            <div style={{ borderTop: "1px dashed var(--border)", paddingTop: 14, marginTop: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: "var(--text-primary)" }}>🚀 2. ดำเนินการออกรายงานแบ่งตามประเภทสเตตัส</span>
              <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                {[
                  { type: "all", label: "📄 รายงานรวมทุกสถานะ", color: "var(--smartaccess-purple-dark)" },
                  { type: "approved", label: "✓ รายงานอนุมัติผ่านประตู", color: "#059669" },
                  { type: "rejected", label: "✕ รายงานการปฏิเสธคำขอ", color: "#DC2626" },
                ].map(btn => (
                  <button
                    key={btn.type}
                    onClick={() => handleExportPDFWithDateRange(btn.type, startDate, endDate)}
                    disabled={useDashboard().pdfLoading}
                    className="btn-ghost"
                    style={{
                      padding: "8px 12px",
                      fontSize: 12,
                      borderRadius: 8,
                      fontWeight: 700,
                      borderColor: btn.color,
                      color: btn.color
                    }}
                  >
                    {useDashboard().pdfLoading ? "⏳ กำลังดึง..." : btn.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table Directory */}
      <div className="premium-card" style={{ padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "between", alignItems: "center", flexWrap: "wrap", gap: 14, borderBottom: "1px solid var(--border)", paddingBottom: 18, marginBottom: 18 }}>
          <div>
            <h3 style={{ fontSize: 16.5, fontWeight: 900, color: "var(--text-primary)", margin: 0 }}>
              👥 ทำเนียบสิทธิ์ผ่านประตู & ประวัติการส่งขอเข้าใช้ห้องเรียน
            </h3>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "4px 0 0" }}>
              รายชื่อและสเตตัสนักศึกษาทุกคนที่ลงทะเบียนในระบบ
            </p>
          </div>

          {/* Filters */}
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginLeft: "auto", flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="🔍 ค้นหานักศึกษา (ชื่อ, สกุล, รหัส)..."
              className="smartaccess-input"
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              style={{ width: 220, height: 32, padding: "6px 12px", fontSize: 12 }}
            />
            <select
              className="smartaccess-input"
              value={filterStatus}
              onChange={e => setFilter(e.target.value)}
              style={{ width: 130, height: 32, padding: "6px 12px", fontSize: 12 }}
            >
              <option value="all">ทุกสถานะสิทธิ์</option>
              <option value="approved">✓ อนุมัติผ่านสิทธิ์แล้ว</option>
              <option value="rejected">✕ ถูกปฏิเสธสิทธิ์</option>
              <option value="pending">📥 รอยืนยันสิทธิ์</option>
            </select>
          </div>
        </div>

        {filteredStudents.length === 0 ? (
          <div style={{ padding: "40px 20px", textShadow: "none", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>👥</div>
            <h4 style={{ fontSize: 14, fontWeight: 900, color: "var(--text-primary)", margin: 0 }}>ไม่พบรายชื่อนักศึกษาตรงตามเงื่อนไขค้นหา</h4>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6 }}>กรุณาลองเปลี่ยนคำค้นหา หรือเปลี่ยนสถานะที่กรอง</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border)", fontSize: 12, color: "var(--text-secondary)" }}>
                  <th style={{ padding: "12px 14px" }}>ชื่อ - นามสกุล / รหัสนักศึกษา</th>
                  <th style={{ padding: "12px 14px" }}>ระดับชั้นปี / ข้อมูลคณะสาขา</th>
                  <th style={{ padding: "12px 14px" }}>สิทธิ์ห้อง / วันเวลาลงทะเบียน</th>
                  <th style={{ padding: "12px 14px" }}>สถานะอนุมัติ (Access Status)</th>
                  <th style={{ padding: "12px 14px", textAlign: "right" }}>การจัดการ (Actions)</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(student => (
                  <tr key={student.id} style={{ borderBottom: "1px solid var(--border)", fontSize: 13, background: "rgba(255,255,255,0.01)" }}>
                    <td style={{ padding: "14px" }}>
                      <div style={{ fontWeight: 800, color: "var(--text-primary)" }}>
                        {student.title}{student.first_name} {student.last_name}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
                        <IdCardIcon />
                        <span>รหัสประจำตัว: {student.student_id}</span>
                      </div>
                    </td>
                    <td style={{ padding: "14px" }}>
                      <div style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                        <GraduationIcon />
                        <span>ชั้นปีที่ {student.year}</span>
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4, display: "flex", flexDirection: "column", gap: 2 }}>
                        <span><FacultyIcon /> {student.faculty}</span>
                        <span><BranchIcon /> สาขา {student.branch}</span>
                      </div>
                    </td>
                    <td style={{ padding: "14px" }}>
                      <span style={{ background: "linear-gradient(135deg, var(--smartaccess-purple-pale) 0%, rgba(219,39,119,0.06) 100%)", border: "1px solid var(--border)", color: "var(--smartaccess-purple-dark)", borderRadius: "6px", padding: "4px 8px", fontSize: 11, fontWeight: 900 }}>
                        ห้อง {student.requested_room}
                      </span>
                      <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 8 }}>
                        📅 {formatDateTime(student.registered_at)}
                      </div>
                    </td>
                    <td style={{ padding: "14px" }}>
                      {/* Access status rendering */}
                      {student.status === "approved" && (
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 8, fontSize: 11, fontWeight: 900,
                          background: "#ECFDF5", color: "#059669", border: "1px solid rgba(16,185,129,0.25)"
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981" }} />
                          ✓ ได้สิทธิ์ผ่านประตู
                        </span>
                      )}
                      {student.status === "rejected" && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "flex-start" }}>
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 8, fontSize: 11, fontWeight: 900,
                            background: "#FEF2F2", color: "#DC2626", border: "1px solid rgba(220,38,38,0.2)"
                          }}>
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#EF4444" }} />
                            ✕ ถูกปฏิเสธสิทธิ์
                          </span>
                          {student.rejection_reason && (
                            <span style={{ fontSize: 10.5, color: "var(--text-secondary)", fontStyle: "italic", marginLeft: 2 }}>
                              เหตุผล: {student.rejection_reason}
                            </span>
                          )}
                        </div>
                      )}
                      {student.status === "pending" && (
                        <span style={{
                          display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 8, fontSize: 11, fontWeight: 900,
                          background: "#FFFBEB", color: "#D97706", border: "1px solid rgba(245,158,11,0.25)"
                        }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#F59E0B" }} />
                          ⏳ รอยืนยันสิทธิ์
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "14px", textAlign: "right" }}>
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        {isOwner && (
                          <button
                            onClick={() => handleDelete(student.id, student.first_name + " " + student.last_name)}
                            className="btn-danger-light"
                            style={{ padding: "6px 8px", borderRadius: 8, fontSize: 12 }}
                            title="ลบข้อมูลถาวร"
                          >
                            ลบ
                          </button>
                        )}

                        <button
                          onClick={() => handleExportSingleStudentPDF(student.id, student.first_name + " " + student.last_name)}
                          disabled={loadingId === student.id}
                          className="btn-ghost"
                          style={{ padding: "6px 10px", borderRadius: 8, fontSize: 12, fontWeight: 700 }}
                        >
                          {loadingId === student.id ? "⏳ ดึงข้อมูล..." : "📇 ออกการ์ด PDF"}
                        </button>

                        {student.status === "approved" && (isOwner || user.role === "door_operator") && (
                          <button
                            onClick={() => handleOpenDoor(student.id)}
                            disabled={loadingId === student.id}
                            className="btn-success"
                            style={{ padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 800, display: "flex", alignItems: "center", gap: 4 }}
                          >
                            🔓 {loadingId === student.id ? "เปิด..." : "เปิดประตู"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Access Logs section */}
      {(isOwner || user.role === "log_viewer") && (
        <div className="premium-card animate-fade-in" style={{ padding: 24, marginTop: 8 }}>
          <div style={{ display: "flex", justifyContent: "between", alignItems: "center", flexWrap: "wrap", gap: 14, borderBottom: "1px solid var(--border)", paddingBottom: 18, marginBottom: 18 }}>
            <div>
              <h3 style={{ fontSize: 16.5, fontWeight: 900, color: "var(--text-primary)", margin: 0 }}>
                📜 ประวัติจราจรและบันทึกความปลอดภัยเข้าออก (Access Traffic Audit Logs)
              </h3>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "4px 0 0" }}>
                บันทึกประวัติการผ่านประตูคำขอทุกสถานะ ตามข้อบังคับ พ.ร.บ. คอมพิวเตอร์ (เก็บรักษาขั้นต่ำ 90 วัน)
              </p>
            </div>

            {/* Filters */}
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginLeft: "auto", flexWrap: "wrap" }}>
              <input
                type="text"
                placeholder="🔍 ค้นในบันทึก (ชื่อนักศึกษา/แอดมิน)..."
                className="smartaccess-input"
                value={logSearch}
                onChange={e => { setLogSearch(e.target.value); setLogCurrentPage(1); }}
                style={{ width: 220, height: 32, padding: "6px 12px", fontSize: 12 }}
              />
              <select
                className="smartaccess-input"
                value={logFilter}
                onChange={e => { setLogFilter(e.target.value); setLogCurrentPage(1); }}
                style={{ width: 140, height: 32, padding: "6px 12px", fontSize: 12 }}
              >
                <option value="all">ทุกกิจกรรมจราจร</option>
                <option value="door_opened">✓ ปลดล็อกประตูสำเร็จ</option>
                <option value="rejected">✕ ปฏิเสธการเข้าถึง</option>
                <option value="approved">✓ อนุมัติสิทธิ์เข้าเรียน</option>
                <option value="registered">📝 ลงทะเบียนขอผ่าน</option>
                <option value="export_pdf">📊 ดาวน์โหลดรายงาน</option>
              </select>
            </div>
          </div>

          {displayedLogs.length === 0 ? (
            <div style={{ padding: "40px 20px", textShadow: "none", textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📜</div>
              <h4 style={{ fontSize: 14, fontWeight: 900, color: "var(--text-primary)", margin: 0 }}>ไม่พบบันทึกการเข้าใช้งานระบบในหมวดหมู่นี้</h4>
              <p style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 6 }}>ข้อมูลจะเก็บบันทึกอัตโนมัติเมื่อนักศึกษาสแกนหรือแอดมินปลดล็อกประตู</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--border)", fontSize: 12, color: "var(--text-secondary)" }}>
                    <th style={{ padding: "12px 14px", width: 180 }}>วันเวลาบันทึก (Timestamp)</th>
                    <th style={{ padding: "12px 14px", width: 140 }}>ห้องเรียน</th>
                    <th style={{ padding: "12px 14px", width: 160 }}>กิจกรรมจราจร (Action)</th>
                    <th style={{ padding: "12px 14px", width: 220 }}>นักศึกษา / แอดมินดำเนินงาน</th>
                    <th style={{ padding: "12px 14px" }}>ข้อมูลเพิ่มเติม / บันทึกความปลอดภัย</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedLogs.map(log => {
                    const meta = getLogActionMetadata(log);
                    const isRejectedUser = isAccessRejectedLog(log);

                    return (
                      <tr key={log.id} style={{ borderBottom: "1px solid var(--border)", fontSize: 12.5, background: "rgba(255,255,255,0.01)" }}>
                        <td style={{ padding: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
                          {formatDateTime(log.timestamp)}
                        </td>
                        <td style={{ padding: "14px" }}>
                          <span style={{ background: "linear-gradient(135deg, var(--smartaccess-purple-pale) 0%, rgba(219,39,119,0.06) 100%)", border: "1px solid var(--border)", color: "var(--smartaccess-purple-dark)", borderRadius: "6px", padding: "4px 8px", fontSize: 11, fontWeight: 900 }}>
                            ห้อง {log.requested_room || "ส่วนกลาง"}
                          </span>
                        </td>
                        <td style={{ padding: "14px" }}>
                          <span style={{
                            display: "inline-flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: 8, fontSize: 11, fontWeight: 900,
                            background: meta.color + "14", color: meta.color, border: `1px solid ${meta.color}25`
                          }}>
                            {meta.icon} {meta.label}
                          </span>
                        </td>
                        <td style={{ padding: "14px" }}>
                          {log.student_name ? (
                            <div>
                              <div style={{ fontWeight: 800, color: "var(--text-primary)" }}>{log.student_name}</div>
                              {log.student_code && <div style={{ fontSize: 10.5, color: "var(--text-secondary)", marginTop: 4 }}>รหัสนักศึกษา: {log.student_code}</div>}
                            </div>
                          ) : log.admin_name ? (
                            <div>
                              <div style={{ fontWeight: 800, color: "var(--smartaccess-purple-dark)" }}>แอดมิน: {log.admin_name}</div>
                              <div style={{ fontSize: 10.5, color: "var(--text-secondary)", marginTop: 4 }}>สิทธิ์บัญชี: {log.esp32_response || "ผู้ดูแลระบบ"}</div>
                            </div>
                          ) : (
                            <span style={{ color: "var(--text-muted)" }}>-</span>
                          )}
                        </td>
                        <td style={{ padding: "14px" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            {isRejectedUser && log.esp32_response && (
                              <div style={{ color: "#EF4444", fontWeight: 700, fontSize: "11px", display: "flex", gap: 4, alignItems: "center" }}>
                                <span>⚠️ บันทึกปฏิเสธ: {log.esp32_response}</span>
                              </div>
                            )}
                            {renderLogNotes(log.notes)}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Logs Pagination component */}
          {totalFilteredLogs > 0 && (
            <div style={{ display: "flex", justifyItems: "center", justifyContent: "between", alignItems: "center", marginTop: 18, borderTop: "1px solid var(--border)", paddingTop: 14 }}>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", fontVariantNumeric: "tabular-nums" }}>
                แสดง {displayedLogs.length} รายการ จากบันทึกจราจรทั้งหมดที่พบ {totalFilteredLogs} รายการ
              </div>

              <div style={{ display: "flex", gap: 6 }}>
                <button
                  className="btn-secondary"
                  onClick={() => setLogCurrentPage((p: number) => Math.max(1, p - 1))}
                  disabled={logCurrentPage === 1}
                  style={{ padding: "6px 12px", fontSize: 12, borderRadius: 8, minWidth: 60 }}
                >
                  ก่อนหน้า
                </button>
                {[...Array(totalLogPages)].map((_, idx) => {
                  const pageNum = idx + 1;
                  return (
                    <button
                      key={pageNum}
                      className={logCurrentPage === pageNum ? "btn-primary" : "btn-secondary"}
                      onClick={() => setLogCurrentPage(pageNum)}
                      style={{
                        padding: "6px 12px", fontSize: 12, borderRadius: 8, minWidth: 32,
                        background: logCurrentPage === pageNum ? "linear-gradient(135deg, var(--smartaccess-purple) 0%, var(--edu-pink) 100%)" : "rgba(255,255,255,0.06)",
                        color: logCurrentPage === pageNum ? "#fff" : "var(--text-secondary)",
                        border: "none",
                        fontWeight: logCurrentPage === pageNum ? 800 : 500
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                <button
                  className="btn-secondary"
                  onClick={() => setLogCurrentPage((p: number) => Math.min(totalLogPages, p + 1))}
                  disabled={logCurrentPage === totalLogPages}
                  style={{ padding: "6px 12px", fontSize: 12, borderRadius: 8, minWidth: 60 }}
                >
                  ถัดไป
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
