"use client";
// PDPA-compliant Privacy Policy v2.0
// ครอบคลุม PDPA ม.23 ครบ 7 รายการ + สิทธิเจ้าของข้อมูล 8 ข้อ (ม.19, 30-36, 73)
import { useState, useEffect } from "react";
import Link from "next/link";
import { openConsentSettings } from "../components/CookieConsent";
import { IconAlert, IconLightbulb, IconCog } from "../components/Icons";

const POLICY_VERSION = "2.0";
const EFFECTIVE_DATE = "27 พฤษภาคม 2569";

const sectionHeading: React.CSSProperties = {
  color: "#FCE7F3",
  fontSize: "18px",
  fontWeight: 700,
  marginBottom: "10px",
};

const subHeading: React.CSSProperties = {
  color: "#F3E8FF",
  fontSize: "15px",
  fontWeight: 700,
  marginTop: "12px",
  marginBottom: "6px",
};

const tableWrapStyle: React.CSSProperties = {
  width: "100%",
  overflowX: "auto",
  WebkitOverflowScrolling: "touch",
  borderRadius: "10px",
  border: "1px solid rgba(255,255,255,0.1)",
  marginTop: "8px",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
  fontSize: "13.5px",
  minWidth: "480px",
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "10px 12px",
  background: "rgba(124, 58, 237, 0.22)",
  borderBottom: "1px solid rgba(255,255,255,0.12)",
  fontWeight: 700,
  color: "#FFFFFF",
  whiteSpace: "nowrap",
};

const tdStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderBottom: "1px solid rgba(255,255,255,0.06)",
  color: "rgba(255, 255, 255, 0.82)",
  verticalAlign: "top",
  lineHeight: "1.6",
};

export default function PrivacyPage() {
  const [queryString, setQueryString] = useState("");
  useEffect(() => {
    // อ่าน query string หลัง mount เพื่อความปลอดภัยตอน SSR (window ไม่มีบนเซิร์ฟเวอร์)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQueryString(window.location.search || "");
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
        fontFamily: "'Noto Sans Thai', 'Inter', sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute", top: "-10%", left: "-5%",
          width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(124,58,237,0.3) 0%, transparent 70%)",
          filter: "blur(50px)", pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute", bottom: "-10%", right: "-5%",
          width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(219,39,119,0.25) 0%, transparent 70%)",
          filter: "blur(50px)", pointerEvents: "none",
        }}
      />

      <div
        className="animate-fade-in"
        style={{
          maxWidth: "900px",
          width: "100%",
          zIndex: 10,
          background: "rgba(255, 255, 255, 0.04)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: "24px",
          padding: "40px",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          boxShadow: "0 30px 70px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
          color: "#FFFFFF",
        }}
      >
        {/* Back link */}
        <div style={{ marginBottom: "32px" }}>
          <Link
            href={`/${queryString}`}
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              color: "rgba(255,255,255,0.6)", textDecoration: "none",
              fontSize: "14px", fontWeight: 600,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            ย้อนกลับหน้าลงทะเบียน
          </Link>
        </div>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              background: "rgba(219, 39, 119, 0.15)",
              border: "1px solid rgba(219, 39, 119, 0.35)",
              borderRadius: "99px", padding: "6px 16px",
              color: "#F472B6", fontSize: "12px", fontWeight: 700,
              letterSpacing: "0.5px", textTransform: "uppercase",
              marginBottom: "16px",
            }}
          >
            PDPA Compliance · v{POLICY_VERSION}
          </div>
          <h1
            style={{
              fontSize: "32px", fontWeight: 800, lineHeight: "1.3",
              background: "linear-gradient(to right, #FFFFFF, #FCE7F3)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "-0.5px",
            }}
          >
            นโยบายความเป็นส่วนตัวของระบบควบคุมห้องเรียน
          </h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", marginTop: "8px" }}>
            (Official Privacy Policy) · เริ่มมีผลบังคับใช้ {EFFECTIVE_DATE}
          </p>
        </div>

        {/* Body */}
        <div
          style={{
            display: "flex", flexDirection: "column", gap: "26px",
            fontSize: "14.5px", lineHeight: "1.8",
            color: "rgba(255,255,255,0.82)",
          }}
        >
          <p>
            นโยบายความเป็นส่วนตัวฉบับนี้จัดทำขึ้นตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA) ม.23
            เพื่อชี้แจงวิธีที่ระบบ <strong style={{ color: "#FFFFFF" }}>SmartAccess</strong>
            (ระบบควบคุมการเข้าออกห้องปฏิบัติการ) เก็บรวบรวม ใช้ และเปิดเผยข้อมูลส่วนบุคคล (PII)
            ของนักศึกษา อาจารย์ และบุคลากรของคณะครุศาสตร์อุตสาหกรรม มหาวิทยาลัยเทคโนโลยีราชมงคลพระนคร
          </p>

          <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.08)" }} />

          {/* 0. Data Controller */}
          <div>
            <h3 style={sectionHeading}>0. ผู้ควบคุมข้อมูลส่วนบุคคล (Data Controller)</h3>
            <div style={tableWrapStyle}><table style={tableStyle}>
              <tbody>
                <tr><td style={tdStyle}><strong>ชื่อ</strong></td><td style={tdStyle}>คณะครุศาสตร์อุตสาหกรรม มหาวิทยาลัยเทคโนโลยีราชมงคลพระนคร</td></tr>
                <tr><td style={tdStyle}><strong>ที่อยู่</strong></td><td style={tdStyle}>1381 ถนนประชาราษฎร์ 1 แขวงวงศ์สว่าง เขตบางซื่อ กรุงเทพมหานคร 10800</td></tr>
                <tr><td style={tdStyle}><strong>โทรศัพท์</strong></td><td style={tdStyle}>02-836-3000</td></tr>
                <tr><td style={tdStyle}><strong>อีเมลทั่วไป</strong></td><td style={tdStyle}>info@rmutp.ac.th</td></tr>
                <tr><td style={tdStyle}><strong>เจ้าหน้าที่คุ้มครองข้อมูล (DPO)</strong></td><td style={tdStyle}>dpo@rmutp.ac.th · 02-836-3000 ต่อ DPO</td></tr>
              </tbody>
            </table></div>
          </div>

          {/* 1. Lawful Basis */}
          <div>
            <h3 style={sectionHeading}>1. ฐานทางกฎหมายในการประมวลผล (Lawful Basis)</h3>
            <p>
              ระบบประมวลผลข้อมูลส่วนบุคคลของท่านโดยอาศัยฐานทางกฎหมายดังนี้:
            </p>
            <ul style={{ paddingLeft: "20px", marginTop: "8px" }}>
              <li><strong>ฐานประโยชน์โดยชอบด้วยกฎหมาย (ม.24(5)):</strong> เพื่อความปลอดภัยของอาคารและทรัพย์สินภายในห้องปฏิบัติการ</li>
              <li><strong>ฐานหน้าที่ตามกฎหมาย (ม.24(6)):</strong> เพื่อปฏิบัติตาม พ.ร.บ. ว่าด้วยการกระทำความผิดเกี่ยวกับคอมพิวเตอร์ พ.ศ. 2560 มาตรา 26 (เก็บข้อมูลจราจรคอมพิวเตอร์ไม่น้อยกว่า 90 วัน)</li>
              <li><strong>ฐานความยินยอม (ม.24(1)):</strong> สำหรับคุกกี้ประเภทฟังก์ชัน วิเคราะห์ และการตลาด (ดูแบนเนอร์คุกกี้ด้านล่าง)</li>
            </ul>
          </div>

          {/* 2. Types of Data */}
          <div>
            <h3 style={sectionHeading}>2. ประเภทข้อมูลส่วนบุคคลที่จัดเก็บ</h3>
            <div style={tableWrapStyle}><table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>หมวด</th>
                  <th style={thStyle}>รายการข้อมูล</th>
                  <th style={thStyle}>วัตถุประสงค์</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={tdStyle}>ข้อมูลระบุตัวตน</td>
                  <td style={tdStyle}>คำนำหน้า, ชื่อจริง, นามสกุล, รหัสนักศึกษา/พนักงาน</td>
                  <td style={tdStyle}>ยืนยันตัวตนเพื่ออนุญาตเข้าห้อง</td>
                </tr>
                <tr>
                  <td style={tdStyle}>ข้อมูลสังกัด</td>
                  <td style={tdStyle}>คณะ, สาขา, ชั้นปี, ห้องเรียนที่ขอเข้าใช้</td>
                  <td style={tdStyle}>ตรวจสอบสิทธิ์ระดับห้อง (Allowed Rooms)</td>
                </tr>
                <tr>
                  <td style={tdStyle}>ข้อมูลจราจร (Traffic Data)</td>
                  <td style={tdStyle}>IP Address, User-Agent, เวลา, ห้องที่เข้า, ผลการเปิดประตู</td>
                  <td style={tdStyle}>พ.ร.บ. คอมฯ ม.26 + ป้องกันโจรกรรม</td>
                </tr>
                <tr>
                  <td style={tdStyle}>ข้อมูลความยินยอม</td>
                  <td style={tdStyle}>SHA-256 hash ของ IP, เวอร์ชันนโยบาย, ตัวเลือกคุกกี้, timestamp</td>
                  <td style={tdStyle}>หลักฐานการให้/ถอน consent ตาม PDPA ม.19</td>
                </tr>
              </tbody>
            </table></div>
            <p style={{ marginTop: "10px", fontSize: "13px", color: "rgba(255,255,255,0.65)", display: "flex", gap: 8, alignItems: "flex-start" }}>
              <span style={{ color: "#F59E0B", flexShrink: 0, marginTop: 2 }}><IconAlert size={14} /></span>
              <span>ระบบไม่จัดเก็บข้อมูลอ่อนไหว (Sensitive Data) ตาม PDPA ม.26 เช่น เชื้อชาติ ศาสนา ข้อมูลสุขภาพ ข้อมูลชีวภาพ (Biometric) หรือประวัติอาชญากรรม</span>
            </p>
          </div>

          {/* 3. Purposes */}
          <div>
            <h3 style={sectionHeading}>3. วัตถุประสงค์ในการประมวลผล</h3>
            <p>
              ระบบใช้ข้อมูลของท่านเพื่อจุดประสงค์ดังต่อไปนี้เท่านั้น:
            </p>
            <ul style={{ paddingLeft: "20px", marginTop: "8px" }}>
              <li>จับคู่ยืนยันตัวตนเพื่ออนุญาตปลดล็อกประตูห้องปฏิบัติการ</li>
              <li>จัดทำประวัติการเข้าออก (access_logs) เพื่อความปลอดภัยและการสืบสวนเหตุ</li>
              <li>แจ้งเตือนเหตุการณ์สำคัญแก่เจ้าหน้าที่ผู้ดูแลผ่าน Discord Webhook</li>
              <li>ปรับปรุงประสิทธิภาพและความปลอดภัยของระบบ (ในกรณีที่ท่านยินยอมคุกกี้วิเคราะห์)</li>
            </ul>
          </div>

          {/* 4. Recipients */}
          <div>
            <h3 style={sectionHeading}>4. ผู้รับข้อมูลและผู้ประมวลผลข้อมูล (Recipients & Sub-Processors)</h3>
            <div style={tableWrapStyle}><table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>ผู้รับข้อมูล</th>
                  <th style={thStyle}>ประเภท</th>
                  <th style={thStyle}>ที่ตั้ง</th>
                  <th style={thStyle}>ข้อมูลที่ได้รับ</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={tdStyle}>แอดมินSmartAccess</td>
                  <td style={tdStyle}>Data User ภายใน</td>
                  <td style={tdStyle}>ประเทศไทย</td>
                  <td style={tdStyle}>ข้อมูลทั้งหมด (จำกัดสิทธิ์ตาม role)</td>
                </tr>
                <tr>
                  <td style={tdStyle}>Supabase Inc.</td>
                  <td style={tdStyle}>Sub-Processor (Database hosting)</td>
                  <td style={tdStyle}>AWS Singapore (ap-southeast-1)</td>
                  <td style={tdStyle}>ฐานข้อมูลทั้งหมด (เข้ารหัส at-rest AES-256)</td>
                </tr>
                <tr>
                  <td style={tdStyle}>Vercel Inc.</td>
                  <td style={tdStyle}>Sub-Processor (Web hosting)</td>
                  <td style={tdStyle}>Edge network (Singapore + global)</td>
                  <td style={tdStyle}>HTTP request metadata (IP, headers)</td>
                </tr>
                <tr>
                  <td style={tdStyle}>Discord Inc.</td>
                  <td style={tdStyle}>Third-Party (Notification)</td>
                  <td style={tdStyle}>สหรัฐอเมริกา</td>
                  <td style={tdStyle}>เฉพาะข้อความแจ้งเตือนเหตุการณ์ (ชื่อ-รหัส masked, ห้อง, เวลา)</td>
                </tr>
              </tbody>
            </table></div>
          </div>

          {/* 5. Cross-Border Transfer */}
          <div>
            <h3 style={sectionHeading}>5. การส่งข้อมูลออกนอกราชอาณาจักร (Cross-Border Transfer)</h3>
            <p>
              ตาม PDPA มาตรา 28-29 ระบบมีการส่งข้อมูลออกไปยังต่างประเทศโดยมีมาตรการคุ้มครองดังนี้:
            </p>
            <ul style={{ paddingLeft: "20px", marginTop: "8px" }}>
              <li><strong>Supabase (Singapore):</strong> ใช้ Standard Contractual Clauses (SCC) + SOC 2 Type II certification, encryption at-rest (AES-256), in-transit (TLS 1.3)</li>
              <li><strong>Vercel (Global Edge):</strong> ISO 27001 + SOC 2 Type II, TLS 1.3 ทุกการเชื่อมต่อ</li>
              <li><strong>Discord (US):</strong> Privacy Shield successor framework (Data Privacy Framework), ส่งเฉพาะข้อมูลแจ้งเตือน (masked PII)</li>
            </ul>
          </div>

          {/* 6. Retention */}
          <div>
            <h3 style={sectionHeading}>6. ระยะเวลาเก็บข้อมูล (Data Retention)</h3>
            <div style={tableWrapStyle}><table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>ประเภทข้อมูล</th>
                  <th style={thStyle}>ระยะเวลา</th>
                  <th style={thStyle}>เหตุผล</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={tdStyle}>access_logs (ประวัติเข้าออก)</td>
                  <td style={tdStyle}>ไม่น้อยกว่า 90 วัน สูงสุด 1 ปีการศึกษา</td>
                  <td style={tdStyle}>พ.ร.บ.คอม ม.26 ขั้นต่ำ + นโยบายภายใน</td>
                </tr>
                <tr>
                  <td style={tdStyle}>students (ทะเบียนนักศึกษา)</td>
                  <td style={tdStyle}>จนสิ้นปีการศึกษา + 1 ปี</td>
                  <td style={tdStyle}>เพื่ออ้างอิงผลการเรียนและการสอบสวน</td>
                </tr>
                <tr>
                  <td style={tdStyle}>dynamic_qr_tokens</td>
                  <td style={tdStyle}>24 ชั่วโมง</td>
                  <td style={tdStyle}>ลบอัตโนมัติเมื่อ consume หรือหมดอายุ</td>
                </tr>
                <tr>
                  <td style={tdStyle}>consent_records</td>
                  <td style={tdStyle}>3 ปี</td>
                  <td style={tdStyle}>หลักฐาน PDPA ม.19 (พิสูจน์ consent)</td>
                </tr>
                <tr>
                  <td style={tdStyle}>rate_limits</td>
                  <td style={tdStyle}>5 นาที (auto-expire)</td>
                  <td style={tdStyle}>ป้องกันการโจมตี brute-force</td>
                </tr>
              </tbody>
            </table></div>
            <p style={{ marginTop: "10px" }}>
              เมื่อพ้นกำหนดข้างต้น ระบบจะทำลายข้อมูลโดยอัตโนมัติ (Data Pruning Cron Job)
            </p>
          </div>

          {/* 7. Cookies & Storage */}
          <div>
            <h3 style={sectionHeading}>7. คุกกี้และ Web Storage ที่ระบบใช้</h3>
            <div style={tableWrapStyle}><table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>ชื่อ</th>
                  <th style={thStyle}>ประเภท</th>
                  <th style={thStyle}>หมวด</th>
                  <th style={thStyle}>วัตถุประสงค์</th>
                  <th style={thStyle}>อายุ</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={tdStyle}><code>admin_token</code></td>
                  <td style={tdStyle}>HttpOnly Cookie</td>
                  <td style={tdStyle}>จำเป็น</td>
                  <td style={tdStyle}>JWT session ของแอดมิน</td>
                  <td style={tdStyle}>8 ชั่วโมง</td>
                </tr>
                <tr>
                  <td style={tdStyle}><code>smartaccess_cookie_consent_v2</code></td>
                  <td style={tdStyle}>localStorage</td>
                  <td style={tdStyle}>ฟังก์ชัน</td>
                  <td style={tdStyle}>จดจำตัวเลือกความยินยอม</td>
                  <td style={tdStyle}>ถาวรจนผู้ใช้ลบ</td>
                </tr>
                <tr>
                  <td style={tdStyle}><code>smartaccess_form_draft</code></td>
                  <td style={tdStyle}>localStorage</td>
                  <td style={tdStyle}>ฟังก์ชัน</td>
                  <td style={tdStyle}>Auto-fill ฟอร์มลงทะเบียน</td>
                  <td style={tdStyle}>7 วัน</td>
                </tr>
                <tr>
                  <td style={tdStyle}><code>smartaccess_last_room</code></td>
                  <td style={tdStyle}>localStorage</td>
                  <td style={tdStyle}>ฟังก์ชัน</td>
                  <td style={tdStyle}>จดจำห้องที่เคยเข้า</td>
                  <td style={tdStyle}>30 วัน</td>
                </tr>
              </tbody>
            </table></div>
            <div style={{ marginTop: "12px" }}>
              <button
                onClick={openConsentSettings}
                style={{
                  background: "linear-gradient(135deg, #7C3AED, #DB2777)",
                  border: "none",
                  borderRadius: "10px",
                  color: "#FFFFFF",
                  padding: "10px 20px",
                  fontSize: "13.5px",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "'Noto Sans Thai', sans-serif",
                  boxShadow: "0 4px 15px rgba(124, 58, 237, 0.3)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <IconCog size={16} />
                <span>จัดการความยินยอมคุกกี้ของฉัน</span>
              </button>
            </div>
          </div>

          {/* 8. Rights */}
          <div>
            <h3 style={sectionHeading}>8. สิทธิของเจ้าของข้อมูลส่วนบุคคล (Data Subject Rights)</h3>
            <p>
              ท่านมีสิทธิตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 ทั้ง 8 ข้อดังต่อไปนี้:
            </p>
            <div style={tableWrapStyle}><table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>มาตรา</th>
                  <th style={thStyle}>สิทธิ</th>
                  <th style={thStyle}>ช่องทางใช้สิทธิ</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={tdStyle}>ม.19 วรรค 5</td>
                  <td style={tdStyle}><strong>สิทธิเพิกถอนความยินยอม</strong> (Right to Withdraw Consent)</td>
                  <td style={tdStyle}>กดปุ่ม &quot;จัดการความยินยอม&quot; ด้านบน หรืออีเมล DPO</td>
                </tr>
                <tr>
                  <td style={tdStyle}>ม.30</td>
                  <td style={tdStyle}><strong>สิทธิเข้าถึงและขอสำเนาข้อมูล</strong> (Right to Access)</td>
                  <td style={tdStyle}>อีเมล dpo@rmutp.ac.th — ตอบสนองภายใน 30 วัน</td>
                </tr>
                <tr>
                  <td style={tdStyle}>ม.31</td>
                  <td style={tdStyle}><strong>สิทธิให้โอนย้ายข้อมูล</strong> (Right to Data Portability)</td>
                  <td style={tdStyle}>อีเมล DPO เพื่อขอ export ในรูปแบบ JSON/CSV</td>
                </tr>
                <tr>
                  <td style={tdStyle}>ม.32</td>
                  <td style={tdStyle}><strong>สิทธิคัดค้านการประมวลผล</strong> (Right to Object)</td>
                  <td style={tdStyle}>อีเมล DPO พร้อมเหตุผล</td>
                </tr>
                <tr>
                  <td style={tdStyle}>ม.33</td>
                  <td style={tdStyle}><strong>สิทธิให้ลบข้อมูล</strong> (Right to Erasure / Right to be Forgotten)</td>
                  <td style={tdStyle}>อีเมล DPO — ดำเนินการภายใน 30 วัน (ยกเว้นข้อมูลที่ต้องเก็บตามกฎหมาย)</td>
                </tr>
                <tr>
                  <td style={tdStyle}>ม.34</td>
                  <td style={tdStyle}><strong>สิทธิให้ระงับการใช้ข้อมูล</strong> (Right to Restrict)</td>
                  <td style={tdStyle}>อีเมล DPO ระหว่างการตรวจสอบความถูกต้อง</td>
                </tr>
                <tr>
                  <td style={tdStyle}>ม.36</td>
                  <td style={tdStyle}><strong>สิทธิให้แก้ไขข้อมูลให้ถูกต้อง</strong> (Right to Rectification)</td>
                  <td style={tdStyle}>แจ้ง หรืออีเมล DPO</td>
                </tr>
                <tr>
                  <td style={tdStyle}>ม.73</td>
                  <td style={tdStyle}><strong>สิทธิร้องเรียนต่อสำนักงาน สคส.</strong> (PDPC)</td>
                  <td style={tdStyle}>หากท่านเห็นว่าระบบไม่ปฏิบัติตามกฎหมาย: <a href="https://www.pdpc.or.th" target="_blank" rel="noopener noreferrer" style={{ color: "#F472B6" }}>pdpc.or.th</a> หรือ pdpc@mdes.go.th</td>
                </tr>
              </tbody>
            </table></div>
            <p style={{ marginTop: "12px", fontSize: "13px", color: "rgba(255,255,255,0.65)", display: "flex", gap: 8, alignItems: "flex-start" }}>
              <span style={{ color: "#A78BFA", flexShrink: 0, marginTop: 2 }}><IconLightbulb size={14} /></span>
              <span>การใช้สิทธิข้างต้นไม่มีค่าใช้จ่าย เว้นแต่กรณีการขอสำเนาเอกสารพิมพ์ออก</span>
            </p>
          </div>

          {/* 9. Security */}
          <div>
            <h3 style={sectionHeading}>9. มาตรการรักษาความมั่นคงปลอดภัย (Security Measures)</h3>
            <ul style={{ paddingLeft: "20px" }}>
              <li>การเข้ารหัสข้อมูลระหว่างส่ง (TLS 1.3) และข้อมูลขณะเก็บ (AES-256 at-rest)</li>
              <li>Row-Level Security (RLS) บน Supabase PostgreSQL</li>
              <li>JWT-based authentication (HS256) + bcrypt password hashing (cost factor 12)</li>
              <li>Rate-limiting: login 10 ครั้ง/5 นาที, bypass 3 ครั้ง/นาที</li>
              <li>Role-Based Access Control (RBAC) + Allowed Rooms scoping</li>
              <li>SHA-256 hash ของ IP ในตาราง consent_records (ไม่เก็บ raw IP)</li>
              <li>Discord Webhook สำหรับแจ้งเหตุการณ์ผิดปกติทันที</li>
            </ul>
          </div>

          {/* 10. Change Log */}
          <div>
            <h3 style={sectionHeading}>10. การเปลี่ยนแปลงนโยบาย (Change Log)</h3>
            <div style={tableWrapStyle}><table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>เวอร์ชัน</th>
                  <th style={thStyle}>วันที่</th>
                  <th style={thStyle}>การเปลี่ยนแปลง</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={tdStyle}>2.0</td>
                  <td style={tdStyle}>27 พ.ค. 2569</td>
                  <td style={tdStyle}>เพิ่มข้อมูล Data Controller, Lawful Basis, สิทธิเจ้าของข้อมูล 8 ข้อ, Cross-Border Transfer, Cookie Table, Granular Consent</td>
                </tr>
                <tr>
                  <td style={tdStyle}>1.0</td>
                  <td style={tdStyle}>15 เม.ย. 2569</td>
                  <td style={tdStyle}>เผยแพร่นโยบายฉบับแรก</td>
                </tr>
              </tbody>
            </table></div>
            <p style={{ marginTop: "10px" }}>
              ระบบจะแจ้งการเปลี่ยนแปลงนโยบายที่สาระสำคัญผ่านอีเมล (หากมี) และประกาศบนเว็บล่วงหน้าไม่น้อยกว่า 30 วัน
            </p>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.08)" }} />

          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", textAlign: "center" }}>
            เวอร์ชัน {POLICY_VERSION} · เริ่มมีผลบังคับใช้ {EFFECTIVE_DATE}<br />
            ฝ่ายดูแลนโยบายความเป็นส่วนตัว SmartAccess · ติดต่อ DPO: dpo@rmutp.ac.th
          </p>
        </div>
      </div>
    </div>
  );
}
