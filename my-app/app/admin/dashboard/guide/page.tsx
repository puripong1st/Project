"use client";
import React from "react";
import { useDashboard } from "../DashboardContext";

export default function GuidePage() {
  return (
    <>
      <div className="animate-fade-in" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 24 }}>
        {/* 📚 Premium User Manual Guide Panel */}
        <div className="premium-card" style={{ padding: 32, background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>

          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            borderBottom: "1.5px solid var(--border)",
            paddingBottom: 20,
            marginBottom: 28
          }}>
            <div style={{
              width: 52,
              height: 52,
              borderRadius: "16px",
              background: "linear-gradient(135deg, var(--smartaccess-purple) 0%, var(--edu-pink) 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontSize: 26,
              boxShadow: "0 6px 16px rgba(124,58,237,0.25)",
              flexShrink: 0
            }}>
              📚
            </div>
            <div style={{ textAlign: "left" }}>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: "var(--smartaccess-purple-dark)", margin: 0 }}>
                คู่มือการใช้งานระบบ & IoT Controller (ACCS User Manual)
              </h2>
              <p style={{ fontSize: 12.5, color: "var(--text-secondary)", margin: "4px 0 0" }}>
                คู่มือแนะนำการบริหารจัดการระบบควบคุมกลอนประตูอัจฉริยะ โหมดซอฟต์แวร์จำลอง และการต่อบอร์ดจริงข้ามเครือข่ายอย่างละเอียด
              </p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18, textAlign: "left" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
              {[
                { title: "หน้าคิวรอตรวจสอบ", text: "ใช้ดูคำขอใหม่ อนุมัติ หรือปฏิเสธพร้อมเหตุผล" },
                { title: "สถานะบอร์ด IoT", text: "ใช้ดูห้อง CE-401/CE-402 ปลดล็อกด่วน และทดสอบ Polling" },
                { title: "ทำเนียบ & Export PDF", text: "ใช้ค้นหาประวัติ กรองช่วงวันที่ และดาวน์โหลดรายงาน" },
                { title: "ตั้งค่าระบบ & Webhook", text: "ใช้เพิ่มห้อง ตั้ง IP ตั้ง Discord และบันทึกค่าระบบ" },
              ].map(item => (
                <div key={item.title} style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 14, background: "var(--bg-primary)" }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: "var(--text-primary)", marginBottom: 5 }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>{item.text}</div>
                </div>
              ))}
            </div>

            <div style={{ padding: 16, border: "1px solid rgba(16,185,129,0.24)", background: "#ECFDF5", borderRadius: 8 }}>
              <h3 style={{ fontSize: 15, fontWeight: 900, color: "#047857", marginBottom: 8 }}>เริ่มใช้งานประจำวัน</h3>
              <ol style={{ margin: 0, paddingLeft: 20, color: "var(--text-primary)", fontSize: 13, lineHeight: 1.8 }}>
                <li>เข้าแผงผู้ดูแล แล้วดูการ์ดด้านบนก่อนว่ามีคิวรอตรวจสอบกี่คน และบอร์ดออนไลน์กี่บอร์ด</li>
                <li>เปิดแท็บ <strong>สถานะบอร์ด IoT ทั้งหมด</strong> เพื่อตรวจว่าแต่ละห้องมีรายการแสดงขึ้นมา เช่น CE-401 หรือ CE-402</li>
                <li>ถ้าบอร์ดไม่ออนไลน์ ให้กด <strong>เทส Polling</strong> ที่การ์ดห้องนั้นก่อน แล้วตรวจ IP/อินเทอร์เน็ตของบอร์ด</li>
                <li>กลับไปแท็บ <strong>คิวรอตรวจสอบ</strong> เพื่ออนุมัติหรือปฏิเสธคำขอของนักศึกษา</li>
              </ol>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
              <section style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 18 }}>
                <h3 style={{ fontSize: 15, fontWeight: 900, color: "var(--text-primary)", marginBottom: 10 }}>1. รับคำขอและอนุมัติสิทธิ์</h3>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.8 }}>
                  <li>นักศึกษาสแกน QR หน้าห้อง แล้วกรอกข้อมูลในฟอร์ม</li>
                  <li>คำขอจะเข้าแท็บ <strong>คิวรอตรวจสอบ</strong> พร้อมห้องที่ขอใช้สิทธิ์</li>
                  <li>ตรวจชื่อ รหัสนักศึกษา คณะ สาขา และห้องให้ถูกต้อง</li>
                  <li>กด <strong>อนุมัติ</strong> เพื่อให้สิทธิ์ หรือกด <strong>ปฏิเสธ</strong> แล้วใส่เหตุผล</li>
                  <li>หลังอนุมัติ ระบบจะบันทึกผู้อนุมัติ เวลา และแสดงในประวัติ/PDF</li>
                </ul>
              </section>

              <section style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 18 }}>
                <h3 style={{ fontSize: 15, fontWeight: 900, color: "var(--text-primary)", marginBottom: 10 }}>2. ปลดล็อกประตู</h3>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.8 }}>
                  <li>ถ้าต้องเปิดให้รายบุคคล ให้ไปที่แท็บ <strong>ทำเนียบ & ประวัติเข้าออก</strong> แล้วกด <strong>เปิด</strong> ในแถวนักศึกษาที่อนุมัติแล้ว</li>
                  <li>ถ้าต้องเปิดห้องทันที ให้ไปที่แท็บ <strong>ห้องเรียน & ESP32</strong> แล้วกด <strong>ปลดล็อกด่วน</strong> ที่การ์ดห้อง</li>
                  <li>ดูตัวเลข <strong>ปลดล็อกสำเร็จวันนี้</strong> เพื่อเช็กว่าคำสั่งถูกบันทึกแล้ว</li>
                  <li>ถ้าเปิดไม่ได้ ให้ดูว่าการ์ดห้องขึ้นออนไลน์หรือไม่ และลองกด <strong>เทส Polling</strong></li>
                </ul>
              </section>

              <section style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 18 }}>
                <h3 style={{ fontSize: 15, fontWeight: 900, color: "var(--text-primary)", marginBottom: 10 }}>3. เพิ่มหรือแก้ไขห้อง IoT</h3>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.8 }}>
                  <li>เปิดแท็บ <strong>ห้องเรียน & ESP32</strong></li>
                  <li>ไปที่ส่วนเพิ่มห้อง / บอร์ดใหม่</li>
                  <li>กรอกรหัสห้อง เช่น <strong>CE-401</strong> และ IP ของบอร์ด เช่น <strong>192.168.1.100</strong></li>
                  <li>กดเพิ่มห้อง แล้วกด <strong>บันทึกทั้งหมด</strong> เพื่อให้ห้องแสดงในหน้า IoT หลังเปิดเว็บใหม่หรือ deploy ใหม่</li>
                  <li>ถ้าห้องมี Discord แยก ให้กดปุ่มตั้งค่าของห้องนั้น แล้วใส่ Webhook เฉพาะห้อง</li>
                </ul>
              </section>

              <section style={{ border: "1px solid var(--border)", borderRadius: 8, padding: 18 }}>
                <h3 style={{ fontSize: 15, fontWeight: 900, color: "var(--text-primary)", marginBottom: 10 }}>4. Export PDF และค้นหาประวัติ</h3>
                <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.8 }}>
                  <li>ไปที่แท็บ <strong>ทำเนียบ & ประวัติเข้าออก</strong></li>
                  <li>เลือกวันที่เริ่มต้น วันที่สิ้นสุด และสถานะที่ต้องการ</li>
                  <li>ตรวจกล่องสรุปจำนวนรายการก่อนดาวน์โหลด</li>
                  <li>กด <strong>ดาวน์โหลด PDF</strong> เพื่อออกเอกสารรวม</li>
                  <li>ถ้าต้องการเอกสารรายบุคคล ให้กดปุ่ม <strong>การ์ด</strong> ในแถวนักศึกษาคนนั้น</li>
                </ul>
              </section>
            </div>

            <div style={{ border: "1px solid rgba(217,119,6,0.24)", background: "#FFFBEB", borderRadius: 8, padding: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 900, color: "#B45309", marginBottom: 10 }}>แก้ปัญหาที่พบบ่อย</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
                {[
                  { q: "เข้าเว็บแล้วไม่เห็นห้อง IoT", a: "ไปที่ตั้งค่าระบบ ตรวจว่ามีห้องอยู่ในรายการ แล้วกดบันทึกทั้งหมดอีกครั้ง" },
                  { q: "บอร์ดขึ้น OFFLINE", a: "ตรวจไฟเลี้ยง/อินเทอร์เน็ตบอร์ด ตรวจ IP แล้วกดเทส Polling" },
                  { q: "Discord ไม่แจ้งเตือน", a: "ตรวจ Webhook ส่วนกลางหรือ Webhook เฉพาะห้อง แล้วกดทดสอบส่ง" },
                  { q: "PDF ไม่มีข้อมูล", a: "ตรวจช่วงวันที่และสถานะที่เลือก ถ้ากรองแคบเกินไปให้เลือกทุกสถานะหรือขยายช่วงวันที่" },
                ].map(item => (
                  <div key={item.q} style={{ background: "#FFFFFF", border: "1px solid rgba(217,119,6,0.18)", borderRadius: 8, padding: 12 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 900, color: "var(--text-primary)", marginBottom: 4 }}>{item.q}</div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>{item.a}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
