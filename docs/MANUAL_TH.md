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
- กรองตาม action: `registered | approved | rejected | door_opened | door_failed`
- **กฎ พ.ร.บ. คอมฯ มาตรา 26**: log ที่มีอายุ **< 90 วัน** ห้ามลบเด็ดขาด ถ้าจะเคลียร์ต้องยืนยันรหัสผ่าน owner อีกครั้ง

### 4.9 หน้าจอกำหนดเงื่อนไขการทำงานของระบบ (Settings)
- ตาราง `system_settings` (key/value) — มี **30 วินาที cache** ที่ฝั่งเซิร์ฟเวอร์
- ตั้งได้: เวลาเปิด-ปิดห้อง, เวลาปลดล็อก, เปิด/ปิด Discord webhook, ESP32 mode, ข้อความบน TFT
- บันทึกผ่าน `PATCH /api/system/settings`

### 4.10 หน้าจอรายงานขอใช้สิทธิ์ (Reports / Export)
- กดปุ่ม → `GET /api/export/pdf?from=...&to=...`
- ฝั่งเซิร์ฟเวอร์ใช้ **pdfkit** สร้าง PDF แนวนอน (landscape) บนเซิร์ฟเวอร์ → stream กลับเป็นไฟล์
- รายงานมี: สรุปจำนวนเข้าใช้/วัน, top user, ความผิดปกติ

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

> เอกสารนี้สรุปจากโค้ดจริงในโปรเจกต์ ณ วันที่ 2026-05-27 — หากแก้สคีมา DB หรือเปลี่ยน flow ของ ESP32 ให้ปรับเอกสารนี้ตามด้วย
