"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if the user has already consented
    const consent = localStorage.getItem("rmutp_cookie_consent");
    if (!consent) {
      // Small delay for clean entrance animation
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("rmutp_cookie_consent", "true");
    window.dispatchEvent(new Event("rmutp_cookie_consent_changed"));
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem("rmutp_cookie_consent", "false");
    window.dispatchEvent(new Event("rmutp_cookie_consent_changed"));
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: "24px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "calc(100% - 48px)",
        maxWidth: "560px",
        zIndex: 9999,
        background: "rgba(15, 12, 41, 0.8)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: "1px solid rgba(255, 255, 255, 0.15)",
        borderRadius: "20px",
        padding: "24px",
        boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        animation: "fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both",
      }}
    >
      <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
        {/* Glowing Shield Icon */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(219, 39, 119, 0.2))",
            border: "1px solid rgba(167, 139, 250, 0.4)",
            borderRadius: "12px",
            padding: "10px",
            color: "#A78BFA",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            boxShadow: "0 0 15px rgba(124, 58, 237, 0.2)",
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>

        {/* Text */}
        <div style={{ flex: 1 }}>
          <h4
            style={{
              color: "#FFFFFF",
              fontSize: "16px",
              fontWeight: 700,
              marginBottom: "6px",
              fontFamily: "'Noto Sans Thai', sans-serif",
            }}
          >
            นโยบายความเป็นส่วนตัวและคุกกี้ 🍪
          </h4>
          <p
            style={{
              color: "rgba(255, 255, 255, 0.7)",
              fontSize: "13px",
              lineHeight: "1.6",
              fontWeight: 400,
              fontFamily: "'Noto Sans Thai', sans-serif",
            }}
          >
            ระบบควบคุมประตูห้องปฏิบัติการ RMUTP ACCS ใช้คุกกี้เพื่อวัตถุประสงค์ในการระบุตัวตน เซสชันความปลอดภัย และการเก็บรักษา Log เข้าออกตาม พ.ร.บ. คอมพิวเตอร์ฯ 2560 และกฎหมายคุ้มครองข้อมูลส่วนบุคคล (PDPA) ของไทย ท่านสามารถอ่านรายละเอียดได้ที่{" "}
            <Link
              href="/privacy"
              style={{
                color: "#F472B6",
                textDecoration: "underline",
                fontWeight: 600,
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#DB2777")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#F472B6")}
            >
              นโยบายความเป็นส่วนตัว
            </Link>{" "}
            และ{" "}
            <Link
              href="/terms"
              style={{
                color: "#A78BFA",
                textDecoration: "underline",
                fontWeight: 600,
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#7C3AED")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#A78BFA")}
            >
              ข้อกำหนดการใช้งาน
            </Link>
          </p>
        </div>
      </div>

      {/* Buttons */}
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "12px",
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          paddingTop: "16px",
        }}
      >
        <button
          onClick={handleDecline}
          style={{
            background: "rgba(255, 255, 255, 0.08)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            borderRadius: "10px",
            color: "rgba(255, 255, 255, 0.8)",
            padding: "8px 18px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s ease",
            fontFamily: "'Noto Sans Thai', sans-serif",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.15)";
            e.currentTarget.style.color = "#FFFFFF";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
            e.currentTarget.style.color = "rgba(255, 255, 255, 0.8)";
          }}
        >
          ปฏิเสธ
        </button>
        <button
          onClick={handleAccept}
          style={{
            background: "linear-gradient(135deg, #7C3AED 0%, #DB2777 100%)",
            border: "none",
            borderRadius: "10px",
            color: "#FFFFFF",
            padding: "8px 22px",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
            boxShadow: "0 4px 15px rgba(124, 58, 237, 0.3)",
            fontFamily: "'Noto Sans Thai', sans-serif",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = "0 6px 20px rgba(124, 58, 237, 0.45)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 15px rgba(124, 58, 237, 0.3)";
          }}
        >
          ยอมรับทั้งหมด
        </button>
      </div>
    </div>
  );
}
