"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
//ฟิล์มเอง
// ─── Minimalist Vector SVGs ───
const KeyholeShieldIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <circle cx="12" cy="11" r="2" />
    <path d="M12 13v3" />
  </svg>
);

const EyeOpenIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeClosedIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const CrownIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
    <path d="M3 20h18" />
  </svg>
);

const DoorKeyIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3M15.5 7.5L19 4" />
  </svg>
);

const AlertIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle" }}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 6 }}>
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const UnlockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 8 }}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 9.9-1" />
  </svg>
);

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
      } else {
        router.push("/admin/dashboard");
      }
    } catch {
      setError("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบอินเทอร์เน็ต");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #F5F3FF 0%, #FAF9FF 50%, #FDF2F8 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, position: "relative", overflow: "hidden" }}>
      {/* Background soft glow */}
      <div style={{ position: "absolute", top: "15%", left: "50%", transform: "translateX(-50%)", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(124,58,237,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ maxWidth: 420, width: "100%", position: "relative" }}>
        {/* Logo and Titles */}
        <div className="animate-fade-in" style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg, var(--rmutp-purple) 0%, var(--edu-pink) 100%)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", color: "#fff", boxShadow: "0 10px 25px rgba(124,58,237,0.25)" }}
            className="animate-pulse-ring"
          >
            <KeyholeShieldIcon />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.5px", marginBottom: 4 }}>
            Admin Portal
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            ระบบควบคุมและจัดการประตูห้องปฏิบัติการ
          </p>
          <div style={{ marginTop: 8, display: "inline-flex", gap: 6, alignItems: "center", background: "#ECFDF5", border: "1px solid rgba(16,185,129,0.2)", padding: "3px 10px", borderRadius: 99 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981" }} className="animate-blink" />
            <span style={{ fontSize: 11, color: "#047857", fontWeight: 700 }}>System Secure</span>
          </div>
        </div>

        {/* Login Card */}
        <div className="premium-card animate-fade-in-delay-1" style={{ padding: 36 }}>
          <form onSubmit={handleLogin}>
            {error && (
              <div style={{ background: "var(--edu-pink-pale)", border: "1px solid rgba(219,39,119,0.15)", borderRadius: 12, padding: "12px 16px", color: "var(--edu-pink)", fontSize: 13.5, fontWeight: 600, marginBottom: 20, display: "flex", gap: 8, alignItems: "center" }}>
                <AlertIcon />
                <span>{error}</span>
              </div>
            )}

            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                Username
              </label>
              <input
                className="rmutp-input"
                type="text"
                placeholder="กรอกชื่อผู้ใช้ของท่าน"
                value={username}
                onChange={e => setUsername(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div style={{ marginBottom: 24, position: "relative" }}>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
                Password
              </label>
              <input
                className="rmutp-input"
                type={showPass ? "text" : "password"}
                placeholder="กรอกรหัสผ่านของท่าน"
                value={password}
                onChange={e => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                style={{ paddingRight: 46 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(s => !s)}
                style={{ position: "absolute", right: 14, top: 35, background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", fontSize: 16 }}
              >
                {showPass ? <EyeClosedIcon /> : <EyeOpenIcon />}
              </button>
            </div>

            <button
              type="submit"
              className="btn-primary"
              style={{ width: "100%", justifyContent: "center", fontSize: 15, borderRadius: 14, padding: "14px 20px" }}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="animate-spin" style={{ display: "inline-block", width: 18, height: 18, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%" }} />
                  <span style={{ marginLeft: 8 }}>กำลังตรวจสอบสิทธิ์...</span>
                </>
              ) : (
                <>
                  <UnlockIcon />
                  <span>เข้าสู่ระบบจัดการควบคุม</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Roles information panel */}
        <div className="animate-fade-in-delay-2" style={{ marginTop: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div style={{ background: "var(--rmutp-purple-pale)", border: "1px solid var(--border)", borderRadius: 12, padding: 14, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ color: "var(--rmutp-purple)", marginBottom: 8 }}><CrownIcon /></div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--rmutp-purple-dark)", marginBottom: 2 }}>Owner Level</div>
              <div style={{ fontSize: 10.5, color: "var(--text-secondary)", lineHeight: 1.4 }}>พิจารณาสิทธิ์ อนุมัติ และจัดการทั้งหมด</div>
            </div>
            <div style={{ background: "var(--edu-pink-pale)", border: "1px solid rgba(219,39,119,0.1)", borderRadius: 12, padding: 14, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ color: "var(--edu-pink)", marginBottom: 8 }}><DoorKeyIcon /></div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: "var(--edu-pink)", marginBottom: 2 }}>Door Operator</div>
              <div style={{ fontSize: 10.5, color: "var(--text-secondary)", lineHeight: 1.4 }}>ตรวจสอบความเรียบร้อย และสั่งเปิดประตู</div>
            </div>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 24 }}>
          <Link href="/" style={{ color: "var(--text-secondary)", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
            <ArrowLeftIcon />
            ย้อนกลับไปหน้าลงทะเบียน
          </Link>
        </div>
      </div>
    </div>
  );
}
