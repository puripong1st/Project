# 🚪 SmartAccess Access Control System

### *Innovative system for managing access rights and controlling classroom access via wireless network*
> **ระบบควบคุมการเข้าออกห้องปฏิบัติการเรียนการสอนอัจฉริยะแบบ Full-Stack IoT & Dashboard ประสิทธิภาพสูง**  
> พัฒนาขึ้นโดยสอดคล้องตามมาตรฐาน **พ.ร.บ. คอมพิวเตอร์ มาตรา 26 (จัดเก็บ Log ≥ 90 วัน)** และหลักการ **PDPA** ของประเทศไทยอย่างเป็นทางการ

---

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15+-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="Next.js 15" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-Ready-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase PostgreSQL" />
  <img src="https://img.shields.io/badge/ESP32-Hardware-E7352C?style=for-the-badge&logo=espressif&logoColor=white" alt="ESP32 IoT" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind v4" />
</p>

---

## 🏛️ สถาปัตยกรรมและฟีเจอร์เด่นระบบ (Core Architecture & Features)

### 🎨 1. Minimalist Glassmorphism UI (ระบบสีประจำคณะ)
* ออกแบบหน้าลงทะเบียนด้วยคู่สี **Harmony Palette Design System**: **สีม่วง RMUTP (#7C3AED)** และ **สีชมพูคณะครุศาสตร์อุตสาหกรรม (#DB2777)**
* คอนเทนเนอร์สีกระจกโปร่งแสงหรูหรา (Glassmorphism Effects), ไอคอนเรืองแสง และปุ่มกดมีอนิเมชันตอบสนองลื่นไหลแบบสมบูรณ์ 100% บนทุกขนาดหน้าจอ (Mobile responsive locks)

### 📊 2. แดชบอร์ดตรวจสอบสถานะเรียลไทม์ (Enterprise Status Grid)
* **Supabase PostgreSQL Table Status**: แสดงสถานะการเชื่อมต่อ และการทำงานของฐานข้อมูล Supabase
* **ESP32 Controller Status**: ตรวจสอบบอร์ดฮาร์ดแวร์หน้าห้องเรียนแบบเรียลไทม์ ทราบเลขไอพี โหมดการทำงาน (จำลอง/จริง) และสถานะกลอนล็อกแม่เหล็กไฟฟ้ารีเลย์ (🔒 Lock / 🔓 Open)
* **Discord Notification Broker**: ยืนยันความพร้อมของบอทส่งข้อความแจ้งเตือนสถานะความปลอดภัย

### ⚖️ 3. ระบบจัดการประวัติสอดคล้องกับ พ.ร.บ. คอมพิวเตอร์ & PDPA
* จัดเก็บบันทึกประวัติจราจรทางคอมพิวเตอร์เข้าออกประตูห้องเรียนอย่างเคร่งครัดตาม **พ.ร.บ. คอมพิวเตอร์ ม.26 (ไม่น้อยกว่า 90 วัน)**
* **ระบบความปลอดภัยสองชั้น (Double Failsafe Settings)**: ลบ Log หมดอายุ (>90 วัน) ได้ฟรีในคลิกเดียว ส่วนประวัติที่ยังไม่หมดอายุ (<90 วัน) ระบบจะบังคับให้แอดมินระดับสูงสุดกรอกรหัสยืนยันตัวตน (`bcryptjs`) ป้องกันแฮกเกอร์ทำลายร่องรอย
* **Consent Manager UI (PDPA)**: หน้าต่างขอความยินยอม Cookies แบบคัดสรรประเภทการเก็บข้อมูล มีหน้า Privacy Policy และข้อสัญญาการใช้งาน (Terms of Services) ครบถ้วนตามกฎหมาย PDPA ของไทย

### 🚀 4. ระบบอัปเดตเฟิร์มแวร์ไร้สายแบบประหยัดพลังงานคลาวด์ (Cloud HTTPS OTA Center)
* **Vercel Ephemeral Failsafe**: ออกแบบระบบจัดเก็บไฟล์ `.bin` บนคลาวด์ **Supabase Storage (โควตาฟรี 1GB)** เพื่อเลี่ยงข้อจำกัดไฟล์สูญหายของระบบตู้คอนเทนเนอร์ Vercel Free Plan
* **HTTP 302 Direct CDN Redirection**: ตัว API Next.js ทำหน้าที่ตรวจจับสิทธิ์ความปลอดภัยแล้วส่ง Redirect ให้บอร์ด ESP32 วิ่งไปโหลดไฟล์ตรงผ่าน Supabase Storage CDN ช่วยประหยัดซีพียูของเซิร์ฟเวอร์ Next.js เหลือ 0%
* **Local LAN ElegantOTA**: บอร์ด ESP32 รองรับการปล่อยอัปโหลดผ่านเครือข่ายวงแลนเดียวกันได้ที่พอร์ต `http://<IP_ADDRESS>/update` โดยมีระบบรหัสผ่านแอดมินสูงสุดควบคุม

### 📄 5. รายงาน PDF ระดับอุตสาหกรรม (Landscape Server-Side PDF)
* ประมวลผลเอกสาร PDF บนเซิร์ฟเวอร์ด้วย `pdfkit` ออกแบบตารางในแนวแนวนอน (Landscape) เพื่อความชัดเจน อ่านง่าย เป็นทางการ
* มีปุ่มเปิดห้องแบบเร่งด่วน (Emergency Unlock) และปิดกั้นประตูล็อกอัตโนมัติ 5 วินาที พร้อมอนิเมชันเกจลดเวลาบนหน้าจอ TFT สลักคมชัดสวยงาม

---

## 💻 เทคโนโลยีที่เลือกใช้ (Technology Stack)

```
┌────────────────────────────────────────────────────────┐
│             💻 NEXT.JS 15+ & REACT 19 WEB APP          │
├────────────────────────────────────────────────────────┤
│ Styling: Vanilla CSS + Tailwind CSS v4 Harmony Palette │
│ Databases: Supabase PostgreSQL & Connection Pool (6543)│
│ Storage: Supabase Object Storage (1GB Free bucket)     │
│ Auth: JWT Sessions + bcryptjs secure hashing           │
│ Reporting: Server-side landscape pdfkit generator     │
└───────────────────────────┬────────────────────────────┘
                            │ (HTTPS Client Polling / WebServer Push)
┌───────────────────────────▼────────────────────────────┐
│                    📡 ESP32 Microcontroller            │
├────────────────────────────────────────────────────────┤
│ Output Pinouts: GPIO 12 Relay · GPIO 27 Active Buzzer  │
│ Indicators: GPIO 14 WiFi LED · GPIO 26 Reject LED      │
│ Display Panel: ILI9341 SPI TFT LCD (3.2 inch)          │
│ Local Features: LAN Webserver ElegantOTA Update        │
└────────────────────────────────────────────────────────┘
```

---

## 📂 โครงสร้างโฟลเดอร์หลัก (Project Structure)

```
my-app/
├── app/
│   ├── globals.css           # โครงสร้างดีไซน์และโทนสีของทั้งระบบ (Harmony Palette)
│   ├── page.tsx              # หน้าจอลงทะเบียนขอเข้าใช้งานของนักศึกษา + Countdown Timer
│   ├── admin/
│   │   ├── login/page.tsx    # หน้าลงชื่อเข้าใช้งานของแอดมิน
│   │   └── dashboard/page.tsx# หน้าบอร์ดควบคุมความปลอดภัยและ OTA Firmware Upload Center
│   └── api/
│       ├── system/
│       │   ├── status/route.ts   # ดึงสถานะ live ตู้ Supabase, ESP32, Discord
│       │   ├── settings/route.ts # ดึงและบันทึกค่าระบบความปลอดภัย / Webhooks แยกห้อง
│       │   ├── logs/cleanup/route# ระบบทำความสะอาดลบประวัติความปลอดภัยตามกฎหมาย
│       │   └── firmware/upload/ro# ระบบอัปโหลดและออกคีย์ไฟล์เฟิร์มแวร์ .bin ไร้สาย
│       ├── esp32/
│       │   ├── display/route.ts  # จ่ายข้อมูลหน้าจอ TFT + สั่งการ OTA อัปเกรด
│       │   └── firmware-ota/route# จัดการส่งบอร์ดอัปเดตแบบ 302 Supabase Redirect
│       └── export/pdf/route.ts   # เขียนประวัติ PDF ส่งออกแนวนอน
├── esp32/
│   └── esp32.ino                 # ซอร์สโค้ดอัปโหลดชิปของ ESP32 จริงและ Wokwi Simulator
├── lib/
│   ├── db.ts                 # ตัวเชื่อมต่อ Supabase PostgreSQL และสร้างตารางอัตโนมัติ
│   ├── esp32.ts              # ตัวจัดการ HTTP Call สั่งปลดล็อกไปฮาร์ดแวร์จริง
│   └── discord.ts            # ตัวยิง Webhook แจ้งเตือนบอทห้องแชทแยกตามห้องเรียน
└── .env.local                # ไฟล์เก็บค่า Config และความลับระบบคลาวด์
```

---

## 🚀 ขั้นตอนการติดตั้งและรันเซิร์ฟเวอร์ (Getting Started)

### 1. ติดตั้งไลบรารี
```bash
cd my-app
npm install
```

### 2. ตั้งค่าไฟล์สภาพแวดล้อม `.env.local`
สร้างไฟล์ `.env.local` ไว้ที่โฟลเดอร์ `my-app/` และกำหนดค่าดังนี้:
```env
# ฐานข้อมูล Supabase PostgreSQL (ใช้พอร์ต PgBouncer 6543)
DATABASE_URL="postgres://postgres.xxxx:password@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# ความปลอดภัยเซสชัน JWT
JWT_SECRET="สุ่มข้อความยาวๆความปลอดภัยของคุณ"

# ตัวกำหนดค่าฮาร์ดแวร์บอร์ด
ESP32_IP="192.168.1.100"
ESP32_PORT="80"
ESP32_MOCK_MODE="false"

# ลิงก์แจ้งเตือนบอท Discord หลัก
DISCORD_WEBHOOK_URL="https://discord.com/api/webhooks/..."
```

### 3. รันระบบเซิร์ฟเวอร์สำหรับการพัฒนา
```bash
npm run dev
```
* หน้าจอลงทะเบียนของนักศึกษา: [http://localhost:3000](http://localhost:3000)
* แดชบอร์ดแอดมิน: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)
  - **บัญชีเริ่มต้น**: Username: `admin` | Password: `admin123` *(ระบบจะบังคับให้เปลี่ยนเพื่อความปลอดภัยสูงสุดในการรันโปรดักชัน)*

---

## 📡 การต่ออุปกรณ์ฮาร์ดแวร์บอร์ด ESP32 (ILI9341 SPI)
ซอร์สโค้ดของบอร์ด ESP32 อยู่ภายใต้ [**`esp32/esp32.ino`**](file:///c:/Users/aunkh/OneDrive/Desktop/Project/esp32/esp32.ino)

### รายละเอียดพอร์ตการต่อขา:
* **TFT LCD 3.2" (ILI9341)**: CS ➔ 15, RST ➔ 4, DC ➔ 2, MOSI ➔ 23, MISO ➔ 19, SCK ➔ 18
* **Relay Output (คุมกลอนแม่เหล็ก 280kg)**: GPIO 12
* **Active Buzzer (เสียงดนตรีบูตและปลดล็อก)**: GPIO 27
* **WiFi Status LED**: GPIO 14 (กะพริบเมื่อค้นหาสัญญาณ / ติดค้างเมื่อเชื่อมสำเร็จ)
* **Reject Status LED**: GPIO 26 (สว่างวาบสีแดงสลับสิทธิ์ถูกปฏิเสธ)

---

## ⚖️ มาตรฐานความสอดคล้องทางกฎหมาย (Legal Compliance & Ethics)
ระบบนี้ทำงานโดยเคารพสิทธิ์และรักษาความเป็นส่วนตัวของผู้ใช้งานอย่างเป็นรูปธรรม:
* **พ.ร.บ. คอมพิวเตอร์ พ.ศ. 2550 มาตรา 26**: จัดเก็บบันทึกประวัติข้อมูลการจราจรเข้าอาคารอย่างสมบูรณ์แบบไม่น้อยกว่า 90 วัน มีระบบป้องภัยทำลายหลักฐานด้วยรหัสผ่านแอดมินสูงสุด
* **PDPA (พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562)**: คุมนโยบายการจัดเก็บสิทธิ์ความเห็นชอบผู้ใช้งานแบบคัดแยกหมวดหมู่ (Granular Consent Management) และมีฟังก์ชันเพิกถอนสิทธิ์/ขอลบข้อมูลตามมาตรา 22-26 อย่างถูกต้องตามกฎหมายของไทย

---
*นวัตกรรมระบบควบคุมการเข้าออกห้องปฏิบัติการอัจฉริยะ คณะครุศาสตร์อุตสาหกรรม มหาวิทยาลัยเทคโนโลยีราชมงคลพระนคร*
*(SmartAccess Faculty of Technical Education, RMUTP)*
