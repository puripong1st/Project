"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function PrivacyPage() {
  const [queryString, setQueryString] = useState("");

  useEffect(() => {
    // Preserve token and room params when returning to registration page
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
      {/* Drifting Blobs */}
      <div
        style={{
          position: "absolute",
          top: "-10%",
          left: "-5%",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(124,58,237,0.3) 0%, transparent 70%)",
          filter: "blur(50px)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-10%",
          right: "-5%",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(219,39,119,0.25) 0%, transparent 70%)",
          filter: "blur(50px)",
          pointerEvents: "none",
        }}
      />

      <div
        className="animate-fade-in"
        style={{
          maxWidth: "800px",
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
        {/* Navigation */}
        <div style={{ marginBottom: "32px" }}>
          <Link
            href={`/${queryString}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              color: "rgba(255, 255, 255, 0.6)",
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: 600,
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#FFFFFF";
              e.currentTarget.style.transform = "translateX(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "rgba(255, 255, 255, 0.6)";
              e.currentTarget.style.transform = "translateX(0)";
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            ย้อนกลับหน้าลงทะเบียน
          </Link>
        </div>

        {/* Header Title */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(219, 39, 119, 0.15)",
              border: "1px solid rgba(219, 39, 119, 0.35)",
              borderRadius: "99px",
              padding: "6px 16px",
              color: "#F472B6",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              marginBottom: "16px",
            }}
          >
            PDPA Compliance
          </div>
          <h1
            style={{
              fontSize: "32px",
              fontWeight: 800,
              lineHeight: "1.3",
              background: "linear-gradient(to right, #FFFFFF, #FCE7F3)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "-0.5px",
            }}
          >
            นโยบายความเป็นส่วนตัวของระบบควบคุมห้องเรียน
          </h1>
          <p style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "14px", marginTop: "8px" }}>
            (Official Privacy Policy)
          </p>
        </div>

        {/* Content Body */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "28px",
            fontSize: "15px",
            lineHeight: "1.8",
            color: "rgba(255, 255, 255, 0.8)",
          }}
        >
          <p>
            นโยบายความเป็นส่วนตัวนี้ชี้แจงกระบวนการจัดการข้อมูลส่วนบุคคล (PII) ของระบบควบคุมการเข้าออกห้องปฏิบัติการอัจฉริยะ **RMUTP ACCS** เพื่อความโปร่งใสและปกป้องผลประโยชน์ของผู้ใช้บริการทุกคนตามหลักมาตรฐานสากลและพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA):
          </p>

          <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.08)" }} />

          <div>
            <h3 style={{ color: "#FCE7F3", fontSize: "18px", fontWeight: 700, marginBottom: "10px" }}>
              1. ประเภทข้อมูลส่วนบุคคลที่จัดเก็บ (Types of Personal Data Collected)
            </h3>
            <p>
              ระบบจะทำการบันทึกข้อมูลส่วนตัวที่จำเป็นเมื่อท่านส่งคำร้องลงทะเบียนขอเข้าใช้งาน ได้แก่ คำนำหน้าชื่อ, ชื่อจริง, นามสกุล, รหัสนักศึกษา, คณะวิชา, สาขาวิชาการเรียน, พิกัดรหัสห้องเรียนที่ขอเข้าใช้งาน, เวลาที่ยื่นคำขอ, และข้อมูลเน็ตเวิร์กเชิงสถิติความปลอดภัย ได้แก่ ไอพีแอดเดรส (IP Address) และประวัติของเครื่องอุปกรณ์ (User-Agent) เพื่อใช้ในการรักษาความมั่นคงปลอดภัย
            </p>
          </div>

          <div>
            <h3 style={{ color: "#FCE7F3", fontSize: "18px", fontWeight: 700, marginBottom: "10px" }}>
              2. จุดประสงค์การจัดเก็บข้อมูลและประมวลผล (Purposes of Processing)
            </h3>
            <p>
              ข้อมูลทั้งหมดจะถูกจัดเก็บลง Supabase PostgreSQL เพื่อใช้ในการคิวรี่จับคู่ประวัติและยืนยันตนสำหรับการอนุญาตปลดล็อกประตูผ่านทางเข้าห้องเรียนแบบไร้สาย รวมถึงการจัดทำประวัติล็อกการจราจรคอมพิวเตอร์เพื่อความปลอดภัยในการป้องกันอัคคีภัยและการโจรกรรมในสถาบันการศึกษา
            </p>
          </div>

          <div>
            <h3 style={{ color: "#FCE7F3", fontSize: "18px", fontWeight: 700, marginBottom: "10px" }}>
              3. การรักษาความมั่นคงปลอดภัยและการส่งต่อข้อมูล (Information Sharing and Security)
            </h3>
            <p>
              ระบบได้รับการคุ้มครองด้วยการตั้งค่าความมั่นคงปลอดภัยระดับตารางแถว (Row-Level Security) ในฐานข้อมูล และจะส่งต่อเฉพาะข้อมูลการเข้าห้องที่ได้รับอนุมัติแล้วเท่านั้นไปยัง Discord Webhook ของกลุ่มเจ้าหน้าที่ดูแลระบบที่ได้รับอนุญาตอย่างเป็นทางการ และจะไม่มีการส่งมอบ ขาย หรือแบ่งปันข้อมูลส่วนบุคคลของนักศึกษาออกไปยังหน่วยงานภายนอกอื่นเด็ดขาด
            </p>
          </div>

          <div>
            <h3 style={{ color: "#FCE7F3", fontSize: "18px", fontWeight: 700, marginBottom: "10px" }}>
              4. ระยะเวลาการจัดเก็บข้อมูลและการทำลายข้อมูล (Data Retention & Deletion)
            </h3>
            <p>
              ระบบจัดเก็บข้อมูลประวัติการขอผ่านประตูและการลงทะเบียนไว้ในฐานข้อมูลเป็นเวลาอย่างน้อย 90 วัน เพื่อให้เป็นไปตามพระราชบัญญัติว่าด้วยการกระทำความผิดเกี่ยวกับคอมพิวเตอร์ และเมื่อครบกำหนดระยะเวลาดังกล่าวหรือเมื่อเสร็จสิ้นปีการศึกษา ระบบจะมีตรรกะการลบทำลายข้อมูลประวัติการสแกนเก่าทิ้งอัตโนมัติ (Data Pruning)
            </p>
          </div>

          <div>
            <h3 style={{ color: "#FCE7F3", fontSize: "18px", fontWeight: 700, marginBottom: "10px" }}>
              5. สิทธิ์ในการเข้าถึงและขอทำลายข้อมูลส่วนบุคคล (Data Subject Rights)
            </h3>
            <p>
              นักศึกษามีสิทธิ์ในการยื่นคำร้องผ่านทางคณะวิศวกรรมศาสตร์เพื่อขอเข้าตรวจสอบประวัติการลงทะเบียนของตนเอง หรือขอใช้สิทธิ์ในการลบทำลายข้อมูลส่วนบุคคลของตนเองออกนอกระบบควบคุม (Right to be Forgotten) ได้ทุกเมื่อ หากนักศึกษาหมดความจำเป็นในการเข้าใช้ห้องปฏิบัติการดังกล่าวแล้ว
            </p>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.08)" }} />

          <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.4)", textAlign: "center" }}>
            ปรับปรุงล่าสุด: 27 พฤษภาคม 2569 | ฝ่ายดูแลนโยบายความเป็นส่วนตัว RMUTP ACCS
          </p>
        </div>
      </div>
    </div>
  );
}
