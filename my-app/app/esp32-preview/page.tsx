"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";

interface DisplayState {
  title: string;
  subtitle: string;
  qr_url: string;
  register_url: string;
  pending_count: number;
  last_approved: { name: string; student_id: string; time: string } | null;
  server_time: string;
  status: string;
  active_token?: string;
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
  <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 8 }}>
    <rect x="2" y="7" width="20" height="15" rx="2" ry="2"/>
    <polyline points="17 2 12 7 7 2"/>
  </svg>
);

const GamepadIcon = () => (
  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 6 }}>
    <line x1="6" y1="12" x2="10" y2="12"/>
    <line x1="8" y1="10" x2="8" y2="14"/>
    <line x1="15" y1="13" x2="15.01" y2="13"/>
    <line x1="18" y1="11" x2="18.01" y2="11"/>
    <rect x="2" y="6" width="20" height="12" rx="3" ry="3"/>
  </svg>
);

const TerminalIcon = () => (
  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 6 }}>
    <polyline points="4 17 10 11 4 5"/>
    <line x1="12" y1="19" x2="20" y2="19"/>
  </svg>
);

const DatabaseIcon = () => (
  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 6 }}>
    <ellipse cx="12" cy="5" rx="9" ry="3"/>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
    <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/>
  </svg>
);

const CodeIcon = () => (
  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 6 }}>
    <polyline points="16 18 22 12 16 6"/>
    <polyline points="8 6 2 12 8 18"/>
  </svg>
);

// ─── Simulated ESP32 TFT Screen (320×240) ──────────────────────
function ESP32Screen({ mode, displayData, pendingCount, room }: {
  mode: ScreenMode;
  displayData: DisplayState | null;
  pendingCount: number;
  room: string;
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
    // Fetch QR code for display preview
    const fetchQR = () => {
      const cacheBuster = Date.now();
      const tokenQuery = displayData?.active_token ? `&token=${displayData.active_token}` : "";
      fetch(`/api/esp32/qr?room=${room}&_t=${cacheBuster}${tokenQuery}`)
        .then(r => r.blob())
        .then(blob => {
          if (qrDataUrl) URL.revokeObjectURL(qrDataUrl);
          setQrDataUrl(URL.createObjectURL(blob));
        })
        .catch(() => {});
     };
     fetchQR();
     // Refresh QR every 10 seconds to keep synced
     const qrInterval = setInterval(fetchQR, 10000);
     return () => clearInterval(qrInterval);
     // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [displayData?.active_token, room]);

  // IDLE screen — show QR and status information
  if (mode === "idle") {
    return (
      <div className="premium-lcd" style={{ width: 320, height: 240, background: "#06070D", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", border: "1px solid #111" }}>
        {/* Status bar */}
        <div style={{ background: "#0E111C", padding: "4px 8px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ color: "#E2E8F0", fontSize: 9, fontWeight: 800, letterSpacing: "1px" }}>RMUTP DOOR ACCESS</span>
            <span style={{ fontSize: 8, padding: "1px 4px", background: "rgba(16,185,129,0.15)", color: "#10B981", borderRadius: 3, fontWeight: 700 }}>ACTIVE</span>
          </div>
          <span style={{ color: "#10B981", fontSize: 9, fontWeight: 700 }} className="anim-pulse">● {time}</span>
        </div>

        {/* Main LCD Panel */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", gap: 10 }}>
          
          {/* QR Code Scan Frame */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
            <div style={{ 
              width: 120, 
              height: 120, 
              background: "#FFFFFF", 
              padding: 4, 
              borderRadius: 6, 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              border: "3px solid #10B981",
              boxShadow: "0 0 15px rgba(16,185,129,0.2)",
              position: "relative",
              overflow: "hidden"
            }}>
              {qrDataUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={qrDataUrl} alt="QR" style={{ width: 108, height: 108, display: "block" }} />
              ) : (
                <div style={{ width: 108, height: 108, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "#666" }}>Loading...</div>
              )}
              {/* Laser Scan Line Overlay */}
              <div className="anim-scan" />
            </div>
            <div style={{ color: "#FFD700", fontSize: 8, fontWeight: 800, marginTop: 6, letterSpacing: "0.5px", textShadow: "0 0 2px rgba(255,215,0,0.5)" }}>SCAN FOR ACCESS</div>
          </div>

          {/* Info LCD Panel */}
          <div style={{ flex: 1, height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div style={{ textAlign: "left" }}>
              <div style={{ color: "#F0F4F0", fontSize: 11, fontWeight: 800, textShadow: "0 1px 2px rgba(0,0,0,0.5)", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>ห้อง: {room}</div>
              <div style={{ color: "#3B82F6", fontSize: 8, fontWeight: 700, letterSpacing: "0.5px" }}>LAB DOOR CONTROLLER</div>
            </div>

            {/* Waiting Queue counter */}
            <div style={{ 
              background: "rgba(245,158,11,0.08)", 
              border: "1px solid rgba(245,158,11,0.25)",
              borderRadius: 6, 
              padding: "6px 8px", 
              margin: "6px 0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <div style={{ textAlign: "left" }}>
                <div style={{ color: "#F59E0B", fontSize: 8, fontWeight: 800 }}>คิวรออนุมัติ</div>
                <div style={{ color: "#9CA3AF", fontSize: 7 }}>PENDING REQUESTS</div>
              </div>
              <div style={{ color: "#F59E0B", fontSize: 18, fontWeight: 800, textShadow: "0 0 6px rgba(245,158,11,0.3)" }}>
                {pendingCount}
              </div>
            </div>

            {/* Last Approved Student */}
            {displayData?.last_approved ? (
              <div style={{ 
                background: "rgba(16,185,129,0.08)", 
                border: "1px solid rgba(16,185,129,0.25)",
                borderRadius: 6, 
                padding: "6px 8px",
                textAlign: "left"
              }}>
                <div style={{ color: "#10B981", fontSize: 8, fontWeight: 800, display: "flex", alignItems: "center", gap: 3, marginBottom: 2 }}>
                  <span style={{ width: 4, height: 4, borderRadius: "50%", background: "#10B981" }} className="anim-pulse" />
                  <span>ล่าสุด (LATEST)</span>
                </div>
                <div style={{ color: "#FFF", fontSize: 9, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140 }}>
                  {displayData.last_approved.name}
                </div>
              </div>
            ) : (
              <div style={{ 
                background: "rgba(255,255,255,0.03)", 
                border: "1px dashed rgba(255,255,255,0.1)",
                borderRadius: 6, 
                padding: "6px 8px",
                textAlign: "center",
                color: "#6B7A70",
                fontSize: 8
              }}>
                ไม่มีประวัติการอนุมัติล่าสุด
              </div>
            )}
          </div>
        </div>

        {/* Bottom LCD bar */}
        <div style={{ background: "#0A0B10", padding: "4px 8px", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}>
          <span style={{ color: "#6B7A70", fontSize: 8 }}>มทร.พระนคร (ครุศาสตร์)</span>
          <span style={{ color: "#10B981", fontSize: 8, fontFamily: "monospace" }}>192.168.2.49</span>
        </div>
      </div>
    );
  }

  // APPROVED screen
  if (mode === "approved") {
    return (
      <div className="premium-lcd" style={{ width: 320, height: 240, background: "#030C05", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "1px solid #111" }}>
        {/* Glow effect */}
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 80%)" }} />
        
        {/* Animated outer ring */}
        <div style={{ 
          width: 64, 
          height: 64, 
          borderRadius: "50%", 
          background: "#064E3B", 
          border: "3px solid #10B981", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          marginBottom: 14, 
          color: "#10B981",
          boxShadow: "0 0 20px rgba(16,185,129,0.4)"
        }} className="animate-pulse-soft">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        
        <div style={{ color: "#10B981", fontSize: 18, fontWeight: 900, marginBottom: 4, letterSpacing: "1px", textShadow: "0 0 8px rgba(16,185,129,0.5)" }}>ACCESS GRANTED</div>
        <div style={{ color: "#FFD700", fontSize: 13, fontWeight: 800, marginBottom: 6, letterSpacing: "0.5px" }}>DOOR UNLOCKED (ปลดล็อก)...</div>
        
        <div style={{ color: "#FFFFFF", fontSize: 11, fontWeight: 700, background: "rgba(255,255,255,0.06)", padding: "4px 12px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.08)" }}>
          {displayData?.last_approved?.name || "นักศึกษา"}
        </div>
        <div style={{ color: "#9CA3AF", fontSize: 8, marginTop: 6, fontFamily: "monospace" }}>
          {displayData?.last_approved?.student_id || "รหัสประจำตัวนักศึกษา"}
        </div>

        {/* Dynamic progress bar representing door holding open time */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 4, background: "#064E3B" }}>
          <div style={{ height: "100%", background: "#10B981", width: "100%", animation: "door-countdown 5s linear forwards", boxShadow: "0 0 8px #10B981" }} />
        </div>
      </div>
    );
  }

  // REJECTED screen
  if (mode === "rejected") {
    return (
      <div className="premium-lcd" style={{ width: 320, height: 240, background: "#0F0303", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "1px solid #111" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle, rgba(239,68,68,0.12) 0%, transparent 80%)" }} />
        <div style={{ 
          width: 64, 
          height: 64, 
          borderRadius: "50%", 
          background: "#7F1D1D", 
          border: "3px solid #EF4444", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          marginBottom: 14, 
          color: "#EF4444",
          boxShadow: "0 0 20px rgba(239,68,68,0.4)"
        }} className="animate-shake">
          <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </div>
        <div style={{ color: "#EF4444", fontSize: 18, fontWeight: 900, marginBottom: 4, letterSpacing: "1px", textShadow: "0 0 8px rgba(239,68,68,0.5)" }}>ACCESS DENIED</div>
        <div style={{ color: "#FFC7C7", fontSize: 12, fontWeight: 800, marginBottom: 6 }}>❌ ปฏิเสธการเข้าใช้ห้อง</div>
        <div style={{ color: "#9CA3AF", fontSize: 9 }}>กรุณาลงทะเบียนใหม่หรือติดต่อเจ้าหน้าที่</div>
      </div>
    );
  }

  // SCANNING screen
  if (mode === "scanning") {
    return (
      <div className="premium-lcd" style={{ width: 320, height: 240, background: "#03080F", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", border: "1px solid #111" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 80%)" }} />
        <div style={{ 
          width: 48, 
          height: 48, 
          border: "4px solid rgba(59,130,246,0.15)", 
          borderTopColor: "#3B82F6", 
          borderRadius: "50%", 
          animation: "spin 1s linear infinite", 
          marginBottom: 16,
          boxShadow: "0 0 15px rgba(59,130,246,0.2)"
        }} />
        <div style={{ color: "#3B82F6", fontSize: 16, fontWeight: 900, letterSpacing: "1px", textShadow: "0 0 6px rgba(59,130,246,0.4)" }}>PROCESSING...</div>
        <div style={{ color: "#E2E8F0", fontSize: 11, fontWeight: 800, marginTop: 4 }}>กำลังตรวจสอบข้อมูลขอผ่านทาง</div>
        <div style={{ color: "#6B7A70", fontSize: 8, marginTop: 4, fontFamily: "monospace" }}>VERIFYING WITH DATABASE</div>
      </div>
    );
  }

  return null;
}

// ─── Main Preview Page ──────────────────────────────────────────
function ESP32PreviewPageInner() {
  const [mode, setMode] = useState<ScreenMode>("idle");
  const [displayData, setDisplayData] = useState<DisplayState | null>(null);
  const [isRefreshing, setRefreshing] = useState(false);
  const [scale, setScale] = useState(1.5);
  const [esp32Status, setEsp32Status] = useState<ESP32Status | null>(null);
  
  const searchParams = useSearchParams();
  const initialRoom = searchParams.get("room") || "CE-401";
  const [simRoom, setSimRoom] = useState(initialRoom);
  const [originUrl, setOriginUrl] = useState("");
  
  // Real-Time automatic event triggers from DB
  const lastApprovedTimeRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setOriginUrl(window.location.origin);
    }
  }, []);

  const fetchDisplay = async (roomCode: string) => {
    setRefreshing(true);
    try {
      const r = await fetch(`/api/esp32/display?room=${roomCode}`);
      if (r.ok) {
        const d = (await r.json()) as DisplayState;
        
        // Auto-detect a new approved student on the database and trigger real-time simulated unlock sequence
        if (d.last_approved) {
          const approvedTime = d.last_approved.time;
          if (lastApprovedTimeRef.current !== null && lastApprovedTimeRef.current !== approvedTime) {
            simulateApprove();
          }
          lastApprovedTimeRef.current = approvedTime;
        }
        setDisplayData(d);
      }
    } catch {}
    setRefreshing(false);
  };

  const fetchESP32Status = async (roomCode: string) => {
    try {
      const r = await fetch(`/api/esp32/status?room=${roomCode}`);
      if (r.ok) setEsp32Status(await r.json());
    } catch {}
  };

  useEffect(() => {
    fetchDisplay(simRoom);
    fetchESP32Status(simRoom);
    const i1 = setInterval(() => fetchDisplay(simRoom), 4000); // Poll every 4 seconds to be snappy
    const i2 = setInterval(() => fetchESP32Status(simRoom), 4000);
    return () => { clearInterval(i1); clearInterval(i2); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simRoom]);

  function simulateApprove() {
    setMode("scanning");
    setTimeout(() => setMode("approved"), 1500);
    setTimeout(() => setMode("idle"), 6500);
  }
  function simulateReject() {
    setMode("scanning");
    setTimeout(() => setMode("rejected"), 1500);
    setTimeout(() => setMode("idle"), 5000);
  }

  return (
    <div style={{ minHeight: "100vh", background: "#0F1117", color: "#F0F4F0", padding: 32 }}>
      {/* Laser Scanning Styles & Transitions */}
      <style>{`
        @keyframes scan-line {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        @keyframes pulse-dot {
          0% { opacity: 0.4; }
          50% { opacity: 1; }
          100% { opacity: 0.4; }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes door-countdown {
          0% { width: 100%; }
          100% { width: 0%; }
        }
        .anim-scan {
          position: absolute;
          left: 0;
          right: 0;
          height: 3px;
          background: #10B981;
          box-shadow: 0 0 10px #10B981, 0 0 20px #10B981;
          animation: scan-line 3s linear infinite;
          opacity: 0.8;
        }
        .anim-pulse {
          animation: pulse-dot 1.5s infinite ease-in-out;
        }
        .premium-lcd {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }
      `}</style>

      {/* Header */}
      <div className="animate-fade-in" style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 4, display: "flex", alignItems: "center" }}>
            <TVIcon />
            <span>ESP32 Display Preview</span>
          </h1>
          <p style={{ color: "#9EA8A0", fontSize: 13 }}>จำลองหน้าจอ LAFVIN 4.0 TFT Display (3.2&quot; — 320×240 px) · คอนโทรลเลอร์ ILI9341</p>
        </div>
        <a href="/admin/dashboard" style={{ color: "#4CAF50", fontSize: 13, textDecoration: "none", fontWeight: "bold" }}>← Back to Admin Dashboard</a>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 40, alignItems: "start" }}>
        
        {/* Left: Physical Display Mockup */}
        <div className="animate-fade-in">
          {/* Device frame representing the physical ESP32 + TFT module */}
          <div style={{ 
            display: "inline-block", 
            padding: "24px 20px 16px", 
            background: "#1E1E2E", // Classic premium dark blue PCB texture
            borderRadius: 16, 
            boxShadow: "0 25px 60px rgba(0,0,0,0.8), inset 0 2px 2px rgba(255,255,255,0.05)", 
            position: "relative",
            border: "1px solid rgba(255,255,255,0.08)"
          }}>
            {/* Silkscreen lines and mounting holes on classic PCB */}
            <div style={{ position: "absolute", top: 12, left: 12, width: 8, height: 8, borderRadius: "50%", background: "#111", border: "2px solid #D4AF37", boxShadow: "inset 0 0 2px #000" }} />
            <div style={{ position: "absolute", top: 12, right: 12, width: 8, height: 8, borderRadius: "50%", background: "#111", border: "2px solid #D4AF37", boxShadow: "inset 0 0 2px #000" }} />
            <div style={{ position: "absolute", bottom: 44, left: 12, width: 8, height: 8, borderRadius: "50%", background: "#111", border: "2px solid #D4AF37", boxShadow: "inset 0 0 2px #000" }} />
            <div style={{ position: "absolute", bottom: 44, right: 12, width: 8, height: 8, borderRadius: "50%", background: "#111", border: "2px solid #D4AF37", boxShadow: "inset 0 0 2px #000" }} />

            {/* Top PCB brand printing */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, padding: "0 8px" }}>
              <span style={{ fontSize: 10, color: "#CDD6F4", fontWeight: 700, fontFamily: "monospace", letterSpacing: "1px" }}>RMUTP · ILI9341 3.2&quot; TFT</span>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <span style={{ fontSize: 8, color: "#A6ADC8", fontFamily: "monospace" }}>ESP32 LINK:</span>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: mode === "idle" ? "#10B981" : "#F59E0B", boxShadow: mode === "idle" ? "0 0 10px #10B981" : "0 0 10px #F59E0B" }} />
              </div>
            </div>

            {/* Matte-black metallic screen bezel with flow-accurate scaling to avoid overlaps */}
            <div style={{
              width: `${(320 + 12) * scale}px`, 
              height: `${(240 + 12) * scale}px`, 
              position: "relative",
              overflow: "hidden",
              background: "#08080C",
              borderRadius: 6,
              border: "3px solid #2B2D3A",
              boxShadow: "inset 0 0 20px rgba(0,0,0,0.9), 0 8px 30px rgba(0,0,0,0.5)"
            }}>
              <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                padding: 6,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
                width: 332,
                height: 252,
              }}>
                 <ESP32Screen mode={mode} displayData={displayData} pendingCount={displayData?.pending_count || 0} room={simRoom} />
              </div>
            </div>

            {/* Bottom realistic copper pin headers */}
            <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 12 }}>
              {[
                { label: "VCC", color: "#EF4444" },
                { label: "GND", color: "#374151" },
                { label: "CS", color: "#F59E0B" },
                { label: "RST", color: "#F59E0B" },
                { label: "D/C", color: "#F59E0B" },
                { label: "MOSI", color: "#3B82F6" },
                { label: "SCK", color: "#3B82F6" },
                { label: "LED", color: "#EF4444" },
                { label: "MISO", color: "#3B82F6" }
              ].map((pin, index) => (
                <div key={index} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 8, height: 16, background: "linear-gradient(to bottom, #D4AF37, #AA7C11)", borderRadius: 2, border: "1px solid #785A06", boxShadow: "0 1px 2px rgba(0,0,0,0.4)" }} />
                  <span style={{ fontSize: 7, color: pin.color, fontWeight: "bold", fontFamily: "monospace" }}>{pin.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Scale control */}
          <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 11, color: "#6B7A70" }}>ขนาดจำลองหน้าจอ:</span>
            {[1, 1.25, 1.5, 2].map(s => (
              <button key={s} onClick={() => setScale(s)}
                style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${scale === s ? "#4CAF50" : "rgba(255,255,255,0.1)"}`, background: scale === s ? "rgba(76,175,80,0.15)" : "transparent", color: scale === s ? "#4CAF50" : "#6B7A70", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                {s}×
              </button>
            ))}
          </div>
        </div>

        {/* Right: Controls + Info */}
        <div style={{ maxWidth: 500 }}>

          {/* ─── Real-Time Sync Indicator Card ─── */}
          <div className="glass-card animate-fade-in" style={{ padding: 18, marginBottom: 20, background: "rgba(16,185,129,0.03)", border: "1px dashed rgba(16,185,129,0.25)" }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#10B981" }} className="anim-pulse" />
              <div style={{ textAlign: "left" }}>
                <span style={{ fontSize: 13, fontWeight: "bold", color: "#10B981" }}>ระบบจำลองหน้าจอแบบเชื่อมโยงฐานข้อมูลจริง (Real-Time Live Mode)</span>
                <p style={{ fontSize: 11, color: "var(--text-secondary)", margin: "4px 0 0 0", lineHeight: "1.4" }}>
                  หน้าจอนี้เชื่อมโยงกับฐานข้อมูลโดยตรง หากท่านเปิดหน้านี้ทิ้งไว้ แล้วไปกด **อนุมัติ (Approve)** หรือ **เปิดประตู (Unlock)** บนแดชบอร์ด หน้าจำลองนี้จะรันลำดับตรวจสอบและปลดล็อกอัตโนมัติทันทีเสมือนหน้าจอจริง!
                </p>
              </div>
            </div>
          </div>

          {/* ─── 🔗 Dev Link: Clickable Simulator Scan ─── */}
          <div className="glass-card animate-fade-in" style={{ padding: 24, marginBottom: 20, border: "1px solid rgba(16,185,129,0.3)", background: "rgba(16,185,129,0.02)", boxShadow: "0 10px 25px -5px rgba(16,185,129,0.05)" }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 12, color: "#10B981", display: "flex", alignItems: "center", gap: 8, margin: 0 }}>
              <span style={{ fontSize: 18 }}>🔗</span>
              <span>Dev Link: ปุ่มลัดสำหรับนักพัฒนา</span>
            </h3>
            <p style={{ color: "#9EA8A0", fontSize: 12, marginTop: 6, marginBottom: 16, lineHeight: "1.4" }}>
              จำลองการสแกนด้วยคอมพิวเตอร์เพื่อสิทธิ์เข้าห้องปฏิบัติการ (คลิกเพื่อเปิดหน้าฟอร์มลงทะเบียนพร้อมพารามิเตอร์ Token ความปลอดภัยล่าสุด)
            </p>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Select Room to Scan */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: "#E2E8F0" }}>ห้องปฏิบัติการจำลอง:</span>
                <select 
                  className="rmutp-input"
                  value={simRoom}
                  onChange={e => setSimRoom(e.target.value)}
                  style={{ flex: 1, padding: "8px 12px", fontSize: 12.5, background: "rgba(15,17,23,0.8)", borderColor: "rgba(255,255,255,0.08)", color: "#F0F4F0" }}
                >
                  <option value="CE-401">🚪 Classroom CE-401</option>
                  <option value="CE-402">🚪 Classroom CE-402</option>
                  <option value="CE-403">🚪 Classroom CE-403</option>
                </select>
              </div>

              {/* Clickable Simulate Link Button */}
              {displayData?.active_token ? (
                <a
                  href={`/?scan=${displayData.active_token}&room=${simRoom}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: "10px 14px",
                    borderRadius: 10,
                    fontWeight: 800,
                    fontSize: 13,
                    textDecoration: "none",
                    background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                    color: "#fff",
                    boxShadow: "0 4px 12px rgba(16,185,129,0.25)",
                    textAlign: "center",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  ⚡ คลิกเปิดแท็บลงทะเบียนห้อง {simRoom} (Simulate Scan)
                </a>
              ) : (
                <div style={{ color: "#EF4444", fontSize: 11.5, textAlign: "center", background: "rgba(239,68,68,0.05)", padding: 10, borderRadius: 8 }}>
                  ⚠️ กำลังตรวจจับคีย์ Token ล่าสุดจากเซิร์ฟเวอร์...
                </div>
              )}

              {/* Show raw URL for reference */}
              {displayData?.active_token && originUrl && (
                <div style={{ fontSize: 10, color: "#6B7A70", background: "rgba(0,0,0,0.3)", padding: 10, borderRadius: 8, wordBreak: "break-all", fontFamily: "monospace", border: "1px solid rgba(255,255,255,0.03)" }}>
                  <strong style={{ color: "#9EA8A0" }}>ลิงก์สำหรับคลิกทดสอบ (คลิกเพื่อก็อปปี้หรือเปิดใช้งาน):</strong><br />
                  <a href={`${originUrl}/?scan=${displayData.active_token}&room=${simRoom}`} target="_blank" rel="noopener noreferrer" style={{ color: "#10B981", textDecoration: "none", display: "inline-block", marginTop: 4 }}>
                    {`${originUrl}/?scan=${displayData.active_token}&room=${simRoom}`}
                  </a>
                </div>
              )}
            </div>
          </div>

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
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: esp32Status?.online ? "#4CAF50" : "#EF4444", flexShrink: 0 }} className={esp32Status?.online ? "anim-pulse" : ""} />
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
              <span>แผงควบคุมทดสอบจำลอง (Mock Control)</span>
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
              <button onClick={() => setMode("idle")}
                style={{ padding: "10px 0", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#F0F4F0", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                หน้าจอปกติ (Idle)
              </button>
              <button onClick={simulateApprove}
                style={{ padding: "10px 0", background: "rgba(76,175,80,0.15)", border: "1px solid rgba(76,175,80,0.3)", borderRadius: 10, color: "#4CAF50", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                ✅ อนุมัติสำเร็จ (Approved)
              </button>
              <button onClick={simulateReject}
                style={{ padding: "10px 0", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, color: "#EF4444", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                ❌ ปฏิเสธ (Rejected)
              </button>
              <button onClick={() => { setMode("scanning"); setTimeout(() => setMode("idle"), 2000); }}
                style={{ padding: "10px 0", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 10, color: "#3B82F6", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                🔄 กำลังสแกน (Scanning)
              </button>
            </div>
            <div style={{ fontSize: 11, color: "#6B7A70" }}>
              โหมดการแสดงผลปัจจุบันของเครื่อง: <span style={{ color: "#4CAF50", fontWeight: 600 }}>{mode.toUpperCase()}</span>
            </div>
          </div>

          {/* API Info */}
          <div className="glass-card animate-fade-in-delay-2" style={{ padding: 24, marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#FFD700", display: "flex", alignItems: "center" }}>
                <TerminalIcon />
                <span>ESP32 API Endpoints</span>
              </h3>
              <button onClick={() => fetchDisplay(simRoom)} style={{ background: "none", border: "none", cursor: "pointer", color: "#4CAF50", fontSize: 11, fontFamily: "inherit", fontWeight: "bold" }}>
                {isRefreshing ? "⏳ กำลังรีเฟรช..." : "🔄 รีเฟรชข้อมูล"}
              </button>
            </div>
            {[
              { method: "GET", path: "/api/esp32/qr", desc: "ดึง QR Code เป็นไฟล์ภาพ (PNG)", color: "#3B82F6" },
              { method: "GET", path: "/api/esp32/display", desc: "รับค่า JSON เพื่อเรนเดอร์สเตทหน้าจอ", color: "#3B82F6" },
              { method: "POST", path: "/api/esp32/display", desc: "บอร์ด ESP32 อัปเดตสถานะขึ้นคลาวด์", color: "#F59E0B" },
              { method: "POST", path: "/api/students/{id}/door", desc: "แอดมินสั่งเปิดประตูผ่าน API หาบอร์ด", color: "#EF4444" },
            ].map((ep, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", padding: "8px 0", borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.05)" : undefined }}>
                <span style={{ background: ep.color + "22", color: ep.color, padding: "2px 8px", borderRadius: 5, fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{ep.method}</span>
                <code style={{ color: "#4CAF50", fontSize: 11, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ep.path}</code>
                <span style={{ color: "#6B7A70", fontSize: 11, flexShrink: 0 }}>{ep.desc}</span>
              </div>
            ))}
          </div>

          {/* Display State */}
          <div className="glass-card animate-fade-in-delay-3" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, color: "#FFD700", display: "flex", alignItems: "center" }}>
              <DatabaseIcon />
              <span>ค่า JSON ที่ได้รับจาก Server สำหรับนำไปเขียนบอร์ดจริง</span>
            </h3>
            {displayData ? (
              <div style={{ fontFamily: "monospace", fontSize: 11, color: "#4CAF50", background: "rgba(0,0,0,0.3)", borderRadius: 8, padding: 16, overflow: "auto" }}>
                <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {JSON.stringify(displayData, null, 2)}
                </pre>
              </div>
            ) : (
              <div style={{ color: "#6B7A70", fontSize: 13, textAlign: "center", padding: 20 }}>กำลังเรียกข้อมูลจากเซิร์ฟเวอร์...</div>
            )}
          </div>

          {/* ESP32 Arduino Code Snippet */}
          <div className="glass-card animate-fade-in-delay-3" style={{ padding: 24, marginTop: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: "#FFD700", display: "flex", alignItems: "center" }}>
              <CodeIcon />
              <span>Arduino C++ (ตัวอย่างดึง API มาโชว์บนหน้าจอจริง)</span>
            </h3>
            <div style={{ fontFamily: "monospace", fontSize: 11, color: "#86C98A", background: "rgba(0,0,0,0.3)", borderRadius: 8, padding: 16, overflow: "auto" }}>
              <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>{`// การเขียน Arduino ESP32 ร่วมกับจอ ILI9341 3.2 นิ้ว
// ดึงข้อมูล JSON จาก Next.js Server มาอัปเดตหน้าจอจริง

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h> // ติดตั้งผ่าน Library Manager

const char* server_url = "${originUrl || "http://localhost:3000"}/api/esp32/display?room=${simRoom}";

void updateDisplayFromAPI() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(server_url);
    
    // ตั้งค่า Header สำหรับอุปกรณ์ ESP32 ยืนยันตัวตน
    http.addHeader("Content-Type", "application/json");
    http.addHeader("x-api-key", "YOUR_ESP32_API_KEY_HERE");
    
    int httpCode = http.GET();
    if (httpCode == 200) {
      String payload = http.getString();
      
      // Parse ข้อมูล JSON ขนาด 512 bytes
      StaticJsonDocument<512> doc;
      DeserializationError error = deserializeJson(doc, payload);
      
      if (!error) {
        int pending_count = doc["pending_count"]; // คิวรออนุมัติ
        const char* title = doc["title"];
        
        // ตรวจสอบประวัติล่าสุด
        if (doc.containsKey("last_approved") && !doc["last_approved"].isNull()) {
          const char* name = doc["last_approved"]["name"];
          const char* id = doc["last_approved"]["student_id"];
          // วาดข้อมูลลงบนจอ LCD
          // tft.drawString(name, 10, 80);
        }
      }
    }
    http.end();
  }
}`}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ESP32PreviewPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#0F1117", color: "#F0F4F0", padding: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>กำลังโหลดหน้าจอจำลอง...</div>}>
      <ESP32PreviewPageInner />
    </Suspense>
  );
}
