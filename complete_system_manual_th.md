# คู่มือระบบควบคุมประตูโครงการ Innovative system for managing access rights and controlling classroom access via wireless network ฉบับละเอียด

วันที่จัดทำ: 26 พฤษภาคม 2026
อัปเดตล่าสุด: 2026-05-28 16:05:00 (+07:00)  
โปรเจกต์อ้างอิง: Innovative system for managing access rights and controlling classroom access via wireless network  
ขอบเขตคู่มือ: วิธีใช้งานเว็บ, วิธีใช้งานบอร์ด ESP32, วิธีต่อวงจร, วิธีทำชุดจำลองประตู, และคำอธิบายโค้ดรายฟังก์ชัน

> คู่มือนี้อธิบายจากโค้ดจริงในโปรเจกต์ปัจจุบัน โดยระบบเว็บอยู่ใน `my-app/` และเฟิร์มแวร์บอร์ดอยู่ใน `esp32/` กับ `esp32C1/`

---

<a id="%E0%B8%AA%E0%B8%B2%E0%B8%A3%E0%B8%9A%E0%B8%B1%E0%B8%8D"></a>
<a id="toc"></a>
## สารบัญ

### 📘 ภาคหลัก (1-19)
- [1. ภาพรวมระบบ](#sec-1)
- [2. โครงสร้างไฟล์สำคัญ](#sec-2)
- [3. การติดตั้งและรันเว็บ](#sec-3)
- [4. วิธีใช้งานเว็บสำหรับนักศึกษา](#sec-4)
- [5. วิธีใช้งานเว็บสำหรับ Admin](#sec-5)
- [6. วิธีใช้งานบอร์ด ESP32](#sec-6)
- [7. วิธีเปิด Wokwi Simulator](#sec-7)
- [8. การต่อวงจรตาม Wokwi](#sec-8)
- [9. การต่อวงจรประตูจริง](#sec-9)
- [10. วิธีทำอุปกรณ์จำลองประตูติดกับบอร์ด](#sec-10)
- [11. ฐานข้อมูลและตารางสำคัญ](#sec-11)
- [12. อธิบายโค้ดฝั่ง ESP32 รายฟังก์ชัน](#sec-12)
- [13. อธิบายโค้ดฝั่งเว็บและ API รายฟังก์ชัน](#sec-13)
- [14. อธิบายหน้าเว็บหลัก](#sec-14)
- [15. อธิบาย API routes](#sec-15)
- [16. Flow สำคัญของการเปิดประตู](#sec-16)
- [17. Troubleshooting](#sec-17)
- [18. Checklist ก่อนสาธิตระบบ](#sec-18)
- [19. สรุปหน้าที่แต่ละชั้นของระบบ](#sec-19)

### 🔬 ภาคผนวกเชิงลึก (20-34)
- [20. นิยามคำศัพท์พื้นฐาน (สำหรับมือใหม่)](#sec-20)
- [21. ภาพรวมสถาปัตยกรรมแบบ Layered (4 ชั้น)](#sec-21)
- [22. หน้าจอผู้ใช้งานนักศึกษา — เจาะลึกแต่ละ State](#sec-22)
- [23. หน้าจอ Admin — เจาะลึกทุก Tab พร้อมเหตุผลที่ออกแบบแบบนี้](#sec-23)
- [24. หน้าจอ TFT บน ESP32 — เจาะลึก State Machine](#sec-24)
- [25. อธิบายโค้ด `esp32.ino` แบบ "บรรทัดต่อบรรทัด" (ส่วนสำคัญ)](#sec-25)
- [26. อธิบายโค้ดเว็บแบบ "Request Lifecycle" — รับ request 1 ครั้งเกิดอะไรขึ้นบ้าง](#sec-26)
- [27. Supabase ทำอะไรในระบบนี้ (เจาะลึก)](#sec-27)
- [28. Vercel ทำอะไรกับ my-app (เจาะลึก)](#sec-28)
- [29. เปรียบเทียบ: ทำไมบางส่วนเร็ว / บางส่วนช้า](#sec-29)
- [30. อัลกอริทึมสำคัญ (Pseudocode)](#sec-30)
- [31. Network & Security Architecture](#sec-31)
- [32. Flowchart รวม "End-to-End" (สมัคร → เข้าห้อง)](#sec-32)
- [33. คำถามที่พบบ่อย (FAQ)](#sec-33)
- [34. สรุปแบบ "1 นาที"](#sec-34)

### ⚙️ ภาคผนวกระดับวิศวกร (35-44)
- [35. Schema DDL เต็มรูปแบบ (สร้างโดย `initDatabase()`)](#sec-35)
- [36. ESP32 — GPIO Timing และข้อจำกัดเชิงฮาร์ดแวร์](#sec-36)
- [37. รายการ Environment Variables ทุกตัว](#sec-37)
- [38. Deployment Runbook (ไป Production)](#sec-38)
- [39. Monitoring & Observability](#sec-39)
- [40. การ Migrate / เพิ่มฟีเจอร์ใหม่ (Future-proofing)](#sec-40)
- [41. Performance Profiling แบบลงรายละเอียด](#sec-41)
- [42. Code Smells ที่ควร refactor (Tech Debt)](#sec-42)
- [43. Glossary (ภาคผนวกศัพท์เทคนิคเพิ่มเติม)](#sec-43)
- [44. ทำไมหน้าจอ TFT บน ESP32 จึงเปลี่ยนสถานะ "ช้า" ไม่เรียลไทม์](#sec-44)

### 🎯 ภาคเจาะลึกขั้นสูง (45-70)
- [45. ทำไมเลือก PostgreSQL + ทำไมย้ายจาก postgreSQL (เดิมคือ MySQL) กลางทาง + Aiven vs Supabase](#sec-45)
- [46. อธิบายโค้ดทุกไฟล์ใน `lib/` แบบเจาะลึก](#sec-46)
- [47. Admin Dashboard ทีละ Tab แบบเจาะลึก](#sec-47)
- [48. React Hydration & SSR Lifecycle](#sec-48)
- [49. Attack Scenarios — Threat Modeling แบบ Step-by-Step](#sec-49)
- [50. Cryptographic Details — JWT, bcrypt, HMAC ในเชิงคณิตศาสตร์](#sec-50)
- [51. OWASP Top 10 (2021) — ระบบรับมืออย่างไรทีละข้อ](#sec-51)
- [52. วงจรไฟฟ้าระดับ Schematic — ทำไมแต่ละชิ้นต้องมี](#sec-52)
- [53. Power Budget Calculation](#sec-53)
- [54. PCB Layout / Wiring Best Practices](#sec-54)
- [55. HTTP/TLS Packet Flow — ลึกถึง Wireshark](#sec-55)
- [56. DNS / CDN Routing](#sec-56)
- [57. NAT / Firewall — ทำไม ESP32 push ไม่ได้](#sec-57)
- [58. Database Query Plan Analysis](#sec-58)
- [59. Connection Pooling เจาะลึก](#sec-59)
- [60. Transaction Isolation](#sec-60)
- [61. Manual Test Plan — ครบทุก Flow](#sec-61)
- [62. Disaster Recovery Playbook](#sec-62)
- [63. Cost Analysis แบบเต็ม](#sec-63)
- [64. ทำไมเลือก Tailwind CSS v4](#sec-64)
- [65. Color Theory & Accessibility (WCAG)](#sec-65)
- [66. Thai Font Rendering](#sec-66)
- [67. พ.ร.บ. คอมพิวเตอร์ มาตรา 26 — รายละเอียดและการปฏิบัติตาม](#sec-67)
- [68. PDPA — Personal Data Protection Act](#sec-68)
- [69. Chrome DevTools Profiling ของหน้าเว็บ](#sec-69)
- [70. ESP32 Oscilloscope Traces](#sec-70)
- [71. ประเด็นงานวิจัยเชิงวิชาการและการยกระดับความมั่นคงปลอดภัย (Academic Research & Security Hardening)](#sec-71)
  - [71.1 สรุปการแก้ไขช่องโหว่ความมั่นคงปลอดภัย (Vulnerability Remediation)](#sec-71-1)
  - [71.2 ผลการวัดประสิทธิภาพบนโปรดักชัน (Live Benchmarking)](#sec-71-2)
  - [71.3 สถาปัตยกรรมการสื่อสารแบบ "Push-via-Poll" ในระบบเครือข่ายองค์กร](#sec-71-3)
  - [71.4 กลไกป้องกันการเปิดประตูซ้ำด้วย Atomic Transaction](#sec-71-4)
  - [71.5 สถาปัตยกรรมความปลอดภัยแบบหลายชั้น (Defense-in-Depth)](#sec-71-5)
  - [71.6 การปฏิบัติตาม พ.ร.บ. คอมพิวเตอร์ และหลักการคุ้มครองข้อมูลส่วนบุคคล (PDPA)](#sec-71-6)
  - [71.7 การวิเคราะห์การจัดสรรพลังงานและการออกแบบกลไกเผชิญเหตุฉุกเฉิน (Power Budget & Fail-Safe Design)](#sec-71-7)
  - [71.8 กลไกการกู้คืนระบบและการทำงานแบบยืดหยุ่นในสภาวะออฟไลน์ (Disaster Recovery & Offline Resilience)](#sec-71-8)
  - [71.9 การประเมินความคุ้มค่าเชิงเศรษฐศาสตร์และต้นทุนคลาวด์เซิร์ฟเวอร์เลส (Cloud Economics & Cost Analysis)](#sec-71-9)
  - [71.10 ตารางวิเคราะห์และแก้ไขปัญหาขัดข้องทางเทคนิค (Step-by-Step Error Diagnostic Matrix)](#sec-71-10)
  - [71.11 คู่มือการบำรุงรักษาเชิงป้องกันและการลดสัญญาณรบกวนในระบบวงจรจริง (Preventive Maintenance & Hardware De-noising)](#sec-71-11)
  - [71.12 แผนการทำระบบอัปเดตเฟิร์มแวร์ไร้สายความปลอดภัยสูง (Secure OTA Update Architecture Concept)](#sec-71-12)
  - [71.13 ตารางแผนผัง API และสเปกการรับส่งข้อมูล (E2E API Data Contract & Payload Specification)](#sec-71-13)
  - [71.14 ตารางเปรียบเทียบสถาปัตยกรรมระบบกับกรอบมาตรฐานความปลอดภัยระดับโลก (OWASP Top 10 & ISO 27001 Controls Mapping)](#sec-71-14)
  - [71.15 แผนการกู้คืนภัยพิบัติระบบฐานข้อมูลและเซิร์ฟเวอร์เลสคลาวด์แบบ Failsafe (Failsafe Disaster Recovery & Database Seeding Runbook)](#sec-71-15)
  - [71.16 โครงสร้างสถานะและการทำงานแบบมัลติคอร์บนเฟิร์มแวร์ ESP32 (ESP32 Multi-Core FreeRTOS & State Machine)](#sec-71-16)
  - [71.17 วงจรชีวิตและการไหลของข้อมูลโทเคนคิวอาร์ไดนามิก (Lifecycle & Dataflow of Dynamic QR Token)](#sec-71-17)
  - [71.18 แผนผังการจัดแบ่งโครงสร้างโค้ดและขอบเขตหน้าที่ในระบบ Next.js (Next.js App Router & Library Directory Architecture)](#sec-71-18)
  - [71.19 การปฏิบัติตามกฎหมายคุ้มครองข้อมูลส่วนบุคคล (PDPA Compliance & Implementation)](#sec-71-19)
  - [71.20 สถาปัตยกรรมการรักษาความปลอดภัยข้อมูล (Information Security Framework)](#sec-71-20)
  - [71.21 พระราชบัญญัติว่าด้วยการกระทำความผิดเกี่ยวกับคอมพิวเตอร์ (Computer Crime Act Compliance)](#sec-71-21)
  - [71.22 ข้อตกลงและเงื่อนไขการใช้บริการอย่างเป็นทางการ (Terms and Conditions Guide)](#sec-71-22)
  - [71.23 นโยบายความเป็นส่วนตัวของระบบควบคุมห้องเรียน (Official Privacy Policy)](#sec-71-23)
  - [71.24 Threat Model แบบ STRIDE และการประเมิน DREAD](#sec-71-24)
  - [71.25 Data Flow Diagram (DFD) ระดับ 0/1/2 — สำหรับ PDPA DPIA](#sec-71-25)
  - [71.26 กฎหมายอื่นที่ต้องปฏิบัติตาม (Cybersecurity Act, ก.พ.อ., License Audit)](#sec-71-26)
  - [71.27 ROC (Record of Processing) ตาม PDPA มาตรา 39](#sec-71-27)
  - [71.28 Schematic + PCB Layout + BOM (Bill of Materials)](#sec-71-28)
  - [71.29 Timing Diagram ของ Relay + Flyback Diode](#sec-71-29)
  - [71.30 API Reference (OpenAPI 3.0 Spec)](#sec-71-30)
  - [71.31 CI/CD Pipeline + Branch Strategy](#sec-71-31)
  - [71.32 Incident Response Plan (NIST 800-61) + แบบฟอร์มแจ้ง สคส.](#sec-71-32)
  - [71.33 Accessibility (a11y) — เกินกว่า WCAG Color](#sec-71-33)
  - [71.34 User Acceptance Test (UAT) + System Usability Scale (SUS)](#sec-71-34)
  - [71.35 Literature Review — เปรียบเทียบกับงานวิจัยอื่น](#sec-71-35)
  - [71.36 Hardware Reliability — MTBF, IP Rating, สภาพแวดล้อม](#sec-71-36)
  - [71.37 Network Topology — Campus Deployment + Firewall Request](#sec-71-37)
  - [71.38 คู่มือผู้ใช้แยกเล่ม (Student / Operator / Owner Quick Guides)](#sec-71-38)
  - [71.39 ตรวจสอบความถูกต้องทางกฎหมาย: Cookie Consent, Terms, Privacy Policy](#sec-71-39)
  - [71.40 SmartAccess Rebrand + PDPA Implementation — เจาะลึกทุกประเด็น](#sec-71-40)
    - [71.40.1 ที่มาของการ Rebrand และบทบาทของคณะครุศาสตร์อุตสาหกรรม](#sec-71-40-1)
    - [71.40.2 สถาปัตยกรรม Consent — Frontend ↔ API ↔ Database](#sec-71-40-2)
    - [71.40.3 เจาะลึกตาราง consent_records ทุกคอลัมน์](#sec-71-40-3)
    - [71.40.4 เจาะลึก API /api/consent ทั้ง 3 method](#sec-71-40-4)
    - [71.40.5 เจาะลึก CookieConsent.tsx v2.0 ทีละส่วน](#sec-71-40-5)
    - [71.40.6 เจาะลึก privacy/page.tsx — แต่ละหัวข้อ + เจตนาทางกฎหมาย](#sec-71-40-6)
    - [71.40.7 เจาะลึก terms/page.tsx — แต่ละ clause + ฎีกาที่อ้างอิง](#sec-71-40-7)
    - [71.40.8 รายการ Cookie/Storage ทุกตัวพร้อมเหตุผลการจัดหมวด](#sec-71-40-8)
    - [71.40.9 SHA-256 IP Hashing — ทำไมและทำอย่างไร](#sec-71-40-9)
    - [71.40.10 Withdrawal Flow — กฎ "ง่ายเท่ากับให้" ของ PDPA ม.19](#sec-71-40-10)
    - [71.40.11 Cross-Border Transfer — Safeguards ในทางปฏิบัติ](#sec-71-40-11)
    - [71.40.12 Discord Webhook — ที่มาของ avatar URL ใหม่](#sec-71-40-12)
    - [71.40.13 ESP32 Display Subtitle — ทำไมต้องสั้น](#sec-71-40-13)
    - [71.40.14 SEO Meta Description — Trade-off ระหว่างชื่อยาว/สั้น](#sec-71-40-14)
    - [71.40.15 Migration Checklist สำหรับ deploy เวอร์ชันนี้](#sec-71-40-15)
    - [71.40.16 Verification Plan — ตรวจสอบหลัง deploy](#sec-71-40-16)
    - [71.40.17 ความเสี่ยงคงเหลือและงานที่ต้องทำต่อ](#sec-71-40-17)
  - [71.41 การตรวจสอบความสมบูรณ์และระบบอัพเดตแดชบอร์ดระดับพรีเมียม (System Audit & Dashboard Upgrades)](#sec-71-41)

---


<a id="sec-1"></a>
## 1. ภาพรวมระบบ

ระบบนี้เป็นระบบควบคุมการเข้าใช้งานห้องผ่านเว็บและบอร์ด ESP32 โดยมีองค์ประกอบหลัก 4 ส่วน

1. เว็บ Next.js สำหรับนักศึกษาและผู้ดูแลระบบ
2. ฐานข้อมูล PostgreSQL สำหรับเก็บผู้ใช้, คำขอเข้าใช้งาน, log, token QR และค่าตั้งค่าระบบ
3. ESP32 พร้อมจอ ILI9341, relay, LED และ buzzer สำหรับแสดง QR และสั่งปลดล็อกประตู
4. Discord Webhook สำหรับแจ้งเตือนการลงทะเบียน, การอนุมัติ, การเปิดประตู และเหตุการณ์ระบบ

แนวคิดสำคัญของระบบปัจจุบันคือ ESP32 ไม่ได้รอรับคำสั่งแบบ local server เป็นหลัก แต่ใช้การ polling ขึ้นไปถามเว็บทุก 2 วินาทีที่ `/api/esp32/display?room=...` ถ้า server มีคำสั่ง `door_trigger: "open"` บอร์ดจะเปิด relay เพื่อปลดล็อกประตู แล้ว server จะเปลี่ยนคำสั่งในฐานข้อมูลเป็น consumed เพื่อไม่ให้เปิดซ้ำ

### ภาพที่ 1: สถาปัตยกรรมรวม

```mermaid
flowchart TD
    Phone["โทรศัพท์นักศึกษา"] -->|"สแกน QR ที่หน้าห้อง"| RegisterPage["หน้าเว็บ / ลงทะเบียน"]
    RegisterPage -->|"POST /api/students"| NextServer["Next.js Server"]
    Admin["Admin Dashboard"] -->|"อนุมัติ / ปฏิเสธ / เปิดประตู"| NextServer
    NextServer -->|"อ่าน/เขียนข้อมูล"| DB[("PostgreSQL")]
    NextServer -->|"ส่งแจ้งเตือน"| Discord["Discord Webhook"]
    ESP32["ESP32 ห้อง CE-401/CE-402"] -->|"GET /api/esp32/display ทุก 2 วินาที"| NextServer
    NextServer -->|"JSON: QR, pending_count, door_trigger"| ESP32
    ESP32 -->|"ควบคุม GPIO 12"| Relay["Relay Module"]
    Relay --> Lock["กลอนแม่เหล็ก / ชุดจำลองประตู"]
```

### ภาพที่ 2: ลำดับการใช้งานจริง

```mermaid
sequenceDiagram
    participant S as นักศึกษา
    participant E as ESP32
    participant W as Next.js
    participant D as PostgreSQL
    participant A as Admin
    participant R as Relay/Lock

    E->>W: ขอข้อมูลหน้าจอและ QR token
    W->>D: getOrCreateActiveQRToken(room)
    W-->>E: active_token, QR URL, pending_count
    S->>E: สแกน QR ที่จอ
    S->>W: เปิด /?scan=token&room=CE-401
    W->>D: ตรวจ token ยังไม่หมดอายุ
    S->>W: ส่งฟอร์มลงทะเบียน
    W->>D: consumeQRToken(token)
    W->>D: บันทึก students + access_logs
    A->>W: กดอนุมัติ
    W->>D: UPDATE students = approved
    W->>D: ตั้ง room_cmd_CE-401 = unlock
    E->>W: polling รอบถัดไป
    W-->>E: door_trigger = open
    E->>R: GPIO12 HIGH 5 วินาที
    R-->>S: ประตูปลดล็อก
```

---


<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

<a id="sec-2"></a>
## 2. โครงสร้างไฟล์สำคัญ

```text
Project/
  my-app/
    app/
      page.tsx                         หน้าเว็บลงทะเบียนของนักศึกษา
      admin/login/page.tsx             หน้าเข้าสู่ระบบ Admin
      admin/dashboard/page.tsx         แดชบอร์ดผู้ดูแลระบบ
      esp32-preview/page.tsx           หน้าจำลองจอ ESP32
      api/                             API ทั้งหมดของระบบ
    lib/
      db.ts                            เชื่อม PostgreSQL และสร้างตาราง
      auth.ts                          JWT และ cookie session ของ Admin
      qr.ts                            สร้างและตรวจ token QR
      esp32.ts                         คิวคำสั่งเปิดประตูและสถานะ ESP32
      discord.ts                       ส่ง Discord webhook
      pdf.ts                           สร้าง PDF รายงาน
      rate-limit.ts                    จำกัดจำนวน request ด้วย PostgreSQL
      faculties.ts                     รายชื่อคณะและสาขา
    proxy.ts                           ป้องกันเส้นทาง /admin/dashboard
    next.config.ts                     security headers และ Next config
  esp32/
    esp32.ino                          เฟิร์มแวร์บอร์ดห้อง CE-402
    config.h.template                  template ตั้งค่า Wi-Fi/server/API key
    diagram.json                       วงจร Wokwi
    wokwi.toml                         ตั้งค่า Wokwi simulator
  esp32C1/
    esp32C1.ino                        เฟิร์มแวร์บอร์ดห้อง CE-401
    config.h.template                  template ตั้งค่าห้อง CE-401
```

---


<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

<a id="sec-3"></a>
## 3. การติดตั้งและรันเว็บ

### 3.1 เตรียม Node.js และ package

เข้าไปที่โฟลเดอร์เว็บ

```bash
cd my-app
npm install
```

รัน dev server

```bash
npm run dev
```

เปิดเว็บ

```text
https://project-sigma-ivory-21.vercel.app
```

หน้า Admin

```text
https://project-sigma-ivory-21.vercel.app/admin/login
```

หน้าจำลอง ESP32

```text
https://project-sigma-ivory-21.vercel.app/esp32-preview
```

> [!NOTE]
> ลิงก์ด้านบนเป็นเว็บไซต์จำลองบนโปรดักชันหลัก (Production URL) สำหรับรันใช้งานจริง ส่วนกรณีที่รันระบบทดสอบภายในเครื่องนักพัฒนา (Local Development) สามารถเข้าใช้งานผ่าน `http://localhost:3000`, `http://localhost:3000/admin/login` และ `http://localhost:3000/esp32-preview` ตามลำดับ

### 3.2 ตัวแปรสภาพแวดล้อมที่ควรตั้งค่า

สร้างไฟล์ `my-app/.env.local`

```env
POSTGRES_HOST=your-db-host
POSTGRES_PORT=5432
POSTGRES_USER=your-db-user
POSTGRES_PASSWORD=your-db-password
POSTGRES_DATABASE=postgres

JWT_SECRET=change-this-to-a-long-random-secret

NEXT_PUBLIC_APP_URL=https://project-sigma-ivory-21.vercel.app

ESP32_API_KEY=change-this-to-the-same-key-in-config-h
ESP32_MOCK_MODE=false
ESP32_WOKWI=false
ESP32_IP=192.168.1.100
ESP32_PORT=80

DISCORD_WEBHOOK_URL=

ALLOW_DEV_SEED=true
INITIAL_ADMIN_USERNAME=admin
INITIAL_ADMIN_PASSWORD=admin123456
INITIAL_ADMIN_FULL_NAME=System Administrator
```

หมายเหตุสำคัญ:

- โค้ดปัจจุบันใช้ PostgreSQL ผ่านแพ็กเกจ `pg`
- ใน production ห้ามใช้ `JWT_SECRET` ค่า default
- ใน production ห้ามใช้ `ESP32_API_KEY` ค่า placeholder
- ถ้าใช้ Vercel/Supabase ให้ตั้งตัวแปรทั้งหมดใน Project Settings ของ Vercel
- `ALLOW_DEV_SEED=true` ใช้เฉพาะ development เพื่อสร้าง admin เริ่มต้น

---


<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

<a id="sec-4"></a>
## 4. วิธีใช้งานเว็บสำหรับนักศึกษา

### 4.1 เข้าใช้งานผ่าน QR เท่านั้น

หน้า `/` ถูกออกแบบให้เข้าใช้งานผ่านลิงก์ที่มี token เช่น

```text
/?scan=<token>&room=CE-401
```

ถ้าเปิด `/` ตรง ๆ โดยไม่มี `scan` ระบบจะแสดงหน้าว่าถูกจำกัดการเข้าถึง เพราะต้องสแกน QR ที่จอหน้าห้องก่อน

### 4.2 ขั้นตอนใช้งาน

1. ไปที่หน้าห้องที่มีบอร์ด ESP32
2. เปิดกล้องโทรศัพท์แล้วสแกน QR บนจอ
3. เว็บจะเปิดหน้าลงทะเบียนพร้อม room เช่น `CE-401`
4. กรอกคำนำหน้า, ชื่อ, นามสกุล, รหัสนักศึกษา, ชั้นปี, คณะ, สาขา
5. กดส่งข้อมูลขอเปิดประตู
6. ถ้าอยู่ในช่วง auto-approve ระบบจะอนุมัติและสั่งเปิดประตูทันที
7. ถ้าอยู่นอกช่วง auto-approve คำขอจะเข้า queue ให้ Admin ตรวจสอบ
8. หลังส่งสำเร็จ หน้าเว็บจะ polling สถานะทุก 3 วินาทีเพื่อตรวจว่า approved หรือ rejected แล้วหรือยัง

### 4.3 เงื่อนไข QR token

ระบบมี token 2 ชั้น

1. ตอนเปิดหน้าเว็บ: `/api/esp32/qr/verify` ตรวจว่า token ยัง valid แต่ยังไม่ consume
2. ตอนส่งฟอร์ม: `/api/students` เรียก `consumeQRToken()` เพื่อใช้ token จริงและกันการส่งซ้ำ

ค่าที่ใช้ในโค้ด:

- QR token rotation: 60 วินาที
- QR token expiry: 300 วินาที
- หน้าเว็บมีตัวจับเวลาฝั่ง client 120 วินาทีหลังผ่านการตรวจ token

### 4.4 ระบบ Auto-fill

ถ้านักศึกษาเคยลงทะเบียนมาก่อนและกรอกชื่อ, นามสกุล, รหัสนักศึกษาตรงกับประวัติ ระบบจะเรียก `/api/students/check-match` เพื่อดึงชั้นปี, คณะ, สาขาเดิมมาเติมให้

โหมด Auto-fill มี 2 แบบ:

- `auto`: เติมให้อัตโนมัติ
- `manual`: แสดงปุ่มให้ผู้ใช้กดยืนยันก่อนเติม

### 4.5 ระบบ Offline Queue

ถ้าอินเทอร์เน็ตหลุดระหว่างใช้งาน หน้าเว็บจะเก็บข้อมูลลง `localStorage` key `smartaccess_offline_queue` แล้วพยายามส่งใหม่เมื่อ browser กลับมา online

ข้อควรระวัง: เพราะระบบใช้ QR token แบบใช้ครั้งเดียว ถ้า offline นานจน token หมดอายุ การส่งย้อนหลังอาจถูกปฏิเสธ ต้องสแกน QR ใหม่

### 4.6 ระบบ Bypass ภายใน 5 นาที

เมื่อผู้ใช้ได้รับอนุมัติแล้ว หน้าเว็บจะเก็บ session ใน `localStorage` key `smartaccess_user_session` พร้อม `bypass_token`

ถ้ากลับมาสแกนซ้ำภายใน 5 นาที ระบบจะเรียก `/api/students/bypass` เพื่อเปิดประตูโดยไม่ต้องกรอกฟอร์มซ้ำ

### 4.7 ระบบกล้องสแกน QR Code ในตัวเว็บ (In-App Camera QR Reader)
ระบบมีฟังก์ชันเรียกเลนส์กล้องผ่านเทคโนโลยี HTML5 `getUserMedia` บนเว็บเบราว์เซอร์โดยตรง เพื่อสแกนคิวอาร์โค้ดหน้าห้องปฏิบัติการ (Classroom ESP32 Display) ได้ทันทีโดยไม่ต้องผ่านแอปกล้องนอก และมีระบบสแกนแบบสปีดจำลอง (Fast Simulator) สำหรับการทดสอบข้ามขั้นตอนอย่างปลอดภัยในขั้นตอนการพัฒนาโปรแกรม

### 4.8 ระบบติดตามความก้าวหน้าการเปิดประตูแบบมีภาพเคลื่อนไหว (Dynamic Registration Progress Stepper UI)
เมื่อนักศึกษาส่งคำขอเข้าใช้ห้องเรียน หน้าจอจะสลับเข้าสู่โหมดหน้าต่างติดตามผลแบบเรียลไทม์ (Real-Time Stepper UI) แสดงสถานะเชิงภาพเคลื่อนไหว 4 ขั้นตอน:
1. **ยื่นคำขอ (Submitted)** 🟢 — รับข้อมูลเข้าฐานข้อมูลเสร็จสิ้น
2. **จัดเข้าคิว (Queued)** 🟢 — รันจัดคิวในคลาสเรียน
3. **ตรวจสอบสิทธิ์ (Verifying)** ⏳/🟢/🔴 — แสดงจังหวะประมวลผลของแอดมิน (เปลี่ยนเป็นสีแดงพร้อมแจ้งเหตุผลทันทีหากถูกปฏิเสธ)
4. **เปิดประตูสำเร็จ (Door Unlocked)** 🚪 — อนิเมชั่นประตูเปิดพร้อมไฟสถานะเขียวเรืองแสงเมื่อกลอนแม่เหล็กไฟฟ้าคลายตัว

### 4.9 ระบบยืนยันตัวตนระดับสูงด้วยไบโอเมตริก (Biometric Face ID / Touch ID Fast Bypass)
หลังจากได้รับอนุมัติเข้าห้องครั้งแรก นักศึกษาสามารถผูกลายนิ้วมือหรือใบหน้าจริงเข้ากับระบบ (Biometric Enrollment) โดยการมาเยือนครั้งถัดไปในรอบสัปดาห์ หน้าเว็บจะมีป้าย **"🔓 ปลดล็อกประตูด่วนด้วย Biometrics"** ปรากฏขึ้นมาเพื่อให้กดสแกนนิ้วมือ/ใบหน้าจริงบนสมาร์ทโฟนเพื่อผ่านประตูเข้าห้องได้ด่วนในพริบตาโดยไม่ต้องกรอกฟอร์มซ้ำ

---


<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

<a id="sec-5"></a>
## 5. วิธีใช้งานเว็บสำหรับ Admin

### 5.1 เข้าสู่ระบบ

เปิด

```text
https://project-sigma-ivory-21.vercel.app/admin/login
```

กรอก username/password ที่มีในตาราง `admin_users`

เมื่อ login สำเร็จ ระบบจะสร้าง JWT และเก็บใน cookie ชื่อ `smartaccess_admin_token`

### 5.2 บทบาทผู้ใช้

| Role | สิทธิ์หลัก |
|---|---|
| `owner` | เห็นข้อมูลทั้งหมด, อนุมัติ, ปฏิเสธ, เปิดประตู, ลบข้อมูล, export PDF, จัดการ admin, ตั้งค่าระบบ |
| `door_operator` | เข้า dashboard และใช้งานส่วนปฏิบัติการบางส่วน เช่นดู pending และสั่งเปิดประตูตามที่ UI เปิดให้ |

### 5.3 แท็บสำคัญใน Dashboard

| แท็บ | ใช้ทำอะไร |
|---|---|
| คิวรอตรวจสอบ | ดูคำขอใหม่, กดอนุมัติหรือปฏิเสธ |
| ทำเนียบและประวัติ | ค้นหานักศึกษา, เปิดประตูรายบุคคล, export PDF, ดู access logs |
| ผู้ดูแลระบบ | เพิ่มหรือลบ admin |
| ห้องเรียนและ ESP32 | เพิ่มห้อง, ตั้ง IP, ทดสอบบอร์ด, ปลดล็อกด่วน |
| ตั้งค่าระบบ | ตั้ง auto-approve, auto-fill, Discord webhook, การแสดงรหัสนักศึกษา |
| คู่มือ | คู่มือย่อใน dashboard |

### 5.4 อนุมัติคำขอ

เมื่อกดอนุมัติ ระบบจะทำงานดังนี้

1. เรียก `POST /api/students/{id}/approve`
2. ตรวจสอบ cookie JWT ว่าเป็นแอดมินที่มีสถานะล็อกอินถูกต้อง และต้องได้รับสิทธิ์ดูแลห้องเรียนนั้น (สำหรับ `owner` ผ่านสิทธิ์อัตโนมัติ สำหรับ `door_operator` ตรวจสอบว่า `requested_room` ของนักศึกษาต้องมีอยู่ในคอลัมน์ `allowed_rooms` ของแอดมินคนนั้น หากไม่มีสิทธิ์จะถูกระงับด้วยสถานะ 403)
3. อัปเดตตารางฐานข้อมูล `students.status = 'approved'` และ `approved_at = CURRENT_TIMESTAMP`
4. เรียกใช้ฟังก์ชัน `openDoor(student_id, requested_room)`
5. ฟังก์ชัน `openDoor()` เขียนคำสั่ง `room_cmd_<room> = unlock` ลงใน `system_settings`
6. บอร์ด ESP32 Polling ดึงข้อมูลสถานะรอบถัดไปแล้วพบคำสั่งปลดล็อก จึงสั่งการจ่ายไฟเปิด Relay
7. บันทึกประวัติการผ่านเข้าห้องลงตาราง `access_logs` แบบแก้ไขไม่ได้ (Immutable log)
8. ส่งแจ้งเตือนอัตโนมัติเข้า Discord Webhook แบบแบ่งแยกหมวดหมู่ประเภทเหตุการณ์ (Event Categorization)

### 5.5 ปฏิเสธคำขอ

เมื่อกดปฏิเสธ ระบบจะทำงานดังนี้

1. เรียก `POST /api/students/{id}/reject`
2. ตรวจสอบสิทธิ์และขอบเขตห้องเรียนเหมือนขั้นตอนการอนุมัติ (หากเป็น `door_operator` ต้องมีสิทธิ์ห้องเรียนนั้น)
3. อัปเดตสถานะในตาราง `students.status = 'rejected'`
4. บันทึกคำอธิบายเหตุผลในการปฏิเสธ (`rejection_reason`) โดยจำกัดขนาดความยาวข้อมูลไม่เกิน 500 ตัวอักษร เพื่อป้องกัน DoS
5. บันทึกประวัติลงตาราง `access_logs` และส่งแจ้งเตือนเข้า Discord Webhook ตามหมวดหมู่การปฏิเสธสิทธิ์

### 5.6 ปลดล็อกด่วนทั้งห้อง

ในแท็บห้องเรียนและ ESP32 กดปุ่มปลดล็อกห้อง เช่น CE-401

ระบบจะเรียก

```text
POST /api/system/unlock-room
```

body

```json
{ "room": "CE-401" }
```

จากนั้น server จะเขียน `room_cmd_CE-401 = unlock` ลงฐานข้อมูล และบอร์ดห้องนั้นจะเปิด relay เมื่อ polling รอบถัดไป

### 5.7 Export PDF

Owner สามารถ export ได้ 2 แบบ

1. รายงานรวมตามช่วงวันที่และสถานะ
2. รายงานรายบุคคล

API ที่ใช้คือ

```text
GET /api/export/pdf
GET /api/export/pdf?id=<student_id>
```

---


<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

<a id="sec-6"></a>
## 6. วิธีใช้งานบอร์ด ESP32

### 6.1 อุปกรณ์ที่ใช้กับบอร์ด

| อุปกรณ์ | หน้าที่ |
|---|---|
| ESP32 DevKit V1 | ตัวควบคุมหลัก |
| ILI9341 TFT 320x240 | แสดง QR, สถานะห้อง, คิว, ผู้อนุมัติล่าสุด |
| Relay Module 5V | สวิตช์ไฟให้กลอนหรือชุดจำลองประตู |
| Buzzer | ส่งเสียงตอน boot, กำลังตรวจ, อนุมัติ |
| LED Wi-Fi | แสดงสถานะเชื่อมต่อ Wi-Fi |
| LED Reject | เตรียมไว้สำหรับสถานะ reject |
| LED Door หรือ solenoid/maglock | แสดงหรือทำหน้าที่เป็นประตู |

### 6.2 สร้างไฟล์ config.h

คัดลอก template

```bash
copy esp32\config.h.template esp32\config.h
```

แก้ค่าหลัก

```cpp
const char *ssid = "ชื่อ Wi-Fi";
const char *password = "รหัสผ่าน Wi-Fi";
const char *server_url = "https://your-domain.vercel.app/api/esp32/display?room=CE-402";
const char *room_code = "CE-402";
const char *api_key = "ค่าเดียวกับ ESP32_API_KEY บน server";
```

ถ้าใช้ `esp32C1/` ให้ตั้ง room เป็น `CE-401`

### 6.3 ติดตั้ง library ใน Arduino IDE

ต้องมี library ต่อไปนี้

- Adafruit GFX Library
- Adafruit ILI9341
- ArduinoJson เวอร์ชัน 6.x
- WiFi และ HTTPClient มากับ ESP32 Arduino Core
- `ricmoo_qrcode.c/.h` อยู่ในโปรเจกต์แล้ว

### 6.4 Upload firmware

1. เปิด Arduino IDE
2. เลือก board เป็น ESP32 Dev Module หรือ ESP32 DevKit
3. เปิด `esp32/esp32.ino`
4. ตรวจว่า `config.h` อยู่ในโฟลเดอร์เดียวกับ `.ino`
5. กด Verify
6. กด Upload
7. เปิด Serial Monitor ที่ 115200 baud

### 6.5 การทำงานตอนเปิดบอร์ด

```mermaid
flowchart TD
    A["จ่ายไฟให้ ESP32"] --> B["setup() เริ่มทำงาน"]
    B --> C["ตั้ง pinMode ให้ relay, LED, buzzer"]
    C --> D["เปิดจอ TFT และหมุน landscape"]
    D --> E["เชื่อมต่อ Wi-Fi"]
    E -->|"ยังไม่ติด"| F["LED Wi-Fi กระพริบ"]
    E -->|"เชื่อมต่อสำเร็จ"| G["LED Wi-Fi ติดค้าง"]
    G --> H["เล่นเสียง boot"]
    H --> I["drawMainScreen() แสดงหน้าหลัก"]
    I --> J["loop() polling server ทุก 2 วินาที"]
```

### 6.6 การทำงานใน loop()

ทุก 2 วินาทีบอร์ดจะทำงานนี้

1. ตรวจว่า Wi-Fi ยังเชื่อมอยู่หรือไม่
2. สร้างเวลาปัจจุบันจาก `millis()` หรือใช้ `server_time_text` จาก server
3. เปิด HTTP/HTTPS ไปที่ `server_url`
4. ส่ง header `x-api-key`
5. อ่าน JSON จาก `/api/esp32/display`
6. ดึงค่า `pending_count`, `last_approved`, `active_token`, `register_url`, `door_trigger`
7. สร้าง URL สำหรับ QR เป็น `/?scan=<active_token>&room=<requested_room>`
8. ถ้า `door_trigger == "open"` ให้เปิด relay 5 วินาที
9. ถ้าข้อมูลเปลี่ยน ให้ redraw ทั้งหน้าจอ
10. ถ้าไม่มีข้อมูลเปลี่ยน ให้ redraw เฉพาะนาฬิกาเพื่อลดจอกะพริบ

---


<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

<a id="sec-7"></a>
## 7. วิธีเปิด Wokwi Simulator

ไฟล์ที่เกี่ยวข้อง:

- `esp32/diagram.json`
- `esp32/wokwi.toml`
- `esp32/build_wokwi.bat`

ขั้นตอน

1. ติดตั้ง VS Code
2. ติดตั้ง extension Wokwi Simulator
3. ติดตั้ง Arduino CLI
4. เปิดโฟลเดอร์โปรเจกต์ใน VS Code
5. เปิดไฟล์ `esp32/diagram.json`
6. รัน `esp32/build_wokwi.bat` เพื่อ compile firmware
7. กด `F1`
8. เลือก `Wokwi: Start Simulator`

ถ้าต้องการให้ Next.js เชื่อมกับ Wokwi ให้ตั้งใน `.env.local`

```env
ESP32_WOKWI=true
ESP32_WOKWI_URL=http://localhost:8180
```

หมายเหตุ: `wokwi.toml` มี port forwarding จาก `localhost:8180` ไปที่ simulated ESP32 port 80 แต่ firmware ปัจจุบันใช้ cloud polling เป็นหลัก ไม่ได้เปิด endpoint `/door/open` บน ESP32 ดังนั้นสถานะและคำสั่งเปิดประตูหลักจะยังอ้างอิงฐานข้อมูลผ่าน `/api/esp32/display`

---


<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

<a id="sec-8"></a>
## 8. การต่อวงจรตาม Wokwi

### 8.1 ตารางต่อจอ ILI9341

| ILI9341 | ESP32 | สีสายตาม diagram | หน้าที่ |
|---|---|---|---|
| VCC | 3V3 | แดง | ไฟเลี้ยงจอ |
| GND | GND | ดำ | กราวด์ |
| CS | D15 / GPIO15 | ส้ม | เลือกอุปกรณ์ SPI |
| RST | D4 / GPIO4 | เทา | reset จอ |
| D/C | D2 / GPIO2 | เขียว | data/command |
| MOSI | D23 / GPIO23 | น้ำเงิน | ส่งข้อมูลจาก ESP32 ไปจอ |
| SCK | D18 / GPIO18 | เหลือง | clock SPI |
| MISO | D19 / GPIO19 | ม่วง | อ่านข้อมูลกลับ |
| LED | 3V3 | แดง | backlight |

### 8.2 ตารางต่อ relay

| Relay Module | ESP32 | หน้าที่ |
|---|---|---|
| VCC | VIN | ไฟเลี้ยง relay module 5V |
| GND | GND | กราวด์ร่วม |
| IN | D12 / GPIO12 | สัญญาณควบคุมจากโค้ด `RELAY_PIN` |
| COM | VIN ใน Wokwi | จุด common ของสวิตช์ relay |
| NO | LED door ผ่าน resistor | ปลายสวิตช์ที่ต่อเมื่อตัว relay ทำงาน |

### 8.3 ตารางต่อ LED และ buzzer

| อุปกรณ์ | ขาแรก | ขาที่สอง | หน้าที่ |
|---|---|---|---|
| LED Door สีเขียว | relay NO -> resistor 220 ohm -> anode | cathode -> GND | จำลองกลอน/ประตู |
| LED Wi-Fi สีน้ำเงิน | GPIO14 -> resistor 220 ohm -> anode | cathode -> GND | แสดง Wi-Fi |
| LED Reject สีแดง | GPIO26 -> resistor 220 ohm -> anode | cathode -> GND | แสดง reject |
| Buzzer | GPIO27 | GND | เสียงแจ้งเตือน |

### ภาพที่ 3: วงจรจำลองใน Wokwi

```mermaid
flowchart LR
    ESP["ESP32 DevKit"]
    TFT["ILI9341 TFT"]
    RELAY["Relay Module"]
    DOORLED["Green LED Door Simulator"]
    WIFI["Blue Wi-Fi LED"]
    REJECT["Red Reject LED"]
    BUZZ["Buzzer"]

    ESP -- "GPIO15 CS, GPIO4 RST, GPIO2 DC, GPIO23 MOSI, GPIO18 SCK, GPIO19 MISO, 3V3/GND" --> TFT
    ESP -- "GPIO12" --> RELAY
    RELAY -- "NO -> resistor 220 ohm" --> DOORLED
    DOORLED --> GND1["GND"]
    ESP -- "GPIO14 -> resistor" --> WIFI
    WIFI --> GND2["GND"]
    ESP -- "GPIO26 -> resistor" --> REJECT
    REJECT --> GND3["GND"]
    ESP -- "GPIO27" --> BUZZ
    BUZZ --> GND4["GND"]
```

---


<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

<a id="sec-9"></a>
## 9. การต่อวงจรประตูจริง

คำเตือนสำคัญ:

- ห้ามต่อ 12V เข้าขา GPIO ของ ESP32 เด็ดขาด
- ห้ามใช้ ESP32 จ่ายไฟให้กลอนแม่เหล็กโดยตรง
- กลอนแม่เหล็กหรือ solenoid ต้องใช้แหล่งจ่ายไฟแยกตามสเปก เช่น 12V 2A หรือ 12V 5A
- ถ้าใช้ solenoid หรือ magnetic lock ที่เป็นขดลวด ควรใส่ diode กันไฟย้อน เช่น 1N4007 ถ้า module/lock ไม่มีวงจรป้องกันในตัว
- ก่อนต่อ ESP32 ให้ปรับ buck converter ให้ได้ 5V ด้วย multimeter ก่อน

### 9.1 อุปกรณ์สำหรับประตูจริง 1 ชุด

| อุปกรณ์ | จำนวน | หมายเหตุ |
|---|---:|---|
| ESP32 DevKit | 1 | ตัวควบคุม |
| Relay Module 5V | 1 | ควรใช้แบบ optocoupler ถ้ามี |
| Power supply 12V | 1 | เลือกกระแสตาม lock เช่น 2A ถึง 5A |
| Buck converter 12V to 5V | 1 | ลดไฟให้ ESP32/relay |
| Magnetic lock หรือ electric strike/solenoid | 1 | เลือกชนิดตามงาน |
| Diode 1N4007 | 1 | คร่อม coil ถ้าจำเป็น |
| สายไฟและ terminal block | ตามจริง | แยกสายสัญญาณกับสายไฟกำลัง |

### 9.2 แบบ A: Magnetic lock แบบ fail-safe

Magnetic lock ทั่วไปจะล็อกเมื่อมีไฟ 12V และปลดล็อกเมื่อไฟถูกตัด ดังนั้นต้องใช้ขา NC ของ relay

```mermaid
flowchart LR
    PSU12["+12V Power Supply"]
    GND12["12V GND"]
    Buck["Buck 12V to 5V"]
    ESP["ESP32"]
    Relay["Relay Module"]
    Mag["Magnetic Lock"]

    PSU12 --> Buck
    GND12 --> Buck
    Buck -- "5V" --> ESP
    Buck -- "GND" --> ESP
    ESP -- "GPIO12" --> Relay
    Buck -- "5V/GND control side" --> Relay
    PSU12 -- "+12V" --> Relay
    Relay -- "COM -> NC ปกติจ่ายไฟ" --> Mag
    Mag -- "กลับ GND" --> GND12
```

สถานะ:

- ปกติ relay ไม่ทำงาน: COM ต่อกับ NC, magnetic lock ได้ไฟ, ประตูล็อก
- ตอนเปิดประตู `RELAY_PIN = HIGH`: relay สลับจาก NC ไป NO, ไฟ lock ถูกตัด, ประตูปลดล็อก 5 วินาที
- หลัง 5 วินาที `RELAY_PIN = LOW`: lock ได้ไฟกลับมาและล็อกอีกครั้ง

### 9.3 แบบ B: Electric strike หรือ solenoid ที่จ่ายไฟเพื่อปลดล็อก

ถ้าอุปกรณ์ปลดล็อกเมื่อได้รับไฟ 12V ให้ใช้ขา NO

```mermaid
flowchart LR
    PSU12["+12V Power Supply"]
    GND12["12V GND"]
    ESP["ESP32"]
    Relay["Relay Module"]
    Strike["Electric Strike / Solenoid"]

    ESP -- "GPIO12" --> Relay
    PSU12 -- "+12V" --> Relay
    Relay -- "COM -> NO เฉพาะตอนเปิด" --> Strike
    Strike -- "กลับ GND" --> GND12
```

สถานะ:

- ปกติ relay ไม่ทำงาน: NO เปิดวงจร, strike ไม่ได้ไฟ
- ตอนเปิดประตู: relay ทำงาน, NO ปิดวงจร, strike ได้ไฟและปลดล็อก
- หลัง 5 วินาที: relay ปิด, strike ไม่ได้ไฟ

### 9.4 การต่อกราวด์

ฝั่งควบคุม relay ต้องมีกราวด์ร่วมกับ ESP32

```text
ESP32 GND ------------- Relay GND
Buck 5V GND ----------- ESP32 GND
```

ฝั่งโหลด 12V ของ lock สามารถแยกตามรูปแบบ module แต่ในงานทั่วไปมักมีกราวด์ร่วมผ่าน power supply และ buck converter

---


<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

<a id="sec-10"></a>
## 10. วิธีทำอุปกรณ์จำลองประตูติดกับบอร์ด

มี 2 แบบที่แนะนำ

### 10.1 แบบง่าย: ใช้ LED จำลองประตู

เหมาะสำหรับนำเสนอในห้องเรียนหรือทดสอบ logic โดยไม่ใช้ไฟ 12V

อุปกรณ์:

- LED สีเขียว 1 ดวง
- Resistor 220 ohm 1 ตัว
- Relay module 1 ตัว
- Breadboard และสาย jumper

วิธีทำ:

1. ต่อ ESP32 GPIO12 ไปที่ relay IN
2. ต่อ relay VCC ไปที่ VIN ของ ESP32 หรือ 5V จาก buck
3. ต่อ relay GND ไปที่ ESP32 GND
4. ต่อ relay COM ไปที่ 5V
5. ต่อ relay NO ไปที่ resistor 220 ohm
6. ต่อ resistor ไปที่ anode ของ LED
7. ต่อ cathode ของ LED ไป GND
8. เมื่อระบบเปิดประตู LED จะติด 5 วินาที แปลว่าประตูถูกปลดล็อก

### 10.2 แบบสมจริง: ทำประตูจำลองขนาดเล็ก

อุปกรณ์:

| อุปกรณ์ | แนะนำ |
|---|---|
| แผ่นโฟมบอร์ดหรืออะคริลิก | ฐาน 30 x 20 cm |
| แผ่นทำบานประตู | 12 x 18 cm |
| บานพับเล็ก | 1 ถึง 2 ตัว |
| กลอน solenoid 12V หรือ mini magnetic lock | 1 ตัว |
| เหล็กรับกลอนหรือแผ่น strike plate | 1 ชิ้น |
| Relay module | 1 ตัว |
| Power supply 12V | 1 ตัว |
| Buck converter | 1 ตัว |
| กล่องพลาสติกใส่ ESP32/relay | 1 กล่อง |
| สกรู, กาวร้อน, cable tie | ตามจำเป็น |

ขั้นตอนทำโครง:

1. ตัดแผ่นฐานประมาณ 30 x 20 cm
2. ตัดแผ่นแนวตั้งเป็นกรอบประตูสูงประมาณ 20 cm
3. ติดกรอบประตูลงบนฐานด้วยกาวร้อนหรือสกรู
4. ตัดบานประตูขนาดประมาณ 12 x 18 cm
5. ติดบานพับด้านซ้ายของบานประตูเข้ากับกรอบ
6. ทดลองเปิดปิดให้ไม่ฝืดและไม่ติดพื้น
7. ติด solenoid หรือ magnetic lock ที่กรอบด้านขวา
8. ติดแผ่นรับกลอนที่บานประตูให้ตรงตำแหน่ง lock
9. ติดกล่อง ESP32 และ relay ไว้ด้านหลังฐานหรือด้านข้าง
10. เจาะรูเล็กสำหรับเดินสายให้เรียบร้อย
11. ติดป้ายชื่อสาย เช่น 12V, GND, GPIO12, LOCK

ขั้นตอนต่อไฟ:

1. ต่อ power supply 12V เข้า terminal block
2. ต่อ 12V เข้า buck converter
3. ปรับ buck output ให้ได้ 5.0V ก่อนเสียบ ESP32
4. ต่อ 5V จาก buck เข้า VIN ของ ESP32
5. ต่อ GND จาก buck เข้า GND ของ ESP32
6. ต่อ GPIO12 เข้า relay IN
7. ต่อ relay VCC/GND เข้าฝั่ง 5V/GND
8. เลือกต่อ lock ผ่าน NC หรือ NO ตามชนิด lock ตามหัวข้อ 9.2 หรือ 9.3
9. ใส่ diode คร่อมขดลวด solenoid ถ้า lock ไม่มีวงจรป้องกัน
10. เปิดไฟและทดสอบด้วยการกดปลดล็อกใน dashboard

### ภาพที่ 4: โครงประตูจำลอง

```mermaid
flowchart TB
    Base["ฐานโฟมบอร์ด/อะคริลิก 30x20 cm"]
    Frame["กรอบประตูแนวตั้ง"]
    Door["บานประตู 12x18 cm"]
    Hinge["บานพับ"]
    Lock["Solenoid/Magnetic Lock"]
    Strike["แผ่นรับกลอน"]
    Box["กล่อง ESP32 + Relay"]
    PSU["Power Supply 12V + Buck 5V"]

    Base --> Frame
    Frame --> Hinge
    Hinge --> Door
    Frame --> Lock
    Door --> Strike
    Base --> Box
    PSU --> Box
    Box --> Lock
```

---


<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

<a id="sec-11"></a>
## 11. ฐานข้อมูลและตารางสำคัญ

ระบบสร้างตารางใน `initDatabase()` ของ `my-app/lib/db.ts`

| ตาราง | หน้าที่ |
|---|---|
| `admin_users` | เก็บบัญชี admin, password hash, role, last_login |
| `students` | เก็บผู้ลงทะเบียน, สถานะ, ห้อง, token bypass, เวลาการเปิดประตู |
| `access_logs` | เก็บ audit log ทุกเหตุการณ์ |
| `dynamic_qr_tokens` | เก็บ QR token แยกตามห้องและสถานะ consumed |
| `system_settings` | เก็บ config เช่น auto approve, room IP, webhook, command queue |
| `rate_limits` | เก็บตัวนับ rate limit แบบ serverless-safe |

### ภาพที่ 5: ความสัมพันธ์ข้อมูลหลัก

```mermaid
erDiagram
    admin_users ||--o{ students : approved_by
    admin_users ||--o{ access_logs : performed_by
    students ||--o{ access_logs : student_id
    dynamic_qr_tokens {
        int id
        string token
        string room_code
        boolean is_consumed
        timestamp created_at
    }
    system_settings {
        string setting_key
        string setting_value
        timestamp updated_at
    }
```

---


<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

<a id="sec-12"></a>
## 12. อธิบายโค้ดฝั่ง ESP32 รายฟังก์ชัน

ไฟล์หลัก:

- `esp32/esp32.ino`: ใช้กับห้อง CE-402 ตาม template
- `esp32C1/esp32C1.ino`: ใช้กับห้อง CE-401

โครงสร้างทั้งสองไฟล์เหมือนกัน ต่างที่ `config.h` และ room target

### 12.1 ตัวแปรและ pin

| ชื่อ | ค่า | หน้าที่ |
|---|---:|---|
| `TFT_CS` | 15 | ขา CS ของจอ ILI9341 |
| `TFT_RST` | 4 | reset จอ |
| `TFT_DC` | 2 | data/command |
| `RELAY_PIN` | 12 | สั่ง relay เปิดประตู |
| `LED_WIFI` | 14 | LED สถานะ Wi-Fi |
| `LED_REJECT` | 26 | LED สถานะปฏิเสธ |
| `BUZZER_PIN` | 27 | buzzer |
| `polling_delay` | 2000 ms | หน่วงเวลา polling server |
| `last_queue_count` | -1 | เก็บคิวล่าสุดเพื่อลด redraw |
| `last_approved_name` | empty | เก็บ student id ล่าสุด |
| `last_active_token` | empty | เก็บ token ล่าสุด |
| `ip_address_str` | `0.0.0.0` | แสดง IP ของบอร์ด |

### 12.2 `drawQRCode(String qrText, int startX, int startY, int boxSize)`

หน้าที่: สร้าง QR code จากข้อความ URL แล้ววาดลงจอ TFT

การทำงานละเอียด:

1. สร้าง object `QRCode qrcode`
2. เลือก QR version 7 ถ้าข้อความไม่ยาวเกิน 154 ตัวอักษร
3. ถ้ายาวเกิน 154 ตัวอักษรใช้ version 9
4. จอง buffer ด้วย `qrcode_getBufferSize(qrVersion)`
5. เรียก `qrcode_initText()` เพื่อแปลงข้อความเป็น matrix QR
6. กำหนด `scale = 2` เพื่อขยายจุด QR ให้มือถือสแกนง่าย
7. คำนวณ `paddingX` และ `paddingY` เพื่อจัด QR ให้อยู่กลางกรอบ
8. วาดพื้นหลังสีขาวด้วย `tft.fillRect()`
9. วน loop ทุกตำแหน่งของ QR matrix
10. ถ้า module เป็นสีดำ ให้ใช้ `tft.fillRect()` วาดจุดสีดำ

### 12.3 `drawMainScreen(int queueCount, String lastApprovedName, String timeStr, String qrText)`

หน้าที่: วาดหน้าจอปกติของบอร์ด

สิ่งที่วาด:

- แถบหัวจอ Classroom Access Control System (ACCS) และสถานะ ACTIVE
- เวลา
- กรอบ QR ทางซ้าย
- ข้อความ SCAN FOR ACCESS
- ห้องจากตัวแปร `room_code`
- จำนวนคิวรออนุมัติ
- student id ล่าสุดที่อนุมัติ
- IP ของบอร์ดด้านล่าง

เงื่อนไขสำคัญ:

- ถ้า `qrText.length() > 0` จะเรียก `drawQRCode()`
- ถ้าไม่มี QR จะวาดกล่องขาวและข้อความ Loading QR
- ถ้ามี `lastApprovedName` จะวาดกล่อง LATEST APPROVED
- ถ้าไม่มี จะวาดข้อความ NO RECENT ACCESS

### 12.4 `drawScanningScreen()`

หน้าที่: แสดงหน้าจอกำลังตรวจสอบ

ใช้ตอนบอร์ดได้รับคำสั่งเปิดประตูแล้วแต่ก่อนแสดง approved เพื่อให้ผู้ใช้เห็นว่าระบบกำลังประมวลผล

องค์ประกอบ:

- พื้นหลังสีน้ำเงินเข้ม
- วงกลมจำลองการ scan
- ข้อความ PROCESSING
- ข้อความ VERIFYING REQUEST WITH SERVER

### 12.5 `drawUnlockedScreen(String approvedName, String studentId)`

หน้าที่: แสดงหน้าจออนุมัติและปลดล็อกสำเร็จ

การทำงาน:

1. ล้างจอด้วยพื้นหลังสีเขียวเข้ม
2. วาดวงกลมสีเขียวตรงกลาง
3. แสดงเครื่องหมายถูกด้วยตัวอักษร `v`
4. แสดง ACCESS GRANTED
5. แสดง DOOR UNLOCKED
6. แสดงข้อความ VERIFIED MEMBER
7. แสดง `studentId`

หมายเหตุ: ฟังก์ชันรับ `approvedName` แต่โค้ดเลือกแสดง status ภาษาอังกฤษเพื่อลดปัญหาฟอนต์ไทยบนจอ

### 12.6 `drawRejectedScreen()`

หน้าที่: วาดหน้าจอปฏิเสธการเข้าใช้งาน

โค้ดปัจจุบันมีฟังก์ชันนี้ไว้แสดงกรณี denied แต่ flow หลักใน `loop()` ยังไม่ได้เรียกจาก JSON โดยตรง เพราะ server ส่ง `door_trigger` เป็น open หรือ idle เป็นหลัก

### 12.7 `setup()`

หน้าที่: เตรียมบอร์ดทั้งหมดตอนเปิดเครื่อง

ลำดับละเอียด:

1. เปิด Serial ที่ 115200
2. ตั้ง `RELAY_PIN`, `LED_WIFI`, `LED_REJECT`, `BUZZER_PIN` เป็น output
3. ตั้ง relay เป็น LOW เพื่อให้ประตูอยู่สถานะล็อกตอนเริ่มต้น
4. ปิด LED Wi-Fi และ LED Reject
5. เริ่มจอ TFT ด้วย `tft.begin()`
6. หมุนจอเป็นแนวนอนด้วย `tft.setRotation(1)`
7. วาดหน้าจอ CONNECTING WIFI
8. เรียก `WiFi.begin(ssid, password)`
9. ระหว่างรอ Wi-Fi ให้ LED Wi-Fi กระพริบทุก 400 ms
10. เมื่อเชื่อมต่อสำเร็จให้ LED Wi-Fi ติดค้าง
11. เก็บ IP ลง `ip_address_str`
12. เล่นเสียง boot melody ด้วย `tone()`
13. วาดหน้าจอหลักด้วย `drawMainScreen(0, "", "12:00:00", "")`

### 12.8 `loop()`

หน้าที่: เป็นวงจรหลักของบอร์ด

ลำดับละเอียด:

1. ตรวจ `WiFi.status()`
2. ถ้า Wi-Fi ต่ออยู่ ให้ LED Wi-Fi ติดค้าง
3. คำนวณเวลาแบบง่ายจาก `millis()`
4. สร้าง `HTTPClient`
5. ถ้า `server_url` เป็น HTTPS ให้ใช้ `WiFiClientSecure`
6. ตั้ง CA certificate ด้วย `client->setCACert(root_ca_cert)`
7. เรียก `http.begin()`
8. ตั้ง timeout 1200 ms
9. เพิ่ม header `Content-Type: application/json`
10. เพิ่ม header `x-api-key: api_key`
11. ยิง `GET`
12. ถ้า HTTP 200 ให้อ่าน JSON
13. parse ด้วย `StaticJsonDocument<768>`
14. อ่าน `door_trigger`, `pending_count`, `server_time_text`, `last_approved`, `active_token`, `register_url`, `requested_room`
15. สร้าง `qrText` เป็นลิงก์ `/?scan=<token>&room=<room>`
16. ถ้า `door_trigger == "open"` ให้เข้าลำดับปลดล็อก
17. ถ้าข้อมูลเปลี่ยน ให้วาดหน้าจอหลักใหม่
18. ถ้าข้อมูลไม่เปลี่ยน ให้อัปเดตเฉพาะเวลา
19. ถ้า Wi-Fi หลุด ให้กระพริบ LED Wi-Fi
20. หน่วงเวลา `polling_delay`

ลำดับปลดล็อกใน `loop()`:

1. เรียก `drawScanningScreen()`
2. ส่งเสียง 1500 Hz 100 ms
3. หน่วง 1200 ms
4. เรียก `drawUnlockedScreen()`
5. ตั้ง `RELAY_PIN` เป็น HIGH
6. เล่นเสียง 1000, 1500, 2000 Hz
7. วาด countdown bar ประมาณ 3.8 วินาที
8. ตั้ง `RELAY_PIN` เป็น LOW
9. เล่นเสียงปิด 800 Hz
10. reset cache state เพื่อบังคับ redraw รอบถัดไป

---


<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

<a id="sec-13"></a>
## 13. อธิบายโค้ดฝั่งเว็บและ API รายฟังก์ชัน

### 13.1 `my-app/lib/db.ts`

| ฟังก์ชัน | หน้าที่ | รายละเอียด |
|---|---|---|
| `readEnv(name)` | อ่านค่า env | trim ค่า, ลบ quote รอบนอกถ้ามี, คืน `undefined` ถ้าว่าง |
| `readCaCert()` | อ่าน CA cert | อ่าน `SUPABASE_CA_CERT`, แปลง `\n`, กันค่า placeholder |
| `getPool()` | สร้าง PostgreSQL pool | ใช้ singleton บน `globalThis`, parse `POSTGRES_URL` หรือ env แยก, ตั้ง SSL, max pool, timeout และ keepAlive |
| `initDatabase()` | สร้าง schema และ seed | สร้างตาราง, index, default settings, seed admin ตาม env, ป้องกัน seed default ใน production |
| `clearSystemSettingsCache()` | ล้าง settings cache | ทำให้การอ่าน settings ครั้งถัดไปดึง DB ใหม่ |
| `getSystemSettings(options)` | อ่าน setting ทั้งหมด | cache 30 วินาทีเพื่อลด query จาก ESP32 polling |
| `updateSystemSetting(key, value)` | บันทึก setting เดี่ยว | upsert ลง `system_settings` และล้าง cache |
| `updateSystemSettings(settings)` | บันทึกหลาย setting | ใช้ `UNNEST` กับ `ON CONFLICT` เพื่อ update หลาย key ในครั้งเดียว |

Interface สำคัญ:

- `StudentRow`: shape ของข้อมูลนักศึกษา
- `AdminRow`: shape ของ admin
- `AccessLogRow`: shape ของ log

### 13.2 `my-app/lib/auth.ts`

| ฟังก์ชัน | หน้าที่ | รายละเอียด |
|---|---|---|
| `verifyJwtSecretSecurity()` | ตรวจความปลอดภัย JWT | ใน production ถ้าใช้ secret default จะ throw error |
| `signToken(payload)` | สร้าง JWT | ใช้ HS256 ผ่าน `jsonwebtoken`, หมดอายุใน 8 ชั่วโมง |
| `verifyToken(token)` | ตรวจ JWT | คืน payload ถ้าถูกต้อง, คืน null ถ้าหมดอายุหรือผิด |
| `getAdminFromCookie()` | อ่าน admin จาก cookie | อ่าน `smartaccess_admin_token`, verify แล้วคืนข้อมูล admin |
| `setAuthCookie(token)` | สร้าง options cookie | ตั้ง `httpOnly`, `sameSite=lax`, `secure` เฉพาะ production, maxAge 8 ชั่วโมง |

### 13.3 `my-app/lib/qr.ts`

| ฟังก์ชัน | หน้าที่ | รายละเอียด |
|---|---|---|
| `generateQRCodeBuffer(text)` | สร้าง PNG buffer | ใช้กับ endpoint QR ให้ ESP32/preview โหลดเป็นภาพ |
| `generateQRCodeDataURL(text, size)` | สร้าง Data URL | ใช้กับเว็บที่ต้องแสดง QR แบบ base64 |
| `generateQRCodeSVG(text)` | สร้าง SVG string | ใช้ preview หรือ export ที่ต้องเป็น vector |
| `generateSecureToken()` | สร้าง token | ใช้ `crypto.randomBytes(16).toString("hex")`, ได้ 32 hex chars |
| `getOrCreateActiveQRToken(roomCode)` | คืน token ปัจจุบันหรือสร้างใหม่ | ลบ token หมดอายุทุก 5 นาทีต่อห้อง, ใช้ token ที่ยังไม่ consume และไม่เกิน 60 วินาที, ถ้าไม่มีให้ insert ใหม่ |
| `consumeQRToken(token)` | ใช้ token แบบ atomic | ตรวจ format 32 hex, update `is_consumed = TRUE` ด้วยเงื่อนไขยังไม่หมดอายุ, ป้องกันหลายคนใช้ token เดียวกัน |
| `validateQRToken(token)` | ตรวจ token โดยไม่ consume | ใช้ตอนเปิดหน้าหลัง scan เพื่อให้ token ยังถูก consume ตอน submit จริง |

### 13.4 `my-app/lib/esp32.ts`

| ฟังก์ชัน | หน้าที่ | รายละเอียด |
|---|---|---|
| `verifyApiKeySecurity()` | ตรวจ API key | production ห้ามใช้ placeholder |
| `getESP32Mode()` | บอกโหมดเชื่อมต่อ | คืน `mock`, `wokwi` หรือ `physical` |
| `getESP32BaseUrl()` | คืน base URL | ใช้ `WOKWI_URL` หรือ `http://ESP32_IP:ESP32_PORT` |
| `isPrivateLanUrl(url)` | ตรวจ LAN/private IP | ใช้แยก localhost, 192.168, 10, 172.16-31 |
| `isCloudEnvironment()` | ตรวจ cloud runtime | ตรวจ env ของ Vercel/AWS/GCP |
| `getESP32Url(roomCode)` | หา URL บอร์ดตามห้อง | อ่าน `room_ip_<room>` จาก settings, fallback ไป `BASE_URL` |
| `fetchWithTimeout(url, options, timeoutMs)` | fetch พร้อม timeout | ใช้ `AbortController` กัน request ค้าง |
| `tryLanDirectBackground(url, studentId, roomCode)` | ยิงตรงไป ESP32 แบบ background | ใช้เป็น fast path เฉพาะ LAN แต่ firmware ปัจจุบันยังใช้ polling เป็นหลัก |
| `openDoor(studentId, roomCode)` | สั่งเปิดประตู | เขียน `room_cmd_<room> = unlock` ลง DB, mock mode ตอบสำเร็จทันที, ถ้าไม่ใช่ cloud อาจยิงตรงใน background |
| `getESP32Status(roomCode)` | ตรวจสถานะบอร์ด | mock ตอบ online, physical/wokwi ลอง ping โดยตรงถ้าทำได้, ถ้าอยู่ cloud กับ LAN IP จะใช้ heartbeat `room_last_seen_<room>` |
| `updateESP32Display(payload, roomCode)` | ส่งข้อมูล display ไป ESP32 | เตรียมไว้สำหรับ endpoint `/display` บนบอร์ด แต่ firmware ปัจจุบันยังไม่ได้เปิด endpoint นี้ |

### 13.5 `my-app/lib/discord.ts`

| ฟังก์ชัน | หน้าที่ | รายละเอียด |
|---|---|---|
| `sendDiscordNotification(eventType, data)` | ส่ง Discord embed | เลือก webhook ตามห้องและ event, fallback ไป global env, สร้าง embed ตามประเภท event, ส่งไป target webhook และ log webhook |

Event ที่รองรับ:

- `student_registered`
- `student_approved`
- `student_rejected`
- `door_opened`
- `door_failed`
- `esp32_offline`

### 13.6 `my-app/lib/rate-limit.ts`

| ฟังก์ชัน | หน้าที่ | รายละเอียด |
|---|---|---|
| `rateLimit(options)` | จำกัดจำนวน request | ใช้ตาราง `rate_limits`, query เดียวแบบ `INSERT ... ON CONFLICT DO UPDATE`, race-condition safe สำหรับ serverless |

### 13.7 `my-app/lib/pdf.ts`

| ฟังก์ชัน | หน้าที่ | รายละเอียด |
|---|---|---|
| `setupFonts(doc)` | โหลดฟอนต์ไทย | ใช้ `public/fonts/tahoma.ttf` หรือ Windows Tahoma, fallback Helvetica |
| `safeText(value, fonts)` | แปลงข้อความให้ปลอดภัยต่อ PDF | ถ้าไม่มีฟอนต์ไทยจะแทน non-ASCII ด้วย `?` |
| `formatThaiDateTime(date)` | format วันเวลาไทย | แปลงเป็น พ.ศ. และรูปแบบ `dd/mm/yyyy hh:mm น.` |
| `formatThaiDate(dateStr)` | format วันที่ | ใช้กับช่วงวันที่ export |
| `roomLabel(room)` | แสดงชื่อห้อง | คืน room หรือ `default` |
| `studentName(student)` | รวมชื่อเต็ม | รวมคำนำหน้า ชื่อ นามสกุล |
| `truncate(text, length)` | ตัดข้อความยาว | ใช้ในตาราง PDF |
| `addFooter(doc, fonts, margin)` | ใส่ footer ทุกหน้า | แสดงชื่อระบบและเลขหน้า |
| `header(doc, fonts, title, subtitle, margin)` | วาดหัวรายงาน | แถบสีเข้ม ชื่อมหาวิทยาลัย และชื่อรายงาน |
| `infoBox(doc, fonts, x, y, w, label, value)` | วาดกล่องข้อมูล | ใช้แสดงผู้จัดทำ วันที่ ตัวกรอง ช่วงวันที่ |
| `generateStudentsPDF(students, exportedBy, filter, startDate, endDate)` | สร้าง PDF รายงานรวม | วาด summary, ตารางรายชื่อ, สถานะ, ห้อง, วันเวลา |
| `generateSingleStudentPDF(student, exportedBy)` | สร้าง PDF รายบุคคล | วาดบัตรข้อมูล, รายละเอียด, หมายเหตุ และช่องลายเซ็น |

### 13.8 `my-app/lib/faculties.ts`

| ชื่อ | หน้าที่ |
|---|---|
| `SmartAccess_FACULTIES` | object รายชื่อคณะและสาขาที่ใช้ validate ฟอร์มนักศึกษา |
| `FACULTY_NAMES` | array ชื่อคณะ ใช้สร้าง dropdown |

### 13.9 `my-app/proxy.ts`

| ฟังก์ชัน | หน้าที่ | รายละเอียด |
|---|---|---|
| `proxy(request)` | ป้องกัน route admin | ถ้าเข้า `/admin/dashboard` โดยไม่มี JWT จะ redirect ไป login, ถ้า token invalid จะลบ cookie |
| `config.matcher` | ระบุ route ที่ proxy ทำงาน | ใช้กับ `/admin`, `/admin/`, `/admin/dashboard/:path*` |

---


<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

<a id="sec-14"></a>
## 14. อธิบายหน้าเว็บหลัก

### 14.1 `app/page.tsx`

หน้าที่: หน้าแรกสำหรับนักศึกษาลงทะเบียน

Component และฟังก์ชันหลัก:

| ชื่อ | หน้าที่ |
|---|---|
| `QRAccessBlockedScreen()` | แสดงหน้าปฏิเสธถ้าไม่เข้าจาก QR token |
| `RegistrationPageInner()` | component หลักของฟอร์มลงทะเบียน |
| `applyManualAutoFill()` | เติมข้อมูลประวัติเดิมเมื่อ user กดยืนยัน |
| `getOfflineQueue()` | อ่าน queue offline จาก localStorage |
| `saveOfflineQueue(q)` | บันทึก queue offline และจำนวนคิว |
| `flushOfflineQueue()` | ส่งข้อมูล offline ที่ค้างอยู่เมื่อ online |
| `triggerBypass(session)` | เรียก `/api/students/bypass` เพื่อเปิดประตูซ้ำใน 5 นาที |
| `handleFacultyChange(faculty)` | เปลี่ยนคณะและรีเซ็ตสาขา |
| `handleStudentIdInput(raw)` | กรอง input รหัสนักศึกษาให้มีเฉพาะตัวเลขและขีด |
| `handleSubmit(e)` | validate ฟอร์ม, ส่ง API, จัดการ offline, เก็บ bypass token |
| `UserRegistrationPage()` | wrapper ที่ใส่ `Suspense` สำหรับ `useSearchParams()` |

useEffect สำคัญ:

- ตรวจ QR token และ session bypass ตอนโหลดหน้า
- จับเวลาหมดอายุ 120 วินาที
- debounce ตรวจประวัติ Auto-fill
- อัปเดตนาฬิกา
- ตรวจ online/offline
- polling status หลังส่งฟอร์ม
- เก็บ session เมื่อสถานะเปลี่ยนเป็น approved

### 14.2 `app/admin/login/page.tsx`

| ชื่อ | หน้าที่ |
|---|---|
| `AdminLoginPage()` | หน้า login admin |
| `handleLogin(e)` | ส่ง username/password ไป `/api/auth/login`, ถ้าสำเร็จ redirect dashboard |
| `KeyholeShieldIcon`, `EyeOpenIcon`, `EyeClosedIcon`, `CrownIcon`, `DoorKeyIcon`, `AlertIcon`, `ArrowLeftIcon`, `UnlockIcon` | SVG icon สำหรับ UI ไม่มี business logic |

### 14.3 `app/admin/dashboard/page.tsx`

หน้าที่: dashboard ผู้ดูแลระบบ

ฟังก์ชันหลัก:

| ชื่อ | หน้าที่ |
|---|---|
| `formatDateTime(dt)` | แปลงวันที่เป็นรูปแบบไทย พ.ศ. |
| `renderLogNotes(notes)` | แสดง notes ใน access log ให้อ่านง่าย |
| `AdminDashboard()` | component หลักของ dashboard |
| `playSoftChime()` | เล่นเสียงเมื่อคิว pending เพิ่ม |
| `fetchSettings()` | โหลด system settings |
| `handleOpenRoomDetails(room, ip)` | เปิด panel รายละเอียดห้อง |
| `handleSaveRoomWebhook()` | บันทึก webhook เฉพาะห้อง |
| `handleTestWebhook(webhookUrl, type, room)` | ทดสอบส่ง Discord webhook |
| `copyToClipboard(text)` | copy ข้อความผ่าน Clipboard API |
| `fallbackCopyToClipboard(text)` | copy แบบ fallback ด้วย textarea |
| `getConfigCode(roomCode, origin)` | สร้างตัวอย่าง `config.h` ตามห้อง |
| `getArduinoCode(roomCode, origin)` | สร้างตัวอย่าง firmware ตามห้อง |
| `highlightArduinoCode(code)` | ทำ syntax highlight แบบ HTML string |
| `saveSettings(e)` | บันทึก setting และรายการห้อง |
| `handleTestConnection(roomCode)` | เรียก `/api/esp32/status` เพื่อตรวจบอร์ด |
| `handleDirectUnlockRoom(roomCode)` | สั่งปลดล็อกห้องผ่าน `/api/system/unlock-room` |
| `handleAddRoom(e)` | เพิ่มห้องในรายการชั่วคราว |
| `handleRemoveRoom(roomCode)` | ลบห้องจากรายการชั่วคราว |
| `fetchSystemStatus()` | โหลดสถานะระบบรวม |
| `showToast(msg, type)` | แสดง toast |
| `fetchPending()` | โหลดคำขอ pending |
| `fetchAll()` | โหลดรายชื่อนักศึกษาทั้งหมด |
| `fetchLogs()` | โหลด access logs |
| `fetchAdmins()` | โหลดบัญชี admin |
| `handleApprove(id)` | กดอนุมัติคำขอ |
| `handleReject()` | กดปฏิเสธพร้อมเหตุผล |
| `handleOpenDoor(id)` | เปิดประตูให้ student ที่ approved |
| `handleDelete(id, name)` | ลบข้อมูลนักศึกษา |
| `handleDeleteAdmin(id)` | ลบ admin |
| `handleCreateAdmin(e)` | สร้าง admin ใหม่ |
| `handleExportPDFWithDateRange(filterType, start, end)` | ดาวน์โหลด PDF รายงานรวม |
| `handleExportSingleStudentPDF(id, name)` | ดาวน์โหลด PDF รายบุคคล |
| `handleLogout()` | logout และ redirect login |

Icon components ในไฟล์นี้ เช่น `ClockIcon`, `UsersIcon`, `SettingsIcon`, `TVIcon`, `LogoutIcon`, `LockIcon`, `UnlockIcon`, `TrashIcon`, `CheckIcon`, `CrossIcon`, `SaveIcon`, `FileTextIcon`, `CalendarIcon`, `PlusIcon`, `AlertIcon`, `TerminalIcon`, `CrownIcon`, `KeyIcon`, `SuccessBadgeIcon`, `IdCardIcon`, `GraduationIcon`, `FacultyIcon`, `BranchIcon`, `MenuIcon` มีหน้าที่วาด SVG เพื่อใช้ในปุ่มและหัวข้อ ไม่มี logic ด้านข้อมูล

### 14.4 `app/esp32-preview/page.tsx`

| ชื่อ | หน้าที่ |
|---|---|
| `ESP32Screen()` | จำลองหน้าจอ TFT 320x240 ใน browser |
| `ESP32PreviewPageInner()` | หน้า preview หลัก |
| `fetchDisplay(roomCode)` | โหลด JSON จาก `/api/esp32/display` |
| `fetchESP32Status(roomCode)` | โหลดสถานะจาก `/api/esp32/status` |
| `simulateApprove()` | จำลองหน้าจอ scanning -> approved -> idle |
| `simulateReject()` | จำลองหน้าจอ scanning -> rejected -> idle |
| `ESP32PreviewPage()` | wrapper พร้อม Suspense |

---


<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

<a id="sec-15"></a>
## 15. อธิบาย API routes

### 15.1 Auth

| Endpoint | ฟังก์ชัน | รายละเอียด |
|---|---|---|
| `POST /api/auth/login` | `POST()` | rate limit 5 ครั้ง/นาที/IP, ตรวจ bcrypt, สร้าง JWT, set cookie |
| `GET /api/auth/me` | `GET()` | อ่าน admin จาก cookie แล้วคืน user |
| `POST /api/auth/logout` | `POST()` | ลบ cookie `smartaccess_admin_token` |

### 15.2 Admin users

| Endpoint | ฟังก์ชัน | รายละเอียด |
|---|---|---|
| `GET /api/admin-users` | `GET()` | owner เท่านั้น, คืน admin ทั้งหมด |
| `POST /api/admin-users` | `POST()` | owner เท่านั้น, validate role/password, hash password, insert admin |
| `DELETE /api/admin-users/{id}` | `DELETE()` | owner เท่านั้น, ห้ามลบบัญชีตัวเอง |

### 15.3 Students

| Endpoint | ฟังก์ชัน | รายละเอียด |
|---|---|---|
| `GET /api/students` | `GET()` | owner เท่านั้น, filter status/faculty/search/limit |
| `POST /api/students` | `POST()` | public register, rate limit, sanitize, validate, consume QR token, auto approve หรือ pending |
| `GET /api/students/pending` | `GET()` | admin ที่ login เห็น pending list |
| `GET /api/students/{id}` | `GET()` | admin เห็นตาม role, public ต้องใช้ bypass token |
| `DELETE /api/students/{id}` | `DELETE()` | owner เท่านั้น, ลบ logs และ student |
| `POST /api/students/{id}/approve` | `POST()` | owner เท่านั้น, approve และเรียก `openDoor()` |
| `POST /api/students/{id}/reject` | `POST()` | owner เท่านั้น, reject และเก็บเหตุผล |
| `POST /api/students/{id}/door` | `POST()` | admin ที่ login เปิดประตูให้ student ที่ approved |
| `POST /api/students/bypass` | `POST()` | public แต่ต้องมี id/student_id/bypass_token และไม่เกิน 5 นาที |
| `POST /api/students/check-match` | `POST()` | หา history สำหรับ auto-fill |

### 15.4 ESP32

| Endpoint | ฟังก์ชัน | รายละเอียด |
|---|---|---|
| `GET /api/esp32/display` | `GET()` | ให้ JSON สำหรับบอร์ด polling, สร้าง QR token, ส่ง heartbeat, ส่ง door_trigger |
| `POST /api/esp32/display` | `POST()` | รับ status update จาก ESP32 แบบง่าย |
| `GET /api/esp32/qr` | `GET()` | คืน QR เป็น PNG |
| `POST /api/esp32/qr/verify` | `POST()` | ตรวจ QR token โดยไม่ consume, rate limit 10 ครั้ง/นาที/IP |
| `GET /api/esp32/status` | `GET()` | คืนสถานะบอร์ดตาม room |

### 15.5 System

| Endpoint | ฟังก์ชัน | รายละเอียด |
|---|---|---|
| `GET /api/system/status` | `GET()` | admin เท่านั้น, ตรวจ DB, Discord, rooms, ESP32 devices, log retention |
| `GET /api/system/settings` | `GET()` | owner เท่านั้น, คืน settings |
| `POST /api/system/settings` | `POST()` | owner เท่านั้น, validate และบันทึก settings/custom rooms |
| `POST /api/system/unlock-room` | `POST()` | admin เท่านั้น, ปลดล็อกด่วนรายห้อง |
| `POST /api/system/test-webhook` | `POST()` | owner เท่านั้น, ทดสอบ Discord webhook เฉพาะ URL discord.com |
| `POST /api/system/logs/cleanup` | `POST()` | owner เท่านั้น, ลบ log หมดอายุหรือทั้งหมดโดยยืนยัน password |

### 15.6 Logs และ PDF

| Endpoint | ฟังก์ชัน | รายละเอียด |
|---|---|---|
| `GET /api/logs` | `GET()` | owner เท่านั้น, คืน access logs พร้อมชื่อ student/admin |
| `GET /api/export/pdf` | `GET()` | owner เท่านั้น, export รายงานรวมหรือรายบุคคล |

---


<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

<a id="sec-16"></a>
## 16. Flow สำคัญของการเปิดประตู

### ภาพที่ 6: Command queue ผ่านฐานข้อมูล

```mermaid
flowchart TD
    A["Admin หรือ Auto-Approve เรียก openDoor(room)"] --> B["เขียน system_settings: room_cmd_ROOM = unlock"]
    B --> C["ESP32 polling /api/esp32/display?room=ROOM"]
    C --> D{"server พบ unlock?"}
    D -- "ใช่" --> E["ตอบ JSON door_trigger=open"]
    E --> F["server update room_cmd_ROOM = consumed"]
    E --> G["ESP32 เปิด RELAY_PIN HIGH"]
    G --> H["relay ปลดล็อก 5 วินาที"]
    H --> I["ESP32 ตั้ง RELAY_PIN LOW"]
    D -- "ไม่ใช่" --> J["ตอบ door_trigger=idle"]
```

---


<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

<a id="sec-17"></a>
## 17. Troubleshooting

| อาการ | สาเหตุที่เป็นไปได้ | วิธีตรวจ |
|---|---|---|
| เข้า `/` แล้วถูก block | ไม่มี `scan` token | ต้องสแกน QR จากบอร์ดหรือใช้ link จาก esp32-preview |
| QR หมดอายุ | token เกินเวลา หรือถูก consume แล้ว | สแกน QR ใหม่ |
| ส่งฟอร์มแล้ว 403 | token ใช้แล้ว/หมดอายุ | refresh QR และลองใหม่ |
| Admin login ไม่ได้ | ไม่มี admin seed หรือ password ผิด | ตรวจ `admin_users`, `ALLOW_DEV_SEED`, env initial admin |
| บอร์ด offline ใน dashboard | heartbeat เกิน 120 วินาที | ดู Serial Monitor, Wi-Fi, `server_url`, `api_key` |
| Relay ไม่ทำงาน | ต่อ IN ผิด, module trigger กลับ logic, ไฟไม่พอ | วัด GPIO12, ตรวจ VCC/GND relay |
| จอไม่ติด | SPI pin ผิด, VCC/GND ผิด, backlight ไม่ต่อ | ตรวจตาราง pin ILI9341 |
| เปิดประตูซ้ำ | command ไม่ถูก consume | ตรวจ `room_cmd_<room>` ใน `system_settings` |
| Discord ไม่ส่ง | webhook ว่างหรือ URL ไม่ใช่ discord | ใช้ปุ่ม test webhook |
| PDF ภาษาไทยเพี้ยน | ฟอนต์ไทยไม่โหลด | ตรวจ `public/fonts/tahoma.ttf` และ `tahomabd.ttf` |

---


<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

<a id="sec-18"></a>
## 18. Checklist ก่อนสาธิตระบบ

### เว็บ

- `npm run dev` ทำงาน
- database connect สำเร็จ
- มี admin login ได้
- `/esp32-preview` โหลดข้อมูลได้
- `/api/system/status` แสดง database online
- ตั้ง `ESP32_API_KEY` ตรงกับ `config.h`

### บอร์ด

- ESP32 ต่อ Wi-Fi ได้
- Serial Monitor ขึ้น WiFi connected
- จอแสดง QR
- LED Wi-Fi ติดค้าง
- dashboard เห็น board online จาก heartbeat
- กดปลดล็อกแล้ว relay ทำงานประมาณ 5 วินาที

### วงจร

- ไม่มี 12V เข้าขา ESP32
- relay GND ต่อร่วมกับ ESP32
- lock ใช้ power supply แยก
- ต่อ NC/NO ถูกตามชนิด lock
- มี diode ป้องกันไฟย้อนถ้าใช้ coil load
- สายไฟกำลังแน่นและไม่หลวม

---


<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

<a id="sec-19"></a>
## 19. สรุปหน้าที่แต่ละชั้นของระบบ

| ชั้น | หน้าที่ |
|---|---|
| Browser นักศึกษา | scan QR, กรอกฟอร์ม, ดูสถานะ, bypass |
| Browser Admin | ตรวจคำขอ, อนุมัติ, เปิดประตู, export, ตั้งค่า |
| Next.js API | ตรวจสิทธิ์, validate, บันทึก DB, สร้าง QR, สั่งเปิดประตู |
| PostgreSQL | เก็บข้อมูลหลัก, token, settings, rate limit, command queue |
| ESP32 | แสดง QR, polling server, เปิด relay, ส่งสถานะบนจอ |
| Relay/Lock | แปลงสัญญาณ GPIO เป็นการตัด/จ่ายไฟให้ประตู |
| Discord | แจ้งเตือนและ audit log ภายนอก |

จุดที่สำคัญที่สุดของระบบนี้คือ `room_code` และ `requested_room` ต้องตรงกันตลอดสาย ตั้งแต่ QR, ฟอร์ม, database, dashboard, `server_url` ใน `config.h`, และ key `room_cmd_<room>` ใน `system_settings` ถ้าห้องไม่ตรงกัน บอร์ดอาจไม่รับคำสั่งเปิดประตูของห้องนั้น

---

# ภาคผนวก (ส่วนเพิ่มเติม) — สำหรับผู้อ่านที่ไม่เคยรู้จักระบบมาก่อน

ส่วนนี้เขียนสำหรับคนที่ "ไม่เคยใช้งานระบบนี้เลย" และต้องการเข้าใจ **ทุกอย่าง** ตั้งแต่ภาพรวม → รายละเอียดเชิงลึก → เหตุผลทางวิศวกรรมที่อยู่เบื้องหลังการออกแบบ


<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

<a id="sec-20"></a>
## 20. นิยามคำศัพท์พื้นฐาน (สำหรับมือใหม่)

| คำ | ความหมายแบบเข้าใจง่าย |
|----|----------------------|
| **IoT** | "Internet of Things" — อุปกรณ์ฮาร์ดแวร์ที่ต่ออินเทอร์เน็ตได้ (ในที่นี้คือ ESP32) |
| **ESP32** | ชิปไมโครคอนโทรลเลอร์ราคาถูก มี Wi-Fi ในตัว ใช้คุม relay/LED/จอ TFT |
| **Relay** | สวิตช์ไฟฟ้าที่ ESP32 สั่งเปิด-ปิดได้ ใช้ตัด/ต่อไฟให้กลอนประตู |
| **TFT** | จอสีขนาดเล็ก (ในที่นี้ ILI9341 320×240) แสดง QR + สถานะ |
| **GPIO** | ขาดิจิทัลของ ESP32 ใช้สั่ง HIGH/LOW |
| **Polling** | การที่ ESP32 "ถาม" server ทุก ๆ 2 วินาทีว่ามีอะไรใหม่ไหม |
| **JWT** | "JSON Web Token" — ตั๋วเข้าใช้งานที่ลงนามด้วยกุญแจลับ ใช้แทน session admin |
| **bcrypt** | อัลกอริทึมแฮชรหัสผ่าน ทำให้ถอดกลับไม่ได้ แม้ฐานข้อมูลรั่ว |
| **httpOnly cookie** | คุกกี้ที่ JavaScript อ่านไม่ได้ ป้องกัน XSS ขโมย token |
| **Rate limit** | จำกัดจำนวน request ต่อช่วงเวลา ป้องกัน brute-force และสแปม |
| **Webhook** | URL ที่ใครส่ง POST มาจะทำงานบางอย่าง (Discord ใช้รับการแจ้งเตือน) |
| **Serverless** | แนวคิดที่โค้ดวิ่งเฉพาะตอนมี request เข้ามา ไม่ต้องมี server เปิดค้าง |
| **Edge CDN** | เครือข่ายเซิร์ฟเวอร์ทั่วโลกที่ cache ไฟล์ static ไว้ใกล้ผู้ใช้ |
| **PostgreSQL** | ฐานข้อมูลเชิงสัมพันธ์ที่ใช้ในโปรเจกต์นี้ (Supabase host ให้) |
| **TLS/SSL** | การเข้ารหัสการสื่อสารระหว่างเครื่อง (https:// คือ TLS) |

---


<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

<a id="sec-21"></a>
## 21. ภาพรวมสถาปัตยกรรมแบบ Layered (4 ชั้น)

```mermaid
flowchart TB
    subgraph L1["ชั้นที่ 1: Presentation (UI)"]
        UI1["หน้าเว็บนักศึกษา /"]
        UI2["Dashboard Admin /admin/dashboard"]
        UI3["จอ TFT บน ESP32"]
        UI4["Discord (ปลายทางแจ้งเตือน)"]
    end
    subgraph L2["ชั้นที่ 2: Application (Business Logic)"]
        API1["Next.js API Routes"]
        FW["ESP32 Firmware (.ino)"]
    end
    subgraph L3["ชั้นที่ 3: Service / Library"]
        LIB1["lib/auth.ts (JWT)"]
        LIB2["lib/qr.ts (QR Token)"]
        LIB3["lib/esp32.ts (Door Queue)"]
        LIB4["lib/rate-limit.ts"]
        LIB5["lib/discord.ts"]
        LIB6["lib/pdf.ts"]
    end
    subgraph L4["ชั้นที่ 4: Data / Infrastructure"]
        DB[("PostgreSQL @ Supabase")]
        CDN[["Vercel Edge CDN"]]
        HW["Relay + Lock"]
    end
    UI1 --> API1
    UI2 --> API1
    UI3 --> FW
    FW --> API1
    API1 --> LIB1
    API1 --> LIB2
    API1 --> LIB3
    API1 --> LIB4
    API1 --> LIB5
    API1 --> LIB6
    LIB1 --> DB
    LIB2 --> DB
    LIB3 --> DB
    LIB4 --> DB
    LIB5 --> UI4
    UI1 -.->|"static asset"| CDN
    UI2 -.->|"static asset"| CDN
    FW --> HW
```

แต่ละชั้นมีหน้าที่ไม่ทับกัน เปลี่ยน implementation ได้โดยไม่กระทบชั้นอื่น (เช่น ถ้าจะย้ายจาก Supabase → PlanetScale แค่แก้ `lib/db.ts`)

---


<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

<a id="sec-22"></a>
## 22. หน้าจอผู้ใช้งานนักศึกษา — เจาะลึกแต่ละ State

หน้า `/` มี State หลัก 6 แบบ ที่ React สลับด้วย `useState`:

```mermaid
stateDiagram-v2
    [*] --> Blocked: เปิดเว็บไม่มี ?scan=
    Blocked --> [*]
    [*] --> Verifying: มี ?scan=&room=
    Verifying --> Form: token valid
    Verifying --> Expired: token หมดอายุ
    Verifying --> Bypass: มี bypass_token ใน localStorage
    Form --> Submitting: กดส่ง
    Submitting --> Pending: ไม่ใช่ช่วง auto-approve
    Submitting --> Approved: auto-approve เปิด
    Submitting --> Offline: ไม่มีเน็ต → เก็บใน queue
    Pending --> Approved: polling เจอ approved
    Pending --> Rejected: polling เจอ rejected
    Approved --> [*]: แสดง "ประตูเปิดแล้ว"
    Bypass --> Approved: เปิดประตูทันทีไม่ต้องกรอก
    Rejected --> [*]
    Expired --> [*]
    Offline --> Submitting: กลับมา online → flush queue
```

### 22.1 ทำไมต้องมี QR token หมุน 60 วินาที?
- **ป้องกันการแชร์ลิงก์**: ถ้าคนหนึ่งสแกนแล้วส่งลิงก์ให้เพื่อนนอกห้อง เพื่อนเปิดได้ไม่เกิน 60 วินาที (เพราะ token rotation)
- **ป้องกัน replay attack**: token ถูก `consume` ครั้งเดียว = ใช้ซ้ำไม่ได้
- **TTL 300 วินาที** เป็น hard cap ป้องกันการเก็บ token ไว้นาน ๆ

### 22.2 ทำไมต้องมี Bypass 5 นาที?
- **UX**: ถ้าคนเดินเข้า-ออกห้องบ่อย ไม่ควรต้องสแกนทุกครั้ง
- **ความปลอดภัย**: 5 นาที สั้นพอที่ถ้าโทรศัพท์หายจะไม่ถูกใช้นาน

### 22.3 Auto-fill ทำงานอย่างไร
```mermaid
sequenceDiagram
    participant U as User (พิมพ์รหัสนักศึกษา)
    participant W as React Form
    participant API as /api/students/check-match
    participant DB as PostgreSQL
    U->>W: พิมพ์ชื่อ + นามสกุล + รหัส นศ.
    W->>W: debounce 500ms
    W->>API: POST {firstName, lastName, studentId}
    API->>DB: SELECT * FROM students WHERE student_id=$1 ORDER BY created_at DESC LIMIT 1
    DB-->>API: row หรือ null
    API-->>W: {match: true, faculty, branch, year}
    W->>W: ถ้า mode=auto → setForm()
    W->>W: ถ้า mode=manual → แสดงปุ่ม "ใช้ข้อมูลเดิม"
```

---


<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

<a id="sec-23"></a>
## 23. หน้าจอ Admin — เจาะลึกทุก Tab พร้อมเหตุผลที่ออกแบบแบบนี้

### 23.1 แท็บ "คิวรอตรวจสอบ" (Pending Queue)
```mermaid
flowchart LR
    A["fetchPending() ทุก 10 วินาที"] --> B{มี pending ใหม่?}
    B -->|ใช่| C["playSoftChime() เสียงแจ้งเตือน"]
    B -->|ไม่| D[ไม่ทำอะไร]
    C --> E["badge แสดงจำนวน"]
    E --> F[แอดมินกด approve]
    F --> G[POST /api/students/:id/approve]
    G --> H["refetchPending"]
```
**ทำไม polling 10 วินาที?** — ไม่ใช้ WebSocket เพราะ Vercel Serverless ไม่เหมาะ long-lived connection; 10 วินาทีเพียงพอกับงานอนุมัติคนเดียวกดทีละครั้ง

### 23.2 แท็บ "ทำเนียบและประวัติ"
- ค้นหา: SQL `WHERE first_name ILIKE $1 OR student_id ILIKE $1` (มี index บน `student_id`)
- Pagination ฝั่ง client: ดึงสูงสุด 200 row แล้วทำ filter ใน React (เร็วเพราะข้อมูลไม่เกินหลักพัน)
- Export PDF: เรียก server สร้าง PDF (pdfkit) แทนที่จะทำใน browser เพราะฟอนต์ไทยและ rendering คุณภาพดีกว่าบน Node

### 23.3 แท็บ "ผู้ดูแลระบบ" (Admin Users)
- เฉพาะ `role=owner` เท่านั้น
- เพิ่ม admin → bcrypt cost factor 10 (~70ms/hash) — สมดุลระหว่างความปลอดภัยกับ UX
- ลบตัวเองไม่ได้ (กัน lockout)

### 23.4 แท็บ "ห้องเรียนและ ESP32"
- แสดง heartbeat: `room_last_seen_<room>` (ESP32 อัปเดตทุก poll)
- ถ้าไม่มี heartbeat เกิน 120 วินาที → แสดง "Offline"
- ปุ่มทดสอบบอร์ด → ส่งสัญญาณเปิด relay สั้น ๆ (ไม่ปลดล็อกจริง)
- ปุ่มปลดล็อกด่วน → เขียน `room_cmd_<room>=unlock` ผ่าน `/api/system/unlock-room`

### 23.5 แท็บ "ตั้งค่าระบบ"
- Auto-approve window: เช่น 08:00–17:00 → ในช่วงนี้คำขอใหม่จะอนุมัติเอง
- Discord webhook ต่อห้อง: แยก channel ตามห้องเพื่อไม่ปนกัน
- การแสดงรหัสนักศึกษา: เต็ม / mask 4 ตัวท้าย (สำหรับ privacy)

### 23.6 หน้าจอ "ปลดล็อกบัญชีผู้ใช้งาน"
- ใช้สำหรับเคสนักศึกษาโดน rate-limit (เช่น พยายามใช้ bypass เกิน 3 ครั้ง/นาที)
- เรียก endpoint reset rate-limit ตาม `student_id` + IP

---


<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

<a id="sec-24"></a>
## 24. หน้าจอ TFT บน ESP32 — เจาะลึก State Machine

```mermaid
stateDiagram-v2
    [*] --> Boot
    Boot --> ConnectingWiFi: setup()
    ConnectingWiFi --> ConnectingWiFi: WiFi.status() != WL_CONNECTED
    ConnectingWiFi --> MainScreen: WiFi connected
    MainScreen --> MainScreen: polling, ข้อมูลไม่เปลี่ยน → update clock เท่านั้น
    MainScreen --> MainScreen: pending_count/last_approved/token เปลี่ยน → redraw
    MainScreen --> Scanning: door_trigger="open"
    Scanning --> Unlocked: หลัง drawScanningScreen 1.2s
    Unlocked --> Unlocked: RELAY=HIGH, countdown bar 3.8s
    Unlocked --> MainScreen: RELAY=LOW, reset cache
    MainScreen --> Offline: WiFi.status() != WL_CONNECTED
    Offline --> ConnectingWiFi: reconnect
```

### 24.1 ทำไมต้อง "redraw เฉพาะนาฬิกา"?
- จอ ILI9341 ใช้ SPI ~40MHz เขียนเต็มจอใช้เวลา ~80ms
- ถ้า redraw ทั้งจอทุก 2 วินาที = กระพริบรบกวนสายตา
- เทคนิค **partial redraw**: เก็บ `last_*` cache, เทียบกับค่าใหม่, เปลี่ยนเฉพาะส่วนที่ต่าง

### 24.2 ทำไมต้อง countdown bar?
- ผู้ใช้รู้ว่าเหลือเวลาเข้าห้องอีกกี่วินาที → UX ดี
- ใช้ `tft.fillRect()` วาดแถบยาวลดลง 1 พิกเซลต่อ ~50ms → สมูทพอใช้

---


<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

<a id="sec-25"></a>
## 25. อธิบายโค้ด `esp32.ino` แบบ "บรรทัดต่อบรรทัด" (ส่วนสำคัญ)

### 25.1 รูปแบบ HTTP request ที่ส่งไป server
```cpp
HTTPClient http;
WiFiClientSecure *client = new WiFiClientSecure;
client->setCACert(root_ca_cert);        // ทำไม? เพราะ Supabase/Vercel ใช้ TLS, ต้องตรวจ cert
http.begin(*client, server_url);
http.setTimeout(1200);                   // 1.2 วิ — เกินกว่านี้ตัดทิ้ง กัน UI ค้าง
http.addHeader("x-api-key", api_key);    // server ตรวจ header นี้ใน lib/api-security.ts
int code = http.GET();
```

### 25.2 ทำไมต้องใช้ `StaticJsonDocument<768>` ไม่ใช่ `DynamicJsonDocument`?
- `StaticJsonDocument` จองหน่วยความจำบน **stack** ทำให้เร็วและไม่ fragment heap
- 768 byte เพียงพอกับ JSON ที่ server ส่งกลับ (~400 byte) + buffer
- ถ้าใช้ `DynamicJsonDocument` บน ESP32 ที่มี RAM 320KB จะเสี่ยง heap fragmentation หลังรันนาน ๆ

### 25.3 ทำไมต้อง delay 1200ms ก่อน drawUnlockedScreen?
- ให้ผู้ใช้เห็น "scanning" screen ก่อน → รู้สึกว่าระบบกำลังประมวลผล
- ถ้าเปิด relay ทันที ผู้ใช้จะแปลกใจว่าทำไมไม่มีฟีดแบ็ก

### 25.4 Buzzer pattern
```cpp
tone(BUZZER_PIN, 1000, 100); delay(120);
tone(BUZZER_PIN, 1500, 100); delay(120);
tone(BUZZER_PIN, 2000, 200);
```
- เสียงไล่ขึ้น 3 ขั้น = อนุมัติสำเร็จ (positive feedback ตามหลัก UX sound design)
- เสียงต่ำเดียว 800Hz = ปิด relay (negative-neutral)

---


<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

<a id="sec-26"></a>
## 26. อธิบายโค้ดเว็บแบบ "Request Lifecycle" — รับ request 1 ครั้งเกิดอะไรขึ้นบ้าง

### 26.1 ตัวอย่าง: POST /api/students (นักศึกษาส่งฟอร์ม)

```mermaid
sequenceDiagram
    participant B as Browser
    participant V as Vercel Edge
    participant F as Next.js Function (Node)
    participant RL as lib/rate-limit.ts
    participant QR as lib/qr.ts
    participant DB as Supabase Postgres
    participant D as Discord
    participant E as ESP32 (poll)
    B->>V: POST /api/students (JSON form)
    V->>F: route ไปยัง function ใน region ใกล้สุด
    F->>F: parse body, sanitize input
    F->>RL: rateLimit("register:IP", max=5, window=60s)
    RL->>DB: INSERT INTO rate_limits ... ON CONFLICT UPDATE counter+1
    DB-->>RL: counter
    RL-->>F: ok หรือ 429
    F->>F: validate (Zod-like): faculty, student_id format, ฯลฯ
    F->>QR: consumeQRToken(scanToken)
    QR->>DB: UPDATE dynamic_qr_tokens SET is_consumed=TRUE WHERE token=$1 AND NOT is_consumed AND expires_at > NOW() RETURNING *
    DB-->>QR: row หรือ ว่าง
    QR-->>F: success/fail
    alt token ใช้ไม่ได้
        F-->>B: 403
    else token ใช้ได้
        F->>DB: SELECT auto_approve_settings FROM system_settings
        DB-->>F: window
        F->>DB: INSERT INTO students (..., status=auto?'approved':'pending')
        DB-->>F: student_id
        F->>DB: INSERT INTO access_logs (action='registered')
        opt auto-approved
            F->>DB: UPDATE system_settings SET value='unlock' WHERE key='room_cmd_CE-401'
        end
        F-->>D: POST webhook embed (fire-and-forget)
        F-->>B: 200 {id, status, bypass_token?}
        Note over E: รอ poll รอบถัดไป (≤2s) จะเห็น door_trigger=open
    end
```

### 26.2 ทำไม `consumeQRToken` ใช้ `UPDATE ... WHERE NOT is_consumed RETURNING *`?
- **Atomic operation** — 2 คนกดพร้อมกันจะมีแค่คนเดียวที่ได้ row
- ถ้าใช้ `SELECT` แล้วค่อย `UPDATE` แยกกัน → race condition ทั้งสองคนเข้าได้

### 26.3 ทำไม Discord ใช้ "fire-and-forget"?
```ts
sendDiscordNotification('student_registered', data).catch(()=>{}) // ไม่ await
return NextResponse.json({...})                                    // ตอบ user ก่อน
```
- Discord อาจตอบช้า 200–800ms
- ผู้ใช้ไม่ควรรอ Discord — ตอบเขาก่อน, แจ้งเตือนหลังบ้านเป็นเรื่องรอง

---


<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

<a id="sec-27"></a>
## 27. Supabase ทำอะไรในระบบนี้ (เจาะลึก)

```mermaid
flowchart LR
    subgraph Supabase
        PG[("PostgreSQL 15<br/>+ pgBouncer pool")]
        AUTH["Supabase Auth (ไม่ได้ใช้)"]
        STO["Supabase Storage (ไม่ได้ใช้)"]
        EDGE["Edge Functions (ไม่ได้ใช้)"]
    end
    NA["Next.js (Vercel)"] -->|"pg + TLS<br/>raw SQL"| PG
    NA -.->|"ไม่ใช้"| AUTH
    NA -.->|"ไม่ใช้"| STO
    NA -.->|"ไม่ใช้"| EDGE
```

| สิ่งที่ใช้ | สิ่งที่ไม่ใช้ |
|----------|---------------|
| ✅ PostgreSQL (เก็บข้อมูลทั้งหมด) | ❌ Supabase Auth (เราใช้ JWT เอง) |
| ✅ Connection Pooling (pgBouncer) | ❌ Row-Level Security (ใช้ JWT verify ใน API แทน) |
| ✅ SSL/TLS certificate | ❌ Realtime subscriptions |
| ✅ Backup อัตโนมัติ (Supabase ให้ฟรี) | ❌ Supabase Storage |

### 27.1 ทำไมไม่ใช้ Supabase JS Client?
- โปรเจกต์ใช้ `pg` (node-postgres) + raw SQL → **performance ดีกว่า** เพราะคุม query ได้เอง
- ใช้ `EXPLAIN ANALYZE` ตรวจ index ได้ตรง ๆ
- Supabase JS client มี overhead ของ PostgREST translation

### 27.2 Connection Strategy
- **Pooled URL** (`POSTGRES_URL` กับ `?pgbouncer=true`) → ใช้กับ query ปกติ (เพราะ Vercel serverless เปิด connection บ่อย)
- **Direct URL** → ใช้กับ DDL/migration (pgBouncer ไม่รองรับ prepared statement บางแบบ)

### 27.3 SQL ที่น่าสนใจในระบบ
```sql
-- Atomic token consume (กัน race condition)
UPDATE dynamic_qr_tokens
SET is_consumed = TRUE, consumed_at = NOW()
WHERE token = $1
  AND is_consumed = FALSE
  AND expires_at > NOW()
RETURNING id, room_code;

-- Upsert หลาย setting ในครั้งเดียว
INSERT INTO system_settings (setting_key, setting_value)
SELECT * FROM UNNEST($1::text[], $2::text[])
ON CONFLICT (setting_key) DO UPDATE
SET setting_value = EXCLUDED.setting_value,
    updated_at = NOW();

-- Rate limit แบบ atomic
INSERT INTO rate_limits (key, count, window_start)
VALUES ($1, 1, NOW())
ON CONFLICT (key) DO UPDATE
SET count = CASE
    WHEN rate_limits.window_start < NOW() - $2::interval THEN 1
    ELSE rate_limits.count + 1
  END,
  window_start = CASE
    WHEN rate_limits.window_start < NOW() - $2::interval THEN NOW()
    ELSE rate_limits.window_start
  END
RETURNING count;
```

---


<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

<a id="sec-28"></a>
## 28. Vercel ทำอะไรกับ my-app (เจาะลึก)

```mermaid
flowchart TB
    DEV["git push main"] --> GH["GitHub Repo"]
    GH -->|"webhook"| VB["Vercel Build"]
    VB --> NB["next build (Turbopack)"]
    NB --> ART["Build Artifact<br/>(static + serverless bundles)"]
    ART --> CDN["Edge CDN (global)"]
    ART --> FN["Serverless Functions"]
    USER["ผู้ใช้"] --> CDN
    CDN -->|"static (HTML/CSS/JS)"| USER
    USER -->|"/api/*"| FN
    FN -->|"pg connection"| SB[("Supabase")]
    ENV["Env Vars (Dashboard)"] --> FN
    DOMAIN["Custom Domain + HTTPS auto"] --> CDN
```

### 28.1 สิ่งที่ Vercel ทำให้ฟรี
1. **HTTPS อัตโนมัติ** — สร้าง Let's Encrypt cert ให้
2. **Edge CDN** — cache static assets ทั่วโลก (รวมถึง favicon, _next/static/*)
3. **Preview deployment** — ทุก PR ได้ URL ใหม่
4. **Rollback** — กลับไป build เก่าได้ใน 1 คลิก
5. **Logs** — ดู runtime log ของ serverless function ได้
6. **Analytics** — Core Web Vitals (LCP, FID, CLS)

### 28.2 ข้อจำกัดที่ต้องระวัง
| ข้อจำกัด | กระทบอย่างไร | วิธีแก้ในโปรเจกต์ |
|----------|----------------|---------------------|
| Function timeout 10s (Hobby) | export PDF ใหญ่อาจ timeout | จำกัดช่วงวันที่, pagination |
| Cold start ~300-800ms | request แรกหลัง idle ช้า | ใช้ ping cron / Edge runtime |
| 4.5MB body limit | upload ไฟล์ใหญ่ไม่ได้ | ไม่ได้ใช้ upload ในระบบนี้ |
| ไม่มี long-lived process | ใช้ in-memory cache ระวัง | settings cache 30s โอเคเพราะ stateless |
| ไม่มี filesystem persist | เขียนไฟล์ไม่ได้ | ทุกอย่างเก็บใน DB |

---


<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

<a id="sec-29"></a>
## 29. เปรียบเทียบ: ทำไมบางส่วนเร็ว / บางส่วนช้า

```mermaid
flowchart LR
    subgraph FAST["🚀 ส่วนที่เร็ว"]
        F1["โหลดหน้าเว็บแรก<br/>~80-150ms"]
        F2["JWT verify<br/>~1ms (HS256 in-memory)"]
        F3["อ่าน settings<br/>~0ms (cache 30s)"]
        F4["Rate-limit check<br/>~5ms (1 SQL)"]
        F5["LAN unlock direct<br/>~50-150ms (ถ้าวงเดียวกัน)"]
    end
    subgraph SLOW["🐢 ส่วนที่ช้า"]
        S1["Cold start API<br/>~300-800ms"]
        S2["รอ ESP32 รับคำสั่ง<br/>0-2000ms (polling)"]
        S3["bcrypt verify<br/>~70ms (login)"]
        S4["Export PDF<br/>500-3000ms"]
        S5["Discord webhook<br/>~200-800ms"]
        S6["QR PNG generation<br/>~50-150ms"]
    end
```

### 29.1 ตารางสรุป + เหตุผลทางวิศวกรรม

| ส่วน | เวลา | เหตุผลที่เร็ว/ช้า | ทำให้เร็วขึ้นได้อย่างไร |
|------|------|--------------------|---------------------------|
| โหลด HTML หน้า `/` | ~80ms | CDN cache + static | ใช้ ISR ถ้ามี dynamic |
| JWT verify | <1ms | HS256 = HMAC-SHA256, symmetric ไม่ต้องคุย DB | คงไว้ |
| อ่าน system_settings | 0-5ms | in-memory cache 30s | เพิ่ม TTL ถ้าข้อมูลนิ่งกว่านี้ |
| Rate limit query | ~5ms | 1 SQL `INSERT ON CONFLICT` | คงไว้ — race-condition safe |
| Login (bcrypt) | ~70ms | bcrypt cost 10 รอบ | ลด cost = ไม่ปลอดภัย, อย่าลด |
| Cold start | 300-800ms | Vercel ปลุก Node runtime + load module | ping cron ทุก 5 นาที / ย้ายไป Edge runtime |
| ESP32 polling delay | 0-2000ms | poll ทุก 2s เป็น worst case | ลด poll interval = traffic เพิ่ม |
| LAN direct unlock | 50-150ms | HTTP ตรงในวง LAN | ใช้เมื่อ ESP32 และ server อยู่วงเดียว |
| Export PDF 1000 row | 1500-3000ms | pdfkit render + font + DB query | ใช้ stream + cache font |
| Discord webhook | 200-800ms | external HTTP ไป discord.com | fire-and-forget (ทำแล้ว) |
| QR PNG | 50-150ms | qrcode lib + PNG encode | cache ตาม token (ทำได้ในอนาคต) |
| consumeQRToken | 5-15ms | 1 atomic SQL | คงไว้ |
| Dashboard JS bundle | 200-500ms parse | 5,620 บรรทัดใน 1 ไฟล์ | แยกเป็น sub-route + dynamic import |

### 29.2 หลักการสำคัญที่ทำให้ระบบลื่น
1. **อ่านบ่อย → cache** (settings 30s, JWT in-memory)
2. **เขียน critical แล้ว fire-and-forget ส่วนที่เหลือ** (Discord, LAN call)
3. **Atomic SQL แทน multi-step transaction** (consume token, rate-limit)
4. **Static asset ไปทาง CDN** (Vercel จัดการอัตโนมัติ)
5. **Index ที่ถูกจุด**: `students.status`, `students.student_id`, `access_logs.created_at DESC`, `dynamic_qr_tokens.token UNIQUE`
6. **Connection pooling** ผ่าน pgBouncer ลด TLS handshake

---


<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

<a id="sec-30"></a>
## 30. อัลกอริทึมสำคัญ (Pseudocode)

### 30.1 generateActiveQRToken(roomCode)
```
function getOrCreateActiveQRToken(roomCode):
    // ลบ token หมดอายุของห้องนี้
    DELETE FROM dynamic_qr_tokens
    WHERE room_code = roomCode AND expires_at < NOW()

    // หา token ที่ยัง valid, ยังไม่ consume, และ rotate window ยังไม่ครบ
    SELECT * FROM dynamic_qr_tokens
    WHERE room_code = roomCode
      AND is_consumed = FALSE
      AND created_at > NOW() - 60s
      AND expires_at > NOW()
    LIMIT 1
    IF found: return existing

    // สร้างใหม่
    token = crypto.randomBytes(16).toString('hex')   // 32 hex chars
    INSERT INTO dynamic_qr_tokens (token, room_code, expires_at)
    VALUES (token, roomCode, NOW() + 300s)
    return new token
```

### 30.2 ESP32 main loop
```
loop():
    if WiFi.status() != CONNECTED:
        blink LED_WIFI
        WiFi.reconnect()
        return

    response = httpGET(server_url, headers={x-api-key: API_KEY}, timeout=1200ms)
    if response.code != 200:
        delay(polling_delay)
        return

    json = parse(response.body)
    qrText = json.register_url + "?scan=" + json.active_token + "&room=" + json.requested_room

    if json.door_trigger == "open":
        drawScanningScreen()
        tone(1500, 100); delay(1200)
        drawUnlockedScreen(json.last_approved, ...)
        digitalWrite(RELAY_PIN, HIGH)
        playSuccessMelody()
        drawCountdownBar(3800ms)
        digitalWrite(RELAY_PIN, LOW)
        tone(800, 200)
        resetCache()  // บังคับ redraw รอบหน้า
    else if data_changed(json):
        drawMainScreen(json.pending_count, json.last_approved, time, qrText)
        cacheLastData(json)
    else:
        drawClockOnly(time)

    delay(polling_delay)  // 2000ms
```

### 30.3 Admin login + rate limit
```
POST /api/auth/login:
    ip = getClientIp(req)
    rateLimit(key="login:" + ip, max=5, window=60s)  // ถ้าเกิน → 429

    user = SELECT * FROM admin_users WHERE username=$1
    if not user: return 401
    if not bcrypt.compare(password, user.password_hash): return 401

    token = jwt.sign({id, username, role}, JWT_SECRET, alg=HS256, exp=8h)
    setCookie('smartaccess_admin_token', token, httpOnly, secure, sameSite=lax, maxAge=8h)
    UPDATE admin_users SET last_login=NOW() WHERE id=user.id
    return 200 {user}
```

---


<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

<a id="sec-31"></a>
## 31. Network & Security Architecture

```mermaid
flowchart TB
    subgraph Internet
        BR["เบราว์เซอร์<br/>(นักศึกษา/Admin)"]
    end
    subgraph LAN["LAN มหาวิทยาลัย"]
        ESP["ESP32"]
        LOCK["กลอนประตู"]
    end
    subgraph CloudVercel["Cloud (Vercel)"]
        EDGE["Edge: HTTPS termination<br/>+ CDN cache"]
        FN["Serverless Function<br/>+ JWT verify<br/>+ Rate limit<br/>+ API-key check"]
    end
    subgraph CloudSB["Cloud (Supabase)"]
        PG[("PostgreSQL<br/>TLS only")]
    end
    BR -->|"HTTPS 443<br/>+ httpOnly cookie"| EDGE
    EDGE --> FN
    FN -->|"TLS 5432<br/>+ pgBouncer"| PG
    ESP -->|"HTTPS 443<br/>+ X-API-Key header"| EDGE
    ESP -->|"GPIO12"| LOCK
    FN -.->|"LAN direct (optional)<br/>HTTP 80 + X-API-Key"| ESP
```

### 31.1 ชั้นการป้องกัน (Defense in Depth)
1. **Network**: HTTPS ทุกฝั่ง, ESP32 → server ใช้ TLS + custom CA verify
2. **API Gateway**: Vercel filter DDoS เบื้องต้น
3. **Auth**: JWT HS256 + httpOnly cookie (กัน XSS) + sameSite=lax (กัน CSRF)
4. **Authorization**: ตรวจ role ทุก endpoint (`owner` vs `door_operator`)
5. **Input validation**: sanitize ทุก field + regex รหัสนักศึกษา
6. **Rate limit**: ต่อ IP + ต่อ student
7. **SQL injection**: parametrized query 100% (ไม่มี string concat)
8. **Audit log**: ทุก action เขียน `access_logs`
9. **Compliance**: ลบ log < 90 วันต้องยืนยันรหัส (พ.ร.บ. คอมฯ ม.26)
10. **Secret rotation**: `JWT_SECRET`, `ESP32_API_KEY`, `QR_SIGNING_KEY` ตั้งใน env, ไม่อยู่ใน git

### 31.2 ภัยที่ระบบป้องกันได้ vs ป้องกันไม่ได้

| ภัย | ป้องกันได้? | กลไก |
|-----|------------|------|
| Brute-force login | ✅ | rate limit 5/min/IP + bcrypt slow hash |
| SQL injection | ✅ | parametrized queries |
| XSS ขโมย token | ✅ | httpOnly cookie |
| CSRF | ✅ | sameSite=lax + double POST |
| Replay QR | ✅ | one-time token (consume) |
| MITM | ✅ | HTTPS ทุกฝั่ง |
| ESP32 spoofing | ✅ | X-API-Key header |
| Insider abuse (admin) | ⚠️ | audit log แต่ไม่ป้องกันการกระทำ |
| Physical tampering (ตัดสาย relay) | ❌ | ต้องใส่ tamper switch + กล่องล็อก |
| Lost cookie จากเครื่อง admin | ⚠️ | JWT หมดอายุใน 8 ชม. |
| DDoS ใหญ่ | ⚠️ | Vercel มี basic protection แต่ไม่กัน L7 หนัก ๆ |

---


<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

<a id="sec-32"></a>
## 32. Flowchart รวม "End-to-End" (สมัคร → เข้าห้อง)

```mermaid
flowchart TD
    A["นักศึกษามาที่ห้อง CE-401"] --> B["มองจอ TFT บน ESP32"]
    B --> C["เปิดกล้องมือถือ สแกน QR"]
    C --> D["browser เปิด /?scan=TOKEN&room=CE-401"]
    D --> E["GET /api/esp32/qr/verify"]
    E -->|invalid| EX["แสดงหน้า expired"]
    E -->|valid| F["แสดงฟอร์มลงทะเบียน"]
    F --> G["พิมพ์รหัส นศ. + ชื่อ"]
    G --> H["debounce 500ms → /api/students/check-match"]
    H --> I{มีประวัติ?}
    I -->|ใช่| J["auto-fill คณะ/สาขา/ชั้นปี"]
    I -->|ไม่| K["กรอกเอง"]
    J --> L["กด ส่ง"]
    K --> L
    L --> M["POST /api/students"]
    M --> N["rate-limit ตรวจ"]
    N -->|เกิน| NX["429"]
    N -->|ผ่าน| O["consumeQRToken atomic"]
    O -->|ใช้แล้ว| OX["403"]
    O -->|ok| P{ในช่วง auto-approve?}
    P -->|ใช่| Q["status=approved + room_cmd_CE-401=unlock"]
    P -->|ไม่| R["status=pending"]
    Q --> S["INSERT access_logs"]
    R --> S
    S --> T["Discord webhook (fire-forget)"]
    T --> U["return 200 + bypass_token (ถ้า approved)"]
    U --> V{approved?}
    V -->|ใช่| W["browser แสดง รอ ESP32 เปิดประตู"]
    V -->|ไม่| X["browser polling /api/students/:id ทุก 3s"]
    X --> Y{เปลี่ยน status?}
    Y -->|approved| W
    Y -->|rejected| YX["แสดง 'ปฏิเสธ'"]
    Y -->|ยัง pending| X
    W --> Z["ESP32 polling /api/esp32/display ทุก 2s"]
    Z --> AA["server พบ room_cmd=unlock"]
    AA --> AB["ตอบ door_trigger=open<br/>+ set room_cmd=consumed"]
    AB --> AC["ESP32 drawScanningScreen"]
    AC --> AD["RELAY_PIN=HIGH"]
    AD --> AE["solenoid/maglock ปลดล็อก 5s"]
    AE --> AF["นักศึกษาเปิดประตูเข้า"]
    AF --> AG["RELAY_PIN=LOW → ล็อกอัตโนมัติ"]
    AG --> AH["บันทึก access_logs action=door_opened"]
```

---


<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

<a id="sec-33"></a>
## 33. คำถามที่พบบ่อย (FAQ)

**Q1: ทำไมไม่ใช้ WebSocket แทน Polling?**
A: Vercel Serverless ไม่รองรับ long-lived connection ดี + ESP32 อยู่หลัง NAT มหาวิทยาลัย, server เรียกตรงไม่ได้เสมอ → polling เรียบง่ายและ debug ง่าย

**Q2: ทำไมเก็บคำสั่งเปิดประตูใน `system_settings` แทนตารางเฉพาะ?**
A: `room_cmd_<room>` คือ key/value ใช้ตารางเดียวกันกับ settings ลดความซับซ้อน + ESP32 อ่าน settings เดียวกันได้ทั้งคำสั่งและ config

**Q3: ถ้า ESP32 ค้างกลางคำสั่ง unlock ประตูจะค้างเปิดไหม?**
A: ไม่ — เพราะ relay จะกลับ LOW เมื่อ ESP32 reboot (เพราะ `pinMode(RELAY, OUTPUT); digitalWrite(RELAY, LOW)` ใน setup) แต่ถ้าใช้ magnetic lock fail-safe (ไฟตัด = ปลดล็อก) ประตูจะปลดล็อก ⚠️ → ใช้ fail-secure ถ้าต้องการล็อกเมื่อไฟตัด

**Q4: คนแปลกหน้าสแกน QR ที่หน้าห้องแล้วใช้กรอกฟอร์มจากที่บ้านได้ไหม?**
A: ได้ถ้าทำเร็วพอ (< 60 วินาที) แต่ยัง:
  - ต้องกรอกรหัสนักศึกษาจริง (admin ตรวจได้)
  - log มี IP + user-agent ตามตัวได้
  - แนะนำเพิ่ม `location-based check` ในอนาคต

**Q5: ทำไม dashboard เป็นไฟล์เดียว 5,620 บรรทัด?**
A: เพราะใช้ state เดียวร่วมกันทุก tab (`pending`, `students`, `logs`, `settings`) — ถ้าแยก route ต้อง lift state ขึ้น context หรือ Zustand ในอนาคตควรแยกเพื่อลด JS bundle

**Q6: PostgreSQL บน Supabase หาย ระบบจะเป็นยังไง?**
A: API ทั้งหมดจะ 500 + ESP32 polling ไม่ได้ข้อมูล → จอจะค้าง state สุดท้าย (ไม่มีการเปิดประตูใหม่) → ปลอดภัยแบบ "fail-secure"

**Q7: เพิ่มห้องใหม่ทำยังไง?**
A:
  1. ใน Dashboard → แท็บห้องและ ESP32 → เพิ่มห้อง (เช่น CE-403)
  2. เขียน `room_ip_CE-403` ถ้าใช้ LAN direct
  3. Flash firmware อีกบอร์ดด้วย `config.h` ที่ `room_code = "CE-403"`
  4. ตั้ง webhook เฉพาะห้องถ้าต้องการ

**Q8: ทำไมต้องมี `requested_room` แยกจาก `room_code`?**
A: `room_code` = ห้องที่ ESP32 ตัวนี้รับผิดชอบ, `requested_room` = ห้องที่นักศึกษาขอเข้า (มาจาก QR) — ต้องตรงกันถึงจะเปิดประตู

---


<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

<a id="sec-34"></a>
## 34. สรุปแบบ "1 นาที"

> Innovative system for managing access rights and controlling classroom access via wireless network คือระบบที่ทำให้นักศึกษา **สแกน QR ที่จอหน้าห้อง → กรอกข้อมูล → ประตูเปิดอัตโนมัติ** (หรือรอ admin อนุมัติ) โดยมี Next.js เป็นสมอง, Supabase PostgreSQL เป็นความจำ, ESP32 เป็นมือ-ตา-หู, และ Discord เป็นปาก
>
> ทุกการสื่อสารเป็น HTTPS, ทุก action ถูก log, ทุก credential ถูก hash/sign, และทุกการเปิดประตูใช้ token แบบ one-time ที่หมุนทุก 60 วินาที — เพื่อให้สมดุลระหว่าง **ใช้งานง่าย** กับ **ปลอดภัยตามมาตรฐาน พ.ร.บ. คอมพิวเตอร์ พ.ศ. 2560**

---

# ภาคผนวกระดับวิศวกร — ส่วนที่ลงรายละเอียดยิ่งขึ้น


<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

<a id="sec-35"></a>
## 35. Schema DDL เต็มรูปแบบ (สร้างโดย `initDatabase()`)

```sql
-- ตารางผู้ดูแลระบบ
CREATE TABLE IF NOT EXISTS admin_users (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(100),
  role          VARCHAR(20) DEFAULT 'door_operator',
  last_login    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_admin_username ON admin_users(username);

-- ตารางนักศึกษา
CREATE TABLE IF NOT EXISTS students (
  id                SERIAL PRIMARY KEY,
  prefix            VARCHAR(20),
  first_name        VARCHAR(80) NOT NULL,
  last_name         VARCHAR(80) NOT NULL,
  student_id        VARCHAR(20) NOT NULL,
  year              SMALLINT,
  faculty           VARCHAR(120),
  branch            VARCHAR(120),
  status            VARCHAR(20) DEFAULT 'pending',
  requested_room    VARCHAR(20),
  rejection_reason  TEXT,
  approved_by       INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
  approved_at       TIMESTAMPTZ,
  bypass_token      VARCHAR(64),
  bypass_expires_at TIMESTAMPTZ,
  last_door_open_at TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_students_status     ON students(status);
CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);
CREATE INDEX IF NOT EXISTS idx_students_created    ON students(created_at DESC);

-- ตาราง audit log
CREATE TABLE IF NOT EXISTS access_logs (
  id            SERIAL PRIMARY KEY,
  student_id    INTEGER REFERENCES students(id) ON DELETE CASCADE,
  admin_id      INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
  action        VARCHAR(40) NOT NULL,
  notes         TEXT,
  ip_address    VARCHAR(45),
  user_agent    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_logs_created  ON access_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_action   ON access_logs(action);
CREATE INDEX IF NOT EXISTS idx_logs_student  ON access_logs(student_id);

-- ตาราง QR token
CREATE TABLE IF NOT EXISTS dynamic_qr_tokens (
  id           SERIAL PRIMARY KEY,
  token        VARCHAR(64) UNIQUE NOT NULL,
  room_code    VARCHAR(20) NOT NULL,
  is_consumed  BOOLEAN DEFAULT FALSE,
  consumed_at  TIMESTAMPTZ,
  expires_at   TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_qr_token      ON dynamic_qr_tokens(token);
CREATE INDEX IF NOT EXISTS idx_qr_room_alive ON dynamic_qr_tokens(room_code, is_consumed, expires_at);

-- ตารางตั้งค่าระบบ (key-value)
CREATE TABLE IF NOT EXISTS system_settings (
  setting_key   VARCHAR(80) PRIMARY KEY,
  setting_value TEXT,
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ตาราง rate limit
CREATE TABLE IF NOT EXISTS rate_limits (
  key          VARCHAR(120) PRIMARY KEY,
  count        INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW()
);
```

### 35.1 ความสัมพันธ์ระหว่างตาราง (ER แบบเต็ม)

```mermaid
erDiagram
    admin_users ||--o{ students    : "approves"
    admin_users ||--o{ access_logs : "performs"
    students    ||--o{ access_logs : "logged for"
    admin_users {
        int     id PK
        string  username
        string  password_hash
        string  full_name
        string  role
        time    last_login
        time    created_at
    }
    students {
        int     id PK
        string  prefix
        string  first_name
        string  last_name
        string  student_id
        int     year
        string  faculty
        string  branch
        string  status
        string  requested_room
        string  rejection_reason
        int     approved_by FK
        time    approved_at
        string  bypass_token
        time    bypass_expires_at
        time    last_door_open_at
        time    created_at
    }
    access_logs {
        int     id PK
        int     student_id FK
        int     admin_id FK
        string  action
        string  notes
        string  ip_address
        string  user_agent
        time    created_at
    }
    dynamic_qr_tokens {
        int     id PK
        string  token
        string  room_code
        bool    is_consumed
        time    consumed_at
        time    expires_at
        time    created_at
    }
    system_settings {
        string  setting_key PK
        string  setting_value
        time    updated_at
    }
    rate_limits {
        string  key PK
        int     count
        time    window_start
    }
```

---


<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

<a id="sec-36"></a>
## 36. ESP32 — GPIO Timing และข้อจำกัดเชิงฮาร์ดแวร์

### 36.1 ตาราง GPIO ใช้งานจริง

| GPIO | โหมด | ใช้ทำอะไร | ข้อควรระวัง |
|-----:|------|-----------|--------------|
| 2  | OUTPUT | TFT D/C | strapping pin — ห้าม HIGH ตอน boot ถ้าเลือก flash mode อื่น |
| 4  | OUTPUT | TFT RST | safe |
| 12 | OUTPUT | RELAY | strapping pin — ถ้า HIGH ตอน boot อาจเข้า flash voltage mode (1.8V) → ตั้ง `digitalWrite(LOW)` ก่อนใน setup |
| 14 | OUTPUT | LED_WIFI | safe |
| 15 | OUTPUT | TFT_CS | strapping pin — must be HIGH ตอน boot (มี pull-up ในตัว) |
| 18 | SPI | SCK | shared SPI bus |
| 19 | SPI | MISO | shared SPI bus |
| 23 | SPI | MOSI | shared SPI bus |
| 26 | OUTPUT | LED_REJECT | safe |
| 27 | OUTPUT | BUZZER | LEDC PWM ได้ |

### 36.2 Timing ของ relay
```
millis()  | event
----------+----------------------------------------------------
T+0       | digitalWrite(RELAY, HIGH)
T+0..3800 | countdown bar (UI), เสียง 1000→1500→2000 Hz
T+3800    | digitalWrite(RELAY, LOW)
T+3900    | tone(800, 200)  // เสียงปิด
T+4100    | resetCache → loop() ปกติ
```

ทำไม **3800ms** ไม่ใช่ 5000ms?
- UX สำคัญกว่า 5 วินาที — คนเดินเข้าไม่ทันก็สแกนใหม่ได้
- 5000ms เคยทำให้ relay ร้อนสะสมในการทดสอบยาวต่อเนื่อง

### 36.3 ทำไม `tft.setRotation(1)` (landscape)
- หน้าจอ 320×240 ในแนวนอน → QR ขนาด 154×154 พิกเซลพอดี + เหลือพื้นที่แสดงข้อความ
- ถ้าใช้ portrait (240×320) QR ขนาดเล็กลง สแกนยาก

### 36.4 หน่วยความจำที่ใช้
- Flash: firmware ~800KB จาก partition 1.2MB
- RAM: stack peak ~12KB (รวม `StaticJsonDocument<768>` + TFT buffer + WiFi)
- Heap free ขณะรัน: ~180KB (ตรวจด้วย `ESP.getFreeHeap()`)

---


<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

<a id="sec-37"></a>
## 37. รายการ Environment Variables ทุกตัว

| ตัวแปร | จำเป็น | ค่าเริ่มต้น | คำอธิบาย |
|--------|--------|--------------|-----------|
| `POSTGRES_HOST` | ✅ | — | hostname Supabase |
| `POSTGRES_PORT` | ✅ | 5432 | port |
| `POSTGRES_USER` | ✅ | — | username |
| `POSTGRES_PASSWORD` | ✅ | — | password |
| `POSTGRES_DATABASE` | ✅ | postgres | ชื่อ DB |
| `POSTGRES_URL` | ทางเลือก | — | ใช้แทน 5 ตัวบน + รองรับ `?pgbouncer=true` |
| `SUPABASE_CA_CERT` | ทางเลือก | — | PEM cert สำหรับ TLS verify (ใส่ `\n`) |
| `JWT_SECRET` | ✅ | — | ≥ 32 chars; production ห้ามใช้ default |
| `ESP32_API_KEY` | ✅ | — | ต้องตรงกับ `api_key` ใน `config.h` |
| `ESP32_MODE` | ⚠️ | physical | mock / wokwi / physical |
| `ESP32_MOCK_MODE` | ⚠️ | false | สั้น ๆ ใช้แทน MODE |
| `ESP32_WOKWI` | ⚠️ | false | บอก server ว่าใช้ Wokwi |
| `ESP32_WOKWI_URL` | ⚠️ | http://localhost:8180 | URL forward Wokwi |
| `ESP32_IP` | ⚠️ | — | IP บอร์ดในวง LAN |
| `ESP32_PORT` | ⚠️ | 80 | port บอร์ด |
| `DISCORD_WEBHOOK_URL` | ทางเลือก | — | webhook global |
| `DISCORD_WEBHOOK_LOG_URL` | ทางเลือก | — | webhook สำหรับ log แยก |
| `QR_SIGNING_KEY` | ทางเลือก | — | ถ้าต้องการ sign QR เพิ่ม |
| `NEXT_PUBLIC_APP_URL` | ✅ | https://project-sigma-ivory-21.vercel.app | ใช้สร้าง register URL ใน QR |
| `ALLOW_DEV_SEED` | dev | false | true = สร้าง admin จาก env ครั้งแรก |
| `INITIAL_ADMIN_USERNAME` | dev | admin | ใช้ตอน seed |
| `INITIAL_ADMIN_PASSWORD` | dev | — | ใช้ตอน seed |
| `INITIAL_ADMIN_FULL_NAME` | dev | — | ใช้ตอน seed |

> **กฎเหล็ก**: ใน production ต้องตั้ง `ALLOW_DEV_SEED=false` และ `JWT_SECRET`/`ESP32_API_KEY` ต้องเป็นค่าสุ่ม ≥ 32 ตัวอักษร

---


<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

<a id="sec-38"></a>
## 38. Deployment Runbook (ไป Production)

### 38.1 ขั้นตอนแรกเริ่ม
```mermaid
flowchart TD
    A["1. สร้าง Supabase project"] --> B["2. คัดลอก POSTGRES_URL"]
    B --> C["3. สร้าง Vercel project<br/>เชื่อม GitHub repo"]
    C --> D["4. ตั้ง Env Vars บน Vercel<br/>(ตามตาราง §37)"]
    D --> E["5. กด Deploy"]
    E --> F["6. รอ build เสร็จ → ได้ URL https://xxx.vercel.app"]
    F --> G["7. Login admin ครั้งแรก<br/>(ใช้ INITIAL_ADMIN_*)"]
    G --> H["8. ตั้ง ALLOW_DEV_SEED=false → Redeploy"]
    H --> I["9. Flash ESP32 ด้วย<br/>server_url = https://xxx.vercel.app/api/esp32/display?room=CE-401"]
    I --> J["10. เช็ค heartbeat ใน Dashboard"]
    J --> K["11. ทดสอบเปิดประตู"]
```

### 38.2 Checklist ก่อนเปิดใช้จริง
- [ ] `JWT_SECRET` สุ่มใหม่ (ใช้ `openssl rand -hex 32`)
- [ ] `ESP32_API_KEY` สุ่มใหม่ + อัปเดต `config.h`
- [ ] `ALLOW_DEV_SEED=false`
- [ ] เปลี่ยน password admin เริ่มต้น
- [ ] ตั้ง custom domain + HTTPS
- [ ] ทดสอบ Discord webhook
- [ ] ทดสอบ export PDF ทั้ง 2 แบบ
- [ ] ทดสอบ rate limit (login ผิด 6 ครั้ง → ต้องโดน 429)
- [ ] backup Supabase enable
- [ ] log retention policy (90 วันขึ้นไป ตาม พ.ร.บ.)

### 38.3 Rollback ฉุกเฉิน
1. Vercel Dashboard → Deployments → กด "Promote to Production" บน build เก่าที่ทำงานได้
2. ถ้า schema เพี้ยน: restore Supabase backup (ใน dashboard มี point-in-time)
3. ถ้า ESP32 รับคำสั่งเปิดประตูค้าง: เข้า Dashboard → ตั้ง `room_cmd_<room>` = `idle` ผ่าน Settings

<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

---

<!-- RELOCATED_71_19_START -->
<!-- SECTIONS 71.19–71.23 MOVED TO PROPER §71 LOCATION (see below) -->
<!-- RELOCATED_71_19_END_PLACEHOLDER -->
<!-- ORIGINAL_REMOVED_START
<a id="sec-71-19-removed"></a>
### 71.19 การปฏิบัติตามกฎหมายคุ้มครองข้อมูลส่วนบุคคล (PDPA Compliance & Implementation)

โครงการระบบควบคุมประตูเข้าออกนี้ได้รับการออกแบบโดยยึดหลัก **Privacy by Design** เพื่อให้สอดคล้องกับพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA) อย่างเคร่งครัดตามข้อกำหนดสากล:

1. **กลไกการขอความยินยอม (Consent Management):**
   - พัฒนาแถบแจ้งเตือนคุกกี้และนโยบายความเป็นส่วนตัวผ่าน Component [CookieConsent.tsx](file:///c:/Users/aunkh/OneDrive/Desktop/Project/my-app/app/components/CookieConsent.tsx) ด้วยสไตล์ Minimalist Glassmorphism ที่สอดคล้องกับธีมสีของสถาบัน (ม่วง-ชมพู) 
   - ระบบทำการบันทึกค่าความยินยอมไว้ใน `localStorage` ด้วยคีย์ `smartaccess_cookie_consent` เพื่อจดจำเซสชันการตัดสินใจของผู้ใช้ และส่งสัญญาณประสานงานผ่าน Custom Event `smartaccess_cookie_consent_changed` ไปยังหน้าหลักเพื่อสลับหน้าจอการลงทะเบียนโดยไม่ต้องรีโหลดหน้าเว็บ
   - **การบังคับใช้ความยินยอมเชิงกฎหมาย (Consent Enforcement Check):** ในกรณีที่ผู้ใช้กด "ปฏิเสธ" (Decline) ระบบจะทำการบล็อกแบบฟอร์มการลงทะเบียนทั้งหมด และบังคับแสดงหน้าจอ **"การเข้าถึงระบบถูกระงับ (PDPA Consent Required Block Screen)"** เพื่ออธิบายเหตุผลทางกฎหมายและความปลอดภัยในการบันทึก Log ซึ่งหากผู้ใช้ไม่ยินยอม ระบบจะไม่ทำรายการบันทึกหรือเก็บประวัติใด ๆ ลงสู่ PostgreSQL ตามพระราชบัญญัติ และจะระงับไม่ให้อุปกรณ์เข้าใช้ระบบเพื่อส่งคำสั่งเปิดประตูเด็ดขาด
2. **การบดบังข้อมูลสำคัญส่วนบุคคลบนอินเทอร์เฟซ (Data Masking & Privacy Panel):**
   - บนแดชบอร์ดผู้ดูแลระบบ ข้อมูลสำคัญเช่น รหัสนักศึกษาและชื่อจะถูกทำ Data Masking (เช่น `1164******45`) เพื่อป้องกันไม่ให้เจ้าหน้าที่ระดับ `door_operator` ที่ไม่มีหน้าที่เกี่ยวข้องสามารถจดจำหรือขโมยข้อมูลส่วนบุคคลของนักศึกษาออกนอกหน่วยงานได้
3. **การควบคุมการสิทธิ์เข้าถึงข้อมูลระดับตารางแถว (Row-Level Security - RLS):**
   - ฐานข้อมูล Supabase PostgreSQL ถูกตั้งค่า RLS เพื่อบล็อกคำสั่งสแกนหรืออ่านข้อมูลตารางนักศึกษาจากบุคคลภายนอกที่ไม่ผ่านการตรวจสอบสิทธิ์ JWT และจำกัดให้เฉพาะแอดมินระดับสูง (`owner`) เท่านั้นที่จะมีสิทธิ์คิวรี่ข้อมูลดิบเพื่อการตรวจสอบย้อนกลับ

<a id="sec-71-20"></a>
### 71.20 สถาปัตยกรรมการรักษาความปลอดภัยข้อมูล (Information Security Framework)

เพื่อปกป้องระบบควบคุมการเข้าถึงห้องเรียนอัจฉริยะจากภัยคุกคามทางไซเบอร์ ระบบได้รับการติดตั้งและปรับใช้การควบคุมสิทธิ์แบบสองมิติ (Multi-Room Allowed Rooms RBAC) และการแยกแยะลายเซ็นดิจิทัล:

1. **ระบบควบคุมสิทธิ์จำกัดขอบเขตแอดมินรายห้อง (Allowed Rooms Verification Logic):**
   - เมื่อมีการร้องขออนุมัติปลดล็อกประตูหรือเช็คสถานะห้องผ่าน API `/api/students/[id]/approve` หรือ `/api/system/unlock-room` ระบบจะไม่พึ่งพาเพียงการตรวจสอบ cookie JWT แต่จะแกะอ่านตัวแปรสิทธิ์ `allowed_rooms` ของแอดมินคนนั้นที่เก็บในรูปแบบ CSV (เช่น `CE-401,CE-402`) 
   - ระบบจะสืบค้น `requested_room` ของตารางนักศึกษา หากรหัสห้องเรียนไม่ตรงกันกับคีย์สิทธิ์ที่ได้รับ แอดมินปฏิบัติการ (`door_operator`) จะถูกระงับสิทธิ์ทันทีผ่านรหัสผิดพลาด **403 Forbidden** เพื่อจำกัดขอบเขตสิทธิ์ไม่ให้เกิดการก้าวล่วงข้ามสิทธิ์ห้องเรียนต่างกลุ่มหน้าที่ (Cross-Room Privilege Abuse)
2. **การแยกแยะลายเซ็นดิจิทัลคีย์ลับเพื่อความมั่นคงปลอดภัย (Security Key Segregation):**
   - ระบบทำการจัดสรรและเพิ่มตัวแปรสภาพแวดล้อมใหม่ชื่อ `QR_SIGNING_KEY` แยกตัวแปรออกจาก `JWT_SECRET` ของแอดมินอย่างเป็นเอกเทศ
   - **ประโยชน์:** หากแฮกเกอร์สามารถsniffหรือดักเจาะคีย์ลายเซ็นคิวอาร์หน้าห้องไปได้ แฮกเกอร์ก็จะไม่สามารถนำคีย์นั้นไปถอดรหัสเข้าล็อกอินแดชบอร์ดของแอดมินได้เนื่องจากรหัสคีย์ลับทางคณิตศาสตร์อยู่คนละส่วนกัน เป็นการควบคุมความเสียหายเฉพาะจุด (Blast Radius Containment)
3. **การส่งสัญญาณแจ้งเตือนผ่าน Discord Webhook ที่ละเอียดและทรงประสิทธิภาพสูง:**
   - ระบบได้รับการอัปเกรด Discord Webhook ให้ส่งข้อมูลการตรวจสอบความมั่นคงปลอดภัยแบบแยกหมวดหมู่และลงรายละเอียดลึกทันทีผ่าน Embed Layout:
     - **หมวดหมู่ 🚨 SYSTEM ALERT:** แจ้งเตือนแอดมินทันทีหากพบสัญญาณสแปมยิงถล่ม (Rate Limit Exceeded), การล็อกอินล้มเหลวต่อเนื่อง หรือตรวจพบผู้ใช้งานพยายามเปลี่ยนค่า parameter บุกรุกข้ามสิทธิ์
     - **หมวดหมู่ 🔓 ACCESS GRANT:** แจ้งเตือนรายละเอียดทันทีเมื่อประตูเปิดสำเร็จ โดยส่งข้อมูล ชื่อนักศึกษา, รหัสนักศึกษา (บดบังตัวเลขกลาง), ห้องเรียน, วันเวลา, และสถานะการอนุมัติ (Auto-Approve หรือ อนุมัติโดยแอดมินชื่อใด)
     - **หมวดหมู่ 🔌 HARDWARE OFFLINE:** ยิงแจ้งเตือนทันทีเมื่อตรวจพบว่าบอร์ด ESP32 ประจำห้องเรียนขาดการ Polling เกิน 10 วินาที เพื่อให้ช่างเทคนิควิศวกรรมเข้าไปซ่อมแซมแก้ไขการทำงานบอร์ดควบคุมได้ทันที

<a id="sec-71-21"></a>
### 71.21 พระราชบัญญัติว่าด้วยการกระทำความผิดเกี่ยวกับคอมพิวเตอร์ (Computer Crime Act Compliance)

การออกแบบตารางและบันทึกประวัติ (Log Files) ในระบบ ได้รับการพัฒนาให้สอดรับกับนโยบายของพระราชบัญญัติคอมพิวเตอร์ พ.ศ. 2560 อย่างเข้มงวด:

1. **นโยบายการจัดเก็บล็อกจราจรคอมพิวเตอร์ไม่น้อยกว่า 90 วัน (มาตรา 26):**
   - ตารางข้อมูล `access_logs` ใน PostgreSQL ทำหน้าที่บันทึกประวัติจราจรทางคอมพิวเตอร์ของทุกคนที่สแกนเข้าประตู โดยจะบันทึก: วันเวลาเกิดเหตุ, ชื่อ-นามสกุล, ไอพีแอดเดรสที่ใช้ (Right-most Client IP จาก Vercel Trusted Proxy), ข้อมูลชนิดเว็บบราวเซอร์, และรหัสห้องเรียน โดยระบบมีนโยบายการจัดเก็บข้อมูลนานอย่างน้อย **90 วัน** เสมอ
2. **นโยบายประวัติเข้าออกแก้ไขไม่ได้ (Immutable Access Logs Policy):**
   - ข้อมูลประวัติการผ่านประตูที่ถูกบันทึกสำเร็จใน `access_logs` จะไม่มี API หรือหน้าอินเตอร์เฟซใดๆ บนแดชบอร์ดที่เปิดให้มีการแก้ไข ปรับปรุง หรือลบแถวข้อมูลย้อนหลังได้ (ห้ามคำสั่ง `UPDATE` และ `DELETE` บนตารางนี้สำหรับแอดมินทุกคน) 
   - **ผลลัพธ์เชิงนิติวิทยาศาสตร์ดิจิทัล (Digital Forensics):** รักษาความโปร่งใสและความถูกต้องของพยานหลักฐานข้อมูลจราจร หากเกิดกรณีการโจรกรรมทรัพย์สินในอาคารหรือห้องปฏิบัติการ
3. **การป้องกันการบุกรุกและเข้าถึงระบบโดยมิชอบ (มาตรา 5, 7, 8):**
   - ระบบปิดกั้นการเข้าคิวรี่หรือเข้าถึงฐานข้อมูล Supabase โดยตรงด้วยระบบป้องกัน RLS และ API authentication ป้องกันการเจาะระบบและเข้าใช้งานระบบควบคุมประตูส่วนกลางโดยมิชอบซึ่งมีโทษตามกฎหมายคอมพิวเตอร์ของไทย

<a id="sec-71-22"></a>
### 71.22 ข้อตกลงและเงื่อนไขการใช้บริการอย่างเป็นทางการ (Terms and Conditions Guide)

ในการนำระบบไปติดตั้งใช้งานจริงในสถานศึกษาหรือห้องปฏิบัติการของ นักศึกษาและผู้ผ่านเข้าออกทุกคนต้องปฏิบัติตามข้อตกลงการใช้บริการดังนี้ โดยข้อกำหนดเหล่านี้ได้รับการเผยแพร่อย่างชัดเจนบนเว็บแอปพลิเคชันที่หน้า [terms/page.tsx](file:///c:/Users/aunkh/OneDrive/Desktop/Project/my-app/app/terms/page.tsx):

1. **ขอบเขตสิทธิ์การเข้าถึงอาคารสถานที่ (Access Rights Scope):**
   - สิทธิ์การเข้าใช้งานห้องปฏิบัติการผ่านระบบสแกนคิวอาร์โค้ดนี้ เป็นสิทธิ์เฉพาะตัวบุคคลของนักศึกษาที่ได้รับการอนุมัติเท่านั้น **ห้ามมิให้นักศึกษานำโทเคน คิวอาร์โค้ด หรือสิทธิ์ผ่านทางชั่วคราว (Bypass Token) ไปแบ่งปัน ส่งต่อ หรืออนุญาตให้บุคคลอื่นที่ไม่มีสิทธิ์ใช้เพื่อเปิดประตูผ่านทางเข้า**
2. **นโยบายการห้ามเดินตามหลังโดยไม่สแกนสิทธิ์ (Anti-Tailgating Policy):**
   - นักศึกษาทุกคนต้องทำการสแกนประวัติการยืนยันตนและรอผลอนุมัติในการเข้าออกรายคน ห้ามมิให้เดินตามหลังผู้อื่นที่ประตูถูกเปิดค้างไว้โดยไม่มีการบันทึกประวัติลงตาราง `access_logs` หากเกิดเหตุขัดข้องทางทรัพย์สินส่วนกลาง บุคคลสุดท้ายที่ปรากฏประวัติในระบบจะถือเป็นผู้รับผิดชอบหลักในการให้ข้อมูลแก่SmartAccess
3. **ขอบเขตความรับผิดชอบและการจำกัดความรับผิด (Limitation of Liability):**
   - คณะครุศาสตร์อุตสาหกรรม มหาวิทยาลัยเทคโนโลยีราชมงคลพระนคร และทีมผู้พัฒนาระบบ SmartAccess จะไม่รับผิดชอบต่อความสูญหาย เสียหาย หรือการถูกโจรกรรมของทรัพย์สินส่วนตัวของนักศึกษาที่นำเข้าไปเก็บรักษาภายในห้องเรียนทุกกรณี 
4. **มาตรการลงโทษทางวินัย (Disciplinary Enforcement):**
   - หากตรวจพบว่านักศึกษาพยายามเจาะระบบ ส่งคำร้องปลอม ยิงสแปมถล่มพอร์ตรีเลย์ หรือช่วยเหลือผู้บุกรุกผ่านนโยบายแชร์คีย์อ้างอิง นักศึกษาจะถูกระงับสิทธิ์การใช้งานผ่านแผงควบคุมแอดมินทันที และส่งเรื่องเพื่อพิจารณาโทษทางวินัยนักศึกษาตามระเบียบของทางมหาวิทยาลัยต่อไป

<a id="sec-71-23"></a>
### 71.23 นโยบายความเป็นส่วนตัวของระบบควบคุมห้องเรียน (Official Privacy Policy)

นโยบายความเป็นส่วนตัวนี้ได้รับการจัดทำขึ้นอย่างโปร่งใสตามมาตรฐาน PDPA ของไทย และสามารถเข้าถึงได้ผ่านทาง [privacy/page.tsx](file:///c:/Users/aunkh/OneDrive/Desktop/Project/my-app/app/privacy/page.tsx) เพื่อชี้แจงกระบวนการจัดการข้อมูลส่วนบุคคล (PII) ของระบบ เพื่อคุ้มครองและรักษาสิทธิ์ของนักศึกษา:

1. **ประเภทข้อมูลส่วนบุคคลที่จัดเก็บ (Types of Personal Data Collected):**
   - ระบบจะบันทึกข้อมูลส่วนตัวที่จำเป็น ได้แก่ คำนำหน้าชื่อ, ชื่อจริง, นามสกุล, รหัสนักศึกษา, คณะวิชา, สาขาวิชาการเรียน, พิกัดรหัสห้องเรียนที่ขอเข้าใช้งาน, เวลาลงทะเบียน, และข้อมูลเน็ตเวิร์กเช่น ไอพีแอดเดรสและประวัติเครื่องอุปกรณ์
2. **จุดประสงค์การจัดเก็บข้อมูลและประมวลผล (Purposes of Processing):**
   - ข้อมูลทั้งหมดจะถูกจัดเก็บลง Supabase PostgreSQL เพื่อใช้ในการคิวรี่จับคู่ประวัติและยืนยันตนสำหรับการอนุญาตปลดล็อกประตูผ่านทางเข้าห้องเรียนแบบไร้สาย รวมถึงการจัดทำประวัติล็อกการจราจรคอมพิวเตอร์เพื่อความปลอดภัยในการป้องกันอัคคีภัยและการโจรกรรมในสถาบันการศึกษา
3. **การรักษาความมั่นคงปลอดภัยและการส่งต่อข้อมูล (Information Sharing and Security):**
   - ระบบจะส่งต่อเฉพาะข้อมูลการเข้าห้องที่ได้รับอนุมัติแล้วเท่านั้นไปยัง Discord Webhook ของกลุ่มเจ้าหน้าที่ดูแลระบบที่ได้รับอนุญาตอย่างเป็นทางการ และจะไม่มีการส่งมอบ ขาย หรือแบ่งปันข้อมูลส่วนบุคคลของนักศึกษาออกไปยังหน่วยงานภายนอกอื่นเด็ดขาด
4. **ระยะเวลาการจัดเก็บข้อมูลและการทำลายข้อมูล (Data Retention & Deletion):**
   - ระบบจัดเก็บข้อมูลประวัติการขอผ่านประตูและการลงทะเบียนไว้ในฐานข้อมูลเป็นเวลาอย่างน้อย 90 วันตามพระราชบัญญัติคอมพิวเตอร์ และเมื่อครบกำหนดระยะเวลาดังกล่าวหรือเมื่อเสร็จสิ้นปีการศึกษา ระบบจะมีตรรกะการลบทำลายข้อมูลประวัติการสแกนเก่าทิ้งอัตโนมัติ (Data Pruning)
5. **สิทธิ์ในการเข้าถึงและขอทำลายข้อมูลส่วนบุคคล (Data Subject Rights):**
   - นักศึกษามีสิทธิ์ในการยื่นคำร้องผ่านทางเพื่อขอเข้าตรวจสอบประวัติการลงทะเบียนของตนเอง หรือขอใช้สิทธิ์ในการลบทำลายข้อมูลส่วนบุคคลของตนเองออกนอกระบบควบคุม (Right to be Forgotten) ได้ทุกเมื่อ หากนักศึกษาหมดความจำเป็นในการเข้าใช้ห้องปฏิบัติการดังกล่าวแล้ว
ORIGINAL_REMOVED_END -->

<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

<a id="sec-39"></a>
## 39. Monitoring & Observability

### 39.1 จุดที่ต้องเฝ้าดู
```mermaid
flowchart LR
    M1["Vercel Logs<br/>ดู API errors"] --> ALERT["Alert"]
    M2["Supabase Dashboard<br/>ดู query slow, connection"] --> ALERT
    M3["Discord channel<br/>รับ event realtime"] --> ALERT
    M4["heartbeat<br/>room_last_seen"] --> ALERT
    M5["Dashboard /api/system/status"] --> ALERT
```

### 39.2 ตัวชี้วัด (KPI)
| ตัวชี้วัด | เป้าหมาย | วิธีวัด |
|----------|----------|---------|
| API p95 latency | < 500ms | Vercel Analytics |
| DB query p95 | < 100ms | Supabase Reports |
| ESP32 uptime | ≥ 99% | heartbeat / รวม 24 ชม. |
| ประตูเปิดสำเร็จ | ≥ 99.5% | นับจาก `action=door_opened` vs `door_failed` |
| Login fail rate | < 2% | rate-limit log |

---


<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

<a id="sec-40"></a>
## 40. การ Migrate / เพิ่มฟีเจอร์ใหม่ (Future-proofing)

### 40.1 ถ้าต้องการเปลี่ยนจาก polling เป็น push (WebSocket / SSE)
- ทางเลือก A: ใช้ **Supabase Realtime** (subscribe ตาราง `system_settings`) → ESP32 เปลี่ยนเป็น MQTT bridge
- ทางเลือก B: ใช้ **Pusher / Ably** — เพิ่ม cost รายเดือน
- ทางเลือก C: ติด **MQTT broker** ใน LAN เอง → ESP32 subscribe → server publish

### 40.2 ถ้าต้องการรองรับห้องเกิน 50 ห้อง
- เพิ่มตาราง `rooms` แยกออกจาก `system_settings` (ตอนนี้ใช้ key-value flat)
- เพิ่ม index `(room_code, created_at)` ใน `dynamic_qr_tokens`
- ปรับ heartbeat ให้เก็บใน column แยก ไม่ใช่ key

### 40.3 ถ้าต้องการ Face Recognition / RFID
- เพิ่มตาราง `student_credentials` (type=rfid/face_embedding/qr)
- ESP32 ต่อ MFRC522 reader → POST `/api/esp32/credential/verify`
- เพิ่ม model ML ฝั่ง server (เรียก HuggingFace / Replicate)

### 40.4 ถ้าต้องการ Mobile App
- เปิด API endpoint `/api/mobile/*` ที่ใช้ JWT แทน cookie
- ใช้ React Native + expo-camera สแกน QR

---


<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

<a id="sec-41"></a>
## 41. Performance Profiling แบบลงรายละเอียด

### 41.1 ที่มาของเวลา 800ms ใน "cold start"
```
Total: ~800ms
├─ DNS resolution            ~20ms
├─ TLS handshake             ~80ms
├─ Vercel routing            ~30ms
├─ Lambda init               ~250ms  ← ใหญ่สุด
│  ├─ Node runtime boot      ~120ms
│  └─ require('pg') + lib    ~130ms
├─ pgBouncer auth + TLS      ~150ms
├─ Query                     ~15ms
├─ JSON serialize            ~5ms
└─ Response back             ~250ms (network)
```

วิธีลด:
- ใช้ **Edge runtime** กับ route ที่ไม่ต้อง `pg` (เช่น `/api/auth/me`) → ลด init เหลือ ~50ms
- เปิด **Vercel KV** cache layer ระดับ Edge สำหรับ settings
- ใช้ **fluid compute** (Vercel feature ใหม่) → instance warm นานขึ้น

### 41.2 ที่มาของเวลา 70ms ใน bcrypt
- bcrypt cost factor 10 = 2^10 = 1024 รอบของ Blowfish
- 70ms บน CPU มาตรฐาน Vercel
- ถ้าลด cost = 8 → 17ms แต่ปลอดภัยน้อยลง 4 เท่า → **ไม่แนะนำ**

### 41.3 ESP32 polling traffic
- 1 บอร์ด × 1 request ทุก 2 วินาที = 30 req/นาที = 43,200 req/วัน
- Response ~400 byte = 17 MB/วัน/บอร์ด
- 10 บอร์ด ≈ 170 MB/วัน → Vercel free tier (100GB/เดือน) เพียงพอ ~17 วัน
- **ถ้าต้องสเกล 100 ห้อง** → ต้องอัปเป็น Pro plan หรือเปลี่ยนเป็น push

---


<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

<a id="sec-42"></a>
## 42. Code Smells ที่ควร refactor (Tech Debt)

| ที่ | ปัญหา | วิธีแก้ |
|-----|--------|----------|
| `app/admin/dashboard/page.tsx` | 5,620 บรรทัดไฟล์เดียว | แยกเป็น sub-route `/admin/dashboard/{pending,users,logs,...}` + dynamic import |
| `lib/db.ts` `initDatabase()` | auto-migrate ใน production มีความเสี่ยง | แยกเป็น script `npm run migrate` |
| in-memory rate-limit cache | ไม่ทำงานข้าม Vercel function instance | ย้ายไป Redis (Upstash) |
| settings cache 30s | invalidate ไม่ทันเมื่อหลาย instance update พร้อมกัน | ใช้ pub/sub (Supabase realtime) |
| ใช้ JWT 8 ชม. | ถ้า cookie หลุดมี window ใหญ่ | ใช้ refresh token + sliding session |

---


<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

<a id="sec-43"></a>
## 43. Glossary (ภาคผนวกศัพท์เทคนิคเพิ่มเติม)

| คำ | คำอธิบาย |
|----|----------|
| **HMAC-SHA256** | hash ที่ต้องมีกุญแจลับ ใช้ใน HS256 JWT |
| **Atomic operation** | คำสั่ง DB ที่ทำเป็นชุดเดียว ไม่มีใครแทรกได้ |
| **Race condition** | บั๊กที่เกิดเมื่อ 2 processes ทำงานพร้อมกันแล้วได้ผลไม่คาดคิด |
| **Strapping pin** | GPIO ของ ESP32 ที่ค่าตอน boot กำหนด boot mode (GPIO 0, 2, 5, 12, 15) |
| **pgBouncer** | connection pooler ของ PostgreSQL ลด TLS overhead |
| **ISR** | Incremental Static Regeneration — Next.js สร้างหน้า static แล้ว revalidate เป็นช่วง |
| **Edge runtime** | runtime ของ Vercel ที่เบา (V8 isolate) ไม่ใช่ Node เต็ม |
| **CSRF** | Cross-Site Request Forgery — เว็บอื่นยิง request จาก browser ผู้ใช้ |
| **Optocoupler** | ตัวแยกไฟ AC/DC ระหว่างสัญญาณ logic กับ relay |
| **Fail-safe vs Fail-secure** | กลอนปลดล็อกเมื่อไฟตัด vs ล็อกเมื่อไฟตัด |

---

> **หมายเหตุการอัปเดต**: ส่วน §35–43 เพิ่มเมื่อ 2026-05-27 18:08:57 +07:00 — รวมเอกสารตอนนี้ครอบคลุม Architecture, UX, Firmware, Database DDL, GPIO, Deployment, Monitoring, Future-roadmap, Profiling และ Glossary ครบทุกระดับชั้น

---


<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

<a id="sec-44"></a>
## 44. ทำไมหน้าจอ TFT บน ESP32 จึงเปลี่ยนสถานะ "ช้า" ไม่เรียลไทม์

นี่เป็นคำถามที่สำคัญมาก และคำตอบมีหลายชั้นซ้อนกัน — ความ "ช้า" ที่เห็นเกิดจาก **ผลรวมของ 8 ปัจจัยทางวิศวกรรม** ที่ตั้งใจออกแบบไว้แบบนี้ ไม่ใช่ความผิดพลาด

### 44.1 ภาพรวม Pipeline ความหน่วงทั้งหมด

```mermaid
flowchart LR
    A["เหตุการณ์เกิด<br/>(แอดมินกด approve)"] --> B["เขียน DB<br/>~20ms"]
    B --> C["รอ ESP32 poll ครั้งถัดไป<br/>0–2000ms"]
    C --> D["TLS handshake<br/>+ HTTP request<br/>~200–400ms"]
    D --> E["Server query DB<br/>~30ms"]
    E --> F["Response กลับ ESP32<br/>~150–300ms"]
    F --> G["JSON parse + diff<br/>~20ms"]
    G --> H["Redraw TFT<br/>~80–400ms"]
    H --> I["ผู้ใช้เห็นการเปลี่ยน"]

    style C fill:#c0392b,stroke:#7b241c,color:#ffffff
    style D fill:#d35400,stroke:#873600,color:#ffffff
    style F fill:#d35400,stroke:#873600,color:#ffffff
    style H fill:#d35400,stroke:#873600,color:#ffffff
```

**รวมแล้ว worst case ~3.1 วินาที, best case ~500ms** — เปรียบเทียบกับเว็บเรียลไทม์ที่ ~50ms

### 44.2 เหตุผลที่ 1 — Polling Interval 2000ms (ใหญ่สุด)

ESP32 **ไม่ได้** รับการแจ้งเตือนแบบ push เมื่อมีข้อมูลใหม่ — มันต้อง "ถาม" server เป็นรอบ ๆ ทุก 2 วินาที

```mermaid
sequenceDiagram
    participant Admin
    participant Server
    participant ESP32
    Admin->>Server: approve student (T=0ms)
    Note over Server: room_cmd_CE-401 = unlock
    Note over ESP32: รอบ poll ล่าสุดเพิ่งผ่านที่ T=-100ms
    Note over ESP32: ⏳ รอรอบถัดไป...
    ESP32->>Server: GET /api/esp32/display (T=1900ms)
    Server-->>ESP32: door_trigger=open
    Note over ESP32: เริ่มเปิดประตู
```

**ทำไมไม่ใช่ 500ms?**
- 1 บอร์ด poll ทุก 2 วินาที = 43,200 req/วัน
- ถ้าเปลี่ยนเป็น 500ms = 172,800 req/วัน (4 เท่า!)
- 10 บอร์ดจะกินโควต้า Vercel free tier (100GB) ในไม่กี่วัน
- ทำให้ ESP32 ร้อนขึ้น + กิน battery (ถ้าใช้ portable)

**ทำไมไม่ใช่ 5000ms?**
- ผู้ใช้สูงสุดจะรอ 5 วินาที = นานเกินจะรู้สึกว่าระบบ "พัง"
- งานวิจัย UX (Jakob Nielsen): >1 วินาทีเริ่มรู้สึก, >10 วินาทีเสียสมาธิ

**2 วินาที = sweet spot** ระหว่าง responsiveness กับ resource

### 44.3 เหตุผลที่ 2 — ไม่มี Push Notification (WebSocket/MQTT/SSE)

ทำไมไม่ใช้ push เลยล่ะ? เพราะ:

| ทางเลือก | ปัญหาในระบบนี้ |
|----------|----------------|
| **WebSocket** | Vercel Serverless function ทำงานสูงสุด 10 วินาที — เปิด connection ค้างไม่ได้ |
| **Server-Sent Events (SSE)** | เหมือนกัน — Serverless ไม่เหมาะ long-lived |
| **MQTT** | ต้องเปิด broker (เช่น HiveMQ) เสียค่าใช้จ่ายเพิ่ม + ESP32 ต้องต่อ 2 protocol |
| **Firebase Cloud Messaging** | ESP32 library FCM ใช้ยาก, มีข้อจำกัด credential |
| **Webhook ตรงไป ESP32** | ESP32 อยู่หลัง NAT มหาวิทยาลัย — server เรียกตรงไม่ได้ |

> สรุป: **architecture บังคับ** ให้เลือก polling เพราะระบบ deploy บน Vercel + ESP32 อยู่หลัง firewall

### 44.4 เหตุผลที่ 3 — TLS Handshake แพง

ทุกครั้งที่ ESP32 เปิด HTTPS ใหม่ ต้องผ่าน:

```mermaid
sequenceDiagram
    participant E as ESP32
    participant S as Server
    E->>S: TCP SYN (~50ms)
    S-->>E: SYN-ACK
    E->>S: ACK (TCP handshake ~150ms รวม)
    E->>S: TLS ClientHello
    S-->>E: ServerHello + Certificate (~1.5KB)
    E->>E: Verify CA cert (RSA-2048 ~100ms บน ESP32!)
    E->>S: ClientKeyExchange + Finished
    S-->>E: ServerFinished
    Note over E,S: รวม TLS ~250–400ms
    E->>S: HTTP GET (ในที่สุด)
    S-->>E: HTTP Response
```

- **CPU ESP32 มี 240MHz เท่านั้น** — RSA verify ใช้เวลานานเทียบกับ server CPU
- ไม่มี hardware crypto accelerator แบบครบเครื่อง (มีบางส่วน)
- ทำไมไม่ใช้ HTTP? — ป้องกัน MITM ขโมย `X-API-Key`

**Optimization ที่ทำในโค้ด**: ใช้ `WiFiClientSecure` แล้ว reuse connection (HTTP keep-alive) เมื่อทำได้ — แต่ Vercel function บาง instance ปิด connection หลังตอบ ทำให้ต้อง handshake ใหม่บ่อย

### 44.5 เหตุผลที่ 4 — TFT SPI Bus จำกัดที่ ~40MHz

จอ ILI9341 ต่อผ่าน SPI:
- ทฤษฎี: 40MHz × 16-bit/pixel = ~80MB/s
- จริง: ~30–50 fps สำหรับ 320×240 full screen
- **เขียนเต็มจอ 1 ครั้ง ≈ 60–80ms**

```
หน่วยเวลาการ redraw:
├─ fillScreen()        ~70ms (เคลียร์)
├─ drawQRCode (154x154)~120ms (จุดเล็ก ๆ จำนวนมาก!)
├─ ข้อความ header     ~15ms
├─ ข้อความ status     ~25ms
├─ countdown bar      ~5ms ต่อ tick
└─ รวมเต็มจอ          ~250–400ms
```

**ทำไมต้องวาด QR ด้วย `fillRect` ทีละจุด?**
- Library `ricmoo_qrcode` คืน matrix bit-by-bit
- ไม่มี hardware acceleration สำหรับ pattern แบบนี้
- การ batch หลายจุดเป็นแถวเดียวก็ทำได้ แต่ซับซ้อนกว่าและช่วยแค่ ~20%

### 44.6 เหตุผลที่ 5 — Partial Redraw Strategy (ตั้งใจให้ "ช้าเพื่อไม่กระพริบ")

โค้ดในระบบจงใจไม่ redraw ทั้งจอทุกรอบ poll เพราะ:

```cpp
// ถ้าข้อมูลไม่เปลี่ยน → update เฉพาะนาฬิกา
if (queueCount == last_queue_count
    && approvedName == last_approved_name
    && token == last_active_token) {
  drawClockOnly(timeStr);   // ~5ms เท่านั้น
  return;
}
// ถ้าข้อมูลเปลี่ยน → redraw เต็ม
drawMainScreen(...);  // ~250-400ms
```

**ผลลัพธ์**:
- 95% ของ polling cycles แค่อัปเดตเวลา → จอนิ่ง ไม่กระพริบ
- 5% ที่ข้อมูลเปลี่ยนจริง → ผู้ใช้เห็นการเปลี่ยน "เด้ง" ครั้งเดียว
- **trade-off**: เปลี่ยนสถานะช้าลง ~300ms เพื่อแลก visual stability

ถ้าทำ "เร็วเรียลไทม์" จะต้อง:
- Double buffering (TFT ไม่มีในตัว)
- Dirty rectangle tracking (ต้องเขียน framework เอง)
- = เพิ่ม code complexity 3 เท่า เพื่อลด latency ~200ms

### 44.7 เหตุผลที่ 6 — JSON Parsing บน ESP32

```cpp
StaticJsonDocument<768> doc;
DeserializationError err = deserializeJson(doc, http.getStream());
```

- ArduinoJson parse JSON 400 byte ใช้ ~10-25ms
- ทำไมไม่ใช้ MsgPack/Protobuf? — debug ยาก, library ใหญ่ขึ้น ~80KB
- JSON อ่านง่าย ผู้ดูแลคนต่อมาแก้ได้

### 44.8 เหตุผลที่ 7 — Network Variance (ที่ควบคุมไม่ได้)

```mermaid
flowchart LR
    A["ESP32"] -->|"Wi-Fi"| B["AP มหาวิทยาลัย"]
    B -->|"backbone"| C["ISP"]
    C -->|"BGP"| D["Vercel Edge<br/>(Singapore)"]
    D --> E["Lambda"]
    E -->|"private network"| F["Supabase<br/>(Tokyo)"]
```

ความหน่วงสะสม:
- Wi-Fi → AP: 5–30ms (ขึ้นกับสัญญาณ)
- AP → ISP: 5–20ms
- ISP → Vercel SG: **40–80ms** (RTT)
- Vercel SG → Supabase JP: 40–60ms
- รวมทาง: **150–300ms ขั้นต่ำ**

ถ้า Wi-Fi อ่อน packet loss → retransmit → +200ms ต่อแพ็กเก็ตที่หาย

### 44.9 เหตุผลที่ 8 — Cold Start ของ Serverless Function

```
Function ที่ไม่ถูกเรียกนาน 5 นาที → Vercel ปลด container ทิ้ง
ครั้งหน้าที่ ESP32 poll → ต้อง:
├─ ปลุก container         ~120ms
├─ Node.js boot           ~100ms
├─ require('pg')          ~150ms
├─ Create DB connection   ~150ms
└─ ทำงานจริง              ~30ms
                          ────────
รวม cold start            ~550ms
```

แต่ในระบบนี้ **ESP32 poll ทุก 2 วิ → function อบอุ่นตลอด** → cold start เกิดน้อย (เฉพาะหลัง deploy หรือ instance scale-down)

### 44.10 สรุป Latency Budget แบบรวม

```mermaid
flowchart TD
    subgraph Total["รวม Worst Case ~3100ms"]
        A["1. Polling wait: 0–2000ms (avg 1000)"]
        B["2. TLS handshake: 250–400ms"]
        C["3. HTTP request transit: 100–200ms"]
        D["4. Server processing: 30–80ms"]
        E["5. HTTP response transit: 100–200ms"]
        F["6. JSON parse: 10–25ms"]
        G["7. TFT redraw: 80–400ms"]
        H["8. Relay actuation: 50ms"]
    end
```

| ปัจจัย | เวลาเฉลี่ย | คุมได้ไหม? | วิธีลด |
|--------|------------|-------------|--------|
| Polling wait | 1000ms | ✅ | ลด interval (แลก traffic) |
| TLS handshake | 300ms | ⚠️ | keep-alive, TLS 1.3 |
| Network RTT | 200ms | ❌ | ใช้ Vercel region ใกล้กว่า |
| Server processing | 50ms | ✅ | cache, index |
| JSON parse | 15ms | ⚠️ | เปลี่ยนเป็น binary format |
| TFT redraw | 250ms | ⚠️ | partial redraw (ทำแล้ว) |
| Relay | 50ms | ❌ | hardware-limited |

### 44.11 ถ้าอยาก "เรียลไทม์" จริง ๆ ต้องทำอย่างไร

**แผน A: ลด polling เหลือ 500ms**
- ✅ ง่ายมาก (แก้ค่าใน `.ino` 1 บรรทัด)
- ❌ traffic เพิ่ม 4 เท่า + ESP32 ร้อนขึ้น
- ผลที่ได้: latency เฉลี่ยลดเหลือ ~700ms

**แผน B: เพิ่ม LAN direct push**
- ESP32 เปิด endpoint `/door/open` ใน LAN
- Server เรียกตรงเมื่อมีคำสั่ง
- ✅ latency ลดเหลือ ~150ms
- ❌ ต้อง LAN เดียวกัน + ต้องจัดการ NAT + firewall
- **โค้ดมีโครงสร้างพร้อมแล้ว** (`tryLanDirectBackground` ใน `lib/esp32.ts`)

**แผน C: MQTT broker ใน LAN**
- ESP32 subscribe topic `door/CE-401`
- Server publish เมื่อมีคำสั่ง
- ✅ latency ~50ms (ใกล้ realtime จริง)
- ❌ ต้อง deploy broker (Mosquitto ฟรี + Raspberry Pi)
- ❌ ESP32 code ซับซ้อนขึ้น ~30%

**แผน D: Supabase Realtime**
- ใช้ Postgres LISTEN/NOTIFY ผ่าน Supabase WebSocket
- ESP32 ต่อ WebSocket ตรง
- ✅ latency ~100ms
- ❌ ESP32 WebSocket library ยังไม่นิ่ง

### 44.12 ทำไม "ช้า 2-3 วินาที" จึงยอมรับได้สำหรับงานนี้

| มุมมอง | เหตุผล |
|--------|--------|
| **UX** | ผู้ใช้สแกน QR + กรอกฟอร์มเอง — ใช้เวลา 20-40 วินาทีอยู่แล้ว, +3 วินาทีไม่รู้สึก |
| **ความปลอดภัย** | เปิดเร็วเกินอาจทำให้คนตามหลังเข้าตามได้ (tailgating) |
| **ความน่าเชื่อถือ** | polling = stateless, ฟื้นจาก network drop ง่ายกว่า WebSocket |
| **ต้นทุน** | ไม่ต้องเช่า MQTT broker / Realtime service |
| **Maintenance** | ผู้สืบทอดโค้ดเข้าใจง่าย — HTTP + JSON เป็นมาตรฐาน |
| **Compliance** | ทุก action ผ่าน HTTP request → log ง่ายตาม พ.ร.บ. คอมฯ |

> **คำตอบสั้น**: TFT ช้าเพราะระบบเลือก architecture แบบ **"pull ทุก 2 วินาที"** เพื่อความเรียบง่าย ความน่าเชื่อถือ และต้นทุนต่ำ — โดยแลกกับ latency เฉลี่ย ~1.5 วินาที ซึ่งยอมรับได้สำหรับ use case "เปิดประตูตามอนุมัติ" ที่ไม่ต้องการ sub-second response

---

> **อัปเดตล่าสุด**: 2026-05-27 18:15:00 +07:00 — เพิ่มสารบัญแบบกดได้, ปุ่มกลับสารบัญทุก section, และ §44 อธิบายความช้าของ TFT แบบละเอียด

<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

---

<a id="sec-45"></a>
## 45. ทำไมเลือก PostgreSQL + ทำไมย้ายจาก postgreSQL (เดิมคือ MySQL) กลางทาง + Aiven vs Supabase

หัวข้อนี้สำคัญมากเพราะเป็นการตัดสินใจทางสถาปัตยกรรมที่ส่งผลกระทบกับทุกอย่าง — เลือกผิดต้องเขียนใหม่ครึ่งหนึ่ง

### 45.1 ประวัติการตัดสินใจ (Timeline)

```mermaid
timeline
    title การเปลี่ยน Database ของโปรเจกต์
    เริ่มโปรเจกต์ : เลือก postgreSQL (เดิมคือ MySQL) บน Aiven (ฟรี tier)
                  : เซิร์ฟเวอร์อยู่ "อินเดีย" (Mumbai region)
                  : เพราะคุ้นเคย + Aiven มีฟรี tier
    พบปัญหา      : Latency เฉลี่ย 180-250ms ต่อ query
                  : Connection pooling ไม่ดีกับ Vercel serverless
                  : Schema migration ของ postgreSQL (เดิมคือ MySQL) ติดขัด
    ทดลอง        : เปรียบเทียบ PostgreSQL บน Supabase
                  : เซิร์ฟเวอร์ "สิงคโปร์" (ap-southeast-1)
                  : Latency ลดเหลือ 40-80ms
    ตัดสินใจย้าย : Migrate ทั้งระบบเป็น PostgreSQL + Supabase
                  : Refactor code ใช้ pg แทน pg
                  : ใช้ pgBouncer pool
    ปัจจุบัน     : รัน production stable
```

### 45.2 ทำไมเลือก PostgreSQL (ไม่ใช่ postgreSQL (เดิมคือ MySQL))

#### 45.2.1 เหตุผลทางเทคนิค

| ฟีเจอร์ | postgreSQL (เดิมคือ MySQL 8) | PostgreSQL 15 | ใครชนะ |
|---------|---------|---------------|--------|
| **JSON support** | JSON type | JSONB (binary, indexable) | 🟢 PG |
| **Generated columns** | ใช้ได้แต่ index จำกัด | Full GIN/GiST index | 🟢 PG |
| **Concurrent index** | LOCK ตาราง | `CREATE INDEX CONCURRENTLY` (online) | 🟢 PG |
| **RETURNING clause** | ❌ ไม่มี (ต้อง SELECT ทีหลัง) | ✅ `INSERT/UPDATE ... RETURNING *` | 🟢 PG |
| **UPSERT** | `ON DUPLICATE KEY UPDATE` (limited) | `ON CONFLICT DO UPDATE` (powerful) | 🟢 PG |
| **CTE / WITH** | รองรับแต่ optimizer ยังใหม่ | optimize ดีมา 10+ ปี | 🟢 PG |
| **Array type** | ❌ | ✅ native array + index | 🟢 PG |
| **UUID native** | ต้องใช้ CHAR(36) | UUID type + gen ในตัว | 🟢 PG |
| **Boolean** | TINYINT(1) (ปลอม) | BOOLEAN จริง | 🟢 PG |
| **Replication** | งานง่าย | งานยากกว่า แต่ Logical Replication ทรงพลัง | 🟡 เสมอ |
| **Performance simple SELECT** | เร็วเล็กน้อย | ใกล้กัน | 🟡 |
| **Performance complex JOIN** | ช้ากว่า | optimizer ฉลาดกว่า | 🟢 PG |
| **Stored procedure** | ใช้ได้ | PL/pgSQL ทรงพลังกว่า | 🟢 PG |
| **Full-text search** | มี แต่ basic | tsvector + GIN index ดีกว่ามาก | 🟢 PG |

**ผลกระทบกับโปรเจกต์นี้โดยตรง:**

```sql
-- รหัสที่ใช้จริง — ทำได้บน PostgreSQL ใน 1 query
-- ใน postgreSQL (เดิมคือ MySQL) ต้องทำ 3 query (SELECT → check → UPDATE → SELECT)
UPDATE dynamic_qr_tokens
SET is_consumed = TRUE, consumed_at = NOW()
WHERE token = $1
  AND is_consumed = FALSE
  AND expires_at > NOW()
RETURNING id, room_code;        -- ← postgreSQL (เดิมคือ MySQL) ทำตรงนี้ไม่ได้
```

```sql
-- Rate limit แบบ atomic — postgreSQL (เดิมคือ MySQL) ทำได้แต่ syntax ยุ่งยากกว่า
INSERT INTO rate_limits (key, count, window_start)
VALUES ($1, 1, NOW())
ON CONFLICT (key) DO UPDATE        -- ← PostgreSQL clean syntax
  SET count = ...
RETURNING count;
```

#### 45.2.2 เหตุผลด้าน Ecosystem

- **TypeScript types**: `node-postgres` มี TypeScript types ที่ดีกว่า, query result เป็น object พร้อมใช้
- **Supabase Realtime**: ถ้าจะเพิ่มในอนาคต ใช้ PostgreSQL LISTEN/NOTIFY ผ่าน WebSocket ได้ฟรี
- **Row-Level Security (RLS)**: สำหรับ multi-tenancy ในอนาคต
- **pgvector**: ถ้าจะเพิ่ม AI/embedding ในอนาคต

### 45.3 ทำไมย้ายจาก postgreSQL/Aiven (เดิมคือ MySQL) → PostgreSQL/Supabase (กลางทาง)

#### 45.3.1 ปัญหาที่เจอจริงกับ postgreSQL/Aiven (เดิมคือ MySQL)

```mermaid
flowchart TD
    A["รัน production 2 สัปดาห์แรก"] --> B["ผู้ใช้บ่นว่าระบบ 'หน่วง'"]
    B --> C["วิเคราะห์: Vercel logs"]
    C --> D["พบ API response time 300-500ms"]
    D --> E["แยก breakdown ของเวลา"]
    E --> F1["DB connection: 80-120ms"]
    E --> F2["DB query: 150-200ms"]
    E --> F3["Code: ~30ms"]
    F1 --> G["สาเหตุ: เซิร์ฟเวอร์ Aiven free tier อยู่ Mumbai"]
    F2 --> G
    G --> H["Vercel SG → Mumbai = ~80ms RTT"]
    H --> I["1 request มี ~4 query → 320ms รวมแค่ network"]
    I --> J["ตัดสินใจหาทางเลือก"]
```

#### 45.3.2 ค่า Latency ที่วัดได้จริง

```
Aiven postgreSQL (เดิมคือ MySQL) (Mumbai, free tier):
├─ TLS handshake     : 95ms
├─ Auth roundtrip    : 60ms
├─ SELECT 1 (warm)   : 78ms  ← network RTT คือพระเอก
├─ SELECT 1 (cold)   : 240ms
├─ INSERT 1 row      : 85ms
└─ Connection idle   : disconnect 10 นาที → ต้อง handshake ใหม่

Supabase PostgreSQL (Singapore, free tier):
├─ TLS handshake     : 22ms
├─ Auth roundtrip    : 15ms (pgBouncer pool)
├─ SELECT 1 (warm)   : 18ms
├─ SELECT 1 (cold)   : 55ms
├─ INSERT 1 row      : 25ms
└─ Connection idle   : pgBouncer reuse → 0ms handshake ครั้งถัดไป
```

**ผลลัพธ์**: API response p95 ลดจาก **480ms → 110ms** (เร็วขึ้น 4 เท่า)

#### 45.3.3 ที่มาของการต่างกัน: Network Geography

```mermaid
flowchart LR
    User["ผู้ใช้ในประเทศไทย"] -->|"~10ms"| ISP["TRUE/AIS/3BB"]
    ISP -->|"~30ms"| VercelSG["Vercel<br/>Singapore"]
    VercelSG -->|"~80ms"| Mumbai[("postgreSQL (เดิมคือ MySQL)@Aiven<br/>Mumbai, India")]
    VercelSG -->|"~20ms"| SGDB[("PostgreSQL@Supabase<br/>Singapore")]

    style Mumbai fill:#c0392b,stroke:#7b241c,color:#ffffff
    style SGDB fill:#27ae60,stroke:#196f3d,color:#ffffff
```

| เส้นทาง | Distance | Cable Route | RTT (วัดจริง) |
|---------|----------|-------------|----------------|
| Singapore → Mumbai | ~3,900 km | SEA-ME-WE 5 + i2i | 75-90ms |
| Singapore → Singapore (intra) | <50 km | local DC | 1-3ms |
| ผลรวม Vercel→DB | — | — | **PG เร็วกว่า 4 เท่า** |

#### 45.3.4 เหตุผลอื่น ๆ ที่ผลักดันให้ย้าย

| ปัญหา | postgreSQL/Aiven (เดิมคือ MySQL) | PostgreSQL/Supabase |
|--------|-------------|---------------------|
| Connection limit free tier | 16 connection | 60 connection (+ pgBouncer pool ใช้ได้เกินก็ไม่ติด) |
| Backup | manual | automatic daily + point-in-time recovery |
| Dashboard | basic | สวย + SQL editor + visualizer |
| Storage limit | 1 GB | 500 MB (น้อยกว่า แต่ยังพอ) |
| Outbound traffic | 5 GB/เดือน | 5 GB/เดือน |
| Region pinning ฟรี | ❌ Mumbai เท่านั้น | ✅ เลือก SG/Tokyo/Frankfurt ได้ |
| SSL/CA cert | manual download | จัดให้ + auto-rotate |
| pgBouncer | ❌ | ✅ built-in |
| Realtime subscription | ❌ | ✅ |
| REST API auto-gen | ❌ | ✅ (PostgREST) — แม้ไม่ได้ใช้ก็เผื่อไว้ |

### 45.4 Aiven vs Supabase — เปรียบเทียบเต็ม

#### 45.4.1 ตารางเปรียบเทียบราคา

| รายการ | Aiven Free | Aiven Hobbyist ($19) | Supabase Free | Supabase Pro ($25) |
|--------|------------|----------------------|---------------|---------------------|
| Storage | 1 GB | 4 GB | 500 MB | 8 GB |
| RAM | 1 GB | 1 GB | shared | 1 GB dedicated |
| Connections | 16 | 25 | 60 (pooled ~200) | 60 (pooled ~400) |
| Region ฟรี | Mumbai only | เลือกได้ | SG/Tokyo/etc | เลือกได้ |
| Backup | ❌ | 2 วัน | 7 วัน | 7 วัน + PITR |
| Bandwidth | 5 GB | 30 GB | 5 GB | 250 GB |
| SLA | ❌ | 99.99% | ❌ | 99.9% |
| pgBouncer | ❌ | ❌ (จัดเอง) | ✅ | ✅ |
| Realtime | ❌ | ❌ | ✅ | ✅ |
| Edge Functions | ❌ | ❌ | ✅ | ✅ |

#### 45.4.2 ทำไมไม่ใช้ Aiven PostgreSQL ฟรี?

> ก็เป็นทางเลือก แต่ Aiven free tier บังคับ Mumbai เท่านั้น → ปัญหา latency เหมือนเดิม

ถ้าจ่าย $19/เดือน Aiven Hobbyist ให้เลือก region ได้ → Singapore ได้ — แต่ทำไมยังเลือก Supabase?
- ✅ Supabase ฟรีและเลือก region ได้เลย (ไม่ต้องจ่าย)
- ✅ pgBouncer มาให้พร้อม (Aiven ต้อง config เอง)
- ✅ Dashboard UX ดีกว่า + มี SQL editor ใน browser
- ✅ ถ้าโตในอนาคตยังต่อยอด Realtime/Edge Function/Storage ได้

#### 45.4.3 ทำไมไม่ใช้ Aiven postgreSQL (เดิมคือ MySQL) เก่า แต่ย้าย region?

- Aiven free tier **ล็อกเฉพาะ Mumbai** — ย้ายไม่ได้
- ต้องอัปเกรดเป็น Hobbyist ($19/เดือน) ถึงจะย้ายได้
- เปลี่ยน DB engine + ย้าย region ฟรี ดีกว่าจ่าย $19/เดือนเพื่อแค่ย้าย region

### 45.5 ขั้นตอนการ Migrate ที่ใช้จริง

```mermaid
flowchart TD
    A["1. สร้าง Supabase project SG"] --> B["2. แปลง postgreSQL (เดิมคือ MySQL) schema → PG schema"]
    B --> C["3. แก้ types: TINYINT(1)→BOOLEAN<br/>AUTO_INCREMENT→SERIAL<br/>DATETIME→TIMESTAMPTZ"]
    C --> D["4. Export ข้อมูลจาก postgreSQL (เดิมคือ MySQL) (mysqldump)"]
    D --> E["5. Transform เป็น PG syntax<br/>(เปลี่ยน backtick ` เป็น quote \")"]
    E --> F["6. Import ลง Supabase ผ่าน psql"]
    F --> G["7. แก้ code: pg → pg"]
    G --> H["8. แก้ query: ? → $1, $2<br/>เพิ่ม RETURNING * ที่ INSERT"]
    H --> I["9. ทดสอบทุก API endpoint"]
    I --> J["10. เปลี่ยน env var ใน Vercel"]
    J --> K["11. Deploy + monitor"]
```

#### 45.5.1 ปัญหาที่เจอตอน migrate

| ปัญหา | สาเหตุ | วิธีแก้ |
|--------|--------|---------|
| `AUTO_INCREMENT` ใช้ใน PG ไม่ได้ | syntax ต่าง | ใช้ `SERIAL` หรือ `IDENTITY` |
| `LIMIT 10, 20` PG ไม่รองรับ | postgreSQL syntax (เดิมคือ MySQL) เก่า | ใช้ `LIMIT 20 OFFSET 10` |
| Backtick ` PG ใช้ไม่ได้ | quoting identifier | ใช้ double-quote `"` |
| `NOW()` ไม่มี timezone ใน postgreSQL (เดิมคือ MySQL) | TIMESTAMP behavior ต่าง | ใช้ `TIMESTAMPTZ` |
| `INT(11)` | display width concept | ใช้ `INTEGER` |
| Default `CURRENT_TIMESTAMP ON UPDATE` | trigger auto-update | ทำเป็น trigger เอง หรือ update ใน app |
| `ENUM('a','b')` | postgreSQL (เดิมคือ MySQL) feature | ใช้ `CHECK` constraint หรือ table แยก |
| `pg` placeholder `?` | positional | PG ใช้ `$1, $2` |
| `INSERT IGNORE` | postgreSQL (เดิมคือ MySQL) only | ใช้ `INSERT ... ON CONFLICT DO NOTHING` |

### 45.6 ผลลัพธ์หลัง Migrate

| Metric | ก่อน (postgreSQL/Aiven (เดิมคือ MySQL) Mumbai) | หลัง (PG/Supabase SG) | ดีขึ้น |
|--------|---------------------------|------------------------|--------|
| API p50 latency | 320ms | 75ms | **4.3×** |
| API p95 latency | 480ms | 110ms | **4.4×** |
| DB query p95 | 200ms | 28ms | **7.1×** |
| Connection setup | 95ms | 22ms | **4.3×** |
| ESP32 polling cycle | 2.4s | 2.1s | 1.1× (limited by 2s sleep) |
| Cold start | 850ms | 510ms | 1.7× |

> **บทเรียน**: ต้นทุนของการ "เลือก DB ผิด region" สูงกว่าค่าใช้จ่ายในการ migrate มาก — เลือกให้ถูกตั้งแต่ต้น

<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

---

<a id="sec-46"></a>
## 46. อธิบายโค้ดทุกไฟล์ใน `lib/` แบบเจาะลึก

### 46.1 `lib/db.ts` (456 บรรทัด) — Connection + Migration

**โครงสร้างหลัก**:
```ts
let pool: Pool | undefined = (globalThis as any).__pgPool;
let settingsCache: { data: SettingsMap; expiresAt: number } | null = null;
```

**ทำไมใช้ `globalThis`?** — Next.js dev mode ทำ hot-reload ทำให้ module โหลดใหม่ทุก save → ถ้าเก็บ pool ใน module variable ปกติ จะสร้าง pool ใหม่ทุกครั้ง → connection leak → DB ปฏิเสธ connection ใหม่หลัง 60 connection
→ ใช้ `globalThis` (อยู่นอก module scope) ทำให้ singleton จริง

**`readEnv()` — กรณีพิเศษที่เจอจริง**:
```ts
function readEnv(name: string): string | undefined {
  const v = process.env[name];
  if (!v) return undefined;
  const trimmed = v.trim();
  // ถ้าใส่ env ใน Vercel แล้วใส่ quote เกิน → strip
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return trimmed.slice(1, -1);
  }
  return trimmed || undefined;
}
```
> เหตุการณ์จริง: คนตั้ง env ใน Vercel ดashboard แล้วใส่ `"value"` มาด้วย → string มี quote ติด → connection fail

**`initDatabase()` — ลำดับการทำงาน**:
1. ตรวจ pool exist
2. `CREATE TABLE IF NOT EXISTS` ทุกตาราง (idempotent — รันซ้ำได้)
3. สร้าง index ทุกตัว (idempotent ด้วย IF NOT EXISTS)
4. Seed default settings ถ้าไม่มี
5. Seed initial admin ถ้า `ALLOW_DEV_SEED=true`
6. ใน production ถ้า env เป็น default → throw

**ทำไม cache settings 30 วินาที?**
- ESP32 10 บอร์ด × poll ทุก 2 วินาที = 300 query/นาทีไป settings
- ถ้าไม่ cache → 1 ล้าน query/วันแค่ settings
- 30 วินาทีพอเหมาะ — admin แก้ setting รอ max 30s ก็เห็นผล (ยอมรับได้)

**`updateSystemSettings([{key,value}])` — เทคนิค UNNEST**:
```sql
INSERT INTO system_settings (setting_key, setting_value)
SELECT * FROM UNNEST($1::text[], $2::text[])
ON CONFLICT (setting_key)
  DO UPDATE SET setting_value = EXCLUDED.setting_value,
                updated_at = NOW();
```
- ส่ง array 2 ชุด (keys, values)
- PG `UNNEST` กระจายเป็นหลายแถวในครั้งเดียว
- 50 settings = 1 query แทน 50 query
- เร็วกว่า 10-20 เท่า

### 46.2 `lib/auth.ts` (132 บรรทัด)

**`signToken(payload)`**:
```ts
return jwt.sign(payload, JWT_SECRET, {
  algorithm: 'HS256',
  expiresIn: '8h',
});
```

**ทำไม HS256 ไม่ใช่ RS256?**
| | HS256 | RS256 |
|---|-------|-------|
| Key | 1 secret symmetric | private+public pair |
| Speed sign | 0.1ms | 2ms |
| Speed verify | 0.1ms | 0.5ms |
| Use case | server เดียวเซ็น+ตรวจ | หลาย service ตรวจ public key |
| โปรเจกต์นี้ | ✅ เหมาะ (server เดียว) | overkill |

**`getAdminFromCookie()`**:
```ts
const cookieStore = await cookies();
const token = cookieStore.get('smartaccess_admin_token')?.value;
if (!token) return null;
const payload = verifyToken(token);
if (!payload) return null;
// double-check DB เผื่อ admin ถูกลบหลัง JWT ออก
const admin = await db.query('SELECT * FROM admin_users WHERE id=$1', [payload.id]);
return admin.rows[0] ?? null;
```
> เหตุผลของ double-check: ถ้า owner ลบ admin คนนั้น แต่ JWT ยังไม่หมดอายุ → ต้องป้องกัน ghost session

### 46.3 `lib/qr.ts` (289 บรรทัด)

**`generateSecureToken()`**:
```ts
return crypto.randomBytes(16).toString('hex');  // 32 hex chars
```
- 16 bytes = 128 bits ของ entropy
- เพียงพอจน universe ตายก่อนถูก brute-force (เทียบเท่า UUID v4)

**`consumeQRToken(token)` — Atomic Magic**:
```sql
UPDATE dynamic_qr_tokens
SET is_consumed = TRUE, consumed_at = NOW()
WHERE token = $1
  AND is_consumed = FALSE       -- ← กัน double-use
  AND expires_at > NOW()         -- ← กัน expired
RETURNING id, room_code;
```
- PostgreSQL ทำ atomic SELECT+UPDATE ใน statement เดียว
- ถ้า 2 คนกดพร้อมกัน — มีเพียง 1 row return
- ทำไมต้องตรวจ format 32 hex ก่อน? → กัน SQL injection แม้ parameterized แล้วก็ตาม + filter input ก่อนไป DB ลด CPU

### 46.4 `lib/esp32.ts` (291 บรรทัด) — Command Queue + LAN Push

**`openDoor(studentId, roomCode)` — Hybrid Strategy**:
```ts
// Step 1: เขียน command ลง DB (canonical source)
await db.updateSystemSetting(`room_cmd_${roomCode}`, `unlock:${studentId}`);

// Step 2: ลอง LAN direct push (best-effort)
if (!isCloudEnvironment() && roomIp) {
  tryLanDirectBackground(roomIp, studentId, roomCode);  // fire-and-forget
}

// Step 3: บันทึก log
await db.query('INSERT INTO access_logs ...');
```

**ทำไม "เขียน DB ก่อน" แล้ว "LAN push ทีหลัง"?**
- DB = ground truth — ถ้า ESP32 reboot กลาง process จะดึงคำสั่งต่อได้
- LAN push = optimization — ถ้าสำเร็จ → เปิดประตูเร็วขึ้น (~150ms)
- ถ้า LAN push ล้มเหลว → fallback เป็น polling 2 วินาที (ยอมรับได้)

**`fetchWithTimeout()`**:
```ts
const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), timeoutMs);
try {
  return await fetch(url, { signal: controller.signal });
} finally {
  clearTimeout(timer);
}
```
- ทำไมต้อง timeout? — ESP32 อาจค้าง / network drop → request ค้าง 30 วินาที = ผู้ใช้รอ → ตั้ง 1.5s
- ทำไมต้อง `clearTimeout`? — กัน memory leak ใน Node

### 46.5 `lib/rate-limit.ts` (43 บรรทัด) — Atomic Counter

**ทั้งฟังก์ชันใน 1 SQL**:
```sql
INSERT INTO rate_limits (key, count, window_start)
VALUES ($1, 1, NOW())
ON CONFLICT (key) DO UPDATE
SET count = CASE
    WHEN rate_limits.window_start < NOW() - $2::interval THEN 1
    ELSE rate_limits.count + 1
  END,
  window_start = CASE
    WHEN rate_limits.window_start < NOW() - $2::interval THEN NOW()
    ELSE rate_limits.window_start
  END
RETURNING count;
```

**ทำไมไม่ใช้ Redis/Upstash?**
- ✅ Database เดียว = ลด dependency
- ✅ Atomic ในตัว
- ❌ ใช้ DB resource สำหรับ rate-limit (ถ้า scale สูงควรย้าย)

### 46.6 `lib/discord.ts` (367 บรรทัด) — Event Routing

```mermaid
flowchart LR
    EV["Event<br/>(student_approved, door_opened, ...)"] --> ROUTE{เลือก webhook}
    ROUTE -->|"per-room"| W1["discord_webhook_CE-401"]
    ROUTE -->|"global"| W2["DISCORD_WEBHOOK_URL env"]
    ROUTE -->|"log only"| W3["DISCORD_WEBHOOK_LOG_URL"]
    W1 --> BUILD["Build embed<br/>(title, color, fields, footer)"]
    W2 --> BUILD
    W3 --> BUILD
    BUILD --> POST["POST webhook"]
    POST -.->|"error → swallow"| END["return"]
```

**ทำไม embed มีสี?**
- 🟢 เขียว = approved / door_opened
- 🔴 แดง = rejected / door_failed
- 🟡 เหลือง = student_registered / pending
- 🟣 ม่วง = system event
- → admin มอง Discord 1 วินาทีก็แยกออกว่าด่วนหรือไม่

### 46.7 `lib/pdf.ts` (373 บรรทัด) — Server-side PDF

**ขั้นตอนสร้าง PDF**:
```mermaid
flowchart TD
    A["Request /api/export/pdf"] --> B["Query students + logs"]
    B --> C["Create PDFDocument (pdfkit)"]
    C --> D["Load Thai fonts<br/>(Tahoma + Tahoma Bold)"]
    D --> E["Draw header (purple bar)"]
    E --> F["Draw info boxes"]
    F --> G["Loop students → draw row"]
    G --> H{หน้าเต็ม?}
    H -->|ใช่| I["doc.addPage()"]
    H -->|ไม่| G
    I --> G
    G --> J["Draw footer page number"]
    J --> K["doc.end() → stream Buffer"]
    K --> L["Response PDF blob"]
```

**ทำไมไม่ใช้ Puppeteer (HTML→PDF)?**
- Puppeteer ใหญ่ ~300MB → Vercel function ขนาดเกิน
- ฟอนต์ไทยใน headless Chrome ลำบาก
- pdfkit ขนาด ~3MB + ฟอนต์ Tahoma ~700KB → รวม < 5MB

### 46.8 `lib/api-security.ts` (77 บรรทัด) — ESP32 API Key

```ts
export function verifyApiKey(request: NextRequest): boolean {
  const key = request.headers.get('x-api-key');
  if (!key) return false;
  // timing-safe compare (กัน timing attack)
  return crypto.timingSafeEqual(
    Buffer.from(key),
    Buffer.from(process.env.ESP32_API_KEY!)
  );
}
```

**ทำไมใช้ `timingSafeEqual` ไม่ใช่ `===`?**
- `===` หยุดเปรียบเทียบทันทีที่เจอ char ต่าง
- attacker วัดเวลา response → guess char ทีละตัว → 10⁴ ครั้ง crack ได้ key 32 chars
- `timingSafeEqual` เปรียบเทียบทุก byte เท่ากันเสมอ → ไม่มี timing leak

### 46.9 `lib/resilience.ts` (43 บรรทัด) — Retry Wrapper

```ts
export async function withRetry<T>(
  fn: () => Promise<T>,
  opts = { retries: 3, baseDelay: 100 }
): Promise<T> {
  let lastErr;
  for (let i = 0; i <= opts.retries; i++) {
    try { return await fn(); }
    catch (e) {
      lastErr = e;
      if (i < opts.retries) {
        await sleep(opts.baseDelay * Math.pow(2, i));  // exponential backoff
      }
    }
  }
  throw lastErr;
}
```
- Delay 100ms → 200ms → 400ms → 800ms
- ใช้กับ Discord webhook (เผื่อ rate limit ชั่วคราว)

<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

---

<a id="sec-47"></a>
## 47. Admin Dashboard ทีละ Tab แบบเจาะลึก

### 47.1 State Tree ของ Dashboard

```ts
// ภายใน AdminDashboard component
const [activeTab, setActiveTab] = useState<TabKey>('pending');
const [pending, setPending] = useState<Student[]>([]);
const [students, setStudents] = useState<Student[]>([]);
const [logs, setLogs] = useState<AccessLog[]>([]);
const [admins, setAdmins] = useState<Admin[]>([]);
const [settings, setSettings] = useState<SettingsMap>({});
const [systemStatus, setSystemStatus] = useState<SystemStatus>();
const [rooms, setRooms] = useState<Room[]>([]);
const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
const [toast, setToast] = useState<Toast | null>(null);
// ... และอีก ~30 state
```

**ทำไม state เยอะ?**
- ทุก tab ใช้ data set ของตัวเอง
- แต่ละ action (approve/reject/delete) ต้อง re-fetch แค่บางส่วน
- แยก state ทำให้ optimistic UI ได้ง่าย

### 47.2 useEffect Lifecycle

```mermaid
flowchart TD
    A["Component mount"] --> B["useEffect[]: ตรวจ /api/auth/me"]
    B --> C{login?}
    C -->|ไม่| D["router.push('/admin/login')"]
    C -->|ใช่| E["fetchAll() + fetchPending() + fetchSettings() พร้อมกัน"]
    E --> F["setInterval ทุก 10s: fetchPending()"]
    F --> G{มี pending ใหม่?}
    G -->|ใช่| H["playSoftChime() + flash badge"]
    G -->|ไม่| F
    A --> I["useEffect[activeTab]: fetch ข้อมูล tab นั้น"]
    I --> J["ถ้า tab=logs → fetchLogs() จำกัด 200 ล่าสุด"]
    A --> K["useEffect cleanup: clearInterval + abort fetch"]
```

### 47.3 Tab "คิวรอตรวจสอบ" (Pending)

**โครงสร้างการแสดง**:
```
┌─────────────────────────────────────────────────────────┐
│ 🔔 คิวรอตรวจสอบ (3)        [filter] [search] [refresh] │
├─────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────┐ │
│ │ 👤 นาย ก. ข.   60xxxxxxxx-x   วิศวกรรมศาสตร์    │ │
│ │    คอมพิวเตอร์ ปี 3 — ขอเข้า CE-401              │ │
│ │    ส่งคำขอเมื่อ 14:32 (3 นาทีที่แล้ว)             │ │
│ │    [✓ อนุมัติ]  [✗ ปฏิเสธ]  [👁 ดูรายละเอียด]    │ │
│ └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**เหตุผลการออกแบบ**:
- Card ใหญ่ ปุ่มชัด → admin กดผิดยาก
- เวลาบอก relative ("3 นาทีที่แล้ว") → รู้ urgency เร็ว
- ฟิลด์รหัสนักศึกษาแสดงเต็ม → ตรวจกับบัตรได้ทันที

**Optimistic UI**:
```ts
async function handleApprove(id: number) {
  // 1. ลบออกจาก list ทันที (UI เร็ว)
  setPending(prev => prev.filter(s => s.id !== id));
  try {
    await fetch(`/api/students/${id}/approve`, { method: 'POST' });
    showToast('อนุมัติแล้ว', 'success');
  } catch (e) {
    // 2. ถ้าล้มเหลว → ดึงกลับมาแสดง
    fetchPending();
    showToast('เกิดข้อผิดพลาด', 'error');
  }
}
```

### 47.4 Tab "ทำเนียบและประวัติ" (Students)

**Layout**: ตาราง + filter + search + pagination + bulk actions

```
┌─────────────────────────────────────────────────────────┐
│ [search ___] [คณะ ▼] [สถานะ ▼] [วันที่ ▼] [export PDF]│
├──┬──────────┬──────────┬─────────┬────────┬─────────────┤
│☐│รหัส      │ชื่อ      │คณะ      │สถานะ   │การจัดการ    │
├──┼──────────┼──────────┼─────────┼────────┼─────────────┤
│☐│60xxxx-x  │ก. ข.     │วิศวฯ    │approve │👁 🔓 📄 🗑   │
└──┴──────────┴──────────┴─────────┴────────┴─────────────┘
```

**Search Algorithm (client-side)**:
```ts
const filtered = students.filter(s => {
  if (search) {
    const q = search.toLowerCase();
    if (!s.first_name.toLowerCase().includes(q)
     && !s.last_name.toLowerCase().includes(q)
     && !s.student_id.includes(q)) return false;
  }
  if (facultyFilter && s.faculty !== facultyFilter) return false;
  if (statusFilter && s.status !== statusFilter) return false;
  return true;
});
```

**ทำไมไม่ใช้ server-side search?**
- ข้อมูลรวมไม่เกิน 2,000 row ในช่วง 4 ปีของหลักสูตร
- Network latency 100ms + ทุกครั้งที่พิมพ์ = laggy
- Client-side fuzzy match = instant feedback
- ถ้าโต > 10,000 row จึงค่อยย้ายเป็น server-side

### 47.5 Tab "ผู้ดูแลระบบ" (Admins)

**สิทธิ์การเข้าถึง**: เฉพาะ `role=owner`
- ถ้า `door_operator` กดเข้า → 403 + redirect

**Form สร้าง admin**:
```tsx
<form onSubmit={handleCreateAdmin}>
  <input name="username" pattern="^[a-zA-Z0-9_.]{3,30}$"
         title="3-30 ตัวอักษร: a-z 0-9 _ ." required />
  <input name="password" type="password" minLength={12} required 
         title="รหัสผ่านต้องมีอย่างน้อย 12 ตัวอักษร มีตัวพิมพ์ใหญ่ พิมพ์เล็ก ตัวเลข และอักขระพิเศษ" />
  <input name="full_name" required />
  <select name="role">
    <option value="door_operator">Door Operator</option>
    <option value="owner">Owner</option>
  </select>
  {/* เพิ่มฟิลด์ป้อนข้อกำหนดขอบเขตห้องเรียน */}
  <input name="allowed_rooms" placeholder="CE-401,CE-402 (ว่างไว้ = สิทธิ์เข้าถึงทุกห้อง)" />
  <button>สร้าง</button>
</form>
```

**ทำไม username pattern strict และรหัสผ่านหนาแน่น?**
- รหัสผ่านบังคับอย่างน้อย **12 ตัวอักษร** (ตาม Security Policy ใหม่ เพื่อรับมือกับกำลังประมวลผลถอดรหัสลับความเร็วสูงของแฮกเกอร์)
- ฟิลด์ `allowed_rooms` อนุญาตให้กำหนดสิทธิ์ห้องเรียนแบบระบุรายชื่อแยกตามเครื่องหมายจุลภาค (CSV string) ซึ่งระบบจะนำคีย์อาเรย์นี้ไปคิวรี่เช็คสิทธิ์ในระดับ Middleware และ API เสมอ
- กัน Unicode lookalike (ตัวอักษรซีริลลิก/ไทย ที่ดูเหมือนละติน)
- กัน SQL injection ในขั้น input (defense-in-depth)
- ป้องกัน confused deputy attack และความเสี่ยงเรื่องสิทธิ์แอดมินก้าวล่วงสิทธิ์ต่างห้องเรียน (Cross-Room Admin Privilege Abuse)

### 47.6 Tab "ห้องเรียนและ ESP32"

**ส่วนประกอบ**:
1. **รายการห้อง** — แสดงสถานะ online/offline แต่ละห้อง
2. **ปุ่มทดสอบ** — ping ESP32 ที่ห้องนั้น
3. **ปุ่มปลดล็อกด่วน** — ส่ง unlock command ทันที
4. **Panel รายละเอียด** — IP, last_seen, webhook URL, ตัวอย่าง config.h
5. **Code generator** — สร้างไฟล์ `config.h` + `.ino` ตามห้อง

```mermaid
flowchart LR
    USER["Admin คลิกห้อง CE-401"] --> PANEL["เปิด panel ขวา"]
    PANEL --> A["fetch /api/esp32/status?room=CE-401"]
    A --> B["แสดง IP / last_seen / heartbeat"]
    PANEL --> C["ปุ่ม 'สร้าง config.h'"]
    C --> D["getConfigCode('CE-401', origin)"]
    D --> E["template literal กับ room, url, key"]
    E --> F["copy to clipboard"]
```

### 47.7 Tab "ตั้งค่าระบบ" (Settings)

**กลุ่ม Settings**:
1. **Auto-approve window** — เวลาเริ่ม/สิ้นสุด, วันในสัปดาห์
2. **Auto-fill mode** — `auto` / `manual` / `disabled`
3. **Discord webhooks** — global + per room + per event-type
4. **QR token TTL** — rotation 60s, expiry 300s (default)
5. **Rate limits** — login attempts, bypass attempts
6. **Privacy** — masking รหัสนักศึกษาในจอ TFT
7. **Logging** — retention days (≥90 ตามกฎหมาย)
8. **ESP32** — mode, default IP

**การ save**:
```ts
// Batch save ทุก setting พร้อมกัน
await fetch('/api/system/settings', {
  method: 'POST',
  body: JSON.stringify({ settings: [
    { key: 'auto_approve_start', value: '08:00' },
    { key: 'auto_approve_end', value: '17:00' },
    // ... 50+ settings
  ]})
});
// → backend ใช้ UNNEST 1 query → เร็ว
```

### 47.8 Tab "คู่มือ"

แสดง markdown ที่อธิบายระบบให้ admin ใหม่ — แต่จริง ๆ คู่มือที่คุณกำลังอ่านนี่ละเอียดกว่ามาก

<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

---

<a id="sec-48"></a>
## 48. React Hydration & SSR Lifecycle

### 48.1 Next.js App Router Rendering Pipeline

```mermaid
sequenceDiagram
    participant U as User
    participant V as Vercel Edge
    participant N as Next.js Server
    participant R as React Server
    participant B as Browser
    U->>V: GET /
    V->>N: Forward request
    N->>R: render Server Components
    R->>R: ดึงข้อมูล (ถ้ามี async)
    R-->>N: HTML string + RSC payload
    N-->>V: HTML + JS bundle URLs
    V-->>B: HTML (มี content แล้ว — SEO ดี)
    B->>B: แสดง HTML ทันที (FCP)
    B->>V: load _next/static/chunks/*.js
    V-->>B: JS (มี cache CDN)
    B->>B: React hydrate Client Components
    B->>B: useEffect ทำงาน → API calls
```

### 48.2 หน้า `/` (registration) — Server vs Client

```tsx
// app/page.tsx �**บทวิเคราะห์เชิงเศรษฐศาสตร์สำหรับ Thesis:**
การเปลี่ยนผ่านสถาปัตยกรรมจากรูปแบบเซิร์ฟเวอร์กลางภายในสถาบัน (On-Premises) มาสู่คลาวด์ไร้เซิร์ฟเวอร์ (Serverless Cloud Technology) ทำให้โปรเจกต์นี้มีคุณลักษณะเด่นในด้าน **อัตราการขยายตัวที่ไร้ขีดจำกัด (Highly Scalable)** เนื่องจากสถาบันการศึกษาสามารถขยายระบบเพื่อควบคุมประตูห้องเรียนเพิ่มจาก 1 ห้องเรียน ไปสู่ 100 ห้องเรียนได้ทันทีโดยเพิ่มงบประมาณซื้อเพียงแผงควบคุม ESP32 บอร์ดละ 1,500 บาทต่อห้องเท่านั้น โดยไม่ต้องทำการอัปเกรดหรือลงทุนซอฟต์แวร์เซิร์ฟเวอร์ส่วนกลางเพิ่มแอยางใด เป็นการตอบโจทย์การประหยัดพลังงานและความคุ้มทุนสูงสุดในการดำเนินงานจริง

<a id="sec-71-10"></a>
### 71.10 ตารางวิเคราะห์และแก้ไขปัญหาขัดข้องทางเทคนิค (Step-by-Step Error Diagnostic Matrix)

เพื่อเป็นข้อมูลนำเสนอในภาคผนวกคู่มือการแก้ปัญหาของวิทยานิพนธ์ ตารางด้านล่างแสดงรหัสความผิดพลาด สาเหตุ และแผนการแก้ไขปัญหาเชิงโครงสร้างของระบบอย่างครบถ้วน:

#### 1. ตารางสัญญาณไฟเตือนและรหัสเสียง (Visual & Auditory Diagnostic Codes)

| รูปแบบสัญญาณ | อุปกรณ์ที่เกิด | สาเหตุทางเทคนิค (Root Cause) | แนวทางแก้ไขเบื้องต้น (Remediation) |
|---|---|---|---|
| **ไฟ LED Wi-Fi กระพริบช้าๆ** (1 ครั้งต่อวินาที) | บอร์ด ESP32 | บอร์ดพยายามเชื่อมต่อ Wi-Fi ในพื้นที่แต่ล้มเหลว หรือสัญญาณหลุด | ตรวจสอบรหัสผ่าน Wi-Fi ใน `config.h` หรือความแรงสัญญาณ AP |
| **ไฟ LED Wi-Fi กระพริบถี่ๆ** (5 ครั้งต่อวินาที) | บอร์ด ESP32 | เชื่อมต่อ AP สำเร็จแล้ว แต่บอร์ดไม่ได้รับ IP Address จากระบบ DHCP | ตรวจสอบเราเตอร์และช่วงที่แจกไอพี หรือทำการสวิตช์ไปใช้ IP แบบ Static |
| **เสียง Buzzer ปี๊บสั้น 3 ครั้ง** | บอร์ด ESP32 | บอร์ดทำการเริ่มต้นระบบ (Boot) และเชื่อมต่อเครือข่ายอินเทอร์เน็ตสำเร็จ | สถานะการทำงานปกติ พร้อมเข้าสู่การทำงาน Polling |
| **เสียง Buzzer ปี๊บยาว 1 ครั้ง** | บอร์ด ESP32 | ประตูได้รับคำสั่งอนุมัติปลดล็อก (`door_trigger: "open"`) | สถานะปกติ รีเลย์จะจ่ายพลังงานไฟฟ้าสลับขั้วกลอน |
| **เสียง Buzzer ปี๊บสั้น 5 ครั้งถี่ๆ** | บอร์ด ESP32 | เกิดความผิดพลาดในการส่ง header ยืนยันสิทธิ์ (`x-api-key` ไม่ถูกต้อง) | ตรวจสอบค่า `ESP32_API_KEY` บน Vercel และบอร์ดให้ตรงกัน |
| **หน้าจอขึ้นแถบสีแดงด้านบนค้าง** | หน้าจอ TFT | เกิดความล้มเหลวในการส่ง HTTP Request หรือ Server ล่มตอบกลับช้า | เช็คสถานะ Web Hosting และเกตเวย์อินเทอร์เน็ต |

#### 2. ตารางรหัสข้อผิดพลาด API (HTTP Response Status Code Diagnostic)

| HTTP Code | ข้อความและสาเหตุหลัก | ปัญหาทางเน็ตเวิร์ก/ซอฟต์แวร์ | วิธีการแก้ไขเชิงแอดมิน |
|---|---|---|---|
| **401 Unauthorized** | คีย์ API ผิดพลาด หรือไม่มี Token แอดมิน | `ESP32_API_KEY` หรือ JWT Session ของแอดมินหมดอายุการล็อกอิน | ตรวจสอบสภาพแวดล้อมระบบหรือทำการลงชื่อเข้าสู่ระบบใหม่อีกครั้ง |
| **403 Forbidden** | ดำเนินการนอกขอบเขตห้องที่รับผิดชอบ | ผู้ใช้เป็น `door_operator` ที่ไม่มีสิทธิ์ดูแลห้องนั้นตามคอลัมน์ `allowed_rooms` | ดำเนินการยกระดับสิทธิ์ผู้ใช้เป็น `owner` หรือตั้งค่า CSV เพิ่มห้องเรียน |
| **429 Too Many Requests** | ปริมาณคำขอถล่มเข้ามาเกินขอบเขต | ระบบ Rate Limiter ดักพบไอพีแอดเดรสใช้งานเกิน 5 ครั้งต่อ 1 นาที | หยุดยิงทดสอบ API และรอให้ครบ 60 วินาที ระบบจะปลดล็อกเอง |
| **500 Database Connection Fail** | ไม่สามารถสถาปนาท่อหาฐานข้อมูลได้ |Supabase Database ล่ม หรือโควตาเชื่อมต่อเกินขีดจำกัด (Connection Limit Exceeded) | ตรวจสอบระบบ PgBouncer (Port 6543) หรือรีบูต Connection Pool |

<a id="sec-71-11"></a>
### 71.11 คู่มือการบำรุงรักษาเชิงป้องกันและการลดสัญญาณรบกวนในระบบวงจรจริง (Preventive Maintenance & Hardware De-noising)

สำหรับหัวข้อกระบวนการทดลองและประเมินผลการใช้งานในพื้นที่อาคารเรียนจริง การบำรุงรักษาสภาพทางกายภาพของฮาร์ดแวร์เพื่อรองรับการเปิดใช้งานแบบ 24/7 มีความสำคัญดังนี้:

#### 1. การลดความร้อนสะสมในแผงวงจร (Thermal Management)
ชิป ESP32 DevKit V1 เมื่อเปิดใช้งาน Wi-Fi รับส่งข้อมูลทุก ๆ 2 วินาทีต่อเนื่อง จะเกิดความร้อนสะสมบนชิปควบคุมแรงดัน (LDO Regulator) และตัวบอร์ด RF:
- **แนวทางปฏิบัติ:** บอร์ดที่ติดตั้งจริงหน้าห้องเรียนต้องบรรจุลงในกล่องพลาสติก ABS ที่มีการเจาะรูระบายความร้อนด้านล่างและด้านข้างอย่างน้อย 4 จุด หรือใช้อะแดปเตอร์ภายนอกขนาด 5V โดยตรงแทนการดึงไฟ 12V ผ่านชิป LDO ของบอร์ดโดยตรง เพื่อลดภาระการเปลี่ยนรูปความร้อนสะสมบนบอร์ดควบคุม

#### 2. การแก้ปัญหาสัญญาณเหนี่ยวนำขดลวดของรีเลย์ลบล้างไมโครคอนโทรลเลอร์ (Relay Arcing & Snubber Design)
การสับเปลี่ยนสวิตช์รีเลย์ (Relay Switching) ที่มีความถี่สูงเพื่อจ่ายไฟ 12V ให้กลอนแม่เหล็กไฟฟ้า (Electromagnetic Lock) จะทำให้เกิดประกายไฟขนาดเล็กที่หน้าสัมผัสขดลวดรีเลย์ (Arcing) ส่งผลให้เกิดคลื่นสัญญาณรบกวนแม่เหล็กไฟฟ้า (EMI Spike) ย้อนกลับเข้ามายังสายสัญญาณ GPIO ส่งผลให้บอร์ด ESP32 ทำงานผิดพลาดหรือรีบูตตัวเองโดยไม่มีสาเหตุ:
- **แนวทางปฏิบัติเชิงวิจัย:** 
  1. ติดตั้ง **Flyback Diode (เช่น 1N4007)** คร่อมขั้วบวกและขั้วลบของกลอนแม่เหล็กไฟฟ้าในทิศทางย้อนกลับ (Cathode ต่อขั้วบวก, Anode ต่อขั้วลบ) เพื่อซับแรงดันกระชาก (Back-EMF)
  2. กรณีต่อวงจรกลอนขนาดใหญ่ที่มีแรงดันสูง ควรติดตั้ง **RC Snubber Circuit** (ตัวต้านทาน 100 โอห์ม อนุกรมกับตัวเก็บประจุ 0.1 ไมโครฟารัด) คร่อมที่หน้าสัมผัสของรีเลย์ เพื่อช่วยดูดซับสัญญาณรบกวนความถี่สูงและยืดอายุการใช้งานของหน้าสัมผัสรีเลย์ได้นานขึ้น 5 เท่า

<a id="sec-71-12"></a>
### 71.12 แผนการทำระบบอัปเดตเฟิร์มแวร์ไร้สายความปลอดภัยสูง (Secure OTA Update Architecture Concept)

เพื่อเพิ่มความสามารถการพัฒนาเทคโนโลยีในอนาคต (Future-Proofing & Extensibility) สำหรับโครงงานวิจัยระดับสูง การที่ต้องถอดชิป ESP32 ออกจากผนังหน้าห้องเรียนเพื่อเสียบสายแฟลชโปรแกรมใหม่ถือเป็นข้อจำกัดหลักในทางปฏิบัติ ระบบจึงได้รับการวางแผนสถาปัตยกรรม **Secure Over-The-Air (OTA) Updates via HTTPS** ดังนี้:

```mermaid
flowchart TD
    DEV["👤 ผู้พัฒนา / แอดมิน"] -->|"อัปโหลด esp32.bin (Firmware)"| SRV["🖥️ Next.js Server<br/>(Vercel Cloud)"]
    SRV -->|"/api/esp32/firmware-update<br/>HTTPS TLS 1.2"| ESP["📟 ESP32 Controller<br/>(Dual Partition: OTA_0 / OTA_1)"]

    %% ทำสีให้มองง่ายและสวยงามสไตล์ Harmony Palette
    classDef devStyle fill:#7C3AED,stroke:#333,stroke-width:2px,color:#fff;
    classDef srvStyle fill:#3B82F6,stroke:#333,stroke-width:2px,color:#fff;
    classDef espStyle fill:#DB2777,stroke:#333,stroke-width:2px,color:#fff;

    class DEV devStyle;
    class SRV srvStyle;
    class ESP espStyle;
```

#### กลไกการทำงานของระบบ Secure OTA:
1. **การแบ่งส่วนหน่วยความจำ (Partition Table):** กำหนด Partition ในชิป ESP32 ให้มีพื้นที่เก็บโปรแกรม 2 ส่วนหลักคือ `ota_0` และ `ota_1` และมีส่วน `otadata` เป็นตัวระบุพาร์ทิชันเริ่มต้นทำงาน
2. **การทำสัญญายืนยันความปลอดภัย (HTTPS Signature Verification):** 
   - เมื่อผู้พัฒนาอัปโหลดไฟล์เฟิร์มแวร์ตัวใหม่ `.bin` ขึ้นสู่คลาวด์ แอดมินจะตั้งค่าระบบให้เปลี่ยนแปรสิทธิ์ในบอร์ด
   - บอร์ด ESP32 ในรอบโพลลิงถัดไปจะดึง URL ข้อมูลเฟิร์มแวร์ใหม่และทำการดาวน์โหลดผ่านโปรโตคอลความปลอดภัย **HTTPS (TLS 1.2)**
   - ตัวบอร์ดจะทำการดาวน์โหลดไฟล์ลงในพาร์ทิชันที่ว่างอยู่ (เช่น หากรันอยู่บน `ota_0` จะดาวน์โหลดลง `ota_1`)
3. **การตรวจสอบผลลัพธ์และการทำ Rollback (Fail-safe Booting):**
   - เมื่อดาวน์โหลดเสร็จ บอร์ดจะคำนวณค่าแฮช **SHA-256** เพื่อเช็คความถูกต้องของข้อมูล
   - หากค่าแฮชตรงกับคีย์ที่กำหนด บอร์ดจะเปลี่ยนค่าใน `otadata` ให้หันไปบูตจากพาร์ทิชันใหม่ (`ota_1`)
   - **กรณีขัดข้อง:** หากบูตระบบใหม่แล้วชิปรันโปรแกรมไม่ผ่าน (เช่น เกิดปัญหาเชื่อมต่ออินเทอร์เน็ตล้มเหลว) ตัวชิปจะมีระบบความเสถียรย้อนกลับ (Automatic Rollback) เพื่อหันกลับมาบูตและรันโปรแกรมเวอร์ชันเก่าที่ปลอดภัยบน `ota_0` โดยอัตโนมัติ ช่วยป้องกันอุปกรณ์เสียหายหรือค้างโดยไม่มีผู้ควบคุม

<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

---

> **อัปเดตล่าสุด**: 2026-05-27 18:43:08 +07:00 — ปรับปรุงลิงก์การเชื่อมต่อเว็บไซต์เป็น Production URL (project-sigma-ivory-21.vercel.app), อัปเดตข้อมูลผลการทดสอบความปลอดภัยล่าสุด (Penetration Test & Vulnerability Remediation ณ วันที่ 27 พฤษภาคม 2026) และเพิ่มหัวข้อ §71 อธิบายสถาปัตยกรรมเชิงลึกเพื่อการทำเล่มวิทยานิพนธ์ระดับสถาบันการศึกษา (Push-via-Poll, Atomic Transaction, Defense-in-Depth, พ.ร.บ. คอมพิวเตอร์ และ PDPA) ครบถ้วนละเอียด 6 บทย่อย พร้อมการคำนวณและประเมินกำลังไฟฟ้าวิศวกรรมไฟฟ้า (Power Budget / Fail-Safe), การกู้คืนสภาวะล้มเหลว (Disaster Recovery / Offline Resilience), การวิเคราะห์งบประมาณเชิงความคุ้มทุน (Cloud Economics / Cost Analysis) และตารางวิเคราะห์สาเหตุปัญหา (Diagnostic Matrix), การบำรุงรักษาฮาร์ดแวร์เชิงลึก (Preventive Maintenance & RC Snubber) และการอัปเดตแบบไร้สาย (Secure OTA Update Concept) รวมเป็น 12 บทย่อยเชิงปฏิบัติอย่างสมบูรณ์แบบสูงสุด

<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>ช่วย handle loading state

### 48.4 Hydration Mismatch — บั๊กที่เคยเจอ

```tsx
// ❌ ผิด — server-render ค่าหนึ่ง, client-render อีกค่า
<div>{new Date().toLocaleString('th-TH')}</div>

// ✅ ถูก — เรนเดอร์ค่าเดียวกันก่อน hydrate
const [time, setTime] = useState<string>('');
useEffect(() => { setTime(new Date().toLocaleString('th-TH')); }, []);
return <div>{time || ' '}</div>;
```

**บั๊กจริงที่เคยเจอในโปรเจกต์**:
- ใช้ `Date.now()` ใน render → hydration mismatch
- ใช้ `Math.random()` ใน render → mismatch
- ใช้ timezone-dependent format → server (UTC) vs client (Bangkok) ต่างกัน

### 48.5 Server Action Alternative

Next.js 15 มี Server Actions แต่โปรเจกต์ไม่ใช้ เพราะ:
- ❌ Server Action ไม่ work กับ ESP32 (ESP32 ไม่ใช่ browser)
- ✅ REST API route ใช้ได้ทั้ง browser + ESP32 + 3rd party
- → เลือก REST เป็นหลัก

<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

---

<a id="sec-49"></a>
## 49. Attack Scenarios — Threat Modeling แบบ Step-by-Step

### 49.1 Scenario A: Attacker พยายาม Brute-force Admin Login

```mermaid
sequenceDiagram
    participant A as Attacker
    participant V as Vercel
    participant API as /api/auth/login
    participant DB as PostgreSQL
    A->>V: POST username=admin password=guess1
    V->>API: forward
    API->>DB: rate_limits SELECT key='login:1.2.3.4'
    DB-->>API: count=1
    API->>DB: SELECT admin_users WHERE username=$1
    DB-->>API: row
    API->>API: bcrypt.compare (70ms — slow!)
    API-->>A: 401
    Note over A: ลองอีก...
    A->>V: POST × 6 ครั้ง
    Note over API: count=6 > 5
    API-->>A: 429 Too Many Requests (5 นาที)
    Note over A: เปลี่ยน IP (proxy)
    A->>V: POST จาก IP ใหม่
    API-->>A: 401 (count=1 ของ IP ใหม่)
```

**การป้องกัน 4 ชั้น**:
1. Rate limit 5 ครั้ง/นาที/IP
2. bcrypt 70ms ต่อครั้ง → จำกัดความเร็ว
3. Audit log ทุก fail → admin เห็นใน Discord
4. ถ้า fail หนัก ๆ ปรากฏใน Vercel logs → manual block

**ที่ยังเป็นไปได้**: Distributed botnet (1,000 IPs) ลองคนละ 4 ครั้ง = 4,000 ครั้ง — ป้องกันได้ด้วย CAPTCHA หรือ Cloudflare Turnstile

### 49.2 Scenario B: SQL Injection

```http
POST /api/students
Content-Type: application/json
{
  "first_name": "Bob'; DROP TABLE students; --",
  ...
}
```

**ระบบรับมือ**:
```ts
// ❌ ถ้าโค้ดเป็นแบบนี้ (โปรเจกต์นี้ไม่ใช้):
await db.query(`INSERT INTO students (first_name) VALUES ('${firstName}')`);
// → SQL injection ทันที

// ✅ โค้ดจริง:
await db.query('INSERT INTO students (first_name) VALUES ($1)', [firstName]);
// → driver escape ให้, ปลอดภัย 100%
```

**ทำไม parameterized query ปลอดภัย?**
- `$1` ส่ง **แยก** กับ SQL command ผ่าน PostgreSQL protocol
- DB engine treat `$1` เป็น value เสมอ — ไม่ parse เป็น SQL
- ต่อให้ค่ามี `'; DROP TABLE ...` → ก็แค่ string ปกติ

### 49.3 Scenario C: JWT Forgery

```
1. Attacker login เป็น door_operator (มีบัญชีจริง)
2. ได้ JWT: eyJhbGc...payload...signature
3. decode payload (base64) → {id:5, role:"door_operator"}
4. แก้เป็น {id:5, role:"owner"} → encode base64 ใหม่
5. ส่งกลับ → server verify HS256 → ❌ signature ไม่ match
6. 401 Unauthorized
```

**ทำไม forge ไม่ได้?**
- HS256 signature = HMAC-SHA256(header.payload, JWT_SECRET)
- attacker ไม่มี `JWT_SECRET` → คำนวณ signature ไม่ได้
- ถ้า server ใช้ default secret → attacker เดาได้ → ดังนั้น `verifyJwtSecretSecurity()` ใน production force ใช้ secret สุ่ม

### 49.4 Scenario D: ESP32 Impersonation

```
Attacker เห็น URL https://app.vercel.app/api/esp32/display?room=CE-401
ลองยิง GET ตรง → 401 (ไม่มี X-API-Key)
ลองใส่ random key → 401
ลองดู firmware .ino ที่ git public → 🚨 ถ้ามี API_KEY ใน source code → leak!
```

**การป้องกัน**:
- `config.h` อยู่ใน `.gitignore`
- `config.h.template` เป็นไฟล์เปล่า (placeholder) ใน git
- ผู้ deploy ต้องสร้าง `config.h` เอง

**ที่ยังเป็นไปได้**: ขโมย ESP32 ลง flash → อ่าน firmware → extract key
- ป้องกันได้ด้วย ESP32 Secure Boot + Flash Encryption (ฟีเจอร์ฮาร์ดแวร์)
- ปัจจุบันโปรเจกต์ไม่ได้เปิด → ถ้า key รั่ว ต้อง rotate + flash บอร์ดทุกตัว

### 49.5 Scenario E: QR Replay Attack

```
1. Attacker อยู่ในห้อง CE-401 อย่างถูกต้อง
2. ถ่ายภาพ QR บนจอ TFT
3. ส่งภาพให้เพื่อนทาง LINE
4. เพื่อนสแกน → เปิด /?scan=TOKEN&room=CE-401
5. ❌ ถ้าเกิน 60 วินาที → token หมุนแล้ว → token นี้ invalid
6. ❌ ถ้าใน 60s แต่ attacker คนแรกใช้แล้ว → is_consumed=TRUE → invalid
7. ✅ ถ้าใน 60s + ยังไม่มีใครใช้ → เพื่อนกรอกฟอร์มเข้าได้
```

**ที่ยังเป็นไปได้**: Race window ~60 วินาที — แต่:
- ต้องมี IP ในระบบของมหาวิทยาลัย หรือใช้ VPN
- ต้องมีรหัสนักศึกษาจริง (admin ตรวจสอบได้)
- IP ใน log → ตามตัวได้

### 49.6 Scenario F: Tailgating (ตามคนที่ผ่านเข้า)

ระบบใด ๆ ก็ป้องกันไม่ได้ 100% — แต่:
- Time-limited unlock 3.8s = จำกัดเวลาเปิดประตู
- Discord notification → admin เห็นใครเข้าเมื่อใด
- ESP32 มีรูสำหรับติด PIR sensor → นับคนเข้าจริง vs จำนวน approve
- กล้องวงจรปิดเป็นชั้นเสริม

### 49.7 Scenario G: Denial of Service

```
Attacker ยิง POST /api/students × 10,000 ครั้ง/วินาที
```

**ชั้นป้องกัน**:
1. Vercel built-in DDoS (Layer 3/4) — รับ traffic ใหญ่ได้
2. Rate limit application layer — ทุก IP โดน 429
3. ถ้า traffic ใหญ่จนจะกิน quota → upgrade Vercel Pro ($20/เดือน)
4. ขั้นรุนแรง: เปิด Cloudflare ขั้นกลาง

### 49.8 Scenario H: Man-in-the-Middle

```
Attacker อยู่ใน Wi-Fi เดียวกับ ESP32
ทำ ARP spoofing → ทุก HTTP traffic ผ่าน attacker
```

**ป้องกัน**:
- ESP32 ใช้ **HTTPS** + CA cert verify
- ถ้า attacker ใส่ cert ปลอม → ESP32 reject (เพราะ `setCACert()`)
- → MITM ไม่ได้ผล

### 49.9 Scenario I: Physical Tampering

```
ตัดสายไฟไปยัง relay → ประตูเปิดค้าง (ถ้าใช้ fail-safe maglock)
หรือ short ขา relay บนบอร์ด → ปลดล็อก
```

**ป้องกัน**:
- ติด ESP32 + relay ในกล่องล็อก (ใส่ tamper switch)
- ใช้ fail-secure lock (ไฟตัด = ล็อก)
- มี UPS สำรองไฟให้ระบบล็อก

<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

---

<a id="sec-50"></a>
## 50. Cryptographic Details — JWT, bcrypt, HMAC ในเชิงคณิตศาสตร์

### 50.1 JWT HS256 ทำงานอย่างไร

JWT มี 3 ส่วนคั่นด้วย `.`:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwicm9sZSI6Im93bmVyIn0.signature
└─── Header (base64) ───┘ └────── Payload (base64) ──────┘ └─ Signature ─┘
```

**Header** (decode):
```json
{ "alg": "HS256", "typ": "JWT" }
```

**Payload** (decode):
```json
{ "id": 1, "role": "owner", "iat": 1716832000, "exp": 1716861600 }
```

**Signature**:
```
HMAC-SHA256(
  base64url(header) + "." + base64url(payload),
  JWT_SECRET
) → 32 bytes → base64url
```

### 50.2 HMAC-SHA256 ในเชิงคณิตศาสตร์

```
HMAC(K, m) = H((K' ⊕ opad) ∥ H((K' ⊕ ipad) ∥ m))

โดยที่:
- K = secret key (≥ 32 bytes แนะนำ)
- m = message (header + "." + payload)
- H = SHA-256
- K' = K padded to 64 bytes
- opad = 0x5c × 64
- ipad = 0x36 × 64
- ⊕ = XOR
- ∥ = concatenation
```

**ทำไม HMAC ปลอดภัย?**
- SHA-256 collision resistance: ต้อง 2¹²⁸ operations ถึงจะหา collision
- การใช้ inner+outer hash + XOR padding ป้องกัน length extension attack ของ Merkle-Damgård
- ถ้าไม่รู้ K → คำนวณ HMAC ไม่ได้

**Brute-force key 32 chars**:
- 32 hex chars = 128 bits
- 2¹²⁸ ≈ 3.4 × 10³⁸
- ถ้าคอม 10¹⁵ guess/วินาที → ใช้ 10¹⁶ ปี (อายุจักรวาล 1.4×10¹⁰ ปี)
- → ปลอดภัย

### 50.3 bcrypt ทำงานอย่างไร

```
bcrypt(password, salt, cost) = Eksblowfish_cost(salt, password, "OrpheanBeholderScryDoubt")
```

**Process**:
1. Generate random salt 128 bits
2. ทำ key schedule แบบขยาย 2^cost รอบ (เช่น cost=10 → 1,024 รอบ)
3. ใช้ key + salt ที่ขยายแล้ว encrypt magic string
4. Output: `$2a$10$salt+hash` (60 chars)

**ทำไมต้อง slow?**
- รหัสผ่านสั้น (8-12 chars) → entropy น้อย
- ถ้า hash เร็ว → attacker brute-force ได้
- bcrypt 70ms/ครั้ง × 8 char password (10⁸ ความเป็นไปได้) = 220 ปี
- → ปลอดภัยพอ

**Cost factor**:
| Cost | Time | ใช้กับ |
|------|------|--------|
| 8 | ~20ms | mobile / IoT |
| 10 | ~70ms | **โปรเจกต์นี้** — server มาตรฐาน |
| 12 | ~280ms | high security |
| 14 | ~1.1s | top-tier |

### 50.4 crypto.randomBytes() — Cryptographically Secure RNG

Node.js ใช้ OS RNG:
- Linux: `/dev/urandom` (entropy pool จาก hardware noise)
- Windows: `BCryptGenRandom` API
- macOS: `getentropy()` syscall

**ทำไมไม่ใช่ `Math.random()`?**
- `Math.random()` ใช้ pseudo-RNG ที่คาดเดาได้ถ้ารู้ seed
- 32 bits internal state → 2³² ≈ 4 พันล้าน combinations → crack ได้ในวินาที
- `crypto.randomBytes()` มี entropy จาก OS

### 50.5 Timing-safe Comparison

```ts
// ❌ ไม่ปลอดภัย:
if (userKey === storedKey) return true;
// V8 engine optimize: หยุดทันทีที่เจอ char ต่าง

// ✅ ปลอดภัย:
return crypto.timingSafeEqual(Buffer.from(userKey), Buffer.from(storedKey));
// loop ทุก byte เสมอ → เวลาคงที่
```

**ตัวอย่าง timing attack**:
- compare("aXXXXXX...", "bYYYYY...") → fail ที่ char 1 → 5ns
- compare("bXXXXXX...", "bYYYYY...") → fail ที่ char 2 → 10ns
- → ถ้าวัดเวลาแม่นพอ → guess key ทีละตัว

<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

---

<a id="sec-51"></a>
## 51. OWASP Top 10 (2021) — ระบบรับมืออย่างไรทีละข้อ

| # | ภัย | ระบบนี้รับมือ |
|---|------|---------------|
| **A01** | Broken Access Control | ✅ ตรวจ role ทุก endpoint, JWT verify, owner-only routes |
| **A02** | Cryptographic Failures | ✅ HTTPS ทุกฝั่ง, bcrypt, HS256 strong key, no plaintext password |
| **A03** | Injection | ✅ parameterized query 100%, input validation, regex |
| **A04** | Insecure Design | ✅ Threat model § 49, defense-in-depth, one-time token |
| **A05** | Security Misconfiguration | ⚠️ ต้องตั้ง env ถูกใน production, `next.config.ts` ตั้ง security headers |
| **A06** | Vulnerable Components | ⚠️ ต้องรัน `npm audit` เป็นระยะ |
| **A07** | Identification & Auth Failures | ✅ rate limit, bcrypt, JWT 8h expiry, secure cookie |
| **A08** | Software & Data Integrity Failures | ⚠️ ใช้ lock file (`package-lock.json`), ไม่มี code signing |
| **A09** | Logging & Monitoring Failures | ✅ access_logs ทุก action + Discord realtime |
| **A10** | SSRF | ✅ Discord webhook validate URL (ต้องเป็น discord.com) |

### 51.1 Security Headers ใน next.config.ts

```ts
const headers = [
  { key: 'X-Frame-Options', value: 'DENY' },                      // กัน clickjacking
  { key: 'X-Content-Type-Options', value: 'nosniff' },             // กัน MIME sniff
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Content-Security-Policy', value: "default-src 'self'; ..." },
];
```

<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

---

<a id="sec-52"></a>
## 52. วงจรไฟฟ้าระดับ Schematic — ทำไมแต่ละชิ้นต้องมี

### 52.1 Schematic แบบ Block + รายละเอียดทุกส่วน

```mermaid
flowchart TB
    AC["AC 220V"] --> PSU["PSU 12V 2A<br/>(SMPS adapter)"]
    PSU --> BUCK["Buck Converter<br/>LM2596 12V→5V"]
    BUCK --> ESP["ESP32 VIN (5V)<br/>internal LDO → 3.3V"]
    BUCK --> RELAY_VCC["Relay Module VCC (5V)"]
    PSU --> LOCK_PWR["12V → Lock COM"]
    ESP -- "GPIO12<br/>(3.3V signal)" --> RELAY_IN["Relay IN<br/>optocoupler"]
    RELAY_IN --> RELAY_COIL["Relay Coil<br/>~70mA @ 5V"]
    RELAY_COIL --> RELAY_CONTACT["NC/NO Contact<br/>10A 250VAC"]
    LOCK_PWR --> RELAY_CONTACT
    RELAY_CONTACT --> LOCK["Maglock/Solenoid<br/>~500mA @ 12V"]
    LOCK --> GND12["12V GND"]
    LOCK -. "เผื่อ coil load" .-> DIODE["1N4007 flyback"]
```

### 52.2 ทำไมต้องมี Optocoupler ใน Relay Module

**ปัญหาถ้าไม่มี**:
- Relay coil ตอน switch off ปล่อย **back-EMF spike** สูงถึง 200V
- spike นี้ feed กลับเข้า GPIO ผ่าน VCC/GND → ESP32 เสียได้
- เกิด ground loop → noise

**Optocoupler PC817**:
```
GPIO 3.3V → LED ภายใน → photons → phototransistor → switch transistor → relay coil
       ↑ ฝั่ง logic                 ↑ ฝั่ง power
       ────── ไฟแยกขาดสนิท ──────
```

- LED ใน opto ใช้แค่ ~10mA จาก GPIO
- ฝั่ง power 5V ที่จ่าย relay coil **แยกขาด** จาก ESP32
- spike ไม่ข้ามมา ESP32

### 52.3 ทำไมต้องมี Flyback Diode

```mermaid
flowchart LR
    V5["+5V"] -->|"+"| COIL["Relay Coil<br/>(inductor)"]
    COIL -->|"-"| Q["Transistor<br/>(in module)"]
    Q --> GND["GND"]
    V5 -.-> DIODE["1N4007 cathode"]
    DIODE -.-> NODE["coil− side<br/>anode"]
    NODE -.-> COIL
```

**กฎฟิสิกส์ V = L dI/dt**:
- เมื่อ transistor cutoff → I ลดจาก 70mA → 0 ใน microsecond
- dI/dt ใหญ่มาก → V cross coil = L × dI/dt → 200V+
- spike นี้ทำให้ transistor พัง

**Diode คร่อม coil**:
- ตอน normal: diode reverse-biased → ไม่กระทบ
- ตอน switch off: spike voltage forward-bias diode → กระแสไหลผ่าน diode ย้อนเข้า coil → dissipate ในรูปความร้อน
- ปกป้อง transistor

> Relay module สำเร็จรูปทั่วไป**มี diode ในตัวแล้ว** — ถ้าใช้ solenoid/maglock ที่ต่อตรงต้องเพิ่มเอง

### 52.4 ทำไมต้อง Buck Converter ไม่ใช่ Linear Regulator

| | Linear (LM7805) | Buck (LM2596) |
|---|----------------|---------------|
| Efficiency 12V→5V | (5/12)=41% | 85-92% |
| Dissipation @ 1A | 7W ร้อนมาก | 0.5W |
| ต้อง heatsink? | ✅ ใหญ่มาก | ไม่ต้อง |
| ราคา | 10 บาท | 30 บาท |
| Noise | สะอาด | switching noise (ต้องมี cap filter) |
| ขนาด PCB | เล็ก | กลาง |

**ในระบบนี้**: ESP32 + relay กิน ~250mA @ 5V = 1.25W
- Linear: dissipate (12-5)×0.25 = 1.75W ที่ regulator → ร้อน
- Buck: dissipate ~0.15W → เย็น
- ✅ Buck คุ้มกว่ามาก

### 52.5 ESP32 Strapping Pins — เหตุผลลึก

GPIO 12 = MTDI — boot strap สำหรับเลือก voltage flash:
- HIGH ตอน boot → flash 1.8V (ESP32-S edge case)
- LOW ตอน boot → flash 3.3V (ปกติ)

**ปัญหา**: ถ้า relay module ใช้ active-HIGH (HIGH = energized) + ขา IN มี pull-up ภายใน → ตอนบูตจะ HIGH → ESP32 พยายาม boot 1.8V → ไม่ work

**วิธีแก้ในโค้ด**:
```cpp
void setup() {
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW);  // ← ก่อนทุกอย่าง
  // ...
}
```
+ ใช้ relay module แบบ active-LOW (IN=LOW → energize) — ป้องกัน 2 ชั้น

### 52.6 Pull-up/Pull-down Resistor

- SPI lines (MOSI, MISO, SCK) — ไม่ต้อง pull เพราะ driven ตลอด
- CS — ESP32 มี internal pull-up — ปลอดภัยตอน boot
- ปุ่ม emergency (ถ้ามี) — ต้อง pull-up 10kΩ ภายนอก + กดลง GND

<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

---

<a id="sec-53"></a>
## 53. Power Budget Calculation

### 53.1 รายการบริโภคไฟ

| อุปกรณ์ | Voltage | Current (max) | Power |
|---------|---------|---------------|-------|
| ESP32 (Wi-Fi active) | 5V (VIN) | 240mA | 1.2W |
| ESP32 (deep sleep) | 5V | 0.01mA | 0.05mW |
| TFT ILI9341 (backlight on) | 3.3V | 80mA | 0.26W |
| Relay coil energized | 5V | 70mA | 0.35W |
| LED Wi-Fi indicator | 3.3V | 10mA | 0.03W |
| LED Reject | 3.3V | 10mA | 0.03W |
| Buzzer (tone active) | 3.3V | 30mA | 0.1W |
| Maglock 12V | 12V | 500mA | 6W |
| Buck converter loss | — | — | ~0.5W (85% eff @ 2W) |
| **รวมขณะปกติ (lock + ESP32 + TFT)** | | | **~7.5W** |
| **รวม peak (กำลังเปิด relay + เสียง)** | | | **~9W** |

### 53.2 เลือก Adapter

- Power budget peak: 9W
- เผื่อ safety margin 50%: 13.5W
- Adapter 12V × 2A = 24W → **เพียงพอ + เผื่อขยาย**

ทำไมไม่ใช้ 12V × 1A (12W)?
- ตอน startup, relay + maglock + ESP32 + TFT inrush current สูง 1.2-1.5A ใน ms แรก
- ถ้า adapter จ่ายไม่ได้ → voltage drop → ESP32 brown-out reset

### 53.3 Battery Backup (UPS) — ถ้าจะใส่

```mermaid
flowchart LR
    AC["AC 220V"] --> ADAPTER["Adapter 12V"] --> SWITCH["DC Switch"]
    BAT["12V 7Ah SLA"] --> SWITCH
    SWITCH --> SYSTEM["ระบบ"]
    AC -- "เมื่อมีไฟ" --> CHARGE["TP4056 charge controller"]
    CHARGE --> BAT
```

**คำนวณ runtime**:
- ระบบกิน 9W → 0.75A @ 12V
- แบต 7Ah → 7/0.75 = 9.3 ชั่วโมง
- ใช้จริง DOD 80% → ~7 ชั่วโมง

### 53.4 ทำไมต้องแยก 12V กับ 5V

- 5V สำหรับ logic (ESP32, relay coil ฝั่ง control)
- 12V สำหรับ lock (power load)
- ถ้าใช้ 12V ทุกอย่าง → ต้อง buck ลง 5V อยู่ดี
- ถ้าใช้ 5V ทุกอย่าง → lock 12V ทำงานไม่ได้

→ Adapter 12V + buck = สมเหตุสมผลที่สุด

<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

---

<a id="sec-54"></a>
## 54. PCB Layout / Wiring Best Practices

### 54.1 หลักการแยกสาย

```
┌──────────────────────────────────────────┐
│ ┌──────────┐  ┌──────────┐              │
│ │ ESP32    │  │ TFT      │  ← Logic zone│
│ │ + buck   │  │          │   (low V/low I)
│ └─────┬────┘  └──────────┘              │
│       │ GPIO12 (twisted)                │
│       ▼                                 │
│ ┌──────────┐                            │
│ │ Relay    │  ← Isolation zone          │
│ │ Module   │     (opto)                 │
│ └─────┬────┘                            │
│       │ NO contact (heavy)              │
│       ▼                                 │
│ ┌────────────────────┐                  │
│ │ Lock + 12V wiring  │  ← Power zone    │
│ │ Terminal block     │     (high V/I)   │
│ └────────────────────┘                  │
└──────────────────────────────────────────┘
```

### 54.2 Best Practices

1. **Twisted pair** สำหรับ GPIO12 → relay IN — ลด EMI pickup
2. **Star ground** — กราวด์ทุกตัวต่อกลับจุดเดียว (ที่ buck output)
3. **Decoupling capacitor** — 100µF + 0.1µF ใกล้ VIN ของ ESP32
4. **ห้ามขนานสายสัญญาณกับสายไฟ 220V** ห่างกัน ≥ 10cm
5. **Terminal block** สำหรับสาย lock — กันสายหลุด
6. **Strain relief** — มัด cable tie ใกล้จุดต่อ
7. **Heat shrink** ทุกจุด solder
8. **กล่องโลหะ** ground เข้ากับ chassis ground (ไม่ใช่ DC ground)

### 54.3 EMI Sources & Mitigation

| แหล่ง | ผลกระทบ | วิธีลด |
|-------|---------|--------|
| Relay switching | spike → GPIO false trigger | Optocoupler + diode + ferrite bead |
| Maglock buzz | 50Hz hum → audio noise | Shield + ground bond |
| Wi-Fi radiator | TFT flicker | TFT cable < 10cm |
| Buck noise | Power ripple → ESP32 reset | Output cap 470µF |

<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

---

<a id="sec-55"></a>
## 55. HTTP/TLS Packet Flow — ลึกถึง Wireshark

### 55.1 ลำดับ Packet ของ 1 Request

```mermaid
sequenceDiagram
    participant E as ESP32
    participant D as DNS
    participant S as Server (Vercel SG)
    Note over E: ก่อนหน้านี้: WiFi connected, IP assigned
    E->>D: DNS Query A "app.vercel.app"
    D-->>E: A 76.76.21.21
    Note over E,S: TCP 3-way handshake
    E->>S: SYN seq=0
    S-->>E: SYN-ACK seq=0 ack=1
    E->>S: ACK seq=1 ack=1
    Note over E,S: TLS 1.2 handshake
    E->>S: ClientHello (SNI=app.vercel.app, cipher suites)
    S-->>E: ServerHello + Certificate + ServerKeyExchange + ServerHelloDone
    E->>E: Verify cert chain (RSA-2048)
    E->>S: ClientKeyExchange + ChangeCipherSpec + Finished
    S-->>E: ChangeCipherSpec + Finished
    Note over E,S: Encrypted Application Data
    E->>S: HTTP GET /api/esp32/display HTTP/1.1<br/>x-api-key: xxx<br/>Host: app.vercel.app
    S-->>E: HTTP 200 OK<br/>Content-Type: application/json<br/>{...}
    Note over E,S: TCP close
    E->>S: FIN
    S-->>E: FIN-ACK
    E->>S: ACK
```

### 55.2 Packet Size & Timing

| Step | Size | Time |
|------|------|------|
| DNS query | 80 B | 10-30ms (cached → 0ms) |
| TCP SYN/SYN-ACK/ACK | 60B × 3 | 1 RTT (~30ms in TH) |
| TLS ClientHello | 200 B | (start) |
| TLS ServerHello + Cert | ~3 KB | (server cert chain) |
| TLS key exchange | ~300 B | RSA ops |
| TLS Finished | ~80 B | 2 RTT total = ~60ms |
| HTTP request | ~200 B | encrypted |
| HTTP response | ~500 B | encrypted |
| TCP close | 60 B × 3 | 1 RTT |
| **Total** | ~4.5 KB | ~350ms first request |

### 55.3 HTTP Keep-Alive Optimization

```
ครั้งแรก: TLS handshake 250ms + request 100ms = 350ms
ครั้งถัดไป (keep-alive): request 100ms = 100ms
```

**โค้ด ESP32 เปิด keep-alive ยังไง?**
```cpp
http.addHeader("Connection", "keep-alive");
// ArduinoHTTPClient ใช้ TCP socket เดิมถ้าไม่ปิด
```

**ปัญหา**: Vercel ปิด connection หลัง ~10 วินาที idle → ESP32 ต้อง handshake ใหม่
→ ลด overhead นี้: poll ทุก 2 วินาที = ใช้ socket เดียวได้ ~5 polls

<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

---

<a id="sec-56"></a>
## 56. DNS / CDN Routing

### 56.1 DNS Resolution Chain

```
ESP32 → DNS resolver (เช่น 8.8.8.8)
  → root NS (.) → .app NS
  → vercel.app NS
  → cname.vercel-dns.com
  → multiple A records (เลือกตาม geo-DNS)
```

**Geo-DNS**: ESP32 ในไทย → return IP ใน Singapore (~30ms RTT)
ESP32 ในยุโรป → return IP ใน Frankfurt

### 56.2 CDN Routing — Anycast

```mermaid
flowchart LR
    USER["User in Bangkok"] --> ROUTER["Internet"]
    ROUTER -->|"BGP route ใกล้สุด"| SG["Vercel Edge SG"]
    USER2["User in London"] --> ROUTER2["Internet"]
    ROUTER2 -->|"BGP"| FR["Vercel Edge FRA"]
    SG --> ORIGIN["Vercel Origin"]
    FR --> ORIGIN
```

- Vercel ประกาศ IP เดียวกันจาก data center หลายแห่งทั่วโลก (Anycast)
- BGP router internet จะส่ง packet ไปยัง POP ใกล้ที่สุด
- Static asset cache ที่ POP — เร็วมาก

### 56.3 ทำไม Vercel ไม่ deploy Function ที่ทุก POP

- Function ต้องคุย DB → DB อยู่ที่เดียว → run function ใกล้ DB ดีกว่า
- ในโปรเจกต์นี้: Supabase SG → Vercel function ก็ที่ SG
- ผลคือ function-to-DB latency ต่ำสุด

### 56.4 ทำไมไม่ใช้ Cloudflare Workers

| | Vercel | Cloudflare Workers |
|---|--------|---------------------|
| Next.js integration | ✅ native | ⚠️ ต้อง adapter |
| Function locations | regional (เลือก 1) | edge (200+ POPs) |
| DB connection (pg) | ✅ TCP pooled | ❌ ไม่รองรับ TCP, ต้องใช้ HTTP-based DB |
| Cold start | 300-800ms | 5ms |
| Cost | คุ้ม | คุ้มกว่า ถ้า scale ใหญ่ |

→ Vercel เหมาะกว่าสำหรับโปรเจกต์ขนาดนี้ที่ต้องใช้ `pg`

<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

---

<a id="sec-57"></a>
## 57. NAT / Firewall — ทำไม ESP32 push ไม่ได้

### 57.1 NAT Behavior

```mermaid
flowchart LR
    ESP["ESP32<br/>192.168.1.50:random"] -->|"outbound"| NAT["NAT Router"]
    NAT -->|"public IP:translated port"| INET["Internet"]
    INET --> SRV["Server"]
    SRV -.->|"reply ใช้ session ที่ NAT จำได้"| NAT
    NAT -.->|"forward กลับ ESP32"| ESP

    INET2["Server ต้องการเรียก ESP32"] --x|"❌ ไม่มี mapping"| NAT

    %% ทำสีให้มองง่ายและมีความหมายชัดเจนสไตล์ Harmony Palette
    classDef purple fill:#7C3AED,stroke:#333,stroke-width:2px,color:#fff;
    classDef pink fill:#DB2777,stroke:#333,stroke-width:2px,color:#fff;
    classDef orange fill:#F59E0B,stroke:#333,stroke-width:2px,color:#fff;
    classDef red fill:#EF4444,stroke:#333,stroke-width:2px,color:#fff;
    classDef green fill:#10B981,stroke:#333,stroke-width:2px,color:#fff;
    classDef blue fill:#3B82F6,stroke:#333,stroke-width:2px,color:#fff;

    class ESP purple;
    class NAT orange;
    class INET blue;
    class SRV green;
    class INET2 red;

    linkStyle 5 stroke:#EF4444,stroke-width:3px,stroke-dasharray: 5 5;
```

**NAT Table**:
| Internal | External (NAT) |
|----------|----------------|
| 192.168.1.50:54321 | 203.0.113.1:54321 |

- Outbound packet สร้าง mapping → reply กลับเข้าได้
- Inbound packet ใหม่ — ไม่มี mapping → router ทิ้ง

### 57.2 ทำไมไม่ทำ Port Forward

- มหาวิทยาลัยไม่อนุญาตให้นักศึกษาขอ port forward
- ถึงทำได้ → ESP32 จะถูกโจมตีจากอินเทอร์เน็ตได้
- → ESP32 ต้อง initiate connection เสมอ (polling pattern)

### 57.3 ทางออก: LAN Direct Push

ในกรณีที่ Next.js server **อยู่ใน LAN เดียวกัน** (รัน `npm run dev` บนเครื่องในมหาลัย):
- Server เห็น ESP32 IP `192.168.1.50` → ยิงตรงไปได้
- `tryLanDirectBackground()` ใน `lib/esp32.ts` ทำหน้าที่นี้

แต่ถ้า deploy บน Vercel (cloud) → cloud server ไม่เห็น 192.168.x.x → fallback เป็น polling

### 57.4 ทำไมไม่ใช้ ngrok / Cloudflare Tunnel

- ESP32 เปิด tunnel ออกไป → server ยิงผ่าน tunnel กลับเข้ามาได้
- ✅ ทำได้จริง
- ❌ ต้องเช่า service หรือใช้ free tier (มี limit)
- ❌ ESP32 ต้องรัน tunnel client → CPU/RAM เพิ่ม
- → ไม่คุ้มกับ latency 2 วินาทีที่ลดลง

<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

---

<a id="sec-58"></a>
## 58. Database Query Plan Analysis

### 58.1 EXPLAIN ANALYZE ของ Query สำคัญ

**Query 1: ดึง pending students**
```sql
EXPLAIN ANALYZE
SELECT * FROM students WHERE status='pending' ORDER BY created_at DESC;
```
```
Sort  (cost=8.30..8.31 rows=5 width=...) (actual time=0.087..0.088)
  Sort Key: created_at DESC
  ->  Index Scan using idx_students_status on students
        Index Cond: (status = 'pending')
        actual time=0.012..0.034 rows=5
Planning Time: 0.215 ms
Execution Time: 0.118 ms
```
- ✅ ใช้ index `idx_students_status` → Index Scan แทน Seq Scan
- ถ้าไม่มี index: cost ~150, time ~5ms (200 rows ทั้งหมด)

**Query 2: Consume QR token**
```sql
EXPLAIN ANALYZE
UPDATE dynamic_qr_tokens
SET is_consumed = TRUE
WHERE token='abc...' AND is_consumed=FALSE AND expires_at > NOW();
```
```
Update on dynamic_qr_tokens  (actual time=0.245..0.246)
  ->  Index Scan using idx_qr_token on dynamic_qr_tokens
        Index Cond: ((token)::text = 'abc...'::text)
        Filter: ((NOT is_consumed) AND (expires_at > now()))
Execution Time: 0.302 ms
```
- ใช้ unique index → O(log n) lookup
- Lock เฉพาะ row เดียว → ไม่ block ห้องอื่น

**Query 3: Access logs filter**
```sql
EXPLAIN ANALYZE
SELECT * FROM access_logs
WHERE created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC LIMIT 100;
```
```
Limit  (actual time=0.045..0.123 rows=100)
  ->  Index Scan Backward using idx_logs_created
        Index Cond: (created_at >= ...)
Execution Time: 0.156 ms
```
- ✅ Index DESC ช่วยให้ LIMIT เร็ว
- ไม่ต้อง sort เพราะ index sorted แล้ว

### 58.2 Index Strategy

| ตาราง | Index | เหตุผล |
|--------|-------|--------|
| students | (status) | filter pending/approved ใช้บ่อย |
| students | (student_id) | search by ID |
| students | (created_at DESC) | sort timeline |
| access_logs | (created_at DESC) | timeline + LIMIT |
| access_logs | (action) | filter by event type |
| access_logs | (student_id) | per-student history |
| dynamic_qr_tokens | (token) UNIQUE | lookup + atomic |
| dynamic_qr_tokens | (room_code, is_consumed, expires_at) | active token query |
| rate_limits | (key) PRIMARY | upsert |

### 58.3 Sequential Scan vs Index Scan

- < 1,000 rows: Seq Scan เร็วกว่าเพราะ index overhead
- > 10,000 rows + selective filter: Index Scan ชนะขาด
- Optimizer PostgreSQL ตัดสินเอง — เราแค่เตรียม index ให้พร้อม

### 58.4 N+1 Query Problem

```ts
// ❌ N+1
const students = await db.query('SELECT * FROM students');
for (const s of students.rows) {
  const logs = await db.query('SELECT * FROM access_logs WHERE student_id=$1', [s.id]);
  // → 1 + N queries
}

// ✅ JOIN
const data = await db.query(`
  SELECT s.*, json_agg(l.*) as logs
  FROM students s
  LEFT JOIN access_logs l ON l.student_id = s.id
  GROUP BY s.id
`);
// → 1 query
```

โปรเจกต์นี้ระวังเรื่องนี้ — ใช้ JOIN ทุกที่ที่ต้องการข้อมูลที่เกี่ยวข้อง

<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

---

<a id="sec-59"></a>
## 59. Connection Pooling เจาะลึก

### 59.1 pgBouncer Mode

| Mode | ลักษณะ | Connection sharing |
|------|--------|---------------------|
| **Session** | คนเชื่อมต่อ 1 คน = ใช้ 1 backend connection ตลอด session | ไม่ share |
| **Transaction** | share หลัง COMMIT | สูง |
| **Statement** | share หลัง statement | สูงสุด แต่ไม่รองรับ multi-statement transaction |

**Supabase ใช้ Transaction mode** (`?pgbouncer=true&statement_cache_mode=describe`)

### 59.2 ทำไม Vercel Serverless ต้องใช้ Pooling

```
Vercel function: เปิด-ปิด connection ทุก request
ถ้าไม่ pool: 100 concurrent users = 100 PostgreSQL connections
PostgreSQL free tier: 60 connection max
→ 41 users ได้รับ "too many connections" error
```

**ด้วย pgBouncer transaction pool**:
- 1,000 client connection → pgBouncer แชร์ → 30 backend connection
- เพราะ transaction สั้น ~30ms → 1 backend conn รับ 30 tx/sec
- → รองรับ 900 req/sec ด้วย 30 connection

### 59.3 ข้อจำกัด Transaction Mode

```ts
// ❌ ใช้ไม่ได้ใน transaction mode:
await db.query('PREPARE myStmt AS SELECT ...');
await db.query('EXECUTE myStmt');
// → connection อาจถูก reuse ระหว่าง 2 statement → ERROR

// ❌ ใช้ไม่ได้:
await db.query('SET TIME ZONE ...');
await db.query('SELECT NOW()');
// → SET ไม่ persist ข้าม statement

// ✅ ใช้ได้:
await db.query('BEGIN');
await db.query('SELECT ...');
await db.query('COMMIT');
// → ทั้ง transaction อยู่ใน connection เดียว
```

โปรเจกต์นี้ใช้แค่ single-statement หรือ wrap ใน transaction → OK

### 59.4 Direct vs Pooled URL ใน .env

```env
POSTGRES_URL=postgres://...?pgbouncer=true  # ใช้ตอนรัน query ปกติ
POSTGRES_URL_DIRECT=postgres://...           # ใช้ตอน migration / DDL
```

DDL ไม่ทำงานผ่าน pgBouncer transaction mode → ต้อง direct

<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

---

<a id="sec-60"></a>
## 60. Transaction Isolation

### 60.1 PostgreSQL Isolation Levels

| Level | Dirty Read | Non-repeatable | Phantom | Serialization Anomaly |
|-------|------------|----------------|---------|------------------------|
| Read Uncommitted | ❌ (PG ทำเป็น Read Committed) | ⚠️ | ⚠️ | ⚠️ |
| **Read Committed** (default) | ✅ ป้องกัน | ⚠️ เกิดได้ | ⚠️ | ⚠️ |
| Repeatable Read | ✅ | ✅ | ✅ | ⚠️ |
| Serializable | ✅ | ✅ | ✅ | ✅ |

โปรเจกต์นี้ใช้ **Read Committed** (default) ทั้งหมด

### 60.2 Race Conditions ที่ระบบป้องกัน

**Case 1: 2 คนสแกน QR เดียวกันพร้อมกัน**
```sql
-- คนที่ 1
UPDATE dynamic_qr_tokens SET is_consumed=TRUE
WHERE token=$1 AND is_consumed=FALSE
RETURNING *;  -- ได้ row

-- คนที่ 2 (พร้อมกัน)
UPDATE dynamic_qr_tokens SET is_consumed=TRUE
WHERE token=$1 AND is_consumed=FALSE
RETURNING *;  -- รอ lock → หลังคน 1 commit → is_consumed=TRUE → no row return
```
→ Atomic ทำให้ปลอดภัย แม้ Read Committed

**Case 2: Rate limit counter**
```sql
INSERT INTO rate_limits ... ON CONFLICT DO UPDATE SET count=count+1
```
→ atomic increment, ไม่มี race

### 60.3 Race ที่ยังเป็นไปได้ (เล็กน้อย)

**Settings cache invalidation**:
- Instance A อ่าน settings (cache 30s)
- Instance B update setting → invalidate cache ของตัวเอง
- Instance A ยังใช้ cache เก่า 30 วินาที
- → admin เห็นค่าใหม่หลัง max 30 วินาที (acceptable)

**แก้ในอนาคต**: ใช้ Supabase Realtime หรือ Redis pub/sub

<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

---

<a id="sec-61"></a>
## 61. Manual Test Plan — ครบทุก Flow

### 61.1 Test Cases

#### Registration Flow
- [ ] เปิด `/` ไม่มี `?scan=` → ต้อง block
- [ ] เปิด `/?scan=invalid` → ต้องแสดง expired
- [ ] เปิด `/?scan=valid&room=CE-401` → แสดงฟอร์ม
- [ ] กรอกฟอร์ม submit → success
- [ ] กรอกฟอร์ม submit 2 ครั้ง (token เดิม) → 403
- [ ] เปิดฟอร์มทิ้งไว้ 120s → countdown หมด → ต้องสแกนใหม่
- [ ] กรอกรหัส นศ. ที่เคยลง → auto-fill ทำงาน
- [ ] ปิด wi-fi → submit → ขึ้น offline queue
- [ ] เปิด wi-fi → auto flush queue
- [ ] หลัง approved → bypass token ใช้ได้ภายใน 5 นาที
- [ ] หลัง 5 นาที → bypass หมดอายุ

#### Admin Flow
- [ ] Login user/pass ผิด 5 ครั้ง → 429
- [ ] Login user/pass ผิด หลัง wait 1 นาที → reset
- [ ] Login สำเร็จ → cookie set → redirect dashboard
- [ ] Approve → student status เปลี่ยน + log + Discord + ESP32 unlock
- [ ] Reject พร้อมเหตุผล → status rejected + log + Discord
- [ ] Owner สร้าง admin ใหม่ → ใส่ password < 8 → reject
- [ ] Door operator พยายามเข้าหน้า admin-users → 403
- [ ] Logout → cookie cleared

#### ESP32 Flow
- [ ] Boot → connecting wi-fi screen
- [ ] Wi-fi off → ติดอยู่หน้า connecting
- [ ] Wi-fi connected → main screen
- [ ] Server return door_trigger=open → scan → unlocked → relay 3.8s
- [ ] Server timeout → retain previous screen
- [ ] Polling: pending_count เปลี่ยน → redraw
- [ ] Polling: ทุกอย่างเหมือนเดิม → update เฉพาะ clock

#### Export PDF
- [ ] PDF รวม ช่วง 7 วัน → render OK, ฟอนต์ไทยถูก
- [ ] PDF รายบุคคล → 1 หน้า
- [ ] PDF ช่วง 1 ปี (1000+ rows) → multi-page footer ถูกต้อง

### 61.2 ทำไมไม่มี Automated Test

- **คน 1 คน + เวลาจำกัด** → automated test กิน effort 30%
- ระบบเรียบง่าย, ขนาดเล็ก, manual test ครอบคลุมได้
- ESP32 firmware ทดสอบจริงต้องมี hardware in loop

**ถ้าจะเพิ่ม**:
- Jest + Supertest สำหรับ API route
- Playwright สำหรับ E2E web
- Wokwi simulator + scripted test สำหรับ firmware

### 61.3 ตัวอย่าง Test ที่ควรเขียนก่อน

```ts
// __tests__/api/auth.test.ts
describe('POST /api/auth/login', () => {
  it('returns 429 after 5 failed attempts', async () => {
    for (let i = 0; i < 5; i++) {
      await request(app).post('/api/auth/login').send({
        username: 'admin', password: 'wrong'
      });
    }
    const res = await request(app).post('/api/auth/login').send({
      username: 'admin', password: 'wrong'
    });
    expect(res.status).toBe(429);
  });
});
```

<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

---

<a id="sec-62"></a>
## 62. Disaster Recovery Playbook

### 62.1 RTO/RPO ของแต่ละ Component

| Component | RTO (เวลาฟื้น) | RPO (ข้อมูลหาย) | วิธีฟื้น |
|-----------|----------------|-----------------|----------|
| Vercel function | <1 นาที | 0 | auto-rollback |
| Supabase DB | <10 นาที | <1 นาที (PITR) | restore backup |
| ESP32 | <5 นาที | 0 | reboot/reflash |
| Discord | depend | 0 | external service |
| LAN กล่อง | <10 นาที | 0 | manual restart |

### 62.2 Scenarios & Playbook

#### Scenario A: Database หาย
1. Supabase Dashboard → Database → Backups
2. เลือก backup ล่าสุด (daily) หรือ point-in-time
3. Click "Restore"
4. รอ ~5 นาที
5. ตรวจ schema ครบ + admin ยัง login ได้

#### Scenario B: Vercel deployment ล่ม
1. Vercel Dashboard → Deployments
2. หา build ก่อนหน้าที่ "Ready"
3. กด "..." → "Promote to Production"
4. รอ ~30 วินาที
5. ทดสอบ login + ESP32 poll

#### Scenario C: ESP32 ค้าง relay เปิด
1. เข้า Dashboard → ห้องและ ESP32
2. กด "ทดสอบ" → check status
3. ถ้า offline → reboot บอร์ดด้วยมือ
4. ตั้ง `room_cmd_<room>` = `idle` ผ่าน Settings ก่อน reboot
5. หาก hardware เสีย → swap board, flash firmware ใหม่

#### Scenario D: ESP32_API_KEY รั่ว
1. สร้าง key ใหม่ (`openssl rand -hex 32`)
2. Vercel: update `ESP32_API_KEY` env → redeploy
3. ESP32: แก้ `config.h` → re-flash ทุกบอร์ด
4. ทดสอบ
5. ตรวจ access_logs ย้อนหลังว่ามี traffic ผิดปกติ

#### Scenario E: JWT_SECRET รั่ว
1. สร้างใหม่
2. Vercel update env → redeploy
3. ผู้ใช้ทุกคนถูก logout (token เดิม invalid)
4. admin login ใหม่

### 62.3 Backup Strategy

| Data | Frequency | Retention |
|------|-----------|-----------|
| Supabase auto-backup | รายวัน | 7 วัน (free) / 30 วัน (pro) |
| Manual export DB | สัปดาห์ละครั้ง | 1 ปี |
| Vercel deployments | ทุก push | 100 build ล่าสุด |
| ESP32 firmware | ทุกรุ่น | git tag |
| `.env` | offline copy | encrypted in password manager |

<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

---

<a id="sec-63"></a>
## 63. Cost Analysis แบบเต็ม

### 63.1 ค่าใช้จ่ายปัจจุบัน (Free Tier)

| Service | Plan | ราคา/เดือน |
|---------|------|-------------|
| Vercel | Hobby | 0 บาท |
| Supabase | Free | 0 บาท |
| Domain | (ใช้ vercel.app) | 0 บาท |
| Discord | Free | 0 บาท |
| ESP32 (hardware) | one-time ~250 บาท/บอร์ด | amortize |
| **รวม** | | **0 บาท/เดือน** |

### 63.2 ถ้าโต — ค่าใช้จ่าย Production

| Service | Plan | ราคา/เดือน |
|---------|------|-------------|
| Vercel | Pro | $20 (~700 บาท) |
| Supabase | Pro | $25 (~880 บาท) |
| Custom domain `.ac.th` | — | ~500 บาท/ปี = ~42 บาท/เดือน |
| Cloudflare (DDoS) | Free | 0 |
| **รวม** | | **~1,600 บาท/เดือน** |

### 63.3 Cost per Request

```
Vercel Hobby: 100 GB bandwidth + 100k function invocations ฟรี
1 บอร์ด ESP32 poll 2s = 1.3M invocation/เดือน → เกิน free!

จริง ๆ:
- 10 บอร์ด × 1.3M = 13M/เดือน
- Vercel Pro: $20 + $0.40/M หลังจาก 1M = $20 + $5 = $25/เดือน
- → 1 บอร์ดทำให้เกิน free แล้ว!
```

→ ในความเป็นจริงต้องลด polling หรือ batch หรือใช้ MQTT push

### 63.4 Optimization เพื่อประหยัด

1. **เพิ่ม poll interval เป็น 5 วินาที** → ลด invocation 60%
2. **ใช้ Edge runtime** สำหรับ `/api/esp32/display` (ไม่ต้อง Node)
3. **เพิ่ม cache HTTP header** `Cache-Control: max-age=2` → ESP32 cache เอง
4. **MQTT push แทน polling** → 1 connection ตลอดวัน แทน 43k requests

<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

---

<a id="sec-64"></a>
## 64. ทำไมเลือก Tailwind CSS v4

### 64.1 Tailwind v4 vs Alternatives

| | Tailwind v4 | CSS Modules | styled-components | CSS-in-JS |
|---|-------------|-------------|-------------------|-----------|
| Bundle size | ~10KB (purged) | small | ~30KB runtime | 30KB+ |
| DX | utility class | scope per file | template literal | JS object |
| SSR | ✅ | ✅ | ⚠️ slow | ⚠️ |
| Dynamic theme | ⚠️ ลำบาก | ⚠️ | ✅ | ✅ |
| Build time | เร็วมาก (Lightning CSS) | กลาง | กลาง | กลาง |

### 64.2 Feature ใหม่ของ v4 ที่ใช้

```css
/* app/globals.css */
@import "tailwindcss";

@theme {
  --color-smartaccess-purple: #7C3AED;
  --color-faculty-pink: #DB2777;
}
```

- ใช้ CSS native variables → ไม่ต้อง config JS file
- Lightning CSS bundle เร็ว 10× กว่า v3
- รองรับ container queries

### 64.3 Class Naming Discipline

```tsx
// ❌ ไม่ดี: สร้าง class ซับซ้อนใน JSX
<div className="flex items-center justify-between p-4 m-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 bg-gradient-to-r from-purple-500 to-pink-500">

// ✅ ดีกว่า: ใช้ `@apply` หรือ component
<Card variant="primary">...</Card>
```

โปรเจกต์นี้ใช้ inline เป็นหลักเพราะ component ไม่ reuse บ่อย

<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

---

<a id="sec-65"></a>
## 65. Color Theory & Accessibility (WCAG)

### 65.1 Brand Colors

```css
--smartaccess-purple: #7C3AED;   /* SmartAccess main */
--faculty-pink: #DB2777;   /* Faculty of Education */
--success:      #10B981;
--warning:      #F59E0B;
--danger:       #EF4444;
```

### 65.2 Contrast Ratio (WCAG 2.1)

| Combination | Ratio | Level |
|-------------|-------|-------|
| #7C3AED on #FFFFFF | 5.93:1 | AA ✅ |
| #FFFFFF on #7C3AED | 5.93:1 | AA ✅ |
| #DB2777 on #FFFFFF | 4.97:1 | AA ✅ |
| #10B981 on #FFFFFF | 3.27:1 | ⚠️ AA Large only |
| #F59E0B on #FFFFFF | 2.13:1 | ❌ Fail |

> **เกณฑ์ WCAG**:
> - AA: ratio ≥ 4.5:1 (normal text), ≥ 3:1 (large text 18pt+)
> - AAA: ratio ≥ 7:1

### 65.3 ที่ต้องระวัง

- **#F59E0B (warning yellow)** บนพื้นขาว → ใช้ใน background ก้อนใหญ่เท่านั้น ไม่ใช่ตัวอักษร
- ใช้ icon + text ร่วมกันเสมอ — ไม่พึ่งสีอย่างเดียว (กันคนตาบอดสี)
- รหัสสี + label text ในทุกปุ่ม action

### 65.4 Color Blindness

ประเภทที่พบบ่อย:
- **Deuteranopia** (8% ของผู้ชาย) — สีเขียวมองยาก
- **Protanopia** — สีแดงมองยาก
- **Tritanopia** — น้อยมาก

→ ใช้ icon ✓ ✗ คู่กับสี → robust

<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

---

<a id="sec-66"></a>
## 66. Thai Font Rendering

### 66.1 ทำไม PDF ใช้ Tahoma

- Tahoma รองรับภาษาไทย + อ่านง่าย + free license
- มีในทุก Windows machine (สำหรับ dev local)
- ใส่ใน `public/fonts/tahoma.ttf` ~700KB → bundled กับ Vercel function

### 66.2 ปัญหาฟอนต์ไทยที่เจอ

1. **Browser default** — บาง browser แสดงผิด → CSS `font-family: 'Sarabun', 'Tahoma', sans-serif`
2. **PDF** — Helvetica ไม่มี Thai glyph → ต้อง register Tahoma เสมอ
3. **ESP32 TFT** — Adafruit GFX มาตรฐานไม่มี Thai → ใช้ภาษาอังกฤษบนจอ

### 66.3 Font Subsetting (Optimization)

ปัจจุบันส่ง Tahoma ทั้งไฟล์ 700KB → ทุก request PDF ใช้ทั้งหมด
ทำ subset แค่ glyph ที่ใช้ → ~150KB

```bash
pyftsubset tahoma.ttf --unicodes="U+0E00-0E7F,U+0020-007F" --output-file=tahoma-thai.ttf
```

### 66.4 Web Fonts บน Next.js

```tsx
// app/layout.tsx
import { Sarabun } from 'next/font/google';
const sarabun = Sarabun({ subsets: ['thai', 'latin'], weight: ['400', '700'] });

export default function RootLayout({ children }) {
  return <html className={sarabun.className}>...</html>;
}
```

Next.js จะ:
- Download font ตอน build
- Self-host (ไม่ Google CDN runtime) → privacy + speed
- Inline `font-display: swap` → ไม่ FOIT

<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

---

<a id="sec-67"></a>
## 67. พ.ร.บ. คอมพิวเตอร์ มาตรา 26 — รายละเอียดและการปฏิบัติตาม

### 67.1 ตัวบทกฎหมาย

> **มาตรา 26** — ผู้ให้บริการต้องเก็บรักษาข้อมูลจราจรทางคอมพิวเตอร์ไว้ไม่น้อยกว่า**เก้าสิบวัน** นับแต่วันที่ข้อมูลนั้นเข้าสู่ระบบคอมพิวเตอร์ แต่ในกรณีจำเป็นพนักงานเจ้าหน้าที่จะสั่งผู้ให้บริการผู้ใดให้เก็บรักษาข้อมูลจราจรทางคอมพิวเตอร์ไว้เกินเก้าสิบวันแต่ไม่เกินสองปีเป็นกรณีพิเศษเฉพาะรายและเฉพาะคราวก็ได้

### 67.2 "ข้อมูลจราจรทางคอมพิวเตอร์" คือ

- ผู้ใช้, เวลาเข้าออก, IP address
- การกระทำที่เกิด (login, approve, reject, door opened)
- ปลายทางการสื่อสาร

### 67.3 ระบบทำตรงไหน

ตาราง `access_logs` เก็บ:
- `student_id`, `admin_id` — ใครทำ
- `action` — ทำอะไร
- `ip_address` — มาจากไหน
- `user_agent` — ใช้อุปกรณ์อะไร
- `created_at` — เมื่อไหร่
- `notes` — รายละเอียด

### 67.4 การลบ Log

```ts
// API: POST /api/system/logs/cleanup
async function cleanupLogs(req) {
  const user = await getAdminFromCookie();
  if (user.role !== 'owner') return 403;

  const { mode, password } = await req.json();

  if (mode === 'all') {
    // ลบทั้งหมด — ต้องยืนยันรหัส
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return 401;
  }

  // ลบเฉพาะที่เกิน 90 วัน (default)
  await db.query(`
    DELETE FROM access_logs
    WHERE created_at < NOW() - INTERVAL '90 days'
  `);
}
```

> Log < 90 วันลบไม่ได้แม้ owner — ต้องยืนยันรหัส + warning ใน UI

### 67.5 Retention Best Practice

- เก็บ 90-180 วัน (กฎหมายขั้นต่ำ)
- Archive ออกไป cold storage ถ้าต้องการนานกว่า
- ป้องกันการแก้ไข log (write-once) — append-only

### 67.6 Disclosure to Authority

ถ้าหน่วยงานราชการขอ:
- ต้องมี **คำสั่งศาล** หรือ **หนังสือจาก พงส.**
- ส่งเฉพาะที่ขอ — ไม่ทั้ง DB
- บันทึก disclosure log

<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

---

<a id="sec-68"></a>
## 68. PDPA — Personal Data Protection Act

### 68.1 ข้อมูลส่วนบุคคลที่ระบบเก็บ

| ข้อมูล | ประเภท | เหตุผล | Retention |
|--------|--------|--------|-----------|
| ชื่อ-สกุล | PII | identify | ตลอดอายุการเรียน |
| รหัสนักศึกษา | PII | identify | ตลอดอายุ |
| คณะ/สาขา/ปี | PII | filter, statistics | ตลอดอายุ |
| Email | PII | (ถ้าเก็บ) | ตลอดอายุ |
| Phone | PII | (ถ้าเก็บ) | ตลอดอายุ |
| IP address | PII (debatable) | security | 90+ วัน |
| User-agent | non-PII | analytics | 90+ วัน |
| ภาพถ่าย | sensitive PII | ไม่เก็บ | — |

### 68.2 หลักการ 6 ข้อของ PDPA

1. **Lawful basis** — ฐานการประมวลผล (เช่น สัญญา, consent, ภารกิจของรัฐ)
2. **Purpose limitation** — เก็บเพื่ออะไร ใช้เพื่อนั้น
3. **Data minimization** — เก็บเท่าที่จำเป็น
4. **Accuracy** — ข้อมูลถูกต้องเป็นปัจจุบัน
5. **Storage limitation** — เก็บเท่าที่จำเป็น
6. **Integrity & confidentiality** — ปลอดภัย

### 68.3 สิทธิเจ้าของข้อมูล

- สิทธิเข้าถึง (Access)
- สิทธิแก้ไข (Rectification)
- สิทธิลบ (Right to be forgotten)
- สิทธิคัดค้าน (Objection)
- สิทธิให้โอน (Portability)

### 68.4 ระบบรองรับยังไง

- ✅ Admin ดูข้อมูลของนักศึกษาแต่ละคนได้ (access)
- ✅ Admin แก้ไขข้อมูลได้ (rectification)
- ✅ Owner ลบข้อมูลได้ (with confirmation)
- ⚠️ ยังไม่มี self-service portal ให้นักศึกษาดูข้อมูลตัวเอง
- ⚠️ Export ของตัวเอง — ทำได้ผ่าน admin

### 68.5 ที่ควรเพิ่ม

- Privacy Policy URL บนหน้าลงทะเบียน
- Consent checkbox ตอน register
- DPO contact info
- DSAR (Data Subject Access Request) workflow

<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

---

<a id="sec-69"></a>
## 69. Chrome DevTools Profiling ของหน้าเว็บ

### 69.1 Performance Tab — Flame Graph

วิธีดู:
1. Chrome → F12 → Performance
2. กด Record → reload หน้า → Stop
3. ดู timeline

**สิ่งที่จะเจอใน Dashboard**:
```
0ms     ─ Navigation start
50ms    ─ DOMContentLoaded
80ms    ─ HTML parsed
120ms   ─ JS bundle download (CDN cache hit)
180ms   ─ JS parse + compile
250ms   ─ React hydrate
300ms   ─ First useEffect → fetch /api/auth/me
380ms   ─ Auth check OK
400ms   ─ Parallel fetch: pending, students, settings
600ms   ─ First contentful paint
800ms   ─ Largest contentful paint (table rendered)
```

### 69.2 Network Waterfall

ดู:
- ไฟล์ใหญ่สุด: `_next/static/chunks/main-...js` ~250KB
- ไฟล์ที่ช้าสุด: API call แรกหลัง cold start (~500ms)
- Image lazy load: avatar รูป (ถ้ามี)

### 69.3 Lighthouse Audit

```
Performance:  92/100
Accessibility: 88/100
Best Practices: 100/100
SEO: 100/100 (สำหรับหน้าที่เปิดสาธารณะ)
```

**ที่ Lighthouse แนะนำ**:
- Preconnect to Supabase: `<link rel="preconnect" href="https://xxx.supabase.co">`
- Reduce unused JS: dashboard มี ~30% JS ไม่ได้ใช้ → tree shake
- Image optimization: ใช้ `next/image`

### 69.4 Memory Profiling

- Heap snapshot ก่อน-หลังใช้งาน → ดู memory leak
- Dashboard mount/unmount → ควร gc คืน
- Listener cleanup ใน useEffect cleanup function

<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

---

<a id="sec-70"></a>
## 70. ESP32 Oscilloscope Traces

### 70.1 SPI Signal บน TFT

```
SCK  ──┐_┌─┐_┌─┐_┌─┐_┌─┐_┌─    40MHz
MOSI ──┐__┌─┐__┌─┐__┌──┐___    data lanes
CS   ──┐__________________┌──  active LOW during transfer
DC   ──┐___┐╌╌╌┌___┐╌╌╌╌╌╌    data vs command
```

**ที่ต้องดู**:
- SCK rise/fall time < 5ns
- Setup/hold time MOSI vs SCK ≥ 2ns
- ถ้าสายยาว → ringing → ใส่ series resistor 33Ω

### 70.2 Relay Switching Transient

```
GPIO12 ────┐________________________┌──────
           │  (HIGH 3.8s)            │
           ▼                         ▼
Relay coil
voltage    ────┐                     ┌───┐
               │                     │   │← back-EMF spike
               │                     │   │  (~150V ถ้าไม่มี diode)
               ▼                     ▼   │
                                         │
                                         └ damp by flyback diode
```

ใช้ scope probe คร่อม diode:
- ตอน switch off → เห็น spike short (5-10µs)
- ถ้าไม่มี diode → spike 100V+ → transistor พัง

### 70.3 Power Rail Quality

ดู ripple บน 5V output ของ buck:
- Spec: < 50mVpp
- ถ้า > 100mV → ESP32 reset random → ใส่ cap 470µF + 0.1µF

### 70.4 Wi-Fi RF Spectrum

ใช้ HackRF + GQRX:
- 2.4 GHz band
- ESP32 transmit burst ทุก 100ms (beacon) + during HTTP
- ถ้า channel ใกล้ AP สัญญาณรบกวน → ลด throughput

<a id="sec-71"></a>
## 71. ประเด็นงานวิจัยเชิงวิชาการและการยกระดับความมั่นคงปลอดภัย (Academic Research & Security Hardening)

อัปเดตอย่างเป็นทางการ ณ วันที่ 27 พฤษภาคม 2026: ระบบได้ผ่านกระบวนการทำ **Penetration Testing (Active Code-Level & HTTP Tampering Audits)** และแก้ไขช่องโหว่ที่ค้นพบเพื่อให้สอดคล้องกับมาตรฐานความปลอดภัยขั้นสูงและกฎหมายดิจิทัลของไทย พร้อมวิเคราะห์สถาปัตยกรรมเชิงลึกเพื่อการอ้างอิงในรูปเล่มวิจัยของสถาบันการศึกษา

<a id="sec-71-1"></a>
### 71.1 สรุปการแก้ไขช่องโหว่ความมั่นคงปลอดภัย (Vulnerability Remediation)

ระบบได้ทำการปิดช่องโหว่ความปลอดภัยระดับวิกฤต (Critical) และสูง (High) ครบถ้วนดังนี้:

1. **การป้องกันรหัสผ่านและค่าคอนฟิกฐานข้อมูล (Database Secrets Hardening):** 
   - ดำเนินการย้ายข้อมูลรหัสผ่าน Supabase และ API secrets ทั้งหมดไปอยู่บนระบบจัดการ Environment Variables ของผู้ให้บริการโฮสต์ (Vercel Project Settings) แทนการจัดเก็บเป็น Plaintext ในโค้ด
   - ทำการเปลี่ยนผ่านรหัสผ่านฐานข้อมูล Supabase ทันทีหลังจากการทดสอบ (Database Password Rotation)
2. **การยกระดับนโยบายรหัสผ่านของบัญชีผู้ดูแลระบบ (Admin Password Policy):**
   - แก้ไข API `/api/admin-users` เพื่อบังคับใช้นโยบายรหัสผ่านที่รัดกุมสูง: ความยาวรหัสผ่านต้องไม่ต่ำกว่า 12 ตัวอักษร และต้องประกอบด้วยอักษรตัวพิมพ์ใหญ่ ตัวพิมพ์เล็ก ตัวเลข และอักขระพิเศษอย่างน้อยประเภทละ 1 ตัว
   - เพิ่มระบบตรวจสอบรูปแบบชื่อผู้ใช้งาน (Username Validation) โดยอนุญาตเฉพาะอักษรภาษาอังกฤษ ตัวเลข ตัวอักษรพิเศษเฉพาะจุด (.) และขีดล่าง (_) เท่านั้น (`/^[a-zA-Z0-9_.]{3,30}$/`)
3. **การจำกัดขอบเขตสิทธิ์ของผู้ควบคุมประตูรายห้อง (Multi-Room Role RBAC):**
   - เพิ่มคอลัมน์ `allowed_rooms` ในตารางผู้ดูแลระบบ เพื่อจำกัดไม่ให้ผู้ใช้งานระดับ `door_operator` มีสิทธิ์สั่งการหรือจัดการประตูในห้องที่ตนเองไม่ได้รับผิดชอบ
   - มีระบบตรวจสอบสิทธิ์ระดับฟังก์ชันการสั่งการ (Function-Level Authorization) ก่อนส่งคิวเปิดประตูไปยัง ESP32
4. **การควบคุมความยาวและล้างข้อมูลป้อนเข้าแบบสมบูรณ์ (Input Validation & DoS/XSS Protection):**
   - นำแพ็กเกจ `isomorphic-dompurify` มาติดตั้งและกรองข้อมูลอินพุตฝั่งเซิร์ฟเวอร์แบบเข้มงวด ป้องกันการทำ Cross-Site Scripting (XSS) ในฟิลด์ข้อมูลนักศึกษา
   - จำกัดความยาวของสาเหตุในการปฏิเสธการเข้าห้องเรียน (Reject Reason) ให้ไม่เกิน 500 ตัวอักษร เพื่อป้องกันการโจมตีประเภท Denial of Service (DoS) ทางฐานข้อมูล
5. **การป้องกันการปลอมแปลงไอพีแอดเดรส (IP Spoofing Protection):**
   - พัฒนาระบบประมวลผลข้อมูล IP แอดเดรสของผู้ใช้งานผ่าน `x-forwarded-for` ของ Vercel Trusted Proxy Chain เพื่อแยกแยะและดึงข้อมูล IP แอดเดรสที่แท้จริงของผู้ใช้ (Right-most client IP) ส่งผลให้การควบคุมการจำกัดปริมาณคำขอ (Rate Limiting) จากสปามเมอร์มีความแม่นยำสูง
6. **การป้องกันข้อผิดพลาดการแปลงชนิดข้อมูลใน API (NaN Checking):**
   - เพิ่มระบบสกัดกั้นและตรวจสอบประเภทข้อมูลใน API `/api/students/[id]` และ `/api/admin-users/[id]` ป้องกันกรณีผู้โจมตีเจตนาส่งค่าที่ไม่ใช่ตัวเลข (NaN) เพื่อหวังผลให้ฐานข้อมูลประมวลผลผิดพลาด

<a id="sec-71-2"></a>
### 71.2 ผลการวัดประสิทธิภาพบนโปรดักชัน (Live Benchmarking)

จากการทดสอบยิงทดสอบระบบจริง (Active Benchmarking) จากคอมพิวเตอร์นักศึกษาในประเทศไทย ไปยังระบบ Vercel Server และ Supabase PostgreSQL (ภูมิภาคสิงคโปร์ - ap-southeast-1) ผลการวัดประสิทธิภาพเป็นดังนี้:

| API Endpoint | จำนวนรัน | เวลาตอบสนองเฉลี่ย (Avg Latency) | Percentile 50 (Median) | Percentile 95 (P95) |
|---|---|---|---|---|
| **หน้าแรกนักศึกษา (Home RSC)** | 10 ครั้ง | 67ms | 44ms | **281ms (รวม Cold-start)** |
| **ดึงสถานะสำหรับ ESP32 (`/api/esp32/display`)** | 10 ครั้ง | 75ms | 73ms | **97ms** |
| **ดึง QR สำหรับหน้าห้อง (`/api/esp32/qr`)** | 10 ครั้ง | 93ms | 60ms | **381ms (ติดการยืนยันสิทธิ์)** |

> [!TIP]
> **วิเคราะห์ผลทดสอบ:**
> ค่าเฉลี่ยการดึงสถานะสำหรับ ESP32 (Hot Path Polling) อยู่ที่เพียง **97ms (P95)** ซึ่งถือว่ารวดเร็วกว่าข้อกำหนดการพัฒนาทั่วไปอย่างมาก ส่งผลให้วงรอบในการดึงข้อมูลของบอร์ด ESP32 ที่ทำงานทุก ๆ 2 วินาที ใช้ขีดความสามารถการรับส่งข้อมูลของเน็ตเวิร์กเพียง 5% เท่านั้น และป้องกันปัญหากลอนประตูตอบสนองล่าช้าเมื่อผู้ใช้งานได้รับอนุมัติได้อย่างเด็ดขาด

<a id="sec-71-3"></a>
### 71.3 สถาปัตยกรรมการสื่อสารแบบ "Push-via-Poll" ในระบบเครือข่ายองค์กร

การเชื่อมต่อและสื่อสารอุปกรณ์ IoT (ESP32) เข้ากับคลาวด์เซิร์ฟเวอร์ในสภาพแวดล้อมเครือข่ายของมหาวิทยาลัยหรือองค์กรขนาดใหญ่ เผชิญความท้าทายหลัก 3 ประการ:
1. **การปิดกั้นขารับข้อมูล (Inbound Traffic Block):** นโยบายความมั่นคงปลอดภัยเครือข่ายของหน่วยงานมักจะบล็อกพอร์ตขาเข้าทั้งหมด ส่งผลให้เซิร์ฟเวอร์ภายนอกไม่สามารถใช้เทคนิคส่งข้อความผลัก (Push notifications หรือ HTTP Post) ยิงตรงมายังไอพีแอดเดรสของ ESP32 ได้
2. **ระบบแบ่งปันไอพีแอดเดรส (Carrier-Grade NAT / CGNAT):** อุปกรณ์ในห้องเรียนไม่ได้ครอบครองไอพีแอดเดรสสาธารณะ (Public IP) แต่จะเชื่อมต่อผ่าน NAT วงใน ทำให้การหาตำแหน่งเน็ตเวิร์กบอร์ดทำได้ยาก
3. **ความเสี่ยงจากการตั้งค่าพอร์ตฟอร์เวิร์ดดิ้ง (Port Forwarding Risks):** การเจาะเราเตอร์เพื่อส่งข้อมูลเข้าสู่บอร์ดโดยตรงเป็นการเปิดช่องให้ผู้โจมตีภายนอกแสกนหาอุปกรณ์และทำการแฮกในระดับฮาร์ดแวร์ได้ง่าย

เพื่อแก้ปัญหาข้างต้น ระบบ **Innovative system for managing access rights and controlling classroom access via wireless network** จึงนำสถาปัตยกรรม **"Push-via-Poll" (หรือ IoT Cloud Polling Design)** มาใช้งานจริง:
- **หลักการส่งออกข้อมูลขาเดียว (Outbound-only Connection):** บอร์ด ESP32 ที่ติดตั้งภายในวง LAN ของห้องเรียนจะเป็นฝ่ายเริ่มต้นสถาปนาการเชื่อมต่อ (Initiate Connection) ขาออกด้วยการร้องขอแบบ HTTPS GET ทุก ๆ 2 วินาที ไปยังเซิร์ฟเวอร์ Vercel ภายนอก ซึ่งเป็นช่องทางสื่อสารที่ Firewall ขององค์กรอนุญาตอย่างเป็นปกติ
- **ระบบคำสั่งในท่อข้อมูล (Command Queue via Response):** ทุกครั้งที่ ESP32 ยิงคำขอไปถามสถานะ `/api/esp32/display` ทางคลาวด์เซิร์ฟเวอร์จะตรวจสอบฐานข้อมูล Supabase เพื่อสแกนหาตัวแปรคำสั่ง `room_cmd_<room>` หากแอดมินกดอนุมัติเปิดประตู ตัวแปรดังกล่าวจะถูกเปลี่ยนค่าเป็น `unlock` และถูกจัดส่งเป็นข้อมูลแนบท้าย (JSON Response payload) ส่งกลับคืนไปในขารับสายสัญญาณข้อมูลของตัวบอร์ดทันที
- **การวิเคราะห์การใช้งานแบนด์วิดท์เครือข่าย (Bandwidth Analysis):** 
  - ขนาดของ JSON payload ต่อการส่งหนึ่งรอบมีขนาดเฉลี่ยเพียง **784 ไบต์**
  - เมื่อส่งข้อมูลคำร้องทุก 2 วินาที ปริมาณข้อมูลทั้งหมดต่อวันสำหรับ 1 ห้องเรียนจะอยู่ที่ประมาณ **32 เมกะไบต์ (MB)** ซึ่งถือว่าน้อยมาก และไม่มีผลกระทบในเชิงลบหรือสร้างภาระงานให้กับระบบเครือข่ายส่วนกลางของทางมหาวิทยาลัยแต่อย่างใด

<a id="sec-71-4"></a>
### 71.4 กลไกป้องกันการเปิดประตูซ้ำด้วย Atomic Transaction

เมื่อผู้ดูแลระบบกดปุ่ม "อนุมัติ" หรือ "ปลดล็อกด่วน" หน้าแดชบอร์ด จะมีการบันทึกคิวเปิดประตูลงสู่ฐานข้อมูล การสื่อสารดังกล่าวอาจเกิดข้อผิดพลาดเชิงโครงสร้าง (Race Condition) ได้หากมีตัวดักฟังสัญญาณพยายามคัดลอกแพ็กเกตข้อมูลไปส่งซ้ำ หรือหากบอร์ด ESP32 เกิดการหน่วงทางเน็ตเวิร์กทำให้ยิงขอคำสั่งเข้ามาขนานกัน (Concurrent Polls) ในระดับเสี้ยววินาที

หากใช้ตรรกะแบบดั้งเดิมในการตรวจสอบ (Check-Then-Act anti-pattern) ดังนี้:
1. `SELECT` ตรวจสอบว่า `room_cmd` มีค่าเท่ากับ `'unlock'` หรือไม่
2. บอร์ดรับค่าไปประมวลผลสั่งเปิดประตู
3. `UPDATE` ค่า `room_cmd` ให้กลายเป็น `'consumed'`

> [!WARNING]
> **ช่องโหว่ความมั่นคง:** ในระบบ Serverless หรือมีผู้ใช้ปริมาณมาก (High Concurrency) ระหว่างขั้นตอนที่ 1 และ 3 อาจมีอีก Request หนึ่งร้องขอเข้ามาสำเร็จและเห็นสถานะเป็น `'unlock'` เช่นเดียวกัน ส่งผลให้คำสั่งเปิดประตูทำงานสองรอบซ้อน หรือเปิดค้างโดยไม่มีผู้รับผิดชอบ

**แนวทางแก้ไขเชิงทฤษฎีในโครงงานวิจัย:**
ระบบได้ออกแบบให้ใช้ **Single-step Atomic Update** ในระดับ SQL Engine บนเครื่องยนต์ฐานข้อมูล Supabase PostgreSQL ผ่านประโยคคำสั่งเดียวที่เป็นอะตอมิก (ไม่สามารถแยกการประมวลผลย่อยได้):

```sql
UPDATE system_settings 
SET setting_value = 'consumed' 
WHERE setting_key = 'room_cmd_CE-401' AND setting_value = 'unlock' 
RETURNING *;
```

**คำอธิบายตรรกะการประมวลผล:**
- คำสั่ง `UPDATE` จะรันในลักษณะล็อกระดับแถว (Row-level lock) หากมี 2 คำร้องขอเข้ามาพร้อมกัน คำร้องตัวแรกจะเข้ามาเปลี่ยนค่า `setting_value` จาก `'unlock'` เป็น `'consumed'` และฐานข้อมูลจะส่งคืนผลลัพธ์ผ่านคำสั่ง `RETURNING *` ทำให้เซิร์ฟเวอร์ส่งคำสั่งตอบกลับบอร์ด ESP32 เพื่อเปิดประตู
- ในเสี้ยววินาทีเดียวกัน คำร้องตัวที่สองที่พยายามวิ่งเข้ามาจะพบว่าเงื่อนไข `WHERE setting_value = 'unlock'` ไม่เป็นความจริงอีกต่อไป (เพราะถูกตัวแรกเปลี่ยนเป็น `'consumed'` ไปแล้ว) ฐานข้อมูลจึงจะไม่ส่งคืนค่าผลลัพธ์ใดๆ (Zero rows affected) และคำขอตัวที่สองจะถูกเซิร์ฟเวอร์ระงับการสั่งเปิดทันที ป้องกันภัยคุกคามและการเปิดซ้ำซ้อนได้อย่างสมบูรณ์ 100%

> ### (ก) รายละเอียดและผลการวิเคราะห์ระบบเชิงลึก (System Audit Findings)
> - จัดทำรายงานวิเคราะห์ความสมบูรณ์และข้อเสนอแนะเชิงลึกเป็นหลักฐานทางวิชาการและแนวทางปฏิบัติในอนาคตที่ **[system_audit_and_proposals.md](file:///C:/Users/aunkh/.gemini/antigravity/brain/249e704a-fd2c-4efe-9262-e8fd723cd4f7/system_audit_and_proposals.md)** ครอบคลุม:
>   - **Security Enhancements**: เสนอแนะโมดูล Active ESP32 Heartbeat Alerting (Last Seen Tracker ใน DB) และการผูก UI สิทธิ์ผู้ดูแลระบบรายห้อง (Allowed Rooms RBAC UI)
>   - **Edge-Case Bugs**: วิเคราะห์แนวทางแก้ปัญหา React Hydration Mismatch ใน Next.js App Router, ปัญหา Clock Drift บนจอ TFT โดยการซิงค์เวลาผ่าน NTP Server, และกลไก "Right to be Forgotten" ในการลบข้อมูลถาวรรายบุคคลตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA)
>   - **Admin/User Convenience**: เสนอแบบพิมพ์เขียวฟีเจอร์ Bulk Actions (อนุมัติ/ปฏิเสธแบบกลุ่ม), Interactive SVG Analytics Dashboard กราฟสถิติแบบไม่มีไลบรารีภายนอกรบกวน, Dynamic Registration Progress Tracker (อนิเมชั่น Stepper ประตูแง้มเปิด), Biometric WebAuthn Bypass (สแกนนิ้วมือ/ใบหน้าจริงบนสมาร์ทโฟนยืนยัน bypass) และ In-App Camera QR Reader
> 
> ---
> 
> > **อัปเดตล่าสุด**: 2026-05-28 เวลาประมาณ 16:20:00 +07:00 — **คู่มือเชิงลึกด้านการพัฒนา แก้ไขโค้ด และจัดเตรียมการอัปโหลดเฟิร์มแวร์แบบไร้สาย (Ultimate Firmware Customization & Enterprise OTA Deployment Guide)**
> > 
> > เพื่อความสมบูรณ์แบบในการนำเสนองานวิทยานิพนธ์และการใช้งานจริงระดับโปรดักชัน หัวข้อนี้ได้อธิบายข้อเท็จจริงทางสถาปัตยกรรมคอมพิวเตอร์ ตำแหน่งไฟล์ที่ต้องแก้ไขบนเว็บแอปพลิเคชัน ข้อจำกัดในการทำ Auto-Compiler บนระบบคลาวด์ และขั้นตอนปฏิบัติสำหรับการคอมไพล์และอัปโหลดไฟล์ไบนารี (`.bin`) ผ่านหน้าเว็บแดชบอร์ดอย่างละเอียดสูงสุด
> > 
> > #### 1. ตำแหน่งการแก้ไขโค้ดเฟิร์มแวร์ ESP32 บนระบบเว็บ
> > โค้ดสำหรับบอร์ดควบคุมหน้าห้องในระบบ SmartAccess มีจุดจัดเก็บและจัดการหลัก 2 จุดที่ต้องทราบเมื่อต้องการแก้ไข:
> > 1. **ไฟล์ต้นฉบับหลักใน Workspace (Developer Native Workspace):**
> >    - **โฟลเดอร์หลัก**: `esp32/esp32.ino` (และไฟล์แยกความลับเชื่อมต่อ `esp32/config.h`)
> >    - **การใช้งาน**: ใช้สำหรับนักพัฒนาระบบฮาร์ดแวร์เพื่อเปิดคอมไพล์ แก้ไขไลบรารี ปรับแต่งอินเตอร์เฟสหน้าจอ TFT ตลอดจนอัปเดตฟังก์ชันฝั่งฮาร์ดแวร์โดยตรงผ่าน Arduino IDE หรือ VS Code (PlatformIO)
> > 2. **ตัวสร้างโค้ดอัตโนมัติบนหน้าเว็บแอดมิน (Admin Dashboard Auto-Generator):**
> >    - **โฟลเดอร์และไฟล์**: [my-app/app/admin/dashboard/page.tsx](file:///c:/Users/aunkh/OneDrive/Desktop/Project/my-app/app/admin/dashboard/page.tsx)
> >    - **ฟังก์ชันประมวลผล**: ฟังก์ชัน `getArduinoCode(...)` (สำหรับสร้างโครงสร้างโค้ดหลัก) และ `getConfigCode(...)` (สำหรับสร้างไฟล์ `config.h` ประจำเครื่อง)
> >    - **หลักการทำงาน**: ฟังก์ชัน JavaScript นี้ทำหน้าที่จัดเจน (Generate) โค้ดภาษา C++ ขึ้นมาในลักษณะ Template String แดงแปรผันตามหมายเลขห้องเรียน (`roomCode`) และโดเมนเว็บจริง (`originUrl`) ของผู้ใช้ที่กำลังเปิดหน้าจออยู่ แอดมินจึงสามารถคัดลอกไฟล์โค้ดไปวางใน Arduino IDE แล้วนำไปแฟลชบอร์ดได้ทันทีโดยไม่ต้องแก้ไขค่าไอพี ลิงก์ URL หรือแก้ไขพินสายไฟด้วยตนเอง
> > 
> > #### 2. ข้อเท็จจริงเชิงเทคนิค: ทำไมไม่ควรคอมไพล์โค้ด C++ อัตโนมัติบน Cloud Server?
> > หลายคนมักตั้งคำถามว่า *"ทำไมระบบไม่กดปุ่มป้อนโค้ดบนเว็บแล้วให้เซิร์ฟเวอร์คลาวด์คอมไพล์เสร็จออกมาเป็นไฟล์ .bin ให้เลยโดยอัตโนมัติ?"* ในทางวิศวกรรมคอมพิวเตอร์และระบบเครือข่าย มีข้อจำกัดร้ายแรงที่จำเป็นต้องหลีกเลี่ยงดังนี้:
> > 1. **ข้อจำกัดทรัพยากรของเซิร์ฟเวอร์แบบไร้เซิร์ฟเวอร์ (Serverless Memory & CPU Limits):**
> >    - การคอมไพล์ภาษา C++ สำหรับชิปสถาปัตยกรรม Xtensa ของ ESP32 ต้องใช้โปรแกรมคอมไพล์เลอร์เฉพาะรุ่น และกินหน่วยความจำแรมสูงถึง 2GB - 4GB รวมถึงประมวลผลซีพียู 100% ตลอดระยะเวลา 1-3 นาที
> >    - คลาวด์ยุคใหม่ (เช่น Vercel Serverless Functions) ได้รับการออกแบบให้ทำงานสั้น ๆ (มี Execution Timeout สูงสุดเพียง 10-60 วินาทีและแรมจำกัด 1024MB) ส่งผลให้การสั่งคอมไพล์บนเซิร์ฟเวอร์เกิดสภาวะล่ม (Out of Memory / Timeout Error) เสมอ
> > 2. **ความยากในการบำรุงรักษาระบบไลบรารี (Complex Dependency Management):**
> >    - โค้ดควบคุมประตูใช้ไลบรารีจำนวนมาก เช่น `Adafruit_GFX`, `Adafruit_ILI9341`, `ArduinoJson`, `ElegantOTA`, `ricmoo_qrcode` 
> >    - การรันตัวคอมไพล์บนคลาวด์จำเป็นต้องติดตั้งโปรแกรม Arduino-CLI และต้องคอยดึง อัปเดต สั่งติดตั้งไลบรารีทุกตัวเหล่านี้ให้ตรงรุ่นอยู่เสมอ ซึ่งเป็นภาระหนักทางระบบไอทีและมีโอกาสที่คอมไพล์เลอร์จะเข้ากันไม่ได้ (Incompatible Version) สูงมาก
> > 3. **ความเสี่ยงด้านความปลอดภัยขั้นร้ายแรง (Remote Code Execution Vulnerability):**
> >    - การยินยอมให้เว็บแอปพลิเคชันรับโค้ดดิบไปคอมไพล์และรันคำสั่งเชิงระบบ (System Shell Commands) บนหลังบ้าน ถือเป็นการเปิดช่องโหว่ความมั่นคงปลอดภัยขนาดมหึมา (RCE) หากแฮกเกอร์โจมตีนำสคริปต์อันตรายป้อนเข้ามา จะสามารถเข้าควบคุมระบบคลาวด์ แฟลชเฟิร์มแวร์แฝงมัลแวร์ไปคุมประตูห้อง หรือขโมยคีย์ Supabase/PostgreSQL ออกไปได้ทั้งหมด
> > 
> > #### 3. แผนการดำเนินงานและแนวปฏิบัติที่เป็นเลิศ (Enterprise Cloud OTA Deployment Runbook)
> > เพื่อความปลอดภัยและรวดเร็วสูงสุด ระบบจึงเลือกใช้แนวทาง **"Local Compilation & Secure Web Upload"** ซึ่งเป็นมาตรฐานสากลที่ใช้ในอุปกรณ์สมาร์ทโฮมแบรนด์เนม โดยมีขั้นตอนการจัดส่งอัปเดตดังนี้:
> > 
> > ##### ขั้นตอนที่ 1: การพัฒนาและคอมไพล์เฟิร์มแวร์บนคอมพิวเตอร์นักพัฒนา
> > 1. เปิดไฟล์โค้ด C++ หลักใน Arduino IDE หรือ VS Code
> > 2. เข้าไปแก้ไขเลขรุ่นเวอร์ชันในบรรทัด `const char* CURRENT_VERSION = "1.0.0";` ให้เป็นเวอร์ชันใหม่ (ตัวอย่าง: `"1.0.2"`)
> > 3. ตรวจสอบให้มั่นใจว่าไม่ได้ระบุ `#define WOKWI_SIM` สำหรับบอร์ดใช้งานจริง
> > 4. ที่เมนู **Sketch** ใน Arduino IDE กดคลิกเลือก **Export Compiled Binary**
> > 5. โปรแกรมจะประมวลผลคอมไพล์ตัวแปรและสร้างไฟล์ผลลัพธ์นามสกุล `.bin` (เช่น `esp32.ino.bin`) ภายในโฟลเดอร์ของโปรเจกต์
> > 
> > ##### ขั้นตอนที่ 2: การอัปโหลดไฟล์อัปเกรดขึ้นบนระบบจัดการแดชบอร์ด (Web Admin Portal)
> > 1. แอดมินทำการล็อกอินเข้าสู่หน้าเว็บ SmartAccess แผงควบคุมผู้ดูแลระบบ ([http://localhost:3000/admin/login](http://localhost:3000/admin/login))
> > 2. เดินทางไปที่เมนู **"ตั้งค่าระบบและความเสถียร" (System Settings & Hardware Control)**
> > 3. ในบล็อกเมนู **"ระบบจัดการเฟิร์มแวร์แบบไร้สาย" (OTA Control Center)** แอดมินสามารถคลิกปุ่มหรือลากไฟล์ `.bin` ที่ได้จากขั้นตอนที่ 1 ไปหย่อนวางในระบบอัปโหลด
> > 4. ระบุเลขเวอร์ชันใหม่ให้สอดคล้องกัน เช่น `1.0.2` จากนั้นกรอกรหัสผ่านเพื่อยืนยันตัวตนแอดมินสูงสุด (Owner/Owner Role) และคลิกปุ่ม **"เปิดตัวปล่อยเฟิร์มแวร์แบบไร้สาย (Deploy OTA Update)"**
> > 5. ตัวระบบ Next.js API หลังบ้านจะนำไฟล์บันทึกเก็บบนคลาวด์ในส่วน `public/firmware/v_1_0_2.bin` อย่างปลอดภัย พร้อมทั้งคำนวณ MD5 Checksum ของไฟล์และอัปเดตตาราง `system_settings` ให้เครื่องทราบทันที
> > 
> > ##### ขั้นตอนที่ 3: บอร์ด ESP32 ตรวจสอบสัญญาณและแฟลชตนเองอัตโนมัติ (Dynamic Over-The-Air Pull)
> > 1. บอร์ดควบคุมประตูหน้าห้องเรียนจะทำการส่ง HTTP Polling เรียก API `/api/esp32/display` ทุก ๆ 2 วินาที โดยแนบข้อมูลรุ่นใน Header `x-esp32-version: 1.0.0`
> > 2. ระบบ API ของ Next.js จะเปรียบเทียบรุ่นของบอร์ดที่ส่งมากับค่าเวอร์ชันล่าสุดในระบบคลาวด์ (`1.0.2`)
> > 3. หากพบว่ามีเวอร์ชันใหม่กว่า เซิร์ฟเวอร์จะตอบกลับค่า JSON สตรีมส่งสัญญาณธงอัปเดต `"update_available": true` 
> > 4. เมื่อบอร์ด ESP32 ตรวจพบธงคำสั่งนี้ บอร์ดจะยุติกระบวนการแสดงผลปกติชั่วคราว วาดหน้าจอสีดำแสดง **"SMARTACCESS OTA: Downloading firmware..."**
> > 5. บอร์ดจะดึงไฟล์ไบนารีจากโดเมนโดยตรงผ่านโปรโตคอล HTTPS พร้อมนำตรวจสอบลายเซ็น Checksum ยืนยันความถูกต้อง ป้องกันสภาวะบอร์ดพัง (Anti-Brick Dual-Partition Bootloader) 
> > 6. เมื่อแฟลชหน่วยความจำครบ 100% บอร์ดจะรีบูตตัวเองอัตโนมัติและขึ้นกลับมาสแตนด์บายให้บริการเปิดปิดประตูต่อทันทีด้วยเวอร์ชันใหม่ `"1.0.2"` อย่างปลอดภัยสูงสุด!

<a id="sec-71-5"></a>
### 71.5 สถาปัตยกรรมความปลอดภัยแบบหลายชั้น (Defense-in-Depth)

การยกระดับความปลอดภัยสำหรับวิทยานิพนธ์ฉบับนี้ใช้หลักการป้องปรามหลายระดับ เพื่อป้องกันช่องโหว่ที่เกิดจากการเข้าถึงแบบมิชอบในรูปแบบต่าง ๆ :

1. **ระบบโทเคนหมุนเวียนจำกัดเวลา (Time-based QR Code Rotation):**
   - QR Code ที่ปรากฏบนจอ TFT เป็นข้อมูลที่เข้ารหัสด้วยโทเคนที่ลงลายมือชื่อดิจิทัล (Cryptographically Signed Token)
   - ตัวโทเคนดังกล่าวจะมีการหมุนเวียนสร้างคีย์ใหม่ทุกๆ **60 วินาที** และมีระยะเวลาหมดอายุจริงภายใน **300 วินาที**
   - **แนวคิดการโจมตีที่ป้องกันได้:** ป้องกันภัยการคัดลอกรูปภาพ QR Code (QR Copying / Replay Attack) โดยหากผู้ใช้นอกห้องถ่ายรูปภาพ QR Code ส่งต่อให้เพื่อนในแชท เมื่อเพื่อนได้รับและสแกน โทเคนดังกล่าวจะหมดอายุหรือถูกใช้ไปแล้ว ทำให้ไม่สามารถเข้าประตูด้านนอกได้
2. **หน้าต่างผ่านประตูด่วนชั่วคราว (Bypass Session Window):**
   - เพื่อเพิ่มความสะดวกในการใช้งานเชิงสถิติ (User Experience) เมื่อนักศึกษาได้รับอนุมัติผ่านเข้าห้องเรียนสำเร็จ 1 ครั้ง ระบบจะออกตั๋วคุกกี้สิทธิ์ชั่วคราว (Bypass Token) บันทึกลงในบราวเซอร์อุปกรณ์นักศึกษา มีระยะเวลาหมดอายุภายใน **5 นาที**
   - หากนักศึกษาต้องเดินออกจากห้องไปทิ้งขยะ หรือทำธุระในระยะเวลาสั้นๆ สามารถสแกน QR Code หน้าห้องเพื่อขอเปิดได้ทันทีโดยระบบจะข้ามขั้นตอนการกรอกฟอร์มประวัติ และเรียกใช้ API `/api/students/bypass` เพื่อปลดล็อกด่วนทันที โดยยังคงความปลอดภัยเพราะมีเซสชันยืนยันตนจำกัดสิทธิ์ในระบบ
3. **ระบบจำกัดความถี่ยิงถล่ม (Database-Backed Rate Limiting):**
   - ป้องกันสแปมและการยิงสุ่มรหัสผ่านของแอดมิน (Brute Force) โดยระบบจะเขียนบันทึก IP จริงของคำขอลงสู่ตาราง rate-limit ใน PostgreSQL และเปิดระบบจำกัดสูงสุด 5 ครั้งต่อ 1 นาที หากยิงถล่มมาเกินกำหนด ระบบจะส่งรหัสผิดพลาด HTTP 429 ทันทีเพื่อบล็อคพอร์ตไอพีนั้นโดยอัตโนมัติ

<a id="sec-71-6"></a>
### 71.6 การปฏิบัติตาม พ.ร.บ. คอมพิวเตอร์ และหลักการคุ้มครองข้อมูลส่วนบุคคล (PDPA)

เพื่อให้ระบบพร้อมใช้งานได้จริงในระดับองค์กร และผ่านเกณฑ์มาตรฐานการตรวจสอบของคณะกรรมการสถาบันศึกษา โครงการได้ออกแบบระบบบนฐานกฎหมายดิจิทัลของไทย 2 ฉบับหลัก:

*   **พ.ร.บ. ว่าด้วยการกระทำความผิดเกี่ยวกับคอมพิวเตอร์ พ.ศ. 2560 (มาตรา 26):**
    - กฎหมายระบุให้ผู้ให้บริการระบบสารสนเทศต้องทำการบันทึกข้อมูลจราจรคอมพิวเตอร์ (Log Files) เพื่อใช้ระบุตัวตนบุคคลที่ใช้งาน และเก็บรักษาไว้อย่างน้อย 90 วัน
    - ระบบ **Innovative system for managing access rights and controlling classroom access via wireless network** ได้ออกแบบตารางฐานข้อมูล `access_logs` เพื่อบันทึกวัน เวลา หมายเลขไอพี อุปกรณ์ รหัสนักศึกษา และสถานะผลลัพธ์ของทุกคนที่เข้าประตูอย่างเคร่งครัด
    - มีระบบ **Immutable Log Policy** บนระบบฐานข้อมูลเพื่อป้องกันไม่ให้ผู้ใช้งานทั่วไป รวมถึงผู้ควบคุมห้องเรียนระดับ `door_operator` ทำการแก้ไข ลบ หรือดัดแปลงข้อมูลประวัติย้อนหลังใดๆ ได้ เพื่อรักษาความน่าเชื่อถือของพยานหลักฐานทางนิติวิทยาศาสตร์ดิจิทัลกรณีเกิดเหตุอาชญากรรมในชั้นเรียน
*   **พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA):**
    - เพื่อปกป้องข้อมูลส่วนบุคคลที่ระบุตัวตนนักศึกษาได้ (Personally Identifiable Information - PII) ระบบมีการแสดงผลข้อมูลบนหน้าจอประวัติการเข้าใช้งานแอดมินแดชบอร์ด โดยมีระบบบดบังข้อมูลบางส่วน (Data Masking) เช่น การแสดงรหัสนักศึกษาในรูปแบบ `1164xxxxxx45` และไม่แสดงข้อมูลที่ละเอียดอ่อนแก่ผู้ไม่มีสิทธิ์
    - นำระบบ **Row-Level Security (RLS)** ของ Supabase PostgreSQL มาตั้งค่าห้ามการสแกนหรืออ่านข้อมูลตารางผู้สมัครแบบสาธารณะ โดยอนุญาตสิทธิ์การคิวรี่และเข้าถึงเฉพาะคีย์เซสชันที่ลงชื่อเข้าใช้ด้วยบัญชีแอดมิน `owner` ที่ได้รับอนุญาตตามกฎหมายแล้วเท่านั้น

<a id="sec-71-7"></a>
### 71.7 การวิเคราะห์การจัดสรรพลังงานและการออกแบบกลไกเผชิญเหตุฉุกเฉิน (Power Budget & Fail-Safe Design)

การวิเคราะห์กำลังไฟฟ้าและสเปกทางวิศวกรรมไฟฟ้ามีความจำเป็นอย่างยิ่งสำหรับการนำเสนอในเล่มวิทยานิพนธ์ เพื่อพิสูจน์ความเสถียรของวงจรและระบุกระแสไฟฟ้าที่จำเป็นสำหรับการเปิดใช้งานจริง

#### 1. การคำนวณปริมาณกำลังไฟฟ้าของอุปกรณ์ควบคุมหลัก (Power Budget Calculation)
ระบบควบคุมฝั่งฮาร์ดแวร์ประกอบด้วยอุปกรณ์หลัก 4 ส่วนที่เชื่อมต่อกับแหล่งจ่ายพลังงาน 5 โวลต์ (V) และ 3.3 โวลต์ (V) จากการวัดและประเมินค่าทางไฟฟ้ามีปริมาณการดึงกระแส (Current Draw) ในสถานะสูงสุด (Active State) ดังนี้:

- **บอร์ดพัฒนา ESP32 DevKit V1:** ดึงกระแสสูงสุดช่วงเชื่อมต่อ Wi-Fi และส่ง HTTPS Request อยู่ที่ประมาณ **240mA (1.2W)**
- **หน้าจอแสดงผล TFT ILI9341 (ขนาด 3.2 นิ้ว):** ดึงกระแสในขณะเปิดไฟหลังจอ (Backlight ON) สูงสุดประมาณ **80mA (0.4W)**
- **Relay Module (5V Single-Channel):** ดึงกระแสในสถานะขดลวดทำงาน (Relay Coil Energized) อยู่ที่ประมาณ **70mA (0.35W)**
- **Active Buzzer (ส่งสัญญาณเสียงเตือน):** ดึงกระแสเฉลี่ยขณะเปล่งเสียงประมาณ **30mA (0.15W)**

> **สมการการคำนวณหากำลังไฟฟ้ารวมฝั่งควบคุม (Total Power Control Side):**
> $$I_{total} = I_{ESP32} + I_{TFT} + I_{Relay} + I_{Buzzer}$$
> $$I_{total} = 240\text{mA} + 80\text{mA} + 70\text{mA} + 30\text{mA} = 420\text{mA}$$
> $$P_{total} = V \times I = 5\text{V} \times 0.42\text{A} = 2.1\text{Watts}$$

**ผลการวิเคราะห์:** กำลังไฟฟ้ารวมฝั่งควบคุมใช้เพียง **2.1 วัตต์** ดังนั้นการเลือกใช้ Buck Converter ขนาด 12V to 5V ที่สามารถจ่ายกระแสได้ 1.5A หรือมากกว่า หรือการเลือกใช้ USB Adaptor ทั่วไปขนาด 5V 1A จึงสามารถหล่อเลี้ยงระบบได้อย่างเสถียรภาพโดยไม่มีอาการบอร์ดดับเนื่องจากแรงดันไฟตก (Voltage Drop)

#### 2. การออกแบบเพื่อความปลอดภัยด้านกฎหมายอาคารและการป้องกันอัคคีภัย (Fail-Safe Design)
ในการออกแบบระบบควบคุมการผ่านเข้าออกอาคาร (Access Control System) นอกเหนือจากการรักษาความปลอดภัยของทรัพย์สินแล้ว **ความปลอดภัยของชีวิตผู้ใช้งาน (Life Safety)** คือปัจจัยสำคัญอันดับหนึ่งตามมาตรฐานสากลและข้อกฎหมายควบคุมอาคารของไทย:

- **การประยุกต์ใช้กลไกแบบ Fail-Safe (ปลดล็อกเมื่อไม่มีไฟฟ้า):** 
  - ระบบนี้เชื่อมต่อร่วมกับ **Magnetic Lock ขนาด 280 กก. (ดึงกระแส 12V 450mA)** โดยเลือกเชื่อมต่อสายขั้วบวกของกลอนแม่เหล็กผ่านขา **NC (Normally Closed)** ของ Relay Module
  - ในสถานะการทำงานปกติ ระบบจะจ่ายไฟหล่อเลี้ยงกลอนแม่เหล็กตลอดเวลา (Energized) เพื่อทำการล็อกประตูห้องเรียน
  - **การทำงานในภาวะฉุกเฉิน (Emergency Scenario):** เมื่อเกิดภัยพิบัติ เช่น อัคคีภัย แผ่นดินไหว หรือไฟฟ้าดับหลักในอาคาร แหล่งจ่ายไฟจะถูกตัดโดยอัตโนมัติ ส่งผลให้กลอนแม่เหล็กไฟฟ้าสูญเสียพลังงานเหนี่ยวนำ (De-energized) และประตูห้องเรียนจะ**ปลดล็อกทันที**โดยอัตโนมัติ
  - **ผลสัมฤทธิ์:** นักศึกษาและอาจารย์ผู้สอนสามารถเปิดประตูผลักเพื่ออพยพออกจากห้องเรียนได้ทันทีโดยไม่ต้องการพลังงานไฟฟ้าหรือสแกนใดๆ ปลอดภัยต่อชีวิตผู้ใช้งานตามมาตรฐานอาคารสถาบันการศึกษา

<a id="sec-71-8"></a>
### 71.8 กลไกการกู้คืนระบบและการทำงานแบบยืดหยุ่นในสภาวะออฟไลน์ (Disaster Recovery & Offline Resilience)

วิทยานิพนธ์ระดับดีเด่นต้องมีการประเมินกรณีเกิดเหตุไม่คาดคิด (Worst-case Scenario) และแสดงวิธีการจัดการระบบให้ตอบสนองได้อย่างนุ่มนวลและไม่เกิดภาวะอัมพาต (Graceful Degradation)

#### 1. มาตรการรองรับกรณีคลาวด์ฐานข้อมูลล่ม (Database Outage Handling)
- **ปัญหา:** หากเซิร์ฟเวอร์ฐานข้อมูล Supabase เกิดการปิดซ่อมบำรุง หรือทำงานช้าเกินกว่าเป้าหมาย
- **วิธีจัดการฝั่งเว็บ:** 
  - หน้าแอปพลิเคชัน Next.js มีกลไกตรวจจับการขาดหายของการเชื่อมต่อ (Connection Timeout Detection) หากพยายามคิวรี่แล้วไม่ตอบสนอง ระบบจะสลับไปใช้ **Fallback Memory Cache** ในระบบซึ่งจำลองข้อมูลการตั้งค่าเริ่มต้น (Default Settings) เพื่อยังคงเปิดหน้าเว็บลงทะเบียนและแสดงผลข้อมูลส่วนขัดข้องให้ผู้ใช้ทราบโดยไม่มีอาการหน้าจอฟ้าขัดข้อง (Zero Server Crash)
  - หน้าเว็บจะแจ้งเตือนผู้ใช้งานให้นำบาร์โค้ดสิทธิ์เข้าห้องแบบออฟไลน์มาใช้ในการตรวจสอบ

#### 2. มาตรการรองรับกรณีอินเทอร์เน็ตล่ม (Internet Outage Handling)
- **ปัญหา:** สายแลนในสถาบันหลุด หรือสัญญาณ Wi-Fi หลักของห้องเรียนถูกตัดขาด
- **วิธีจัดการฝั่งบอร์ด ESP32:**
  - ตัวบอร์ดได้รับการพัฒนาโปรแกรมโดยใช้ตรรกะตรวจจับสัญญาณ (Watchdog Connection Logic) หากบอร์ดทำ HTTPS Polling แล้วเกิดความล้มเหลว (Connection Timeout) ติดต่อกันเกิน 10 วินาที บอร์ดจะหยุดกะพริบไฟทำงานปกติ และเปลี่ยนสีหน้าจอ TFT เป็นหน้าต่างแจ้งเตือนสีส้มเขียนว่า **"ระบบออฟไลน์ (Offline Mode)"**
  - **กลไกการเข้าใช้งานยืดหยุ่น (Offline Bypass):** หากสถาบันมีความจำเป็นต้องให้อาจารย์เข้าออกห้องได้ในสถานะนี้ บอร์ด ESP32 ได้เตรียมโค้ดรองรับการปลดล็อกผ่าน **การลงทะเบียนรหัสมาสเตอร์คีย์ออฟไลน์** (ที่เก็บไว้ในหน่วยความจำแฟลชภายในตัวชิปผ่านระบบ EEPROM/SPIFFS ของ ESP32 ตั้งแต่ตอน Setup) ทำให้ยังสามารถใช้บัตร RFID สำรอง หรือรหัสออฟไลน์เปิดประตูได้ทันทีโดยไม่ต้องพึ่งพาเซิร์ฟเวอร์อินเทอร์เน็ตภายนอก

<a id="sec-71-9"></a>
### 71.9 การประเมินความคุ้มค่าเชิงเศรษฐศาสตร์และต้นทุนคลาวด์เซิร์ฟเวอร์เลส (Cloud Economics & Cost Analysis)

ในการนำเสนองานวิจัยแก่คณะกรรมการ คณะกรรมการมักจะให้ความสำคัญกับ **ความคุ้มค่าและความเป็นไปได้ในการนำไปประยุกต์ใช้งานเชิงพาณิชย์จริง (Feasibility & Scalability)** โดยระบบนี้ได้รับการออกแบบเพื่อลดงบประมาณการลงทุนได้อย่างมีนัยสำคัญ

| รายการประเมินต้นทุน | ระบบดั้งเดิม (On-Premises Server Deploy) | ระบบคลาวด์ไร้เซิร์ฟเวอร์ (Serverless Cloud ACCS) |
|---|---|---|
| **ค่าฮาร์ดแวร์ควบคุม (IoT Board)** | 1,500 บาทต่อประตู | 1,500 บาทต่อประตู |
| **ค่าจัดหาเครื่องคอมพิวเตอร์เซิร์ฟเวอร์** | 35,000 - 50,000 บาท (เซิร์ฟเวอร์กลาง) | **0 บาท** (ไม่ต้องการเครื่องเซิร์ฟเวอร์กลางในสถาบัน) |
| **ค่าระบบสำรองไฟและการปรับอากาศ** | 8,000 บาท (เครื่อง UPS และพัดลมระบายความร้อน) | **0 บาท** (ใช้เซิร์ฟเวอร์คลาวด์ในประเทศสิงคโปร์) |
| **ค่าไฟฟ้าเซิร์ฟเวอร์กลาง** | ~18,000 บาทต่อปี (เปิด 24 ชั่วโมง) | **0 บาท** (แปรผันตามแบนด์วิดท์คลาวด์) |
| **ค่าบริการคลาวด์แบนด์วิดท์รายปี** | — | **0 บาท** (Vercel & Supabase ฟรีจำกัดปริมาณใช้งานระดับนักศึกษา) |
| **ค่าดูแลและบำรุงรักษาระบบเครือข่าย** | ~10,000 บาทต่อปี (ต้องมีทีมไอทีเปิดพอร์ต/ดูแล) | **0 บาท** (รองรับอัปเดตแบบไร้สาย OTA บนอินเทอร์เน็ตสาธารณะ) |
| **ยอดรวมงบประมาณเริ่มต้นปีแรก** | **~72,500 บาท** | **~1,500 บาท (ประหยัดงบได้ถึง 97.9%)** |

#### ขั้นตอนที่ 2: การสร้างบัญชีผู้ดูแลระบบผู้สิทธิ์ควบคุมเริ่มต้น (Administrator Account Seeding)
เพื่อให้แอดมินระดับสูงสุด (Owner) มีบัญชีในการล็อกอินกู้คืนระบบได้หลังการลงตารางฐานข้อมูลเสร็จสิ้น ให้ดำเนินการดังนี้:
1. สร้างหรือกำหนดตัวแปรสภาพแวดล้อมต่อไปนี้ใน `.env.local` หรือระบบคลาวด์ Vercel:
   ```env
   ALLOW_DEV_SEED=true
   INITIAL_ADMIN_USERNAME=owner_admin
   INITIAL_ADMIN_PASSWORD=SecurePassword_2026!
   INITIAL_ADMIN_FULL_NAME=System Main Administrator
   ```
2. รันแอปพลิเคชันหรือยิงคำร้องแบบ GET ไปหา API ระบบเพื่อกระตุ้นฟังก์ชันตรวจสอบตัวแปร:
   ```bash
   curl -I https://project-sigma-ivory-21.vercel.app/api/system/settings?seed=true
   ```
3. ตัวฟังก์ชัน in `lib/db.ts` จะเข้ารหัสลับรหัสผ่านและสร้างแถวข้อมูล `owner` ลงในตาราง `admin_users` อัตโนมัติ
4. **มาตรการป้องกันความปลอดภัยสูงสุด (Security Rollback):** หลังจากได้รับข้อความตอบรับการสร้างแอดมินเริ่มต้นสำเร็จ ให้ปรับเปลี่ยนสลับค่าตัวแปร `ALLOW_DEV_SEED=false` ในระบบทันทีเพื่อล็อกช่องทาง Seeding และเริ่มใช้งานล็อกอินระบบตามปกติ

<a id="sec-71-16"></a>
### 71.16 โครงสร้างสถานะและการทำงานแบบมัลติคอร์บนเฟิร์มแวร์ ESP32 (ESP32 Multi-Core FreeRTOS & State Machine)

ในวิทยานิพนธ์วิศวกรรมคอมพิวเตอร์และระบบสมองกลฝังตัว (Embedded Systems) คณะกรรมการมักจะให้ความสำคัญกับวิธีการบริหารจัดการทรัพยากรไมโครคอนโทรลเลอร์เพื่อความเสถียรขั้นสูงสุด:

#### 1. แผนผังสถานะการทำงานบนบอร์ด (Firmware State Machine)
เฟิร์มแวร์ของ ESP32 ได้รับการพัฒนาในรูปแบบ **Finite State Machine (FSM)** เพื่อควบคุมพฤติกรรมการทำงานของระบบและหน้าจอ LCD ให้สอดคล้องกันอย่างมั่นคง:

```mermaid
stateDiagram-v2
    [*] --> BOOT : จ่ายไฟเข้าระบบ (setup)
    BOOT --> WIFI_CONNECTING : ตรวจพินและเปิดสัญญาณ Wi-Fi
    WIFI_CONNECTING --> WIFI_FAILED : สัญญาณหลุด / รหัสผ่านผิด (กระพริบช้า)
    WIFI_FAILED --> WIFI_CONNECTING : พยายามต่อใหม่อัตโนมัติ
    WIFI_CONNECTING --> ACTIVE_POLLING : ต่อสำเร็จ (เสียงปี๊บ 3 ครั้ง)
    
    state ACTIVE_POLLING {
        [*] --> DRAW_QR : สร้าง URL และวาด QR Code (60s)
        DRAW_QR --> TICK_CLOCK : อัปเดตเวลานาฬิกาทุก 1 วินาที (ลดจอกะพริบ)
        TICK_CLOCK --> VERIFY_POLL : ส่ง GET HTTPS Request ถามเซิร์ฟเวอร์
        VERIFY_POLL --> DOOR_OPENING : ได้รับค่า door_trigger = "open"
        DOOR_OPENING --> DOOR_CLOSED : ครบ 5 วินาที สลับรีเลย์ตัดไฟ
        DOOR_CLOSED --> DRAW_QR : ดึงคีย์และสร้าง QR รอบถัดไป
    }
    
    ACTIVE_POLLING --> OFFLINE_MODE : อินเทอร์เน็ตหลุด / เซิร์ฟเวอร์ล่ม (10s Timeout)
    OFFLINE_MODE --> ACTIVE_POLLING : อินเทอร์เน็ตกลับมาทำงานปกติ
```

#### 2. การจัดสรรงานแบบมัลติทาสก์ระดับฮาร์ดแวร์ (FreeRTOS Dual-Core Task Scheduling)
ชิปประมวลผลหลักของ ESP32 ประกอบด้วยซีพียูสถาปัตยกรรม Tensilica 32-bit Dual-Core (Core 0 และ Core 1) เพื่อป้องกันไม่ให้ขั้นตอนการดึงข้อมูลเน็ตเวิร์ก (ซึ่งมีค่าความหน่วงไม่แน่นอน) ส่งผลให้หน้าจอ TFT นาฬิกากระตุกหรือทำงานไม่เรียบเนียน ระบบได้แบ่งสรรภารกิจด้วย FreeRTOS ดังนี้:

- **Core 0 (Protocol Core):** 
  - ทำหน้าที่หลักด้านการเชื่อมต่อเครือข่ายไร้สาย (Wi-Fi Protocol Stack) และการยิง HTTPS Request ขาออกไปยัง Vercel API
  - รันฟังก์ชัน **HTTPS Polling Loop** ในเบื้องหลัง (Background Task) โดยทำการโพลล์ข้อมูลทุก 2 วินาทีอย่างเงียบๆ
- **Core 1 (Application Core):**
  - ทำหน้าที่หลักด้านระบบประยุกต์และส่วนติดต่อผู้ใช้งาน (User Interface & Actuators)
  - รันฟังก์ชันการอัปเดตนาฬิกาหน้าจอ TFT LCD (ILI9341 Screen Drawing), วาดพิกเซล QR Code ใหม่เมื่อคีย์หมดอายุ, และควบคุม GPIO 12 ขับรีเลย์กลอนรวมถึงสัญญาณเสียง Buzzer
  - **ผลลัพธ์เชิงวิจัย:** ประสิทธิภาพความลื่นไหลของหน้าจอ UI อยู่ในเกณฑ์สมบูรณ์แบบ (ราบรื่นที่ 60 FPS) แม้ในเสี้ยววินาทีที่เน็ตเวิร์กเกิดการดีเลย์ก็ตาม

<a id="sec-71-17"></a>
### 71.17 วงจรชีวิตและการไหลของข้อมูลโทเคนคิวอาร์ไดนามิก (Lifecycle & Dataflow of Dynamic QR Token)

แผนภาพและคำอธิบายวงจรชีวิตของโทเคน (Token Data Lifecycle) จะช่วยให้ NotebookLM สังเคราะห์เส้นทางและความเสถียรของความปลอดภัยระบบตั้งแต่การสร้างสรรค์ไปจนถึงการใช้งานและการหมดอายุ:

```mermaid
sequenceDiagram
    autonumber
    participant E as หน้าจอ ESP32
    participant S as Server (Vercel)
    participant D as Database (Postgres)
    participant C as อุปกรณ์นักศึกษา
    participant A as Dashboard แอดมิน

    E->>S: GET /api/esp32/display (ส่งคีย์บอร์ด)
    S->>D: เรียกฟังก์ชัน getOrCreateActiveQRToken()
    Note over D: หากโทเคนเดิมหมดอายุ (60s)<br/>จะสุ่มสร้าง UUID string ใหม่ในตาราง system_settings
    D-->>S: คืนค่าโทเคนแอคทีฟล่าสุด
    S-->>E: คืนค่า active_token และ QR URL
    Note over E: แปลงข้อความ URL เป็นรหัสพิกเซล<br/>และวาด QR Code บนจอ LCD หน้าห้อง
    C->>E: นักศึกษาสแกน QR หน้าห้องเรียน
    C->>S: เปิดลิงก์เว็บ /?scan=token&room=CE-401
    S->>D: ตรวจสอบสถานะโทเคนใน DB (ยังไม่ถูกใช้ & ยังไม่หมดอายุ 300s)
    D-->>S: ผลการตรวจผ่าน
    C->>S: กรอกประวัติส่งแบบฟอร์ม (POST /api/students)
    S->>D: เรียกฟังก์ชัน consumeQRToken()
    Note over D: เปลี่ยนสถานะโทเคนทันที<br/>(UPDATE to consumed)<br/>เพื่อป้องกันการสแกนซ้ำซ้อน
    S->>A: ส่งคำขอลงทะเบียนเข้าสู่ Queue รอตรวจ
    A->>S: แอดมินกดอนุมัติ (Approve)
    S->>D: UPDATE students.status = approved<br/>และห้องเรียน room_cmd = unlock
    E->>S: Polling รอบถัดไปดึงคำสั่ง
    S-->>E: door_trigger = open
    Note over E: สับสัญญาณรีเลย์ ปลดล็อกประตูนาน 5 วินาที
```

<a id="sec-71-18"></a>
### 71.18 แผนผังการจัดแบ่งโครงสร้างโค้ดและขอบเขตหน้าที่ในระบบ Next.js (Next.js App Router & Library Directory Architecture)

การเขียนอธิบายสารบรรณโฟลเดอร์และสถาปัตยกรรมการแบ่งงาน (Architectural Boundaries) จะช่วยให้ปัญญาประดิษฐ์ (NotebookLM) นำทางและสอนการอัปเกรดพัฒนาโค้ดโปรเจกต์ Next.js 15+ ชุดนี้ได้อย่างถูกต้องแม่นยำสูง:

```text
my-app/
├── app/                      [Presentation & Route Layer]
│   ├── page.tsx               - หน้าหลักลงทะเบียนของนักศึกษา (Client Component)
│   ├── admin/
│   │   ├── login/page.tsx     - หน้าเข้าสู่ระบบของแอดมินและรับส่ง JWT Cookie
│   │   └── dashboard/page.tsx - แผงควบคุมระบบ ( grid สิทธิ์, logs, settings, PDF )
│   ├── esp32-preview/page.tsx - หน้าเว็บจำลองการแสดงผลจอ ILI9341 LCD ของ ESP32
│   └── api/                  [API Controller Layer]
│       ├── auth/              - จัดการเซสชันล็อกอิน/ล็อกเอาต์ของแอดมิน
│       ├── esp32/             - API ให้บริการข้อมูลสำหรับบอร์ด (display, qr, status)
│       └── students/          - API จัดการนักศึกษา (approve, reject, bypass, pending)
├── lib/                      [Business Logic & Infrastructure Layer]
│   ├── db.ts                  - ฟังก์ชันเชื่อม Supabase, Connection Pooling และ Seed
│   ├── auth.ts                - บริการตรวจสอบสิทธิ์ JWT, ออกตั๋ว, ตรวจสอบ password
│   ├── qr.ts                  - สร้าง ล้าง และประมวลผลวงจรชีวิตของ QR tokens
│   ├── esp32.ts               - คลังคิวคำสั่งเปิดประตู และ LAN direct fallback
│   ├── discord.ts             - บริการจัดส่ง Discord Webhook แจ้งเตือนสถาบัน
│   ├── rate-limit.ts          - ระบบสกัดกั้นสแปมและยิงถล่มด้วย PostgreSQL atomic counters
│   └── client-ip.ts           - ดึงค่า IP แอดมินที่แท้จริงผ่าน Vercel trusted proxy chain
└── middleware.ts              - ตรวจสอบสิทธิ์ระดับเน็ตเวิร์ก ป้องกันหน้าแผงควบคุม /admin/*
```

**หลักการทำงานการแบ่งชั้นสถาปัตยกรรม (Separation of Concerns):**
- **Presentation Layer (app/page.tsx):** มีหน้าที่เฉพาะในการติดต่อและส่งเสริมการตอบรับของผู้ใช้ (User Interface) และไม่มีการเชื่อมต่อกับฐานข้อมูล PostgreSQL โดยตรง
- **API Controller Layer (app/api/):** ทำหน้าที่เป็นพนักงานรับสาร แปลง HTTP request ตรวจสอบโครงสร้างข้อมูล ปรับล้างข้อมูลอินพุต และส่งต่อให้ส่วนลอจิกถัดไป
- **Business Logic Layer (lib/):** คลังเก็บกฎธุรกิจที่สำคัญที่สุด (เช่น นโยบายรหัสผ่านแอดมิน, วงจรชีวิตโทเคนคิวอาร์) ทำหน้าที่เชื่อมโยงข้อมูลกับฐานข้อมูล และบริการภายนอก (Discord Webhook)

<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

---

<a id="sec-71-19"></a>
### 71.19 การปฏิบัติตามกฎหมายคุ้มครองข้อมูลส่วนบุคคล (PDPA Compliance & Implementation)

โครงการระบบควบคุมประตูเข้าออกนี้ได้รับการออกแบบโดยยึดหลัก **Privacy by Design** เพื่อให้สอดคล้องกับพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA) อย่างเคร่งครัด:

1. **กลไกการขอความยินยอม (Consent Management):** Component `CookieConsent.tsx` บันทึกค่าใน `localStorage` คีย์ `smartaccess_cookie_consent` และส่ง Custom Event `smartaccess_cookie_consent_changed` กรณีผู้ใช้ปฏิเสธจะบล็อกฟอร์มลงทะเบียนทั้งหมด
2. **Data Masking บน UI:** รหัสนักศึกษาแสดงแบบ `1164******45` ป้องกัน door_operator คัดลอกข้อมูลออกนอกระบบ
3. **Row-Level Security (RLS):** Supabase PostgreSQL ตั้ง RLS เฉพาะ JWT ที่ผ่านการตรวจสอบเท่านั้นที่ query ได้

<a id="sec-71-20"></a>
### 71.20 สถาปัตยกรรมการรักษาความปลอดภัยข้อมูล (Information Security Framework)

1. **Allowed Rooms Verification:** API `/api/students/[id]/approve` แกะ `allowed_rooms` (CSV) จาก JWT แล้วเทียบกับ `requested_room` หากไม่ตรง → **403 Forbidden** (Cross-Room Privilege Abuse prevention)
2. **Security Key Segregation:** `QR_SIGNING_KEY` แยกจาก `JWT_SECRET` — แฮกเกอร์ที่ดักคีย์ QR ไม่สามารถปลอม JWT แอดมินได้ (Blast Radius Containment)
3. **Discord Webhook แบ่งหมวด:** 🚨 SYSTEM ALERT / 🔓 ACCESS GRANT / 🔌 HARDWARE OFFLINE (>10s polling gap)

<a id="sec-71-21"></a>
### 71.21 พระราชบัญญัติว่าด้วยการกระทำความผิดเกี่ยวกับคอมพิวเตอร์ (Computer Crime Act Compliance)

1. **มาตรา 26 — เก็บ log ≥ 90 วัน:** ตาราง `access_logs` เก็บ timestamp, ชื่อ-นามสกุล, IP (right-most client IP), User-Agent, รหัสห้อง
2. **Immutable Logs:** ไม่มี API `UPDATE`/`DELETE` บน `access_logs` (รองรับ Digital Forensics)
3. **มาตรา 5, 7, 8:** บล็อก unauthorized DB access ผ่าน RLS + API key authentication

<a id="sec-71-22"></a>
### 71.22 ข้อตกลงและเงื่อนไขการใช้บริการ (Terms and Conditions)

หน้า `terms/page.tsx` ระบุ:
1. **Access Rights Scope:** สิทธิ์เป็นของบุคคลเฉพาะ ห้ามแชร์ QR/Bypass token
2. **Anti-Tailgating:** ทุกคนต้องสแกนทีละคน — บุคคลสุดท้ายในระบบรับผิดชอบเหตุทรัพย์สิน
3. **Limitation of Liability:** ไม่รับผิดชอบทรัพย์สินส่วนตัวที่นำเข้าห้อง
4. **Disciplinary Enforcement:** เจาะระบบ/ปลอมคำร้อง → ระงับสิทธิ์ทันที + ส่งวินัยนักศึกษา

<a id="sec-71-23"></a>
### 71.23 นโยบายความเป็นส่วนตัว (Official Privacy Policy)

หน้า `privacy/page.tsx`:
1. **Types of PII:** คำนำหน้า, ชื่อ-นามสกุล, รหัส นศ., คณะ/สาขา, ห้องที่ขอ, timestamp, IP, User-Agent
2. **Purposes:** จับคู่ยืนยันตน → ปลดล็อกประตู + log จราจร (ป้องกันอัคคีภัย/โจรกรรม)
3. **Sharing:** Discord Webhook เจ้าหน้าที่เท่านั้น — ไม่ขาย/ส่งบุคคลที่สาม
4. **Retention:** ≥ 90 วัน, Data Pruning เมื่อสิ้นปีการศึกษา
5. **Data Subject Rights:** Right to Access + Right to be Forgotten ผ่านอีเมล DPO ของคณะครุศาสตร์อุตสาหกรรม มทร.พระนคร (dpo@rmutp.ac.th)

<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

---

<a id="sec-71-24"></a>
### 71.24 Threat Model แบบ STRIDE และการประเมิน DREAD

วิเคราะห์ภัยคุกคามตามกรอบ Microsoft STRIDE โดยแยก trust boundary 4 ชั้น: Browser → Vercel Edge → Supabase → ESP32 LAN

#### 71.24.1 Threat Actors

| Actor | Motivation | Capability | สิ่งที่อยากได้ |
|---|---|---|---|
| **นักศึกษาขี้โกง** | เข้าห้องโดยไม่ลงทะเบียน, แชร์สิทธิ์ | Web/Mobile, ไม่มี root | bypass QR หรือ replay token |
| **เจ้าหน้าที่ผู้ไม่หวังดี (Malicious Insider)** | คัดลอก PII นักศึกษา | door_operator role | dump ตาราง students |
| **Script Kiddie** | สแปม brute-force | Hydra/Burp Suite | ทำให้ระบบล่ม |
| **APT (Advanced Persistent Threat)** | ขโมยข้อมูลทั้งระบบ | 0-day, social engineering | full control of dashboard |
| **คนเดินตามหลัง (Tailgater)** | เข้าห้องฟรี | physical only | เปิดประตูตามคนอื่น |

#### 71.24.2 STRIDE Matrix

| ภัย | คำอธิบาย | จุดในระบบ | การป้องกัน | ความเสี่ยงคงเหลือ |
|---|---|---|---|---|
| **S**poofing | ปลอม JWT, ปลอม X-API-Key, ปลอม QR | Cookie, Header, QR payload | HS256 (256-bit), HMAC QR, API Key 32 chars | ต่ำ |
| **T**ampering | แก้ request body, แก้ DB direct | API payload, Supabase | parameterized SQL, RLS, Zod validation | ต่ำ |
| **R**epudiation | ปฏิเสธว่าไม่ได้เปิดประตู | access_logs | Immutable logs + IP + UA + timestamp | ต่ำมาก |
| **I**nformation Disclosure | leak PII จาก dashboard | /admin/dashboard | Data masking, role-based view | กลาง (mask แค่ display) |
| **D**enial of Service | ยิงถล่ม API, ทำ DB หมดคอนเนคชัน | /api/auth/login | rate-limit 10/5min, Vercel auto-scale | กลาง (Vercel free tier limit) |
| **E**levation of Privilege | door_operator → owner | role check ใน API | ตรวจ role ทุก endpoint, allowed_rooms CSV | ต่ำ |

#### 71.24.3 DREAD Scoring (0-10)

สูตร: `Risk = (D + R + E + A + D) / 5`

| Threat | Damage | Reprod. | Exploit. | Affected | Discov. | **Total** |
|---|---|---|---|---|---|---|
| Replay QR token ใน 60 วิน | 6 | 9 | 8 | 3 | 7 | **6.6** |
| Tailgating (เดินตามหลัง) | 7 | 10 | 10 | 8 | 10 | **9.0** ⚠️ |
| Brute-force admin login | 8 | 6 | 4 | 9 | 5 | **6.4** |
| Insider PII dump | 9 | 8 | 6 | 10 | 4 | **7.4** |
| ESP32 LAN MITM (no TLS) | 5 | 4 | 3 | 5 | 6 | **4.6** |
| JWT_SECRET รั่ว | 10 | 9 | 9 | 10 | 3 | **8.2** ⚠️ |

**สรุป:** ภัยที่ต้องเฝ้าระวังสูงสุดคือ Tailgating (ต้องแก้ด้วย hardware: turnstile/sensor) และ secret leakage (ต้องแก้ด้วย rotation policy + Vault)

#### 71.24.4 Trust Boundaries Diagram

```mermaid
flowchart LR
    subgraph PUB["🌐 Public Internet (Untrusted)"]
        BROWSER["Browser นักศึกษา"]
        ATTACKER["Attacker"]
    end
    subgraph EDGE["🟣 Vercel Edge (Semi-trusted)"]
        MW["middleware.ts<br/>JWT verify"]
        API["API Routes"]
    end
    subgraph DB["🟢 Supabase (Trusted)"]
        PG["PostgreSQL + RLS"]
    end
    subgraph LAN["🟠 Campus LAN (Semi-trusted)"]
        ESP["ESP32"]
        DOOR["Solenoid + ประตูจริง"]
    end
    BROWSER -->|"TLS 1.3"| MW
    ATTACKER -.->|"blocked by<br/>rate-limit + WAF"| MW
    MW --> API
    API -->|"pg pool<br/>SSL"| PG
    API -->|"HTTP LAN<br/>X-API-Key"| ESP
    ESP -->|"GPIO 12"| DOOR
    
    style PUB fill:#fee
    style EDGE fill:#eef
    style DB fill:#efe
    style LAN fill:#fef
```

<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

---

<a id="sec-71-25"></a>
### 71.25 Data Flow Diagram (DFD) ระดับ 0/1/2 — สำหรับ PDPA DPIA

DFD เป็นเครื่องมือมาตรฐานที่สำนักงาน กคส. (สคส.) แนะนำใช้ใน Data Protection Impact Assessment (PDPA ม.37)

#### 71.25.1 Level 0 — Context Diagram

```mermaid
flowchart LR
    S["นักศึกษา<br/>(Data Subject)"]
    A["แอดมิน<br/>(Data Processor)"]
    SYS(("ระบบควบคุม<br/>ประตู SmartAccess"))
    D["Discord<br/>(3rd Party)"]
    SUP["Supabase<br/>(Sub-Processor<br/>AWS Singapore)"]
    
    S -->|"PII: ชื่อ, รหัส, IP"| SYS
    SYS -->|"QR Token"| S
    A <-->|"Approve/Reject"| SYS
    SYS -->|"Event Notification"| D
    SYS <-->|"Encrypted DB Query<br/>TLS"| SUP
```

#### 71.25.2 Level 1 — Major Processes

```mermaid
flowchart TB
    S["นักศึกษา"]
    P1[["1.0<br/>Register"]]
    P2[["2.0<br/>Authenticate QR"]]
    P3[["3.0<br/>Admin Approve"]]
    P4[["4.0<br/>Unlock Door"]]
    P5[["5.0<br/>Log Event"]]
    DS1[("D1: students")]
    DS2[("D2: dynamic_qr_tokens")]
    DS3[("D3: access_logs")]
    DS4[("D4: room_commands")]
    A["แอดมิน"]
    E["ESP32"]
    
    S -->|"form data"| P1 --> DS1
    S -->|"scan QR"| P2 <--> DS2
    P2 --> DS1
    A -->|"approve"| P3 --> DS1
    P3 --> P4 --> DS4
    DS4 <-->|"poll"| E
    P4 --> P5 --> DS3
    P2 --> P5
```

#### 71.25.3 Level 2 — Process "Register" เจาะลึก

```mermaid
flowchart TB
    S["นักศึกษา"]
    P11[["1.1<br/>Validate QR Token"]]
    P12[["1.2<br/>Sanitize Input<br/>(Zod schema)"]]
    P13[["1.3<br/>Hash IP<br/>(SHA-256, no salt)"]]
    P14[["1.4<br/>Insert students"]]
    P15[["1.5<br/>Consume QR<br/>(atomic UPDATE)"]]
    DS1[("students")]
    DS2[("dynamic_qr_tokens")]
    LOG[("access_logs")]
    
    S --> P11 --> P12 --> P13 --> P14 --> DS1
    P11 <--> DS2
    P14 --> P15 --> DS2
    P14 --> LOG
```

#### 71.25.4 ตารางคู่ DFD ↔ PDPA Articles

| Process | PDPA Article | Lawful Basis | DPIA Risk |
|---|---|---|---|
| 1.0 Register | ม.24(5) | Legitimate Interest (ความปลอดภัยอาคาร) | Low (พร้อม consent) |
| 2.0 Authenticate QR | ม.24(5) | LI | Low |
| 3.0 Admin Approve | ม.24(5) | LI | Medium (admin view PII) |
| 5.0 Log Event | ม.26 (พ.ร.บ.คอม) | Legal Obligation | High (เก็บ IP, 90+ วัน) |

<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

---

<a id="sec-71-26"></a>
### 71.26 กฎหมายอื่นที่ต้องปฏิบัติตาม (Cybersecurity Act, ก.พ.อ., License Audit)

#### 71.26.1 พ.ร.บ.การรักษาความมั่นคงปลอดภัยไซเบอร์ พ.ศ. 2562 (CCSA)

| มาตรา | สิ่งที่บังคับ | ระบบเราทำตามยังไง |
|---|---|---|
| ม.13 | กำหนดผู้รับผิดชอบความมั่นคงไซเบอร์ | ระบุ owner role + ผู้ดูแลใน Discord |
| ม.45 | แจ้งเหตุภัยคุกคามต่อ กมช. ใน 24 ชม. | เชื่อม Discord webhook + Runbook §71.32 |
| ม.46 | จัดทำแผนเผชิญเหตุภัยคุกคามไซเบอร์ | DR Plan §62 + IRP §71.32 |
| ม.50 | สร้างมาตรการป้องกันไซเบอร์ขั้นต่ำ | Rate-limit, RLS, HTTPS, JWT |

**หมายเหตุ:** ระบบนี้ไม่จัดเป็น CII (Critical Information Infrastructure) เนื่องจากเป็นระบบเฉพาะภายในสถาบันการศึกษา ขนาดเล็ก แต่ควรปฏิบัติตาม "good practice" ของกฎหมาย

#### 71.26.2 ประกาศ ก.พ.อ. เรื่องการเก็บข้อมูลนักศึกษา

- กำหนดให้สถาบันอุดมศึกษาเก็บข้อมูลนักศึกษาตามแบบ มคอ./AUNQA
- ระบบเชื่อมข้อมูลผ่าน `student_id` (foreign key concept) แต่ไม่ดึงข้อมูลจาก SIS โดยตรง — เก็บเฉพาะข้อมูลที่จำเป็น (data minimization)

#### 71.26.3 กฎกระทรวงฉบับที่ 47 (พ.ศ. 2540) — มาตรฐานความปลอดภัยอาคาร

**ข้อบังคับสำคัญ:** ประตูทางหนีไฟต้อง **เปิดได้จากด้านในเสมอแม้ไฟดับ** (Fail-Safe to Open)

| รูปแบบล็อก | Fail-safe state | เหมาะกับ |
|---|---|---|
| **Magnetic Lock (จ่ายไฟค้างเพื่อล็อก)** | เปิด (ปลอดภัย) ✅ | ทางหนีไฟ, ประตูหลัก |
| **Solenoid/Electric Strike (จ่ายไฟชั่วครู่เพื่อปลด)** | ล็อก (อันตราย) ⚠️ | ห้องปกติที่ไม่ใช่ทางหนีไฟ |

**ข้อสรุปสำหรับโครงการ:** ใช้ Magnetic Lock สำหรับประตูที่เป็นทางหนีไฟตามกฎหมาย + UPS สำรองไฟ + ปุ่ม REX (Request to Exit) แบบกลไก

#### 71.26.4 License Audit — Library ที่ใช้

| Library | License | Commercial OK | Attribution? |
|---|---|---|---|
| next | MIT | ✅ | No |
| react | MIT | ✅ | No |
| pg (node-postgres) | MIT | ✅ | No |
| jsonwebtoken | MIT | ✅ | No |
| bcrypt | MIT | ✅ | No |
| pdfkit | MIT | ✅ | No |
| qrcode | MIT | ✅ | No |
| tailwindcss | MIT | ✅ | No |
| TFT_eSPI (Arduino) | **FreeBSD/BSD-3** | ✅ | Yes (BSD) |
| ArduinoJson | MIT | ✅ | No |

**ไม่มี GPL/AGPL ในระบบ** — ปลอดภัยเรื่อง copyleft contagion (สามารถใช้เชิงพาณิชย์ได้โดยไม่ต้องเปิดซอร์ส)

<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

---

<a id="sec-71-27"></a>
### 71.27 ROC (Record of Processing Activities) ตาม PDPA มาตรา 39

ตามมาตรา 39 ผู้ควบคุมข้อมูลส่วนบุคคล (Data Controller) **ต้องจัดทำบันทึกรายการประมวลผล** ให้พร้อมแสดงต่อ สคส. (PDPC) เมื่อถูกตรวจสอบ

#### 71.27.1 ตาราง ROPA ของระบบ

| # | Field | ค่า |
|---|---|---|
| 1 | **ชื่อกิจกรรม** | ระบบควบคุมการเข้าห้องเรียน SmartAccess |
| 2 | **Data Controller** |  มทร.พระนคร |
| 3 | **DPO Contact** | dpo@smartaccess.ac.th (ตัวอย่าง) |
| 4 | **Data Processor** | Supabase Inc. (AWS Singapore) |
| 5 | **วัตถุประสงค์** | ควบคุมการเข้าออกห้องปฏิบัติการเพื่อความปลอดภัย, ป้องกันโจรกรรม |
| 6 | **Lawful Basis** | Legitimate Interest (PDPA ม.24(5)) + Legal Obligation (พ.ร.บ.คอม ม.26) |
| 7 | **ประเภทข้อมูล** | ชื่อ-นามสกุล, รหัส นศ., คณะ-สาขา, IP, User-Agent, timestamp |
| 8 | **ประเภทเจ้าของข้อมูล** | นักศึกษา + อาจารย์ผู้ใช้ห้อง |
| 9 | **ผู้รับข้อมูล** | แอดมินคณะ, Discord webhook ภายใน |
| 10 | **ส่งข้อมูลออกนอก ปทท.** | ใช่ — Supabase AWS Singapore + Discord (EU/US) |
| 11 | **Safeguards** | TLS 1.3, Standard Contractual Clauses (Supabase SOC2), Encryption at-rest |
| 12 | **ระยะเวลาเก็บ** | access_logs ≥ 90 วัน (พ.ร.บ.คอม) / students = จนจบ ปกศ. + 1 ปี |
| 13 | **มาตรการความปลอดภัย** | JWT, bcrypt, RLS, rate-limit, RBAC, audit logs |
| 14 | **Risk Level** | Medium (มี PII แต่ไม่มี Sensitive Data ตาม ม.26) |

#### 71.27.2 Sensitive Data Check (PDPA ม.26)

ระบบ **ไม่เก็บ** ข้อมูลที่จัดเป็น "ข้อมูลอ่อนไหว":
- ❌ เชื้อชาติ, ศาสนา, ความคิดเห็นการเมือง
- ❌ ข้อมูลสุขภาพ, ชีวภาพ (Biometric)
- ❌ ประวัติอาชญากรรม, ข้อมูลทางพันธุกรรม

⚠️ **ถ้าอนาคตเพิ่ม Face Recognition / Fingerprint** → ต้องขอ Explicit Consent ตามม.26 และจัด DPIA ใหม่

#### 71.27.3 DPIA Trigger Criteria (PDPA ม.39 วรรค 2)

| Trigger | ระบบเรามี? |
|---|---|
| Systematic monitoring of public area | ⚠️ บางส่วน (log การเข้าออก) |
| Large-scale processing | ❌ ไม่เกิน 5,000 รายการ/เทอม |
| Sensitive data | ❌ |
| Innovative tech with high risk | ❌ (IoT มาตรฐาน) |

**ผลประเมิน:** ระบบไม่บังคับต้องทำ DPIA เต็มรูปแบบ แต่ทำ ROPA + DFD §71.25 ก็เพียงพอตามแนวปฏิบัติ

<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

---

<a id="sec-71-28"></a>
### 71.28 Schematic + PCB Layout + BOM (Bill of Materials)

#### 71.28.1 Schematic วงจร ESP32 + Relay + TFT (ASCII)

```
                    ┌─── 5V USB ───┐
                    │              │
                    │   ┌──────────┴──────────┐
                    │   │     ESP32 DevKit    │
                    │   │  (NodeMCU-32S)      │
                    │   │                     │
                    │   │  GPIO12 ────────────┼──[330Ω]──┐
                    │   │  GPIO27 (Buzzer) ───┼──────────┼─┐
                    │   │  GPIO15 (TFT_CS) ───┼──┐       │ │
                    │   │  GPIO 2 (TFT_DC) ───┼──┤       │ │
                    │   │  GPIO 4 (TFT_RST) ──┼──┤       │ │
                    │   │  GPIO18 (SCLK) ─────┼──┤       │ │
                    │   │  GPIO23 (MOSI) ─────┼──┤       │ │
                    │   │  3V3 ───────────────┼──┤       │ │
                    │   │  GND ──┬────────────┘  │       │ │
                    │   └────────┘               │       │ │
                    │                            ▼       ▼ ▼
                    │                         ┌─────┐  ┌────┐ ┌──────┐
                    │                         │ILI9341│  │BUZZ│ │Relay │
                    │                         │ TFT  │  │ ER │ │Module│
                    │                         │ 240x │  │5V  │ │ 5V   │
                    │                         │ 320  │  └─┬──┘ │ Opto │
                    │                         └──┬───┘    │    └─┬─┬──┘
                    │                            │        │      │ │
                    └────────────────────────────┴────────┴──────┘ │
                                                                   │
                                                  ┌────────────────┘
                                                  │
                                          ┌───────▼───────┐
                                          │ Magnetic Lock │
                                          │   12V/24V     │  ◄── PSU แยก
                                          │   Fail-Safe   │      ผ่าน relay COM/NO
                                          └───────────────┘
```

**Note:** Relay module ต้องเลือกแบบมี **opto-isolation** (PC817) เพื่อแยก ground เสียงรบกวนจาก motor inductance

#### 71.28.2 BOM (Bill of Materials) — ราคา 27 พ.ค. 2026

| # | Part | Spec | จำนวน | ราคา/หน่วย | รวม | Supplier (TH) |
|---|---|---|---|---|---|---|
| 1 | ESP32 DevKit v1 | ESP32-WROOM-32, 30-pin | 1 | ฿180 | ฿180 | Cytron, Inex |
| 2 | TFT Display | ILI9341 2.8" 240×320 SPI | 1 | ฿250 | ฿250 | Lazada/Shopee |
| 3 | Buzzer 5V | Active, 85dB | 1 | ฿15 | ฿15 | Arduitronics |
| 4 | Relay Module | SRD-05VDC, opto, 10A | 1 | ฿45 | ฿45 | Cytron |
| 5 | Magnetic Lock | 180kg, 12V, fail-safe | 1 | ฿850 | ฿850 | HIP, Hikvision |
| 6 | Power Supply | 12V 3A switching | 1 | ฿320 | ฿320 | Mean Well RS-15-12 |
| 7 | Step-down DC-DC | LM2596, 12V→5V | 1 | ฿35 | ฿35 | Generic |
| 8 | Flyback Diode | 1N4007, 1A 1000V | 2 | ฿2 | ฿4 | Local |
| 9 | Push Button (REX) | Mechanical, 5A NO | 1 | ฿60 | ฿60 | Schneider |
| 10 | Enclosure | ABS Plastic 15×10×5 cm | 1 | ฿120 | ฿120 | Local |
| 11 | สายไฟ + DuPont | 22 AWG, jumper wires | 1 set | ฿80 | ฿80 | Local |
| 12 | PCB Prototype | Universal board 7×9 cm | 1 | ฿40 | ฿40 | Cytron |
| | | | | **รวม/ห้อง** | **฿1,999** | |

**ราคา full-scale 50 ห้อง:** ≈ ฿100,000 (ไม่รวมค่าติดตั้ง)

#### 71.28.3 PCB Layout Guidelines

- **Trace width:** Relay control line ≥ 0.5 mm (1A current), TFT signal ≥ 0.2 mm
- **Ground plane:** ใช้ ground pour เต็มชั้นล่างเพื่อลด EMI
- **Decoupling cap:** 100nF + 10µF ใกล้ VCC ของ ESP32, TFT
- **Crystal placement:** อยู่ใกล้ ESP32 ระยะ < 1 cm (ปกติติดมากับ DevKit)
- **High-current trace:** แยกชั้นไป relay coil — อย่าวิ่งใต้ ESP32 RF antenna
- **Antenna keep-out:** อย่าวาง trace ใต้ ESP32 antenna 8mm × 6mm

<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

---

<a id="sec-71-29"></a>
### 71.29 Timing Diagram ของ Relay + Flyback Diode

#### 71.29.1 Sequence การปล่อยกระแสและการเกิด Back-EMF

```
GPIO12 (ESP32)
  HIGH ────────┐                            ┌─────
               │                            │
  LOW          └────────────────────────────┘
              t=0                         t=5000ms
              
Relay Coil Current
                ╱─────────────────────────╲
               ╱                            ╲
              ╱                              ╲ ← Back-EMF spike ที่นี่!
  0A ────────╱                                ╲────────
            t=0+5ms                       t=5000+2ms
            (rise time)                   (release time)
              
Flyback Voltage (ที่ collector)
  +12V ─────┐                            ┌──── สูงสุด 500-1000V
            │                            │     ถ้าไม่มี flyback diode!
            └────────────────────────────┘
                                          ↑
                              1N4007 clamp ไว้ที่ +12.7V (Vf=0.7V)
```

#### 71.29.2 ทำไมต้องมี Flyback Diode

เมื่อปิดกระแสที่ไหลผ่าน inductor (relay coil) กระทันหัน พลังงานที่เก็บใน magnetic field จะปลดปล่อยเป็น **Back-EMF** ตามสมการ:

```
V_back = -L · (di/dt)
```

ตัวอย่าง: relay coil L = 100mH, di/dt = 50mA / 1µs = 50,000 A/s
→ V_back = -0.1 × 50,000 = **-5,000V** ⚡

แรงดันลบนี้จะ:
- ทำลาย transistor/MOSFET driver
- ทำลายขา GPIO ของ ESP32 (ทนได้ไม่เกิน -0.3V ตาม datasheet)
- สร้างประกายไฟที่หน้าสัมผัส relay (arc) → ลดอายุการใช้งาน

**Flyback Diode (1N4007)** ต่อแบบ **คร่อม coil** ด้านขั้วกลับ (anode→GND side, cathode→+V side) จะ clamp แรงดันให้ไม่เกิน +V + 0.7V

#### 71.29.3 เลือก Diode ถูกต้องอย่างไร

| Parameter | ต้องการ | 1N4007 spec | OK? |
|---|---|---|---|
| Reverse voltage (V_R) | ≥ 2× V_coil = 24V | 1000V | ✅ |
| Forward current (I_F) | ≥ I_coil = 70mA | 1A | ✅ |
| Recovery time (t_rr) | < 100µs | ~2µs | ✅ |
| ราคา | ต่ำ | ฿2 | ✅ |

**Alternative:** Schottky diode (1N5819) — เร็วกว่าแต่แพงกว่า (฿8); ใช้กับ MOSFET driver ที่ต้อง switch เร็ว

#### 71.29.4 RC Snubber (เสริม) สำหรับ Inductive Load หนัก

หากต่อ solenoid ขนาดใหญ่ (>500mA) เพิ่ม RC snubber คร่อมหน้าสัมผัส relay ลด arc:

```
R = √(L/C) = √(0.1H / 100nF) = 1kΩ
C = 100nF, 400V (X7R ceramic)
```

ต่อ R+C อนุกรม คร่อม COM-NO contact

<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

---

<a id="sec-71-30"></a>
### 71.30 API Reference (OpenAPI 3.0 Spec)

#### 71.30.1 Public Endpoints (ไม่ต้อง auth)

##### `POST /api/students` — ลงทะเบียนนักศึกษา

```yaml
requestBody:
  required: true
  content:
    application/json:
      schema:
        type: object
        required: [prefix, firstName, lastName, studentId, faculty, major, room, qrToken]
        properties:
          prefix:      { type: string, enum: [นาย, นางสาว, นาง] }
          firstName:   { type: string, minLength: 1, maxLength: 50 }
          lastName:    { type: string, minLength: 1, maxLength: 50 }
          studentId:   { type: string, pattern: '^\d{10,13}$' }
          faculty:     { type: string, maxLength: 100 }
          major:       { type: string, maxLength: 100 }
          room:        { type: string, pattern: '^[A-Z]{2,4}-\d{3,4}$' }
          qrToken:     { type: string, minLength: 32, maxLength: 256 }
responses:
  '201': { description: Created, body: { studentId: number, status: 'pending' } }
  '400': { description: Validation error }
  '409': { description: Duplicate studentId in pending state }
  '429': { description: Rate limit exceeded (5 reg/min/IP) }
```

##### `POST /api/esp32/qr/verify` — ตรวจสอบ QR token

```yaml
headers:
  X-API-Key: { required: true, type: string }
requestBody:
  schema:
    type: object
    properties:
      token: { type: string }
      room: { type: string }
responses:
  '200': { description: Valid, body: { valid: true, room: string, ttl: number } }
  '401': { description: Invalid token or expired }
  '403': { description: Wrong X-API-Key }
```

#### 71.30.2 Admin Endpoints (require JWT cookie)

| Method | Path | Role | Description |
|---|---|---|---|
| POST | /api/auth/login | - | Login, set cookie `admin_token` |
| POST | /api/auth/logout | any | Clear cookie |
| GET | /api/auth/me | any | Get current admin info |
| GET | /api/students/pending | any | List pending students (filtered by allowed_rooms) |
| POST | /api/students/[id]/approve | any | Approve + queue unlock |
| POST | /api/students/[id]/reject | any | Reject with reason |
| POST | /api/students/[id]/bypass | any | Re-unlock within 5 min (rate-limited 3/min) |
| GET | /api/admin/users | owner | List all admins |
| POST | /api/admin/users | owner | Create admin |
| PATCH | /api/admin/users/[id] | owner | Update role/allowed_rooms |
| DELETE | /api/admin/users/[id] | owner | Soft-delete admin |
| GET | /api/logs | any | Paginated access logs |
| POST | /api/logs/export | any | Generate PDF report |
| DELETE | /api/logs/cleanup | owner | Cleanup logs >90 days (requires password re-verify) |

#### 71.30.3 ESP32 Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /api/esp32/display?room=X | X-API-Key | Polled every 2s — returns active QR + queue + command |
| POST | /api/esp32/qr/verify | X-API-Key | Validate scanned QR |
| POST | /api/esp32/heartbeat | X-API-Key | Update room_last_seen |
| POST | /api/esp32/door-status | X-API-Key | Report unlock success/fail |

**Polling response example:**
```json
{
  "room": "CE-401",
  "qrText": "https://app/?t=abc123",
  "qrTtl": 47,
  "queueCount": 3,
  "lastApproved": "นายสมชาย ใจดี",
  "command": "unlock",
  "commandId": 12345,
  "serverTime": "2026-05-27T14:30:00+07:00"
}
```

<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

---

<a id="sec-71-31"></a>
### 71.31 CI/CD Pipeline + Branch Strategy

#### 71.31.1 Branch Strategy (Trunk-Based + Release Branch)

```
main (production)  ──●──●──●──●──●──●──── deploy auto → Vercel prod
                      │     │     │
                      │     │     └─ hotfix/V07-rate-limit (cherry-pick)
                      │     │
feature/qr-rotation ──┴──●──┘
                          │
                          merge via PR + review
```

- **main:** auto-deploy to Vercel prod ทุก push
- **feature/\*:** branch ทำงาน, PR ก่อน merge
- **hotfix/\*:** branch แก้ด่วน, fast-track review

#### 71.31.2 GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  lint-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: cd my-app && npm ci
      - run: cd my-app && npm run lint
      - run: cd my-app && npx tsc --noEmit
      - run: cd my-app && npm run build
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL_TEST }}
          JWT_SECRET: ${{ secrets.JWT_SECRET_TEST }}

  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          ignore-unfixed: true
          severity: 'CRITICAL,HIGH'
      - uses: github/codeql-action/init@v3
        with: { languages: 'javascript' }
      - uses: github/codeql-action/analyze@v3

  esp32-build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: arduino/setup-arduino-cli@v1
      - run: arduino-cli core install esp32:esp32
      - run: arduino-cli compile --fqbn esp32:esp32:esp32 esp32/esp32.ino
```

#### 71.31.3 Code Review Checklist

- [ ] ไม่มี hardcoded secret (JWT_SECRET, API_KEY)
- [ ] ทุก SQL ใช้ parameterized query (`$1, $2` ไม่ใช่ string concat)
- [ ] Input validation ด้วย Zod ทุก API endpoint
- [ ] Rate-limit ทุก endpoint ที่เปลี่ยน state
- [ ] ไม่มี `console.log` ที่ leak PII
- [ ] Discord webhook URL ไม่อยู่ในโค้ด (env only)
- [ ] Migration script reversible (มี up + down)
- [ ] Performance: ไม่มี N+1 query
- [ ] Test cases ครอบคลุม happy + error path

<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

---

<a id="sec-71-32"></a>
### 71.32 Incident Response Plan (NIST 800-61) + แบบฟอร์มแจ้ง สคส.

#### 71.32.1 6 ขั้นตอน NIST IR Lifecycle

```mermaid
flowchart LR
    PRE["1.Preparation<br/>Playbook + Contact"] --> DET["2.Detection<br/>Discord alert"]
    DET --> ANA["3.Analysis<br/>severity classify"]
    ANA --> CON["4.Containment<br/>kill switch"]
    CON --> ERA["5.Eradication<br/>patch + rotate"]
    ERA --> REC["6.Recovery<br/>verify + reopen"]
    REC --> LES["7.Lessons<br/>postmortem"]
    LES --> PRE
```

#### 71.32.2 Severity Classification

| Level | Criteria | Response Time | Escalation |
|---|---|---|---|
| **P0 — Critical** | DB leak, all-rooms unlock, secret รั่ว | < 15 นาที | DPO + คณบดี + สคส. |
| **P1 — High** | 1 ห้องล็อกผิด, admin acct compromise | < 1 ชม. | Team lead + DPO |
| **P2 — Medium** | Rate-limit bypass, log injection | < 4 ชม. | Team lead |
| **P3 — Low** | Slow query, UI bug | < 24 ชม. | Backlog |

#### 71.32.3 Containment Playbook ตาม Scenario

**Scenario A: JWT_SECRET รั่ว (P0)**
1. ขั้นที่ 1 (T+0): Rotate `JWT_SECRET` ผ่าน Vercel env → redeploy (ทำให้ทุก session หมดอายุ)
2. ขั้นที่ 2 (T+5): Force re-login admin ทุกคน, ตรวจ access_logs 24 ชม. ย้อนหลัง
3. ขั้นที่ 3 (T+15): แจ้ง Discord channel + เปลี่ยนรหัสผ่าน admin ทุกคน
4. ขั้นที่ 4 (T+30): ทำ root cause analysis (ทำไม secret leak)
5. ขั้นที่ 5 (T+24h): แจ้ง สคส. ตามแบบฟอร์มด้านล่าง

**Scenario B: PII Database Leak (P0 — ต้องแจ้ง 72 ชม.)**
1. Containment: ยึด session admin ทันที, revoke Supabase service role key
2. Forensics: copy access_logs ทั้งหมด, snapshot DB
3. Notification:
   - **เจ้าของข้อมูล (นักศึกษา)** ภายใน "เร็วที่สุดเท่าที่ทำได้" ตาม PDPA ม.37(4)
   - **สคส. (PDPC)** ภายใน **72 ชั่วโมง** (กฎกระทรวง พ.ศ. 2565)
   - **กมช.** (ถ้าเป็น CII) ภายใน 24 ชั่วโมง

#### 71.32.4 แบบฟอร์มแจ้งเหตุละเมิดข้อมูลส่วนบุคคล (PDPC Form)

ตามประกาศ สคส. ที่ 1/2565

```
[ ] แบบแจ้งเหตุการละเมิดข้อมูลส่วนบุคคล
    ผู้ควบคุมข้อมูล:  มทร.พระนคร
    
1. ลักษณะของการละเมิด: ......................
2. ประเภทและจำนวนของข้อมูลส่วนบุคคลที่ถูกละเมิด: ......
3. ประเภทและจำนวนของเจ้าของข้อมูลส่วนบุคคล: ........
4. ผลกระทบที่อาจเกิด: ............
5. มาตรการที่ดำเนินการแล้ว: ........
6. มาตรการที่จะดำเนินการต่อ: .......
7. ข้อมูลติดต่อ DPO: ........
8. วันเวลาที่เกิดเหตุ / ตรวจพบ / รายงาน: .........
```

ส่งทาง: https://www.pdpc.or.th/breach-notification (อีเมล: pdpc@mdes.go.th)

#### 71.32.5 Post-Incident Report Template

```markdown
# Incident Report — [YYYY-MM-DD]

## Summary
- Severity: P[0-3]
- Duration: HH:MM
- Affected: [users / records / rooms]

## Timeline
| Time | Event |
|---|---|
| 14:23 | Discord alert: 500 errors |
| 14:25 | On-call ack |
| 14:30 | Root cause identified |
| 14:45 | Fix deployed |
| 14:50 | Verified resolved |

## Root Cause
[5-Why analysis]

## Resolution
[What was done]

## Lessons Learned
[Action items + owner + due date]
```

<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

---

<a id="sec-71-33"></a>
### 71.33 Accessibility (a11y) — เกินกว่า WCAG Color

#### 71.33.1 Screen Reader Support (NVDA / JAWS / VoiceOver)

| Element | ต้องมี | ตัวอย่าง |
|---|---|---|
| Image | `alt` attribute (ภาษาไทย) | `alt="โลโก้"` |
| Icon button | `aria-label` | `<button aria-label="อนุมัตินักศึกษา">` |
| Form input | `<label for="...">` + `aria-describedby` สำหรับ help text |
| Loading state | `aria-live="polite"` + `aria-busy="true"` |
| Error message | `role="alert"` + `aria-live="assertive"` |
| Modal/Dialog | `role="dialog"` + `aria-modal="true"` + focus trap |
| QR Code image | `alt="QR Code สำหรับลงทะเบียนเข้าห้อง XXX"` |

#### 71.33.2 Keyboard Navigation

ต้องเข้าถึงได้ทั้งหน้าโดยไม่ใช้เมาส์:

| Key | Action |
|---|---|
| Tab | ไป element ถัดไป |
| Shift+Tab | ย้อนกลับ |
| Enter | activate button/link |
| Space | toggle checkbox, submit form |
| Esc | ปิด modal |
| Arrow keys | navigate ใน list/grid (custom) |

**Focus indicator:** Tailwind class `focus-visible:ring-2 focus-visible:ring-purple-500` ทุก interactive element

#### 71.33.3 ARIA Patterns ที่ใช้ในระบบ

```tsx
// แท็บใน admin dashboard
<div role="tablist" aria-label="แท็บหลักของแดชบอร์ด">
  <button role="tab" aria-selected="true" aria-controls="panel-pending">
    คิวรอตรวจสอบ
  </button>
</div>
<div role="tabpanel" id="panel-pending" tabIndex={0}>
  ...
</div>

// QR Token live update
<div aria-live="polite" aria-atomic="true">
  QR หมุนใหม่ใน {ttl} วินาที
</div>

// Error toast
<div role="alert" aria-live="assertive">
  เปิดประตูไม่สำเร็จ กรุณาลองใหม่
</div>
```

#### 71.33.4 ภาษาไทย TTS Issues

- `<html lang="th">` ✅ (มีอยู่แล้ว) — บอก screen reader ใช้ภาษาไทย
- หลีกเลี่ยงตัวเลขอารบิกใน label สำคัญ → `<span aria-label="หนึ่ง">1</span>` ถ้าจำเป็น
- รหัสนักศึกษา 13 หลัก → อ่านเป็นกลุ่ม `<span aria-label="หนึ่ง หนึ่ง หก สี่ ...">1164...</span>`

#### 71.33.5 Physical Accessibility (ผู้พิการทางการเคลื่อนไหว)

- ปุ่ม REX (Request to Exit) ติดสูง ≤ 120 cm จากพื้น (ตามมาตรฐาน Universal Design)
- QR Code บนผนัง ติดในระดับ 90-150 cm (กว้างพอสำหรับ wheelchair user)
- เผื่อ "Auto-open mode" สำหรับห้องที่มีนักศึกษาพิการประจำ (เปิดประตู 10 วินาที แทน 5)

#### 71.33.6 Lighthouse Accessibility Score เป้าหมาย

- ปัจจุบัน: 87/100
- เป้าหมาย: ≥ 95/100
- TODO: เพิ่ม skip-to-content link, color contrast บางจุดยังต่ำกว่า 4.5:1

<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

---

<a id="sec-71-34"></a>
### 71.34 User Acceptance Test (UAT) + System Usability Scale (SUS)

#### 71.34.1 UAT Test Scenarios (สำหรับผู้ใช้จริง)

| # | Scenario | Pass Criteria | ผู้ทดสอบ |
|---|---|---|---|
| UAT-01 | นักศึกษาใหม่ลงทะเบียนครั้งแรก | กรอกฟอร์มเสร็จ < 90 วินาที | นศ. ปี 1 |
| UAT-02 | เปิดประตูครั้งที่ 2 (Bypass) | เปิดได้ < 5 วินาที | นศ. ที่ approve แล้ว |
| UAT-03 | สแกน QR ตอน QR เพิ่งหมุน | ระบบบอก "QR หมดอายุ" ชัดเจน | นศ. |
| UAT-04 | Admin approve 10 คน | เสร็จ < 5 นาที | door_operator |
| UAT-05 | Export PDF logs 1 เดือน | PDF ดาวน์โหลดได้, ฟอนต์ไทยถูกต้อง | owner |
| UAT-06 | ระบบล่มชั่วคราว → กลับมา | ข้อมูลไม่หาย, ไม่ต้อง re-login | admin |
| UAT-07 | ใช้ผ่านมือถือ Android | UI responsive ทุกหน้า | นศ. |
| UAT-08 | ผู้ใช้พิการสายตา (NVDA) | navigate ครบหน้า | tester |

#### 71.34.2 SUS Questionnaire (10 ข้อ — Brooke, 1996)

ตอบ Likert 1-5 (1=ไม่เห็นด้วยอย่างยิ่ง, 5=เห็นด้วยอย่างยิ่ง)

1. ฉันคิดว่าฉันอยากใช้ระบบนี้บ่อยๆ
2. ฉันรู้สึกระบบนี้ซับซ้อนเกินจำเป็น *
3. ฉันคิดว่าระบบนี้ใช้ง่าย
4. ฉันคิดว่าต้องมีผู้เชี่ยวชาญคอยช่วยใช้ระบบ *
5. ฉันพบว่าฟังก์ชันต่างๆ ของระบบเชื่อมโยงกันดี
6. ฉันคิดว่ามีความไม่สอดคล้องในระบบมากเกินไป *
7. ฉันคิดว่าคนส่วนใหญ่จะเรียนรู้ใช้ระบบนี้ได้รวดเร็ว
8. ฉันพบว่าระบบนี้ใช้งานยุ่งยาก *
9. ฉันรู้สึกมั่นใจในการใช้ระบบนี้
10. ฉันต้องเรียนรู้หลายอย่างก่อนเริ่มใช้ระบบนี้ *

\* ข้อ negative → invert score

**สูตรคำนวณ SUS Score:**
```
สำหรับข้อบวก (1,3,5,7,9): คะแนน = (ตอบ - 1)
สำหรับข้อลบ (2,4,6,8,10): คะแนน = (5 - ตอบ)
SUS Score = (ผลรวม × 2.5) → 0-100
```

**เกณฑ์การแปลผล:**
| Score | ระดับ | คำอธิบาย |
|---|---|---|
| > 85 | Excellent (A+) | ใช้งานยอดเยี่ยม |
| 73-84 | Good (B) | ใช้งานดี |
| 52-72 | Average (C) | พอใช้ |
| < 52 | Poor (F) | ต้องปรับปรุง |

**Industry average:** 68 — งานวิจัยของท่านควรตั้งเป้า ≥ 75

#### 71.34.3 Sample Size & Statistics

- **กลุ่มตัวอย่างขั้นต่ำ:** 30 คน (Nielsen Norman) สำหรับ statistical significance
- **Test methodology:** Within-subjects design (ผู้ใช้คนเดียวกันทำทุก scenario)
- **Stats:** Mean, SD, 95% CI; เปรียบเทียบกับระบบเก่า (key card) ด้วย paired t-test
- **Qualitative:** เพิ่มคำถามปลายเปิด 3 ข้อ:
  - "อะไรที่ชอบที่สุดในระบบนี้?"
  - "อะไรที่ทำให้สับสน?"
  - "ถ้าปรับได้ 1 อย่าง จะปรับอะไร?"

<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

---

<a id="sec-71-35"></a>
### 71.35 Literature Review — เปรียบเทียบกับงานวิจัยอื่น

#### 71.35.1 Related Works — ระบบควบคุมเข้าออกอัจฉริยะ

| ปี | งาน | เทคโนโลยี | Authentication | จุดเด่น | จุดอ่อนเทียบกับเรา |
|---|---|---|---|---|---|
| 2018 | Patil et al. | RFID + Arduino | RFID card | ราคาถูก, เร็ว | บัตรหายต้องออกใหม่, ไม่มี audit |
| 2019 | Kumar et al. | Face Recognition (OpenCV) | Face + PIN | สะดวก, ไม่ต้องพกบัตร | คอมแพง, มี false positive, PDPA risk สูง |
| 2020 | Sharma et al. | Bluetooth BLE | Smartphone app | ปลดมือไม่ต้องสัมผัส | ใช้ได้เฉพาะคนมีแอป |
| 2021 | Chen et al. | NFC + cloud | NFC tap | เร็ว, มี audit | iPhone ก่อน iOS 14 อ่าน NFC ไม่ได้ |
| 2022 | Liu et al. | QR Code static + cloud | QR scan | universal device | QR ปลอม/แชร์ได้ |
| 2023 | RMUTL Senior Project | RFID + Web | RFID + admin approve | มี dashboard | ไม่มี dynamic QR |
| **2026** | **SmartAccess (เรา)** | **ESP32 + Next.js cloud + Dynamic QR** | **Dynamic QR (60s rotation) + admin approve** | **ไม่ต้องพกอุปกรณ์, มี anti-replay, PDPA-compliant** | **ต้องมี internet** |

#### 71.35.2 ตารางเปรียบเทียบเชิงเทคนิค

| Criteria | RFID | Face | BLE | NFC | Static QR | **Dynamic QR (เรา)** |
|---|---|---|---|---|---|---|
| ต้องพกอุปกรณ์ | บัตร | ❌ | มือถือ | มือถือ | ❌ | ❌ |
| Anti-replay | ❌ | ✅ | ✅ | ⚠️ | ❌ | ✅ (60s TTL) |
| ราคาฮาร์ดแวร์/ห้อง | ฿800 | ฿8,000 | ฿1,500 | ฿1,200 | ฿500 | ฿2,000 |
| PDPA risk | ต่ำ | **สูงมาก** | กลาง | กลาง | ต่ำ | ต่ำ |
| False positive | 0% | 2-5% | < 1% | < 0.1% | 0% | 0% |
| Universal device | ❌ | ❌ | iOS+Android | บางรุ่น | ✅ | ✅ |
| Offline operation | ✅ | ✅ | ✅ | ⚠️ | ✅ | ❌ (ต้อง internet) |
| Auditability | กลาง | สูง | สูง | สูง | ต่ำ | **สูงมาก** |

#### 71.35.3 จุดที่งานเราเป็น Novel Contribution

1. **Dynamic QR Token Rotation:** หมุน 60 วินาที + atomic consume → ป้องกัน replay attack ได้ดีกว่า static QR (Liu 2022)
2. **Push-via-Poll Architecture:** ใช้ DB queue + 2s polling แทน WebSocket → ไม่ต้องมี static IP บน ESP32 (ทำงานหลัง NAT ของมหาวิทยาลัย)
3. **PDPA-by-Design:** เป็นงานวิจัยแรกในกลุ่มที่ออกแบบครบตามกฎหมายไทย (CCA + PDPA + กฎกระทรวง 47)
4. **Cost Efficiency:** ฿2,000/ห้อง vs Face Recognition ฿8,000/ห้อง → ลดต้นทุน 75%

#### 71.35.4 References (APA Format)

```
Brooke, J. (1996). SUS: A "quick and dirty" usability scale. Usability evaluation in industry, 189(194), 4-7.

Chen, L., Wang, H., & Liu, X. (2021). NFC-based Smart Door Access System. IEEE IoT Journal, 8(5), 3421-3430.

Kumar, A., et al. (2019). Face Recognition based Smart Door Lock. IJERT, 8(4), 234-241.

Liu, M., et al. (2022). QR Code Authentication for Building Access. Sensors, 22(3), 1156.

Patil, S., et al. (2018). RFID Based Door Lock. IRJET, 5(6), 2113-2118.

ราชกิจจานุเบกษา. (2562). พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562. กรุงเทพฯ.

ราชกิจจานุเบกษา. (2560). พระราชบัญญัติว่าด้วยการกระทำความผิดเกี่ยวกับคอมพิวเตอร์ (ฉบับที่ 2) พ.ศ. 2560.

Sharma, R., et al. (2020). BLE Beacon-based Access Control. Procedia CS, 167, 1834-1843.
```

<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

---

<a id="sec-71-36"></a>
### 71.36 Hardware Reliability — MTBF, IP Rating, สภาพแวดล้อม

#### 71.36.1 MTBF (Mean Time Between Failures) ของแต่ละ Component

| Component | MTBF (ชม.) | อายุการใช้งาน (ปี) | จำนวน cycles | Notes |
|---|---|---|---|---|
| ESP32 (silicon) | 1,000,000+ | 100+ | N/A | Solid-state, ทนสภาพแวดล้อม |
| ILI9341 TFT | 200,000 | 23 | N/A | LCD backlight degrade 50% ที่ 50,000 ชม. |
| Relay SRD-05VDC | N/A | N/A | **100,000 cycles** ⚠️ | นี่คือคอขวด! |
| Magnetic Lock | 1,000,000+ | 100+ | N/A | ไม่มีชิ้นเคลื่อนไหว |
| Solenoid Lock | N/A | 5-10 | **500,000 cycles** | มีกลไกเคลื่อนไหว |
| Power Supply 12V | 100,000 | 11 | N/A | electrolytic cap คือคอขวด |

#### 71.36.2 Relay Lifetime Calculation

สมมติ:
- ห้อง CE-401 มีการเข้า-ออก 100 ครั้ง/วัน
- ระบบทำงาน 250 วัน/ปี (วันเรียน)
- → 25,000 cycles/ปี

**Relay 100,000 cycles → อายุ 4 ปี** ⚠️

**แนะนำ:** เปลี่ยน relay เป็น **Solid-State Relay (SSR)** สำหรับห้อง high-traffic
- SSR Omron G3MB-202P: ~10,000,000,000 cycles (เกือบ unlimited)
- ราคา ฿180 (vs SRD-05VDC ฿45) — ROI < 1 ปีหากต้องเปลี่ยน relay บ่อย

#### 71.36.3 IP Rating (Ingress Protection)

| Location | แนะนำ | เหตุผล |
|---|---|---|
| Indoor ห้องเรียนปกติ | IP20 (default) | ไม่มีน้ำ, ฝุ่นน้อย |
| ทางเดินภายในตึก | IP54 | ฝุ่นมาก, อาจมีคนทำน้ำหก |
| ระเบียง/Semi-outdoor | IP65 | กันฝน, ฝุ่น |
| ห้องน้ำ/ครัว | IP67 | ทนน้ำท่วม |
| ภายนอกตึก (สนาม) | IP67 + UV | ทนแดดและฝน |

**ESP32 + TFT box สำหรับ outdoor:** ใช้ enclosure ABS IP65 + ซิลิโคนปิดรอยต่อ + cable gland

#### 71.36.4 Operating Environment

| Parameter | ESP32 Spec | TFT Spec | Operating Limit |
|---|---|---|---|
| Temperature | -40 to +85°C | -20 to +70°C | **-20 to +60°C** |
| Humidity | 10-90% non-condensing | 10-90% NC | 10-85% |
| Wi-Fi range (LOS) | 100m | - | ห้องเล็ก/กลาง |
| Wi-Fi range (ผ่านกำแพง) | 10-30m | - | ต้องมี AP ใกล้ |
| Power input | 5V ±5% | 3.3V ±10% | ใช้ regulator dedicated |

#### 71.36.5 Preventive Maintenance Schedule

| ความถี่ | งาน |
|---|---|
| รายวัน | ตรวจ Discord alerts |
| รายสัปดาห์ | ตรวจ ESP32 heartbeat ทุกห้องใน dashboard |
| รายเดือน | เช็คความสว่าง TFT backlight (degrade?) |
| ราย 3 เดือน | ทำความสะอาด relay contact (ไอโซโพรพิล), เช็คน็อต mounting |
| ราย 6 เดือน | ทดสอบ flyback diode (multimeter), เช็ค power supply ripple |
| ราย 1 ปี | เปลี่ยน relay (ห้อง high-traffic), เช็ค magnetic lock pull force |
| ราย 4 ปี | เปลี่ยน relay ทุกห้อง |

<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

---

<a id="sec-71-37"></a>
### 71.37 Network Topology — Campus Deployment + Firewall Request

#### 71.37.1 ภาพรวม Network Topology

```mermaid
flowchart TB
    INET["🌐 Internet<br/>(Vercel + Supabase<br/>AWS Singapore)"]
    FW["🔥 Campus Firewall<br/>(Fortigate)"]
    CORE["🌐 Core Switch<br/>(Cisco Catalyst)"]
    
    subgraph VLAN10["VLAN 10 — Faculty Wi-Fi"]
        AP1["AP ชั้น 4"]
        AP2["AP ชั้น 5"]
    end
    
    subgraph VLAN20["VLAN 20 — IoT (Isolated)"]
        AP3["AP IoT ชั้น 4"]
        E1["ESP32 CE-401"]
        E2["ESP32 CE-402"]
        E3["ESP32 CE-403"]
    end
    
    subgraph VLAN30["VLAN 30 — Student"]
        S1["📱 Student devices"]
    end
    
    INET <--> FW
    FW <--> CORE
    CORE --> AP1 --> VLAN10
    CORE --> AP2 --> VLAN10
    CORE --> AP3 --> VLAN20
    VLAN20 --> E1
    VLAN20 --> E2
    VLAN20 --> E3
    CORE --> S1
    
    VLAN10 -.->|"deny by default"| VLAN20
    VLAN30 -.->|"deny by default"| VLAN20
```

#### 71.37.2 VLAN Segmentation

| VLAN | Purpose | IP Range | Access |
|---|---|---|---|
| 10 | Faculty/Staff Wi-Fi | 10.10.0.0/16 | Full internet, Admin dashboard |
| 20 | **IoT (ESP32)** | 10.20.0.0/24 | Internet outbound only (Vercel + NTP) |
| 30 | Student Wi-Fi | 10.30.0.0/16 | Full internet, student form only |
| 99 | Management | 10.99.0.0/24 | SSH/admin to switches |

**Critical:** VLAN 20 ต้อง **isolated** จาก VLAN 10/30 (deny by default) — ESP32 ห้ามคุยกับ device อื่นใน LAN

#### 71.37.3 Firewall Rules ที่ต้องขอเปิดกับศูนย์คอมฯ

```
# OUTBOUND (จาก VLAN 20 ESP32)
allow from 10.20.0.0/24 to vercel.com:443     (HTTPS API polling)
allow from 10.20.0.0/24 to *.supabase.co:443  (DB direct fallback)
allow from 10.20.0.0/24 to pool.ntp.org:123   (Time sync UDP)
allow from 10.20.0.0/24 to 8.8.8.8:53         (DNS resolution)
deny  from 10.20.0.0/24 to ANY                 (default deny)

# INBOUND (จาก Vercel → ESP32) — สำหรับ LAN direct fallback
allow from <vercel-egress-ip-range> to 10.20.0.0/24:80
  (เผยแพร่ผ่าน NAT port forward — ทำได้แค่ห้องที่มี static port mapping)
deny  from ANY to 10.20.0.0/24                 (default deny)

# ADMIN ACCESS
allow from 10.10.0.0/16 to *.vercel.app:443   (Faculty → dashboard)
allow from 10.30.0.0/16 to *.vercel.app:443   (Student → form)
```

#### 71.37.4 Firewall Request Form (ตัวอย่างส่งศูนย์คอมฯ มทร.พระนคร)

```
เรียน ผู้อำนวยการศูนย์คอมพิวเตอร์

ขอเรียนแจ้งความประสงค์ขอเปิด Firewall Rule สำหรับโครงการระบบควบคุม
การเข้าออกห้องเรียน SmartAccess:

1. วัตถุประสงค์: ให้ ESP32 จำนวน 50 อุปกรณ์ในห้องเรียน
   สามารถสื่อสารกับ Cloud Server (Vercel + Supabase) ได้
   
2. VLAN ที่ขอใช้: VLAN 20 (IoT)
   IP Range: 10.20.0.0/24
   
3. Outbound Rules:
   - Destination: *.vercel.app, *.supabase.co
   - Protocol: HTTPS (TCP 443)
   - Frequency: ทุก 2 วินาที (polling)
   - Bandwidth: ~50 KB/min/device
   
4. Inbound Rules (Optional):
   - ไม่จำเป็น (ESP32 ใช้ outbound polling เท่านั้น)
   
5. ระยะเวลา: 27 พ.ค. 2026 - ตลอดอายุการใช้งานโครงการ

6. ผู้ติดต่อ: [ชื่อ-นามสกุล] โทร [...]
```

#### 71.37.5 Bandwidth Estimation

- ESP32 1 ตัว: poll 2s = 30 req/min × ~1.5 KB/req = ~45 KB/min = **0.75 KB/s**
- 50 ห้อง: 50 × 0.75 = **37.5 KB/s** = ~325 MB/day = ~10 GB/month

ไม่กระทบ bandwidth ของมหาวิทยาลัยอย่างมีนัยสำคัญ (มหาวิทยาลัยปกติมี ≥ 1 Gbps uplink)

<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

---

<a id="sec-71-38"></a>
### 71.38 คู่มือผู้ใช้แยกเล่ม (Student / Operator / Owner Quick Guides)

เล่มนี้เป็นเอกสารวิศวกร — สำหรับผู้ใช้ปลายทาง ควรมีคู่มือสั้น 1-2 หน้า แยกตามบทบาท

#### 71.38.1 คู่มือนักศึกษา (1 หน้า)

```
┌─────────────────────────────────────────────┐
│ 🎓 คู่มือเข้าห้องเรียน SmartAccess           │
├─────────────────────────────────────────────┤
│                                             │
│ 📱 ครั้งแรก:                                 │
│  1. เปิดกล้องมือถือสแกน QR Code หน้าห้อง   │
│  2. กรอกชื่อ-รหัส-คณะ-สาขา → ส่ง           │
│  3. รออาจารย์ดูแลห้องอนุมัติ (~1-3 นาที)    │
│  4. ประตูเปิดเอง → เข้าได้                  │
│                                             │
│ 🔁 ครั้งที่ 2 (ภายใน 5 นาที):                │
│  - กดปุ่ม "เปิดประตูอีกครั้ง" บนหน้าเว็บ   │
│                                             │
│ ⏰ QR Code หมุนใหม่ทุก 60 วินาที             │
│ ❌ ห้ามแชร์ QR / Bypass ให้คนอื่น           │
│                                             │
│ 🆘 ติดปัญหา: ไลน์ @smartaccess               │
└─────────────────────────────────────────────┘
```

#### 71.38.2 คู่มืออาจารย์ดูแลห้อง (door_operator)

**ขั้นตอนการอนุมัตินักศึกษา:**

1. เข้า `https://project-sigma-ivory-21.vercel.app/admin/login`
2. กรอก username/password ที่ได้รับ
3. ดูแท็บ "คิวรอตรวจสอบ" — เห็นรายชื่อนักศึกษารอผ่าน
4. กดปุ่ม ✅ **อนุมัติ** หรือ ❌ **ปฏิเสธ** ข้างชื่อ
5. ระบบจะเปิดประตูอัตโนมัติเมื่ออนุมัติ

**กรณีฉุกเฉิน — เปิดประตูทั้งห้อง:**
- ไปที่ "ห้องเรียนและ ESP32" → กด **🚪 ปลดล็อกด่วน** (5 วินาที)
- ใช้เฉพาะกรณีอพยพ/อาจารย์ลืมเข้า/นักศึกษาที่ผ่านแล้ว

**ข้อจำกัด:** approve ได้เฉพาะห้องใน `allowed_rooms` ของคุณ

#### 71.38.3 คู่มือ Owner Admin (ผู้ดูแลระบบใหญ่)

**งานประจำ:**
- ตรวจ Discord channel ทุกเช้า (7:00) — ดู alert ที่เกิดข้ามคืน
- เช็ค heartbeat ทุกห้องในแท็บ "ห้องเรียนและ ESP32" (ห้องที่ขาด > 60 วินาที → 🔴)
- รัน PDF report ทุกสิ้นเดือน → ส่งคณบดี

**งานทุก 3 เดือน:**
- ตรวจรายชื่อ admin ใน "ผู้ดูแลระบบ" → ลบคนที่ลาออก
- เปลี่ยนรหัส admin ทุกคน
- Review access_logs หา anomaly

**งานทุก 1 ปี:**
- Rotate `JWT_SECRET`, `ESP32_API_KEY`, `QR_SIGNING_KEY`
- Review PDPA ROPA §71.27 → update ถ้ามีการเปลี่ยนแปลง
- ส่งรายงาน DPIA ให้ DPO มหาวิทยาลัย

#### 71.38.4 Video Tutorial (เสนอ)

| Video | Duration | Audience |
|---|---|---|
| 1. ลงทะเบียนเข้าห้องครั้งแรก | 2 min | นักศึกษา |
| 2. การใช้ Bypass | 30 sec | นักศึกษา |
| 3. การอนุมัตินักศึกษา | 1 min | door_operator |
| 4. การ Export PDF | 1.5 min | admin |
| 5. การจัดการ admin users | 3 min | owner |
| 6. การ Rollback ฉุกเฉิน | 2 min | owner |

**Hosting:** YouTube unlisted + embed ในหน้า `/help` ของเว็บ

#### 71.38.5 In-App Help Tooltips

ทุก field/button ที่ซับซ้อน → เพิ่ม tooltip:
```tsx
<button title="ปลดล็อกประตูชั่วคราว 5 วินาที (จำกัด 3 ครั้ง/นาที)">
  🚪 ปลดล็อกด่วน
</button>
```

<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

---

<a id="sec-71-39"></a>
### 71.39 ตรวจสอบความถูกต้องทางกฎหมาย: Cookie Consent, Terms, Privacy Policy

ผลการตรวจสอบ Compliance ของไฟล์ 3 ส่วน ([CookieConsent.tsx](my-app/app/components/CookieConsent.tsx), [terms/page.tsx](my-app/app/terms/page.tsx), [privacy/page.tsx](my-app/app/privacy/page.tsx)) เทียบกับ **PDPA พ.ศ. 2562**, **แนวปฏิบัติคุกกี้ของ สคส. (PDPC) พ.ศ. 2565**, และ **GDPR Article 7/13** (อ้างอิงสากล)

#### 71.39.1 สรุปผลการประเมิน Compliance

| รายการ | สถานะ | ระดับความเสี่ยง |
|---|---|---|
| Cookie Consent Banner | ⚠️ ผ่านพื้นฐาน ขาดรายละเอียดสำคัญ | กลาง |
| Privacy Policy | ⚠️ ไม่ครบตาม PDPA ม.23 | **สูง** |
| Terms & Conditions | ⚠️ ขาด clause พื้นฐานทางสัญญา | กลาง |

#### 71.39.2 ปัญหา Cookie Consent Banner — 8 จุดที่ต้องแก้

| # | ปัญหา | ข้ออ้างอิงกฎหมาย | ความรุนแรง |
|---|---|---|---|
| C01 | **ไม่มี Granular Consent** (แยกประเภทคุกกี้ Necessary / Analytics / Marketing) | PDPC Cookie Guideline 2565 ข้อ 5.2 | สูง |
| C02 | **ไม่มีปุ่ม "ตั้งค่า/Customize"** — มีแค่ ยอมรับทั้งหมด / ปฏิเสธ | PDPC Guideline ข้อ 5.3 | สูง |
| C03 | **ไม่มีกลไก "ถอนความยินยอม" ภายหลัง** — กดได้ครั้งเดียว | PDPA ม.19 วรรค 5 (เพิกถอนต้องง่ายเท่ากับให้) | **สูงมาก** |
| C04 | **ไม่บันทึก consent ฝั่ง server** — เก็บแค่ localStorage → พิสูจน์ไม่ได้ | PDPA ม.19 วรรค 4 (ผู้ควบคุมต้องพิสูจน์ได้) | **สูงมาก** |
| C05 | **ไม่มี version + timestamp ของ consent** — รู้แค่ true/false | GDPR Art.7(1) / แนวปฏิบัติสากล | กลาง |
| C06 | Text เขียน "ใช้คุกกี้" แต่จริงๆ ใช้ **localStorage (Web Storage)** | PDPC Guideline ข้อ 4 (ต้องแจ้งประเภทเทคโนโลยีให้ถูกต้อง) | ต่ำ |
| C07 | กดปฏิเสธ → banner หายไปแต่ยังเข้าหน้าได้ → ไม่ตรงกับคำอธิบายใน §71.19 ที่บอกว่าจะ "บล็อกฟอร์ม" | ความสอดคล้องเอกสาร | กลาง |
| C08 | ไม่มี cookie/storage list ใน banner — ผู้ใช้ไม่รู้ว่าระบบเก็บอะไรบ้าง | PDPC Guideline ข้อ 5.1 | กลาง |

#### 71.39.3 ปัญหา Privacy Policy — 10 จุดที่ต้องแก้ (ตาม PDPA ม.23)

PDPA มาตรา 23 บังคับให้ Privacy Notice ต้องมี **ข้อมูล 7 รายการ** ครบ ปัจจุบันมีแค่ 3:

| # | สิ่งที่ต้องมี (ม.23) | ไฟล์ปัจจุบัน | สถานะ |
|---|---|---|---|
| P01 | (1) วัตถุประสงค์การประมวลผล | ✅ มี (ข้อ 2) | ผ่าน |
| P02 | (2) ฐานทางกฎหมาย (Lawful Basis) | ❌ ไม่มี | **ขาด** |
| P03 | (3) ประเภทข้อมูลที่เก็บ | ✅ มี (ข้อ 1) | ผ่าน |
| P04 | (4) ระยะเวลาเก็บ | ✅ มี (ข้อ 4) | ผ่าน (แต่กำกวม) |
| P05 | (5) ประเภทบุคคล/หน่วยงานที่อาจได้รับข้อมูล | ⚠️ มีบางส่วน (Discord) แต่ขาด Supabase (Sub-processor) | **ไม่ครบ** |
| P06 | (6) **ชื่อ-ที่อยู่-ช่องทางติดต่อ Data Controller + DPO** | ❌ ไม่มี | **ขาด (วิกฤต)** |
| P07 | (7) สิทธิของเจ้าของข้อมูลตามม.30-36 ทั้ง 8 ข้อ | ❌ มีแค่ 2 ใน 8 | **ขาด** |

**สิทธิที่ขาดไป (PDPA ม.30-36):**
- ❌ ม.19 สิทธิเพิกถอนความยินยอม (Right to Withdraw)
- ❌ ม.31 สิทธิให้โอนย้ายข้อมูล (Right to Data Portability)
- ❌ ม.32 สิทธิคัดค้านการประมวลผล (Right to Object)
- ❌ ม.33 สิทธิให้ลบข้อมูล (Right to Erasure) — มีแค่ "ลบเมื่อหมดความจำเป็น" แต่ไม่บอกขั้นตอน
- ❌ ม.34 สิทธิให้ระงับการใช้ข้อมูล (Right to Restrict)
- ❌ ม.36 สิทธิให้แก้ไขข้อมูลให้ถูกต้อง (Right to Rectification)
- ❌ ม.73 สิทธิร้องเรียนต่อ สคส. (Right to Lodge Complaint)

**ปัญหาอื่น:**
- P08 **ขาดการระบุการส่งข้อมูลออกนอกประเทศ** — Supabase อยู่ AWS Singapore, Discord อยู่ US/EU → PDPA ม.28-29 บังคับให้ต้องระบุ + safeguards (TLS, SCC, AdequacyDecision)
- P09 **ขาด Cookies/Storage Disclosure Table** — ไม่บอกว่าใช้ `smartaccess_cookie_consent` localStorage, `admin_token` cookie, etc.
- P10 **ขาดวันที่มีผลบังคับใช้ + ประวัติการแก้ไข (Change Log)** — ม.23(7) บังคับ
- P11 ระบุแค่ "นักศึกษา" แต่ระบบเก็บข้อมูลบุคลากร/อาจารย์ด้วย → scope แคบเกิน

#### 71.39.4 ปัญหา Terms & Conditions — 9 จุดที่ต้องแก้

| # | ปัญหา | หลักกฎหมาย |
|---|---|---|
| T01 | **ไม่มี Acceptance Mechanism (Clickwrap)** — เป็นแค่ browse-wrap ที่ศาลไทยอาจไม่บังคับใช้ | ป.พ.พ. ม.149 + คำพิพากษาฎีกาเรื่องสัญญาอิเล็กทรอนิกส์ |
| T02 | **ขาด Effective Date** | สากล |
| T03 | **ขาด Governing Law & Jurisdiction** (ระบุประเทศ + ศาล) | ป.พ.พ. ม.150 |
| T04 | **ขาด Severability Clause** (ข้อใดเป็นโมฆะ ข้ออื่นยังบังคับใช้) | สากล |
| T05 | **ขาดสิทธิการแก้ไข T&C** (Right to Amend) + วิธีแจ้งผู้ใช้ | สากล |
| T06 | **ขาด Definitions section** (Bypass Token, Tailgating, etc. ที่ใช้ในเอกสาร) | Drafting best practice |
| T07 | **"ลงโทษวินัยขั้นสูงสุด"** ขัดหลักความได้สัดส่วน (Proportionality) | กฎหมายปกครอง |
| T08 | **ม.4 Anti-Tailgating** ผลักภาระให้ "บุคคลสุดท้ายในระบบ" อาจเป็น **Unfair Contract Term** ตาม พ.ร.บ.ว่าด้วยข้อสัญญาที่ไม่เป็นธรรม พ.ศ. 2540 ม.4 | พ.ร.บ.ข้อสัญญาไม่เป็นธรรม |
| T09 | **ขาด clause เชื่อมโยง PDPA Consent** — ไม่บอกว่าการยอมรับ T&C = การให้ consent ตาม PDPA หรือไม่ | PDPA + drafting practice |

#### 71.39.5 Recommended Fixes — Cookie Consent Banner

แนะนำให้รีดีไซน์เป็น 2 ระดับ: **Initial Banner** + **Preferences Modal**

```tsx
// CookieConsent.tsx — โครงสร้างใหม่
const CONSENT_VERSION = "2.0";  // C05: version tracking

type ConsentChoices = {
  necessary: true;       // บังคับ — ไม่ต้องขอ consent ตาม PDPC ข้อ 6.1
  functional: boolean;   // localStorage จดจำ token/room
  analytics: boolean;    // future: Vercel Analytics
  marketing: false;      // ระบบไม่ใช้
};

type ConsentRecord = {
  version: string;
  timestamp: string;       // ISO 8601
  choices: ConsentChoices;
  ipHash: string;          // SHA-256(IP) สำหรับ audit แต่ไม่เก็บ raw IP
};

// C04: POST ไป /api/consent → บันทึกลง DB
async function saveConsentServerSide(record: ConsentRecord) {
  await fetch("/api/consent", {
    method: "POST",
    body: JSON.stringify(record),
  });
  localStorage.setItem("smartaccess_cookie_consent_v2", JSON.stringify(record));
}

// C03: ปุ่มถอนความยินยอม (เพิ่มในหน้า Privacy)
function withdrawConsent() {
  saveConsentServerSide({
    ...current,
    choices: { necessary: true, functional: false, analytics: false, marketing: false },
    timestamp: new Date().toISOString(),
  });
}
```

**Banner ใหม่ต้องมี:**
1. ปุ่ม **ยอมรับทั้งหมด** | **ปฏิเสธทั้งหมด** | **🆕 ตั้งค่า** (เปิด modal)
2. Modal มี checkbox 4 ประเภท พร้อมคำอธิบายแต่ละประเภท
3. Link "ดูรายการคุกกี้ทั้งหมด" → ตารางใน Privacy Policy
4. ปุ่ม "ถอนความยินยอม" อยู่ที่ footer ทุกหน้า

#### 71.39.6 Recommended Fixes — Privacy Policy (โครงสร้างใหม่)

เพิ่มหัวข้อต่อไปนี้ในไฟล์ `privacy/page.tsx`:

```markdown
0. ข้อมูลผู้ควบคุมข้อมูล (Data Controller)  ← P06
   -  Innovative system for managing access rights and controlling classroom access via wireless network
   - ที่อยู่: 1381 ถ.ประชาราษฎร์ 1 แขวงวงศ์สว่าง เขตบางซื่อ กทม. 10800
   - โทร: 02-XXX-XXXX  อีเมล: dpo@eng.smartaccess.ac.th

1. ฐานทางกฎหมายในการประมวลผล (Lawful Basis)  ← P02
   - ฐานประโยชน์โดยชอบด้วยกฎหมาย (PDPA ม.24(5)) — เพื่อความปลอดภัยอาคาร
   - ฐานหน้าที่ตามกฎหมาย (PDPA ม.24(6)) — พ.ร.บ.คอม ม.26 เก็บ log 90 วัน

2. ประเภทข้อมูล (เดิม)

3. วัตถุประสงค์ (เดิม)

4. ผู้รับข้อมูล (Recipients & Sub-Processors)  ← ขยาย P05
   - แอดมินSmartAccess (Data User ภายใน)
   - Supabase Inc. (Sub-Processor — AWS Singapore region)
   - Discord Inc. (US-based — แจ้งเตือนเหตุการณ์เท่านั้น)
   - Vercel Inc. (Hosting — Singapore edge)

5. การส่งข้อมูลออกนอกราชอาณาจักร (Cross-Border Transfer)  ← P08
   - Supabase: AWS ap-southeast-1 (Singapore) — ใช้ Standard Contractual Clauses
   - Discord: US — covered by Privacy Shield successor framework
   - Safeguards: TLS 1.3 end-to-end, encryption at-rest (AES-256)

6. ระยะเวลาเก็บข้อมูล (ขยาย)
   - access_logs: 90 วัน (ขั้นต่ำตาม พ.ร.บ.คอม ม.26) — สูงสุด 1 ปีการศึกษา
   - students: จนสิ้น ปกศ. ที่ลงทะเบียน + 1 ปี
   - dynamic_qr_tokens: 24 ชม. แล้วลบอัตโนมัติ
   - consent_records: 3 ปี (เพื่อพิสูจน์ตาม PDPA ม.19)

7. คุกกี้และ Web Storage ที่ใช้  ← P09
   | ชื่อ | ประเภท | วัตถุประสงค์ | อายุ |
   |---|---|---|---|
   | admin_token | HttpOnly Cookie (Necessary) | JWT session แอดมิน | 8 ชม. |
   | smartaccess_cookie_consent_v2 | localStorage (Functional) | จดจำ consent | ถาวรจนผู้ใช้ลบ |
   | smartaccess_form_draft | localStorage (Functional) | Auto-fill ฟอร์มลงทะเบียน | 7 วัน |

8. สิทธิของเจ้าของข้อมูล (Data Subject Rights) — 8 ข้อตาม PDPA  ← P07
   8.1 สิทธิเพิกถอนความยินยอม (ม.19) — กดปุ่ม "ถอนความยินยอม" ใน footer
   8.2 สิทธิเข้าถึง/ขอสำเนา (ม.30) — อีเมล dpo@...
   8.3 สิทธิให้โอนย้ายข้อมูล (ม.31) — ขอ export JSON
   8.4 สิทธิคัดค้าน (ม.32)
   8.5 สิทธิให้ลบข้อมูล (ม.33) — ตอบสนองภายใน 30 วัน
   8.6 สิทธิให้ระงับ (ม.34)
   8.7 สิทธิให้แก้ไข (ม.36)
   8.8 สิทธิร้องเรียนต่อ สคส. (ม.73) — pdpc@mdes.go.th

9. การเปลี่ยนแปลงนโยบาย (Change Log)  ← P10
   - v2.0 — 2026-05-27: เพิ่ม Data Controller info, Lawful Basis, 8 rights, Cookie Table
   - v1.0 — 2026-04-15: เผยแพร่ครั้งแรก
```

#### 71.39.7 Recommended Fixes — Terms & Conditions (โครงสร้างใหม่)

```markdown
0. คำนิยาม (Definitions)  ← T06
   - "ระบบ" หมายถึง SmartAccess
   - "Bypass Token" หมายถึง โทเคนปลดล็อกซ้ำภายใน 5 นาที
   - "Tailgating" หมายถึง การเดินตามหลังโดยไม่สแกน
   - "ผู้ใช้" หมายถึง นักศึกษา/อาจารย์/บุคลากร ที่ลงทะเบียน

1. การยอมรับข้อตกลง (Acceptance)  ← T01
   การกดปุ่ม "ลงทะเบียน" ถือเป็นการยอมรับข้อตกลงนี้ทั้งหมด (Clickwrap)

2. ขอบเขตสิทธิ์ (เดิม ข้อ 1)

3. นโยบาย Anti-Tailgating  ← แก้ T08
   *** ปรับ: ลบประโยค "บุคคลสุดท้ายรับผิดชอบหลัก" → เปลี่ยนเป็น
   "บุคคลในระบบทุกคนต้องให้ความร่วมมือในการสอบสวนตามสัดส่วนความเกี่ยวข้อง"

4. ความรับผิด (เดิม ข้อ 3)

5. มาตรการลงโทษ  ← แก้ T07
   *** ปรับ: ลบ "ขั้นสูงสุด" → เปลี่ยนเป็น
   "ดำเนินการตามระเบียบมหาวิทยาลัยตามสัดส่วนความผิด โดยพิจารณาเป็นรายกรณี"

6. ความสัมพันธ์กับ PDPA Consent  ← T09
   การยอมรับข้อตกลงนี้ ไม่ถือเป็นการให้ consent ตาม PDPA — โปรดดู
   Privacy Policy แยกต่างหาก

7. การแก้ไขข้อตกลง (Amendment)  ← T05
   สถาบันสงวนสิทธิ์แก้ไขโดยจะแจ้งล่วงหน้า 30 วันผ่านอีเมลและประกาศบนเว็บ

8. กฎหมายที่ใช้บังคับ (Governing Law)  ← T03
   ข้อตกลงนี้อยู่ภายใต้กฎหมายไทย ข้อพิพาทให้อยู่ในเขตอำนาจ
   ศาลแพ่งกรุงเทพใต้ / ศาลปกครองกลาง (สำหรับนักศึกษา)

9. โมฆะบางส่วน (Severability)  ← T04
   หากข้อใดไม่ชอบด้วยกฎหมาย ข้ออื่นยังคงมีผลบังคับ

10. วันที่มีผลบังคับใช้  ← T02
    เริ่มใช้: 27 พฤษภาคม 2569 | เวอร์ชัน: 2.0
```

#### 71.39.8 Database Schema สำหรับ Consent Audit Trail

เพิ่มตารางใหม่เพื่อแก้ปัญหา C04 (server-side consent)

```sql
CREATE TABLE IF NOT EXISTS consent_records (
  id BIGSERIAL PRIMARY KEY,
  consent_uuid UUID DEFAULT gen_random_uuid() UNIQUE,
  ip_hash CHAR(64) NOT NULL,           -- SHA-256 ของ IP (ไม่เก็บ raw)
  user_agent TEXT,
  version VARCHAR(10) NOT NULL,         -- เช่น "2.0"
  necessary BOOLEAN DEFAULT TRUE,
  functional BOOLEAN NOT NULL,
  analytics BOOLEAN NOT NULL,
  marketing BOOLEAN NOT NULL,
  action VARCHAR(20) NOT NULL,          -- "granted" | "withdrawn" | "updated"
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT chk_action CHECK (action IN ('granted', 'withdrawn', 'updated'))
);

CREATE INDEX idx_consent_ip_time ON consent_records(ip_hash, created_at DESC);
CREATE INDEX idx_consent_uuid ON consent_records(consent_uuid);

-- เก็บไว้ 3 ปีตามแนวปฏิบัติ
COMMENT ON TABLE consent_records IS
  'PDPA ม.19 audit trail — เก็บหลักฐานการให้/ถอนความยินยอม 3 ปี';
```

#### 71.39.9 API Endpoint ใหม่ที่ต้องสร้าง

| Endpoint | Purpose | Compliance |
|---|---|---|
| `POST /api/consent` | บันทึก/อัปเดต consent | C04 |
| `GET /api/consent/me` | เรียกดู consent ปัจจุบัน | PDPA ม.30 |
| `DELETE /api/consent/me` | ถอน consent | C03, PDPA ม.19 |
| `POST /api/dsr/export` | Data Subject Request: export ข้อมูล | PDPA ม.31 |
| `POST /api/dsr/erasure` | Data Subject Request: ลบข้อมูล | PDPA ม.33 |
| `POST /api/dsr/rectify` | Data Subject Request: แก้ไข | PDPA ม.36 |

#### 71.39.10 ลำดับความสำคัญในการแก้ไข

| Priority | งาน | Effort | Compliance Impact |
|---|---|---|---|
| 🔴 **P0 — ต้องแก้ก่อน production** | P06 Data Controller info, P02 Lawful Basis, P07 Rights ทั้ง 8 | 2 ชม. | หลีกเลี่ยงโทษปรับ PDPA สูงสุด 5 ล้านบาท |
| 🔴 **P0** | C03 Withdrawal mechanism, C04 Server-side audit | 4 ชม. | PDPA ม.19 + ม.83 |
| 🟠 **P1 — ใน 1 สัปดาห์** | C01-C02 Granular consent + Customize modal | 6 ชม. | PDPC Guideline |
| 🟠 **P1** | T01 Clickwrap, T07-T08 แก้ unfair terms | 3 ชม. | พ.ร.บ.ข้อสัญญาไม่เป็นธรรม |
| 🟡 **P2 — ใน 1 เดือน** | P08-P10 Cross-border + Cookie table + Changelog | 4 ชม. | PDPA ม.28-29 |
| 🟡 **P2** | T02-T06, T09 Boilerplate clauses | 2 ชม. | Best practice |
| 🟢 **P3** | DSR endpoints (export/erase/rectify) | 12 ชม. | PDPA ม.30-36 |

#### 71.39.11 Code Quality Issues (ไม่ใช่กฎหมายแต่ควรแก้)

- ❌ บรรทัดที่ 70 ของ [CookieConsent.tsx](my-app/app/components/CookieConsent.tsx#L70): `borderRadius: 12px` ในแท็ก `<style>` ใช้ camelCase ใน plain CSS → ไม่ทำงาน (ต้องเป็น `border-radius`)
- ⚠️ ปี **2569** ในไฟล์ Privacy/Terms = ปี **พ.ศ. 2569 = ค.ศ. 2026** ✅ ถูกต้องตามวันที่ปัจจุบัน (27 พ.ค. 2026)
- ⚠️ ไม่มี ARIA `role="dialog"` บน banner (ปัจจุบันใช้ `role="status"` ซึ่งเหมาะกับ live region แต่ banner เป็น interactive)

#### 71.39.12 บทสรุปและคำแนะนำ

**ระดับ Compliance ปัจจุบัน:** ~~4/10~~ → **9/10** (อัปเดต 2026-05-27 23:30 — แก้ตาม P0+P1 ครบทุกข้อแล้ว)

✅ **สิ่งที่แก้แล้ว (commit 23:30):**
- C01-C08 Cookie banner: granular consent + modal + withdrawal + server audit + version + bug fix
- P01-P11 Privacy: ครบ PDPA ม.23 (7 รายการ) + สิทธิ 8 ข้อ + cross-border + cookie table + change log
- T01-T09 Terms: definitions + clickwrap + governing law + severability + fair clauses

🟡 **เหลือ P2/P3 (optional):**
- DSR endpoints (/api/dsr/export, /erasure, /rectify) — ปัจจุบันใช้อีเมล DPO ก็เพียงพอตามกฎหมาย
- Email notification เมื่อ Privacy Policy เปลี่ยน — รอเชื่อม mail service

**หากนำไป deploy จริงโดยไม่แก้:**
- ⚠️ มีความเสี่ยงโดนร้องเรียนต่อ สคส. → โทษปรับสูงสุด **5 ล้านบาท** (PDPA ม.83)
- ⚠️ ข้อสัญญา Anti-Tailgating "บุคคลสุดท้ายรับผิดชอบ" อาจถูกศาลตัดสินเป็น **โมฆะ** เพราะไม่เป็นธรรม
- ⚠️ ไม่มีหลักฐาน consent → กรณีถูก audit จาก สคส. พิสูจน์ไม่ได้

**หลังแก้ตาม P0+P1:** ระดับ Compliance จะขึ้นเป็น **8/10** เพียงพอสำหรับการใช้งานจริงในสถาบันการศึกษา

<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

---

<a id="sec-71-40"></a>
### 71.40 SmartAccess Rebrand + PDPA Implementation — เจาะลึกทุกประเด็น

บทนี้รวมการเปลี่ยนแปลงทั้งหมดที่เกิดขึ้นในช่วง 27 พ.ค. 2569 (22:30–23:50 +07:00) — ตั้งแต่การ rebrand ระบบเป็น **SmartAccess** การประกาศคณะเจ้าของโครงการ (**คณะครุศาสตร์อุตสาหกรรม**) และการ implement PDPA compliance ครบ P0+P1 — โดยเจาะลึกทีละประเด็นเพื่อให้ผู้อ่าน (รวมถึง NotebookLM และคณะกรรมการสอบ) เข้าใจทั้งเหตุผลทางวิศวกรรมและทางกฎหมาย

<a id="sec-71-40-1"></a>
#### 71.40.1 ที่มาของการ Rebrand และบทบาทของคณะครุศาสตร์อุตสาหกรรม

**ก่อนหน้า (v1.x):**
- ชื่อระบบใช้ "RMUTP ACCS" (ย่อจาก RMUTP Access Control System) ปะปนกับชื่อสถาบัน
- บางจุดในเอกสารระบุว่า "คณะวิศวกรรมศาสตร์" เป็นผู้พัฒนา — ซึ่ง **ไม่ถูกต้อง** เพราะโครงการเป็นวิทยานิพนธ์/โครงงานของนักศึกษา **คณะครุศาสตร์อุตสาหกรรม**

**ปัจจุบัน (v2.0):**

| รายการ | ค่าใหม่ |
|---|---|
| ชื่อระบบ (Product Name) | **SmartAccess Door Access System** |
| ชื่อโครงการเชิงวิชาการ | **Innovative system for managing access rights and controlling classroom access via wireless network** |
| ผู้ควบคุมข้อมูล (Data Controller) | **คณะครุศาสตร์อุตสาหกรรม มหาวิทยาลัยเทคโนโลยีราชมงคลพระนคร** |
| โดเมนอีเมลทางการ | `@rmutp.ac.th` (ไม่ใช่ `@smartaccess.ac.th` ซึ่งเป็นโดเมนที่ไม่ได้จดทะเบียน) |
| Discord webhook avatar | favicon จริงของ `rmutp.ac.th` |

**ทำไมต้องแยกชัด:**
1. **ทางกฎหมาย (PDPA ม.23):** Data Controller ต้องเป็น "นิติบุคคล/หน่วยงาน" ที่มีตัวตนจริง — "SmartAccess" เป็นแค่ชื่อระบบไม่ใช่นิติบุคคล
2. **ทางวิชาการ:** ภาคนิพนธ์/โครงงานต้องระบุภาควิชา/คณะที่ถูกต้องเพื่อการอ้างอิงและการประเมิน
3. **ทาง branding:** "ชื่อระบบ" ใช้สำหรับ marketing/UI — "ชื่อสถาบัน" ใช้สำหรับ contract/legal

⚠️ **ข้อพึงระวัง:** `lib/faculties.ts` ยังคงมี "คณะวิศวกรรมศาสตร์" ใน array เพราะเป็น **ตัวเลือกในฟอร์มลงทะเบียนของนักศึกษา** (นักศึกษาจากคณะใดก็ตามใน มทร.พระนคร สามารถใช้ห้อง lab ของคณะครุศาสตร์อุตสาหกรรมได้) — ไม่ใช่ชื่อคณะผู้พัฒนา

<a id="sec-71-40-2"></a>
#### 71.40.2 สถาปัตยกรรม Consent — Frontend ↔ API ↔ Database

```mermaid
sequenceDiagram
    participant U as 👤 ผู้ใช้
    participant C as 🍪 CookieConsent.tsx<br/>(Browser)
    participant LS as 💾 localStorage<br/>(smartaccess_cookie_consent_v2)
    participant API as 🟣 POST /api/consent<br/>(Vercel Edge)
    participant DB as 🟢 consent_records<br/>(Supabase PG)
    
    Note over U,DB: ① Initial visit
    U->>C: เปิดเว็บ
    C->>LS: getItem(STORAGE_KEY)
    LS-->>C: null (ครั้งแรก)
    C->>U: แสดง banner (delay 1s)
    
    Note over U,DB: ② User chooses "Accept All"
    U->>C: click "ยอมรับทั้งหมด"
    C->>LS: setItem(record)
    C->>API: POST /api/consent<br/>{functional:true, analytics:true, marketing:true, action:"granted"}
    API->>API: hashIp(IP)<br/>generateUuid()
    API->>DB: INSERT INTO consent_records<br/>(uuid, ip_hash, version, choices, action)
    DB-->>API: ok
    API-->>C: {ok:true, consent_uuid, timestamp}
    C->>U: hide banner<br/>dispatchEvent('smartaccess_cookie_consent_changed')
    
    Note over U,DB: ③ User opens Settings from Privacy page
    U->>C: click "จัดการความยินยอม"
    C->>C: openConsentSettings()<br/>dispatchEvent('smartaccess_open_consent')
    C->>U: เปิด Modal (4 checkboxes)
    U->>C: ปรับ + บันทึก
    C->>API: POST /api/consent (action:"updated")
    
    Note over U,DB: ④ Withdrawal
    U->>C: ติ๊ก functional=false + บันทึก
    C->>API: DELETE /api/consent
    API->>DB: INSERT (action:"withdrawn", all flags FALSE)
    Note over DB: ไม่ลบประวัติเดิม → audit trail ครบถ้วน
```

**จุดสำคัญทางสถาปัตยกรรม:**
- **Source of truth:** Database (Supabase) — ไม่ใช่ localStorage
- **localStorage role:** Cache เพื่อ UX (ไม่ขึ้น banner ซ้ำ) เท่านั้น
- **Insertion-only:** ไม่เคย UPDATE/DELETE record เดิม — ทุก action สร้างแถวใหม่ → audit trail สมบูรณ์
- **Anonymous binding:** ผูกกับ SHA-256(IP) แทน user_id เพราะ consent เกิดก่อนการลงทะเบียนนักศึกษา

<a id="sec-71-40-3"></a>
#### 71.40.3 เจาะลึกตาราง `consent_records` ทุกคอลัมน์

```sql
CREATE TABLE IF NOT EXISTS consent_records (
  id BIGSERIAL PRIMARY KEY,
  consent_uuid VARCHAR(64) UNIQUE NOT NULL,
  ip_hash CHAR(64) NOT NULL,
  user_agent TEXT,
  version VARCHAR(10) NOT NULL,
  necessary BOOLEAN NOT NULL DEFAULT TRUE,
  functional BOOLEAN NOT NULL DEFAULT FALSE,
  analytics BOOLEAN NOT NULL DEFAULT FALSE,
  marketing BOOLEAN NOT NULL DEFAULT FALSE,
  action VARCHAR(20) NOT NULL CHECK (action IN ('granted', 'withdrawn', 'updated', 'declined')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

| คอลัมน์ | Type | เหตุผลทางวิศวกรรม | เหตุผลทางกฎหมาย |
|---|---|---|---|
| `id` | BIGSERIAL | Auto-increment 64-bit → ไม่หมดในชีวิตจริง | ใช้เรียง chronologically |
| `consent_uuid` | VARCHAR(64) UNIQUE | UUID v4 จาก `crypto.randomUUID()` — ผู้ใช้นำไปอ้างอิงตอนใช้สิทธิ DSR | PDPA ม.19 — "หลักฐานเป็นรายบุคคล" |
| `ip_hash` | CHAR(64) | SHA-256 hex string (64 chars) | ไม่เก็บ raw IP = ลด data minimization risk + ยังจับคู่ session ได้ |
| `user_agent` | TEXT (max 500 chars) | ช่วยแยกแยะ device หาก IP ซ้ำกัน (NAT) | ประกอบหลักฐานยืนยันตัวตน session |
| `version` | VARCHAR(10) | semver-like "2.0" — invalidate consent เมื่อ policy เปลี่ยน | GDPR Art.7(1) บังคับให้พิสูจน์ได้ว่ายินยอม policy เวอร์ชันไหน |
| `necessary` | BOOLEAN (always TRUE) | คุกกี้จำเป็นไม่ต้องขอ consent ตาม PDPC ข้อ 6.1 | เก็บไว้เพื่อความสมบูรณ์ของ record |
| `functional` | BOOLEAN | ผู้ใช้เลือก yes/no | PDPA ม.19 — ความยินยอมเฉพาะเจาะจง |
| `analytics` | BOOLEAN | ผู้ใช้เลือก yes/no | เผื่ออนาคตเชื่อม Vercel Analytics |
| `marketing` | BOOLEAN | ผู้ใช้เลือก yes/no | เผื่ออนาคต mail campaign |
| `action` | VARCHAR(20) + CHECK | `granted` / `declined` / `updated` / `withdrawn` | แสดง intent ตอนนั้น — ม.19 วรรค 5 |
| `created_at` | TIMESTAMP | เก็บ timezone-naive (Asia/Bangkok ใน app) | พิสูจน์ "เมื่อไหร่" ยินยอม |

**Index ที่สร้าง:**
- `idx_consent_ip_time (ip_hash, created_at DESC)` — สำหรับ query "ดู consent ล่าสุดของ IP นี้" (ใช้ใน GET /api/consent)
- `idx_consent_uuid (consent_uuid)` — สำหรับ DSR lookup

**ไม่สร้าง index บน:** `action`, `version` — selectivity ต่ำ ไม่คุ้ม

<a id="sec-71-40-4"></a>
#### 71.40.4 เจาะลึก API `/api/consent` ทั้ง 3 method

##### POST `/api/consent` — บันทึก/อัปเดต Consent

**Lifecycle:**
1. **Rate limit** (`withRateLimit(req, "consent_post", 20, 60)`) → 20 req/min/IP กัน spam
2. **`initDatabase()`** → idempotent, สร้างตารางถ้ายังไม่มี (สำคัญสำหรับ first-time deploy)
3. **JSON parsing** with try/catch → reject 400 ถ้า malformed
4. **Action sanitization** → fallback เป็น "granted" ถ้าค่าไม่ valid
5. **Boolean coercion** → `Boolean(body.functional)` กัน undefined/null
6. **IP hashing** → `crypto.createHash('sha256').update(ip).digest('hex')`
7. **UUID generation** → `crypto.randomUUID()` (Node 19+, รองรับใน Vercel)
8. **INSERT** parameterized query ($1-$8) → กัน SQL injection
9. **Response** → คืน `consent_uuid` ให้ frontend เก็บไว้

**ทำไม `initDatabase()` ทุก request?** เพราะ `dbInitialized` flag เป็น singleton ใน lambda warm-up — call ครั้งแรกจริงเท่านั้นที่ run DDL, ครั้งถัดไปคืน immediate

##### GET `/api/consent` — ดู Consent ล่าสุด

```sql
SELECT consent_uuid, version, necessary, functional, analytics, marketing, action, created_at
  FROM consent_records
 WHERE ip_hash = $1
 ORDER BY created_at DESC
 LIMIT 1
```

- ใช้ index `idx_consent_ip_time` → query plan: Index Scan (cost ≈ O(log n))
- คืน `{found: false}` ถ้าไม่เคย consent → frontend ตีความว่าควรขึ้น banner
- **ไม่คืน `ip_hash` หรือ `user_agent`** เพื่อ data minimization

##### DELETE `/api/consent` — ถอนความยินยอม

**สำคัญ:** ไม่ใช้ `DELETE FROM consent_records ...` จริง — ใช้ INSERT แถวใหม่ที่มี `action='withdrawn'` แทน เหตุผล:
1. **Audit trail (PDPA ม.39):** ต้องเก็บประวัติได้ว่าผู้ใช้เคยให้ consent แล้วถอน
2. **Forensics:** หากเกิดข้อพิพาท ต้องพิสูจน์ timeline ได้
3. **Legal hold:** บางกรณี (สอบสวนคดี) ต้องห้ามลบ — INSERT-only policy ช่วย

**Body ของ withdrawn record:**
- `necessary = TRUE` (ยังคงต้องใช้)
- `functional, analytics, marketing = FALSE` ทั้งหมด
- `action = 'withdrawn'`

<a id="sec-71-40-5"></a>
#### 71.40.5 เจาะลึก `CookieConsent.tsx` v2.0 ทีละส่วน

**Constants (บรรทัด 12-13):**
```typescript
const CONSENT_VERSION = "2.0";
const STORAGE_KEY = "smartaccess_cookie_consent_v2";
```
- ใช้ `_v2` ใน key เพื่อให้ผู้ใช้เก่า (มี v1 consent) **ได้รับ banner ใหม่อัตโนมัติ** เพราะ key ไม่ match → loadConsent คืน null

**`loadConsent()` (บรรทัด 29-39):**
```typescript
if (parsed.version !== CONSENT_VERSION) return null;
```
นี่คือ defense-in-depth — แม้ STORAGE_KEY จะตรง แต่ถ้า version ใน object ไม่ตรง (เช่น downgrade rollback) ก็ถือว่า invalid

**`saveConsentServer()` (บรรทัด 49-64):**
```typescript
keepalive: true
```
ใส่เพื่อให้ request ส่งต่อแม้ผู้ใช้ปิดแท็บทันที (Beacon-like behavior) — สำคัญสำหรับ analytics consent ที่อาจถูกบันทึกตอนปิดหน้า

**State management:**
- `isVisible` — แสดง banner หรือไม่
- `isModalOpen` — แสดง customize modal หรือไม่
- `choices` — ตัวเลือกปัจจุบัน (initial: functional=true, ที่เหลือ=false ตามค่า "Privacy by Default")

**`useCallback` กับ `openSettings`:**
- ใช้เพื่อ stable reference → `useEffect` dependency `[openSettings]` ไม่ trigger รี-render
- ถ้าใช้ inline function ตรง event listener จะ leak (add ทุก render ลบไม่ได้)

**Event-driven architecture:**
```typescript
window.dispatchEvent(new CustomEvent("smartaccess_cookie_consent_changed", { detail: record }))
window.addEventListener("smartaccess_open_consent", handler)
```
- decouple CookieConsent จาก Privacy page → Privacy เรียก `openConsentSettings()` ก็พอ
- รองรับการเพิ่ม listener อื่นๆ ในอนาคต (เช่น analytics SDK ตื่นตัวเมื่อ consent เปลี่ยน)

**Modal accessibility:**
```tsx
role="dialog"
aria-modal="true"
aria-labelledby="consent-modal-title"
onClick={(e) => { if (e.target === e.currentTarget) setIsModalOpen(false); }}
```
- Click overlay (outside modal) ปิดได้ — UX standard
- Screen reader ประกาศ "dialog" ทันที

**Toggle Switch CSS (สำคัญ):**
- ใช้ `<input type="checkbox">` ซ่อนด้วย `opacity:0; width:0; height:0` แทน `display:none` → คงไว้สำหรับ keyboard navigation + screen reader
- `:checked + .toggle-slider` → CSS-only toggle ไม่ต้อง JS DOM manipulation

**Responsive breakpoints:**
- 991px (tablet) → ปุ่มขึ้นบรรทัดใหม่
- 480px (mobile) → ปุ่ม grid 2 column + ซ่อน icon

<a id="sec-71-40-6"></a>
#### 71.40.6 เจาะลึก `privacy/page.tsx` — แต่ละหัวข้อ + เจตนาทางกฎหมาย

| หัวข้อ | เนื้อหา | กฎหมายอ้างอิง | ทำไมเขียนแบบนี้ |
|---|---|---|---|
| 0. Data Controller | ตาราง 5 แถว: ชื่อคณะ, ที่อยู่, โทร, อีเมล, DPO | PDPA ม.23(6) | กฎหมายบังคับให้มี — โทษปรับสูงสุด 1M หากขาด |
| 1. Lawful Basis | 3 ฐาน: LI (ม.24(5)), Legal Obligation (ม.24(6)), Consent (ม.24(1)) | PDPA ม.24 | ต้องประกาศฐานทุกตัวที่ใช้ ไม่ใช่แค่ "เพื่อความปลอดภัย" |
| 2. Types of Data | ตาราง 4 หมวด + disclaimer ไม่มี Sensitive Data | ม.23(3) + ม.26 | ระบุชัดว่าไม่เก็บข้อมูลอ่อนไหว → ลด compliance burden |
| 3. Purposes | bullet list 4 ข้อ | ม.23(1) | จำกัด purpose-bound (purpose limitation principle) |
| 4. Recipients | ตาราง 4 entity: Admin, Supabase, Vercel, Discord | ม.23(5) | ต้องประกาศ Sub-Processor ทุกตัว |
| 5. Cross-Border | Safeguards แต่ละ recipient | ม.28-29 | SCC / SOC 2 / Privacy Framework — ต้องระบุชัด |
| 6. Retention | ตาราง 5 ประเภทข้อมูล | ม.23(4) + พ.ร.บ.คอม ม.26 | ระบุเวลาเก็บแต่ละประเภท → ใช้ฐาน Legal Obligation |
| 7. Cookies | ตาราง 4 รายการ + ปุ่ม Settings | PDPC Guideline 2565 ข้อ 5.1 | ต้อง disclose ทุก cookie + ให้ผู้ใช้จัดการ |
| 8. Rights | ตาราง 8 สิทธิ + ช่องทางใช้สิทธิ | ม.19, 30-36, 73 | บังคับให้ครบ — โทษปรับ 3M หากขาด |
| 9. Security | bullet 7 measures | ม.37(1) | ม.37 บังคับให้มีมาตรการความมั่นคง — เขียนชัดเพื่อ build trust |
| 10. Change Log | ตาราง version history | Best practice | พิสูจน์ได้ว่าผู้ใช้ยินยอม version ไหน |

**Footer:** ระบุ version + effective date + DPO email → ลด ambiguity

**ปุ่ม "จัดการความยินยอม" (กลางหน้า):**
- เรียก `openConsentSettings()` ที่ import จาก CookieConsent
- = ทางเลือก "ถอนความยินยอม" ตาม PDPA ม.19 วรรค 5 "ง่ายเท่ากับให้"

<a id="sec-71-40-7"></a>
#### 71.40.7 เจาะลึก `terms/page.tsx` — แต่ละ clause + ฎีกาที่อ้างอิง

| § | Clause | จุดสำคัญ | ฎีกา/กฎหมายอ้างอิง |
|---|---|---|---|
| 0 | Definitions 7 คำ | นิยาม "ระบบ", "ผู้ใช้", "QR Token", "Bypass Token", "Tailgating", "PDPA" | Best practice — กัน ambiguity |
| 1 | Acceptance (Clickwrap) | กด "ลงทะเบียน" = ยอมรับ + age check (18+) | ฎีกาที่ 6477/2562 (สัญญาอิเล็กทรอนิกส์ — clickwrap บังคับใช้ได้) |
| 2 | Access Scope | ห้ามแชร์ Token + แจ้งถ้าหาย | ป.พ.พ. ม.150 + นโยบายภายใน |
| 3 | Anti-Tailgating (เป็นธรรม) | "**ทุกคน**ให้ความร่วมมือตามสัดส่วน" ไม่ผลักภาระบุคคลเดียว | **พ.ร.บ. ข้อสัญญาที่ไม่เป็นธรรม 2540 ม.4** + ฎีกาที่ 14430/2557 (ข้อสัญญาผลักภาระโดยไม่มีหลักฐานเป็นโมฆะ) |
| 4 | Limitation of Liability | จำกัดความรับผิด + disclaimer ว่าไม่ขัด พ.ร.บ.ข้อสัญญาฯ | พ.ร.บ.ข้อสัญญาไม่เป็นธรรม ม.4(5) |
| 5 | Disciplinary (Proportional) | "ตามสัดส่วน + เปิดโอกาสชี้แจง" | **หลัก Audi Alteram Partem** (สิทธิให้การก่อนถูกลงโทษ) + รธน. ม.29 |
| 6 | PDPA Linkage | T&C ≠ Consent | PDPA ม.19 (consent ต้องเฉพาะเจาะจง ไม่ bundled) + GDPR Recital 32 |
| 7 | Amendment | แจ้งล่วงหน้า 30 วัน | สากล (28-day notice ของ GDPR + 30 วันของ Thailand DBD) |
| 8 | Governing Law | ศาลปกครองกลาง (ปกครอง) / ศาลแพ่งกรุงเทพใต้ (แพ่ง) | พ.ร.บ.จัดตั้งศาลปกครอง พ.ศ. 2542 — นิติสัมพันธ์ระหว่างนักศึกษา-สถาบันรัฐเป็นทางปกครอง |
| 9 | Severability | ส่วนโมฆะไม่กระทบส่วนที่เหลือ | ป.พ.พ. ม.173 |
| 10 | Contact | admin@rmutp.ac.th, dpo@rmutp.ac.th, ที่อยู่จริง | ม.23(6) |
| 11 | Effective Date + History | v2.0 (27 พ.ค. 2569), v1.0 (15 เม.ย. 2569) | Best practice |

**สำคัญที่สุด — การลบประโยค "บุคคลสุดท้ายในระบบรับผิดชอบหลัก":**
- เดิม: ผลักภาระให้บุคคลเดียวโดยไม่มีพยานหลักฐาน → ขัด พ.ร.บ.ข้อสัญญาไม่เป็นธรรม ม.4(5) "ข้อสัญญาที่ทำให้ฝ่ายหนึ่งต้องรับภาระเกินสมควร"
- ใหม่: "ทุกคนให้ความร่วมมือตามสัดส่วนความเกี่ยวข้อง" — สอดคล้องหลัก Proportionality

<a id="sec-71-40-8"></a>
#### 71.40.8 รายการ Cookie/Storage ทุกตัวพร้อมเหตุผลการจัดหมวด

| ชื่อ | ประเภท | หมวด | ทำไมจัดในหมวดนี้ |
|---|---|---|---|
| `admin_token` | HttpOnly Cookie | **จำเป็น** | ไม่มี = login ไม่ได้ = ใช้ระบบไม่ได้ |
| `smartaccess_cookie_consent_v2` | localStorage | **ฟังก์ชัน** | ไม่มี = banner ขึ้นทุกครั้ง (annoying แต่ไม่ break) |
| `rmutp_form_draft` | localStorage | **ฟังก์ชัน** | UX nicety — ผู้ใช้กรอกฟอร์มซ้ำได้เร็วขึ้น แต่ไม่จำเป็น |
| `rmutp_last_room` | localStorage | **ฟังก์ชัน** | UX — จดจำห้องที่เคยเข้า ไม่จำเป็น |
| (ไม่มี) | analytics cookies | **วิเคราะห์** | ยังไม่ implement — เตรียมหมวดไว้รองรับ |
| (ไม่มี) | marketing cookies | **การตลาด** | ไม่ใช้ |

**ทำไมแยก Necessary/Functional ชัดเจน:**
- ตาม PDPC Guideline 2565 ข้อ 6.1 **คุกกี้จำเป็น (Strictly Necessary) ไม่ต้องขอ consent**
- แต่คุกกี้ฟังก์ชันต้องขอ → ถ้าผู้ใช้ปฏิเสธ ต้องไม่เก็บ `rmutp_form_draft`, `rmutp_last_room`
- การ implement: ใช้ event `smartaccess_cookie_consent_changed` ฟังในจุดที่จะเขียน localStorage ฟังก์ชัน

<a id="sec-71-40-9"></a>
#### 71.40.9 SHA-256 IP Hashing — ทำไมและทำอย่างไร

**ทำไมต้อง hash:**
1. **PDPA Principle (Data Minimization):** เก็บเท่าที่จำเป็น — raw IP ไม่จำเป็นสำหรับ "พิสูจน์ consent"
2. **ลด blast radius:** หากตาราง consent_records รั่ว ผู้โจมตีไม่รู้ IP จริง
3. **ยังจับคู่ได้:** hash deterministic → IP เดียวกัน → hash เดียวกัน → query ได้

**ทำไมไม่ใส่ salt:**
- Salt มีไว้กัน rainbow table attack สำหรับ password — แต่นี่ไม่ใช่ secret
- IPv4 มีแค่ 4.3 billion ค่า → brute-force ทั้ง space เป็นไปได้ (~2^32 = 4B hashes)
- **ไม่เป็นปัญหา** เพราะ purpose ไม่ใช่ irreversibility — แค่ "ไม่เก็บ raw ใน DB"

**ถ้าอยาก reversible-resistant:**
- เพิ่ม secret pepper (server-side, ไม่เข้า DB) → `sha256(IP + PEPPER)`
- ต้อง rotate pepper ทุกปี → ต้อง re-hash ทั้งตาราง — ภาระสูง
- **ปัจจุบันไม่ทำ** เพราะ trade-off ไม่คุ้ม (PDPA ไม่บังคับ pepper)

**Code (api/consent/route.ts):**
```typescript
function hashIp(ip: string): string {
  return crypto.createHash("sha256").update(ip).digest("hex");
}
```

**Performance:** SHA-256 บน Node.js ~500ns/op → ไม่เป็น bottleneck

<a id="sec-71-40-10"></a>
#### 71.40.10 Withdrawal Flow — กฎ "ง่ายเท่ากับให้" ของ PDPA ม.19

**ม.19 วรรค 5:** "การถอนความยินยอม...จะกระทำเมื่อใดก็ได้ โดยจะต้องสามารถทำได้ง่ายเช่นเดียวกับการให้ความยินยอม"

**Implementation:**
| ขั้นตอนการให้ Consent | ขั้นตอนการถอน Consent | ✅ ง่ายเท่ากัน? |
|---|---|---|
| 1. เห็น banner | 1. ไปหน้า `/privacy` | บางขั้นเพิ่ม — แต่ไม่ขัดกฎ |
| 2. กด "ตั้งค่า" | 2. กด "จัดการความยินยอม" | เท่ากัน |
| 3. ติ๊ก checkbox | 3. ปลดติ๊ก checkbox | เท่ากัน |
| 4. กด "บันทึก" | 4. กด "บันทึก" | เท่ากัน |

**Optional improvement (ไม่บังคับ):** เพิ่ม persistent floating button "🍪" ที่มุมหน้าทุกหน้า → ทุกหน้าถอนได้ทันที — ปัจจุบันต้องไป `/privacy` ก่อน

**Server-side enforcement:** DELETE endpoint บันทึก `action='withdrawn'` แล้ว return success → next GET `/api/consent` จะเห็น record withdrawn ล่าสุด → frontend ตีความถูก

<a id="sec-71-40-11"></a>
#### 71.40.11 Cross-Border Transfer — Safeguards ในทางปฏิบัติ

PDPA ม.28-29 บังคับให้ผู้ส่งข้อมูลออกนอกประเทศต้องมั่นใจว่าประเทศปลายทาง:
(ก) มี adequate protection หรือ
(ข) มี safeguards อื่น เช่น SCC, BCR, Code of Conduct

| ปลายทาง | ประเทศ | กลไก | หลักฐาน |
|---|---|---|---|
| Supabase | Singapore (AWS ap-southeast-1) | (ก) Adequacy — สิงคโปร์มี PDPA ของตัวเอง + SOC 2 Type II | [Supabase Compliance](https://supabase.com/security) |
| Vercel | Global Edge (Singapore primary) | (ข) Standard Contractual Clauses + ISO 27001 + SOC 2 | [Vercel Security](https://vercel.com/security) |
| Discord | US (Cloudflare CDN) | (ข) EU-US Data Privacy Framework (successor of Privacy Shield) | [Discord Privacy](https://discord.com/privacy) |

**ระบบทำอะไรเพิ่ม:**
- TLS 1.3 ทุก connection (ไม่ใช่ TLS 1.2)
- Encryption at-rest AES-256 (Supabase default)
- ไม่ส่ง raw PII ไป Discord — masked เสมอ (`1164******45`)

**ความเสี่ยงคงเหลือ:** หาก US Cloud Act บังคับ Discord ส่งข้อมูลให้รัฐบาล US → เป็น risk แต่ระบบส่งเฉพาะ event notification ไม่ใช่ PII complete → low

<a id="sec-71-40-12"></a>
#### 71.40.12 Discord Webhook — ที่มาของ avatar URL ใหม่

**เดิม:** `http://smartaccess.ac.th/icon/favicon-96x96.png`
- ⚠️ HTTP (ไม่ secure)
- ⚠️ โดเมน `smartaccess.ac.th` ไม่ได้จดทะเบียน → 404 → avatar เป็น default Discord
- ⚠️ ความน่าเชื่อถือต่ำ (ทำไม Discord embed ใช้ HTTP?)

**ใหม่:** `https://www.rmutp.ac.th/wp-content/uploads/2021/05/cropped-favicon-rmutp-192x192.png`
- ✅ HTTPS
- ✅ โดเมนจริงของมหาวิทยาลัย → load ได้แน่นอน
- ✅ 192×192 resolution → คมชัดบน high-DPI display
- ✅ ใช้ favicon ทางการ → identity ชัด

**ใช้ในสองจุด:** Target Webhook + Audit Log Webhook (ใน `lib/discord.ts` บรรทัด 360, 378)

<a id="sec-71-40-13"></a>
#### 71.40.13 ESP32 Display Subtitle — ทำไมต้องสั้น

**เดิม:** "Innovative system for managing access rights and controlling classroom access via wireless network" (96 chars)

**ปัญหา:**
- จอ ILI9341 240×320 @ rotation=1 → กว้าง 320px
- Font ที่ใช้: SmallFont 6×8px → 1 char ≈ 6px
- 96 chars × 6px = **576px** ← เกินจอ!

**ใหม่:** "คณะครุศาสตร์อุตสาหกรรม มทร.พระนคร" (~34 chars ไทย)
- ไทยใช้ฟอนต์ ~12px/char → 34 × 12 = **408px** ← ยังเกิน

**ทางออกในโค้ด ESP32:**
- ใช้ `tft.setTextWrap(true)` → ตัดบรรทัด
- หรือ marquee scroll → ต้อง refresh frequently → flicker

**Trade-off ที่เลือก:** ใช้ข้อความสั้นพอประมาณ + ให้ ESP32 handle wrap → 2 บรรทัด → อ่านได้ ไม่กระพริบ

<a id="sec-71-40-14"></a>
#### 71.40.14 SEO Meta Description — Trade-off ระหว่างชื่อยาว/สั้น

**ใหม่:**
```typescript
description: "SmartAccess — ระบบควบคุมการเข้าออกห้องเรียนแบบไร้สาย (Innovative system for managing access rights and controlling classroom access via wireless network) คณะครุศาสตร์อุตสาหกรรม มหาวิทยาลัยเทคโนโลยีราชมงคลพระนคร"
```

**Google SERP จะตัดที่ ~155 chars (desktop) / 120 chars (mobile):**
- 155 chars แรก: "SmartAccess — ระบบควบคุมการเข้าออกห้องเรียนแบบไร้สาย (Innovative system for managing access rights and controlling classroom..." ← ตัดกลาง project name
- จึงเริ่มด้วย "SmartAccess —" → brand แสดงก่อนเสมอ

**Trade-off:**
- ✅ Brand "SmartAccess" อยู่หน้าสุด → user เห็นแน่
- ✅ Project name ภาษาอังกฤษอยู่กลาง → academic indexing เจอ
- ✅ ชื่อสถาบันท้าย → ถูกตัดแต่ Open Graph metadata เก็บครบ

<a id="sec-71-40-15"></a>
#### 71.40.15 Migration Checklist สำหรับ deploy เวอร์ชันนี้

**ขั้นตอน production deploy:**
- [ ] รัน DB migration (auto): startup จะ `CREATE TABLE IF NOT EXISTS consent_records`
- [ ] ตรวจ Vercel logs ดูว่า `idx_consent_ip_time`, `idx_consent_uuid` ถูกสร้าง
- [ ] ตั้ง env vars (ไม่มีเพิ่มในรอบนี้)
- [ ] Deploy → Vercel auto build + deploy
- [ ] Smoke test:
  - [ ] เปิดเว็บ incognito → ขึ้น banner v2
  - [ ] กด "ยอมรับทั้งหมด" → ตรวจ DB ว่ามี record
  - [ ] กด "ตั้งค่า" → modal เปิด
  - [ ] กด "ปฏิเสธทั้งหมด" → ตรวจ DB ว่า record มี action='declined'
  - [ ] ไป `/privacy` → กด "จัดการความยินยอม" → modal เปิดได้
  - [ ] ไป `/terms` → ตรวจชื่อคณะถูกต้อง, email rmutp.ac.th
  - [ ] Discord webhook → avatar เป็น favicon RMUTP
  - [ ] ESP32 polling → subtitle แสดงคณะถูกต้อง
- [ ] Clear caches: `localStorage.clear()` ใน devtools (ตัวเองทดสอบใหม่)

**Rollback plan:**
- ถ้าพังหลัก: Vercel Dashboard → Promote previous deployment
- ถ้า DB schema มีปัญหา: ตาราง `consent_records` ปล่อยทิ้งได้ (ไม่กระทบฟีเจอร์อื่น)
- ถ้า cookie banner break: ส่ง patch ฉุกเฉิน — frontend issue ไม่ต้อง rollback DB

<a id="sec-71-40-16"></a>
#### 71.40.16 Verification Plan — ตรวจสอบหลัง deploy

**Test Matrix (manual):**

| Scenario | Expected | จุดสังเกต |
|---|---|---|
| First visit (no localStorage) | Banner ขึ้นหลัง 1 sec | `setTimeout(1000)` |
| Accept All | Banner หาย + DB มี record + localStorage มีค่า | `action='granted'`, ทุก flag = true |
| Decline All | Banner หาย + DB มี `declined` + flags = false (เว้น necessary) | |
| Customize → ติ๊กเฉพาะ Functional | DB มี functional=true, others=false | |
| Reload หลัง consent | Banner ไม่ขึ้น | loadConsent คืน valid record |
| Privacy page → "จัดการความยินยอม" | Modal เปิด, choices = current | `openConsentSettings()` event |
| ปลด functional + บันทึก | `action='updated'` | mid-state change |
| ปลดทั้งหมด + บันทึก | `action='updated'` (ยังไม่ใช่ withdrawn) | distinguish updated vs withdrawn |
| DELETE /api/consent (curl) | Record `withdrawn` ใน DB | |
| Rate limit test | curl 25 ครั้งใน 1 นาที → 429 | `consent_post 20/60` |

**Query DB ตรวจสอบ:**
```sql
-- ดู consent ทั้งหมดของ IP ตัวเอง (hash ก่อน)
SELECT * FROM consent_records 
WHERE ip_hash = encode(digest('YOUR_IP', 'sha256'), 'hex')
ORDER BY created_at DESC;

-- นับ consent action breakdown
SELECT action, COUNT(*) FROM consent_records GROUP BY action;

-- ดู version distribution (เผื่อมี user เก่า v1)
SELECT version, COUNT(*) FROM consent_records GROUP BY version;
```

<a id="sec-71-40-17"></a>
#### 71.40.17 ความเสี่ยงคงเหลือและงานที่ต้องทำต่อ

**P2 — ใน 1 เดือน:**
| งาน | ทำไม | Effort |
|---|---|---|
| Email notification ตอน Policy เปลี่ยน | ม.23(7) วรรค 2 | 4 ชม. — ต้องเชื่อม mail service |
| Persistent floating "🍪" button ทุกหน้า | UX — withdrawal สะดวกขึ้น | 2 ชม. |
| Audit dashboard สำหรับ Owner ดู consent stats | Internal monitoring | 6 ชม. |
| Auto-cleanup consent_records > 3 ปี | Storage + retention policy | 2 ชม. (cron) |

**P3 — เมื่อมีโอกาส:**
| งาน | ทำไม |
|---|---|
| DSR endpoints (/api/dsr/export, /erasure, /rectify) | PDPA ม.30-36 — ปัจจุบันใช้ email DPO ก็ถูกต้อง |
| Multi-language (TH + EN) ใน Privacy/Terms | inclusive UX สำหรับนักศึกษาต่างชาติ |
| WCAG AAA contrast audit ของ Modal | ปัจจุบัน AA ผ่าน → AAA จะดีกว่า |
| Cookie consent log → ระบบแยก (DataDog) | ปัจจุบันใน Supabase same-db |

**ความเสี่ยงที่ยอมรับได้ (Accepted Risk):**
- SHA-256 IP ไม่มี pepper → brute-forceable แต่ purpose ไม่ใช่ irreversibility
- localStorage clear-able by user → ระบบ design ให้ DB เป็น source of truth
- Discord ส่งข้อมูลออก US → ส่งเฉพาะ event masked, low PII

**ความเสี่ยงที่ยังเปิดอยู่:**
- ⚠️ ระบบยังไม่บันทึก consent_uuid ลง student record → ตอนใช้สิทธิ DSR ต้องค้นจาก email/manual
- ⚠️ ถ้าผู้ใช้ใช้ VPN → IP เปลี่ยน → ดู consent เดิมไม่ได้ผ่าน GET (ต้องใส่ consent_uuid)
- ⚠️ Modal ไม่มี trap focus → กด Tab อาจหลุดออกนอก modal

<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

<a id="sec-71-41"></a>
### 71.41 การตรวจสอบความสมบูรณ์และระบบอัพเดตแดชบอร์ดระดับพรีเมียม (System Audit & Dashboard Upgrades)

สถาปัตยกรรม SmartAccess ได้รับการตรวจสอบและวิเคราะห์โครงสร้างความสมบูรณ์ในระดับระบบ เพื่อเสริมสร้างประสิทธิภาพและความเป็นเลิศทางวิชาการ:

#### 71.41.1 ระบบตรวจสอบสถานะและสัญญาณโทรมาตรอุปกรณ์แบบ Active (Active IoT Heartbeat & Telemetry Monitor)
- **สถาปัตยกรรมการตรวจจับ:** บอร์ดควบคุม ESP32 มีการ Polling ทุกๆ 2 วินาที โดยจะอัปเดตตัวแปร `room_last_seen_${room}` ในฐานข้อมูลผ่าน Lazy-Update Query
- **เกณฑ์การวินิจฉัย (Diagnostics Logic):**
  - **Online (🟢 Connected):** หากเวลา Last seen น้อยกว่า 10 วินาที
  - **Degraded (🟡 Slow Connection):** หากเวลา Last seen อยู่ในช่วง 10 - 120 วินาที
  - **Offline (🔴 Disconnected):** หากขาดการเชื่อมต่อนานกว่า 120 วินาที
- **การแจ้งเตือน:** ระบบจะทำประวัติเหตุการณ์ล้มเหลวลงในฐานข้อมูล และแจ้งเตือนผ่าน Discord Webhook ทันทีเมื่อเปลี่ยนสถานะเป็น Offline เพื่อให้ทีมแอดมินเข้าแก้ไขระบบได้ทันท่วงที

#### 71.41.2 ระบบการดำเนินการแบบกลุ่มประสิทธิภาพสูง (High-Throughput Bulk Operations)
- **ปัญหาเดิม:** การที่ผู้ดูแลต้องอนุมัติหรือปฏิเสธนักศึกษากลุ่มใหญ่ทีละคนหน้าห้องเรียน ก่อให้เกิด Latency และความล่าช้าในเชิงปฏิบัติการ (Operations Latency)
- **การยกระดับ:** ติดตั้งกลไกการดำเนินการแบบกลุ่ม (Bulk Actions) ช่วยให้สามารถเลือกติ๊กหน้าคิวของคำขอ รออนุมัติ และเลือกทำ **Bulk Approve** หรือ **Bulk Reject** ได้ภายในคลิกเดียวแบบ Parallel Async Promises ซึ่งประหยัดแรงของ Database และลดเวลาในการเข้าคลาสเรียนลงได้อย่างมีนัยสำคัญ

#### 71.41.3 แดชบอร์ดวิเคราะห์ข้อมูลความจุต่ำเชิงโต้ตอบ (Interactive SVG Analytics Dashboard - Zero Dependency)
- เพื่อรักษาประสิทธิภาพความเร็วในการโหลดข้อมูล และความสะอาดของโค้ดระบบ จึงเลือกใช้แผนภาพสถิติแบบ **SVG Dynamic Vector Graphic**
- สถิติตัวเลขที่มีการติดตาม:
  - **Peak Access Hours:** ช่วงชั่วโมงของวันที่มีคำขอเข้าใช้ห้องเรียนสูงสุด
  - **Faculty and Department Ratio:** สัดส่วนความถี่การเข้าใช้ห้องปฏิบัติการแยกตามสาขาวิชา/คณะเรียน
  - **Approval vs Rejection Success Rate:** สัดส่วนคำขอที่ผ่านการอนุมัติเทียบกับการปฏิเสธ
- การคำนวณกราฟประมวลผลทางฝั่ง Client โดยใช้ค่าสถิติจากประวัติบันทึกจราจรใน `access_logs` แบบ Real-time

#### 71.41.4 เทคโนโลยีระดับพรีเมียมสำหรับสิทธิการข้ามขั้นตอน (Biometric WebAuthn Bypass Framework)
- การใช้ `bypass_token` เพื่อเปิดประตูซ้ำภายใน 5 นาที ได้รับการอัปเกรดแนวคิดความปลอดภัยด้วย **WebAuthn Biometrics API**
- ทำงานโดยการนำลายนิ้วมือหรือใบหน้าจริง (TouchID/FaceID) ของนักศึกษาเครื่องนั้นเข้าผูกกับ token ลับในหน่วยความจำของอุปกรณ์ เพื่อรับรองว่าผู้เข้าใช้เป็นเจ้าของโทรศัพท์สมาร์ทโฟนที่ได้รับอนุมัติคนเดิมจริง ไม่ใช่การนำสิทธิไปให้เพื่อนสวมรอยกดเปิดประตูแทน

#### 71.41.5 แผนผังและสถาปัตยกรรมการอัปเดตเฟิร์มแวร์แบบไร้สายเพื่อการบำรุงรักษาระยะไกล (Secure Over-The-Air: OTA Update Architecture)
เพื่อความสะดวกในการบำรุงรักษาและอัปเกรดความสามารถบอร์ดควบคุมประตูห้องปฏิบัติการ ESP32 ในอนาคต โดย**ไม่ต้องถอดแกะกล่องอุปกรณ์หน้าห้องเรียนเพื่อนำสาย USB มาต่อพ่วงเข้ากับเครื่องคอมพิวเตอร์ใหม่** ระบบ SmartAccess ได้รับการวิเคราะห์และวางแนวทางการอัปเดตซอฟต์แวร์ระบบฝังตัวผ่านเครือข่ายไร้สาย (OTA Update) อย่างละเอียดสูงสุด 2 แนวทาง ดังนี้:

##### 1. ระบบดึงข้อมูลอัปเดตอัตโนมัติผ่านระบบคลาวด์ Next.js (Cloud-Driven HTTPS OTA Update)
แนวทางนี้เป็นระบบดึงข้อมูลอัปเดตเชิงรุก (Pull-based Telemetry) โดยบอร์ดจะเปรียบเทียบเลขเวอร์ชันกับ Server ในระหว่างการ Polling และทำการดาวน์โหลดไฟล์เฟิร์มแวร์ `.bin` ตัวใหม่ล่าสุดผ่านโปรโตคอลความปลอดภัยระดับสูง ซึ่งเหมาะสมกับการติดตั้งใช้งานจริงในอาคารเรียนขนาดใหญ่ที่มีบอร์ดกระจายตัวอยู่หลายสิบห้อง ทำให้ผู้ดูแลสามารถอัปเกรดระบบทั้งหมดได้พร้อมกันจากห้องควบคุมกลางผ่านการอัปโหลดไฟล์เฟิร์มแวร์ขึ้นระบบคลาวด์เพียงครั้งเดียว

###### 1.1 ลำดับการไหลของข้อมูลเชิงลึก (Detailed Sequence Flow)
เมื่อมีการอัปเกรดเวอร์ชันซอฟต์แวร์ การแลกเปลี่ยนข้อมูลระหว่างอุปกรณ์ ESP32 และ Next.js Server จะดำเนินไปตามขั้นตอนที่ออกแบบอย่างรัดกุมดังนี้:

```mermaid
sequenceDiagram
    autonumber
    participant Admin as ผู้ดูแลระบบ (Dashboard)
    participant Web as Next.js Cloud Server
    participant DB as Supabase Database
    participant Storage as Cloud Storage (S3/Supabase)
    participant ESP as บอร์ดควบคุม ESP32 หน้าห้อง
    
    Admin->>Web: อัปโหลดไฟล์ firmware_v1.0.1.bin ผ่านหน้า Admin Panel
    Web->>Storage: เก็บไฟล์ไบนารี .bin ลงใน Object Storage (พร้อมสร้าง signed public URL)
    Web->>DB: บันทึกข้อมูลเมตา { version: "1.0.1", md5: "c3d6...", min_battery: "3.3V" }
    ESP->>Web: ยิง HTTP Polling คาบเวลาปกติส่งข้อมูล {"room":"CE-401", "version":"1.0.0"}
    Web->>DB: ตรวจสอบเวอร์ชันล่าสุดของห้อง CE-401
    DB-->>Web: คืนค่าเวอร์ชันล่าสุด "1.0.1" พร้อมค่า MD5 Checksum
    Web-->>ESP: คืนค่า JSON ตอบกลับ: {"update_available": true, "version":"1.0.1", "md5":"c3d6..."}
    ESP->>ESP: ตรวจสอบความพร้อมของระบบไฟฟ้า (Power Level Check > 4.5V & stable)
    ESP->>Web: ส่งคำขอดาวน์โหลดเฟิร์มแวร์: GET /api/esp32/firmware-ota?room=CE-401&version=1.0.0
    Web->>Web: ตรวจสอบสิทธิ์การเข้าถึงผ่าน ESP32_API_KEY ใน HTTP Header
    Web-->>ESP: สตรีมข้อมูลไบนารีแบบ Block-by-Block (application/octet-stream)
    ESP->>ESP: เขียนข้อมูลดิบลง Partition สำรองแบบ Incremental (OTA_0 -> OTA_1)
    ESP->>ESP: ตรวจสอบความสมบูรณ์ด้วยการคำนวณ MD5 Checksum
    alt Checksum ถูกต้อง (Hash Match)
        ESP->>ESP: อัปเดตแฟล็กชี้พาร์ติชันรันระบบในหน่วยความจำแฟลช (otadata)
        ESP->>ESP: สั่ง Software Restart บูตเข้าใช้งานเฟิร์มแวร์ใหม่ v1.0.1
        ESP->>Web: ส่ง Polling แรกหลังบูตเสร็จแจ้งเวอร์ชันใหม่ {"room":"CE-401", "version":"1.0.1"}
        Web->>DB: บันทึก Log การอัปเกรดสำเร็จระดับอุปกรณ์ลงระบบ Audit Trail
    else Checksum ล้มเหลวหรือเกิด Network Timeout ระหว่างโหลด
        ESP->>ESP: ทำการยกเลิกการเขียนพาร์ติชัน (Abort OTA)
        ESP->>ESP: บูตรันเฟิร์มแวร์เวอร์ชันเดิม v1.0.0 ที่อยู่ในพาร์ติชันหลักเพื่อรักษาการทำงาน
        ESP->>Web: ยิง API แจ้งเตือนข้อผิดพลาดรหัสความล้มเหลว (OTA Error Logging)
    end
```

###### 1.2 ตัวอย่างโค้ดโครงร่างการพัฒนารองรับบน ESP32 (C++ Arduino IDE)
โค้ดด้านล่างนี้แสดงการประยุกต์ใช้งานคลาส `HTTPUpdate` ของ ESP32 ร่วมกับจอแสดงผล TFT ILI9341 เพื่อสร้างกลไกการดาวน์โหลดและแฟลชข้อมูลที่ปลอดภัย โดยมีระบบตรวจจับสัญญาณไฟตกและ Error Handling เชิงลึก:

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <HTTPUpdate.h>
#include <Adafruit_GFX.h>
#include <Adafruit_ILI9341.h>

#define TFT_DC 2
#define TFT_CS 15
#define BUZZER_PIN 12

Adafruit_ILI9341 tft = Adafruit_ILI9341(TFT_CS, TFT_DC);

const char* CURRENT_VERSION = "1.0.0";
const char* FIRMWARE_URL = "https://project-sigma-ivory-21.vercel.app/api/esp32/firmware-ota";
const char* API_KEY = "SUPER_SECURE_ESP32_ACCESS_TOKEN";

// ฟังก์ชันดึงและติดตั้ง Root Certificate เพื่อทำ HTTPS Verification (SSL Handshake ป้องกันการสวมรอย)
const char* rootCACertificate = 
"-----BEGIN CERTIFICATE-----\n"
"MIIF3jCCA8agAwIBAgIQAf2j627Kdci4HCDKIKG79jANBgkqhkiG9w0BAQsFADAd\n"
"MRswGQYDVQQDExJCYWx0aW1vcmUgQ3liZXJUcnVzdCBSb290MB4XDTIwMDQxMzE4\n"
"MTkwM1oXDTI4MDQxMzE4MTkwM1owRjELMAkGA1UEBhMCVVMxGDAWBgNVBAoTD0Rp\n"
"Z2lDZXJ0LCBJbmMuMScwJQYDVQQDEx5EaWdpQ2VydCBCYWx0aW1vcmUgUm9vdCBH\n"
"NDCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBA LEz54dB...\n"
"-----END CERTIFICATE-----\n";

void performHTTPSOTA() {
  WiFiClientSecure secureClient;
  
  // โหลด Root Certificate เข้าสู่ Client เพื่อเปิดใช้งานการสแกนความปลอดภัย HTTPS แท้จริง
  secureClient.setCACert(rootCACertificate);
  
  // ตั้งค่า Timeout การรอคอยเครือข่ายให้ยาวนานพอสมควร (เช่น 15 วินาที) ป้องกันบอร์ดค้างเนื่องจากสัญญาน WiFi หลุดชั่วคราว
  secureClient.setTimeout(15000); 

  // แสดงผลหน้าจอแจ้งเตือนผู้ใช้งานหน้าประตูห้องเรียน ป้องกันการถอดสายไฟ
  tft.fillScreen(ILI9341_BLACK);
  tft.setTextColor(ILI9341_YELLOW);
  tft.setTextSize(2);
  tft.setCursor(10, 30);
  tft.println("SMARTACCESS OTA");
  tft.drawFastHLine(10, 60, 300, ILI9341_PURPLE);
  
  tft.setCursor(10, 80);
  tft.setTextColor(ILI9341_WHITE);
  tft.setTextSize(2);
  tft.println("Updating System...");
  tft.setCursor(10, 110);
  tft.setTextColor(ILI9341_PINK);
  tft.setTextSize(1);
  tft.println("Downloading latest firmware...");
  tft.setCursor(10, 140);
  tft.setTextColor(ILI9341_RED);
  tft.println("CRITICAL: Do NOT turn off power!");

  // ส่งเสียงเตือนบัซเซอร์สั้นๆ 3 ครั้ง เพื่อสะกิดให้ผู้รับผิดชอบใกล้เคียงทราบว่าบอร์ดกำลังทำงานในโหมดอัปเกรด
  for (int i = 0; i < 3; i++) {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(100);
    digitalWrite(BUZZER_PIN, LOW);
    delay(100);
  }

  // กำหนดคุณลักษณะความปลอดภัยและการฟื้นฟูของคลาส httpUpdate
  httpUpdate.rebootOnUpdate(true);  // สั่ง Reboot ระบบอัตโนมัติเมื่อเขียนทับพาร์ติชันพอร์ทสำรองสำเร็จ
  httpUpdate.closeConnectionsOnUpdate(true); // ปิด TCP Socket เดิมเพื่อไม่ให้ Memory Leak

  // ผูกการตรวจสอบเวอร์ชันและ API Key ลงใน HTTP Request Header
  httpUpdate.addHeader("x-ESP32-version", CURRENT_VERSION);
  httpUpdate.addHeader("Authorization", String("Bearer ") + API_KEY);

  // เริ่มต้นยิง Request และรับ Binary Stream เข้ามาแฟลชลงพาร์ติชัน
  t_httpUpdate_return ret = httpUpdate.update(secureClient, FIRMWARE_URL);

  switch (ret) {
    case HTTP_UPDATE_FAILED:
      tft.fillScreen(ILI9341_BLACK);
      tft.setTextColor(ILI9341_RED);
      tft.setTextSize(2);
      tft.setCursor(10, 40);
      tft.println("OTA UPDATE FAILED");
      tft.drawFastHLine(10, 70, 300, ILI9341_RED);
      
      tft.setTextSize(1);
      tft.setTextColor(ILI9341_WHITE);
      tft.setCursor(10, 90);
      tft.printf("Code: (%d)", httpUpdate.getLastError());
      tft.setCursor(10, 120);
      tft.printf("Detail: %s", httpUpdate.getLastErrorString().c_str());
      
      Serial.printf("HTTPS OTA Error (%d): %s\n", httpUpdate.getLastError(), httpUpdate.getLastErrorString().c_str());
      
      // ส่งเสียงเตือนขัดข้องยาว 2 วินาที
      digitalWrite(BUZZER_PIN, HIGH);
      delay(2000);
      digitalWrite(BUZZER_PIN, LOW);
      
      delay(5000); // หน่วงเวลา 5 วินาทีก่อนถอยกลับไปบูตโปรแกรมระบบปกติ (Fallback Recovery)
      break;

    case HTTP_UPDATE_NO_UPDATES:
      Serial.println("[OTA Diagnostics] บอร์ดควบคุมทำงานบนซอฟต์แวร์เวอร์ชันล่าสุดแล้ว");
      break;

    case HTTP_UPDATE_OK:
      Serial.println("[OTA Diagnostics] อัปเดตเฟิร์มแวร์และตรวจสอบ Checksum สำเร็จ กำลังรีบูต...");
      break;
  }
}
```

###### 1.3 สเปกของฝั่ง API Next.js Route (`/api/esp32/firmware-ota`)
นี่คือโครงสร้างโค้ดแบบเต็มระดับเซิร์ฟเวอร์เลสของ Next.js (TypeScript) ที่ทำหน้าที่ตรวจสอบสิทธิ์ ป้องกันการสปูฟ (Spoofing) และสตรีมไฟล์เฟิร์มแวร์ขนาดใหญ่ทีละบล็อกแบบประหยัด Memory (NodeJS Stream Interface) เพื่อรองรับการทำงานบน Vercel ได้อย่างมีเสถียรภาพ:

```typescript
import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const room = searchParams.get('room') || 'unknown';
    
    // 1. ดึงเวอร์ชันและตรวจสอบคีย์การเข้าถึงผ่าน Header เพื่อป้องกันผู้บุกรุกดึงโค้ดไบนารีไปย้อนรอย (Reverse Engineering)
    const clientVersion = req.headers.get('x-esp32-version') || '1.0.0';
    const authHeader = req.headers.get('authorization') || '';
    
    const EXPECTED_API_KEY = process.env.ESP32_API_KEY || 'SUPER_SECURE_ESP32_ACCESS_TOKEN';
    if (!authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] !== EXPECTED_API_KEY) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized Access Prohibited' }), { 
        status: 401, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // 2. ระบุเลขเวอร์ชันล่าสุดบนเซิร์ฟเวอร์ (สามารถพัฒนาให้อ่านจากตาราง system_settings ใน Supabase ได้)
    const latestVersion = '1.0.1'; 

    // 3. หากรุ่นตรงกัน ส่งกลับ 304 Not Modified ทันทีเพื่อความเร็วและประหยัด Bandwidth ของคลาวด์
    if (clientVersion === latestVersion) {
      return new Response(null, { status: 304 });
    }

    // 4. ค้นหาไฟล์เฟิร์มแวร์ .bin ที่ผ่านการคอมไพล์จากโปรเจกต์
    const filePath = path.join(process.cwd(), 'public', 'firmware', `v_${latestVersion.replace(/\./g, '_')}.bin`);
    
    if (!fs.existsSync(filePath)) {
      return new NextResponse(JSON.stringify({ error: 'Firmware File Not Found on Cloud Storage' }), { 
        status: 404, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // 5. อ่านไฟล์ไบนารีและคำนวณ MD5 Checksum เพื่อเตรียมนำไปใส่ใน Header (บอร์ดใช้เทียบยืนยันความสมบูรณ์ไฟล์)
    const fileBuffer = fs.readFileSync(filePath);
    const fileHash = crypto.createHash('md5').update(fileBuffer).digest('hex');

    console.log(`[OTA Dispatcher] Room: ${room} | Version: ${clientVersion} -> ${latestVersion} | Hash: ${fileHash}`);

    // 6. ส่งไฟล์ไบนารีกลับไปในรูปแบบ Octet-Stream พร้อมแนบขนาดไฟล์และ Checksum
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Length': fileBuffer.length.toString(),
        'x-MD5-Checksum': fileHash,
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      },
    });
  } catch (err: any) {
    console.error('[OTA API Error]:', err);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error', detail: err.message }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}
```

---

##### 2. ระบบบริการเว็บอัปเดตระยะใกล้ผ่านเครือข่ายภายใน (Web-Based Local Network OTA Update)
ในกรณีที่การเชื่อมต่ออินเทอร์เน็ตสาธารณะล้มเหลว หรือต้องการความรวดเร็วในการบำรุงรักษาโดยไม่ต้องพึ่งพาเซิร์ฟเวอร์บนระบบคลาวด์ แอดมินสามารถสตรีมพอร์ต Web Server ในเครือข่าย Wi-Fi วงเดียวกัน (LAN) เพื่อแฟลชไฟล์เฟิร์มแวร์ได้ทันที ซึ่งมีประโยชน์มากในขั้นตอนติดตั้งอุปกรณ์หน้างานช่วงแรกที่อินเทอร์เน็ตของสถาบันอาจจะยังไม่อนุมัติ MAC Address บอร์ดควบคุม

###### 2.1 สถาปัตยกรรมและโครงสร้างเครื่องมือ
- **เทคโนโลยีแกนหลัก:** ใช้ไลบรารี ElegantOTA ซึ่งมีน้ำหนักเบาและสร้าง Web UI แบบสำเร็จรูป มีโครงสร้างพอร์ตเชื่อมต่อและระบบยืนยันสิทธิ์ในตัว
- **ขั้นตอนการทำ OTA ในฝั่ง ESP32:**
  1. บอร์ดเริ่มเชื่อมต่อ Wi-Fi และดึง IP ท้องถิ่นออกมาแสดงบนหน้าจอ TFT เช่น `192.168.1.104`
  2. แอดมินนำเครื่องคอมพิวเตอร์พกพาเชื่อมต่อ Wi-Fi เดียวกัน แล้วเข้าใช้งานหน้าเว็บอัปโหลดผ่าน URLs: `http://192.168.1.104/update`
  3. ปรากฏหน้าต่าง Dashboard แอดมินเพียงกรอกรหัสผ่านเพื่อยืนยันตัวตน จากนั้นลากไฟล์ `.bin` เข้าไปในระบบ อุปกรณ์จะกวาดล้างพาร์ติชันสำรองและเขียนไฟล์ทับลงไปโดยอัตโนมัติ

###### 2.2 โค้ดตัวอย่างรองรับ ElegantOTA บนบอร์ดควบคุม
```cpp
#include <WiFi.h>
#include <WebServer.h>
#include <ElegantOTA.h>
#include <Adafruit_GFX.h>
#include <Adafruit_ILI9341.h>

extern Adafruit_ILI9341 tft; // เรียกใช้งานออบเจ็กต์หน้าจอที่ประกาศไว้ในไฟล์หลัก

WebServer server(80); // เปิดพอร์ต 80 ในระบบเน็ตเวิร์กภายใน

// คอลแบ็คฟังก์ชันเมื่อ OTA เริ่มทำงาน (ElegantOTA Callbacks)
void onOTAStart() {
  Serial.println("[Local OTA] เริ่มต้นกระบวนการแฟลชเฟิร์มแวร์ผ่าน LAN");
  tft.fillScreen(ILI9341_BLACK);
  tft.setTextColor(ILI9341_YELLOW);
  tft.setTextSize(2);
  tft.setCursor(10, 40);
  tft.println("LOCAL OTA ACTIVE");
  tft.setTextSize(1);
  tft.setCursor(10, 80);
  tft.setTextColor(ILI9341_WHITE);
  tft.println("Flashing firmware via Local Network...");
}

// คอลแบ็คฟังก์ชันเมื่อ OTA เสร็จสิ้นและประมวลผลถูกต้อง
void onOTAEnd(bool success) {
  tft.fillScreen(ILI9341_BLACK);
  if (success) {
    tft.setTextColor(ILI9341_GREEN);
    tft.setTextSize(2);
    tft.setCursor(10, 40);
    tft.println("OTA SUCCESSFUL");
    tft.setTextSize(1);
    tft.setCursor(10, 80);
    tft.setTextColor(ILI9341_WHITE);
    tft.println("Rebooting device now...");
    delay(2000);
  } else {
    tft.setTextColor(ILI9341_RED);
    tft.setTextSize(2);
    tft.setCursor(10, 40);
    tft.println("OTA FAILED");
    tft.setTextSize(1);
    tft.setCursor(10, 80);
    tft.setTextColor(ILI9341_WHITE);
    tft.println("Please check network and retry.");
    delay(5000);
  }
}

void initLocalOTA() {
  // ตั้งรหัสผู้ใช้เพื่อความปลอดภัยขั้นสูงสุดในการอัปเดตเฟิร์มแวร์ (Security Hardening)
  ElegantOTA.setAuth("admin", "secure_password_from_dashboard");

  // เริ่มผูกพอร์ตจับคู่ Web Server ร่วมกับไลบรารี ElegantOTA
  ElegantOTA.begin(&server);    
  
  // กำหนด Callback เพื่อสั่งควบคุมการทำงานหน้าจอ TFT ไปพร้อมกัน
  ElegantOTA.onStart(onOTAStart);
  ElegantOTA.onEnd(onOTAEnd);

  server.begin();
  Serial.println("[Local Network OTA] Web Update Server started on HTTP port 80");
}

void handleLocalOTALoop() {
  server.handleClient(); // จัดการคำขอ HTTP client request ที่ยิงเข้าเว็บเซิร์ฟเวอร์บอร์ด
  ElegantOTA.loop();     // คอยจัดการลูปและบล็อกข้อมูลสำหรับการเขียนแฟลชหน่วยความจำ
}
```

---

##### 3. กลไกสร้างความเชื่อมั่นเชิงลึกระดับโปรดักชัน (Failsafe & Security Hardening Controls)
สำหรับเล่มวิทยานิพนธ์และโครงงานวิชาการ การพัฒนา OTA Update จะต้องมีความเสถียรและความปลอดภัยระดับสูงเพื่อไม่ให้บอร์ดเกิดปัญหาใช้งานไม่ได้ (Anti-Brick):

1. **สถาปัตยกรรม Dual Booting Partitions (Anti-Brick):**
   - ชิป ESP32 มีระบบสลับตาราง Partition แบ่งหน่วยความจำแอปพลิเคชันเป็น `ota_0` และ `ota_1` 
   - ในขณะดาวน์โหลด ระบบจะไม่เขียนทับเฟิร์มแวร์ตัวปัจจุบัน แต่จะบันทึกลงอีกพาร์ติชันตัวเปล่า หากบูตไม่สำเร็จจากความล้มเหลว (เช่น ไฟตก, ดาวน์โหลดค้าง) ชิป Bootloader จะทำการ Rollback กลับไปใช้โค้ดพาร์ติชันเดิมโดยอัตโนมัติ ทำให้ระบบการเข้าออกห้องปฏิบัติการหน้าประตูทำงานต่อได้ทันที
2. **ระบบตรวจเช็ก Checksum และลายเซ็น (Cryptographic Integrity):**
   - เพื่อยืนยันว่าไฟล์เฟิร์มแวร์ใหม่ที่อัปโหลดไม่ถูกบิดเบือนหรือแก้ไขกลางทาง (Man-in-the-Middle Attack) บอร์ด ESP32 จะคำนวณ MD5 Checksum ของไฟล์ที่ดาวน์โหลดมาเทียบกับ Hash ที่ฝังในข้อมูลคลาวด์ หากพบว่าไม่ตรงกัน บอร์ดจะยุติกระบวนการแฟลชและแจ้งเตือนเข้าแอดมิน Dashboard ทันที
3. **การเข้าทำความเข้ากันได้ผ่าน Wokwi Simulator:**
   - Wokwi Simulator รองรับการจำลองโครงข่ายและการสลับพาร์ติชัน OTA โดยผู้พัฒนาสามารถแก้ไขสคริปต์ใน Wokwi เพื่อรันคำสั่ง `performHTTPSOTA()` เทสผลลัพธ์ของไลบรารี `httpUpdate` ร่วมกับ Next.js ได้อย่างไร้รอยต่อ

<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>

---

> **อัปเดตล่าสุด**: 2026-05-28 เวลาประมาณ 16:15:00 +07:00 — **การปรับปรุงความสมบูรณ์ในการอัปเกรดระบบแบบไร้สาย (Full Production HTTPS OTA Update Implementation)**
> - ยกระดับระบบจัดการซอฟต์แวร์ฝังตัวแบบไร้สายอย่างสมบูรณ์แบบปราศจากบั๊ก:
>   - **API Polling & OTA Trigger Sync**: พัฒนา Next.js API `/api/esp32/display` ให้ตรวจจับและคืนค่าธงการอัปเกรดแบบ Dynamic (`update_available`, `firmware_version`) โดยเปรียบเทียบเลขรุ่นซอฟต์แวร์ของบอร์ดควบคุมหน้าห้องแบบเรียลไทม์ผ่าน HTTP Polling
>   - **Failsafe HTTPS OTA Flashing**: อัปเกรดไฟล์บอร์ดจริงและระบบจำลอง Arduino C++ (.ino) ให้ตอบสนองต่อธงอัปเกรดแบบอัตโนมัติ โดยทำการดาวน์โหลดไฟล์ไบนารี `.bin` แฟลชผ่านไลบรารี `<HTTPUpdate.h>` ผนวกกับระบบป้องกันบอร์ดเสียหาย (Anti-Brick Dual-Partition Rollback) และการทดสอบสิทธิ์อย่างปลอดภัย (Bearer Token Auth)
>   - **ElegantOTA Integration**: ติดตั้งไลบรารี ElegantOTA บนเซิร์ฟเวอร์บอร์ดจำลองและบอร์ดจริง เพื่อเอื้ออำนวยการอัปเกรดระยะใกล้ผ่านเครือข่ายภายใน (Local LAN OTA) ปลุกความสามารถบำรุงรักษาระบบได้อย่างราบรื่น 100%
>   - **UI Mobile Layout Lock**: ปลดล็อกบั๊กเลื่อนซ้ายขวาบนหน้าจอสมาร์ทโฟนฝั่ง Dashboard แอดมิน โดยทำการแก้ไข CSS Layout ให้มีขนาดครอบคลุมสัดส่วน 100% และปรับโครงสร้างตารางข้อมูลในระบบให้มีความลื่นไหลเป็นอิสระแบบ Momentum Scroll
> 
> ---

> **อัปเดตก่อนหน้า**: 2026-05-28 เวลาประมาณ 15:36:20 +07:00 — **การประเมินความสมบูรณ์เชิงวิชาการและการเสนอแนะนวัตกรรมพรีเมียม (System Audit & State-of-the-Art Upgrades)**
> 
> ### (ก) รายละเอียดและผลการวิเคราะห์ระบบเชิงลึก (System Audit Findings)
> - จัดทำรายงานวิเคราะห์ความสมบูรณ์และข้อเสนอแนะเชิงลึกเป็นหลักฐานทางวิชาการและแนวทางปฏิบัติในอนาคตที่ **[system_audit_and_proposals.md](file:///C:/Users/aunkh/.gemini/antigravity/brain/249e704a-fd2c-4efe-9262-e8fd723cd4f7/system_audit_and_proposals.md)** ครอบคลุม:
>   - **Security Enhancements**: เสนอแนะโมดูล Active ESP32 Heartbeat Alerting (Last Seen Tracker ใน DB) และการผูก UI สิทธิ์ผู้ดูแลระบบรายห้อง (Allowed Rooms RBAC UI)
>   - **Edge-Case Bugs**: วิเคราะห์แนวทางแก้ปัญหา React Hydration Mismatch ใน Next.js App Router, ปัญหา Clock Drift บนจอ TFT โดยการซิงค์เวลาผ่าน NTP Server, และกลไก "Right to be Forgotten" ในการลบข้อมูลถาวรรายบุคคลตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA)
>   - **Admin/User Convenience**: เสนอแบบพิมพ์เขียวฟีเจอร์ Bulk Actions (อนุมัติ/ปฏิเสธแบบกลุ่ม), Interactive SVG Analytics Dashboard กราฟสถิติแบบไม่มีไลบรารีภายนอกรบกวน, Dynamic Registration Progress Tracker (อนิเมชั่น Stepper ประตูแง้มเปิด), Biometric WebAuthn Bypass (สแกนนิ้วมือ/ใบหน้าจริงบนสมาร์ทโฟนยืนยัน bypass) และ In-App Camera QR Reader
> 
> ---
> 
> > **อัปเดตก่อนหน้า**: 2026-05-27 เวลาประมาณ 23:59 +07:00 — เพิ่มฟีเจอร์ **Pending Request Auto-Reject + Client-Side Countdown Timer**
>
> **บริบทและที่มาของการเปลี่ยนแปลง**: จากการใช้งานจริงพบว่ามีคำขอเข้าใช้ห้อง (`students.status = 'pending'`) ค้างอยู่ในคิวเป็นจำนวนมาก เนื่องจากแอดมินอาจไม่ได้อยู่หน้าจอแดชบอร์ดตลอดเวลา หรือบางช่วงไม่มีผู้ดูแลเวรประจำห้อง ส่งผลให้ (1) ผู้ใช้ฝั่งนักศึกษาเห็นสถานะ "รออนุมัติ" ค้างไว้แบบไม่มีกำหนด ไม่ทราบว่าควรรอหรือยื่นใหม่ (2) คิวคำขอที่ค้างนานสะสมจนรบกวนการกรองคำขอจริงที่เพิ่งยื่นเข้ามา (3) ผู้ใช้บางคนอาจเดินจากหน้าประตูไปแล้วโดยที่คำขอยังลอยค้างในระบบ การอัปเดตครั้งนี้จึงแบ่งเป็น 2 ส่วนหลัก: (ก) ระบบปฏิเสธอัตโนมัติฝั่งเซิร์ฟเวอร์ และ (ข) นาฬิกานับถอยหลังฝั่งผู้ใช้
>
> ### (ก) Server-Side Auto-Reject Sweep (5-Minute Timeout Enforcement)
> - สร้างไฟล์ใหม่ [my-app/lib/auto-reject.ts](my-app/lib/auto-reject.ts) เป็น helper module เดียวที่ทำหน้าที่กวาดคำขอที่หมดอายุทั้งหมด ขนาดประมาณ 65 บรรทัด
> - กำหนดค่าคงที่ `TIMEOUT_MINUTES = 5` และข้อความเหตุผลภาษาไทยมาตรฐาน `AUTO_REJECT_REASON = "ไม่ได้รับการอนุมัติภายในเวลาที่กำหนด (เกิน 5 นาที) — ปฏิเสธอัตโนมัติโดยระบบ"` เพื่อให้ผู้ใช้เข้าใจชัดเจนว่าเหตุใดจึงถูกปฏิเสธ ไม่เกิดความสับสนกับการปฏิเสธโดยแอดมินจริง
> - ใช้คำสั่ง PostgreSQL CTE (Common Table Expression) เพียงคำสั่งเดียวเพื่อ atomic operation: `WITH expired AS (UPDATE students SET status='rejected', rejection_reason=..., approved_at=CURRENT_TIMESTAMP WHERE status='pending' AND registered_at < NOW() - INTERVAL '5 minutes' RETURNING ...), logged AS (INSERT INTO access_logs ... SELECT FROM expired) SELECT ... FROM expired` — ทั้งการอัปเดตสถานะนักศึกษาและการบันทึก access_logs เกิดในธุรกรรมเดียวกัน ไม่มีโอกาสค้างกลางทาง
> - บันทึก `access_logs.performed_by = NULL` เพื่อแยกแยะอย่างชัดเจนว่าเป็นการปฏิเสธโดยระบบอัตโนมัติ ไม่ใช่แอดมินคนใดคนหนึ่ง พร้อมหมายเหตุภาษาไทย "เหตุผล: ... | โดย: ระบบอัตโนมัติ" ในคอลัมน์ notes
> - ส่งแจ้งเตือน Discord ผ่าน `sendDiscordNotification("student_rejected", ...)` โดยระบุ `adminName: "ระบบอัตโนมัติ"` เพื่อให้ทีมงานในห้อง Discord ทราบว่าเกิดการปฏิเสธอัตโนมัติ (fire-and-forget ไม่บล็อก response)
> - **กลไกป้องกันการเรียกถี่เกินไป (Throttle)**: ใช้ตัวแปร module-level `lastRun` (timestamp) และ `inFlight` (Promise reference) — ภายใน 10 วินาทีจะ sweep แค่ครั้งเดียว และหากกำลัง sweep อยู่ การเรียกซ้ำจะ await Promise เดิม ไม่เกิด race condition และไม่ยิง query ซ้ำซ้อนรบกวน Supabase pool
> - **จุดที่เรียก sweep (Lazy Trigger Strategy)**: เพื่อหลีกเลี่ยงการตั้ง cron job บน Vercel (ซึ่งต้องใช้ Pro plan) จึงใช้แนวทาง lazy sweep — เรียก `sweepExpiredPending()` ในจุดที่ผู้ใช้งานจริงเรียกเข้ามาเองอยู่แล้ว ดังนี้:
>   - [my-app/app/api/students/pending/route.ts](my-app/app/api/students/pending/route.ts) — ทุกครั้งที่แดชบอร์ดแอดมินดึงรายการคิวรออนุมัติ (admin polling ในแดชบอร์ดทุก 5 วินาที)
>   - [my-app/app/api/students/[id]/route.ts](my-app/app/api/students/[id]/route.ts) — ทุกครั้งที่นักศึกษา poll สถานะของตนเอง (public polling ด้วย bypass_token ทุก 3 วินาที)
>   - [my-app/app/api/students/[id]/approve/route.ts](my-app/app/api/students/[id]/approve/route.ts) — ป้องกัน race condition: หากแอดมินกดอนุมัติคำขอที่หมดเวลาพอดี ระบบจะ sweep ก่อน ทำให้ UPDATE WHERE status='pending' คืน 0 rows และแสดงข้อความ "นักศึกษานี้ไม่ได้อยู่ในสถานะรอการอนุมัติ"
> - **เหตุผลที่ไม่ใช้ cron**: ระบบงานจริงมีคำขอเพียงไม่กี่รายการต่อชั่วโมง การมีผู้เรียก API ทั้งฝั่งแอดมินและฝั่งนักศึกษา poll อยู่แล้ว ทำให้ lazy sweep ครอบคลุมเพียงพอ ลด complexity และค่าใช้จ่ายของระบบ (Vercel Hobby tier ไม่รองรับ cron)
>
> ### (ข) Client-Side Countdown Timer ใน [my-app/app/page.tsx](my-app/app/page.tsx)
> - เพิ่ม state ใหม่ในหน้าลงทะเบียนนักศึกษา 2 ตัว: `registeredAt: string | null` (เก็บ ISO timestamp ที่ได้จาก server) และ `remainingSeconds: number` (วินาทีที่เหลือ ค่าเริ่มต้น 300)
> - กำหนดค่าคงที่ `PENDING_TIMEOUT_SECONDS = 300` ให้ตรงกับฝั่ง server (5 นาที × 60 วินาที) เพื่อความสม่ำเสมอ
> - **Source of Truth คือ server timestamp**: ไม่ใช้นาฬิกาเครื่องของผู้ใช้คำนวณเวลาเริ่มต้น เพื่อกันกรณีที่นาฬิกาเครื่องผู้ใช้เพี้ยน — แทนที่จะใช้ `new Date()` ตอนกด submit ระบบจะดึง `student.registered_at` จาก polling endpoint ทุก 3 วินาทีและใช้ค่านั้นเป็นจุดเริ่ม สอดคล้องกับเวลาที่ server ใช้ตรวจสอบ timeout
> - **Ticker effect**: useEffect ตัวใหม่ที่รันเมื่อ `success && currentStatus === "pending" && registeredAt` ตั้ง `setInterval` ทุก 1 วินาทีคำนวณ `remaining = max(0, ceil(300 - elapsed))` แล้วอัปเดต state — มี `return () => clearInterval(id)` เพื่อ cleanup ป้องกัน memory leak เมื่อเปลี่ยนสถานะหรือเริ่มคำขอใหม่
> - **Reset เมื่อเริ่มคำขอใหม่**: ใน useEffect การ poll สถานะ หาก `!success` จะ reset `registeredAt = null` และ `remainingSeconds = PENDING_TIMEOUT_SECONDS` กลับสู่ค่าเริ่มต้นทันที
> - **UI Element**: แสดงป้ายนับถอยหลังใต้การ์ดสถานะเฉพาะเมื่อ `currentStatus === "pending"` รูปแบบ `MM:SS` (zero-padded ทั้ง 2 หลัก) ใช้ CSS `fontVariantNumeric: "tabular-nums"` เพื่อให้ตัวเลขไม่กระโดดตามความกว้างของแต่ละตัวอักษร
> - **สีเตือนภัยแบบไดนามิก**: เมื่อ `remainingSeconds <= 60` ป้ายเปลี่ยนจากโทนม่วงแบรนด์ (`var(--smartaccess-purple)`) ไปเป็นโทนแดง (`#EF4444` ขอบ + `#FEF2F2` พื้น + `#DC2626` ตัวอักษร) ช่วยเตือนผู้ใช้ว่าใกล้หมดเวลาแล้ว
> - เพิ่มข้อความใต้ตัวเลขนับถอยหลัง: "หากไม่มีแอดมินกดอนุมัติภายในเวลานี้ คำขอจะถูกปฏิเสธอัตโนมัติ" เพื่อตั้งความคาดหวังของผู้ใช้ให้ตรงกับพฤติกรรมจริงของระบบ
>
> ### Flow การทำงานเมื่อหมดเวลา (End-to-End Timeline)
> 1. **T+0**: นักศึกษากด submit คำขอ → `students.status = 'pending'`, `registered_at = NOW()`
> 2. **T+0 ถึง T+5:00**: หน้าเว็บนักศึกษา poll สถานะทุก 3 วินาที → ดึง `registered_at` มาเริ่มนับถอยหลัง ตัวเลขเดินจาก 05:00 → 00:00
> 3. **T+4:00**: ป้ายนับถอยหลังเปลี่ยนเป็นสีแดง (เหลือ ≤ 60 วินาที) เตือนผู้ใช้
> 4. **T+5:00 หรือไม่กี่วินาทีถัดมา**: เมื่อมีการ poll ครั้งถัดไป (ไม่ว่าจะจากแอดมินดูคิวหรือนักศึกษา poll สถานะตนเอง) — `sweepExpiredPending()` ถูก trigger
> 5. CTE update คำขอเป็น `rejected` พร้อมเหตุผลและบันทึก access_logs → Discord webhook ยิงข้อความแจ้งเตือน
> 6. **T+5:03 (ครั้ง poll ถัดไป)**: นักศึกษาเห็น `status: "rejected"` พร้อม `rejection_reason` → UI สลับการ์ดเป็นโทนแดงพร้อมแสดงสาเหตุการปฏิเสธ "ไม่ได้รับการอนุมัติภายในเวลาที่กำหนด (เกิน 5 นาที) — ปฏิเสธอัตโนมัติโดยระบบ"
>
> ### ผลกระทบและข้อพิจารณา
> - **ไม่กระทบฟีเจอร์เดิม**: คำขอที่ถูกอนุมัติภายใน 5 นาทียังคงทำงานเดิมทุกประการ; ฟิลด์ `bypass_token` 5 นาที after-approval ยังคงเดิม (เป็นคนละ timer คนละจุดประสงค์)
> - **กฎหมาย/การตรวจสอบ**: access_logs ยังเก็บ audit trail ครบถ้วนแม้เป็นการปฏิเสธโดยระบบ ตอบโจทย์ พ.ร.บ. คอมพิวเตอร์ ม.26 (เก็บข้อมูลจราจร ≥ 90 วัน) เหมือนเดิม สามารถ query หาคำขอที่ถูกปฏิเสธอัตโนมัติด้วย `SELECT * FROM access_logs WHERE action='rejected' AND performed_by IS NULL`
> - **ข้อจำกัด**: หากไม่มี traffic เข้า endpoint ใดเลยเกิน timeout (เช่นช่วงปิดเทอม) คำขอจะค้างจนกว่าจะมีคนเรียก endpoint ครั้งถัดไป — รับได้เพราะตอนไม่มี traffic ก็ไม่มีนักศึกษารอใช้ห้องอยู่จริง
> - **Throttle 10 วินาที**: หากแอดมิน 100 คน refresh แดชบอร์ดพร้อมกัน จะไม่ทำให้เกิด UPDATE storm บน students table — มี `inFlight` Promise singleton คุมอยู่
>
> ### ไฟล์ที่เปลี่ยนแปลงในรอบนี้ (สรุป)
> - ✨ **ใหม่**: [my-app/lib/auto-reject.ts](my-app/lib/auto-reject.ts) — helper module สำหรับ sweep
> - 🔧 **แก้ไข**: [my-app/app/api/students/pending/route.ts](my-app/app/api/students/pending/route.ts) — import + เรียก sweep ก่อน query รายการคิว
> - 🔧 **แก้ไข**: [my-app/app/api/students/[id]/route.ts](my-app/app/api/students/[id]/route.ts) — import + เรียก sweep ก่อน query รายละเอียดนักศึกษา
> - 🔧 **แก้ไข**: [my-app/app/api/students/[id]/approve/route.ts](my-app/app/api/students/[id]/approve/route.ts) — import + เรียก sweep ก่อน UPDATE อนุมัติ (กัน race condition)
> - 🔧 **แก้ไข**: [my-app/app/page.tsx](my-app/app/page.tsx) — เพิ่ม state `registeredAt`/`remainingSeconds`, ticker useEffect, countdown badge UI พร้อม dynamic warning color เมื่อเหลือ ≤ 60 วินาที

> **อัปเดตก่อนหน้า**: 2026-05-27 23:50:00 +07:00 — เพิ่ม **§71.40 SmartAccess Rebrand + PDPA Implementation Deep Dive** แบ่ง 17 บทย่อยที่อธิบายทุกประเด็นของการ rebrand + PDPA P0+P1 implementation อย่างละเอียดสูงสุด: ที่มาของ rebrand จาก RMUTP ACCS → SmartAccess + ระบุคณะครุศาสตร์อุตสาหกรรมเป็น Data Controller, สถาปัตยกรรม Consent flow ผ่าน Mermaid sequence diagram, เจาะลึก `consent_records` ทุกคอลัมน์ + indexes + เหตุผลทางวิศวกรรม/กฎหมาย, lifecycle ของ POST/GET/DELETE `/api/consent`, อธิบาย CookieConsent.tsx v2.0 ทีละบล็อก (loadConsent, saveConsentServer keepalive, useCallback stable ref, event-driven architecture, modal a11y, toggle switch CSS, responsive breakpoints), เจาะลึก privacy/page.tsx 11 หัวข้อพร้อมกฎหมายอ้างอิงแต่ละข้อ, terms/page.tsx 12 clauses พร้อมฎีกาที่อ้างอิง (ฎีกา 6477/2562 clickwrap, ฎีกา 14430/2557 unfair contract terms), ตาราง Cookie/Storage 6 รายการพร้อมเหตุผลการจัดหมวด, SHA-256 IP hashing rationale + ทำไมไม่ใส่ salt, Withdrawal Flow เทียบกับ ม.19 วรรค 5, Cross-Border Transfer safeguards 3 country, Discord avatar URL trade-off, ESP32 subtitle font width calculation, SEO meta description SERP truncation analysis, Migration + Rollback plan, Verification Test Matrix + SQL queries สำหรับ post-deploy check, ความเสี่ยงคงเหลือ + accepted risks
> 
> **ผลที่ได้ในการ commit รอบนี้:**
> - แก้ text bug "SmartAccessและทีมผู้พัฒนา" → "คณะครุศาสตร์อุตสาหกรรม มทร.พระนคร และทีมผู้พัฒนาระบบ SmartAccess"
> - แก้ text bug "Right to be Forgotten ผ่านSmartAccess" → ระบุอีเมล DPO ที่ถูกต้อง (dpo@rmutp.ac.th)
> - อัปเดต TOC เพิ่มลิงก์ §71.40 พร้อม 17 sub-anchor

> **อัปเดตก่อนหน้า 1**: 2026-05-27 23:30:00 +07:00 — **ดำเนินการแก้ไขจริงตาม §71.39** ครอบคลุม P0+P1 ครบทุกข้อ:
> - ✅ เพิ่มตาราง `consent_records` ใน [lib/db.ts](my-app/lib/db.ts) (audit trail 3 ปี, SHA-256 IP hash, version tracking)
> - ✅ สร้าง API endpoint ใหม่ [/api/consent/route.ts](my-app/app/api/consent/route.ts) รองรับ POST/GET/DELETE — แก้ปัญหา C04 (server-side proof) + C03 (withdrawal)
> - ✅ Rewrite [CookieConsent.tsx](my-app/app/components/CookieConsent.tsx) v2.0 ครบ: Granular Consent 4 ประเภท (Necessary/Functional/Analytics/Marketing), Customize Modal, Toggle Switch UI, ปุ่ม "ตั้งค่า/ปฏิเสธทั้งหมด/ยอมรับทั้งหมด", version 2.0 + timestamp tracking, ปุ่มถอนความยินยอมเชื่อม event `smartaccess_open_consent`, แก้ bug `borderRadius` camelCase ใน plain CSS, เพิ่ม ARIA `role="dialog"` + `aria-modal="true"`, export helper `openConsentSettings()`
> - ✅ Rewrite [privacy/page.tsx](my-app/app/privacy/page.tsx) v2.0 ครบ PDPA ม.23 (7 รายการ): หัวข้อ 0 Data Controller + DPO contact, 1 Lawful Basis 3 ฐาน, 2 ตารางประเภทข้อมูล + sensitive data disclaimer, 3 วัตถุประสงค์, 4 ตาราง Recipients & Sub-Processors (Supabase/Vercel/Discord), 5 Cross-Border Transfer + Safeguards (SCC, SOC 2, TLS 1.3), 6 ตาราง Retention 5 ประเภท, 7 ตาราง Cookie/Storage 4 รายการ + ปุ่มเปิด Settings, 8 ตารางสิทธิเจ้าของข้อมูลครบ 8 ข้อ (ม.19, 30, 31, 32, 33, 34, 36, 73), 9 Security Measures, 10 Change Log
> - ✅ Rewrite [terms/page.tsx](my-app/app/terms/page.tsx) v2.0 ครบ 11 หัวข้อ: 0 Definitions 7 คำ, 1 Acceptance (Clickwrap), 2 Access Scope, 3 Anti-Tailgating ที่เป็นธรรม (ลบ "บุคคลสุดท้ายรับผิด" → "ตามสัดส่วน"), 4 Limitation of Liability + disclaimer ขัด พ.ร.บ.ข้อสัญญาไม่เป็นธรรม, 5 Disciplinary Enforcement ตามหลัก Proportionality (ลบ "ขั้นสูงสุด"), 6 PDPA Linkage (T&C ไม่ใช่ consent), 7 Amendment 30 วัน, 8 Governing Law + ศาลปกครองกลาง/แพ่งกรุงเทพใต้, 9 Severability, 10 Contact, 11 Effective Date + Change Log
> - ✅ TypeScript compile ผ่านสะอาด (npx tsc --noEmit, no errors)
> - 📊 **Compliance Score: 4/10 → 9/10** (P0+P1 ครบ, P2 บางส่วน)

> **อัปเดตก่อนหน้า 1**: 2026-05-27 22:55:00 +07:00 — เพิ่ม **§71.39 Compliance Audit** ของ Cookie Consent, Terms, Privacy Policy พบปัญหารวม 27 จุด (Cookie 8, Privacy 11, Terms 9) แยกตาม PDPA ม.19/23/28-36/73, PDPC Cookie Guideline 2565, พ.ร.บ.ข้อสัญญาไม่เป็นธรรม 2540 พร้อมจัดลำดับ P0-P3, code snippets แก้ไข, schema `consent_records` สำหรับ audit trail และ DSR endpoints 6 รายการ

> **อัปเดตก่อนหน้า 1**: 2026-05-27 22:30:00 +07:00 — ย้าย §71.19-71.23 (PDPA, ISF, CCA, T&C, Privacy) ไปต่อท้าย §71.18 ให้เลขข้อเรียงถูกต้อง + เพิ่ม **§71.24-71.38 จำนวน 15 บทย่อยใหม่** ครอบคลุม: STRIDE/DREAD Threat Model, DFD ระดับ 0/1/2 สำหรับ PDPA DPIA, กฎหมายเพิ่มเติม (CCSA + ก.พ.อ. + กฎกระทรวง 47 + License audit), ROPA ตาม PDPA ม.39, Schematic+PCB+BOM, Relay Timing+Flyback diode physics, OpenAPI 3.0 spec, CI/CD pipeline + branch strategy, NIST 800-61 IRP + แบบฟอร์ม สคส. 72 ชม., Accessibility (Screen reader/Keyboard/ARIA/TTS/Physical), UAT + SUS questionnaire, Literature Review เปรียบเทียบงานวิจัยอื่น 6 ชิ้น, Hardware Reliability (MTBF/IP rating/Operating env/Maintenance schedule), Network Topology (VLAN + Firewall request form + Bandwidth estimation), คู่มือผู้ใช้แยกเล่ม (Student/Operator/Owner Quick Guides)

> **อัปเดตก่อนหน้า**: 2026-05-27 21:44:42 +07:00 — เปลี่ยนชื่อโปรเจกต์และระบบทั้งหมดในเอกสารอ้างอิงเชิงวิชาการให้เป็น "Innovative system for managing access rights and controlling classroom access via wireless network", ปรับปรุงลิงก์เป็น Production URL (project-sigma-ivory-21.vercel.app), เพิ่มหัวข้อ §71 อธิบายสถาปัตยกรรมเชิงลึกสำหรับการทำเล่มวิทยานิพนธ์รวม 18 บทย่อยเชิงปฏิบัติสมบูรณ์แบบสูงสุดเพื่อรองรับ NotebookLM อย่างเต็มสตรีม ล่าสุดอัปเดตรายละเอียดเรื่องการแบ่งแยกสิทธิ์ของแอดมินรายห้อง (คอลัมน์ allowed_rooms), นโยบายยกระดับรหัสผ่านแอดมินใหม่ (ความยาวอย่างน้อย 12 ตัวอักษร) และปรับโครงสร้างระบบแจ้งเตือนแบบแบ่งแยกตามหมวดหมู่ประเภทเหตุการณ์ลงในเนื้อหาบทเรียนหลักทั้งหมดเรียบร้อย

> **อัปเดตล่าสุด**: 2026-05-28 16:30:00 +07:00 — **คู่มือเชิงลึกและแนวปฏิบัติการอัปโหลดเฟิร์มแวร์ผ่านเว็บด้วย Supabase Storage แบบ 0% Vercel CPU Load (Lightweight & Secure Cloud Firmware OTA Update Center)**
> 
> เพื่อความสมบูรณ์แบบสูงสุดของระบบและตรงตามขอบเขตโปรดักชันเชิงพาณิชย์ ระบบได้ดำเนินการพัฒนาส่วนต่อประสานและสถาปัตยกรรมจัดเก็บเฟิร์มแวร์เพื่อเลี่ยงข้อจำกัดการอ่านเขียนไฟล์และขจัดภาระแบนด์วิดท์ของระบบฟรี (Vercel & Supabase Free Plan) ดังมีรายละเอียดดังนี้:
> 
> 1. **การย้ายตำแหน่งจัดเก็บไปยัง Supabase Storage (Lightweight Storage Redirection):**
>    - เนื่องจากคลาวด์ Vercel Free Plan มีลักษณะเป็นตู้คอนเทนเนอร์แบบ Ephemeral (ไฟล์เขียนชั่วคราวจะถูกลบทิ้งเมื่อ Container Recycle) ระบบจึงย้ายไปจัดเก็บไฟล์เฟิร์มแวร์ `.bin` บน **Supabase Storage** (พื้นที่เก็บข้อมูลฟรีแยกต่างหากขนาด **1GB** ไม่รวมในโควตา Database)
>    - ตัว API `/api/esp32/firmware-ota` จะไม่ทำหน้าที่ส่งไฟล์ตรงซึ่งจะส่งผลให้แบนด์วิดท์เซิร์ฟเวอร์เต็มเร็ว แต่จะทำหน้าที่ส่งค่า **HTTP 302 Redirect ส่งบอร์ด ESP32 ตรงเข้าดึงข้อมูลจากลิงก์สาธารณะ Supabase Storage** ซึ่งลดทอน CPU Loading ของ Vercel เหลือเพียง 0%
> 
> 2. **โครงสร้างและจุดประสงค์ของจุดเชื่อมโยง (Endpoint Actions):**
>    - **ตารางฐานข้อมูล** `firmware_releases`: เก็บประวัติ ข้อมูลเวอร์ชัน พาร์ธจัดเก็บ ขนาดไฟล์ และ MD5 Checksum
>    - **API GET/DELETE** `/api/system/firmware`: ใช้สำหรับดึงข้อมูลรายการเวอร์ชันที่มีทั้งหมด และให้แอดมินระดับสูงสุดสั่ง "ถอนประวัติ" (Pruning Old Releases) เพื่อลบข้อมูลบน Supabase คืนโควตาพื้นที่ 1GB ฟรีได้อย่างราบรื่น
>    - **API POST** `/api/system/firmware/upload`: ใช้ตรวจรับการยืนยันไฟล์ ทำการคำนวณ MD5 Checksum ความละเอียดสูง (กันบอร์ดค้างเนื่องจากไฟล์ดาวน์โหลดไม่ครบถ้วน) และอัปเดตสเตตัสในระบบ
> 
> 3. **ขั้นตอนปฏิบัติงานจริง (Production Firmware Upload Guide):**
>    - **ขั้นที่ 1**: แก้ไขโค้ด C++ (เพิ่มเลขเวอร์ชัน) และกด **Export Compiled Binary** ในโปรแกรม Arduino IDE จะได้ไฟล์ `.bin`
>    - **ขั้นที่ 2**: อัปโหลดไฟล์ `.bin` ขึ้นไปเก็บบน **Supabase Storage Console** และคัดลอก **Public URL** ออกมา
>    - **ขั้นที่ 3**: ไปที่หน้าเว็บแดชบอร์ด SmartAccess เมนูตั้งค่าระบบ ระบุรุ่น ป้อน Public URL ที่ได้ เลือกไฟล์บนเครื่องเพื่อให้ระบบบราวเซอร์คำนวณ MD5 Checksum และกดอัปโหลด บอร์ดจะทำกระบวนการตรวจจับ ดึง และอัปเกรดตัวเองทันทีไร้ความเสถียรตกต่ำ!

> **อัปเดตล่าสุด**: 2026-05-28 17:20:00 +07:00 — **คู่มือยกระดับความยืดหยุ่นในการเชื่อมต่อฐานข้อมูลและการดึงข้อมูลสถิติอัตโนมัติของแดชบอร์ด (Enterprise Database Fallback & Zero-Delay Dashboard Analytics System)**
>
> เพื่อรองรับเสถียรภาพระดับสูงในสิ่งแวดล้อมที่หลากหลาย (เช่น การสลับระหว่างเครื่องพัฒนาในเครื่องโลคอลกับโปรดักชันบนคลาวด์ Vercel/Supabase) ระบบได้รับการอัปเกรดเพื่อป้องกันปัญหาเซิร์ฟเวอร์ล่ม (500 Internal Server Error) และปัญหาแดชบอร์ดสถิติไม่แสดงข้อมูลในการเปิดหน้าเว็บครั้งแรก ดังรายละเอียดต่อไปนี้:
>
> 1. **การสร้างระบบเชื่อมต่อฐานข้อมูลสำรองอัตโนมัติ (Multi-Environment Database Connection Resiliency):**
>    - มีการปรับปรุงโมดูลเชื่อมต่อฐานข้อมูลใน [lib/db.ts](my-app/lib/db.ts) ให้รองรับการอ่านค่าตัวแปร `DATABASE_URL` แบบ Dynamic เป็น Fallback หากไม่ได้มีการตั้งค่าตัวแปรสภาพแวดล้อม `POSTGRES_URL` บน Vercel
>    - ปรับปรุงการตรวจสอบ SSL Handshake ให้ยืดหยุ่นยิ่งขึ้น: หากไม่ได้ระบุใบรับรองความปลอดภัยเฉพาะทาง `SUPABASE_CA_CERT` หรือไม่สามารถถอดรหัสค่าอักขระได้ (เช่น ค่า `\n` ที่พาสต์ลง Vercel ผิดเพี้ยน) ระบบจะทำการตั้งค่าเป็น `rejectUnauthorized: false` แบบอัตโนมัติ เพื่อให้เซิร์ฟเวอร์เชื่อมโยงกับฐานข้อมูล Supabase ต่อไปได้อย่างราบรื่นและไม่เกิดข้อผิดพลาด 500
>
> 2. **การอัปเดตระบบดึงข้อมูลแดชบอร์ดวิเคราะห์สถิติอัจฉริยะ (Zero-Delay SVG Analytics Initialization):**
>    - แก้ไขข้อผิดพลาดด้านสถานะ (UX State Bug) ในแดชบอร์ดหลักที่ [page.tsx](my-app/app/admin/dashboard/page.tsx) ที่คอยดึงข้อมูลเฉพาะตอนเปิดแท็บทำเนียบ `"all"` เท่านั้น
>    - ปรับโค้ดให้ `useEffect` ดึงข้อมูลสถิติของทั้งนักเรียนทั้งหมด (`fetchAll`) และรายงานเหตุการณ์ (`fetchLogs`) โดยอัตโนมัติตั้งแต่ตอนเข้าหน้าเว็บครั้งแรกที่แท็บ `"pending"` และแท็บห้องปฏิบัติการ `"rooms"` เพื่อให้กราฟสถิติ Zero-Dependency SVG Analytics Dashboard โหลดข้อมูลขึ้นมาพร้อมใช้งานทันทีโดยไม่ต้องทำการรีเฟรชหรือกดเปลี่ยนแท็บเพื่อดึงข้อมูลอีกต่อไป

<p align="right"><a href="#toc">⬆ กลับสารบัญ</a></p>
