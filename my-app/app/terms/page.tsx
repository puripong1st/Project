"use client";
// Terms & Conditions v2.0 — แก้ไขให้สอดคล้องกับ ป.พ.พ. + พ.ร.บ.ข้อสัญญาไม่เป็นธรรม 2540 + PDPA
import { useState, useEffect } from "react";
import Link from "next/link";

const TERMS_VERSION = "2.0";
const EFFECTIVE_DATE = "27 พฤษภาคม 2569";

const sectionHeading: React.CSSProperties = {
  color: "#E9D5FF",
  fontSize: "18px",
  fontWeight: 700,
  marginBottom: "10px",
};

const definitionStyle: React.CSSProperties = {
  background: "rgba(124, 58, 237, 0.08)",
  border: "1px solid rgba(124, 58, 237, 0.2)",
  borderRadius: "10px",
  padding: "10px 14px",
  marginBottom: "8px",
};

export default function TermsPage() {
  const [queryString, setQueryString] = useState("");
  useEffect(() => {
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
              background: "rgba(124, 58, 237, 0.15)",
              border: "1px solid rgba(124, 58, 237, 0.35)",
              borderRadius: "99px", padding: "6px 16px",
              color: "#C084FC", fontSize: "12px", fontWeight: 700,
              letterSpacing: "0.5px", textTransform: "uppercase",
              marginBottom: "16px",
            }}
          >
            RMUTP ACCS · Terms v{TERMS_VERSION}
          </div>
          <h1
            style={{
              fontSize: "32px", fontWeight: 800, lineHeight: "1.3",
              background: "linear-gradient(to right, #FFFFFF, #E9D5FF)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "-0.5px",
            }}
          >
            ข้อกำหนดและเงื่อนไขการใช้บริการ
          </h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px", marginTop: "8px" }}>
            (Terms and Conditions) · เริ่มมีผลบังคับใช้ {EFFECTIVE_DATE}
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
            ข้อกำหนดและเงื่อนไขนี้ ("<strong style={{ color: "#FFFFFF" }}>ข้อตกลง</strong>") เป็นสัญญาระหว่าง
            <strong style={{ color: "#FFFFFF" }}> คณะวิศวกรรมศาสตร์ มหาวิทยาลัยเทคโนโลยีราชมงคลพระนคร</strong>
            ("สถาบัน") และ <strong style={{ color: "#FFFFFF" }}>ผู้ใช้</strong> ที่ลงทะเบียนเพื่อใช้บริการระบบควบคุมการเข้าออกห้องปฏิบัติการอัจฉริยะ
            RMUTP ACCS ("ระบบ") โปรดอ่านข้อกำหนดต่อไปนี้อย่างละเอียดก่อนใช้บริการ
          </p>

          <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.08)" }} />

          {/* 0. Definitions */}
          <div>
            <h3 style={sectionHeading}>0. คำนิยาม (Definitions)</h3>
            <div style={definitionStyle}>
              <strong>"ระบบ"</strong> หมายถึง ระบบควบคุมการเข้าออกห้องปฏิบัติการอัจฉริยะ RMUTP ACCS รวมถึงเว็บแอปพลิเคชัน บอร์ด ESP32 และส่วนประกอบอื่นที่เกี่ยวข้อง
            </div>
            <div style={definitionStyle}>
              <strong>"ผู้ใช้"</strong> หมายถึง นักศึกษา อาจารย์ บุคลากร หรือบุคคลที่ได้รับอนุญาตให้เข้าใช้ระบบ
            </div>
            <div style={definitionStyle}>
              <strong>"แอดมิน"</strong> หมายถึง เจ้าหน้าที่ของสถาบันที่มีสิทธิ์อนุมัติ/ปฏิเสธคำร้อง แบ่งเป็นบทบาท Owner และ Door Operator
            </div>
            <div style={definitionStyle}>
              <strong>"QR Token"</strong> หมายถึง รหัสคิวอาร์โค้ดแบบหมุนทุก 60 วินาที สำหรับการลงทะเบียนเข้าห้องครั้งแรก
            </div>
            <div style={definitionStyle}>
              <strong>"Bypass Token"</strong> หมายถึง สิทธิ์ผ่านทางชั่วคราวภายในระยะเวลา 5 นาทีหลังการอนุมัติ สำหรับการเปิดประตูซ้ำโดยไม่ต้องสแกนใหม่
            </div>
            <div style={definitionStyle}>
              <strong>"Tailgating"</strong> หมายถึง การเดินตามหลังผู้อื่นเข้าสู่ห้องโดยไม่มีการสแกนยืนยันตัวตนของตนเอง
            </div>
            <div style={definitionStyle}>
              <strong>"PDPA"</strong> หมายถึง พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562
            </div>
          </div>

          {/* 1. Acceptance */}
          <div>
            <h3 style={sectionHeading}>1. การยอมรับข้อตกลง (Acceptance of Terms)</h3>
            <p>
              การที่ท่านกดปุ่ม <strong style={{ color: "#FFFFFF" }}>"ลงทะเบียน"</strong> หรือใช้บริการระบบในรูปแบบใดก็ตาม
              ถือว่าท่าน (i) ได้อ่านและเข้าใจข้อตกลงนี้โดยตลอด (ii) ยอมรับและตกลงผูกพันตามข้อตกลงนี้ทุกประการ
              (iii) มีอายุไม่ต่ำกว่า 18 ปี หรือได้รับความยินยอมจากผู้ปกครองตามกฎหมาย และ
              (iv) เป็นบุคคลที่มีสิทธิ์เข้าใช้ห้องปฏิบัติการตามระเบียบของสถาบัน
            </p>
            <p>
              หากท่านไม่ยอมรับข้อใดข้อหนึ่ง โปรดยุติการใช้งานทันที
            </p>
          </div>

          {/* 2. Access Scope */}
          <div>
            <h3 style={sectionHeading}>2. ขอบเขตสิทธิ์การเข้าใช้งาน (Access Rights Scope)</h3>
            <p>
              สิทธิ์การเข้าใช้งานห้องปฏิบัติการผ่านระบบเป็นสิทธิ์เฉพาะตัวของผู้ใช้ที่ได้รับการอนุมัติเท่านั้น
              <strong style={{ color: "#FFFFFF" }}> ผู้ใช้ตกลงจะไม่นำ QR Token, Bypass Token, รหัสผ่านแอดมิน,
              หรือสิทธิ์ใด ๆ ที่ได้รับ ไปแบ่งปัน ส่งต่อ ขาย หรืออนุญาตให้บุคคลอื่นที่ไม่มีสิทธิ์ใช้งานเด็ดขาด</strong>
            </p>
            <p>
              ในกรณีที่ผู้ใช้ทำสิทธิ์การเข้าถึงหายหรือถูกขโมย ผู้ใช้ต้องแจ้งสถาบันโดยทันทีเพื่อระงับสิทธิ์ดังกล่าว
            </p>
          </div>

          {/* 3. Anti-Tailgating (revised — proportionate) */}
          <div>
            <h3 style={sectionHeading}>3. นโยบายห้ามเดินตามหลัง (Anti-Tailgating Policy)</h3>
            <p>
              เพื่อความปลอดภัยและความถูกต้องของข้อมูลการเข้าออก ผู้ใช้ทุกคนต้องสแกนยืนยันตัวตนรายบุคคลก่อนเข้าสู่ห้อง
              และไม่ควรเดินตามหลังผู้อื่นที่ประตูถูกเปิดค้างไว้โดยไม่ลงบันทึกประวัติของตนเอง
            </p>
            <p>
              ในกรณีที่เกิดเหตุทรัพย์สินสูญหายหรือเสียหายภายในห้องปฏิบัติการ
              <strong style={{ color: "#FFFFFF" }}> ผู้ใช้ทุกคนที่อยู่ในห้องช่วงเวลาเกิดเหตุมีหน้าที่ให้ความร่วมมือในการสอบสวนตามสัดส่วนความเกี่ยวข้อง</strong>
              โดยสถาบันจะใช้ข้อมูล access_logs ประกอบการสอบสวนอย่างเป็นธรรม
              และจะไม่ผลักภาระความรับผิดให้ผู้ใช้รายใดรายหนึ่งโดยปราศจากพยานหลักฐานเพียงพอ
            </p>
          </div>

          {/* 4. Limitation of Liability */}
          <div>
            <h3 style={sectionHeading}>4. ขอบเขตความรับผิดและการจำกัดความรับผิด (Limitation of Liability)</h3>
            <p>
              สถาบันให้บริการระบบในรูปแบบ "ตามสภาพ" (AS IS) และจะใช้ความพยายามตามสมควรในการบำรุงรักษาให้ใช้งานได้ต่อเนื่อง
              อย่างไรก็ตาม ในขอบเขตสูงสุดที่กฎหมายอนุญาต:
            </p>
            <ul style={{ paddingLeft: "20px" }}>
              <li>สถาบันไม่รับผิดชอบต่อทรัพย์สินส่วนตัวของผู้ใช้ที่นำเข้าไปเก็บภายในห้อง ผู้ใช้ต้องดูแลทรัพย์สินของตนเอง</li>
              <li>สถาบันไม่รับผิดชอบต่อความเสียหายทางอ้อม (Indirect/Consequential Damages) ที่เกิดจากระบบขัดข้อง ยกเว้นกรณีที่สถาบันมีเจตนาหรือประมาทเลินเล่ออย่างร้ายแรง</li>
              <li>ในกรณีระบบล่ม สถาบันจะพยายามให้บริการเปิดประตูแบบ Manual โดยเจ้าหน้าที่ทดแทน</li>
            </ul>
            <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.65)", marginTop: "8px" }}>
              ⚠️ การจำกัดความรับผิดข้างต้นไม่ขัดต่อ พ.ร.บ. ว่าด้วยข้อสัญญาที่ไม่เป็นธรรม พ.ศ. 2540 และไม่ครอบคลุมกรณีที่กฎหมายไม่อนุญาตให้จำกัดความรับผิด
            </p>
          </div>

          {/* 5. Disciplinary Enforcement (revised — proportionate) */}
          <div>
            <h3 style={sectionHeading}>5. มาตรการลงโทษทางวินัย (Disciplinary Enforcement)</h3>
            <p>
              ในกรณีที่สถาบันพบหลักฐานว่าผู้ใช้กระทำการดังต่อไปนี้:
            </p>
            <ul style={{ paddingLeft: "20px" }}>
              <li>พยายามเจาะระบบ บายพาสการรักษาความปลอดภัย หรือใช้ช่องโหว่ของระบบโดยไม่ได้รับอนุญาต</li>
              <li>ส่งคำร้องลงทะเบียนเท็จหรือปลอมแปลงข้อมูล</li>
              <li>ยิงสปาม API หรือทำให้ระบบทำงานผิดปกติด้วยเจตนา</li>
              <li>ช่วยเหลือบุคคลที่ไม่มีสิทธิ์ให้เข้าใช้ห้อง</li>
              <li>กระทำผิดตาม พ.ร.บ. ว่าด้วยการกระทำความผิดเกี่ยวกับคอมพิวเตอร์ พ.ศ. 2560</li>
            </ul>
            <p>
              สถาบันสงวนสิทธิ์ในการ:
            </p>
            <ul style={{ paddingLeft: "20px" }}>
              <li>บันทึก Log เหตุการณ์เป็นพยานหลักฐาน</li>
              <li>ระงับสิทธิ์การใช้งานชั่วคราวระหว่างการสอบสวน</li>
              <li><strong style={{ color: "#FFFFFF" }}>ดำเนินการตามระเบียบของมหาวิทยาลัยตามสัดส่วนความผิด</strong> โดยพิจารณาเป็นรายกรณี ภายใต้หลักความได้สัดส่วน (Proportionality) และเปิดโอกาสให้ผู้ใช้ชี้แจง</li>
              <li>ดำเนินคดีตามกฎหมายในกรณีร้ายแรง</li>
            </ul>
          </div>

          {/* 6. PDPA Linkage */}
          <div>
            <h3 style={sectionHeading}>6. ความสัมพันธ์กับนโยบายความเป็นส่วนตัว (PDPA Linkage)</h3>
            <p>
              ข้อตกลงนี้เป็นเรื่องของ <strong style={{ color: "#FFFFFF" }}>เงื่อนไขการใช้บริการ</strong> เท่านั้น
              การยอมรับข้อตกลงนี้ <strong style={{ color: "#FFFFFF" }}>ไม่ถือเป็นการให้ความยินยอม (Consent) ตาม PDPA</strong>
            </p>
            <p>
              การประมวลผลข้อมูลส่วนบุคคลของท่านอยู่ภายใต้{" "}
              <Link href={`/privacy${queryString}`} style={{ color: "#F472B6", textDecoration: "underline" }}>
                นโยบายความเป็นส่วนตัว
              </Link>{" "}
              ซึ่งใช้ฐานทางกฎหมายแยกต่างหาก (ประโยชน์โดยชอบด้วยกฎหมาย + หน้าที่ตามกฎหมาย พ.ร.บ.คอม ม.26)
              โปรดศึกษานโยบายดังกล่าวเพื่อทราบสิทธิของท่าน 8 ข้อตาม PDPA
            </p>
          </div>

          {/* 7. Amendment */}
          <div>
            <h3 style={sectionHeading}>7. การแก้ไขข้อตกลง (Amendment)</h3>
            <p>
              สถาบันสงวนสิทธิ์ในการแก้ไขเพิ่มเติมข้อตกลงนี้ตามความเหมาะสม โดยจะแจ้งล่วงหน้าไม่น้อยกว่า
              <strong style={{ color: "#FFFFFF" }}> 30 วัน</strong> ผ่านการประกาศบนเว็บไซต์ระบบและ/หรืออีเมลของผู้ใช้
            </p>
            <p>
              หากท่านยังคงใช้บริการหลังจากข้อตกลงฉบับใหม่มีผลบังคับใช้ ถือว่าท่านยอมรับข้อตกลงฉบับใหม่
              หากท่านไม่ยอมรับ ท่านสามารถยุติการใช้บริการและขอลบข้อมูลตามสิทธิ PDPA ม.33
            </p>
          </div>

          {/* 8. Governing Law */}
          <div>
            <h3 style={sectionHeading}>8. กฎหมายที่ใช้บังคับและเขตอำนาจศาล (Governing Law &amp; Jurisdiction)</h3>
            <p>
              ข้อตกลงนี้อยู่ภายใต้บังคับและการตีความตามกฎหมายแห่งราชอาณาจักรไทย
            </p>
            <p>
              ในกรณีเกิดข้อพิพาทเกี่ยวกับข้อตกลงนี้:
            </p>
            <ul style={{ paddingLeft: "20px" }}>
              <li>คู่กรณีจะพยายามเจรจาแก้ไขปัญหาด้วยความสุจริตใจในขั้นต้น</li>
              <li>หากเป็นข้อพิพาททางปกครอง (ระหว่างนักศึกษา/บุคลากรกับสถาบัน) ให้อยู่ในเขตอำนาจของ <strong style={{ color: "#FFFFFF" }}>ศาลปกครองกลาง</strong></li>
              <li>หากเป็นข้อพิพาททางแพ่งอื่น ให้อยู่ในเขตอำนาจของ <strong style={{ color: "#FFFFFF" }}>ศาลแพ่งกรุงเทพใต้</strong></li>
            </ul>
          </div>

          {/* 9. Severability */}
          <div>
            <h3 style={sectionHeading}>9. ความเป็นโมฆะบางส่วน (Severability)</h3>
            <p>
              หากข้อกำหนดใดในข้อตกลงนี้ถูกศาลหรือหน่วยงานที่มีอำนาจตัดสินว่าเป็นโมฆะ ไม่ชอบด้วยกฎหมาย
              หรือไม่อาจบังคับใช้ได้ ข้อกำหนดส่วนที่เหลือยังคงมีผลใช้บังคับเต็มสมบูรณ์ต่อไป
              และคู่กรณีจะเจรจาแก้ไขข้อกำหนดที่เป็นโมฆะให้สอดคล้องกับเจตนารมณ์เดิมโดยชอบด้วยกฎหมาย
            </p>
          </div>

          {/* 10. Contact */}
          <div>
            <h3 style={sectionHeading}>10. ช่องทางการติดต่อ (Contact)</h3>
            <ul style={{ paddingLeft: "20px" }}>
              <li><strong>ผู้ดูแลระบบ:</strong> admin@eng.rmutp.ac.th</li>
              <li><strong>เจ้าหน้าที่คุ้มครองข้อมูล (DPO):</strong> dpo@rmutp.ac.th</li>
              <li><strong>ที่อยู่:</strong> คณะวิศวกรรมศาสตร์ มหาวิทยาลัยเทคโนโลยีราชมงคลพระนคร 1381 ถ.ประชาราษฎร์ 1 แขวงวงศ์สว่าง เขตบางซื่อ กรุงเทพฯ 10800</li>
              <li><strong>โทร:</strong> 02-836-3000</li>
            </ul>
          </div>

          {/* 11. Effective Date */}
          <div>
            <h3 style={sectionHeading}>11. วันที่มีผลบังคับใช้และประวัติการแก้ไข</h3>
            <ul style={{ paddingLeft: "20px" }}>
              <li><strong>เวอร์ชัน 2.0</strong> ({EFFECTIVE_DATE}): เพิ่มหัวข้อ Definitions, Acceptance Mechanism, แก้ไข Anti-Tailgating ให้เป็นธรรม, แก้ไขมาตรการลงโทษให้เป็นไปตามหลักความได้สัดส่วน, เพิ่ม PDPA Linkage, Amendment, Governing Law, Severability</li>
              <li><strong>เวอร์ชัน 1.0</strong> (15 เมษายน 2569): เผยแพร่ครั้งแรก</li>
            </ul>
          </div>

          <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,0.08)" }} />

          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", textAlign: "center" }}>
            ข้อกำหนดเวอร์ชัน {TERMS_VERSION} · เริ่มมีผลบังคับใช้ {EFFECTIVE_DATE}<br />
            ฝ่ายบริหารระบบควบคุมการเข้าออก RMUTP ACCS · คณะวิศวกรรมศาสตร์ มทร.พระนคร
          </p>
        </div>
      </div>
    </div>
  );
}
