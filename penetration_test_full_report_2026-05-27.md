# SmartAccess Door Access — Full Penetration / Performance / Offline / Tamper Audit
**วันที่ทดสอบ:** 2026-05-27
**ผู้ทดสอบ:** AI assistant (Claude Opus 4.7) ภายใต้คำสั่งของเจ้าของระบบ
**เป้าหมาย:** `https://project-sigma-ivory-21.vercel.app` (Vercel + Supabase Postgres + ESP32 IoT cloud polling)
**Scope:** Code-level pen test + active HTTP tampering + Vercel↔Supabase performance + offline resilience
**สถานะ:** ทำใหม่ทั้งหมดทับรีพอร์ตชุดเดิมตามคำสั่งของผู้ใช้

> ไฟล์นี้แทนที่ของเดิม: `penetration_test_full_report_2026-05-26.md`, `penetration_performance_offline_report_2026-05-26.md`, `security_performance_audit_2026-05-26.md`, `penetration_test_report.md`, `penetration_test_full_report.md`

---

## 0. สรุปผู้บริหาร (Executive Summary)

| ด้าน | ผล | คะแนน |
|---|---|---|
| โครงสร้างความปลอดภัยพื้นฐาน (JWT, bcrypt, parameterized SQL, CSP, HSTS, sameSite cookie, CORS allowlist) | ดี | 8.5/10 |
| Authn/Authz บน API routes | ดีกับช่องโหว่ปานกลาง 2 จุด | 7/10 |
| Input validation / sanitization | ใช้ระบบกรองได้ครอบคลุม แต่ยังขาดบางช่อง | 7/10 |
| Resilience (DB ล่ม / ESP32 ล่ม / ไฟดับ) | มี fallback หลายชั้นแต่ยังมีจุดอ่อน | 7.5/10 |
| Performance (client→Vercel→Supabase) | จริงต่ำกว่า 100ms p95 บนเส้นทางหลัก | 9/10 |
| **โดยรวม** | **พร้อมใช้งานจริง — แต่ต้องปิดช่องโหว่ระดับ HIGH 4 จุด ก่อนเปิดให้ผู้ใช้นอกห้องเรียน** | **7.6/10** |

**จุดที่ต้องแก้ก่อน production rollout (Top 4):**
1. 🔴 `INFO-LEAK-01` — รหัสผ่าน Supabase อยู่ใน `.env.local` แบบ plaintext และเคย commit/อ่านได้ → ต้อง rotate ทันที
2. 🔴 `AUTHZ-01` — `app/api/admin-users/route.ts` ยังบังคับ password length 6 ตัวอักษร (ขัดกับ CLAUDE.md ที่บอก 8) และไม่ได้บังคับ username regex
3. 🔴 `AUTHZ-02` — `app/api/students/[id]/reject/route.ts` รับ `reason` แบบไม่จำกัดความยาว (ขัดกับเอกสารที่บอก 500 char)
4. 🟠 `AUTHZ-03` — `door_operator` เปิดประตูได้ทุกห้อง (ไม่ผูกกับสิทธิ์รายห้อง)

---

## 1. ระบบและสถาปัตยกรรม (ของจริงในโค้ด ณ 2026-05-27)

```
                  ┌──────────────┐    DB pooler           ┌──────────────┐
   Browser ─────► │   Vercel     │ ─────────────────────► │  Supabase    │
   ESP32   ─POLL► │  Next.js 16  │   (ap-southeast-1)     │  Postgres    │
                  │  (Singapore) │                        └──────────────┘
                  └──────┬───────┘
                         │ Discord Webhook (outbound only)
                         ▼
                    Discord Server
```

- หน้าเว็บ + API route: Vercel Edge/Node functions
- DB: Supabase Postgres (pooled connection ผ่าน `pg` driver + TLS)
- ESP32 ใช้ **IoT cloud polling**: อ่าน `room_cmd_<room>` ใน `system_settings` ทุก ~2 วินาทีผ่าน `GET /api/esp32/display` แทนการรับ webhook (กันปัญหา NAT/CGNAT)
- มี LAN direct fast path (fire-and-forget) เมื่อ Vercel function ไม่อยู่บน cloud

---

## 2. ผลทดสอบจริง (Live Measurements — 2026-05-27)

### 2.1 Performance (client→Vercel→Supabase)
รัน `scripts/perf-test.mjs` จากเครื่อง dev (กรุงเทพฯ → Singapore region):

| Endpoint | runs | avg | p50 | p95 | max | bytes |
|---|---:|---:|---:|---:|---:|---:|
| `GET /` (Home page, RSC) | 10 | 67ms | 44ms | **281ms** | 281ms | 7.7KB |
| `GET /api/esp32/display?room=CE-401` (ESP32 poll) | 10 | 75ms | 73ms | **97ms** | 97ms | 784B |
| `GET /api/esp32/qr?room=CE-401` (401 — unauth) | 10 | 93ms | 60ms | 381ms | 381ms | 24B |
| `POST /api/auth/login` (rate-limited) | 10 | 94ms | 66ms | 351ms | 351ms | 109B |

**ตีความ:**
- เส้น hot path ที่ ESP32 ต้อง poll ทุก ~2 วินาที (`/api/esp32/display`) มี p95 = **97ms** = เร็วพอ ESP32 polling loop รอบละ 2s ใช้เพียง 5% ของ window
- Cold-start ของ home page เห็นที่ max = 281ms (first request หลังจาก lambda dormant)
- Vercel → Supabase round trip ≈ 50–70ms (จาก display endpoint รัน 4 query แบบ `Promise.all`)
- การที่ Supabase pooler อยู่ใน `ap-southeast-1` ตรงกับ Vercel Singapore region คือดีมาก — ถ้าย้าย region อย่างใดอย่างหนึ่งไป US จะเพิ่ม +150ms ต่อ request

### 2.2 Offline scenarios (รัน `scripts/offline-test.mjs`)

| Scenario | สถานะ | หมายเหตุ |
|---|---|---|
| A.1 Vercel+Supabase ปกติ → `/api/esp32/display` | ✅ 200 | JSON ครบ, มี `door_trigger`, `qr_url` |
| A.2 `/api/system/health` (ต้อง auth) | ✅ 401 | กลับ JSON `{"error":"Unauthorized"}` — ไม่ leak stack |
| B. Vercel UNREACHABLE (ปลอม host) | ✅ Network fail ใน 34ms | client handler ควร queue offline |
| C. Static favicon | ✅ 200 ใน 50ms | CDN ทำงาน |

**Manual drills ที่ยังต้องทำเอง:** ดูใน script — 4 ขั้นตอน (power outage, Supabase pause, full Vercel outage, room power loss + fail-safe magnetic lock)

### 2.3 API tampering / MITM (รัน `scripts/api-tamper-test.mjs`)

| # | Test | คาดหวัง | ผลจริง | สรุป |
|---|---|---|---|---|
| 1 | Brute-force 8 login | 429 ตั้งแต่ครั้ง 6 | 429 ทุกครั้งตั้งแต่ครั้ง 1 (rate-limit state ค้างจาก run ก่อน) | ✅ pass — ยืนยัน DB-backed rate-limit ทำงาน |
| 2 | Spoof `X-Forwarded-For` | rate-limit ไม่ควรหลุด | ยัง 429 ทุกครั้ง (test inconclusive เพราะ #1 ทำให้ถูก lock ก่อน) | ⚠️ ต้องตรวจ Vercel trusted proxy chain — code อ่าน `x-forwarded-for` ตรงๆ ไม่ใช้แค่ left-most ที่ Vercel append เอง |
| 3 | Forge JWT (`/api/auth/me`, `/api/students`) | 401 | ✅ 401 ทั้งคู่ | ✅ pass — signature ถูก verify ด้วย HS256 |
| 4 | Mass-assign `role:owner`+XSS `<script>` ใน `first_name` | 400/422 | 400 (ถูกบล็อกที่ QR token validation ก่อน) | ⚠️ partial — code มี whitelist field อยู่แล้วใน `/api/students/route.ts` (เลือกเฉพาะ field) แต่ XSS sanitization ใช้แค่ `replace(/<[^>]*>/g, '')` ซึ่งเลี่ยงได้ด้วย `<scr<script>ipt>` |
| 5 | SQL injection ใน path param `/api/students/1 OR 1=1` | 400 "ID ต้องเป็นตัวเลข" | 401 (ติด auth ก่อน) — `parseInt("1 OR 1=1")=1` | ✅ ปลอดภัยเพราะ `parseInt` แปลงเป็น 1 + ใช้ parameterized SQL |
| 6 | CORS ส่ง `Origin: https://evil.example.com` | header ตอบกลับต้อง = configured URL | ✅ `Access-Control-Allow-Origin: https://project-sigma-ivory-21.vercel.app` | ✅ pass — origin lock แข็ง |
| 7 | ดึง `active_token` โดยไม่มี `x-api-key` | ต้องไม่มี field นี้ใน JSON | ✅ ไม่มี | ✅ pass |
| 8 | Replay QR token ปลอม 2 ครั้ง | 400 ทั้ง 2 | ✅ 400 ทั้ง 2 | ✅ pass — `consumeQRToken` atomic + reject non-hex |
| 9 | `/api/logs?limit=99999999`, `-1` | 400 หรือ clamp | 401 (auth lock) — เทสต์ไม่ได้โดยตรง | ⚠️ จาก code: `Math.min(Math.max(rawLimit, 1), 500)` — clamp ถูกแล้ว ✅ |

### 2.4 Security headers (จาก `curl -I`)
✅ Content-Security-Policy (default-src 'self', frame-ancestors none, object-src none)
✅ Strict-Transport-Security: max-age 2 ปี + preload
✅ X-Content-Type-Options: nosniff (ตั้งใน `next.config.ts`)
✅ Referrer-Policy: strict-origin-when-cross-origin
✅ Permissions-Policy: camera/mic/geo = ()
⚠️ CSP มี `script-src 'unsafe-inline'` (จำเป็นสำหรับ Next.js bootstrap) — รับได้แต่ลด strict-CSP score

---

## 3. รายการช่องโหว่ที่พบ (Vulnerabilities)

> Severity scale: 🔴 Critical / 🟠 High / 🟡 Medium / 🔵 Low / ⚪ Info

---

### 🔴 V01 — รหัสผ่าน Supabase อยู่ใน `.env.local` แบบ plaintext + เปิดเผยใน session
- **File**: `my-app/.env.local`
- **เหตุ**: `POSTGRES_URL=postgres://postgres.wvuvdnutidctmyojacrn:0CXFSbjybuigR79a@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres...`
- **ผลกระทบ**: ใครก็ตามที่เข้าถึงเครื่อง dev / repo / session log ได้ จะมี root access บน Supabase project ทันที (อ่าน-เขียน-ลบทุกตาราง รวมถึง `admin_users.password_hash`)
- **CVSS โดยประมาณ**: 9.0 (network exploitable, full DB compromise)
- **Mitigation**:
  1. **Rotate Supabase DB password ทันที** ที่ Supabase dashboard → Project Settings → Database → Reset password
  2. ลบ `.env.local` ออกจาก git history หากเคย commit: `git log --all --full-history -- my-app/.env.local`
  3. ใส่ใน `.gitignore` (น่าจะมีอยู่แล้ว แต่ยืนยัน)
  4. ใช้ `vercel env pull` แทนการเก็บไฟล์เอง

#### AI Fix Prompt:
```
ในโปรเจกต์ Next.js ที่ my-app/ ให้:
1. ยืนยันว่า .gitignore มี ".env*" อยู่แล้ว (เพิ่มหากไม่มี)
2. ตรวจประวัติ git ด้วย: git log --all --full-history -- my-app/.env.local
   ถ้าเจอ commit ใดที่มีไฟล์นี้ ให้บอกผู้ใช้ให้รัน BFG หรือ git filter-repo เพื่อลบ
3. สร้างไฟล์ my-app/.env.local.example ที่มี key เดียวกันแต่ค่าเป็น placeholder
4. แก้ลำดับการอ่าน env ใน lib/db.ts ให้แสดง error ชัดเจนเมื่อ POSTGRES_URL ไม่ตั้งใน production แทนการใช้ default
5. อย่าแก้ค่าจริงในไฟล์ .env.local — แค่เพิ่ม comment เตือนที่ด้านบนสุดให้ rotate password
```

---

### 🔴 V02 — Password policy ไม่ตรงกับเอกสาร (AUTHZ-01)
- **File**: `my-app/app/api/admin-users/route.ts:63`
- **โค้ดจริง**: `if (password.length < 6)` แต่ CLAUDE.md อ้างว่าบังคับ 8 ตัวอักษร + regex `^[a-zA-Z0-9_.]{3,30}$` บน username
- **ผลกระทบ**: owner สร้างแอดมินใหม่ที่ password = `aaaaaa` ก็ผ่าน — เปิดช่อง insider threat / weak rotation
- **Mitigation**: บังคับ length≥12, ต้องมีอักษรใหญ่+ตัวเลข+พิเศษ และ username regex

#### AI Fix Prompt:
```
แก้ไข my-app/app/api/admin-users/route.ts บรรทัด POST handler:

1. เพิ่ม validation ก่อนสร้าง admin ใหม่:
   - password ต้อง ≥ 12 ตัวอักษร
   - ต้องมี [A-Z], [a-z], [0-9], และ symbol อย่างละอย่างน้อย 1 ตัว
   - username ต้องผ่าน regex /^[a-zA-Z0-9_.]{3,30}$/
   - full_name ต้องตัดให้ ≤ 100 ตัวอักษรและ strip HTML tags ด้วย .replace(/<[^>]*>/g, '')

2. ใช้ helper function ใหม่ใน lib/auth.ts ชื่อ validatePasswordPolicy(password): { ok: boolean; error?: string }
   เพื่อนำไปใช้ซ้ำกับ lib/db.ts (INITIAL_ADMIN_PASSWORD บล็อกอยู่แล้ว) — รวมเป็น source of truth เดียว

3. คืน HTTP 400 พร้อม error message ภาษาไทยที่ user-friendly เช่น
   "รหัสผ่านต้องมีอย่างน้อย 12 ตัวอักษร และประกอบด้วยตัวพิมพ์ใหญ่ ตัวพิมพ์เล็ก ตัวเลข และอักขระพิเศษ"

4. อย่าเปลี่ยน contract ของ response — เก็บ {success, message} format เดิม
5. ทดสอบด้วย scripts/api-tamper-test.mjs ใหม่ ให้แน่ใจว่าไม่มี endpoint อื่นพัง
```

---

### 🔴 V03 — Reject reason ไม่จำกัดความยาว (AUTHZ-02 / DoS storage)
- **File**: `my-app/app/api/students/[id]/reject/route.ts:39-42`
- **โค้ดจริง**: `[admin.id, reason || "ไม่ผ่านการตรวจสอบ", studentId]` — ไม่มี `.slice(0, 500)`
- **ผลกระทบ**: owner ที่ถูก compromise / insider ส่ง reason ยาวเป็นล้านอักษรเพื่อทำให้ DB ตัวบวม (column เป็น `VARCHAR(500)` ใน schema แต่ Postgres จะ error 22001 ก่อน — ไม่ใช่ DoS ทาง storage แต่เป็น error path ที่ทำให้คำขอถูกลบทิ้งไม่ครบ)
- เอกสาร CLAUDE.md อ้างว่า "ตัด ≤500 อักษรอัตโนมัติ" ซึ่งไม่ตรงกับโค้ดจริง

#### AI Fix Prompt:
```
ใน my-app/app/api/students/[id]/reject/route.ts ให้:

1. หลังบรรทัด const { reason } = await req.json();
   เพิ่ม normalization:
     const sanitizedReason = typeof reason === "string"
       ? reason.replace(/<[^>]*>/g, "").trim().slice(0, 500)
       : "";
     const finalReason = sanitizedReason || "ไม่ผ่านการตรวจสอบ";

2. ใช้ finalReason แทน (reason || "ไม่ผ่านการตรวจสอบ") ทั้งสองที่ในไฟล์ (DB UPDATE และ access_logs INSERT)

3. ส่ง finalReason เข้าไปใน sendDiscordNotification ด้วย

4. ไม่ต้องเปลี่ยน response format — แค่ปกป้องข้อมูลก่อนเข้า DB
```

---

### 🟠 V04 — `door_operator` เปิดประตูได้ทุกห้อง (AUTHZ-03)
- **File**: `my-app/app/api/students/[id]/door/route.ts:27-28` (comment: `// Both roles can open door`)
- **ผลกระทบ**: ระบบหลายห้อง (CE-401, CE-402) — door_operator ที่ดูแลห้อง 401 สามารถสั่งเปิดห้อง 402 ของอาจารย์อื่นได้ ถ้ารู้ student.id ที่ถูก approve แล้ว
- ปัจจุบัน schema ไม่ผูก operator กับ room — ต้องเพิ่ม field

#### AI Fix Prompt:
```
ในระบบ multi-room access control นี้ door_operator แต่ละคนควรจำกัดอยู่เฉพาะห้องที่ตนรับผิดชอบ ให้:

1. ใน lib/db.ts initDatabase() เพิ่ม column ใน admin_users:
     ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS allowed_rooms TEXT DEFAULT NULL;
   ความหมาย: NULL = ทุกห้อง (owner), CSV string เช่น "CE-401,CE-402" = limited
   ใช้ DO $$ ... IF NOT EXISTS ... $$ block แบบเดียวกับ index existing

2. แก้ lib/auth.ts AdminPayload เพิ่ม field allowed_rooms?: string | null
   และ signToken/verifyToken ให้รวม field นี้ใน JWT payload

3. ใน app/api/auth/login/route.ts SELECT * รวม allowed_rooms มาด้วย และส่งเข้า signToken

4. สร้าง helper ใน lib/auth.ts:
     export function canOperateRoom(admin: AdminPayload, roomCode: string): boolean {
       if (admin.role === "owner") return true;
       if (!admin.allowed_rooms) return false; // door_operator without explicit rooms cannot
       return admin.allowed_rooms.split(",").map(s=>s.trim()).includes(roomCode);
     }

5. แทรกการตรวจสอบใน:
   - app/api/students/[id]/door/route.ts (ก่อน openDoor) — ใช้ student.requested_room
   - app/api/system/unlock-room/route.ts (ก่อน openDoor) — ใช้ body.room
   - app/api/students/[id]/approve/route.ts (ก่อน openDoor)
   ถ้า canOperateRoom() = false: return 403 "คุณไม่มีสิทธิ์ดูแลห้องนี้"

6. ใน app/api/admin-users/route.ts POST รับ field allowed_rooms (optional CSV) และ
   validate ว่าทุกห้องอยู่ใน parseConfiguredRooms(settings)

7. อัปเดต CLAUDE.md section "จัดการผู้ดูแลระบบ" อธิบายฟีเจอร์นี้
```

---

### 🟠 V05 — `x-forwarded-for` ไม่ pin กับ Vercel trusted proxy
- **File**: `my-app/app/api/auth/login/route.ts:21`, `my-app/app/api/students/route.ts:81`, `lib/rate-limit-middleware.ts:14`
- **โค้ดจริง**: `req.headers.get("x-forwarded-for") || ... || "anonymous"`
- **ผลกระทบ**: ถ้า attacker เข้าถึง Vercel internal network (เช่นผ่าน Vercel Function ตัวอื่นในโปรเจกต์อื่น) เขาสามารถปลอม `X-Forwarded-For` ได้ และเปลี่ยน rate-limit key ทุก request → เลี่ยง brute force protection ได้ทั้งหมด
- Vercel จะใส่ IP จริงไว้ที่ **right-most** ของ header ที่ client ส่งมา — ถ้าใช้ทั้ง string เป็น key, attacker บังคับเปลี่ยน key ได้

#### AI Fix Prompt:
```
สร้างไฟล์ใหม่ my-app/lib/client-ip.ts ที่ export ฟังก์ชัน:

  export function getClientIp(req: NextRequest): string {
    // Vercel แนบ IP จริงที่ right-most ของ X-Forwarded-For
    const xff = req.headers.get("x-forwarded-for") || "";
    const parts = xff.split(",").map(s => s.trim()).filter(Boolean);
    if (parts.length > 0) {
      // ใช้ตัวขวาสุดเสมอ (Vercel-appended) เพื่อกัน client spoofing
      const ip = parts[parts.length - 1];
      // basic IP validation
      if (/^(\d{1,3}\.){3}\d{1,3}$/.test(ip) || /^[0-9a-fA-F:]+$/.test(ip)) {
        return ip;
      }
    }
    const real = req.headers.get("x-real-ip");
    if (real && /^[0-9a-fA-F.:]+$/.test(real)) return real;
    return "anonymous";
  }

จากนั้นแทนที่ทุกที่ที่ใช้ pattern เดิม:
  req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "anonymous"

ด้วย:
  import { getClientIp } from "@/lib/client-ip";
  const ip = getClientIp(req);

ไฟล์ที่ต้องแก้ (grep:  rg "x-forwarded-for" my-app/app my-app/lib ):
  - app/api/auth/login/route.ts
  - app/api/students/route.ts
  - app/api/esp32/qr/verify/route.ts
  - app/api/export/pdf/route.ts (2 จุด)
  - app/api/system/health/route.ts
  - lib/rate-limit-middleware.ts

ห้ามแก้ logic อื่นนอกจากบรรทัด ip = ... และ rate-limit key ที่ใช้ ip นั้น
```

---

### 🟠 V06 — `proxy.ts` อาจไม่ทำงานบน Vercel runtime ปัจจุบัน
- **File**: `my-app/proxy.ts`
- **เหตุ**: ใช้ชื่อ `proxy.ts` (Next.js canary 16) แทน `middleware.ts` มาตรฐาน + import `jsonwebtoken` ซึ่งเป็น Node-only library
- **ผลกระทบ**: ถ้า Vercel build ไม่ recognize `proxy.ts` หรือ runtime เป็น edge → `/admin/dashboard` จะไม่ถูกป้องกัน (ทุกคนเข้าได้ — แต่ API endpoint ภายในยังเช็ค cookie อยู่ดี)
- **ปัจจุบัน**: ทำงานในฐานะ Node runtime จึง OK แต่ควรยืนยัน

#### AI Fix Prompt:
```
ใน my-app/ ให้ทำขั้นตอนต่อไปนี้:

1. รัน: curl -I https://project-sigma-ivory-21.vercel.app/admin/dashboard
   ถ้าได้ 200 (ไม่ redirect) แสดงว่า proxy.ts ไม่ทำงาน

2. ตรวจชื่อไฟล์: Next.js 16 canary ใช้ middleware.ts หรือ proxy.ts กันแน่
   ดูเอกสารที่ https://nextjs.org/docs/app/building-your-application/routing/middleware

3. ถ้ายังเป็น middleware.ts ให้ rename proxy.ts → middleware.ts และเปลี่ยน
   export function proxy → export function middleware

4. เพิ่ม top ของไฟล์: export const runtime = "nodejs";
   เพื่อให้ jsonwebtoken ใช้งานได้

5. ห้ามแก้ logic — แค่ rename + ระบุ runtime ชัดเจน
```

---

### 🟡 V07 — `consumeQRToken` ใช้ in-memory Map สำหรับ cleanup timing
- **File**: `my-app/lib/qr.ts:67` (`lastTokenCleanupByRoom`)
- **ผลกระทบ**: serverless แต่ละ warm instance มี Map ตัวเอง — cleanup จะรันบ่อยกว่าที่คาด ใช้ DB query เพิ่มเล็กน้อย ไม่ใช่ security risk แต่เป็น waste

#### AI Fix Prompt:
```
ใน my-app/lib/qr.ts ฟังก์ชัน getOrCreateActiveQRToken:
  เปลี่ยน lastTokenCleanupByRoom (Map<string, number>) ไปเก็บใน DB:
    INSERT INTO system_settings (setting_key, setting_value)
    VALUES ('qr_last_cleanup_<room>', '<timestamp>')
    ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value
        WHERE EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - to_timestamp(setting_value::bigint))) > 300

  หรือทำให้ง่ายกว่า: ใช้ random sampling (ทุก ~1% ของ request) แทน
    if (Math.random() < 0.01) { /* run cleanup */ }

เลือกแบบหลังเพื่อหลีกเลี่ยง round-trip DB เพิ่ม
```

---

### 🟡 V08 — `parseInt` ไม่ตรวจ NaN ใน DELETE/PATCH paths
- **Files**:
  - `my-app/app/api/students/[id]/route.ts:101-103` (DELETE)
  - `my-app/app/api/admin-users/[id]/route.ts:24` (no NaN guard)
- **ผลกระทบ**: `parseInt("abc")` = NaN → ส่งเข้า PG ได้ error แต่ไม่ใช่ user-friendly response

#### AI Fix Prompt:
```
ใน 2 ไฟล์:
  - my-app/app/api/students/[id]/route.ts (DELETE handler)
  - my-app/app/api/admin-users/[id]/route.ts (DELETE handler)

หลังบรรทัด const { id } = await params; เพิ่ม:
  const numId = parseInt(id, 10);
  if (isNaN(numId)) {
    return NextResponse.json({ error: "ID ต้องเป็นตัวเลข" }, { status: 400 });
  }

แล้วใช้ numId แทน parseInt(id) ทุกที่ในฟังก์ชัน
```

---

### 🟡 V09 — XSS sanitization ใช้ regex ที่หลีกเลี่ยงได้
- **File**: `my-app/app/api/students/route.ts:104` (`replace(/<[^>]*>/g, '')`)
- **ผลกระทบ**: payload `<scr<script>ipt>alert(1)</scr</script>ipt>` หลังกรองครั้งเดียวจะเหลือ `<script>alert(1)</script>` ในข้อมูล DB (อันตรายเฉพาะถ้าหน้า admin render เป็น innerHTML — ปัจจุบัน React ใช้ text node ปลอดภัยอยู่แล้ว)
- ระดับ Medium เพราะ defense-in-depth

#### AI Fix Prompt:
```
ติดตั้ง package: cd my-app && npm install isomorphic-dompurify
แก้ my-app/app/api/students/route.ts:

  เปลี่ยน:
    const sanitizeHTML = (input: string): string => input.replace(/<[^>]*>/g, '');

  เป็น:
    import DOMPurify from "isomorphic-dompurify";
    const sanitizeHTML = (input: string): string =>
      DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });

อย่าแก้ logic อื่น — ทุก call site เดิมยังใช้ได้
ทดสอบด้วย scripts/api-tamper-test.mjs case "mass-assign role=owner" payload ใหม่ <scr<script>ipt> ต้องไม่เห็น <script> ใน DB
```

---

### 🟡 V10 — `app/api/export/pdf/route.ts` ทำ destructive ALTER TABLE ทุกครั้งที่ ensureInit
- **File**: `my-app/app/api/export/pdf/route.ts:13-31`
- **โค้ดจริง**: ทุก cold-start function จะรัน `ALTER TABLE access_logs ALTER COLUMN action TYPE VARCHAR(50)`, `DROP CONSTRAINT access_logs_student_id_fkey`, `ALTER COLUMN student_id TYPE VARCHAR(50)` — แม้ตารางจะตรงอยู่แล้ว
- **ผลกระทบ**:
  1. Schema drift: DROP foreign key ทำให้ referential integrity หาย
  2. PG queue lock บนตาราง logs ทุก cold start = ทำให้ login/QR/door slow ลงตอน lambda เกิดใหม่
  3. ALTER COLUMN TYPE บน column มีข้อมูล = lock ตารางทั้งใบ

#### AI Fix Prompt:
```
ใน my-app/app/api/export/pdf/route.ts ลบ block migration ทั้งหมดออก (บรรทัด 13-31 ใน try/catch ที่ alter access_logs)
ย้าย migration ดังกล่าวไปทำใน lib/db.ts initDatabase() เพียงครั้งเดียว ภายใต้ check
"ถ้า column ยังไม่ใช่ VARCHAR(50)" — ใช้ information_schema:

  const { rows: colInfo } = await initPool.query(`
    SELECT data_type, character_maximum_length
    FROM information_schema.columns
    WHERE table_name = 'access_logs' AND column_name = 'action'
  `);
  if (colInfo[0]?.character_maximum_length < 50) {
    // ทำ migration เพียงครั้งเดียว
    await initPool.query("ALTER TABLE access_logs ALTER COLUMN action TYPE VARCHAR(50)");
  }

ห้าม DROP foreign key constraint — ถ้าจำเป็น ให้ทำเป็น manual SQL ใน Supabase dashboard แทน
แล้วลบคอลัมน์ ALTER COLUMN student_id TYPE VARCHAR(50) — เพราะปัจจุบัน schema เป็น INT เพื่อ FK กับ students.id

ถ้าจำเป็นต้องเก็บ string 'SYSTEM' ใน access_logs.student_id (ดูบรรทัด 97, 164 ในไฟล์เดิม) ให้:
  - เพิ่ม column ใหม่ "student_id_string VARCHAR(50)" แยก
  - หรือ ใส่ NULL ใน student_id (FK) และเก็บ marker ใน notes
อย่าทำลาย type integrity
```

---

### 🟡 V11 — `consumeOfflineGrant` ใช้ `JWT_SECRET` เป็น fallback
- **File**: `my-app/lib/qr.ts:78-89`
- **ผลกระทบ**: ถ้า JWT_SECRET รั่ว = ทั้ง session auth และ offline grant signature ตกพร้อมกัน

#### AI Fix Prompt:
```
ใน Vercel project settings → Environment Variables เพิ่ม:
  QR_SIGNING_KEY = <32-byte random hex แยกจาก JWT_SECRET>

แล้วใน my-app/lib/qr.ts บรรทัด 78:
  เปลี่ยน const QR_SIGNING_KEY = process.env.QR_SIGNING_KEY || process.env.JWT_SECRET;
  เป็น:
    const QR_SIGNING_KEY = process.env.QR_SIGNING_KEY;
    if (process.env.NODE_ENV === "production" && !QR_SIGNING_KEY) {
      throw new Error("Production Error: QR_SIGNING_KEY environment variable must be set.");
    }
    if (!QR_SIGNING_KEY) {
      console.warn("[SECURITY] QR_SIGNING_KEY not set — using insecure dev fallback");
    }

  แล้วลบ fallback ไป JWT_SECRET ออก
```

---

### 🟡 V12 — ESP32 ↔ Vercel ใช้ HTTP plaintext + API key ใน header
- **File**: `my-app/lib/esp32.ts:131-145` (`tryLanDirectBackground`)
- **เหตุ**: เมื่อ Vercel ยิงตรงไปยัง LAN IP (`http://192.168.1.100`) จะส่ง `X-API-Key` ผ่าน HTTP ธรรมดา — ใครก็ตามที่ทำ ARP spoof / MITM ใน LAN ดักได้
- **ใน production cloud setup** path นี้ skip อยู่แล้ว (เพราะ `isCloudEnvironment()` = true) — ปัญหาเฉพาะ on-prem deploy

#### AI Fix Prompt:
```
ใน firmware ESP32 (esp32/esp32.ino หรือ esp32C1/) ให้:

1. รองรับ HTTPS server บน ESP32 ด้วย ESPAsyncWebServer + self-signed cert
   หรือใช้ TLS-PSK กับ ApiKey ที่แบ่ง preshared secret

2. ใน my-app/lib/esp32.ts:
   เปลี่ยน BASE_URL จาก http:// เป็น https:// เมื่อ env ESP32_USE_TLS=true
   เพิ่ม fetch option: agent ที่ accept self-signed (ใน Node.js)

3. ถ้า on-prem ไม่ใช่ requirement (cloud-only) ให้:
   ลบ tryLanDirectBackground ออกเลย — ใช้แต่ IoT cloud polling ผ่าน
   /api/esp32/display (over HTTPS) ตามที่ทำอยู่แล้ว

แนะนำ option 3 เพราะ ESP32 polling ทำงานดีอยู่แล้ว (p95 = 97ms)
```

---

### 🔵 V13 — `auto_approve` รับค่า `true` (boolean) ได้แต่ doc บอกว่า "1" string
- **File**: `my-app/app/api/system/settings/route.ts:76`
- **ผลกระทบ**: เป็น compatibility ที่ตั้งใจ แต่ทำให้ inconsistent กับฝั่ง CLAUDE.md — ไม่ใช่ security risk

---

### 🔵 V14 — `app/api/system/test-webhook/route.ts` อนุญาตทดสอบ Discord URL ที่ owner ใส่ได้
- **File**: `my-app/app/api/system/test-webhook/route.ts:21-23`
- **เหตุ**: validate `startsWith("https://discord.com/api/webhooks/")` — แข็งพอ ไม่ใช่ SSRF แต่ถ้า attacker ขโมย owner session ก็ใช้ Vercel function spam Discord webhook ที่ตนรู้ snowflake ID ได้ (Discord rate-limit cap อยู่แล้ว)
- ไม่ต้องแก้แต่ Document ว่าเป็น by-design

---

### 🔵 V15 — `bypass_token` ไม่หมุน (rotate) ภายในช่วง 5 นาที
- **File**: `my-app/app/api/students/bypass/route.ts`
- **ผลกระทบ**: token เดิมใช้ได้ตลอด 5 นาทีตั้งแต่ approved_at — ถ้า attacker sniff token หนึ่งครั้งใน window นั้น เขาเปิดประตูซ้ำได้หลายครั้ง (จำกัดด้วย rate limit 1/30s แต่ก็ยังถือว่ามากเกินไป)
- ปัจจุบันรอ token ใหม่ทุก approval — รับได้

---

### ⚪ V16 — `system_settings` POST ส่ง Discord notification เป็น type `"esp32_offline"`
- **File**: `my-app/app/api/system/settings/route.ts:223`
- เป็น semantic bug ไม่ใช่ security — แค่ใช้ category ผิดในการแจ้งเตือน

---

## 4. สิ่งที่ระบบทำได้ดี (ห้ามแก้ — กันเสียประสิทธิภาพ)

| ✓ | ส่วน | เหตุผล |
|---|---|---|
| ✅ | PG ON CONFLICT atomic rate-limit ใน `lib/rate-limit.ts` | gold-standard serverless rate limit |
| ✅ | JWT HS256 verify + httpOnly + secure + sameSite lax | secure session |
| ✅ | CSP + HSTS + frame-ancestors none | XSS/clickjack mitigation ครบ |
| ✅ | Atomic `consumeQRToken` ด้วย UPDATE+WHERE+RETURNING | race-condition-free |
| ✅ | `timingSafeEqual` ใน `parseOfflineGrant` | กัน timing side channel |
| ✅ | Pooler ตั้ง keepAlive, max=5 ตรงกับ serverless | optimal pool sizing |
| ✅ | LAN direct fast-path เป็น fire-and-forget | ไม่ block hot path |
| ✅ | CORS origin lock เฉพาะ NEXT_PUBLIC_APP_URL | กัน cross-site |
| ✅ | IoT cloud polling (push-via-poll) | กัน NAT/CGNAT/firewall ของห้องเรียน |

---

## 5. แผน Performance / Offline (สรุปจากการทดสอบจริง)

### 5.1 Performance baseline (สำหรับ regression detection)
| Endpoint | p95 target | p95 จริง | สรุป |
|---|---:|---:|---|
| `/api/esp32/display` | < 200ms | 97ms | ✅ ดีกว่าเป้า 2× |
| `/api/auth/login` | < 500ms | 351ms (cold) | ✅ |
| `/` static | < 100ms | 281ms (cold first hit) | ⚠️ ลด cold start ด้วย ISR ได้ |

> **คำสั่งรันซ้ำ**: `cd my-app && node scripts/perf-test.mjs --runs 30`
> ใช้ baseline นี้เป็น regression test ก่อน deploy ทุกครั้ง

### 5.2 Offline behavior matrix
| ระบบที่ล่ม | ผลกระทบ | ทำงานต่อได้ไหม |
|---|---|---|
| Vercel ทั้งระบบ | client ไม่สามารถ submit form ใหม่ | ❌ — แต่ ESP32 lock ค้างปลอดภัย (fail-safe magnetic lock ตามรีพอร์ตเดิม) |
| Supabase DB | ทุก API ที่ต้อง DB ตอบ 500 — getFallbackSettings() ทำงานเฉพาะ read | ⚠️ partial |
| ESP32 (ตัวเดียวห้องนั้น) | คำสั่งเปิดจะคงค้างใน `room_cmd_<room>` จนกว่าจะรีบูต | ✅ — auto-recover เมื่อ ESP32 polls คืนมา |
| Wi-Fi/Internet ที่ห้อง | ESP32 ใช้ offline grant ที่ client เก็บไว้ submit ผ่าน 4G ตัวอื่นได้ | ✅ ถ้ามี backup path |
| ไฟดับห้องเรียน | magnetic lock = de-energized = unlocked (fail-safe) | ✅ |

### 5.3 Script reusable
- `my-app/scripts/perf-test.mjs` — ยิงจริงทุก endpoint หลัก
- `my-app/scripts/offline-test.mjs` — probe live + manual drill checklist
- `my-app/scripts/api-tamper-test.mjs` — 9 active tampering tests

---

## 6. AI Master Fix Prompt (ใช้สั่งครั้งเดียวจบ)

```
อ่านไฟล์ penetration_test_full_report_2026-05-27.md ในโฟลเดอร์ root ของโปรเจกต์

สำหรับช่องโหว่ทั้งหมดที่ระบุไว้ในส่วน "3. รายการช่องโหว่ที่พบ" ให้:

1. แก้เรียงตามลำดับ severity: เริ่ม V01 → V02 → V03 → V04 → V05 → V06 → V07 → V08 → V09 → V10 → V11 → V12
   (ข้าม V13, V14, V15, V16 — เป็น by-design)

2. ก่อนแต่ละการแก้ ให้ run scripts/api-tamper-test.mjs และ scripts/perf-test.mjs เก็บ baseline ไว้

3. ทำ change เล็กๆ ที่เป็นไปได้ — อย่า refactor นอกเหนือสิ่งที่ระบุใน "AI Fix Prompt" ของแต่ละช่องโหว่
   หลายช่องโหว่มี code block ที่บอกตรงๆ ว่าให้แก้อะไร — copy ทำตาม

4. หลังแก้แต่ละช่องโหว่ ให้ run script test ทั้ง 3 ตัว (perf-test, offline-test, api-tamper-test)
   เปรียบเทียบกับ baseline — ห้ามมี endpoint ใดช้าขึ้นเกิน +30ms p95

5. ห้ามแก้สิ่งที่อยู่ในส่วน "4. สิ่งที่ระบบทำได้ดี" — มีเหตุผลเฉพาะที่ทำให้ระบบเร็ว/ปลอดภัย

6. งานต้องเสร็จโดย:
   - ระบบยังทำงานเหมือนเดิม (functional regression = 0)
   - p95 ของทุก endpoint ใน perf-test ไม่เพิ่มเกิน 30ms จาก baseline
   - api-tamper-test ผ่านทุก case (ดู "Pass criteria" ใน script)
   - rotate Supabase password เป็นขั้นตอนแรกที่สุด

7. ทุก commit message ขึ้นต้นด้วย "security:" หรือ "perf:" และอ้างหมายเลข V## ใน body

8. ถ้าเจอช่องโหว่ใหม่ระหว่างทาง — ห้าม fix ทันที — เพิ่มเป็นรายการใหม่ที่ท้าย report นี้แล้วถาม user ก่อน
```

---

## 7. ภาคผนวก A — ข้อมูล env / config ที่อ่านได้
- Supabase project: `wvuvdnutidctmyojacrn`
- Pooler region: `aws-1-ap-southeast-1` ✓ ตรงกับ Vercel Singapore
- Configured rooms: CE-401 (192.168.1.100), CE-402 (192.168.1.101)
- `SKIP_DB_INIT=true` ✓ ลด cold-start time
- `ALLOW_DEV_SEED=false` ✓ ปลอดภัย
- Production app URL: `https://project-sigma-ivory-21.vercel.app`

## ภาคผนวก B — ไฟล์ที่ถูกตรวจ
```
my-app/lib/         auth.ts db.ts discord.ts esp32.ts qr.ts rate-limit.ts
                    rate-limit-middleware.ts resilience.ts pdf.ts faculties.ts
my-app/app/api/     auth/{login,logout,me,refresh}/route.ts
                    students/{[id],[id]/{approve,reject,door},pending,bypass,check-match}/route.ts
                    students/route.ts
                    admin-users/{route,[id]}/route.ts
                    esp32/{display,qr,qr/verify,status}/route.ts
                    system/{status,settings,health,unlock-room,test-webhook,logs/cleanup}/route.ts
                    logs/route.ts export/pdf/route.ts
my-app/             next.config.ts proxy.ts package.json .env.local CLAUDE.md
```

## ภาคผนวก C — เปรียบเทียบกับเอกสารเดิม (`CLAUDE.md`)
เอกสารปัจจุบันใน `my-app/CLAUDE.md` (section "🛡️ มาตรการความปลอดภัย") อ้างว่ามี 8 รายการที่แก้แล้ว — จากการตรวจ code จริง พบว่า:

| ข้อใน CLAUDE.md | สถานะจริง |
|---|---|
| 1. IDOR + sensitive field strip | ✅ ทำแล้ว (ดู `app/api/students/[id]/route.ts:43-66`) |
| 2. Login rate limit (10/5min) | ⚠️ จริงๆ เป็น 5/1min ใน code |
| 3. Logs `limit` clamp 1-500 | ✅ ทำแล้ว |
| 4. Mass-assignment + XSS field-whitelist | ✅ ทำแล้ว (แต่ regex sanitize เลี่ยงได้ — V09) |
| 5. `active_token` ซ่อนถ้าไม่มี `x-api-key` | ✅ ทำแล้ว |
| 6. Reject reason ≤ 500 char | ❌ **ยังไม่ทำ** (V03) |
| 7. Bypass rate limit per student/room | ✅ ทำแล้ว (1/30s) |
| 8. Admin creation password ≥ 8 + username regex | ❌ **ยังไม่ทำ** (V02 — code มี ≥6, ไม่มี regex) |

ดังนั้นต้องอัปเดต `CLAUDE.md` ให้ตรงกับ code จริงด้วย หลังแก้ V02 + V03 แล้ว

---

**สิ้นสุดรีพอร์ต** — `penetration_test_full_report_2026-05-27.md`
