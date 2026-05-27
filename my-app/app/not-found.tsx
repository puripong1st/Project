// Custom 404 — Next.js App Router จะใช้ไฟล์นี้อัตโนมัติเมื่อ route ไม่ตรง
// แสดงข้อความแบบเรียบง่าย — ไม่มีปุ่มกลับ ไม่มีลิงก์ ตามที่ผู้ใช้ขอ
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ไม่พบหน้าที่ค้นหา · SmartAccess",
  robots: { index: false, follow: false },
};

export default function NotFound() {
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
        background:
          "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
        fontFamily: "'Noto Sans Thai', 'Inter', sans-serif",
        color: "#FFFFFF",
        textAlign: "center",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-10%",
          left: "-5%",
          width: 500,
          height: 500,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(124,58,237,0.3) 0%, transparent 70%)",
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
          background:
            "radial-gradient(circle, rgba(219,39,119,0.25) 0%, transparent 70%)",
          filter: "blur(50px)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          maxWidth: 560,
          width: "100%",
          zIndex: 10,
          background: "rgba(255, 255, 255, 0.04)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          borderRadius: 24,
          padding: "48px 36px",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          boxShadow:
            "0 30px 70px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            letterSpacing: "-2px",
            background: "linear-gradient(135deg, #A78BFA, #F472B6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: 8,
          }}
        >
          404
        </div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: "#E9D5FF",
            marginBottom: 14,
          }}
        >
          ไม่พบหน้าที่คุณค้นหา
        </div>
        <p
          style={{
            fontSize: 15,
            lineHeight: 1.7,
            color: "rgba(255,255,255,0.75)",
            margin: 0,
          }}
        >
          คุณมาผิดที่ หรือบริการนี้ยังไม่เปิดให้ใช้งาน
        </p>
      </div>
    </div>
  );
}
