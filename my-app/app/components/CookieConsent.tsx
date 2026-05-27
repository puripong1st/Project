"use client";

// PDPA + PDPC Cookie Guideline 2565 — Granular Consent Banner v2.0
// - C01-C02: แยกประเภทคุกกี้ + ปุ่ม "ตั้งค่า"
// - C03: ปุ่มถอนความยินยอม (เปิดได้ตลอดจากหน้า Privacy หรือ event "rmutp_open_consent")
// - C04: บันทึก consent server-side ผ่าน POST /api/consent
// - C05: version + timestamp tracking

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

const CONSENT_VERSION = "2.0";
const STORAGE_KEY = "rmutp_cookie_consent_v2";

export type ConsentChoices = {
  necessary: true;        // บังคับ — ไม่ขอ consent
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
};

type ConsentRecord = {
  version: string;
  timestamp: string;
  choices: ConsentChoices;
  action: "granted" | "declined" | "updated" | "withdrawn";
};

function loadConsent(): ConsentRecord | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentRecord;
    if (parsed.version !== CONSENT_VERSION) return null; // version mismatch → re-ask
    return parsed;
  } catch {
    return null;
  }
}

function saveConsentLocal(record: ConsentRecord) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    /* ignore quota errors */
  }
}

async function saveConsentServer(choices: ConsentChoices, action: ConsentRecord["action"]) {
  try {
    await fetch("/api/consent", {
      method: action === "withdrawn" ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        functional: choices.functional,
        analytics: choices.analytics,
        marketing: choices.marketing,
        action,
      }),
      keepalive: true,
    });
  } catch {
    // Server save best-effort — local copy remains valid
  }
}

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [queryString, setQueryString] = useState("");
  const [choices, setChoices] = useState<ConsentChoices>({
    necessary: true,
    functional: true,
    analytics: false,
    marketing: false,
  });

  // Open settings modal from external trigger (e.g. footer button)
  const openSettings = useCallback(() => {
    const existing = loadConsent();
    if (existing) {
      setChoices(existing.choices);
    }
    setIsModalOpen(true);
    setIsVisible(true);
  }, []);

  useEffect(() => {
    setQueryString(window.location.search || "");

    const existing = loadConsent();
    if (!existing) {
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    } else {
      setChoices(existing.choices);
    }
  }, []);

  useEffect(() => {
    const handler = () => openSettings();
    window.addEventListener("rmutp_open_consent", handler);
    return () => window.removeEventListener("rmutp_open_consent", handler);
  }, [openSettings]);

  const persist = useCallback(
    (next: ConsentChoices, action: ConsentRecord["action"]) => {
      const record: ConsentRecord = {
        version: CONSENT_VERSION,
        timestamp: new Date().toISOString(),
        choices: next,
        action,
      };
      saveConsentLocal(record);
      saveConsentServer(next, action);
      window.dispatchEvent(
        new CustomEvent("rmutp_cookie_consent_changed", { detail: record })
      );
    },
    []
  );

  const handleAcceptAll = () => {
    const next: ConsentChoices = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
    };
    setChoices(next);
    persist(next, "granted");
    setIsVisible(false);
    setIsModalOpen(false);
  };

  const handleDeclineAll = () => {
    const next: ConsentChoices = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
    };
    setChoices(next);
    persist(next, "declined");
    setIsVisible(false);
    setIsModalOpen(false);
  };

  const handleSavePreferences = () => {
    const existing = loadConsent();
    const action: ConsentRecord["action"] = existing ? "updated" : "granted";
    persist(choices, action);
    setIsVisible(false);
    setIsModalOpen(false);
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
          border-radius: 12px;
          padding: 8px;
          color: #A78BFA;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 0 15px rgba(124, 58, 237, 0.2);
        }
        .rmutp-cookie-text-container { text-align: left; }
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
        .rmutp-cookie-link:hover { color: #DB2777; }
        .rmutp-cookie-link-alt {
          color: #A78BFA;
          text-decoration: underline;
          font-weight: 600;
          transition: color 0.2s ease;
        }
        .rmutp-cookie-link-alt:hover { color: #7C3AED; }
        .rmutp-cookie-buttons {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-shrink: 0;
        }
        .btn-cookie-decline, .btn-cookie-settings {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 10px;
          color: rgba(255, 255, 255, 0.85);
          padding: 8px 16px;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: 'Noto Sans Thai', sans-serif;
        }
        .btn-cookie-decline:hover, .btn-cookie-settings:hover {
          background: rgba(255, 255, 255, 0.15);
          color: #FFFFFF;
        }
        .btn-cookie-accept {
          background: linear-gradient(135deg, #7C3AED 0%, #DB2777 100%);
          border: none;
          border-radius: 10px;
          color: #FFFFFF;
          padding: 8px 20px;
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
        /* Modal overlay */
        .rmutp-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 10000;
          background: rgba(0, 0, 0, 0.65);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: fadeIn 0.25s ease both;
        }
        .rmutp-modal {
          background: linear-gradient(135deg, #1a1438 0%, #2a1f54 100%);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 20px;
          max-width: 560px;
          width: 100%;
          max-height: 88vh;
          overflow-y: auto;
          padding: 28px 28px 20px;
          color: #FFFFFF;
          font-family: 'Noto Sans Thai', sans-serif;
          box-shadow: 0 30px 70px rgba(0, 0, 0, 0.5);
          animation: scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .rmutp-modal h2 {
          font-size: 22px;
          font-weight: 800;
          margin: 0 0 6px;
        }
        .rmutp-modal .modal-subtitle {
          color: rgba(255, 255, 255, 0.55);
          font-size: 13px;
          margin-bottom: 20px;
        }
        .consent-category {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 14px 16px;
          margin-bottom: 12px;
          display: flex;
          align-items: flex-start;
          gap: 14px;
        }
        .consent-category-info { flex: 1; }
        .consent-category-name {
          font-size: 14px;
          font-weight: 700;
          margin: 0 0 4px;
          color: #F3E8FF;
        }
        .consent-category-desc {
          font-size: 12.5px;
          line-height: 1.55;
          color: rgba(255, 255, 255, 0.7);
        }
        .consent-category-required {
          font-size: 11px;
          color: #FCE7F3;
          background: rgba(219, 39, 119, 0.2);
          border: 1px solid rgba(219, 39, 119, 0.4);
          border-radius: 99px;
          padding: 2px 10px;
          font-weight: 700;
          align-self: flex-start;
        }
        /* Toggle switch */
        .toggle-switch {
          position: relative;
          width: 44px;
          height: 24px;
          flex-shrink: 0;
        }
        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .toggle-slider {
          position: absolute;
          inset: 0;
          background: rgba(255, 255, 255, 0.15);
          border-radius: 24px;
          cursor: pointer;
          transition: 0.25s;
        }
        .toggle-slider:before {
          content: "";
          position: absolute;
          height: 18px;
          width: 18px;
          left: 3px;
          top: 3px;
          background: #FFFFFF;
          border-radius: 50%;
          transition: 0.25s;
        }
        .toggle-switch input:checked + .toggle-slider {
          background: linear-gradient(135deg, #7C3AED, #DB2777);
        }
        .toggle-switch input:checked + .toggle-slider:before {
          transform: translateX(20px);
        }
        .toggle-switch input:disabled + .toggle-slider {
          background: rgba(124, 58, 237, 0.5);
          cursor: not-allowed;
        }
        .modal-footer {
          display: flex;
          gap: 10px;
          margin-top: 18px;
          flex-wrap: wrap;
        }
        .modal-footer .btn-cookie-accept,
        .modal-footer .btn-cookie-decline {
          flex: 1;
          min-width: 130px;
        }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.92) }
          to { opacity: 1; transform: scale(1) }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px) }
          to { opacity: 1; transform: translateY(0) }
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
            flex-wrap: wrap;
          }
        }
        @media (max-width: 480px) {
          .rmutp-cookie-content { align-items: flex-start }
          .rmutp-cookie-icon { display: none }
          .rmutp-cookie-buttons {
            width: 100%;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }
          .btn-cookie-decline, .btn-cookie-accept, .btn-cookie-settings {
            width: 100%;
            text-align: center;
            padding: 10px;
          }
        }
      `}</style>

      {!isModalOpen && (
        <div className="rmutp-cookie-banner" role="region" aria-label="แถบความยินยอมคุกกี้">
          <div className="rmutp-cookie-content">
            <div className="rmutp-cookie-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>

            <div className="rmutp-cookie-text-container">
              <h4 className="rmutp-cookie-title">นโยบายความเป็นส่วนตัวและคุกกี้ 🍪</h4>
              <p className="rmutp-cookie-desc">
                ระบบ RMUTP ACCS ใช้คุกกี้/Web Storage เพื่อระบุตัวตน จดจำการตั้งค่า และจัดเก็บประวัติ Log การเข้าออกตาม พ.ร.บ. คอมพิวเตอร์ฯ 2560 และ PDPA 2562 ท่านสามารถเลือกประเภทคุกกี้ที่ยินยอมและถอนความยินยอมได้ทุกเมื่อ ดูรายละเอียดที่{" "}
                <Link href={`/privacy${queryString}`} className="rmutp-cookie-link">นโยบายความเป็นส่วนตัว</Link> และ{" "}
                <Link href={`/terms${queryString}`} className="rmutp-cookie-link-alt">ข้อกำหนดการใช้งาน</Link>
              </p>
            </div>
          </div>

          <div className="rmutp-cookie-buttons">
            <button
              onClick={() => setIsModalOpen(true)}
              className="btn-cookie-settings"
              aria-label="ตั้งค่าคุกกี้"
            >
              ⚙️ ตั้งค่า
            </button>
            <button onClick={handleDeclineAll} className="btn-cookie-decline">
              ปฏิเสธทั้งหมด
            </button>
            <button onClick={handleAcceptAll} className="btn-cookie-accept">
              ยอมรับทั้งหมด
            </button>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div
          className="rmutp-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="consent-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div className="rmutp-modal">
            <h2 id="consent-modal-title">⚙️ ตั้งค่าความยินยอมคุกกี้</h2>
            <p className="modal-subtitle">
              เวอร์ชัน {CONSENT_VERSION} · เลือกประเภทคุกกี้ที่ท่านยินยอมให้ระบบใช้งาน
            </p>

            <div className="consent-category">
              <div className="consent-category-info">
                <p className="consent-category-name">🔒 จำเป็น (Necessary)</p>
                <p className="consent-category-desc">
                  คุกกี้ที่จำเป็นต่อการทำงานพื้นฐานของระบบ เช่น JWT session ของแอดมิน, การยืนยัน QR Token, การบันทึก Log ตาม พ.ร.บ.คอมฯ มาตรา 26 — ไม่สามารถปิดได้
                </p>
              </div>
              <span className="consent-category-required">บังคับ</span>
            </div>

            <div className="consent-category">
              <div className="consent-category-info">
                <p className="consent-category-name">⚡ ฟังก์ชันการใช้งาน (Functional)</p>
                <p className="consent-category-desc">
                  คุกกี้/localStorage สำหรับจดจำการตั้งค่าผู้ใช้ เช่น Auto-fill ฟอร์มลงทะเบียน (rmutp_form_draft), การจดจำห้องที่เคยเข้า, การจดจำความยินยอมนี้
                </p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={choices.functional}
                  onChange={(e) =>
                    setChoices({ ...choices, functional: e.target.checked })
                  }
                  aria-label="ยินยอมคุกกี้ฟังก์ชันการใช้งาน"
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="consent-category">
              <div className="consent-category-info">
                <p className="consent-category-name">📊 วิเคราะห์ (Analytics)</p>
                <p className="consent-category-desc">
                  คุกกี้สำหรับเก็บสถิติการใช้งานระบบเพื่อปรับปรุงประสิทธิภาพ (เช่น Vercel Analytics) — ระบบจะไม่ระบุตัวตนของผู้ใช้ในข้อมูลนี้
                </p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={choices.analytics}
                  onChange={(e) =>
                    setChoices({ ...choices, analytics: e.target.checked })
                  }
                  aria-label="ยินยอมคุกกี้วิเคราะห์"
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="consent-category">
              <div className="consent-category-info">
                <p className="consent-category-name">📢 การตลาด (Marketing)</p>
                <p className="consent-category-desc">
                  ปัจจุบันระบบไม่ใช้คุกกี้ประเภทการตลาด เปิดไว้เผื่ออนาคต (เช่น ส่งประกาศกิจกรรมคณะ)
                </p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={choices.marketing}
                  onChange={(e) =>
                    setChoices({ ...choices, marketing: e.target.checked })
                  }
                  aria-label="ยินยอมคุกกี้การตลาด"
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="modal-footer">
              <button onClick={handleDeclineAll} className="btn-cookie-decline">
                ปฏิเสธทั้งหมด
              </button>
              <button onClick={handleSavePreferences} className="btn-cookie-decline">
                บันทึกการตั้งค่า
              </button>
              <button onClick={handleAcceptAll} className="btn-cookie-accept">
                ยอมรับทั้งหมด
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Helper สำหรับเรียกจากหน้าอื่นเพื่อเปิด Modal (เช่นปุ่ม "จัดการความยินยอม" ใน Privacy)
export function openConsentSettings() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("rmutp_open_consent"));
  }
}
