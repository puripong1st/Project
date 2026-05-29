"use client";
import React from "react";
import { useDashboard, defaultRoomConfig } from "../DashboardContext";
import { formatDateTime } from "../DashboardHelpers";

export default function RoomsPage() {
  const {
    isOwner,
    user,
    newRoomCode,
    setNewRoomCode,
    newRoomIp,
    setNewRoomIp,
    handleAddRoom,
    roomsList,
    setRoomsList,
    roomConfigs,
    expandedRoomSettings,
    toggleRoomSettings,
    setRoomConfig,
    handleRemoveRoom,
    saveSingleRoomSettings,
    roomSaving,
    handleSaveSettings,
    settingsLoading,
    firmwareVersionInput,
    setFirmwareVersionInput,
    firmwarePublicUrlInput,
    setFirmwarePublicUrlInput,
    handleUploadFirmware,
    firmwareReleasesLoading,
    firmwareReleases,
    fetchFirmwares,
    fetchFirmwareLogs,
    showToast,
    firmwareLogsLoading,
    firmwareLogs
  } = useDashboard();

  if (!user || !isOwner) return null;

  return (
    <div className="animate-fade-in" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20 }}>
      {/* New Room Setup form */}
      <div className="premium-card" style={{ padding: 24, textAlign: "left" }}>
        <h3 style={{ fontSize: 16.5, fontWeight: 900, color: "var(--text-primary)", borderBottom: "1px solid var(--border)", paddingBottom: 12, marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
          🏫 ขึ้นทะเบียนห้องเรียนและที่อยู่ไอพีบอร์ดควบคุม (Add/Register New Classroom ESP32)
        </h3>
        <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 18 }}>
          โปรดกำหนดรหัสห้องเรียนและหมายเลข IP Address หรือ URL เครือข่ายบอร์ดให้ถูกต้อง เพื่อรวบรวมในการจัดหมวดหมู่ส่ง API display และ trigger ข้ามเครือข่าย LAN
        </p>

        <form onSubmit={handleAddRoom}>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-end" }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                รหัสห้องเรียนควบคุม (Classroom Code) *
              </label>
              <input
                className="smartaccess-input"
                type="text"
                placeholder="เช่น CE-401, CE-402, ME-203..."
                value={newRoomCode}
                onChange={e => setNewRoomCode(e.target.value)}
                required
              />
            </div>

            <div style={{ flex: 1.2, minWidth: 240 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                IP Address หรือ โดเมนของบอร์ดในระบบ LAN *
              </label>
              <input
                className="smartaccess-input"
                type="text"
                placeholder="เช่น 192.168.1.100 หรือ smartboard-lab.local..."
                value={newRoomIp}
                onChange={e => setNewRoomIp(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={settingsLoading}
              className="btn-primary"
              style={{
                padding: "10px 22px",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 800,
                border: "none",
                height: 38,
                cursor: "pointer",
                background: "linear-gradient(135deg, var(--smartaccess-purple) 0%, var(--edu-pink) 100%)",
                color: "#fff",
                boxShadow: "0 6px 14px rgba(124,58,237,0.2)"
              }}
            >
              ➕ เพิ่มห้องเรียนเข้าระบบ
            </button>
          </div>
        </form>
      </div>

      {/* Rooms configurations card cards */}
      <div className="premium-card" style={{ padding: 24 }}>
        <h3 style={{ fontSize: 16.5, fontWeight: 900, color: "var(--text-primary)", borderBottom: "1px solid var(--border)", paddingBottom: 12, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
          🎛️ กำหนดโครงคอนฟิกแยกรายห้องเรียน (Classroom Advanced Config Policies)
        </h3>

        {roomsList.length === 0 ? (
          <div style={{ padding: "40px 20px", textShadow: "none", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🏫</div>
            <h4 style={{ fontSize: 14, fontWeight: 900, color: "var(--text-primary)", margin: 0 }}>ไม่มีห้องเรียนขึ้นทะเบียนควบคุม</h4>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {roomsList.map((room, idx) => {
              const cfg = roomConfigs[room.room] ?? defaultRoomConfig();
              const isExpanded = expandedRoomSettings.has(room.room);
              const isSaving = roomSaving[room.room] || false;

              return (
                <div
                  key={room.room}
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    background: "#fff",
                    overflow: "hidden",
                    boxShadow: "var(--shadow-sm)"
                  }}
                >
                  {/* Header bar of room card */}
                  <div
                    onClick={() => toggleRoomSettings(room.room)}
                    style={{
                      padding: "16px 20px",
                      background: "var(--bg-secondary)",
                      display: "flex",
                      justifyItems: "center",
                      justifyContent: "between",
                      alignItems: "center",
                      cursor: "pointer",
                      borderBottom: isExpanded ? "1px solid var(--border)" : "none"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: "var(--smartaccess-purple-dark)", background: "var(--smartaccess-purple-pale)", width: 28, height: 28, borderRadius: 8, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                        {idx + 1}
                      </span>
                      <div>
                        <strong style={{ fontSize: 15, color: "var(--text-primary)" }}>
                          ห้องปฏิบัติการ {room.room}
                        </strong>
                        <span style={{ fontSize: 11, color: "var(--text-secondary)", marginLeft: 10 }}>
                          IP: <code>{room.ip}</code>
                        </span>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 10, alignItems: "center", marginLeft: "auto" }}>
                      <span style={{ fontSize: 11.5, color: "var(--text-secondary)", fontWeight: 700 }}>
                        {cfg.auto_approve_enabled ? "✓ เปิดอนุมัติออโต้" : "✕ ปิดอนุมัติออโต้"}
                      </span>
                      <span style={{ fontSize: 12, transition: "transform 0.2s", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}>
                        ▼
                      </span>
                    </div>
                  </div>

                  {/* Config Form details (Only visible when expanded) */}
                  {isExpanded && (
                    <div style={{ padding: 20, textAlign: "left", display: "flex", flexDirection: "column", gap: 16 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
                        {/* Col 1: Auto Approve Settings */}
                        <div style={{ padding: 14, borderRadius: 10, background: "rgba(124,58,237,0.01)", border: "1px dashed var(--border)" }}>
                          <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 900, color: "var(--smartaccess-purple-dark)", marginBottom: 12, cursor: "pointer" }}>
                            <input
                              type="checkbox"
                              checked={cfg.auto_approve_enabled}
                              onChange={e => setRoomConfig(room.room, { auto_approve_enabled: e.target.checked })}
                            />
                            🚀 เปิดระบบอนุมัติอัตโนมัติประจำห้อง (Auto-Approve Enabled)
                          </label>

                          {cfg.auto_approve_enabled && (
                            <div style={{ display: "flex", flexDirection: "column", gap: 8 }} className="animate-fade-in">
                              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
                                <div>
                                  <label style={{ display: "block", fontSize: 10.5, color: "var(--text-secondary)", marginBottom: 4 }}>ตั้งแต่เวลา (Start Time):</label>
                                  <input
                                    type="time"
                                    className="smartaccess-input"
                                    value={cfg.auto_approve_start_time}
                                    onChange={e => setRoomConfig(room.room, { auto_approve_start_time: e.target.value })}
                                    style={{ padding: "4px 8px", fontSize: 11.5, height: 30 }}
                                  />
                                </div>
                                <div>
                                  <label style={{ display: "block", fontSize: 10.5, color: "var(--text-secondary)", marginBottom: 4 }}>ถึงเวลา (End Time):</label>
                                  <input
                                    type="time"
                                    className="smartaccess-input"
                                    value={cfg.auto_approve_end_time}
                                    onChange={e => setRoomConfig(room.room, { auto_approve_end_time: e.target.value })}
                                    style={{ padding: "4px 8px", fontSize: 11.5, height: 30 }}
                                  />
                                </div>
                              </div>

                              <div>
                                <label style={{ display: "block", fontSize: 10.5, color: "var(--text-secondary)", marginBottom: 4 }}>วันควบคุมปฏิบัติการ (Days Bitmask: 1=จันทร์, 7=อาทิตย์):</label>
                                <input
                                  type="text"
                                  className="smartaccess-input"
                                  value={cfg.auto_approve_days}
                                  onChange={e => setRoomConfig(room.room, { auto_approve_days: e.target.value })}
                                  placeholder="เช่น 1,2,3,4,5..."
                                  style={{ padding: "4px 8px", fontSize: 11.5, height: 30 }}
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Col 2: UI & Form Autofill Display settings */}
                        <div style={{ padding: 14, borderRadius: 10, background: "rgba(219,39,119,0.01)", border: "1px dashed var(--border)", display: "flex", flexDirection: "column", gap: 10 }}>
                          <div>
                            <label style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 900, color: "var(--text-primary)", marginBottom: 8, cursor: "pointer" }}>
                              <input
                                type="checkbox"
                                checked={cfg.auto_fill_enabled}
                                onChange={e => setRoomConfig(room.room, { auto_fill_enabled: e.target.checked })}
                              />
                              📝 เปิดกรอกข้อมูลนักศึกษาให้อัตโนมัติ (Autofill Enabled)
                            </label>
                          </div>

                          {cfg.auto_fill_enabled && (
                            <div className="animate-fade-in">
                              <label htmlFor={`autofill_mode_${room.room}`} style={{ display: "block", fontSize: 11, color: "var(--text-secondary)", marginBottom: 4 }}>โหมดการดึงฐานข้อมูล (Autofill Mode):</label>
                              <select
                                id={`autofill_mode_${room.room}`}
                                className="smartaccess-input"
                                value={cfg.auto_fill_mode}
                                onChange={e => setRoomConfig(room.room, { auto_fill_mode: e.target.value })}
                                style={{ padding: "4px 8px", fontSize: 11.5, height: 30 }}
                              >
                                <option value="auto">ดึงอัตโนมัติ (Automatic Profile Sync)</option>
                                <option value="cache">ใช้ข้อมูลแคชบอร์ดเก่า (Cache Only)</option>
                              </select>
                            </div>
                          )}

                          <div>
                            <label htmlFor={`display_mode_${room.room}`} style={{ display: "block", fontSize: 11, color: "var(--text-secondary)", marginBottom: 4 }}>การเซนเซอร์รหัสนักศึกษาบนบอร์ดหน้าห้อง:</label>
                            <select
                              id={`display_mode_${room.room}`}
                              className="smartaccess-input"
                              value={cfg.student_id_display_mode}
                              onChange={e => setRoomConfig(room.room, { student_id_display_mode: e.target.value })}
                              style={{ padding: "4px 8px", fontSize: 11.5, height: 30 }}
                            >
                              <option value="full">แสดงรหัสเต็มพิกเซล (เช่น 6500000000)</option>
                              <option value="masked">เซนเซอร์ปิดเลขกลาง (เช่น 65****0000) [PDPA]</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* IP Address config inside expansion */}
                      <div style={{ display: "flex", gap: 8, alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: 14, marginTop: 4 }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: "block", fontSize: 11, color: "var(--text-secondary)", marginBottom: 4 }}>หมายเลข IP Address หรือ Domain LAN บอร์ด:</label>
                          <input
                            type="text"
                            className="smartaccess-input"
                            value={room.ip}
                            onChange={e => {
                              const updated = roomsList.map((r: any) => r.room === room.room ? { ...r, ip: e.target.value } : r);
                              setRoomsList(updated);
                            }}
                            style={{ padding: "4px 8px", fontSize: 11.5, height: 30 }}
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveRoom(room.room)}
                          className="btn-danger-light"
                          style={{ height: 30, padding: "0 12px", borderRadius: 8, fontSize: 11.5, marginTop: 18 }}
                        >
                          ✕ ลบห้องถาวร
                        </button>

                        {/* Saving buttons specific to individual room */}
                        <button
                          type="button"
                          onClick={() => saveSingleRoomSettings(room.room, room.ip)}
                          disabled={isSaving}
                          className="btn-success"
                          style={{
                            height: 30,
                            padding: "0 16px",
                            borderRadius: 8,
                            fontSize: 11.5,
                            fontWeight: 800,
                            border: "none",
                            background: "linear-gradient(135deg, var(--smartaccess-purple) 0%, var(--edu-pink) 100%)",
                            color: "#fff",
                            cursor: "pointer",
                            marginTop: 18
                          }}
                        >
                          {isSaving ? "⏳ กำลังเซฟ..." : "💾 บันทึกเฉพาะห้อง"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={settingsLoading}
              className="btn-success"
              style={{
                padding: "12px 24px",
                borderRadius: 12,
                fontWeight: 800,
                fontSize: 13.5,
                background: "linear-gradient(135deg, var(--smartaccess-purple) 0%, var(--edu-pink) 100%)",
                color: "#fff",
                boxShadow: "0 6px 16px rgba(124,58,237,0.3)",
                border: "none",
                cursor: "pointer",
                alignSelf: "flex-end",
                marginTop: 10
              }}
            >
              {settingsLoading ? "⏳ กำลังบันทึกทั้งหมด..." : "💾 บันทึกนโยบายของทุกห้องเรียน"}
            </button>
          </div>
        )}
      </div>

      {/* Firmware releases and updates manager panel */}
      <div className="premium-card animate-fade-in" style={{ padding: 24, textAlign: "left" }}>
        <h3 style={{ fontSize: 16.5, fontWeight: 900, color: "var(--text-primary)", borderBottom: "1px solid var(--border)", paddingBottom: 12, marginBottom: 18, display: "flex", alignItems: "center", gap: 8 }}>
          📡 ระบบเผยแพร่และคลังซอฟต์แวร์เฟิร์มแวร์ ESP32 (Wireless HTTPS OTA Firmware Cloud Release Manager)
        </h3>
        <p style={{ color: "var(--text-secondary)", fontSize: 13, marginBottom: 20, lineHeight: 1.5 }}>
          SmartAccess รองรับการอัปเกรดซอฟต์แวร์ควบคุมบอร์ดแบบไร้สายทางไกล (Secure HTTPS Over-The-Air Update) โดยบอร์ดจะเปรียบเทียบรุ่นเฟิร์มแวร์ปัจจุบันในหัวข้อ HTTP Header หากพบคีย์รุ่นที่ใหม่กว่าบนคลาวด์ Vercel จะดึงข้อมูลและอัปเกรดระบบออโต้ทันที
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: 20 }}>
          {/* Form upload firmware release */}
          <div style={{ borderRight: "1px solid var(--border)", paddingRight: 20 }}>
            <span style={{ fontSize: 13, fontWeight: 900, color: "var(--smartaccess-purple-dark)", display: "block", marginBottom: 12 }}>
              🚀 ประกาศเผยแพร่เฟิร์มแวร์เวอร์ชันใหม่ (Publish New OTA Release)
            </span>
            <form onSubmit={handleUploadFirmware}>
              <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                    หมายเลขเวอร์ชัน (Semantic Version) *
                  </label>
                  <input
                    type="text"
                    className="smartaccess-input"
                    placeholder="เช่น 1.0.1, 1.1.0..."
                    value={firmwareVersionInput}
                    onChange={e => setFirmwareVersionInput(e.target.value)}
                    required
                  />
                </div>

                <div style={{ flex: 2 }}>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                    ลิงก์ไฟล์เฟิร์มแวร์ไบนารีสาธารณะ (.bin URL) *
                  </label>
                  <input
                    type="url"
                    className="smartaccess-input"
                    placeholder="ลิงก์ไฟล์ https://.../spiffs_firmware.bin"
                    value={firmwarePublicUrlInput}
                    onChange={e => setFirmwarePublicUrlInput(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={useDashboard().firmwareUploadLoading}
                className="btn-success"
                style={{
                  padding: "8px 18px", borderRadius: 10, fontSize: 12.5, fontWeight: 800,
                  background: "linear-gradient(135deg, var(--smartaccess-purple) 0%, var(--edu-pink) 100%)",
                  color: "#fff", border: "none", cursor: "pointer", boxShadow: "0 4px 10px rgba(124,58,237,0.2)"
                }}
              >
                {useDashboard().firmwareUploadLoading ? "⏳ กำลังสร้างความสัมพันธ์..." : "🚀 สั่งการอัปเกรดบอร์ด OTA ทุกห้องเรียน"}
              </button>
            </form>

            {/* Table of active releases */}
            <div style={{ marginTop: 22 }}>
              <span style={{ fontSize: 12.5, fontWeight: 800, color: "var(--text-primary)", display: "block", marginBottom: 10 }}>
                คลังซอฟต์แวร์เฟิร์มแวร์ในระบบคลาวด์ขณะนี้ (Active Releases Catalog)
              </span>

              {firmwareReleasesLoading ? (
                <div style={{ padding: 20, textAlign: "center", fontSize: 12, color: "var(--text-secondary)" }}>กำลังดึงข้อมูล...</div>
              ) : firmwareReleases.length === 0 ? (
                <div style={{ padding: 20, textAlign: "center", fontSize: 11.5, color: "var(--text-secondary)" }}>ยังไม่มีไฟล์ประวัติเฟิร์มแวร์ลงทะเบียนในคลังคลาวด์</div>
              ) : (
                <div style={{ overflowX: "auto", border: "1px solid var(--border)", borderRadius: 10 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5 }}>
                    <thead>
                      <tr style={{ background: "var(--bg-secondary)", borderBottom: "1.5px solid var(--border)" }}>
                        <th style={{ padding: "8px 10px", width: 80 }}>เวอร์ชัน</th>
                        <th style={{ padding: "8px 10px" }}>ลิงก์ไฟล์ไบนารีซอฟต์แวร์ (.bin URL)</th>
                        <th style={{ padding: "8px 10px", width: 70, textAlign: "right" }}>การทำงาน</th>
                      </tr>
                    </thead>
                    <tbody>
                      {firmwareReleases.map(rel => (
                        <tr key={rel.id} style={{ borderBottom: "1px solid var(--border)" }}>
                          <td style={{ padding: "10px", fontWeight: "bold", color: "var(--smartaccess-purple-dark)" }}>v{rel.version}</td>
                          <td style={{ padding: "10px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>
                            <code style={{ color: "var(--text-secondary)" }}>{rel.url}</code>
                          </td>
                          <td style={{ padding: "10px", textAlign: "right" }}>
                            <button
                              type="button"
                              onClick={async () => {
                                if (!confirm(`ต้องการลบและถอดถอนเฟิร์มแวร์ v${rel.version} ออกจากระบบคลังคลาวด์ OTA ใช่หรือไม่?`)) return;
                                const res = await fetch(`/api/system/firmware?id=${rel.id}`, { method: "DELETE" });
                                if (res.ok) {
                                  showToast(`ลบซอฟต์แวร์ v${rel.version} เรียบร้อยแล้ว`, "success");
                                  fetchFirmwares();
                                  fetchFirmwareLogs();
                                }
                              }}
                              className="btn-danger-light"
                              style={{ padding: "4px 8px", borderRadius: 6, fontSize: 10.5 }}
                            >
                              ถอน
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Col 2: Firmware OTA log report */}
          <div>
            <span style={{ fontSize: 13, fontWeight: 900, color: "var(--smartaccess-purple-dark)", display: "block", marginBottom: 12 }}>
              📜 บันทึกรายงานการร้องขออัปเกรดของบอร์ด (Firmware OTA Traffic Logs)
            </span>

            {firmwareLogsLoading ? (
              <div style={{ padding: 20, textAlign: "center", fontSize: 12, color: "var(--text-secondary)" }}>กำลังดึงสถิติ...</div>
            ) : firmwareLogs.length === 0 ? (
              <div style={{ padding: 20, textAlign: "center", fontSize: 11.5, color: "var(--text-secondary)" }}>ยังไม่มีประวัติการส่งสัญญาณอัปเกรด OTA จากบอร์ดจริงเข้าบันทึก</div>
            ) : (
              <div style={{ maxHeight: 310, overflowY: "auto", border: "1px solid var(--border)", borderRadius: 10, fontSize: 11.5 }}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {firmwareLogs.map(l => (
                    <div key={l.id} style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)", textAlign: "left" }}>
                      <div style={{ display: "flex", justifyContent: "between", fontWeight: "bold", color: "var(--text-primary)" }}>
                        <span>ห้อง {l.requested_room || "ME-401"}</span>
                        <span style={{ marginLeft: "auto", fontSize: 10, color: "var(--text-secondary)" }}>{formatDateTime(l.timestamp)}</span>
                      </div>
                      <p style={{ margin: "4px 0 0", color: "#059669", fontSize: 11, fontWeight: "bold" }}>
                        📥 ดำเนินการ: {l.notes || "ยิงเช็ก / อัปเกรดเสร็จสิ้น"}
                      </p>
                      <div style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 2 }}>
                        รายละเอียด: {l.esp32_response || "— HTTP GET OTA Request —"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
