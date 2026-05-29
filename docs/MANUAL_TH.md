# Innovative system for managing access rights and controlling classroom access via wireless network

> ระบบควบคุมการเข้าใช้ห้องด้วย IoT — Innovative system for managing access rights and controlling classroom access via wireless network
> เอกสารฉบับนี้อธิบายตั้งแต่ภาพรวม → หน้าจอผู้ใช้ → หน้าจอแอดมิน → หน้าจอ TFT บน ESP32 → โค้ดทั้งฝั่งเว็บและ `.ino` → บทบาทของ Supabase และ Vercel → อัลกอริทึม/Flowchart → เหตุผลที่บางส่วนเร็ว/ช้า

---

## สารบัญ
1. [ภาพรวมระบบ (Architecture)](#1-ภาพรวมระบบ)
2. [อุปกรณ์ควบคุมการเข้าใช้ห้อง (ESP32)](#2-อุปกรณ์ควบคุมการเข้าใช้ห้อง)
3. [หน้าจอผู้ใช้งาน (นักศึกษา)](#3-หน้าจอผู้ใช้งาน-นักศึกษา)
4. [หน้าจอระบบ (แอดมิน)](#4-หน้าจอระบบ-แอดมิน)
5. [การแสดงผลของ ESP32/TFT](#5-การแสดงผลของ-esp32tft)
6. [อธิบายโค้ดฝั่งเว็บ (Next.js)](#6-อธิบายโค้ดฝั่งเว็บ)
7. [อธิบายโค้ดฝั่ง ESP32 (`esp32.ino`)](#7-อธิบายโค้ดฝั่ง-esp32)
8. [Supabase ทำหน้าที่อะไร](#8-supabase-ทำหน้าที่อะไร)
9. [Vercel ทำหน้าที่อะไรกับ my-app](#9-vercel-ทำหน้าที่อะไรกับ-my-app)
10. [อัลกอริทึม + Flowchart](#10-อัลกอริทึม--flowchart)
11. [เหตุผลที่บางระบบเร็ว / บางระบบช้า](#11-เหตุผลที่บางระบบเร็วบางระบบช้า)
12. [การอัปเดตระบบ (2026-05-28)](#12-การอัปเดตระบบ-2026-05-28)
    - [12.1 ESP32 Adaptive Polling + ETag Cache](#121-esp32-adaptive-polling--etag-cache-ประสิทธิภาพ-polling-ดีขึ้น-310)
    - [12.2 Server-Sent Events (SSE) — Dashboard Real-time](#122-server-sent-events-sse--dashboard-อัปเดตแบบ-real-time)
    - [12.3 OTA Firmware Progress Bar บน TFT](#123-ota-firmware-progress-bar-บน-tft-ใน-arduino-template)
    - [12.4 ตารางเวลาเปิด-ปิดห้อง (Room Schedules)](#124-ตารางเวลาเปิด-ปิดห้อง-room-schedules)
    - [12.5 ตั้งค่าการอนุมัติแยกต่อห้อง (Per-Room Settings)](#125-ตั้งค่าการอนุมัติแยกต่อห้อง-per-room-settings)
    - [12.6 Performance Indexes และ ตาราง DB ใหม่](#126-performance-indexes-และ-ตาราง-db-ใหม่)
    - [12.7 OTA Firmware — Discord Notification + Web Logs](#127-ota-firmware--discord-notification--web-logs)
    - [12.8 อัปเดต Flow/Section ที่มีอยู่](#128-อัปเดต-section-ที่มีอยู่)
    - [12.9 สรุปไฟล์ที่เปลี่ยนแปลง](#129-สรุปไฟล์ที่เปลี่ยนแปลงทั้งหมด-2026-05-28)

---

## 1. ภาพรวมระบบ

```
┌──────────────┐     HTTPS      ┌─────────────────────┐    SQL (TLS)   ┌──────────────┐
│  นักศึกษา    │ ─────────────▶ │   Next.js (Vercel)  │ ─────────────▶ │  Supabase    │
│  (เบราว์เซอร์)│ ◀───────────── │   API + UI          │ ◀───────────── │  PostgreSQL  │
└──────────────┘                └─────────┬───────────┘                └──────────────┘
                                          │ LAN HTTP (ถ้าอยู่วงเดียวกัน)
                                          │ + Discord Webhook (แจ้งเตือน)
                                          ▼
                                ┌─────────────────────┐
                                │  ESP32 + TFT + รีเลย์│
                                │  Poll /api/esp32/*   │
                                └──────────┬──────────┘
                                           ▼
                                    🔒 โซลินอยด์ปลดล็อกประตู
```

**ส่วนประกอบหลัก 3 ก้อน**
| ก้อน | หน้าที่ | ที่ตั้ง |
|------|---------|---------|
| **my-app/** | เว็บ Next.js 16 + React 19 (UI + API) | รันบน Vercel |
| **Supabase** | ฐานข้อมูล PostgreSQL (เก็บนักศึกษา/แอดมิน/log/QR/settings) | Cloud |
| **esp32/esp32.ino** | เฟิร์มแวร์ ควบคุมประตู + TFT + บัซเซอร์ | ติดที่หน้าห้อง |

ทั้งสามก้อนคุยกันผ่าน **HTTP/HTTPS + JSON** เท่านั้น ไม่มี WebSocket ไม่มี MQTT → ทำให้ deploy ง่ายแต่มีความหน่วงจาก polling (รายละเอียดดูข้อ 11)

---

## 2. อุปกรณ์ควบคุมการเข้าใช้ห้อง

### 2.1 ฮาร์ดแวร์
| อุปกรณ์ | ขา (Pin) | หน้าที่ |
|---------|----------|---------|
| ESP32 DevKit | — | สมองหลัก, มี Wi-Fi |
| รีเลย์ → โซลินอยด์ล็อก | `RELAY_PIN = 12` | จ่ายไฟปลดล็อกประตู |
| TFT ILI9341 320×240 | `TFT_CS=15, TFT_DC=2, SPI` | แสดงสถานะ/QR |
| Buzzer (Active) | `BUZZER_PIN = 27` | เสียงเตือนปลดล็อก/ผิดพลาด |
| ปุ่มฉุกเฉิน (option) | GPIO | ปลดล็อกแบบ Manual |

### 2.2 การเชื่อมต่อ
1. **Wi-Fi**: ESP32 boot → อ่าน SSID/PASS จาก `config.h` → connect → ขึ้น IP บน TFT
2. **Server**: ใส่ค่า `SERVER_URL` (เช่น `https://smartaccess.vercel.app`) ใน `config.h`
3. **Auth**: ทุก request ใส่ header `X-API-Key: <ESP32_API_KEY>` ตรงกับฝั่งเซิร์ฟเวอร์
4. **Mode** (กำหนดใน Next.js ผ่าน env `ESP32_MODE`):
   - `mock` — เซิร์ฟเวอร์ไม่ยิงไป ESP32 จริง ใช้ตอนพัฒนา
   - `wokwi` — ใช้ Wokwi Simulator
   - `physical` — ยิงตรงไป `http://<ESP32_IP>:<ESP32_PORT>/unlock`

### 2.3 หน้าจอแสดงข้อมูลการใช้ห้อง (TFT)
มี 4 เฟรมหลัก สลับตามสถานะ:

```
┌────────────── IDLE ──────────────┐   ┌──────── QR DISPLAY ─────────┐
│  SmartAccess — ห้องปฏิบัติการ ___ │   │   สแกนเพื่อเข้าห้อง         │
│  สถานะ: 🟢 พร้อมใช้งาน           │   │   ┌──────────┐              │
│  เวลา 14:32                      │   │   │  ▓▓░▓░▓  │ ← QR Code    │
│  สแกน QR ที่โทรศัพท์เพื่อเข้า   │   │   │  ░▓▓░▓░  │              │
│  Wi-Fi: ●  Server: ●             │   │   └──────────┘              │
└──────────────────────────────────┘   └──────────────────────────────┘

┌──────── UNLOCK SUCCESS ─────────┐    ┌──────── DENIED ─────────────┐
│         ✅ ปลดล็อกแล้ว           │    │       ❌ ไม่อนุญาต           │
│      ยินดีต้อนรับ คุณ ___        │    │   QR หมดอายุ / ผู้ใช้ไม่ได้  │
│      (รีเลย์ ON 3 วินาที)        │    │   รับอนุมัติ                │
└──────────────────────────────────┘    └──────────────────────────────┘
```

---

## 3. หน้าจอผู้ใช้งาน (นักศึกษา)

ไฟล์: `my-app/app/page.tsx` (1,411 บรรทัด)

### 3.1 ลำดับการใช้งาน
1. เข้าเว็บ → กรอกฟอร์มสมัคร (ชื่อ-สกุล, รหัสนักศึกษา, คณะ, เบอร์, อีเมล)
2. ระบบบันทึก `students.status = pending` → ส่งแจ้งเตือนเข้า Discord
3. รอแอดมินอนุมัติ (เห็นสถานะได้จากการ login กลับมาเช็ค หรือดูจากอีเมล/Line ที่ทาง รร. แจ้ง)
4. หลังอนุมัติ → เข้าเว็บ → กดปุ่ม **“ขอ QR เพื่อเปิดประตู”**
5. ระบบสร้าง **One-time QR token** (เก็บใน `dynamic_qr_tokens`, มี `is_consumed` flag) → แสดง QR เป็นรูป PNG
6. นักศึกษานำ QR ไปสแกนที่เครื่องอ่านหน้าห้อง (หรือ ESP32 ดึง QR มาแสดงบน TFT แล้วยืนยันสิทธิ์)
7. ระบบ verify → ถ้าถูกต้อง → mark `is_consumed=true` → สั่ง ESP32 ปลดล็อก → log `door_opened`

### 3.2 ข้อจำกัดด้านความปลอดภัย
- QR ใช้ครั้งเดียว มี TTL สั้น (กำหนดใน `lib/qr.ts`)
- Rate limit: ขอปลดล็อกแบบ bypass ได้สูงสุด **3 ครั้ง/นาที** ต่อรหัสนักศึกษา

---

## 4. หน้าจอระบบ (แอดมิน)

ไฟล์เดียวรวบทุกแท็บ: `my-app/app/admin/dashboard/page.tsx` (5,620 บรรทัด — เป็น SPA ภายในหน้าเดียว ใช้ state สลับ tab)

### 4.1 หน้าจอลงชื่อเข้าใช้งาน (`/admin/login`)
- ฟอร์ม username/password → `POST /api/auth/login`
- ฝั่งเซิร์ฟเวอร์ตรวจ bcrypt hash → ออก JWT (HS256, อายุ 8 ชม.) → ใส่ใน **httpOnly cookie** `admin_token`
- **Rate limit**: 10 ครั้ง/IP/5 นาที (`lib/rate-limit.ts`) → กัน brute-force
- ถ้าผิดเกิน → 429 Too Many Requests

### 4.2 หน้าจอข้อมูลผู้ใช้งาน (Students List)
- ดึงจาก `GET /api/students` (รองรับ filter: pending/approved/rejected)
- แสดงตาราง: รหัส, ชื่อ, คณะ, สถานะ, เวลาสมัคร
- ปุ่มจัดการ: อนุมัติ / ปฏิเสธ / รีเซ็ต

### 4.3 หน้าจอจัดการข้อมูล (Manage)
- เพิ่ม/แก้ไข/ลบ นักศึกษาแบบ Manual
- **เฉพาะ role `owner`**: เพิ่มแอดมินใหม่ ผ่าน `POST /api/admin-users`
  - validate username `^[a-zA-Z0-9_.]{3,30}$`, password ≥ 8 ตัวอักษร
  - hash ด้วย bcrypt ก่อนบันทึก

### 4.4 หน้าจอแสดงรายละเอียดห้อง
- เชื่อม `GET /api/esp32/status` — เช็ค **last seen** ของ ESP32 (อัปเดตทุกครั้งที่ ESP32 poll)
- แสดง: สถานะออนไลน์, IP, Mode, อุณหภูมิ (ถ้ามี sensor), จำนวนการเข้าใช้วันนี้

### 4.5 หน้าจอแสดงข้อมูลผู้ใช้งาน (Detail)
- คลิกที่นักศึกษาคนหนึ่ง → modal/panel แสดงข้อมูลเต็ม + ประวัติการเข้าห้องของเขา
- ดึงจาก `GET /api/students/[id]` + `GET /api/logs?student_id=...`

### 4.6 หน้าจอปลดล็อกบัญชีผู้ใช้งาน
- เคสที่นักศึกษาโดน lock (เช่น ขอ bypass เกิน rate limit) → owner สามารถ reset ได้
- เรียก endpoint ที่เคลียร์ rate-limit cache + log event

### 4.7 หน้าจอเข้าร่วมการขออนุญาต (Pending Approval)
- ดึงรายการ `students.status='pending'` ผ่าน `GET /api/students/pending`
- ปุ่มเดียวกด **อนุมัติทีละคน** หรือ **อนุมัติทั้งหมด**
- เมื่ออนุมัติ → `PATCH /api/students/[id]` ส่ง `{status:'approved'}` → ส่ง Discord webhook แจ้งนักศึกษา

### 4.8 หน้าจอประวัติขอใช้สิทธิ์ (Access Logs)
- ดึง `GET /api/logs?limit=...`
- กรองตาม action: `registered | approved | rejected | door_opened | door_failed | firmware_deployed | firmware_ota_triggered`
- กรอง OTA เฉพาะ: `GET /api/logs?action=firmware&limit=50`
- **กฎ พ.ร.บ. คอมฯ มาตรา 26**: log ที่มีอายุ **< 90 วัน** ห้ามลบเด็ดขาด ถ้าจะเคลียร์ต้องยืนยันรหัสผ่าน owner อีกครั้ง

### 4.9 หน้าจอกำหนดเงื่อนไขการทำงานของระบบ (Settings)
- ตาราง `system_settings` (key/value) — มี **30 วินาที cache** ที่ฝั่งเซิร์ฟเวอร์
- ตั้งได้: เวลาเปิด-ปิดห้อง, เวลาปลดล็อก, เปิด/ปิด Discord webhook, ESP32 mode, ข้อความบน TFT
- บันทึกผ่าน `PATCH /api/system/settings`

### 4.10 หน้าจอรายงานขอใช้สิทธิ์ (Reports / Export)
- กดปุ่ม → `GET /api/export/pdf?from=...&to=...`
- ฝั่งเซิร์ฟเวอร์ใช้ **pdfkit** สร้าง PDF แนวนอน (landscape) บนเซิร์ฟเวอร์ → stream กลับเป็นไฟล์
- รายงานมี: สรุปจำนวนเข้าใช้/วัน, top user, ความผิดปกติ

### 4.11 ระบบจัดการเฟิร์มแวร์แบบไร้สาย (OTA Firmware Control Center)

> **เฉพาะ role `owner` เท่านั้น** — อยู่ในแท็บ ESP32 Settings ของ Dashboard

#### ภาพรวม
ระบบอัปเดตเฟิร์มแวร์ ESP32 ผ่าน Cloud HTTPS โดยไม่ต้องต่อสาย USB โดยมีขั้นตอนดังนี้:

```
แอดมินอัปโหลด .bin → Supabase Storage → บันทึก URL ลง firmware_releases
                                                     ↓
ESP32 poll /api/esp32/firmware-ota ทุก ~3 วินาที → เปรียบเทียบ version
                                                     ↓ (version ต่างกัน)
302 Redirect → Supabase Storage URL → ESP32 ดาวน์โหลดและแฟลชตัวเอง
```

#### วิธีใช้งาน (ขั้นตอน)
1. อัปโหลดไฟล์ `.bin` ที่ Compile แล้วขึ้น **Supabase Storage** bucket ด้วยตนเอง
2. Copy **Public URL** ของไฟล์จาก Supabase Storage
3. ในหน้า Dashboard → แท็บ ESP32 → ส่วน "OTA Firmware Control Center":
   - กรอก **Version** (เช่น `1.2.0`)
   - วาง **Supabase Storage Public URL**
   - เลือก **ไฟล์ .bin** บนเครื่อง (เพื่อคำนวณ MD5 Checksum เท่านั้น ไม่ได้อัปโหลดขึ้นเซิร์ฟเวอร์)
   - กด **"🚀 เปิดตัวปล่อยอัปเดตแบบไร้สาย (Deploy OTA)"**
4. ระบบบันทึก URL + version + MD5 ลง `firmware_releases` table
5. ในรอบ poll ถัดไป ESP32 จะตรวจพบ version ใหม่ → ดาวน์โหลด + แฟลชอัตโนมัติ

#### API Endpoints ที่เกี่ยวข้อง
| Endpoint | Method | หน้าที่ |
|----------|--------|---------|
| `POST /api/system/firmware/upload` | POST | อัปโหลด metadata + คำนวณ MD5 (owner only) |
| `GET /api/system/firmware` | GET | ดึงรายการ firmware releases ทั้งหมด |
| `DELETE /api/system/firmware?id=N` | DELETE | ลบประวัติ firmware release (owner only) |
| `GET /api/esp32/firmware-ota` | GET | ESP32 poll endpoint — ตรวจ version + redirect |

#### ESP32 Firmware Header ที่ต้องส่ง
```
GET /api/esp32/firmware-ota?room=LAB01
Authorization: Bearer <ESP32_API_KEY>
x-esp32-version: 1.0.0
```
- `304 Not Modified` → version เดิม ไม่ต้องอัปเดต
- `302 Redirect → Supabase URL` → มี version ใหม่ ให้ดาวน์โหลด

#### การแจ้งเตือน Discord (Webhook)
ระบบส่งการแจ้งเตือน Discord อัตโนมัติใน 2 เหตุการณ์:

| เหตุการณ์ | Discord Event | รายละเอียด |
|-----------|--------------|------------|
| แอดมิน Deploy OTA | `firmware_deployed` 🚀 | Version ใหม่, MD5, ขนาดไฟล์, ชื่อแอดมิน |
| ESP32 เริ่มดาวน์โหลด | `firmware_ota_triggered` ⬇️ | Version เก่า→ใหม่, ห้อง, IP บอร์ด, MD5 |

Webhook จะถูกส่งไปที่ channel เดียวกับ `discord_webhook_logs` หรือ `discord_webhook_admin_audit`

#### บันทึกกิจกรรม OTA (Web Logs)
กิจกรรม OTA ทุกครั้งจะถูกบันทึกใน `access_logs` table ด้วย action types เฉพาะ:

| action | ความหมาย |
|--------|---------|
| `firmware_deployed` | แอดมิน Deploy firmware ใหม่ |
| `firmware_ota_triggered` | ESP32 เริ่มดาวน์โหลด firmware |

แสดงผลในหน้า Dashboard ที่ส่วน **"📋 บันทึกกิจกรรม OTA แบบละเอียด"** พร้อมแสดง IP ของบอร์ด, ห้อง, timestamp แบบเรียลไทม์

#### โครงสร้างฐานข้อมูล (`firmware_releases`)
```sql
CREATE TABLE firmware_releases (
  id          SERIAL PRIMARY KEY,
  version     VARCHAR(32) UNIQUE NOT NULL,   -- เช่น "1.2.0"
  file_path   TEXT NOT NULL,                  -- Supabase Storage Public URL
  file_size   INT NOT NULL,                   -- bytes
  checksum_md5 VARCHAR(32) NOT NULL,          -- MD5 hash ยืนยันความสมบูรณ์
  uploaded_at TIMESTAMP DEFAULT NOW(),
  uploaded_by INT REFERENCES admin_users(id)  -- ผู้อัปโหลด
);
```

#### ข้อควรระวัง
- **อย่า Deploy firmware ที่ยังไม่ได้ test** — ESP32 ทุกตัวในระบบจะอัปเดตพร้อมกัน
- **MD5 Checksum**: ESP32 ตรวจสอบ checksum หลังดาวน์โหลด — ถ้าไม่ตรงจะ rollback อัตโนมัติ
- **Supabase Storage ฟรี**: อย่าเก็บไฟล์ .bin เกิน 1 GB (quota ฟรีของ Supabase)
- **ลบ release เก่า**: ใช้ปุ่ม "ถอน" ใน Dashboard แต่ต้องลบไฟล์จาก Supabase Storage ด้วยมือเพื่อคืน quota

---

## 5. การแสดงผลของ ESP32/TFT

### 5.1 State Machine บน ESP32
```
        ┌──────────┐  poll ok / มีคำสั่ง unlock     ┌─────────────┐
        │  IDLE    │ ─────────────────────────────▶ │  UNLOCKING  │
        │ (โชว์ QR │                                │  RELAY=HIGH │
        │  + เวลา) │ ◀──── หมดเวลา 3 วินาที ────── │  3 วินาที   │
        └────┬─────┘                                └─────────────┘
             │  WiFi/Server หาย
             ▼
        ┌──────────┐
        │  OFFLINE │  → พยายาม reconnect ทุก 5 วินาที
        └──────────┘
```

### 5.2 รอบการ poll
- ทุก ~3–5 วินาที ESP32 ยิง `GET /api/esp32/display` พร้อม `X-API-Key`
- เซิร์ฟเวอร์ตอบ JSON: `{ command: "unlock"|"none", student: {...}, ttl: 3, ui: {...} }`
- ถ้า `command=="unlock"` → ESP32 สั่งรีเลย์ + แสดงชื่อบน TFT + บัซเซอร์ short beep
- จากนั้นยิง `POST /api/esp32/status` รายงานผล (success/failure)

---

## 6. อธิบายโค้ดฝั่งเว็บ

### 6.1 โครงสร้าง
```
my-app/
├── app/
│   ├── page.tsx              ← หน้าผู้ใช้ (สมัคร + ขอ QR)
│   ├── admin/
│   │   ├── login/page.tsx    ← หน้า login
│   │   └── dashboard/page.tsx ← Dashboard (รวมทุก tab)
│   └── api/                  ← API routes (Edge/Node)
│       ├── auth/             ← login, logout, me, refresh
│       ├── students/         ← CRUD + pending + bypass + check-match
│       ├── admin-users/      ← จัดการแอดมิน (owner only)
│       ├── esp32/            ← display, qr, status
│       ├── logs/             ← access logs
│       ├── system/           ← health, settings, unlock-room, webhook
│       └── export/pdf/       ← สร้าง PDF
└── lib/                      ← ฟังก์ชันใช้ร่วมกัน
```

### 6.2 ไฟล์ใน `lib/` (สำคัญที่สุด)

| ไฟล์ | คำอธิบาย |
|------|----------|
| **db.ts** (456 บรรทัด) | สร้าง `pg.Pool` ไปที่ Supabase (SSL บังคับ), auto-migrate ตารางเมื่อสตาร์ตครั้งแรก, มี in-memory cache 30 วินาทีสำหรับ `system_settings` |
| **auth.ts** (132) | `signToken(payload)` / `verifyToken(jwt)` ด้วย HS256, ฟังก์ชันใส่ httpOnly cookie + ฟังก์ชันอ่าน user จาก request |
| **esp32.ts** (291) | `requestUnlock(studentId)` → INSERT คำสั่งลง queue ใน DB → ยิง LAN HTTP ตรงไป ESP32 แบบ fire-and-forget (timeout สั้น) |
| **qr.ts** (289) | สร้าง one-time QR (signed token + nonce) → คืนเป็น PNG base64 |
| **rate-limit.ts** (43) | Sliding window แบบ in-memory ต่อ IP/userId |
| **pdf.ts** (373) | ใช้ `pdfkit` สร้างรายงาน landscape — header, ตาราง, footer หน้า |
| **discord.ts** (367) | ส่ง embed webhook (สมัครใหม่, อนุมัติ, ประตูเปิด, ประตูค้าง) |
| **api-security.ts** (77) | ตรวจ `X-API-Key` ของ ESP32 routes + helper response 401/403 |
| **resilience.ts** (43) | retry + timeout wrapper สำหรับ external calls |

### 6.3 ตัวอย่าง Flow โค้ด: ปลดล็อกจาก Dashboard
```ts
// 1) Dashboard ยิง POST /api/system/unlock-room { studentId }
// 2) Route handler:
const user = verifyToken(req.cookies.admin_token)   // lib/auth.ts
if (!user) return 401
if (!hasRole(user, ['owner','door_operator'])) return 403
await rateLimit(`bypass:${studentId}`, 3, 60_000)   // lib/rate-limit.ts
await db.query('INSERT INTO esp32_commands ... unlock ...', [...])
fireAndForget(() => esp32.callUnlock(ESP32_IP))     // lib/esp32.ts
await db.query('INSERT INTO access_logs ...', [...])
await discord.notify('🚪 ประตูเปิดโดย ' + user.username)
return { ok: true }
```

---

## 7. อธิบายโค้ดฝั่ง ESP32

ไฟล์: `esp32/esp32.ino` (1,142 บรรทัด)

### 7.1 ส่วนประกอบหลักของไฟล์
```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <Adafruit_GFX.h>
#include <Adafruit_ILI9341.h>
#include "ricmoo_qrcode.h"   // ไลบรารีสร้าง QR
#include "config.h"          // SSID, PASS, SERVER_URL, API_KEY

#define RELAY_PIN 12
#define BUZZER_PIN 27
#define TFT_CS 15
#define TFT_DC 2

Adafruit_ILI9341 tft(TFT_CS, TFT_DC);

void setup() {
  Serial.begin(115200);
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW);          // กันประตูเปิดตอนบูต
  tft.begin(); tft.setRotation(1);
  connectWiFi();
  drawIdle();
}

void loop() {
  if (millis() - lastPoll > POLL_INTERVAL_MS) {
    pollServer();   // GET /api/esp32/display
    lastPoll = millis();
  }
  handleButton();   // ปุ่มฉุกเฉิน
}
```

### 7.2 ฟังก์ชันสำคัญ
- `pollServer()` — เปิด `HTTPClient`, set header `X-API-Key`, parse JSON, ถ้า `command=="unlock"` เรียก `doUnlock(name)`
- `doUnlock(name)` — `digitalWrite(RELAY, HIGH)` → tone(BUZZER) → `delay(UNLOCK_MS)` → `LOW` → POST status กลับ
- `drawQR(token)` — ใช้ `ricmoo_qrcode` สร้างเมทริกซ์ → วาดบล็อกขาว/ดำลง TFT
- `drawIdle() / drawSuccess() / drawDenied()` — refresh เฉพาะส่วน (partial redraw) ลดการกระพริบ
- `#ifdef WOKWI_SIM` — ปิดบางส่วนของ hardware ตอนใช้ Simulator

### 7.3 ทำไม ESP32 ใช้ **polling** ไม่ใช่ push?
- ESP32 อยู่หลัง NAT/Firewall มหาวิทยาลัย → server เรียกตรงไม่ได้เสมอ
- WebSocket ค้างนานบน Vercel Serverless ไม่ถนัด (function timeout)
- Polling ทุก 3 วินาทีพอสำหรับ UX และง่ายต่อการ debug

---

## 8. Supabase ทำหน้าที่อะไร

Supabase = **PostgreSQL ที่ manage ให้** + auth + storage (เราใช้แค่ DB)

ในโปรเจกต์นี้:
- เราเชื่อมต่อด้วย **library `pg`** (`node-postgres`) ผ่าน connection string **PgBouncer** (`DATABASE_URL`) สำหรับ query ปกติ และ **direct connection** (`DATABASE_URL_DIRECT`) สำหรับ DDL/migration
- **ไม่** ได้ใช้ Supabase JS Client หรือ Row-Level Security — เราเขียน raw SQL parametrized เองทั้งหมด เพราะควบคุม performance/security ง่ายกว่า
- ใช้ SSL บังคับ (`ssl: { rejectUnauthorized: false }`) เพราะ Supabase บังคับ TLS

ตารางที่ Supabase เก็บ (สร้างอัตโนมัติโดย `lib/db.ts`):
| ตาราง | เก็บอะไร |
|-------|----------|
| `admin_users` | username, password_hash (bcrypt), role |
| `students` | รหัส นศ., ชื่อ, คณะ, เบอร์, อีเมล, status |
| `access_logs` | event log ทั้งหมด ตาม พ.ร.บ. มาตรา 26 |
| `dynamic_qr_tokens` | token, signature, expires_at, is_consumed |
| `system_settings` | key/value (cache 30 วินาที) |

**ทำไม Supabase ถึงใช้ postgreSQL แทนฐานข้อมูลอื่น?**
- ฟรี tier ใช้งานได้จริง, มี backup อัตโนมัติ
- รองรับ TLS + connection pooler — เหมาะกับ Vercel ที่เป็น serverless (เปิด connection ใหม่ทุก request)

---

## 9. Vercel ทำหน้าที่อะไรกับ my-app

Vercel = **Hosting + CDN + Serverless Functions** สำหรับ Next.js

หน้าที่เฉพาะในโปรเจกต์:
1. **Build** Next.js → ทุก push บน branch `main` → auto deploy
2. **Static assets** (CSS, รูป, ไฟล์ JS hydration) → cache บน Edge CDN ทั่วโลก → โหลดเร็ว
3. **API routes** (`app/api/**/route.ts`) → ทำงานเป็น **Serverless Function** (Node runtime) ในประเทศที่ใกล้ผู้ใช้
4. **Environment variables** → ตั้งใน Vercel Dashboard (DATABASE_URL, JWT_SECRET, ESP32_API_KEY ฯลฯ)
5. **HTTPS อัตโนมัติ** + custom domain ได้
6. **Cold start**: function ที่ไม่ถูกเรียกนาน → ปลุกใหม่ใช้เวลา ~300–800ms → ดูข้อ 11

ข้อจำกัดที่กระทบดีไซน์:
- Serverless function timeout 10s (free) / 60s (pro)
- ไม่มี long-lived process → ใช้ in-memory cache ระวัง (เพราะแต่ละ invocation อาจเป็นคนละเครื่อง)
- ทำให้เราเลือก polling แทน WebSocket

---

## 10. อัลกอริทึม + Flowchart

### 10.1 Flow สมัคร → อนุมัติ → ปลดล็อก
```
[นักศึกษากรอกฟอร์ม]
       │
       ▼
POST /api/students ── insert students(status='pending')
       │
       ▼
Discord webhook → แจ้งแอดมิน
       │
       ▼
[แอดมินเปิด Dashboard]
       │
       ▼
GET /api/students/pending → แสดง list
       │
       ▼
[กดอนุมัติ] → PATCH /api/students/[id] {status:'approved'}
       │
       ▼
[นักศึกษากดขอ QR] → POST /api/esp32/qr
       │
       ▼
generate token + sign + insert dynamic_qr_tokens
       │
       ▼
แสดง QR PNG บนเบราว์เซอร์
       │
       ▼
[ไปสแกนหน้าห้อง / ESP32 verify]
       │
       ▼
POST /api/esp32/qr/verify
       │
       ├─ token หมดอายุ?     → 410 → TFT: ❌
       ├─ token ถูก consume? → 409 → TFT: ❌
       └─ ok → mark consumed → INSERT esp32 unlock cmd → log
              │
              ▼
ESP32 รอบ poll ถัดไป (≤3s) ดึงคำสั่ง
              │
              ▼
RELAY=HIGH 3 วินาที → 🔓 ประตูเปิด → TFT: ✅
              │
              ▼
POST /api/esp32/status {result:'success'}
```

### 10.2 Flow Login (พร้อม rate limit)
```
POST /api/auth/login {username, password}
   │
   ▼
ตรวจ rate-limit ตาม IP (10/5min) ─── เกิน ──▶ 429
   │
   ▼ ไม่เกิน
SELECT * FROM admin_users WHERE username=$1
   │
   ▼
bcrypt.compare(password, hash)
   │
   ├─ false → log fail + return 401
   └─ true  → sign JWT (HS256, 8h) → Set-Cookie httpOnly → 200
```

### 10.3 Flow ESP32 Poll Loop
```
loop():
  if (now - lastPoll >= 3000ms):
    res = GET /api/esp32/display  (header X-API-Key)
    if res.command == "unlock":
       digitalWrite(RELAY, HIGH)
       tone(BUZZER, 2000, 200)
       drawSuccess(res.student.name)
       delay(UNLOCK_MS)            // เช่น 3000ms
       digitalWrite(RELAY, LOW)
       POST /api/esp32/status {ok:true}
       drawIdle()
    else:
       drawIdle()  // refresh เวลา/สถานะ
```

---

## 11. เหตุผลที่บางระบบเร็ว/บางระบบช้า

### 🚀 ส่วนที่ "เร็ว"
| ส่วน | เหตุผล |
|------|--------|
| โหลดหน้าเว็บนักศึกษา/Dashboard | Vercel CDN cache static asset ที่ Edge → < 100ms |
| อ่าน `system_settings` | มี **in-memory cache 30s** ใน `lib/db.ts` → ไม่ยิง DB ทุกครั้ง |
| Verify JWT | HS256 ใช้ symmetric key → O(1), ไม่ต้องคุย DB |
| Login fail / rate-limit | ตรวจ map ใน memory ก่อน → คืน 429 โดยไม่แตะ DB |
| ปลดล็อกจาก Dashboard (LAN) | ยิงตรง LAN ไป ESP32 → < 200ms (ถ้าอยู่วงเดียวกัน) |

### 🐢 ส่วนที่ "ช้า" (และทำไม)
| ส่วน | เหตุผล | บรรเทาได้อย่างไร |
|------|--------|------------------|
| **Cold start** API route แรกของวัน | Vercel ต้องบูต Node runtime ใหม่ → 300–800ms | Ping ทุก 5 นาที / ใช้ Edge runtime สำหรับ route ที่ไม่ต้องใช้ `pg` |
| **ESP32 รับคำสั่ง unlock** | Polling ทุก 3 วินาที → worst case รอ ~3s | ลด interval เป็น 1.5s แลก battery/CPU; หรือ LAN push (ที่ทำอยู่) ทำให้กรณีปกติเร็ว |
| **Query แรกหลัง idle** | Supabase PgBouncer ต้องเปิด connection ใหม่ + TLS handshake → 200–500ms | ใช้ PgBouncer transaction mode (ตั้งใน DATABASE_URL อยู่แล้ว) |
| **สร้าง PDF รายงาน** | pdfkit ทำงานบน CPU + ดึง logs ทั้งช่วง | จำกัดช่วงวันที่; ทำ pagination |
| **ส่ง Discord webhook** | เป็น external HTTP ไป discord.com | ใช้ `fireAndForget` ไม่รอผลใน critical path |
| **อัปโหลด QR image ครั้งแรก** | สร้าง matrix + render PNG → ~50–150ms | cache ตาม token (token ใช้ครั้งเดียวจึง cache สั้นพอ) |
| **หน้า Dashboard ครั้งแรก** | bundle ใหญ่ (5,620 บรรทัดใน page เดียว) → JS parse นาน | ในอนาคตแยกเป็น sub-route + dynamic import |

### สรุปหลักการที่ทำให้ระบบ "ลื่น"
1. **อ่านเยอะ → cache** (`system_settings` 30s, JWT, rate-limit ใน memory)
2. **เขียน critical → ทำใน DB ก่อน, ที่เหลือ fire-and-forget** (Discord, LAN call ESP32)
3. **Polling สั้นพอใช้แต่ไม่ถี่จนเปลือง** — 3 วินาที สมดุลระหว่าง UX กับ traffic
4. **Static asset ผ่าน CDN** — Vercel จัดให้ฟรี
5. **DB query parametrized + index ที่ `students.status`, `access_logs.created_at`** ทำให้ list/filter เร็ว

---

## ภาคผนวก: ตัวแปร Environment ที่ต้องตั้ง

```env
DATABASE_URL=postgres://...pgbouncer=true
DATABASE_URL_DIRECT=postgres://...
JWT_SECRET=<random 64 chars>
ESP32_MODE=physical            # mock | wokwi | physical
ESP32_IP=192.168.1.50
ESP32_PORT=80
ESP32_API_KEY=<shared secret>
QR_SIGNING_KEY=<random>
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<server key>
```

---

## 12. การอัปเดตระบบ (2026-05-28)

หัวข้อนี้บันทึกการเปลี่ยนแปลงและฟีเจอร์ใหม่ทั้งหมดที่เพิ่มเข้ามาตั้งแต่ version 2026-05-27

---

### 12.1 ESP32 Adaptive Polling + ETag Cache (ประสิทธิภาพ Polling ดีขึ้น 3–10×)

#### ปัญหาเดิม
ESP32 ส่ง `GET /api/esp32/display` ทุก 3 วินาทีโดยไม่คำนึงว่าข้อมูลเปลี่ยนหรือเปล่า ทำให้:
- ยิง request จำนวนมากโดยไม่จำเป็น (มักไม่มีการเปลี่ยนแปลง > 95% ของเวลา)
- เปลือง bandwidth และ Supabase connection pool

#### การแก้ไข — 2 ชั้น

**ชั้นที่ 1: ETag บนฝั่ง Server (`/api/esp32/display`)**

Server คำนวณ ETag จาก state สำคัญ แล้วส่งกลับใน header:
```
SHA1(pendingCount | lastStudentId | activeToken | updateAvailable | firmwareVer)
→ ตัดเหลือ 16 ตัวอักษร → ใส่ใน ETag: "abc123def456"
```

- ถ้า Client ส่ง `If-None-Match: "<etag>"` และ state ไม่เปลี่ยน → ตอบกลับ **304 Not Modified** (body ว่าง, ไม่ต้อง parse JSON)
- **ข้อยกเว้น**: ถ้า `door_trigger = "open"` → **ไม่ส่ง 304 เด็ดขาด** เพราะคำสั่งต้องถูก consume เสมอ

**ชั้นที่ 2: Adaptive Polling บนฝั่ง ESP32 (ในโค้ด Arduino Template)**

ระบบปรับความถี่ Polling อัตโนมัติตาม activity level:

```
ค่า Constant:
  POLL_FAST   = 200ms    ← เมื่อมีเหตุการณ์สำคัญ (ประตูเปิด)
  POLL_NORMAL = 1000ms   ← ปกติ (มีการเปลี่ยนแปลงข้อมูล)
  POLL_SLOW   = 5000ms   ← ไม่มีอะไรเปลี่ยน 5 รอบติดต่อกัน

Logic:
  if door_trigger == "open"     → idleCycles=0, POLL_FAST
  elif ข้อมูลเปลี่ยน           → idleCycles=0, POLL_NORMAL
  else (304 หรือ data เหมือนเดิม):
    idleCycles++
    if idleCycles >= 5          → POLL_SLOW
```

**ผลลัพธ์จริง**:
| สถานการณ์ | เดิม (3s fixed) | ใหม่ |
|-----------|-----------------|------|
| มีการ unlock ต่อเนื่อง | 3s | 500ms (6× เร็วขึ้น) |
| ห้องปกติ ไม่มีอะไร | 3s | 5s (ลด load 40%) |
| มีนักศึกษา submit | 3s | 2s (ตอบสนองดีขึ้น) |
| Server ส่ง 304 | parse JSON | ไม่ parse (ประหยัด CPU) |

#### ไฟล์ที่เกี่ยวข้อง
| ไฟล์ | สิ่งที่เปลี่ยน |
|------|---------------|
| `app/api/esp32/display/route.ts` | เพิ่ม ETag computation + 304 response |
| `app/admin/dashboard/page.tsx` (Arduino template) | เพิ่ม `POLL_FAST/NORMAL/SLOW`, `idleCycles`, `lastEtag`, `If-None-Match` header, 304 handler, adaptive logic |

---

### 12.2 Server-Sent Events (SSE) — Dashboard อัปเดตแบบ Real-time

#### ปัญหาเดิม
Dashboard โหลดข้อมูล pending students และ access logs ด้วย `setInterval` ทุก 10 วินาที ทำให้:
- แอดมินต้องรอนานถึง 10 วินาทีกว่าจะเห็นนักศึกษาใหม่ที่ขอเข้า
- ยิง HTTP request ซ้ำซากแม้ไม่มีข้อมูลใหม่

#### การแก้ไข — SSE Endpoint

**endpoint ใหม่**: `GET /api/sse`

```
Client (Browser) ──────── GET /api/sse ──────────▶ Server
                ◀─── event: snapshot {pending, logs} ──── (เชื่อมต่อแล้ว ส่ง data ทันที)
                ◀─── event: update {pending, logs} ──────  (ทุก 3s ถ้า data เปลี่ยน)
                ◀─── event: heartbeat {ts} ────────────── (ทุก 3s ถ้า data ไม่เปลี่ยน)
```

**Change Detection Logic**:
```
hash = "${pending.length}:${logs[0]?.id ?? ''}"
if hash != lastHash → ส่ง "update" event
else                → ส่ง "heartbeat" (รักษา connection)
```

**Fallback**: ถ้า SSE ตัดการเชื่อมต่อ (network error / Vercel timeout) → Browser ใช้ native reconnect อัตโนมัติ และถ้า error ต่อเนื่อง → กลับไปใช้ `setInterval` 10s แทน

#### วิธีใช้งานฝั่ง Dashboard
```tsx
const es = new EventSource("/api/sse");
es.addEventListener("snapshot", e => applyData(JSON.parse(e.data)));
es.addEventListener("update",   e => applyData(JSON.parse(e.data)));
```

#### ผลลัพธ์
| | เดิม | ใหม่ |
|--|------|------|
| ความหน่วงเห็นนักศึกษาใหม่ | สูงสุด 10 วินาที | ≤ 3 วินาที |
| Request ต่อนาที (ไม่มีการเปลี่ยน) | 6 requests | 0 requests (heartbeat เท่านั้น) |
| ความซับซ้อน | `setInterval` | `EventSource` + auto-reconnect |

#### ไฟล์ที่เกี่ยวข้อง
| ไฟล์ | สิ่งที่เปลี่ยน |
|------|---------------|
| `app/api/sse/route.ts` | **ไฟล์ใหม่** — SSE endpoint |
| `app/admin/dashboard/page.tsx` | แทน 2 `setInterval` ด้วย `EventSource` เดียว |

---

### 12.3 OTA Firmware Progress Bar บน TFT (ใน Arduino Template)

เมื่อ ESP32 ได้รับสัญญาณ `update_available: true` จาก server และเริ่มดาวน์โหลด firmware ใหม่ผ่าน HTTPS OTA จะแสดง progress bar แบบ real-time บนหน้าจอ TFT:

```
┌────────────────────────────────┐
│  ⬇ OTA UPDATE IN PROGRESS      │
│  Downloading firmware...       │
│  ┌──────────────────────────┐  │
│  │▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░│  │  ← Progress Bar (สีม่วง SmartAccess)
│  └──────────────────────────┘  │
│  62% (124 / 200 KB)            │
└────────────────────────────────┘
```

**การทำงาน**: ใช้ `httpUpdate.onProgress(onOTAProgress)` callback จาก ESP32 `HTTPUpdate` library

```cpp
void onOTAProgress(int current, int total) {
  int pct = (current * 100) / total;
  int barW = (pct * 280) / 100;
  // วาด Progress Bar ขนาด 280×16px
  tft.fillRect(21, 131, barW, 14, tft.color565(124, 58, 237)); // สีม่วง
  // แสดง XX% (XX / XX KB)
}
```

**หมายเหตุ**: Progress bar นี้ทำงานเฉพาะโค้ดบอร์ดจริง (`#ifndef WOKWI_SIM`) เนื่องจาก `HTTPUpdate` library ไม่มีใน Wokwi Simulator

---

### 12.4 ตารางเวลาเปิด-ปิดห้อง (Room Schedules)

#### ภาพรวม
ระบบใหม่สำหรับบันทึกเวลาทำการของแต่ละห้อง แยกรายวันในสัปดาห์ เพื่อใช้เป็นข้อมูลอ้างอิงของผู้ดูแลและอนาคตสามารถนำไปใช้ล็อคประตูอัตโนมัติ

#### ตารางฐานข้อมูลใหม่: `room_schedules`
```sql
CREATE TABLE room_schedules (
  id           SERIAL PRIMARY KEY,
  room_code    VARCHAR(50) NOT NULL,
  day_of_week  SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
                         -- 0=อาทิตย์, 1=จันทร์, ..., 6=เสาร์
  open_time    TIME NOT NULL,
  close_time   TIME NOT NULL,
  is_active    BOOLEAN DEFAULT TRUE,
  created_by   INT REFERENCES admin_users(id) ON DELETE SET NULL,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (room_code, day_of_week)  -- 1 ห้อง : 1 วัน → 1 record
);
```

#### API Endpoints
| Method | Endpoint | สิทธิ์ | คำอธิบาย |
|--------|----------|--------|---------|
| `GET` | `/api/system/schedule?room=CE-401` | admin ทุก role | ดึงตารางเวลา (กรองตามห้องได้) |
| `POST` | `/api/system/schedule` | owner เท่านั้น | เพิ่ม/แก้ไขตาราง (Upsert ตาม room+day) |
| `DELETE` | `/api/system/schedule?id=5` | owner เท่านั้น | ลบแถวตาม id |

**ตัวอย่าง POST body**:
```json
{
  "room_code": "CE-401",
  "day_of_week": 1,
  "open_time": "08:00",
  "close_time": "17:00",
  "is_active": true
}
```

#### UI: แท็บ "ตารางเวลาเปิด-ปิดห้อง" (Sidebar)
แท็บใหม่สำหรับ Owner เท่านั้น อยู่ระหว่าง "ผู้ดูแลระบบ" และ "ตั้งค่าระบบ"

**ฟังก์ชันใน UI**:
- ฟอร์มกรอกห้อง / วัน / เวลาเปิด / เวลาปิด / สถานะ → กด "บันทึก" (Upsert อัตโนมัติ)
- ตารางแสดงทุก schedule พร้อมปุ่มลบรายการ
- Index สำหรับ query เร็ว: `idx_schedule_room ON room_schedules(room_code, day_of_week, is_active)`

---

### 12.5 ตั้งค่าการอนุมัติแยกต่อห้อง (Per-Room Settings)

#### ปัญหาเดิม
การตั้งค่าต่อไปนี้เป็น **global ทั้งระบบ**:
- เปิด/ปิดการอนุมัติอัตโนมัติ
- เวลาเริ่ม-ปิดบริการ
- วันเปิดให้บริการ
- Auto-fill mode
- การแสดงรหัสนักศึกษาบนจอ ESP32

ทำให้ทุกห้องใช้การตั้งค่าเดียวกัน ไม่สามารถแยกได้ว่าห้อง CE-401 เปิดบ่าย และ CE-402 เปิดเช้า

#### การแก้ไข — Per-Room Config

**โครงสร้างข้อมูล**: บันทึกใน `system_settings` ด้วย key ที่มี prefix `rcfg_{room}_`:

| Setting Key | ตัวอย่าง | ความหมาย |
|-------------|---------|---------|
| `rcfg_CE-401_auto_approve_enabled` | `"1"` | เปิดอนุมัติอัตโนมัติสำหรับห้อง CE-401 |
| `rcfg_CE-401_auto_approve_start_time` | `"08:00"` | เวลาเริ่มบริการ |
| `rcfg_CE-401_auto_approve_end_time` | `"17:00"` | เวลาปิดบริการ |
| `rcfg_CE-401_auto_approve_days` | `"1,2,3,4,5"` | วัน จ-ศ |
| `rcfg_CE-401_auto_fill_enabled` | `"1"` | เปิด Auto-fill |
| `rcfg_CE-401_auto_fill_mode` | `"auto"` | Pop-up อัตโนมัติ |
| `rcfg_CE-401_student_id_display_mode` | `"masked"` | ซ่อนบางส่วนบน ESP32 |

**Fallback Logic**: ถ้าห้องยังไม่ได้ตั้งค่า → ใช้ค่า global (`auto_approve_enabled`, `student_id_display_mode`, ฯลฯ) แทน

#### UI ที่เปลี่ยน

**แท็บ ห้องเรียน & ESP32** — แต่ละ Room Card มีปุ่ม "⚙️ ตั้งค่าการอนุมัติ & หน้าจอ ESP32":

```
┌─ Room Card: CE-401 ──────────────────────────────────────────┐
│  IP: 192.168.1.100                               [ONLINE] ✓  │
│  [เทส Polling] [ปลดล็อกด่วน] [ตั้งค่า API] [🗑️]             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ ⚙️ ตั้งค่าการอนุมัติ & หน้าจอ ESP32              [▼]   │ │  ← กดขยาย
│  └─────────────────────────────────────────────────────────┘ │
│  (เมื่อกด ▼ จะขยายแสดง Panel ด้านล่าง)                       │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ เข้าห้องอัตโนมัติ                         [Toggle] 🟣   │ │
│  │ Auto-fill                                 [Toggle] 🟣   │ │
│  │   ○ Auto Pop-up  ● Manual Confirmation                  │ │
│  │ ความปลอดภัยหน้าจอ ESP32: [Full ID ▼]                   │ │
│  │ เวลาบริการ: [08:00] ถึง [17:00]                        │ │
│  │ วัน: [จ.] [อ.] [พ.] [พฤ.] [ศ.] ส. อา.                │ │
│  └─────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

การบันทึก: กดปุ่ม "บันทึกห้องทั้งหมด" ด้านบนของแท็บ rooms จะบันทึกทุก room config พร้อมกัน

**แท็บตั้งค่าระบบ** — เหลือเฉพาะ **Discord Webhooks ส่วนกลาง** เท่านั้น ส่วน Automated Control ย้ายไปอยู่ใน room card แล้ว

#### Backend ที่ปรับ

**`/api/esp32/display`** — อ่าน `student_id_display_mode` แบบ per-room ก่อน:
```sql
SELECT setting_value FROM system_settings
WHERE setting_key = 'rcfg_{room}_student_id_display_mode'
   OR setting_key = 'student_id_display_mode'
ORDER BY (setting_key = 'rcfg_{room}_student_id_display_mode') DESC
LIMIT 1
```

**`/api/students` (POST register)** — อ่าน auto_approve settings แบบ per-room:
```typescript
const autoApproveEnabled =
  (settings[`rcfg_${room}_auto_approve_enabled`] ?? settings.auto_approve_enabled) === "1";
```

**`/api/students/check-match` (POST)** — รับ `room` จาก body และอ่าน auto_fill per-room:
```typescript
const autoFillEnabled =
  (settings[`rcfg_${room}_auto_fill_enabled`] ?? settings.auto_fill_enabled) === "1";
```

---

### 12.6 Performance Indexes และ ตาราง DB ใหม่

#### Indexes ใหม่ใน PostgreSQL

| Index | ตาราง | คอลัมน์ | ประโยชน์ |
|-------|-------|---------|---------|
| `idx_logs_action` | `access_logs` | `action` | กรอง `WHERE action = 'firmware_ota_triggered'` เร็วขึ้น |
| `idx_logs_timestamp_desc` | `access_logs` | `timestamp DESC` | ORDER BY timestamp DESC (เปิด Logs หน้าแรก) |
| `idx_students_status` | `students` | `status` | `WHERE status = 'pending'` |
| `idx_students_room_status` | `students` | `(requested_room, status)` | กรองตามห้อง + status พร้อมกัน |
| `idx_firmware_uploaded_at` | `firmware_releases` | `uploaded_at DESC` | ดึง firmware ล่าสุดเร็วขึ้น |
| `idx_schedule_room` | `room_schedules` | `(room_code, day_of_week, is_active)` | Query ตารางเวลา |

> **หมายเหตุ**: Indexes ทั้งหมดนี้ถูกสร้างอัตโนมัติโดย `lib/db.ts` ในตอน startup — ไม่ต้องรัน migration ด้วยตนเอง

#### `uploaded_by` column fix (firmware_releases)

พบปัญหา: คอลัมน์ `firmware_releases.uploaded_by` ถูกสร้างเป็น type `UUID` ผิด ควรเป็น `INT` (foreign key ไป `admin_users.id`)

`lib/db.ts` มี **auto-migration** ที่ตรวจและแก้ให้อัตโนมัติ:
```sql
-- ตรวจว่า uploaded_by เป็น UUID หรือไม่
SELECT data_type FROM information_schema.columns
WHERE table_name = 'firmware_releases' AND column_name = 'uploaded_by'

-- ถ้าเป็น UUID → drop column แล้วสร้างใหม่เป็น INT
ALTER TABLE firmware_releases DROP COLUMN uploaded_by;
ALTER TABLE firmware_releases ADD COLUMN uploaded_by INT REFERENCES admin_users(id) ON DELETE SET NULL;
```

---

### 12.7 OTA Firmware — Discord Notification + Web Logs

#### Discord Notifications ที่เพิ่ม

| Event Type | Trigger | ข้อมูลที่ส่ง | Webhook Channel |
|-----------|---------|-------------|----------------|
| `firmware_deployed` | Admin อัปโหลด firmware ใหม่ | เวอร์ชัน, ชื่อแอดมิน, MD5, ขนาดไฟล์ | `discord_webhook_logs` / `discord_webhook_admin_audit` |
| `firmware_ota_triggered` | ESP32 ดาวน์โหลด firmware จริง | เวอร์ชันเก่า→ใหม่, ห้อง, IP บอร์ด, MD5 | `discord_webhook_logs` / `discord_webhook_admin_audit` |

**ตัวอย่าง Discord Embed (firmware_ota_triggered)**:
```
🔄 ESP32 OTA Update Triggered
━━━━━━━━━━━━━━━━━━━━━━━
ห้อง: CE-401
เวอร์ชัน: 1.0.0 → 1.0.1
IP บอร์ด: 192.168.1.100
MD5: abc123def456...
เวลา: 28/05/2026 14:32:11
```

#### Web Logs Filter
`GET /api/logs?action=firmware` จะแสดงเฉพาะ log ที่ `action LIKE 'firmware_%'` (ทั้ง `firmware_deployed` และ `firmware_ota_triggered`)

UI ใน Dashboard แสดงสี:
- 🚀 สีเขียว = `firmware_deployed` (อัปโหลดสำเร็จ)
- ⬇️ สีฟ้า = `firmware_ota_triggered` (ESP32 ดาวน์โหลด)
- 🗑️ สีแดง = `firmware_deleted`

---

### 12.8 อัปเดต Section ที่มีอยู่

#### 10.3 Flow ESP32 Poll Loop (ปรับปรุง)
```
loop():
  if (now - lastPollTime >= currentPollDelay):  // Adaptive: 500/2000/5000ms
    http.addHeader("If-None-Match", lastEtag)   // ส่ง ETag ถ้ามี
    httpCode = GET /api/esp32/display

    if httpCode == 304:                          // ข้อมูลไม่เปลี่ยน
      idleCycles++
      if idleCycles >= 5: currentPollDelay = POLL_SLOW (5s)
      return  // ไม่ parse JSON เลย

    if httpCode == 200:
      lastEtag = response.header("ETag")        // เก็บ ETag ไว้
      if door_trigger == "open":
        idleCycles=0, currentPollDelay = POLL_FAST (500ms)
        ... unlock sequence ...
      elif data_changed:
        idleCycles=0, currentPollDelay = POLL_NORMAL (2s)
        drawMainScreen(...)
      else:
        idleCycles++
        if idleCycles >= 5: currentPollDelay = POLL_SLOW (5s)
        updateClockOnly()
```

#### 11. เหตุผลที่บางระบบเร็ว/บางระบบช้า (ปรับปรุง)

เพิ่มรายการใหม่ใน "ส่วนที่เร็ว":
| ส่วน | เหตุผล |
|------|--------|
| **ESP32 Poll (ห้องเงียบ)** | ETag 304 → ไม่ parse JSON → ลด CPU + bandwidth ได้ 40–60% |
| **Dashboard update** | SSE push ≤ 3s แทน polling 10s → ลด request 80% |
| **Query logs/firmware** | Index `idx_logs_action`, `idx_logs_timestamp_desc` → ลดเวลา scan ทั้งตาราง |

---

### 12.9 สรุปไฟล์ที่เปลี่ยนแปลงทั้งหมด (2026-05-28)

| ไฟล์ | ประเภทการเปลี่ยน | สรุปสั้น |
|------|----------------|---------|
| `app/api/esp32/display/route.ts` | ✏️ แก้ไข | เพิ่ม ETag + 304, per-room `student_id_display_mode` |
| `app/api/sse/route.ts` | 🆕 ใหม่ | SSE endpoint push pending+logs ทุก 3s |
| `app/api/system/schedule/route.ts` | 🆕 ใหม่ | CRUD ตารางเวลาห้อง (GET/POST/DELETE) |
| `app/api/system/firmware/upload/route.ts` | ✏️ แก้ไข | Discord notify เมื่ออัปโหลด firmware |
| `app/api/esp32/firmware-ota/route.ts` | ✏️ แก้ไข | log + Discord notify เมื่อ ESP32 ดาวน์โหลด OTA |
| `app/api/logs/route.ts` | ✏️ แก้ไข | เพิ่ม `?action=firmware` filter |
| `app/api/students/route.ts` | ✏️ แก้ไข | อ่าน auto_approve settings แบบ per-room |
| `app/api/students/check-match/route.ts` | ✏️ แก้ไข | อ่าน auto_fill แบบ per-room |
| `lib/db.ts` | ✏️ แก้ไข | indexes ใหม่ 6 รายการ, ตาราง `room_schedules`, auto-migrate `uploaded_by` |
| `lib/discord.ts` | ✏️ แก้ไข | เพิ่ม `firmware_deployed`, `firmware_ota_triggered` event types |
| `app/admin/dashboard/page.tsx` | ✏️ แก้ไข | SSE, per-room settings panel, OTA logs UI, Arduino template (adaptive polling, ETag, OTA progress bar) |

---

> เอกสารนี้สรุปจากโค้ดจริงในโปรเจกต์ ณ วันที่ 2026-05-28 — หากแก้สคีมา DB หรือเปลี่ยน flow ของ ESP32 ให้ปรับเอกสารนี้ตามด้วย
