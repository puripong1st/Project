"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

interface StudentData {
  id: number;
  status: "pending" | "approved" | "rejected";
  first_name: string;
  last_name: string;
  student_id: string;
  requested_room: string;
  rejection_reason?: string;
  approved_at?: string;
  registered_at: string;
}

function StatusContent() {
  const params = useSearchParams();
  const studentId = params.get("student_id") || "";
  const room = params.get("room") || "";

  const [student, setStudent] = useState<StudentData | null>(null);
  const [found, setFound] = useState<boolean | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrCountdown, setQrCountdown] = useState(60);
  const [connected, setConnected] = useState(false);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const esRef = useRef<EventSource | null>(null);

  const fetchQr = useCallback(async (room: string) => {
    try {
      const res = await fetch(`/api/esp32/qr?room=${room}&format=dataurl`);
      if (res.ok) {
        const data = await res.json();
        setQrDataUrl(data.dataUrl || null);
        setQrCountdown(60);
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!studentId) return;
    const url = `/api/sse/student-status?student_id=${encodeURIComponent(studentId)}${room ? `&room=${encodeURIComponent(room)}` : ""}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.addEventListener("status", (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      setConnected(true);
      setFound(data.found);
      if (data.found) {
        setStudent(data.student);
        if (data.student.status === "approved") {
          fetchQr(data.student.requested_room);
        }
      }
    });
    es.addEventListener("heartbeat", () => setConnected(true));
    es.onerror = () => setConnected(false);

    return () => { es.close(); esRef.current = null; };
  }, [studentId, room, fetchQr]);

  // QR countdown refresh every 60s
  useEffect(() => {
    if (student?.status !== "approved") return;
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setQrCountdown(prev => {
        if (prev <= 1) {
          fetchQr(student.requested_room);
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (countdownRef.current) clearInterval(countdownRef.current); };
  }, [student?.status, student?.requested_room, fetchQr]);

  const statusConfig = {
    pending: {
      color: "#F59E0B",
      bg: "rgba(245,158,11,0.1)",
      border: "rgba(245,158,11,0.3)",
      icon: "⏳",
      title: "รอการอนุมัติ",
      desc: "คำขอของคุณอยู่ในคิว แอดมินกำลังตรวจสอบ...",
      pulse: true,
    },
    approved: {
      color: "#10B981",
      bg: "rgba(16,185,129,0.1)",
      border: "rgba(16,185,129,0.3)",
      icon: "✅",
      title: "อนุมัติแล้ว!",
      desc: "สแกน QR Code ด้านล่างที่หน้าห้องเพื่อเปิดประตู",
      pulse: false,
    },
    rejected: {
      color: "#EF4444",
      bg: "rgba(239,68,68,0.1)",
      border: "rgba(239,68,68,0.3)",
      icon: "❌",
      title: "ไม่ผ่านการอนุมัติ",
      desc: "คำขอของคุณไม่ได้รับการอนุมัติในรอบนี้",
      pulse: false,
    },
  };

  const cfg = student ? statusConfig[student.status] : null;

  return (
    <div style={{
      minHeight: "100dvh",
      background: "linear-gradient(135deg, #0f0c29 0%, #1a0533 50%, #0f0c29 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px",
      fontFamily: "'Noto Sans Thai', 'Sarabun', sans-serif",
    }}>
      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>🔐</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: "#fff", letterSpacing: -0.5 }}>SmartAccess</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>ระบบตรวจสอบสถานะคำขอ</div>
      </div>

      <div style={{ width: "100%", maxWidth: 420 }}>
        {/* Connection indicator */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center", marginBottom: 16 }}>
          <div style={{
            width: 8, height: 8, borderRadius: "50%",
            background: connected ? "#10B981" : "#6B7280",
            boxShadow: connected ? "0 0 8px #10B981" : "none",
          }} />
          <span style={{ fontSize: 11, color: connected ? "#10B981" : "#6B7280" }}>
            {connected ? "เชื่อมต่อแบบ Real-time" : "กำลังเชื่อมต่อ..."}
          </span>
        </div>

        {!studentId ? (
          <div style={{ padding: 32, background: "rgba(255,255,255,0.06)", borderRadius: 20, textAlign: "center", color: "#EF4444" }}>
            ❌ ไม่พบรหัสนักศึกษาใน URL
          </div>
        ) : found === null ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12, animation: "spin 1s linear infinite" }}>⏳</div>
            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 14 }}>กำลังตรวจสอบสถานะ...</div>
          </div>
        ) : !found ? (
          <div style={{ padding: 32, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 20, textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <div style={{ color: "#EF4444", fontWeight: 700, fontSize: 16 }}>ไม่พบข้อมูลคำขอ</div>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginTop: 8 }}>
              รหัสนักศึกษา: {studentId}
            </div>
          </div>
        ) : student && cfg ? (
          <div>
            {/* Status Card */}
            <div style={{
              padding: 28,
              background: cfg.bg,
              border: `1.5px solid ${cfg.border}`,
              borderRadius: 20,
              textAlign: "center",
              marginBottom: 16,
              position: "relative",
              overflow: "hidden",
            }}>
              {cfg.pulse && (
                <div style={{
                  position: "absolute", inset: 0,
                  background: `radial-gradient(circle, ${cfg.color}10 0%, transparent 70%)`,
                  animation: "pulse 2s ease-in-out infinite",
                }} />
              )}
              <div style={{ fontSize: 52, marginBottom: 12, position: "relative" }}>{cfg.icon}</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: cfg.color, marginBottom: 6, position: "relative" }}>
                {cfg.title}
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.5, position: "relative" }}>
                {cfg.desc}
              </div>

              {student.status === "rejected" && student.rejection_reason && (
                <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(239,68,68,0.15)", borderRadius: 10, fontSize: 13, color: "#FCA5A5" }}>
                  เหตุผล: {student.rejection_reason}
                </div>
              )}
            </div>

            {/* Student info */}
            <div style={{
              padding: "14px 18px",
              background: "rgba(255,255,255,0.05)",
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.1)",
              marginBottom: 16,
            }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { label: "ชื่อ-สกุล", value: `${student.first_name} ${student.last_name}` },
                  { label: "รหัสนักศึกษา", value: student.student_id },
                  { label: "ห้องที่ขอ", value: student.requested_room },
                  {
                    label: "ลงทะเบียน",
                    value: new Date(student.registered_at).toLocaleString("th-TH", { timeZone: "Asia/Bangkok", dateStyle: "short", timeStyle: "short" }),
                  },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>{label}</div>
                    <div style={{ fontSize: 13, color: "#fff", fontWeight: 600 }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* QR Code (approved only) */}
            {student.status === "approved" && (
              <div style={{
                padding: 24,
                background: "rgba(16,185,129,0.08)",
                border: "1.5px solid rgba(16,185,129,0.3)",
                borderRadius: 20,
                textAlign: "center",
              }}>
                <div style={{ fontSize: 13, color: "#10B981", fontWeight: 700, marginBottom: 12 }}>
                  📱 สแกน QR Code เพื่อเปิดประตู
                </div>
                {qrDataUrl ? (
                  <>
                    <img
                      src={qrDataUrl}
                      alt="QR Code"
                      style={{ width: 200, height: 200, borderRadius: 12, background: "#fff", padding: 8 }}
                    />
                    {/* Countdown */}
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>QR หมดอายุใน</div>
                      <div style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        padding: "6px 14px", borderRadius: 20,
                        background: qrCountdown < 10 ? "rgba(239,68,68,0.2)" : "rgba(16,185,129,0.15)",
                        border: `1px solid ${qrCountdown < 10 ? "rgba(239,68,68,0.4)" : "rgba(16,185,129,0.3)"}`,
                      }}>
                        <div style={{
                          width: 8, height: 8, borderRadius: "50%",
                          background: qrCountdown < 10 ? "#EF4444" : "#10B981",
                          animation: "pulse 1s ease-in-out infinite",
                        }} />
                        <span style={{
                          fontWeight: 800, fontSize: 18,
                          color: qrCountdown < 10 ? "#EF4444" : "#10B981",
                          fontVariantNumeric: "tabular-nums",
                        }}>
                          {String(Math.floor(qrCountdown / 60)).padStart(2, "0")}:{String(qrCountdown % 60).padStart(2, "0")}
                        </span>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 8 }}>
                      QR จะรีเฟรชอัตโนมัติเมื่อหมดเวลา
                    </div>
                  </>
                ) : (
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>กำลังโหลด QR Code...</div>
                )}
              </div>
            )}
          </div>
        ) : null}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
      `}</style>
    </div>
  );
}

export default function StatusPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100dvh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0f0c29" }}>
        <div style={{ color: "#fff", fontSize: 16 }}>⏳ กำลังโหลด...</div>
      </div>
    }>
      <StatusContent />
    </Suspense>
  );
}
