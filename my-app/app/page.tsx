"use client";
import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { SmartAccess_FACULTIES, FACULTY_NAMES } from "@/lib/faculties";
import { IconDoor, IconAlert, IconHourglass } from "./components/Icons";
import jsQR from "jsqr";

interface OfflineEntry {
  id: string;
  data: Record<string, unknown>;
  timestamp: string;
  retries: number;
}

function createOfflineId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// ─── Minimalist Stroke SVG Icons ───
const GraduationIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
  </svg>
);

const ClockIcon = ({ className = "" }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const SendIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const CheckIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const AlertIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const ShieldIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const LockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4 }}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const LockBigIcon = () => (
  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const QRIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
    <rect x="14" y="14" width="3" height="3" />
    <line x1="17" y1="14" x2="21" y2="14" />
    <line x1="21" y1="14" x2="21" y2="17" />
    <line x1="17" y1="20" x2="21" y2="20" />
  </svg>
);

const TVIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4 }}>
    <rect x="2" y="7" width="20" height="15" rx="2" ry="2" />
    <polyline points="17 2 12 7 7 2" />
  </svg>
);

const WifiOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 6 }}>
    <line x1="1" y1="1" x2="23" y2="23" />
    <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.5" />
    <path d="M5 12.5a10.94 10.94 0 0 1 5.83-2.84" />
    <path d="M9.34 6.14A17 17 0 0 1 12 6a16.82 16.82 0 0 1 8.5 2.3" />
    <path d="M2.69 8.56a16.81 16.81 0 0 1 3.54-1.63" />
    <path d="M12 18.5a3 3 0 0 1-1.73-2.63" />
  </svg>
);

// ─── QR Access Blocked Screen ─────────────────────────
// ─── QR Access Blocked Screen ─────────────────────────
function QRAccessBlockedScreen({ message }: { message?: string }) {
  const [showScanner, setShowScanner] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [cameraState, setCameraState] = useState<"idle" | "accessing" | "active" | "error">("idle");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scanAnimationFrameRef = useRef<number | null>(null);

  const stopCamera = useCallback(() => {
    if (scanAnimationFrameRef.current) {
      cancelAnimationFrame(scanAnimationFrameRef.current);
      scanAnimationFrameRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setShowScanner(false);
    setCameraState("idle");
  }, []);

  const startScanningLoop = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const scanFrame = () => {
      if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code) {
          const resultText = code.data;
          console.log("QR Code detected:", resultText);
          
          try {
            const url = new URL(resultText);
            const scanToken = url.searchParams.get("scan");
            const roomCode = url.searchParams.get("room") || "CE-401";
            
            if (scanToken) {
              setScanResult(`พบคิวอาร์ห้อง ${roomCode}! กำลังเข้าสู่ระบบ...`);
              stopCamera();
              window.location.href = `/?scan=${scanToken}&room=${roomCode}`;
              return;
            }
          } catch {
            if (resultText && resultText.trim().length > 10) {
              setScanResult("พบรหัสคิวอาร์! กำลังเข้าสู่ระบบ...");
              stopCamera();
              window.location.href = `/?scan=${resultText.trim()}&room=CE-401`;
              return;
            }
          }
        }
      }
      scanAnimationFrameRef.current = requestAnimationFrame(scanFrame);
    };

    scanAnimationFrameRef.current = requestAnimationFrame(scanFrame);
  }, [stopCamera]);

  const startCamera = async () => {
    setCameraState("accessing");
    setShowScanner(true);
    setScanResult(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } }
      });
      setCameraState("active");
      
      // Wait a short moment to ensure video element is mounted in DOM
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", "true");
          videoRef.current.setAttribute("muted", "true");
          videoRef.current.play()
            .then(() => {
              startScanningLoop();
            })
            .catch(err => {
              console.error("Camera video play failed:", err);
            });
        }
      }, 150);
    } catch (err) {
      console.warn("Camera access denied or unavailable, switching to dynamic simulator:", err);
      setCameraState("error");
    }
  };

  // Clean up camera stream if component unmounts
  useEffect(() => {
    return () => {
      if (scanAnimationFrameRef.current) {
        cancelAnimationFrame(scanAnimationFrameRef.current);
      }
    };
  }, []);

  const handleSimulateScan = () => {
    setScanResult("กำลังประมวลผลโทเคนคิวอาร์...");
    setTimeout(() => {
      // ดึง URL ลำดับห้องเรียนมาทำ mock token
      const mockToken = "mock_token_" + Math.random().toString(36).slice(2, 10);
      window.location.href = `/?scan=${mockToken}&room=CE-401`;
    }, 1500);
  };

  return (
    <div style={{
      minHeight: "100vh",
      position: "relative",
      overflow: "hidden",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
    }}>
      {/* Animated drifting blobs */}
      <div style={{
        position: "absolute", top: "-10%", left: "-5%",
        width: 450, height: 450, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(124,58,237,0.35) 0%, transparent 70%)",
        animation: "blob-drift 12s ease-in-out infinite alternate",
        filter: "blur(40px)",
      }} />
      <div style={{
        position: "absolute", bottom: "-10%", right: "-5%",
        width: 400, height: 400, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(219,39,119,0.3) 0%, transparent 70%)",
        animation: "blob-drift 15s ease-in-out infinite alternate-reverse",
        filter: "blur(40px)",
      }} />

      <div className="animate-fade-in" style={{
        maxWidth: 460,
        width: "100%",
        textAlign: "center",
        zIndex: 10,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 28,
        padding: "40px 30px",
        backdropFilter: "blur(24px)",
        boxShadow: "0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
      }}>
        {!showScanner ? (
          <>
            {/* Lock icon with glowing ring */}
            <div style={{
              width: 90, height: 90,
              borderRadius: "50%",
              background: "linear-gradient(135deg, rgba(124,58,237,0.3), rgba(219,39,119,0.2))",
              border: "2px solid rgba(124,58,237,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 24px",
              color: "rgba(167,139,250,1)",
              boxShadow: "0 0 40px rgba(124,58,237,0.4), 0 0 80px rgba(124,58,237,0.15)",
            }} className="animate-pulse-ring">
              <LockBigIcon />
            </div>

            {/* Badge */}
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(239,68,68,0.15)",
              border: "1px solid rgba(239,68,68,0.35)",
              borderRadius: 99,
              padding: "4px 14px",
              marginBottom: 16,
              color: "#FCA5A5",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 1,
              textTransform: "uppercase",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#EF4444", display: "inline-block" }} />
              การเข้าถึงถูกจำกัด
            </div>

            <h1 style={{
              fontSize: 26,
              fontWeight: 800,
              color: "#FFFFFF",
              marginBottom: 10,
              letterSpacing: "-0.5px",
              lineHeight: 1.3,
            }}>
              ไม่สามารถเข้าใช้งานได้
            </h1>
            <p style={{ color: "rgba(255,255,255,0.55)", marginBottom: 28, fontSize: 13.5, lineHeight: 1.6 }}>
              {message ? (
                <span style={{ color: "#FCA5A5", fontWeight: 600, display: "block", fontSize: 14.5 }}>{message}</span>
              ) : (
                <>
                  หน้าลงทะเบียนนี้สามารถเข้าได้ผ่าน <strong style={{ color: "rgba(167,139,250,0.9)" }}>การสแกน QR Code</strong> เท่านั้น<br />
                  กรุณาสแกน QR Code ที่ติดตั้งอยู่หน้าห้องเรียน
                </>
              )}
            </p>

            {/* How-to steps */}
            <div style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 16,
              padding: "16px 20px",
              textAlign: "left",
              marginBottom: 24,
            }}>
              {[
                { step: "1", text: "เปิดกล้องสแกนด้วยเว็บเบราว์เซอร์" },
                { step: "2", text: "ชี้กล้องไปที่ QR Code หน้าจอห้องเรียน" },
                { step: "3", text: "ระบบจะดำเนินการกรอกฟอร์มเพื่อเข้าห้องทันที" },
              ].map(({ step, text }) => (
                <div key={step} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: step !== "3" ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: "50%",
                    background: "linear-gradient(135deg, rgba(124,58,237,0.5), rgba(219,39,119,0.4))",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#E9D5FF", fontSize: 12, fontWeight: 800, flexShrink: 0,
                  }}>{step}</div>
                  <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 13 }}>{text}</span>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <button
                onClick={startCamera}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  background: "linear-gradient(135deg, #7C3AED 0%, #DB2777 100%)",
                  border: "none",
                  borderRadius: 14,
                  padding: "14px 24px",
                  color: "#FFFFFF",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 8px 25px rgba(124,58,237,0.35)",
                  transition: "all 0.2s",
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = "translateY(-1px)"}
                onMouseOut={(e) => e.currentTarget.style.transform = "none"}
              >
                <QRIcon />
                <span>📷 เปิดกล้องสแกน QR หน้าห้องปฏิบัติการ</span>
              </button>
            </div>
          </>
        ) : (
          <div style={{ position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ color: "#FFF", margin: 0, fontSize: 16, fontWeight: 700 }}>เครื่องสแกนคิวอาร์โค้ดในตัวเว็บ</h3>
              <button
                onClick={stopCamera}
                style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#FFF", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontSize: 12, fontWeight: 600 }}
              >
                ปิดหน้ากล้อง
              </button>
            </div>

            {/* Viewfinder frame */}
            <div style={{
              width: "100%",
              height: 260,
              borderRadius: 20,
              overflow: "hidden",
              position: "relative",
              background: "#000",
              border: "2px solid rgba(124,58,237,0.5)",
              boxShadow: "inset 0 0 40px rgba(0,0,0,0.8)",
            }}>
              {cameraState === "active" ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                /* Animated Camera Simulator Placeholder */
                <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20, background: "#0c0a1f" }}>
                  <div className="animate-spin" style={{ width: 36, height: 36, border: "3px solid rgba(124,58,237,0.2)", borderTop: "3px solid #7C3AED", borderRadius: "50%", marginBottom: 16 }} />
                  <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 12.5, margin: 0, textAlign: "center" }}>
                    {cameraState === "accessing" ? "กำลังเรียกใช้งานเลนส์กล้อง..." : "ไม่สามารถเข้าเลนส์กล้องได้ (ระบบเข้าสู่โหมดสแกนอัจฉริยะจำลอง)"}
                  </p>
                </div>
              )}

              {/* Glowing Red laser scanner line */}
              <div style={{
                position: "absolute",
                top: 0, left: 0, right: 0,
                height: "2px",
                background: "linear-gradient(90deg, transparent, #EF4444, transparent)",
                boxShadow: "0 0 12px #EF4444",
                animation: "scan-laser 2.2s linear infinite",
                zIndex: 2,
              }} />

              {/* Focus target frame */}
              <div style={{
                position: "absolute",
                inset: "40px",
                border: "2px dashed rgba(255,255,255,0.3)",
                borderRadius: 14,
                zIndex: 2,
                pointerEvents: "none",
              }} />
            </div>

            {/* Test Simulator Controls */}
            <div style={{ marginTop: 20, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "14px 16px" }}>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, margin: "0 0 10px 0" }}>
                {scanResult || "ส่องกล้องไปที่หน้าจอ ESP32 หน้าประตูห้องเรียน"}
              </p>
              <button
                onClick={handleSimulateScan}
                disabled={!!scanResult}
                style={{
                  width: "100%",
                  padding: "10px 18px",
                  borderRadius: 10,
                  background: "rgba(16,185,129,0.15)",
                  border: "1px solid rgba(16,185,129,0.4)",
                  color: "#10B981",
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                {scanResult ? "⌛ กำลังนำข้อมูลเข้าห้องเรียน..." : "⚡ สแกนสำเร็จทันที (โหมดสแกนเร็วเพื่อทดสอบ)"}
              </button>
            </div>
          </div>
        )}

        {/* Admin link */}
        {!showScanner && (
          <div style={{ marginTop: 24 }}>
            <a
              href="/admin/login"
              style={{ color: "rgba(255,255,255,0.3)", fontSize: 11.5, textDecoration: "none", fontWeight: 500 }}
            >
              เจ้าหน้าที่ระบบ? เข้าสู่ Admin Panel
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function RegistrationPageInner() {
  // ─── QR Access Authorization ─────────────────────────
  const searchParams = useSearchParams();
  const room = searchParams.get("room") || "default";
  const [qrAuthorized, setQrAuthorized] = useState<boolean | null>(null); // null = checking, true = authorized, false = blocked
  const [blockedMessage, setBlockedMessage] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number | null>(null); // ตัวแปรนับถอยหลังหมดอายุ 120 วินาที
  const [offlineGrant, setOfflineGrant] = useState("");
  const authChecked = useRef(false);
  // ref ของสถานะ "ส่งฟอร์มสำเร็จแล้ว" — ใช้ป้องกัน session timer 120s เตะออกหลัง submit
  // (ตัว success state จริงถูกประกาศที่บรรทัด ~556 — ใช้ ref นี้แทนเพื่อหลีกเลี่ยง use-before-declare)
  const submittedRef = useRef(false);



  // PDPA Cookie & Policy Consent state
  const [hasConsented, setHasConsented] = useState<boolean | null>(null);

  useEffect(() => {
    const checkConsent = () => {
      // v2: granular JSON object — accept ถ้า action เป็น granted หรือ updated และมีอย่างน้อย functional=true
      try {
        const v2Raw = localStorage.getItem("smartaccess_cookie_consent_v2");
        if (v2Raw) {
          const v2 = JSON.parse(v2Raw);
          if (v2 && v2.action === "withdrawn") {
            setHasConsented(false);
            return;
          }
          if (v2 && v2.choices && (v2.action === "granted" || v2.action === "updated")) {
            // ต้องยอมรับ functional cookies เป็นอย่างน้อยเพื่อให้ระบบทำงาน (Auto-fill, จดจำห้อง)
            setHasConsented(v2.choices.functional === true);
            return;
          }
          if (v2 && v2.action === "declined") {
            setHasConsented(false);
            return;
          }
        }
      } catch {
        /* fall through to v1 */
      }
      // v1 backward compat
      const consent = localStorage.getItem("smartaccess_cookie_consent");
      if (consent === "true") {
        setHasConsented(true);
      } else if (consent === "false") {
        setHasConsented(false);
      } else {
        setHasConsented(null);
      }
    };
    checkConsent();
    window.addEventListener("smartaccess_cookie_consent_changed", checkConsent);
    window.addEventListener("storage", checkConsent);
    return () => {
      window.removeEventListener("smartaccess_cookie_consent_changed", checkConsent);
      window.removeEventListener("storage", checkConsent);
    };
  }, []);

  useEffect(() => {
    // ─── 5-Minutes Returning Bypass Gate ───
    const saved = localStorage.getItem("smartaccess_user_session");
    let isBypassValid = false;
    if (saved) {
      try {
        const session = JSON.parse(saved);
        const lastTime = new Date(session.timestamp).getTime();
        const now = new Date().getTime();
        const diffSeconds = (now - lastTime) / 1000;
        
        // Ensure returning bypass is room-isolated: student can only bypass the room they originally registered for
        const sessionRoom = session.requested_room || "default";
        if (diffSeconds <= 300 && sessionRoom === room) {
          isBypassValid = true;
        }
      } catch {}
    }

    // If session is active and approved within 5 minutes, grant instant authorization to skip QR token check
    if (isBypassValid) {
      queueMicrotask(() => setQrAuthorized(true));
      return;
    }

    // QR Timer bug fix: restore remaining time from saved scan timestamp instead of restarting at 120s
    const TIMER_DURATION = 120;
    let savedScanTs: number | null = null;
    try {
      const raw = sessionStorage.getItem(`smartaccess_qr_verified_${room}`);
      if (raw && raw !== "1") {
        savedScanTs = parseInt(raw, 10);
      } else if (raw === "1") {
        // migrate old format: treat as "just verified"
        savedScanTs = Date.now();
        sessionStorage.setItem(`smartaccess_qr_verified_${room}`, String(savedScanTs));
      }
    } catch {}

    if (savedScanTs !== null) {
      const elapsed = (Date.now() - savedScanTs) / 1000;
      const remaining = Math.floor(TIMER_DURATION - elapsed);
      if (remaining > 0) {
        queueMicrotask(() => {
          setTimeLeft(remaining);
          setQrAuthorized(true);
        });
        return;
      } else {
        // timer expired while page was closed — clear and block
        try { sessionStorage.removeItem(`smartaccess_qr_verified_${room}`); } catch {}
        queueMicrotask(() => {
          setQrAuthorized(false);
          setBlockedMessage("ลิงก์เชื่อมต่อหมดอายุเนื่องจากความปลอดภัย (กรุณาสแกน QR Code ใหม่อีกครั้งที่หน้าห้องเรียน)");
        });
        return;
      }
    }

    const scanToken = searchParams.get("scan");
    if (!scanToken) {
      queueMicrotask(() => {
        setQrAuthorized(false);
        setBlockedMessage("ไม่พบข้อมูลการสแกน QR Code กรุณาสแกน QR Code ที่ติดตั้งอยู่หน้าห้องปฏิบัติการเพื่อลงทะเบียนเข้าใช้ห้อง");
      });
      return;
    }

    if (authChecked.current) return;
    authChecked.current = true;

    const verifyToken = async () => {
      try {
        const res = await fetch("/api/esp32/qr/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: scanToken, room }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          try {
            // QR timer bug fix: save scan timestamp so timer continues on page reload
            sessionStorage.setItem(`smartaccess_qr_verified_${room}`, String(Date.now()));
            if (data.offline_grant) {
              sessionStorage.setItem(`smartaccess_offline_grant_${room}`, data.offline_grant);
            }
          } catch {}
          if (data.offline_grant) {
            setOfflineGrant(data.offline_grant);
          }
          setTimeLeft(120);
          setQrAuthorized(true);
        } else {
          setQrAuthorized(false);
          setBlockedMessage(data.error || "รหัส QR Code นี้หมดอายุ หรือถูกใช้งานโดยผู้อื่นไปแล้ว");
        }
      } catch {
        setQrAuthorized(false);
        setBlockedMessage("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์เพื่อตรวจสอบสิทธิ์สแกน");
      }
    };

    verifyToken();
  }, [searchParams, room]);

  // ─── [Client-Side Session Expiration Timer] ───
  // จับเวลานับถอยหลังเมื่อ QR Code ได้รับการยืนยันแล้ว
  // หากนักศึกษาปล่อยค้างหน้าจอลงทะเบียนไว้นานเกิน 120 วินาที ระบบจะบังคับให้หมดอายุทันที ป้องกันการแชร์ลิงก์ข้ามเครือข่าย!
  useEffect(() => {
    if (qrAuthorized !== true) return;
    if (timeLeft === null) return; // wait until timeLeft is initialized by verify/restore

    // ─── BUG FIX (Pending Status Persistence) ───
    // หากผู้ใช้ส่งฟอร์มสำเร็จและกำลังรอแอดมินอนุมัติแล้ว ห้าม session timer 120s
    // ตัดผู้ใช้ออกไปหน้า "QR หมดอายุ" — เพราะ pending status มี timeout 5 นาทีของตัวเอง (auto-reject)
    if (submittedRef.current) return;

    if (timeLeft <= 0) {
      // เมื่อเวลาหมด (ครบ 120 วินาที) — เฉพาะกรณียังไม่ submit
      queueMicrotask(() => {
        setQrAuthorized(false);
        setBlockedMessage("ลิงก์เชื่อมต่อหมดอายุเนื่องจากความปลอดภัย (กรุณาสแกน QR Code ใหม่อีกครั้งที่หน้าห้องเรียน)");
      });
      try {
        sessionStorage.removeItem(`smartaccess_qr_verified_${room}`);
      } catch {}
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(prev => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [qrAuthorized, timeLeft, room]);

  const [showConsentError, setShowConsentError] = useState(false);

  const [form, setForm] = useState({
    title: "นาย",
    first_name: "",
    last_name: "",
    student_id: "",
    year: "",
    faculty: "",
    branch: "",
  });
  const [branches, setBranches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // ─── Customizable Student Auto-fill ───
  const [matchedHistory, setMatchedHistory] = useState<{ year: number; faculty: string; branch: string } | null>(null);
  const [showAutoFillPrompt, setShowAutoFillPrompt] = useState(false);
  const [autoFillToast, setAutoFillToast] = useState<string | null>(null);

  // Debounced check for student history to auto-fill or display confirmation button
  useEffect(() => {
    const fName = form.first_name.trim();
    const lName = form.last_name.trim();
    const sId = form.student_id.trim();

    if (fName.length < 2 || lName.length < 2 || sId.length < 8) {
      queueMicrotask(() => {
        setMatchedHistory(null);
        setShowAutoFillPrompt(false);
      });
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        // V06 fix: send offline_grant so server can verify QR authorization
        const grant = offlineGrant || sessionStorage.getItem(`smartaccess_offline_grant_${room}`) || "";
        const res = await fetch("/api/students/check-match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            first_name: fName,
            last_name: lName,
            student_id: sId,
            offline_grant: grant,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.found) {
            const history = {
              year: data.year,
              faculty: data.faculty,
              branch: data.branch,
            };
            setMatchedHistory(history);
            
            if (data.mode === "manual") {
              // Manual confirmation mode: show button prompt
              setShowAutoFillPrompt(true);
            } else {
              // Auto pop-up mode: fill immediately!
              setForm(f => ({
                ...f,
                year: String(data.year),
                faculty: data.faculty,
                branch: data.branch,
              }));
              setBranches(SmartAccess_FACULTIES[data.faculty] || []);
              
              // Show modern transient checkmark Toast
              setAutoFillToast("✓ ดึงข้อมูลประวัติการเรียนเดิมสำเร็จอัตโนมัติ");
              setTimeout(() => setAutoFillToast(null), 3000);
            }
          } else {
            setMatchedHistory(null);
            setShowAutoFillPrompt(false);
          }
        }
      } catch (err) {
        console.error("Error checking auto-fill history:", err);
      }
    }, 600); // 600ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [form.first_name, form.last_name, form.student_id, offlineGrant, room]);

  function applyManualAutoFill() {
    if (matchedHistory) {
      setForm(f => ({
        ...f,
        year: String(matchedHistory.year),
        faculty: matchedHistory.faculty,
        branch: matchedHistory.branch,
      }));
      setBranches(SmartAccess_FACULTIES[matchedHistory.faculty] || []);
      setShowAutoFillPrompt(false);
      
      setAutoFillToast("✓ ดึงข้อมูลประวัติการเรียนเดิมเรียบร้อยแล้ว");
      setTimeout(() => setAutoFillToast(null), 3000);
    }
  }

  const [success, setSuccess] = useState<{ id: number; student_id: string; title: string; first_name: string; last_name: string; bypass_token?: string } | null>(null);
  const [error, setError] = useState("");
  const [isOnline, setIsOnline] = useState(true);
  const [queueCount, setQueueCount] = useState(0);
  const [currentTime, setCurrentTime] = useState("");

  // Bypass 5-Minutes Returning Door Unlock states
  const [bypassState, setBypassState] = useState<"idle" | "checking" | "success" | "none">("idle");

  // Polling Status States for Real-Time feedback
  const [currentStatus, setCurrentStatus] = useState<"pending" | "approved" | "rejected">("pending");
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [registeredAt, setRegisteredAt] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(300);

  const PENDING_TIMEOUT_SECONDS = 300;

  // Clock
  useEffect(() => {
    const tick = () => setCurrentTime(new Date().toLocaleString("th-TH", {
      timeZone: "Asia/Bangkok", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
    }));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  function getOfflineQueue(): OfflineEntry[] {
    try {
      return JSON.parse(localStorage.getItem("smartaccess_offline_queue") || "[]");
    } catch {
      return [];
    }
  }

  const saveOfflineQueue = useCallback((q: OfflineEntry[]) => {
    localStorage.setItem("smartaccess_offline_queue", JSON.stringify(q));
    setQueueCount(q.length);
  }, []);

  const flushOfflineQueue = useCallback(async () => {
    const queue = getOfflineQueue();
    if (queue.length === 0) return;
    const remaining: OfflineEntry[] = [];
    for (const entry of queue) {
      try {
        const res = await fetch("/api/students", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(entry.data),
        });
        if (!res.ok && res.status !== 409) {
          remaining.push({ ...entry, retries: entry.retries + 1 });
        }
      } catch {
        remaining.push({ ...entry, retries: entry.retries + 1 });
      }
    }
    saveOfflineQueue(remaining);
  }, [saveOfflineQueue]);

  // Online/offline detection
  useEffect(() => {
    setTimeout(() => {
      setIsOnline(navigator.onLine);
    }, 0);
    const onOnline = () => {
      setIsOnline(true);
      flushOfflineQueue();
    };
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [flushOfflineQueue]);

  useEffect(() => {
    const q = getOfflineQueue();
    setTimeout(() => {
      setQueueCount(q.length);
    }, 0);
  }, []);

  async function triggerBypass(session: { id: number; student_id: string; bypass_token: string }) {
    setBypassState("checking");
    try {
      const res = await fetch("/api/students/bypass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: session.id,
          student_id: session.student_id,
          bypass_token: session.bypass_token,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBypassState("success");
        // Auto-clear bypass tokens after successful use — token is consumed, no reuse possible
        sessionStorage.removeItem("smartaccess_temp_bypass_token");
        localStorage.removeItem("smartaccess_user_session");
        // We do NOT renew the timestamp so that the 5-minute session is strictly from the original approval time
      } else {
        localStorage.removeItem("smartaccess_user_session");
        setBypassState("none");
      }
    } catch {
      // Fallback on error to standard registration
      setBypassState("none");
    }
  }

  // Check bypass session on component mount
  useEffect(() => {
    const saved = localStorage.getItem("smartaccess_user_session");
    if (!saved) {
      setTimeout(() => {
        setBypassState("none");
      }, 0);
      return;
    }
    try {
      const session = JSON.parse(saved);
      const lastTime = new Date(session.timestamp).getTime();
      const now = new Date().getTime();
      const diffSeconds = (now - lastTime) / 1000;

      if (diffSeconds <= 300) {
        // returning scan within 5 minutes! Trigger secure unlock bypass
        setTimeout(() => {
          triggerBypass(session);
        }, 0);
      } else {
        // Expired
        localStorage.removeItem("smartaccess_user_session");
        setTimeout(() => {
          setBypassState("none");
        }, 0);
      }
    } catch {
      localStorage.removeItem("smartaccess_user_session");
      setTimeout(() => {
        setBypassState("none");
      }, 0);
    }
  }, []);


  // Polling Status from API every 3 seconds when success registration card is shown
  useEffect(() => {
    if (!success) {
      setTimeout(() => {
        setCurrentStatus("pending");
        setRejectionReason(null);
        setRegisteredAt(null);
        setRemainingSeconds(PENDING_TIMEOUT_SECONDS);
      }, 0);
      return;
    }

    const checkStatus = async () => {
      try {
        const token = success.bypass_token || sessionStorage.getItem("smartaccess_temp_bypass_token") || "";
        const res = await fetch(`/api/students/${success.id}?token=${encodeURIComponent(token)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.student) {
            setCurrentStatus(data.student.status);
            setRejectionReason(data.student.rejection_reason);
            if (data.student.registered_at) {
              setRegisteredAt(data.student.registered_at);
            }
          }
        }
      } catch (err) {
        console.error("[Real-Time Status Polling] failed:", err);
      }
    };

    checkStatus();

    const intervalId = setInterval(checkStatus, 3000);

    return () => clearInterval(intervalId);
  }, [success]);

  // Countdown ticker for pending request expiry (5 minutes from registered_at)
  useEffect(() => {
    if (!success || currentStatus !== "pending" || !registeredAt) return;
    const startMs = new Date(registeredAt).getTime();
    const tick = () => {
      const elapsed = (Date.now() - startMs) / 1000;
      const remaining = Math.max(0, Math.ceil(PENDING_TIMEOUT_SECONDS - elapsed));
      setRemainingSeconds(remaining);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [success, currentStatus, registeredAt]);

  // Save session when admin approves registration
  useEffect(() => {
    if (success && currentStatus === "approved") {
      const session = {
        id: success.id,
        student_id: success.student_id,
        bypass_token: success.bypass_token || sessionStorage.getItem("smartaccess_temp_bypass_token"),
        timestamp: new Date().toISOString(),
        title: success.title,
        first_name: success.first_name,
        last_name: success.last_name,
        requested_room: room,
      };
      localStorage.setItem("smartaccess_user_session", JSON.stringify(session));
    }
  }, [success, currentStatus, room]);

  // Cascade faculty → branch
  function handleFacultyChange(faculty: string) {
    setForm(f => ({ ...f, faculty, branch: "" }));
    setBranches(SmartAccess_FACULTIES[faculty] || []);
  }

  // Format student ID
  function handleStudentIdInput(raw: string) {
    let cleaned = raw.replace(/[^0-9-]/g, "");
    const parts = cleaned.split("-");
    if (parts.length > 2) {
      cleaned = parts[0] + "-" + parts[1];
    }
    setForm(f => ({ ...f, student_id: cleaned }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Explicit consent enforcement
    if (hasConsented !== true) {
      setShowConsentError(true);
      return;
    }
    setShowConsentError(false);
    setLoading(true);

    const idRegex = /^\d{9,12}-\d{1}$|^\d{8,13}$/;
    if (!idRegex.test(form.student_id.trim())) {
      setError("รูปแบบรหัสนักศึกษาไม่ถูกต้อง เช่น 076158050650-8");
      setLoading(false);
      return;
    }

    if (!isOnline) {
      const grant = offlineGrant || sessionStorage.getItem(`smartaccess_offline_grant_${room}`) || "";
      if (!grant) {
        setLoading(false);
        setError("ไม่สามารถบันทึกแบบออฟไลน์ได้ เนื่องจากไม่พบหลักฐานการสแกน QR Code กรุณาเชื่อมต่ออินเทอร์เน็ตและสแกนใหม่");
        return;
      }
      const offlineId = createOfflineId();
      const offlineCreatedAt = new Date().toISOString();
      const entry: OfflineEntry = {
        id: offlineId,
        data: {
          ...form,
          year: parseInt(form.year),
          requested_room: room,
          token: searchParams.get("scan") || "",
          offline_id: offlineId,
          offline_created_at: offlineCreatedAt,
          offline_grant: grant,
        },
        timestamp: offlineCreatedAt,
        retries: 0,
      };
      const q = getOfflineQueue();
      q.push(entry);
      saveOfflineQueue(q);
      setLoading(false);
      setError("ตรวจพบว่าคุณออฟไลน์ ข้อมูลถูกบันทึกไว้ในเครื่องแล้ว และจะถูกส่งขึ้นระบบอัตโนมัติเมื่อตรวจพบสัญญาณอินเทอร์เน็ต");
      return;
    }

    try {
      const grant = offlineGrant || sessionStorage.getItem(`smartaccess_offline_grant_${room}`) || "";
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          year: parseInt(form.year),
          requested_room: room,
          token: searchParams.get("scan") || "",
          offline_grant: grant,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "เกิดข้อผิดพลาดในการลงทะเบียน");
      } else {
        setSuccess({
          id: data.id,
          student_id: form.student_id,
          title: form.title,
          first_name: form.first_name,
          last_name: form.last_name,
          bypass_token: data.bypass_token,
        });
        if (data.bypass_token) {
          sessionStorage.setItem("smartaccess_temp_bypass_token", data.bypass_token);
        }
      }
    } catch {
      setError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  }

  // ─── Bypass Loading / Verification Screen ──────────────────
  if (bypassState === "checking") {
    return (
      <div style={{ minHeight: "100vh", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div className="floating-blob blob-1" />
        <div className="floating-blob blob-2" />
        <div className="animate-fade-in" style={{ maxWidth: 440, width: "100%", textAlign: "center", zIndex: 10 }}>
          <div
            style={{ width: 84, height: 84, borderRadius: "50%", background: "var(--smartaccess-purple-pale)", border: "2px solid var(--smartaccess-purple)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", color: "var(--smartaccess-purple)" }}
            className="animate-pulse-ring"
          >
            <ClockIcon className="animate-pulse-soft" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)", marginBottom: 8, letterSpacing: "-0.5px" }}>
            ตรวจพบสิทธิ์การเข้าห้องด่วน
          </h1>
          <p style={{ color: "var(--text-secondary)", marginBottom: 16, fontSize: 13.5, lineHeight: 1.5 }}>
            สแกนเข้าห้องซ้ำภายใน 5 นาทีเดิม... <br />
            กำลังยืนยันสิทธิ์และสั่งเปิดประตูให้ท่านอัตโนมัติโดยไม่ต้องกรอกข้อมูล
          </p>
          <div style={{ display: "inline-flex", gap: 6, alignItems: "center", background: "var(--smartaccess-purple-pale)", border: "1px solid var(--border)", padding: "4px 12px", borderRadius: 99, color: "var(--smartaccess-purple-dark)", fontSize: 12, fontWeight: 600 }}>
            <span className="animate-spin" style={{ display: "inline-block", width: 12, height: 12, border: "2px solid rgba(124,58,237,0.3)", borderTopColor: "var(--smartaccess-purple)", borderRadius: "50%" }} />
            <span>กำลังสื่อสารกับกล่องควบคุมประตูด้านหน้า...</span>
          </div>
        </div>
      </div>
    );
  }

  // ─── Bypass Success Screen ───────────────────────────────
  if (bypassState === "success") {
    // Get details from localStorage session if available
    let sessionName = "นักศึกษา";
    let sessionCode = "";
    try {
      const saved = localStorage.getItem("smartaccess_user_session");
      if (saved) {
        const s = JSON.parse(saved);
        sessionName = `${s.title}${s.first_name} ${s.last_name}`;
        sessionCode = s.student_id;
      }
    } catch { }

    return (
      <div style={{ minHeight: "100vh", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
        <div className="floating-blob blob-1" />
        <div className="floating-blob blob-2" />
        <div className="animate-fade-in" style={{ maxWidth: 460, width: "100%", textAlign: "center", zIndex: 10 }}>

          <div
            style={{ width: 84, height: 84, borderRadius: "50%", background: "#ECFDF5", border: "3px solid #10B981", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", color: "#10B981", boxShadow: "0 8px 25px rgba(16,185,129,0.3)" }}
            className="animate-scale-in"
          >
            <CheckIcon />
          </div>

          <h1 style={{ fontSize: 26, fontWeight: 800, color: "#059669", marginBottom: 8, letterSpacing: "-0.5px" }}>
            สิทธิ์ Bypass อนุมัติสำเร็จ!
          </h1>
          <p style={{ color: "var(--text-secondary)", marginBottom: 24, fontSize: 14, lineHeight: 1.5 }}>
            ยินดีต้อนรับกลับ! ระบบได้ทำการปลดล็อกประตูแม่เหล็กไฟฟ้าให้เรียบร้อยแล้ว <br />
            สิทธิ์การกลับเข้าห้องด่วน (Bypass 5 นาที) ได้รับการต่ออายุเรียบร้อย
          </p>

          <div className="premium-card animate-scale-in" style={{ padding: 22, textAlign: "left", marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
              <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>ชื่อผู้เข้าใช้ห้อง</span>
              <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>{sessionName}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
              <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>รหัสนักศึกษา</span>
              <span style={{ color: "var(--smartaccess-purple)", fontWeight: 800, fontSize: 14.5 }}>{sessionCode}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
              <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>ห้องปฏิบัติการ</span>
              <span style={{ color: "var(--text-primary)", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 6 }}><IconDoor size={15} /> {room}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0" }}>
              <span style={{ color: "var(--text-secondary)", fontSize: 13 }}>สถานะ Bypass</span>
              <span className="badge badge-approved">
                ผ่านประตูสำเร็จ (ต่อเวลาสิทธิ์ซ้ำ)
              </span>
            </div>
          </div>

          <button
            className="btn-secondary"
            style={{ width: "100%", borderRadius: 14, cursor: "pointer" }}
            onClick={() => {
              localStorage.removeItem("smartaccess_user_session");
              setBypassState("none");
              setForm({ title: "นาย", first_name: "", last_name: "", student_id: "", year: "", faculty: "", branch: "" });
            }}
          >
            ← ล้างเซสชันและลงทะเบียนรหัสอื่น
          </button>
        </div>
      </div>
    );
  }

  // ─── PDPA Consent Block Screen ──────────────────────────────
  if (hasConsented === false) {
    return (
      <div style={{
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
      }}>
        <div className="floating-blob blob-1" />
        <div className="floating-blob blob-2" />

        <div className="animate-fade-in" style={{
          maxWidth: 480,
          width: "100%",
          textAlign: "center",
          zIndex: 10,
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 28,
          padding: "52px 40px",
          backdropFilter: "blur(24px)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
        }}>
          {/* Glowing Shield Alert Icon */}
          <div style={{
            width: 110, height: 110,
            borderRadius: "50%",
            background: "linear-gradient(135deg, rgba(239,68,68,0.3), rgba(219,39,119,0.2))",
            border: "2px solid rgba(239,68,68,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 32px",
            color: "#FCA5A5",
            boxShadow: "0 0 40px rgba(239,68,68,0.4)",
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>

          <h1 style={{
            fontSize: 26,
            fontWeight: 800,
            color: "#FFFFFF",
            marginBottom: 16,
            letterSpacing: "-0.5px",
            lineHeight: 1.3,
          }}>
            การเข้าถึงระบบถูกระงับ
          </h1>
          
          <p style={{ color: "rgba(255,255,255,0.7)", marginBottom: 28, fontSize: 14, lineHeight: 1.7 }}>
            เนื่องจาก <strong style={{ color: "#FFFFFF" }}>พ.ร.บ. ว่าด้วยการกระทำความผิดเกี่ยวกับคอมพิวเตอร์</strong> และมาตรการความปลอดภัยของสถานศึกษา ระบบมีความจำเป็นตามกฎหมายที่จะต้องบันทึกประวัติการผ่านเข้าออก (Access Logs) ตลอดจนข้อมูลไอพีแอดเดรสเพื่อป้องกันอัคคีภัยและการโจรกรรม
          </p>

          <div style={{
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 16,
            padding: "16px 20px",
            textAlign: "left",
            marginBottom: 32,
            fontSize: 13,
            color: "#FCA5A5",
            lineHeight: 1.6,
            display: "flex",
            gap: 10,
            alignItems: "flex-start"
          }}>
            <span style={{ color: "#F59E0B", flexShrink: 0, marginTop: 2 }}><IconAlert size={16} /></span>
            <span>หากท่านปฏิเสธที่จะยอมรับนโยบายความเป็นส่วนตัวและข้อตกลงนี้ ระบบจะไม่สามารถอนุญาตให้ท่านลงทะเบียนเพื่อส่งคำขอเปิดประตูผ่านเครือข่ายได้</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button
              onClick={() => {
                // v2 format: granular consent — accept all
                const record = {
                  version: "2.0",
                  timestamp: new Date().toISOString(),
                  choices: { necessary: true, functional: true, analytics: true, marketing: true },
                  action: "granted" as const,
                };
                try {
                  localStorage.setItem("smartaccess_cookie_consent_v2", JSON.stringify(record));
                  localStorage.setItem("smartaccess_cookie_consent", "true"); // v1 compat
                } catch { /* ignore */ }
                // server-side audit (best effort)
                fetch("/api/consent", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ functional: true, analytics: true, marketing: true, action: "granted" }),
                  keepalive: true,
                }).catch(() => {});
                window.dispatchEvent(new CustomEvent("smartaccess_cookie_consent_changed", { detail: record }));
              }}
              style={{
                width: "100%",
                background: "linear-gradient(135deg, #7C3AED 0%, #DB2777 100%)",
                border: "none",
                borderRadius: 14,
                color: "#FFFFFF",
                padding: "14px 20px",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 6px 20px rgba(124,58,237,0.3)",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-1px)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
            >
              ยอมรับนโยบายและเริ่มต้นใช้งาน
            </button>

            <Link
              href={`/privacy${typeof window !== 'undefined' ? window.location.search : ''}`}
              style={{
                color: "rgba(255,255,255,0.4)",
                fontSize: 13,
                textDecoration: "underline",
                fontWeight: 500,
                marginTop: 8
              }}
            >
              อ่านนโยบายความเป็นส่วนตัวเพิ่มเติม
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─── QR Lockdown Gate ───────────────────────────────────────
  // While checking authorization, show checking screen or loader
  if (qrAuthorized === null) {
    return (
      <div style={{ minHeight: "100vh", background: "#0f0c29", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFF", flexDirection: "column", gap: 16 }}>
        <span className="animate-spin" style={{ display: "inline-block", width: 36, height: 36, border: "3px solid rgba(255,255,255,0.2)", borderTopColor: "var(--smartaccess-purple)", borderRadius: "50%" }} />
        <span style={{ fontSize: 14, fontWeight: 600 }}>กำลังตรวจสอบความถูกต้องของรหัสสแกน QR Code...</span>
      </div>
    );
  }
  if (qrAuthorized === false) return <QRAccessBlockedScreen message={blockedMessage} />;

  // ─── Success & Real-Time Polling Screen ────────────────────
  if (success) {
    return (
      <div style={{ minHeight: "100vh", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>

        {/* Dynamic Drifting Background Blobs to elevate UI */}
        <div className="floating-blob blob-1" />
        <div className="floating-blob blob-2" />

        <div className="animate-fade-in" style={{ maxWidth: 480, width: "100%", textAlign: "center", zIndex: 10 }}>

          {/* Vector Status Icons instead of emojis */}
          {currentStatus === "pending" && (
            <div
              style={{ width: 84, height: 84, borderRadius: "50%", background: "var(--edu-pink-pale)", border: "2px solid var(--edu-pink)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", color: "var(--edu-pink)" }}
              className="animate-pulse-ring"
            >
              <ClockIcon className="animate-pulse-soft" />
            </div>
          )}

          {currentStatus === "approved" && (
            <div
              style={{ width: 84, height: 84, borderRadius: "50%", background: "#ECFDF5", border: "3px solid #10B981", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", color: "#10B981", boxShadow: "0 8px 25px rgba(16,185,129,0.3)" }}
              className="animate-scale-in"
            >
              <CheckIcon />
            </div>
          )}

          {currentStatus === "rejected" && (
            <div
              style={{ width: 84, height: 84, borderRadius: "50%", background: "#FEF2F2", border: "3px solid #EF4444", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px", color: "#EF4444", boxShadow: "0 8px 25px rgba(239,68,68,0.3)" }}
              className="animate-shake"
            >
              <AlertIcon />
            </div>
          )}

          {/* Real-time description titles */}
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)", marginBottom: 8, letterSpacing: "-0.5px" }}>
            {currentStatus === "pending" && "ส่งคำขอสำเร็จ — รออนุมัติ"}
            {currentStatus === "approved" && "ได้รับสิทธิ์เข้าห้องแล้ว!"}
            {currentStatus === "rejected" && "ปฏิเสธการเข้าใช้ห้อง"}
          </h1>

          {room && room !== "default" && (
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(255,255,255,0.06)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: "4px 12px",
              marginBottom: 16,
              color: "var(--text-secondary)",
              fontSize: 13,
              fontWeight: 700,
            }}>
              <IconDoor size={14} />
              <span>ห้องปฏิบัติการ: {room}</span>
            </div>
          )}

          <p style={{ color: "var(--text-secondary)", marginBottom: 24, fontSize: 14, lineHeight: 1.5 }}>
            {currentStatus === "pending" && "ระบบได้รับข้อมูลของคุณแล้ว กำลังประสานงานและตรวจสิทธิ์..."}
            {currentStatus === "approved" && "ยินดีด้วย! แอดมินได้ทำการอนุมัติข้อมูล และสั่งการปลดล็อคประตูให้คุณแล้ว"}
            {currentStatus === "rejected" && "ขออภัย คำขอใช้ห้องปฏิบัติการของคุณไม่ได้รับการอนุมัติ"}
          </p>

          {/* Dynamic Progress Stepper UI */}
          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid var(--border)",
            borderRadius: 20,
            padding: "20px 16px",
            marginBottom: 20,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "relative"
          }}>
            {/* Horizontal Line background */}
            <div style={{
              position: "absolute",
              top: "38%", left: "12%", right: "12%",
              height: 2,
              background: "var(--border)",
              zIndex: 1
            }} />
            
            {/* Colored active line */}
            <div style={{
              position: "absolute",
              top: "38%", left: "12%",
              width: currentStatus === "approved" ? "76%" : currentStatus === "rejected" ? "76%" : "38%",
              height: 2,
              background: currentStatus === "rejected" ? "#EF4444" : "var(--smartaccess-purple)",
              zIndex: 1,
              transition: "all 0.6s ease"
            }} />

            {[
              { label: "ยื่นคำขอ", active: true, done: true, icon: "✓" },
              { label: "จัดเข้าคิว", active: true, done: true, icon: "2" },
              { 
                label: currentStatus === "approved" ? "ผ่านสิทธิ์" : currentStatus === "rejected" ? "ปฏิเสธ" : "กำลังตรวจ", 
                active: true, 
                done: currentStatus !== "pending", 
                icon: currentStatus === "approved" ? "✓" : currentStatus === "rejected" ? "X" : "⏳",
                color: currentStatus === "rejected" ? "#EF4444" : currentStatus === "approved" ? "#10B981" : "var(--smartaccess-purple)"
              },
              { 
                label: "เปิดประตู", 
                active: currentStatus === "approved", 
                done: currentStatus === "approved", 
                icon: "🚪",
                color: currentStatus === "approved" ? "#10B981" : "var(--text-muted)"
              }
            ].map((step, idx) => (
              <div key={idx} style={{ zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", width: "22%" }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: step.done 
                    ? (step.color || "linear-gradient(135deg, var(--smartaccess-purple) 0%, var(--edu-pink) 100%)") 
                    : "var(--bg-card)",
                  border: `2px solid ${step.done ? "transparent" : "var(--border)"}`,
                  color: step.done ? "#FFF" : "var(--text-muted)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 800,
                  boxShadow: step.done ? "0 0 15px rgba(124,58,237,0.3)" : "none",
                  transition: "all 0.4s ease"
                }} className={!step.done && idx === 2 ? "animate-pulse" : ""}>
                  {step.icon}
                </div>
                <span style={{ 
                  fontSize: 11, 
                  fontWeight: 700, 
                  color: step.done ? "var(--text-primary)" : "var(--text-muted)",
                  marginTop: 8,
                  textAlign: "center"
                }}>{step.label}</span>
              </div>
            ))}
          </div>

          {/* Detailed Status Card */}
          <div className="premium-card animate-scale-in" style={{ padding: 24, textAlign: "left", marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
              <span style={{ color: "var(--text-secondary)", fontSize: 13.5 }}>ชื่อ - นามสกุล</span>
              <span style={{ color: "var(--text-primary)", fontWeight: 700 }}>
                {success.title}{success.first_name} {success.last_name}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border)" }}>
              <span style={{ color: "var(--text-secondary)", fontSize: 13.5 }}>รหัสนักศึกษา</span>
              <span style={{ color: "var(--smartaccess-purple)", fontWeight: 800, fontSize: 15 }}>
                {success.student_id}
              </span>
            </div>

            {/* Real-Time Status Badge */}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: rejectionReason ? "1px solid var(--border)" : "none" }}>
              <span style={{ color: "var(--text-secondary)", fontSize: 13.5 }}>สถานะสิทธิ์</span>
              <span className={`badge ${currentStatus === "approved" ? "badge-approved" : currentStatus === "rejected" ? "badge-rejected" : "badge-pending"}`}>
                <ClockIcon />
                {currentStatus === "pending" && "รอเจ้าหน้าที่อนุมัติ"}
                {currentStatus === "approved" && "อนุมัติสำเร็จ (ประตูเปิดแล้ว)"}
                {currentStatus === "rejected" && "ถูกปฏิเสธการเข้าใช้"}
              </span>
            </div>

            {/* Rejection reason showing in real-time if rejected */}
            {currentStatus === "rejected" && rejectionReason && (
              <div style={{ padding: "12px 0 0 0" }}>
                <span style={{ display: "block", color: "var(--text-secondary)", fontSize: 13.5, marginBottom: 4 }}>สาเหตุการปฏิเสธ:</span>
                <div style={{ background: "#FEF2F2", border: "1px solid rgba(239,68,68,0.2)", padding: "10px 14px", borderRadius: 10, color: "#DC2626", fontSize: 13, fontWeight: 600 }}>
                  <ShieldIcon />
                  <span style={{ marginLeft: 6 }}>{rejectionReason}</span>
                </div>
              </div>
            )}
          </div>

          {/* Guide messages below card */}
          <div style={{ minHeight: 45, marginBottom: 24 }}>
            {currentStatus === "pending" && (
              <>
                <p style={{ color: "var(--smartaccess-purple-dark)", fontSize: 13.5, fontWeight: 700, animation: "blink 1.5s ease-in-out infinite", marginBottom: 10 }}>
                  กำลังตรวจสอบข้อมูลและสิทธิ์เข้าห้องแบบ Real-Time...
                </p>
                <div style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  background: remainingSeconds <= 60 ? "#FEF2F2" : "rgba(124,58,237,0.08)",
                  border: `1px solid ${remainingSeconds <= 60 ? "#EF4444" : "var(--smartaccess-purple)"}`,
                  borderRadius: 12,
                  padding: "8px 16px",
                  color: remainingSeconds <= 60 ? "#DC2626" : "var(--smartaccess-purple-dark)",
                  fontSize: 14,
                  fontWeight: 800,
                  fontVariantNumeric: "tabular-nums",
                }}>
                  <ClockIcon />
                  <span>หมดเวลาใน</span>
                  <span style={{ fontSize: 16 }}>
                    {String(Math.floor(remainingSeconds / 60)).padStart(2, "0")}:
                    {String(remainingSeconds % 60).padStart(2, "0")}
                  </span>
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: 12, marginTop: 8 }}>
                  หากไม่มีแอดมินกดอนุมัติภายในเวลานี้ คำขอจะถูกปฏิเสธอัตโนมัติ
                </p>
              </>
            )}
            {currentStatus === "approved" && (
              <p style={{ color: "#059669", fontSize: 13.5, fontWeight: 700, marginBottom: 14 }}>
                ประตูแม่เหล็กไฟฟ้าได้รับการเปิดออกแล้ว! คุณสามารถเดินผ่านเข้าห้องได้ทันที
              </p>
            )}
            {currentStatus === "rejected" && (
              <p style={{ color: "#DC2626", fontSize: 13.5, fontWeight: 700 }}>
                หากคิดว่าเป็นความผิดพลาด กรุณาตรวจสอบข้อมูลและยื่นคำขอใหม่อีกครั้ง
              </p>
            )}
          </div>

          <button
            className="btn-secondary"
            style={{ width: "100%", borderRadius: 14 }}
            onClick={() => {
              setSuccess(null);
              setForm({ title: "นาย", first_name: "", last_name: "", student_id: "", year: "", faculty: "", branch: "" });
              setBranches([]);
            }}
          >
            ← ย้อนกลับไปลงทะเบียนใหม่
          </button>
        </div>
      </div>
    );
  }

  // ─── Registration Form ─────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>

      {/* Dynamic Drifting Background Blobs to elevate UI */}
      <div className="floating-blob blob-1" />
      <div className="floating-blob blob-2" />

      {/* Offline Banner */}
      {!isOnline && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, background: "var(--edu-pink)", color: "#FFFFFF", padding: "12px", textAlign: "center", fontSize: 13.5, fontWeight: 700, zIndex: 100, boxShadow: "0 4px 12px rgba(219,39,119,0.2)" }}>
          <WifiOffIcon />
          ระบบออฟไลน์ — ข้อมูลจะถูกเซฟไว้ในเครื่อง และส่งไปหาเซิร์ฟเวอร์อัตโนมัติเมื่อเชื่อมต่อเน็ต {queueCount > 0 && `(มี ${queueCount} รายการรอในคิว)`}
        </div>
      )}

      <div style={{ maxWidth: 520, width: "100%", zIndex: 10 }}>
        {/* Header Section */}
        <div className="animate-fade-in" style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
            <div
              style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, var(--smartaccess-purple) 0%, var(--edu-pink) 100%)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", boxShadow: "0 8px 20px rgba(124,58,237,0.2)" }}
              className="animate-pulse-soft"
            >
              <GraduationIcon />
            </div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 12, color: "var(--smartaccess-purple)", fontWeight: 800, letterSpacing: 1.5, textTransform: "uppercase" }}>SmartAccess EDUCATION</div>
              <div style={{ fontSize: 14, color: "var(--text-secondary)", fontWeight: 500 }}>คณะครุศาสตร์ มทร.พระนคร</div>
            </div>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.5px", marginBottom: 6 }}>
            ลงทะเบียนเข้าใช้งานห้อง
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 13.5, lineHeight: 1.5 }}>
            กรอกข้อมูลเพื่อยื่นสิทธิ์ขออนุญาตเข้าใช้ห้องปฏิบัติการ คณะครุศาสตร์ <br />
            สิทธิ์การผ่านประตูจะถูกตรวจสอบโดยอาจารย์หรือเจ้าหน้าที่ดูแลระบบ
          </p>
          
          {room && room !== "default" && (
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "linear-gradient(135deg, rgba(124,58,237,0.15) 0%, rgba(219,39,119,0.12) 100%)",
              border: "1px solid rgba(124,58,237,0.3)",
              borderRadius: 99,
              padding: "6px 16px",
              marginTop: 12,
              color: "var(--smartaccess-purple-dark)",
              fontSize: 13.5,
              fontWeight: 800,
              boxShadow: "0 4px 12px rgba(124,58,237,0.08)"
            }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--smartaccess-purple)", display: "inline-block" }} className="animate-pulse" />
              <IconDoor size={14} />
              <span>ห้องเรียนเป้าหมาย: {room}</span>
            </div>
          )}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginTop: 12 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--smartaccess-purple-pale)", border: "1px solid var(--border)", padding: "4px 12px", borderRadius: 99, color: "var(--smartaccess-purple-dark)", fontSize: 12, fontWeight: 600 }}>
              <ClockIcon />
              <span>{currentTime}</span>
            </div>

            {timeLeft !== null && (
              <div style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: timeLeft <= 15 ? "#FEF2F2" : "rgba(245,158,11,0.08)",
                border: timeLeft <= 15 ? "1px solid rgba(239,68,68,0.35)" : "1px solid rgba(245,158,11,0.3)",
                borderRadius: 99,
                padding: "4px 12px",
                color: timeLeft <= 15 ? "#DC2626" : "#D97706",
                fontSize: 12,
                fontWeight: 800,
                boxShadow: timeLeft <= 15 ? "0 0 10px rgba(239,68,68,0.2)" : "none"
              }} className={timeLeft <= 15 ? "animate-pulse" : ""}>
                <IconHourglass size={13} />
                <span>ลิงก์หมดอายุใน: {timeLeft} วินาที</span>
              </div>
            )}
          </div>
        </div>



        {/* Form Card */}
        <div className="premium-card animate-fade-in-delay-1" style={{ padding: 32 }}>
          <form onSubmit={handleSubmit}>
            {autoFillToast && (
              <div 
                className="animate-scale-in"
                style={{
                  background: "#ECFDF5",
                  border: "1px solid rgba(16,185,129,0.2)",
                  borderRadius: 12,
                  padding: "10px 14px",
                  color: "#059669",
                  fontSize: 13.5,
                  fontWeight: 700,
                  marginBottom: 20,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  boxShadow: "0 4px 12px rgba(16,185,129,0.1)"
                }}
              >
                <div style={{
                  width: 22, height: 22, borderRadius: "50%",
                  background: "#D1FAE5", display: "flex",
                  alignItems: "center", justifyContent: "center",
                  color: "#10B981", flexShrink: 0
                }}>✓</div>
                <span>{autoFillToast}</span>
              </div>
            )}

            {error && (
              <div style={{ background: "var(--edu-pink-pale)", border: "1px solid rgba(219,39,119,0.2)", borderRadius: 12, padding: "12px 16px", color: "var(--edu-pink)", fontSize: 13.5, fontWeight: 600, marginBottom: 20 }}>
                <AlertIcon />
                <span style={{ marginLeft: 8 }}>{error}</span>
              </div>
            )}

            {/* Title + First Name + Last Name Row */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
                คำนำหน้าชื่อ และ ชื่อ - นามสกุล *
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "100px 1fr 1fr", gap: 10 }}>
                {/* Title */}
                <div>
                  <select
                    id="student_title"
                    aria-label="คำนำหน้าชื่อ"
                    className="smartaccess-input"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    style={{ textAlign: "center", paddingLeft: 4, paddingRight: 4 }}
                    required
                  >
                    <option value="นาย">นาย</option>
                    <option value="นางสาว">นางสาว</option>
                    <option value="นาง">นาง</option>
                  </select>
                </div>

                {/* First Name */}
                <div>
                  <input
                    id="student_first_name"
                    aria-label="ชื่อจริง"
                    className="smartaccess-input"
                    placeholder="ชื่อจริง"
                    value={form.first_name}
                    onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                    required
                  />
                </div>

                {/* Last Name */}
                <div>
                  <input
                    id="student_last_name"
                    aria-label="นามสกุล"
                    className="smartaccess-input"
                    placeholder="นามสกุล"
                    value={form.last_name}
                    onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {/* Preview name tag */}
              {(form.first_name || form.last_name) && (
                <div style={{ marginTop: 8, padding: "6px 14px", background: "var(--smartaccess-purple-pale)", borderRadius: 8, border: "1px solid var(--border)", display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 500 }}>ตรวจสอบชื่อ:</span>
                  <span style={{ fontSize: 13, color: "var(--smartaccess-purple-dark)", fontWeight: 700 }}>
                    {form.title}{form.first_name} {form.last_name}
                  </span>
                </div>
              )}
            </div>

            {/* Student ID */}
            <div style={{ marginBottom: 18 }}>
              <label htmlFor="student_id" style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
                รหัสประจำตัวนักศึกษา *
                <span style={{ color: "var(--text-secondary)", fontWeight: 500, marginLeft: 6, fontSize: 11.5 }}>
                  (รูปแบบ: XXXXXXXXXXXX-X หรือรหัสวิทยบริการ)
                </span>
              </label>
              <input
                id="student_id"
                aria-invalid={error ? "true" : "false"}
                className="smartaccess-input"
                placeholder="กรอกรหัสนักศึกษา เช่น 076158050650-8"
                value={form.student_id}
                onChange={e => handleStudentIdInput(e.target.value)}
                maxLength={16}
                required
                style={{ fontFamily: "monospace", letterSpacing: "1px", fontSize: 15, fontWeight: 700 }}
              />
            </div>

            {showAutoFillPrompt && matchedHistory && (
              <div 
                className="animate-scale-in"
                style={{
                  marginBottom: 18,
                  padding: "12px 16px",
                  background: "linear-gradient(135deg, rgba(124,58,237,0.12) 0%, rgba(219,39,119,0.08) 100%)",
                  border: "1px dashed var(--smartaccess-purple)",
                  borderRadius: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  boxShadow: "0 4px 15px rgba(124,58,237,0.05)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: "50%",
                    background: "var(--smartaccess-purple-pale)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "var(--smartaccess-purple)", flexShrink: 0
                  }}>
                    <GraduationIcon />
                  </div>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "var(--smartaccess-purple-dark)" }}>พบประวัติการใช้ห้องเดิมของคุณ!</div>
                    <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>
                      ปี {matchedHistory.year} | {matchedHistory.faculty} | {matchedHistory.branch.substring(0, 22)}{matchedHistory.branch.length > 22 ? "..." : ""}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={applyManualAutoFill}
                  style={{
                    background: "var(--smartaccess-purple)",
                    color: "#FFFFFF",
                    border: "none",
                    padding: "8px 14px",
                    borderRadius: 10,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 4px 10px rgba(124,58,237,0.3)",
                    transition: "all 0.2s ease"
                  }}
                  onMouseOver={e => e.currentTarget.style.transform = "scale(1.05)"}
                  onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}
                >
                  ดึงข้อมูลอัตโนมัติ
                </button>
              </div>
            )}

            {/* Year */}
            <div style={{ marginBottom: 18 }}>
              <label htmlFor="student_year" style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
                ชั้นปีที่ศึกษา *
              </label>
              <select
                id="student_year"
                className="smartaccess-input"
                value={form.year}
                onChange={e => setForm(f => ({ ...f, year: e.target.value }))}
                required
              >
                <option value="">-- เลือกชั้นปีการศึกษา --</option>
                {[1, 2, 3, 4].map(y => (
                  <option key={y} value={y}>นักศึกษาชั้นปีที่ {y}</option>
                ))}
              </select>
            </div>

            {/* Faculty */}
            <div style={{ marginBottom: 18 }}>
              <label htmlFor="student_faculty" style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
                คณะ *
              </label>
              <select
                id="student_faculty"
                className="smartaccess-input"
                value={form.faculty}
                onChange={e => handleFacultyChange(e.target.value)}
                required
              >
                <option value="">-- เลือกคณะวิชา --</option>
                {FACULTY_NAMES.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            {/* Branch */}
            <div style={{ marginBottom: 28 }}>
              <label htmlFor="student_branch" style={{ display: "block", fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
                สาขาวิชา *
              </label>
              <select
                id="student_branch"
                className="smartaccess-input"
                value={form.branch}
                onChange={e => setForm(f => ({ ...f, branch: e.target.value }))}
                disabled={!form.faculty}
                required
              >
                <option value="">{form.faculty ? "-- เลือกสาขาวิชา --" : "-- เลือกคณะวิชาของท่านก่อน --"}</option>
                {branches.map(b => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* Show consent warning above button if user clicked with no consent */}
            {showConsentError && (
              <div 
                className="animate-shake"
                style={{
                  background: "#FEF2F2",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  borderRadius: 12,
                  padding: "12px 16px",
                  color: "#DC2626",
                  fontSize: "13px",
                  fontWeight: 600,
                  marginBottom: 16,
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  boxShadow: "0 4px 12px rgba(239, 68, 68, 0.08)"
                }}
              >
                <span style={{ color: "#F59E0B", display: "inline-flex" }}><IconAlert size={18} /></span>
                <span>ไม่สามารถส่งข้อมูลได้ กรุณากดยอมรับนโยบายความเป็นส่วนตัวและคุกกี้ที่แถบด้านล่างสุดก่อนส่งข้อมูล</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className={hasConsented === true ? "btn-primary" : "btn-secondary"}
              style={{
                width: "100%",
                justifyContent: "center",
                fontSize: 15,
                borderRadius: 14,
                padding: "14px 20px",
                background: hasConsented === true 
                  ? "linear-gradient(135deg, var(--smartaccess-purple) 0%, var(--edu-pink) 100%)" 
                  : "rgba(203, 213, 225, 0.4)",
                color: hasConsented === true ? "#FFFFFF" : "#64748B",
                border: hasConsented === true ? "none" : "1px solid #CBD5E1",
                cursor: hasConsented === true ? "pointer" : "not-allowed",
                boxShadow: hasConsented === true ? "0 4px 15px rgba(124, 58, 237, 0.3)" : "none",
                transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
              }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="animate-spin" style={{ display: "inline-block", width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%" }} />
                  <span style={{ marginLeft: 8 }}>กำลังส่งข้อมูล...</span>
                </>
              ) : (
                <>
                  <SendIcon />
                  <span style={{ marginLeft: 8 }}>ส่งข้อมูลขอเปิดประตูผ่านระบบ</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Navigation Footlinks */}
        <div className="animate-fade-in-delay-2" style={{ textAlign: "center", marginTop: 24, display: "flex", justifyContent: "center", alignItems: "center", gap: 12 }}>
          <a href="/admin/login" style={{ color: "var(--smartaccess-purple)", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>
            <LockIcon />
            สำหรับเจ้าหน้าที่ (Admin Login)
          </a>
          <span style={{ color: "var(--text-muted)", fontSize: 12 }}>•</span>
          <a href="/esp32-preview" style={{ color: "var(--edu-pink)", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>
            <TVIcon />
            จำลองหน้าจอ ESP32 Simulator
          </a>
        </div>
      </div>
    </div>
  );
}

// Suspense wrapper required by Next.js 16 for useSearchParams() during SSR
export default function UserRegistrationPage() {
  return (
    <Suspense fallback={null}>
      <RegistrationPageInner />
    </Suspense>
  );
}
