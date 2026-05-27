"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [queryString, setQueryString] = useState("");

  useEffect(() => {
    // Save current query string (preserving token and room parameters)
    setQueryString(window.location.search || "");

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
    <>
      <style>{`
        .rmutp-cookie-banner {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          width: 100%;
          z-index: 9999;
          background: rgba(15, 12, 41, 0.85);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border-top: 1px solid rgba(255, 255, 255, 0.15);
          box-shadow: 0 -10px 40px rgba(0, 0, 0, 0.4);
          padding: 14px 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 32px;
          animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .rmutp-cookie-content {
          display: flex;
          align-items: center;
          gap: 16px;
          flex: 1;
        }
        .rmutp-cookie-icon {
          background: linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(219, 39, 119, 0.2));
          border: 1px solid rgba(167, 139, 250, 0.4);
          borderRadius: 12px;
          padding: 8px;
          color: #A78BFA;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 0 15px rgba(124, 58, 237, 0.2);
        }
        .rmutp-cookie-text-container {
          text-align: left;
        }
        .rmutp-cookie-title {
          color: #FFFFFF;
          font-size: 14.5px;
          font-weight: 700;
          margin-bottom: 2px;
          font-family: 'Noto Sans Thai', sans-serif;
        }
        .rmutp-cookie-desc {
          color: rgba(255, 255, 255, 0.75);
          font-size: 12.5px;
          line-height: 1.5;
          font-weight: 400;
          font-family: 'Noto Sans Thai', sans-serif;
        }
        .rmutp-cookie-link {
          color: #F472B6;
          text-decoration: underline;
          font-weight: 600;
          transition: color 0.2s ease;
        }
        .rmutp-cookie-link:hover {
          color: #DB2777;
        }
        .rmutp-cookie-link-alt {
          color: #A78BFA;
          text-decoration: underline;
          font-weight: 600;
          transition: color 0.2s ease;
        }
        .rmutp-cookie-link-alt:hover {
          color: #7C3AED;
        }
        .rmutp-cookie-buttons {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }
        .btn-cookie-decline {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 10px;
          color: rgba(255, 255, 255, 0.85);
          padding: 8px 18px;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: 'Noto Sans Thai', sans-serif;
        }
        .btn-cookie-decline:hover {
          background: rgba(255, 255, 255, 0.15);
          color: #FFFFFF;
        }
        .btn-cookie-accept {
          background: linear-gradient(135deg, #7C3AED 0%, #DB2777 100%);
          border: none;
          border-radius: 10px;
          color: #FFFFFF;
          padding: 8px 22px;
          font-size: 12.5px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 4px 15px rgba(124, 58, 237, 0.3);
          font-family: 'Noto Sans Thai', sans-serif;
        }
        .btn-cookie-accept:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(124, 58, 237, 0.45);
        }
        @media (max-width: 991px) {
          .rmutp-cookie-banner {
            flex-direction: column;
            align-items: stretch;
            gap: 16px;
            padding: 16px 24px;
          }
          .rmutp-cookie-buttons {
            justify-content: flex-end;
          }
        }
        @media (max-width: 480px) {
          .rmutp-cookie-content {
            align-items: flex-start;
          }
          .rmutp-cookie-icon {
            display: none;
          }
          .rmutp-cookie-buttons {
            width: 100%;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }
          .btn-cookie-decline, .btn-cookie-accept {
            width: 100%;
            text-align: center;
            padding: 10px;
          }
        }
      `}</style>

      <div className="rmutp-cookie-banner" role="status" aria-live="polite">
        <div className="rmutp-cookie-content">
          <div className="rmutp-cookie-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>

          <div className="rmutp-cookie-text-container">
            <h4 className="rmutp-cookie-title">นโยบายความเป็นส่วนตัวและคุกกี้ 🍪</h4>
            <p className="rmutp-cookie-desc">
              ระบบควบคุมประตูห้องปฏิบัติการ RMUTP ACCS ใช้คุกกี้เพื่อระบุตัวตนและจัดเก็บประวัติ Log เข้าออกตาม พ.ร.บ. คอมพิวเตอร์ฯ 2560 และ PDPA ของไทย ท่านสามารถศึกษาได้ที่{" "}
              <Link href={`/privacy${queryString}`} className="rmutp-cookie-link">นโยบายความเป็นส่วนตัว</Link> และ <Link href={`/terms${queryString}`} className="rmutp-cookie-link-alt">ข้อกำหนดการใช้งาน</Link>
            </p>
          </div>
        </div>

        <div className="rmutp-cookie-buttons">
          <button onClick={handleDecline} className="btn-cookie-decline">ปฏิเสธ</button>
          <button onClick={handleAccept} className="btn-cookie-accept">ยอมรับทั้งหมด</button>
        </div>
      </div>
    </>
  );
}
