"use client";
import { useState, useEffect } from "react";

interface DisplayState {
  title: string;
  subtitle: string;
  qr_url: string;
  register_url: string;
  pending_count: number;
  last_approved: { name: string; student_id: string; time: string } | null;
  server_time: string;
  status: string;
}

interface ESP32Status {
  mode: "mock" | "wokwi" | "physical";
  online: boolean;
  ip: string;
  url: string;
  doorStatus?: string;
  mock: boolean;
  wokwi: boolean;
}

type ScreenMode = "idle" | "approved" | "rejected" | "scanning";

// ─── Minimalist Stroke SVG Icons ───
const TVIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 8 }}>
    <rect x="2" y="7" width="20" height="15" rx="2" ry="2"/>
    <polyline points="17 2 12 7 7 2"/>
  </svg>
);

const GamepadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 6 }}>
    <line x1="6" y1="12" x2="10" y2="12"/>
    <line x1="8" y1="10" x2="8" y2="14"/>
    <line x1="15" y1="13" x2="15.01" y2="13"/>
    <line x1="18" y1="11" x2="18.01" y2="11"/>
    <rect x="2" y="6" width="20" height="12" rx="3" ry="3"/>
  </svg>
);

const TerminalIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 6 }}>
    <polyline points="4 17 10 11 4 5"/>
    <line x1="12" y1="19" x2="20" y2="19"/>
  </svg>
);

const DatabaseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 6 }}>
    <ellipse cx="12" cy="5" rx="9" ry="3"/>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
    <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/>
  </svg>
);

const CodeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 6 }}>
    <polyline points="16 18 22 12 16 6"/>
    <polyline points="8 6 2 12 8 18"/>
  </svg>
);

// ─── Simulated ESP32 TFT Screen (320×240) ──────────────────────
function ESP32Screen({ mode, displayData, pendingCount }: {
  mode: ScreenMode;
  displayData: DisplayState | null;
  pendingCount: number;
}) {
  const [time, setTime] = useState("");
  const [qrDataUrl, setQrDataUrl] = useState("");

  useEffect(() => {
    const t = setInterval(() => {
      setTime(new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }));
    }, 1000);
    setTimeout(() => {
      setTime(new Date().toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }));
    }, 0);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    // Fetch QR code for display preview — refreshes every 5 minutes (token rotation)
    const fetchQR = () => {
      const cacheBuster = Date.now();
      fetch(`/api/esp32/qr?_t=${cacheBuster}`)
        .then(r => r.blob())
        .then(blob => {
          // Revoke old URL to prevent memory leak
          if (qrDataUrl) URL.revokeObjectURL(qrDataUrl);
          setQrDataUrl(URL.createObjectURL(blob));
        })
        .catch(() => {});
    };
    fetchQR();
    // Refresh QR every 5 minutes to match token rotation
    const qrInterval = setInterval(fetchQR, 5 * 60 * 1000);
    return () => clearInterval(qrInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // IDLE screen — show QR
  if (mode === "idle") {
    return (
      <div style={{ width: 320, height: 240, background: "#000", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {/* Status bar */}
        <div style={{ background: "#1B5E20", padding: "3px 8px", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <span style={{ color: "#FFD700", fontSize: 9, fontWeight: 700, letterSpacing: 0.5 }}>RMUTP DOOR ACCESS</span>
          <span style={{ color: "#4CAF50", fontSize: 9 }}>● {time}</span>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px" }}>
          {/* QR Code area */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ width: 110, height: 110, background: "#FFF", padding: 3, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #4CAF50" }}>
              {qrDataUrl
                ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={qrDataUrl} alt="QR" style={{ width: 104, height: 104 }} />
                )
                : <div style={{ width: 104, height: 104, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "#999" }}>Loading...</div>
              }
            </div>
            <div style={{ color: "#FFD700", fontSize: 8, marginTop: 4, textAlign: "center" }}>SCAN TO REGISTER</div>
          </div>

          {/* Info panel */}
          <div style={{ flex: 1, paddingLeft: 10 }}>
            <div style={{ color: "#4CAF50", fontSize: 10, fontWeight: 700, marginBottom: 6 }}>ลงทะเบียนเข้าห้อง</div>
            <div style={{ color: "#FFF", fontSize: 8, marginBottom: 4, lineHeight: 1.5 }}>สแกน QR เพื่อ</div>
            <div style={{ color: "#FFF", fontSize: 8, marginBottom: 8, lineHeight: 1.5 }}>ยื่นขอเปิดประตู</div>

            <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 4, padding: "4px 8px", marginBottom: 4 }}>
              <div style={{ color: "#9EA8A0", fontSize: 7 }}>รออนุมัติ</div>
              <div style={{ color: "#F59E0B", fontSize: 14, fontWeight: 700 }}>{pendingCount}</div>
            </div>

            {displayData?.last_approved && (
              <div style={{ background: "rgba(76,175,80,0.15)", borderRadius: 4, padding: "4px 8px", border: "1px solid rgba(76,175,80,0.3)" }}>
                <div style={{ color: "#4CAF50", fontSize: 7, marginBottom: 1, display: "flex", alignItems: "center", gap: 2 }}>
                  <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#4CAF50" }} />
                  <span>ล่าสุด</span>
                </div>
                <div style={{ color: "#FFF", fontSize: 8, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 120 }}>{displayData.last_approved.name}</div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ background: "#0D1B0D", padding: "3px 8px", display: "flex", justifyContent: "space-between", flexShrink: 0 }}>
          <span style={{ color: "#2E7D32", fontSize: 7 }}>มหาวิทยาลัยราชมงคลพระนคร</span>
          <span style={{ color: "#1B5E20", fontSize: 7 }}>192.168.1.100</span>
        </div>
      </div>
    );
  }

  // APPROVED screen
  if (mode === "approved") {
    return (
      <div style={{ width: 320, height: 240, background: "#000", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        {/* Green flash bg */}
        <div style={{ position: "absolute", inset: 0, background: "rgba(76,175,80,0.08)" }} />
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#1B5E20", border: "2px solid #4CAF50", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, color: "#4CAF50" }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <div style={{ color: "#4CAF50", fontSize: 16, fontWeight: 700, marginBottom: 4 }}>ACCESS GRANTED</div>
        <div style={{ color: "#FFD700", fontSize: 12, marginBottom: 2 }}>DOOR OPENING...</div>
        <div style={{ color: "#9EA8A0", fontSize: 9 }}>{displayData?.last_approved?.name || "นักศึกษา"}</div>
        <div style={{ color: "#6B7A70", fontSize: 8, marginTop: 4 }}>{displayData?.last_approved?.student_id}</div>

        {/* Progress bar */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: "#1B5E20" }}>
          <div style={{ height: "100%", background: "#4CAF50", width: "70%", transition: "width 3s linear" }} />
        </div>
      </div>
    );
  }

  // REJECTED screen
  if (mode === "rejected") {
    return (
      <div style={{ width: 320, height: 240, background: "#000", position: "relative", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "absolute", inset: 0, background: "rgba(239,68,68,0.06)" }} />
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#5A1C1C", border: "2px solid #EF4444", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12, color: "#EF4444" }}>
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </div>
        <div style={{ color: "#EF4444", fontSize: 16, fontWeight: 700, marginBottom: 4 }}>ACCESS DENIED</div>
        <div style={{ color: "#9EA8A0", fontSize: 10, marginBottom: 2 }}>คำขอถูกปฏิเสธ</div>
        <div style={{ color: "#6B7A70", fontSize: 8 }}>กรุณาติดต่อเจ้าหน้าที่</div>
      </div>
    );
  }

  // SCANNING screen
  if (mode === "scanning") {
    return (
      <div style={{ width: 320, height: 240, background: "#000", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 40, height: 40, border: "3px solid rgba(76,175,80,0.3)", borderTopColor: "#4CAF50", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: 12 }} />
        <div style={{ color: "#4CAF50", fontSize: 12, fontWeight: 700 }}>PROCESSING...</div>
        <div style={{ color: "#9EA8A0", fontSize: 9, marginTop: 4 }}>กำลังตรวจสอบ</div>
      </div>
    );
  }

  return null;
}

// ─── Main Preview Page ──────────────────────────────────────────
export default function ESP32PreviewPage() {
  const [mode, setMode] = useState<ScreenMode>("idle");
  const [displayData, setDisplayData] = useState<DisplayState | null>(null);
  const [isRefreshing, setRefreshing] = useState(false);
  const [scale, setScale] = useState(1.5);
  const [esp32Status, setEsp32Status] = useState<ESP32Status | null>(null);

  const fetchDisplay = async () => {
    setRefreshing(true);
    try {
      const r = await fetch("/api/esp32/display");
      const d = await r.json();
      setDisplayData(d);
    } catch {}
    setRefreshing(false);
  };

  const fetchESP32Status = async () => {
    try {
      const r = await fetch("/api/esp32/status");
      if (r.ok) setEsp32Status(await r.json());
    } catch {}
  };

  useEffect(() => {
    setTimeout(() => { fetchDisplay(); fetchESP32Status(); }, 0);
    const i1 = setInterval(fetchDisplay, 5000);
    const i2 = setInterval(fetchESP32Status, 5000);
    return () => { clearInterval(i1); clearInterval(i2); };
  }, []);

  function simulateApprove() {
    setMode("scanning");
    setTimeout(() => setMode("approved"), 1500);
    setTimeout(() => setMode("idle"), 5000);
  }
  function simulateReject() {
    setMode("scanning");
    setTimeout(() => setMode("rejected"), 1500);
    setTimeout(() => setMode("idle"), 4000);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0F1117", color: "#F0F4F0", padding: 32 }}>
      {/* Header */}
      <div className="animate-fade-in" style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4, display: "flex", alignItems: "center" }}>
            <TVIcon />
            <span>ESP32 Display Preview</span>
          </h1>
          <p style={{ color: "#9EA8A0", fontSize: 13 }}>จำลองหน้าจอ LAFVIN 4.0 TFT Display (3.2&quot; — 320×240 px) · ILI9341</p>
        </div>
        <a href="/admin/dashboard" style={{ color: "#4CAF50", fontSize: 13, textDecoration: "none" }}>← Admin Dashboard</a>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 40, alignItems: "start" }}>
        {/* Left: Physical Display Mockup */}
        <div className="animate-fade-in">
          {/* Device frame */}
          <div style={{ display: "inline-block", padding: 16, background: "#1A1A1A", borderRadius: 12, boxShadow: "0 0 40px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)", position: "relative" }}>
            {/* Top bar with buttons */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, padding: "0 4px" }}>
              <span style={{ fontSize: 9, color: "#555", fontWeight: 600 }}>LAFVIN 4.0 · ESP32</span>
              <div style={{ display: "flex", gap: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: mode === "idle" ? "#4CAF50" : "#F59E0B" }} className="animate-blink" />
              </div>
            </div>

            {/* Screen bezel */}
            <div style={{
              padding: 4, background: "#111",
              borderRadius: 4, border: "2px solid #333",
              boxShadow: "inset 0 0 10px rgba(0,0,0,0.8)",
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}>
              <ESP32Screen mode={mode} displayData={displayData} pendingCount={displayData?.pending_count || 0} />
            </div>

            {/* Scale spacer */}
            <div style={{ height: (240 * scale - 240) + (320 * scale - 320) / 2 * 0 }} />

            {/* Bottom connectors */}
            <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 12 }}>
              {["USB-C", "RST", "EN"].map(l => (
                <div key={l} style={{ padding: "2px 6px", background: "#222", borderRadius: 3, fontSize: 7, color: "#555", border: "1px solid #333" }}>{l}</div>
              ))}
            </div>
          </div>

          {/* Scale control */}
          <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 11, color: "#6B7A70" }}>ขนาด:</span>
            {[1, 1.5, 2].map(s => (
              <button key={s} onClick={() => setScale(s)}
                style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${scale === s ? "#4CAF50" : "rgba(255,255,255,0.1)"}`, background: scale === s ? "rgba(76,175,80,0.15)" : "transparent", color: scale === s ? "#4CAF50" : "#6B7A70", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                {s}×
              </button>
            ))}
          </div>
        </div>

        {/* Right: Controls + Info */}
        <div style={{ maxWidth: 500 }}>

          {/* ─── Wokwi Connection Panel ─── */}
          <div className="glass-card animate-fade-in" style={{ padding: 24, marginBottom: 20, borderColor: esp32Status?.mode === "wokwi" ? "rgba(139,92,246,0.4)" : undefined }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#A78BFA", display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                  <line x1="12" y1="18" x2="12.01" y2="18"/>
                </svg>
                Wokwi Simulator
              </h3>
              {/* Mode badge */}
              <span style={{
                padding: "3px 10px", borderRadius: 99, fontSize: 11, fontWeight: 700,
                background: esp32Status?.mode === "wokwi" ? "rgba(139,92,246,0.2)" : esp32Status?.mode === "mock" ? "rgba(245,158,11,0.15)" : "rgba(76,175,80,0.15)",
                color: esp32Status?.mode === "wokwi" ? "#A78BFA" : esp32Status?.mode === "mock" ? "#F59E0B" : "#4CAF50",
                border: `1px solid ${esp32Status?.mode === "wokwi" ? "rgba(139,92,246,0.4)" : esp32Status?.mode === "mock" ? "rgba(245,158,11,0.3)" : "rgba(76,175,80,0.3)"}`,
              }}>
                {esp32Status?.mode === "wokwi" ? "🔵 Wokwi" : esp32Status?.mode === "mock" ? "🟡 Mock" : "🟢 Physical"}
              </span>
            </div>

            {/* Live status row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 10, padding: "10px 14px" }}>
                <div style={{ color: "#6B7A70", fontSize: 11, marginBottom: 4 }}>สถานะการเชื่อมต่อ</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: esp32Status?.online ? "#4CAF50" : "#EF4444", flexShrink: 0 }} className={esp32Status?.online ? "animate-blink" : ""} />
                  <span style={{ color: esp32Status?.online ? "#4CAF50" : "#EF4444", fontSize: 13, fontWeight: 700 }}>
                    {esp32Status === null ? "กำลังตรวจสอบ..." : esp32Status.online ? "Online" : "Offline"}
                  </span>
                </div>
              </div>
              <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 10, padding: "10px 14px" }}>
                <div style={{ color: "#6B7A70", fontSize: 11, marginBottom: 4 }}>URL ที่ใช้งาน</div>
                <div style={{ color: "#F0F4F0", fontSize: 11, fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {esp32Status?.url || "—"}
                </div>
              </div>
            </div>

            {/* Setup guide */}
            <div style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ color: "#A78BFA", fontSize: 12, fontWeight: 700, marginBottom: 10 }}>📋 วิธีเปิดใช้ Wokwi Simulator</div>
              {[
                { step: "1", text: "ติดตั้ง VS Code Extension: Wokwi Simulator", sub: "marketplace.visualstudio.com/items?itemName=wokwi.wokwi-vscode" },
                { step: "2", text: "เปิดไฟล์ esp32/diagram.json ใน VS Code", sub: "F1 → Wokwi: Start Simulator" },
                { step: "3", text: "เพิ่มใน .env.local ของ Next.js", sub: "ESP32_WOKWI=true" },
                { step: "4", text: "Restart Next.js dev server", sub: "npm run dev" },
              ].map(({ step, text, sub }) => (
                <div key={step} style={{ display: "flex", gap: 10, padding: "6px 0", borderBottom: step !== "4" ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(139,92,246,0.3)", display: "flex", alignItems: "center", justifyContent: "center", color: "#C4B5FD", fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{step}</div>
                  <div>
                    <div style={{ color: "#E2E8F0", fontSize: 12, fontWeight: 600 }}>{text}</div>
                    <div style={{ color: "#6B7A70", fontSize: 10, fontFamily: "monospace", marginTop: 2 }}>{sub}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Port forwarding info */}
            <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(0,0,0,0.25)", borderRadius: 8, display: "flex", gap: 8, alignItems: "center" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span style={{ color: "#9CA3AF", fontSize: 11 }}>
                Port forwarding ใน <code style={{ color: "#A78BFA" }}>wokwi.toml</code>: <code style={{ color: "#4CAF50" }}>localhost:8180</code> → <code style={{ color: "#4CAF50" }}>ESP32:80</code>
              </span>
            </div>
          </div>
          {/* Simulate Buttons */}
          <div className="glass-card animate-fade-in-delay" style={{ padding: 24, marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: "#FFD700", display: "flex", alignItems: "center" }}>
              <GamepadIcon />
              <span>จำลองการทำงาน</span>
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <button onClick={() => setMode("idle")}
                style={{ padding: "10px 0", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#F0F4F0", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                Idle Screen
              </button>
              <button onClick={simulateApprove}
                style={{ padding: "10px 0", background: "rgba(76,175,80,0.15)", border: "1px solid rgba(76,175,80,0.3)", borderRadius: 10, color: "#4CAF50", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                ✅ Approved
              </button>
              <button onClick={simulateReject}
                style={{ padding: "10px 0", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, color: "#EF4444", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                ❌ Rejected
              </button>
              <button onClick={() => { setMode("scanning"); setTimeout(() => setMode("idle"), 2000); }}
                style={{ padding: "10px 0", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 10, color: "#3B82F6", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                🔄 Scanning
              </button>
            </div>
            <div style={{ fontSize: 11, color: "#6B7A70" }}>
              สถานะปัจจุบัน: <span style={{ color: "#4CAF50", fontWeight: 600 }}>{mode}</span>
            </div>
          </div>

          {/* API Info */}
          <div className="glass-card animate-fade-in-delay-2" style={{ padding: 24, marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#FFD700", display: "flex", alignItems: "center" }}>
                <TerminalIcon />
                <span>ESP32 API Endpoints</span>
              </h3>
              <button onClick={fetchDisplay} style={{ background: "none", border: "none", cursor: "pointer", color: "#4CAF50", fontSize: 11, fontFamily: "inherit" }}>
                {isRefreshing ? "⏳ รีเฟรช..." : "🔄 รีเฟรช"}
              </button>
            </div>
            {[
              { method: "GET", path: "/api/esp32/qr", desc: "รับ QR Code เป็น PNG (240×240)", color: "#3B82F6" },
              { method: "GET", path: "/api/esp32/display", desc: "รับ JSON state สำหรับ render", color: "#3B82F6" },
              { method: "POST", path: "/api/esp32/display", desc: "ESP32 ส่งสถานะมายังเซิร์ฟเวอร์", color: "#F59E0B" },
              { method: "POST", path: "/api/students/{id}/door", desc: "สั่งเปิดประตู (Admin → ESP32)", color: "#EF4444" },
            ].map((ep, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 0", borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.05)" : undefined }}>
                <span style={{ background: ep.color + "22", color: ep.color, padding: "2px 8px", borderRadius: 5, fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{ep.method}</span>
                <code style={{ color: "#4CAF50", fontSize: 12, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ep.path}</code>
                <span style={{ color: "#6B7A70", fontSize: 11, flexShrink: 0 }}>{ep.desc}</span>
              </div>
            ))}
          </div>

          {/* Display State */}
          <div className="glass-card animate-fade-in-delay-3" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: "#FFD700", display: "flex", alignItems: "center" }}>
              <DatabaseIcon />
              <span>สถานะปัจจุบันจากเซิร์ฟเวอร์</span>
            </h3>
            {displayData ? (
              <div style={{ fontFamily: "monospace", fontSize: 12, color: "#4CAF50", background: "rgba(0,0,0,0.3)", borderRadius: 8, padding: 16, overflow: "auto" }}>
                <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {JSON.stringify(displayData, null, 2)}
                </pre>
              </div>
            ) : (
              <div style={{ color: "#6B7A70", fontSize: 13, textAlign: "center", padding: 20 }}>กำลังโหลด...</div>
            )}
          </div>

          {/* ESP32 Arduino Code Snippet */}
          <div className="glass-card animate-fade-in-delay-3" style={{ padding: 24, marginTop: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: "#FFD700", display: "flex", alignItems: "center" }}>
              <CodeIcon />
              <span>Arduino/ESP32 Code (ตัวอย่าง)</span>
            </h3>
            <div style={{ fontFamily: "monospace", fontSize: 11, color: "#86C98A", background: "rgba(0,0,0,0.3)", borderRadius: 8, padding: 16, overflow: "auto" }}>
              <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{`// ESP32 + TFT_eSPI (ILI9341 320x240)
// ดึง QR Code จาก Server

#include <WiFi.h>
#include <HTTPClient.h>
#include <TFT_eSPI.h>
#include <TJpg_Decoder.h>

TFT_eSPI tft = TFT_eSPI();
const char* SERVER = "http://192.168.1.x:3000";

void setup() {
  tft.init();
  tft.setRotation(1); // 320x240
  WiFi.begin("SSID", "PASS");
  while (WiFi.status() != WL_CONNECTED) delay(500);
  fetchAndShowDisplay();
}

void loop() {
  // Poll every 5 seconds
  delay(5000);
  fetchAndShowDisplay();
}

void fetchAndShowDisplay() {
  HTTPClient http;
  http.begin(String(SERVER) + "/api/esp32/display");
  int code = http.GET();
  if (code == 200) {
    String body = http.getString();
    // Parse JSON and update screen
    // ...
  }
  http.end();
}

void openDoor() {
  // Called when admin approves
  HTTPClient http;
  http.begin(String(SERVER) + "/api/door/open");
  http.POST("{}");
  http.end();
  // Play sound / LED
}`}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
