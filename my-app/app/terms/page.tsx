"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function TermsPage() {
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
              background: "rgba(124, 58, 237, 0.15)",
              border: "1px solid rgba(124, 58, 237, 0.35)",
              borderRadius: "99px",
              padding: "6px 16px",
              color: "#C084FC",
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              marginBottom: "16px",
            }}
          >
            RMUTP ACCS
          </div>
          <h1
            style={{
              fontSize: "32px",
              fontWeight: 800,
              lineHeight: "1.3",
              background: "linear-gradient(to right, #FFFFFF, #E9D5FF)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "-0.5px",
            }}
          >
            ข้อกำหนดและเงื่อนไขการใช้บริการอย่างเป็นทางการ
          </h1>
          <p style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: "14px", marginTop: "8px" }}>
            (Terms and Conditions Guide)
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
            ในการนำระบบควบคุมการเข้าออกห้องปฏิบัติการอัจฉริยะ **RMUTP ACCS** ไปติดตั้งใช้งานจริงในสถานศึกษาหรือห้องปฏิบัติการของคณะวิศวกรรมศาสตร์ นักศึกษา บุคลากร และผู้ผ่านเข้าออกทุกคนต้องปฏิบัติตามข้อกำหนดและเงื่อนไขการใช้บริการดังนี้อย่างเคร่งครัด เพื่อความมั่นคงปลอดภัยสูงสุดของสถานศึกษาและทรัพย์สินส่วนรวม:
          </p>

          <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.08)" }} />

          <div>
            <h3 style={{ color: "#E9D5FF", fontSize: "18px", fontWeight: 700, marginBottom: "10px" }}>
              1. ขอบเขตสิทธิ์การเข้าถึงอาคารสถานที่ (Access Rights Scope)
            </h3>
            <p>
              สิทธิ์การเข้าใช้งานห้องปฏิบัติการผ่านระบบสแกนคิวอาร์โค้ดนี้ เป็นสิทธิ์เฉพาะตัวบุคคลของนักศึกษาหรือเจ้าหน้าที่ที่ได้รับการอนุมัติอย่างถูกต้องเท่านั้น **ห้ามมิให้นักศึกษานำโทเคน (Token) คิวอาร์โค้ด หรือสิทธิ์ผ่านทางชั่วคราว (Bypass Token) ไปแบ่งปัน ส่งต่อ หรืออนุญาตให้บุคคลอื่นที่ไม่มีสิทธิ์ใช้เพื่อเปิดประตูผ่านทางเข้า** การกระทำดังกล่าวจะถือว่าเป็นการละเมิดนโยบายความปลอดภัยขั้นร้ายแรง
            </p>
          </div>

          <div>
            <h3 style={{ color: "#E9D5FF", fontSize: "18px", fontWeight: 700, marginBottom: "10px" }}>
              2. นโยบายการห้ามเดินตามหลังโดยไม่สแกนสิทธิ์ (Anti-Tailgating Policy)
            </h3>
            <p>
              นักศึกษาทุกคนต้องทำการสแกนประวัติการยืนยันตนและรอผลการอนุมัติในระบบรายคนก่อนเข้าสู่ห้องเรียน **ห้ามมิให้เดินตามหลังผู้อื่น (Tailgating) ที่ประตูถูกเปิดค้างไว้โดยไม่มีการลงบันทึกประวัติลงตาราง access_logs** หากเกิดกรณีทรัพย์สินส่วนกลางสูญหายหรือเสียหาย บุคคลสุดท้ายที่ปรากฏประวัติเข้าห้องในระบบจะถือเป็นผู้รับผิดชอบหลักในการให้ข้อมูลการสอบสวนแก่คณะวิศวกรรมศาสตร์
            </p>
          </div>

          <div>
            <h3 style={{ color: "#E9D5FF", fontSize: "18px", fontWeight: 700, marginBottom: "10px" }}>
              3. ขอบเขตความรับผิดชอบและการจำกัดความรับผิด (Limitation of Liability)
            </h3>
            <p>
              คณะวิศวกรรมศาสตร์ มหาวิทยาลัยเทคโนโลยีราชมงคลพระนคร และทีมผู้พัฒนาระบบควบคุมนี้ จะไม่รับผิดชอบต่อความสูญหาย เสียหาย หรือการถูกโจรกรรมของทรัพย์สินส่วนตัวของนักศึกษาที่นำเข้าไปเก็บรักษาภายในห้องเรียนทุกกรณี ผู้ใช้งานต้องดูแลและรักษาความปลอดภัยของทรัพย์สินตนเองขณะใช้บริการ
            </p>
          </div>

          <div>
            <h3 style={{ color: "#E9D5FF", fontSize: "18px", fontWeight: 700, marginBottom: "10px" }}>
              4. มาตรการลงโทษทางวินัย (Disciplinary Enforcement)
            </h3>
            <p>
              หากระบบตรวจพบว่าผู้ใช้งานพยายามเจาะระบบ ส่งคำร้องปลอม ยิงสแปมถล่ม API ประตู หรือพยายามช่วยบุคคลภายนอกบุกรุกโดยมิชอบด้วยวิธีใดก็ตาม ทางระบบจะทำการบันทึก Log เหตุการณ์ไว้เพื่อเป็นหลักฐานอย่างสมบูรณ์ และระงับสิทธิ์เข้าใช้งานผ่านแผงควบคุมแอดมินทันที พร้อมส่งเรื่องเพื่อดำเนินการลงโทษทางวินัยนักศึกษาตามระเบียบขั้นสูงสุดของมหาวิทยาลัยต่อไป
            </p>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.08)" }} />

          <p style={{ fontSize: "13px", color: "rgba(255, 255, 255, 0.4)", textAlign: "center" }}>
            ปรับปรุงล่าสุด: 27 พฤษภาคม 2569 | ฝ่ายบริหารระบบควบคุมการเข้าออก RMUTP ACCS
          </p>
        </div>
      </div>
    </div>
  );
}
