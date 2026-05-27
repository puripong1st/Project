# รายงานทดสอบความปลอดภัยและประสิทธิภาพ

**โครงการ:** SmartAccess Door Access Controller (`my-app` Next.js + ESP32)  
**วันที่ตรวจ:** 2026-05-26  
**ขอบเขต:** Static code review, dependency audit, configuration review, API route review, lightweight network timing test  
**ข้อจำกัด:** ไม่ทำ destructive testing, ไม่ brute-force, ไม่โจมตี Vercel/Supabase/Discord ภายนอก และไม่เปิดเผยค่า secret จริงในรายงาน

## Executive Summary

ระบบมีการ harden หลายจุดแล้ว เช่น parameterized SQL, bcrypt, JWT cookie แบบ HttpOnly, QR token แบบสุ่มสูง, และบาง endpoint มี role check ที่เหมาะสม แต่ยังพบความเสี่ยง production สำคัญ โดยเฉพาะการปิด TLS verification, secret/default key ที่อยู่ใน source, default admin seed, security headers ยังไม่ครบ, rate limit แบบ in-memory ที่ไม่เหมาะกับ serverless, และ dependency audit พบ advisory ระดับ moderate ใน Next/PostCSS

ผลทดสอบประสิทธิภาพจากเครื่องผู้ตรวจ:

| Target | วิธีทดสอบ | ผล |
|---|---|---|
| Vercel API | `GET https://project-sigma-ivory-21.vercel.app/api/esp32/display?room=CE-402` จำนวน 5 ครั้ง | 367, 74, 76, 73, 74 ms; median 74 ms หลัง warm-up |
| Supabase direct DB | `SELECT 1` ผ่าน `POSTGRES_URL` พร้อม TLS verification | ล้มเหลวทุกครั้ง: `self-signed certificate in certificate chain` |
| Supabase direct DB แบบ insecure | ทดสอบซ้ำโดยพยายามปิด verification | ยังล้มเหลวจาก connection string/driver behavior; ยังไม่ควรวัด latency จนกว่า trust chain ถูกต้อง |

## Findings

### 1. Critical: ปิด TLS verification ฝั่ง PostgreSQL/Supabase

**ไฟล์:** `my-app/lib/db.ts`  
**หลักฐาน:** มี `process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"` และ `ssl: { rejectUnauthorized: false }`  
**ผลกระทบ:** ลดความปลอดภัย TLS ทั้ง process ของ Node.js และเปิดช่องให้ connection ไป Supabase ถูกดักกลางทางได้หาก network หรือ CA chain ถูกควบคุม  
**สถานะทดสอบ:** เมื่อตั้ง TLS verification ให้เข้มงวด การเชื่อมต่อ Supabase ล้มเหลวด้วย `self-signed certificate in certificate chain` แปลว่าระบบพึ่งพาการปิด verification อยู่จริง

**Prompt สำหรับ AI แก้ไข**

```markdown
แก้ความเสี่ยง TLS ใน `my-app/lib/db.ts` โดยห้ามตั้ง `process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"` และห้ามใช้ `ssl.rejectUnauthorized = false` ใน production

งานที่ต้องทำ:
1. ลบการ override TLS global ออกจาก `lib/db.ts`
2. ปรับ `PoolConfig` ให้รองรับ Supabase อย่างปลอดภัย โดยใช้ CA certificate จาก environment เช่น `SUPABASE_CA_CERT` หรือใช้ connection string ที่ตั้ง `sslmode=verify-full` ได้ถูกต้อง
3. ถ้าไม่มี CA ใน production ให้ throw error พร้อมข้อความชัดเจน ไม่ fallback เป็น insecure
4. คงพฤติกรรม development ให้ใช้งานได้ แต่ต้องแยกด้วย `NODE_ENV !== "production"` อย่างชัดเจน
5. เพิ่มเอกสารตัวอย่าง env โดยไม่ใส่ secret จริง
6. รัน `npm run lint` และทดสอบ query เบาๆ เช่น `SELECT 1`
```

### 2. Critical: Secret และ webhook จริงอยู่ใน source code

**ไฟล์:** `my-app/lib/db.ts`, `my-app/scratch_*.js`, `esp32/esp32.ino`, `esp32C1/esp32C1.ino`, `my-app/app/admin/dashboard/page.tsx`  
**หลักฐาน:** พบ hard-coded Discord webhook URL, hard-coded Supabase connection string ใน scratch scripts, และ default ESP32 API key ใน firmware/UI snippet  
**ผลกระทบ:** หาก repo ถูกแชร์หรือ push ขึ้น GitHub จะทำให้ credential ใช้งานจริงรั่วทันที

**Prompt สำหรับ AI แก้ไข**

```markdown
กำจัด secret ออกจาก repository ทั้งหมดโดยไม่ทำให้ระบบเดิมเสีย

งานที่ต้องทำ:
1. ลบ hard-coded Discord webhook URL และ Supabase connection string จาก source/scratch scripts
2. เปลี่ยนเป็น environment variables หรือ placeholder ที่ไม่ใช้งานจริง
3. เพิ่ม `.env.example` ที่มีเฉพาะชื่อ key และตัวอย่าง dummy value
4. ปรับ seed default settings ใน `lib/db.ts` ให้ค่า webhook เป็นค่าว่างเสมอ
5. ตรวจว่า firmware และหน้า dashboard ไม่แสดง API key จริงเป็นค่า default production
6. เพิ่ม checklist ให้ rotate Discord webhooks, Supabase password, และ ESP32 API key ที่เคยอยู่ใน repo
7. รัน `rg` เพื่อยืนยันว่าไม่มี `discord.com/api/webhooks`, connection string จริง, หรือ secret จริงเหลืออยู่
```

### 3. High: ESP32 ใช้ `setInsecure()` และ API key ฝังใน firmware

**ไฟล์:** `esp32/esp32.ino`, `esp32C1/esp32C1.ino`, code snippet ใน dashboard/preview  
**หลักฐาน:** `client->setInsecure()` และ `api_key = "smartaccess_secure_door_unlock_token_2026"`  
**ผลกระทบ:** อุปกรณ์ยอมรับ TLS certificate ใดก็ได้ และหาก firmware/key หลุด ผู้โจมตีสามารถปลอมตัวเป็นอุปกรณ์หรืออ่านข้อความ API ได้ง่ายขึ้น

**Prompt สำหรับ AI แก้ไข**

```markdown
แก้ firmware ESP32 ให้ตรวจ TLS certificate จริงและลดการพึ่งพา shared key ที่ฝังตายตัว

งานที่ต้องทำ:
1. แทนที่ `client->setInsecure()` ด้วย root CA certificate ที่ถูกต้องสำหรับ endpoint production
2. แยก API key ออกจาก source โดยใช้ไฟล์ config template ที่ไม่ commit secret จริง
3. เพิ่มคำอธิบายวิธี provision key ต่อบอร์ดแต่ละตัว
4. ฝั่ง Next.js ต้อง reject default `ESP32_API_KEY` ใน production ด้วยการ throw error
5. รักษา flow เดิม: ESP32 polling `/api/esp32/display`, แสดง QR, และรับ `door_trigger`
6. ทดสอบ compile sketch หรืออย่างน้อยตรวจ syntax/constant ที่เกี่ยวข้อง
```

### 4. High: Default admin seed อาจสร้างบัญชี `admin/admin123`

**ไฟล์:** `my-app/lib/db.ts`  
**หลักฐาน:** `bcrypt.hash("admin123", 12)` และ insert user `admin` ใน initDatabase  
**ผลกระทบ:** หาก initDatabase ทำงานใน environment ที่ไม่ควร seed หรือ database ถูกสร้างใหม่ อาจเกิดบัญชี admin คาดเดาง่าย

**Prompt สำหรับ AI แก้ไข**

```markdown
ทำให้การ seed admin ปลอดภัยสำหรับ production

งานที่ต้องทำ:
1. ห้าม seed `admin/admin123` ใน production ทุกกรณี
2. ให้ seed development ได้เฉพาะเมื่อ `ALLOW_DEV_SEED=true`
3. ถ้าต้องสร้าง admin ครั้งแรกใน production ให้ใช้ env เช่น `INITIAL_ADMIN_USERNAME`, `INITIAL_ADMIN_PASSWORD`, `INITIAL_ADMIN_FULL_NAME` และ enforce password policy
4. เพิ่ม log ที่ไม่เปิดเผยรหัสผ่าน
5. รักษา schema และ flow login เดิม
```

### 5. Medium: Rate limiting แบบ in-memory ไม่พอสำหรับ Vercel/serverless

**ไฟล์:** `app/api/auth/login/route.ts`, `app/api/esp32/qr/verify/route.ts`, `app/api/students/bypass/route.ts`  
**หลักฐาน:** ใช้ `Map` ใน memory ต่อ process และบาง endpoint สำคัญยังไม่มี rate limit เช่น `students/bypass`  
**ผลกระทบ:** บน serverless instance หลายตัว limit ไม่แชร์กัน, restart แล้วหาย, bypass endpoint อาจถูกยิงซ้ำจนเกิด load หรือสั่งเปิดประตูซ้ำได้หากถือ token ที่ถูกต้อง

**Prompt สำหรับ AI แก้ไข**

```markdown
ปรับ rate limiting ให้เหมาะกับ Vercel/serverless และ endpoint เปิดประตู

งานที่ต้องทำ:
1. สร้าง helper rate limit กลางที่ใช้ durable store เช่น Supabase table หรือ Vercel KV/Upstash ถ้ามี
2. ครอบ login, QR verify, students POST registration, และ students/bypass
3. จำกัด bypass ต่อ `student_id + room + window` เพื่อกันการเปิดประตูซ้ำถี่เกินไป
4. คืน HTTP 429 พร้อมข้อความเดิมในภาษาไทย
5. ไม่เปลี่ยน response shape สำเร็จเดิม
6. เพิ่ม test/manual verification commands
```

### 6. Medium: Security headers ยังไม่ถูกตั้งใน Next.js config

**ไฟล์:** `my-app/next.config.ts`  
**หลักฐาน:** ยังไม่มี `headers()` สำหรับ CSP, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy  
**ผลกระทบ:** ลดการป้องกัน XSS, clickjacking, MIME sniffing และ privacy leakage

**Prompt สำหรับ AI แก้ไข**

```markdown
เพิ่ม security headers ใน `next.config.ts` โดยไม่ทำให้หน้า dashboard และ API เดิมเสีย

งานที่ต้องทำ:
1. เพิ่ม `async headers()` สำหรับทุก route
2. ใส่ `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` ที่ปิด camera/microphone/geolocation ถ้าไม่ใช้
3. ใส่ HSTS เฉพาะ production
4. ออกแบบ CSP แบบเริ่มต้นที่รองรับ Next.js, inline style ที่มีอยู่, fonts/assets local, Discord webhook fetch เฉพาะ server-side ไม่ต้องเปิดใน browser
5. ถ้า CSP เข้มทันทีเสี่ยงพัง ให้เริ่มเป็น `Content-Security-Policy-Report-Only` และระบุขั้นตอนเปลี่ยนเป็น enforce
6. รัน build/lint และเปิดหน้า login/dashboard ตรวจ console
```

### 7. Medium: Dependency advisory ใน Next/PostCSS

**คำสั่ง:** `npm audit --audit-level=moderate --json`  
**ผล:** พบ 2 vulnerabilities ระดับ moderate: `next` affected via `postcss`, advisory `GHSA-qx2v-qp2m-jg93`  
**หมายเหตุ:** `npm audit` แนะนำ fix ที่ downgrade เป็น Next 9.3.3 ซึ่งไม่ควรทำ ต้องอัปเดต Next/PostCSS ตาม compatibility จริง

**Prompt สำหรับ AI แก้ไข**

```markdown
แก้ dependency audit โดยไม่ downgrade framework

งานที่ต้องทำ:
1. ตรวจ version ล่าสุดที่ปลอดภัยของ Next.js 16 และ PostCSS ที่เข้ากันได้
2. อัปเดต `package.json` และ lockfile อย่างระมัดระวัง
3. ห้ามใช้ `npm audit fix --force` ถ้าทำให้ downgrade major หรือทำลาย Next 16
4. รัน `npm install`, `npm audit --audit-level=moderate`, `npm run lint`, และ `npm run build`
5. สรุป breaking changes ถ้ามี
```

### 8. Low/Medium: Lint fail และ performance smell ใน React effects

**คำสั่ง:** `npm run lint`  
**ผล:** 18 errors, 6 warnings เช่น `no-explicit-any`, `set-state-in-effect`, `prefer-const`, `no-unescaped-entities`, scratch scripts ใช้ `require()`  
**ผลกระทบ:** ยังไม่ใช่ช่องโหว่โดยตรงทั้งหมด แต่ทำให้ quality gate ไม่ผ่านและมีโอกาสเกิด cascading renders/performance issue

**Prompt สำหรับ AI แก้ไข**

```markdown
แก้ lint errors ทั้งหมดโดยคงพฤติกรรมระบบเดิม

งานที่ต้องทำ:
1. แก้ `no-explicit-any` ด้วย type ที่เหมาะสม
2. ย้าย state initialization ที่เกิดจาก `window.location.origin` หรือ date ให้ใช้ lazy initializer หรือวิธีที่ไม่ trigger lint
3. แก้ `prefer-const`, `react/no-unescaped-entities`, unused vars
4. ย้าย scratch scripts ออกจาก lint scope หรือแปลงเป็น ESM/เพิ่ม ignore ที่เหมาะสม
5. ห้าม refactor UI ใหญ่เกินจำเป็น
6. รัน `npm run lint` ให้ผ่าน
```

## Performance Notes: Vercel vs Supabase vs API

1. Vercel API `/api/esp32/display` ให้ผลดีหลัง warm-up: median 74 ms จากเครื่องที่ทดสอบ
2. First request 367 ms น่าจะมาจาก cold start/network warm-up/DB cache warm-up
3. Supabase direct DB ยังวัดแบบปลอดภัยไม่ได้ เพราะ TLS chain ไม่ผ่านเมื่อเปิด verification
4. Code path `/api/esp32/display` มีการ `Promise.all` query หลายตัวแล้ว ถือว่าเหมาะกับ polling endpoint
5. จุดที่ควรวัดต่อหลังแก้ TLS:
   - Vercel endpoint with authenticated device header
   - Supabase `SELECT 1`
   - Supabase query จริงใน `/api/esp32/display`
   - End-to-end ESP32 polling interval จาก device จริง

## Recommended Priority

1. Rotate secrets ทั้งหมดที่เคยอยู่ใน repo: Discord webhooks, Supabase password, ESP32 API key
2. แก้ TLS verification ฝั่ง Node/Supabase และ ESP32
3. ปิด default admin seed ใน production
4. เพิ่ม durable rate limiting สำหรับ login/QR/bypass
5. เพิ่ม security headers
6. อัปเดต dependencies และแก้ lint ให้ pipeline ผ่าน

## Commands Used

```powershell
rg --files
rg -n "getAdminFromCookie|role|setInsecure|ESP32_API_KEY|smartaccess_secure|POSTGRES_URL|webhook|bypass_token|password|token|innerHTML|dangerouslySetInnerHTML|TODO|FIXME" .
npm audit --audit-level=moderate --json
npm run lint
node <lightweight timing script>
```
