# รายงานทดสอบความปลอดภัย ประสิทธิภาพ และความพร้อมใช้งานแบบออฟไลน์

**โครงการ:** RMUTP Door Access Controller (`my-app` Next.js + Supabase/PostgreSQL + ESP32)  
**วันที่ทดสอบ:** 2026-05-26  
**ขอบเขต:** source review, dependency audit, build/lint gate, lightweight live timing, offline/failure simulation  
**ข้อจำกัด:** ไม่ทำ destructive test, ไม่ brute force, ไม่ยิงโหลดหนัก, ไม่เรียก endpoint เปิดประตูจริง, และไม่เปิดเผยค่า secret จริงในรายงานนี้

## สรุปผลผู้บริหาร

ระบบผ่าน `npm audit`, `npm run lint`, และ `npm run build` แล้ว แปลว่า dependency gate และ build gate ปัจจุบันสะอาดขึ้นมากเมื่อเทียบกับรายงานเก่า หลายจุดถูก harden แล้ว เช่น SQL parameterized query, JWT cookie แบบ HttpOnly, login rate limit ผ่าน PostgreSQL, IDOR ของ `/api/students/[id]` ถูกปิดด้วย token, และ ESP32 production sketch ใช้ CA certificate แล้ว

แต่ยังมีความเสี่ยง production สำคัญที่ควรแก้ก่อนใช้งานจริง:

1. **Critical:** พบค่า secret ลักษณะใช้งานจริงในไฟล์ env ตัวอย่าง/local ที่อยู่ใน workspace
2. **Critical:** `/api/esp32/qr` เปิด public และสร้าง QR ที่มี active token ได้โดยไม่ต้องยืนยันว่าเป็น ESP32
3. **High:** offline replay บน `POST /api/students` ข้ามการตรวจ QR token ได้เพียงส่ง `offline_id` และ `offline_created_at`
4. **High:** Supabase/Postgres TLS ยัง fallback เป็น `rejectUnauthorized: false` เมื่อไม่มี CA
5. **Medium:** offline readiness ยังพึ่งพาหน้าเว็บที่โหลดไว้แล้ว ไม่มี service worker/PWA และเมื่อ Vercel/Supabase ล่มจะเหลือเฉพาะ fallback บางส่วน

## ผลทดสอบที่ผ่าน

| การทดสอบ | ผล |
|---|---|
| `npm audit --audit-level=moderate --json` | ผ่าน, 0 vulnerabilities |
| `npm run lint` | ผ่าน |
| `npm run build` | ผ่าน, Next.js build สำเร็จ |
| Git tracking check | `.env.local` และ `.env.example` ถูก ignore อยู่ แต่ยังมี secret อยู่ใน workspace |
| Supabase unavailable simulation | local API ตอบ fallback `503` ได้ใน 164 ms |

## Performance Snapshot

ทดสอบแบบเบา ๆ จากเครื่องผู้ประเมิน จำนวน request น้อย จึงเป็น snapshot ณ เวลาเครือข่ายขณะทดสอบ ไม่ใช่ load test

| Target | วิธี | ผล |
|---|---|---|
| Vercel API | `GET https://project-sigma-ivory-21.vercel.app/api/esp32/display?room=CE-402` 5 ครั้ง | 690, 100, 70, 68, 63 ms; median 70 ms; first request สูงจาก cold/warm-up |
| Supabase direct DB | `SELECT 1` ผ่าน current app style TLS (`rejectUnauthorized: false`) 5 ครั้ง | 285, 36, 37, 37, 37 ms; median 37 ms |
| Supabase strict TLS | `SELECT 1` พร้อม `rejectUnauthorized: true` ไม่มี custom CA | ล้มเหลว: `self-signed certificate in certificate chain` |
| Local production API | `next start` แล้วเรียก `/api/esp32/display?room=CE-402` 5 ครั้ง | 540, 273, 79, 79, 80 ms; median 80 ms |
| Public QR endpoint probe | `GET /api/esp32/qr?room=CE-402` | ตอบ `200` ใน 425 ms โดยไม่ต้อง auth |
| DB-down simulation | local production API + invalid Postgres endpoint | ตอบ `503 degraded` ใน 164 ms |

ข้อสรุปด้านความเร็ว: Supabase direct หลัง warm-up เร็วสุดใน test นี้ (ประมาณ 36-37 ms), Vercel API หลัง warm-up อยู่ราว 63-100 ms เพราะมี API layer และ query หลายตัว, local API หลัง warm-up อยู่ราว 79-80 ms จากเครื่องนี้

## Findings

### 1. Critical: Secret อยู่ในไฟล์ env ตัวอย่าง/local

**หลักฐาน:** `my-app/.env.example` มีค่า Supabase service role/JWT secret/Postgres password/connection string/JWT secret/initial admin password/ESP32 API key ลักษณะใช้งานจริง เช่นบรรทัด 7, 8, 15, 17, 24, 34, 48  
**สถานะ Git:** `git ls-files` ไม่พบว่า `.env.example` หรือ `.env.local` ถูก track แต่ไฟล์ยังอยู่ใน workspace และเสี่ยงหลุดผ่าน zip, copy, screenshot, หรือการ commit ภายหลัง  
**ผลกระทบ:** หากค่าเหล่านี้เคยใช้จริง ต้องถือว่า compromise แล้ว โดยเฉพาะ Supabase service role และ Postgres password

**Prompt สำหรับ AI แก้ไข**

```markdown
ตรวจและกำจัด secret ออกจาก repository/workspace โดยรักษาพฤติกรรมระบบเดิม

งานที่ต้องทำ:
1. แทนค่าใน `my-app/.env.example` ทั้งหมดด้วย dummy placeholder เท่านั้น ห้ามมี Supabase service role, DB password, JWT secret, initial admin password, หรือ ESP32 key จริง
2. เพิ่มหรือยืนยัน `.gitignore` ให้ ignore `.env`, `.env.local`, `.env.*.local` แต่ยังอนุญาต `.env.example` แบบ dummy ได้
3. เพิ่ม checklist การ rotate secret: Supabase service role, anon/publishable key หากจำเป็น, Postgres password, JWT_SECRET, INITIAL_ADMIN_PASSWORD, ESP32_API_KEY
4. ตรวจด้วย `rg` ว่าไม่มี `SUPABASE_SERVICE_ROLE_KEY`, connection string จริง, JWT secret จริง, หรือ webhook จริงเหลือในไฟล์ที่ track ได้
5. ห้ามเปลี่ยน API response shape หรือ flow การ login/register เดิม
6. รัน `npm run lint`, `npm run build`, และ `npm audit --audit-level=moderate`
```

### 2. Critical: Public QR endpoint เปิด active token ให้คนภายนอกดึงได้

**หลักฐาน:** `my-app/app/api/esp32/qr/route.ts:31-50` สร้าง QR จาก `getOrCreateActiveQRToken(room)` และตอบ PNG พร้อม `Access-Control-Allow-Origin: *` โดยไม่ตรวจ `X-API-Key`  
**ผลทดสอบ:** Vercel `/api/esp32/qr?room=CE-402` ตอบ `200` โดยไม่ต้อง auth  
**ผลกระทบ:** คนที่รู้ URL สามารถดึง QR จากนอกห้องได้ แล้วถอด token จากภาพ QR เพื่อสมัคร/เข้าคิวจากระยะไกลได้ โดยเฉพาะช่วงที่ auto approve เปิดใช้งาน

**Prompt สำหรับ AI แก้ไข**

```markdown
ปิดช่องโหว่ public QR token exposure โดยไม่ทำให้ ESP32 แสดง QR เสีย

งานที่ต้องทำ:
1. บังคับให้ `/api/esp32/qr` รับเฉพาะ request ที่มี `X-API-Key` ตรงกับ `ESP32_API_KEY`
2. ใน production ถ้า `ESP32_API_KEY` ไม่มีหรือเป็น placeholder ให้ throw error แบบ fail-closed
3. ลบ `Access-Control-Allow-Origin: *` ออกจาก QR endpoint หรือจำกัดให้จำเป็นจริงเท่านั้น
4. ให้ ESP32 ดึง QR/active token ผ่าน authenticated path เท่านั้น ส่วน browser public ห้ามดึง token ตรง
5. ถ้าหน้า preview ต้องใช้ใน dev ให้เปิดได้เฉพาะ `NODE_ENV !== "production"` หรือหลัง admin login
6. รักษา format QR เดิมสำหรับ ESP32 และรัน manual test ว่า ESP32 ยังแสดง QR ได้
```

### 3. High: Offline replay ข้าม QR token validation ได้

**หลักฐาน:** `my-app/app/api/students/route.ts:98-101` สร้าง `isOfflineReplay` จาก `offline_id` และ `offline_created_at`; บรรทัด 140 ใช้ `isOfflineReplay ? true : await consumeQRToken(...)`  
**หลักฐานฝั่ง client:** `my-app/app/page.tsx:694-705` ใส่ `offline_id` และ `offline_created_at` จาก client localStorage queue  
**ผลกระทบ:** ผู้โจมตีสามารถสร้าง payload เองพร้อม `offline_id` และ `offline_created_at` เพื่อข้ามการ scan QR ได้ ถึงแม้ auto approve จะถูกปิดสำหรับ offline replay แต่ยังทำให้ส่งคำขอ pending จากระยะไกลได้โดยไม่อยู่หน้าห้อง

**Prompt สำหรับ AI แก้ไข**

```markdown
แก้ offline replay ให้ยังใช้งาน offline ได้ แต่ไม่ข้ามหลักฐานการสแกน QR

งานที่ต้องทำ:
1. ห้ามให้ `offline_id` และ `offline_created_at` เพียงอย่างเดียว bypass `consumeQRToken`
2. ออกแบบ offline grant ที่ฝังมากับ QR เช่น signed token/JWT/HMAC ที่มี room, issued_at, expires_at, nonce และใช้ได้ครั้งเดียว
3. เมื่อ offline queue sync กลับมา ให้ server ตรวจ signature, expiry, room และบันทึก nonce/hash กัน replay
4. จำกัดอายุ offline grant ให้สั้น เช่น 5-10 นาที และไม่ต่ออายุจาก client clock
5. ถ้าไม่มี offline grant ที่ถูกต้อง ให้ตอบ 403 เหมือน token invalid
6. รักษา UX offline เดิม: ถ้าผู้ใช้โหลดหน้าไว้แล้วและเน็ตหลุด ให้ queue ได้ แต่ sync ต้องผ่าน validation ใหม่
7. เพิ่ม test/manual verification สำหรับ online token, offline valid grant, offline expired grant, duplicate replay
```

### 4. High: Supabase TLS ยัง fail-open เมื่อไม่มี CA

**หลักฐาน:** `my-app/lib/db.ts:72` และ `my-app/lib/db.ts:74` ใช้ `sslConfig = { rejectUnauthorized: false }` เมื่อไม่มี `SUPABASE_CA_CERT`  
**ผลทดสอบ:** strict TLS (`rejectUnauthorized: true`) ล้มเหลวด้วย `self-signed certificate in certificate chain`, ขณะที่ current insecure TLS query ผ่าน  
**ผลกระทบ:** ลดคุณสมบัติการยืนยันตัวตน TLS ของฐานข้อมูลใน production และทำให้ระบบพึ่งพาการปิด verification

**Prompt สำหรับ AI แก้ไข**

```markdown
ปรับ PostgreSQL/Supabase TLS ให้ production fail-closed และยังใช้ development ได้

งานที่ต้องทำ:
1. ใน production ห้าม fallback เป็น `rejectUnauthorized: false`
2. บังคับใช้ `SUPABASE_CA_CERT` หรือ configuration ที่ verify certificate ได้จริง เช่น `sslmode=verify-full` พร้อม CA ที่ถูกต้อง
3. ถ้า production ไม่มี CA ให้ throw error ชัดเจน ไม่เชื่อมต่อแบบ insecure
4. development/local อนุญาต insecure TLS ได้เฉพาะ `NODE_ENV !== "production"` และต้องมี log warning
5. อัปเดต `.env.example` ให้มี placeholder CA เท่านั้น ไม่ใช่ค่า secret จริง
6. รัน `SELECT 1` แบบ strict TLS, `npm run lint`, และ `npm run build`
```

### 5. Medium: Offline readiness ยังไม่ครอบคลุม Vercel/Supabase/ไฟดับ

**หลักฐาน:** client ใช้ `navigator.onLine` และ `localStorage` queue ที่ `my-app/app/page.tsx:495-545`, แต่ไม่พบ service worker/PWA cache สำหรับโหลดหน้าเมื่อ Vercel ล่ม  
**ผลทดสอบ DB-down:** `/api/esp32/display` ตอบ fallback `503 degraded` ได้เร็ว แต่ไม่มี active token/คำสั่งเปิดประตูจาก DB  
**ผลกระทบ:** ถ้า Vercel ล่มก่อนผู้ใช้โหลดหน้า จะใช้งานไม่ได้; ถ้า Supabase ล่ม ระบบรับข้อมูลใหม่ไม่ได้; ถ้าไฟดับที่ ESP32/กลอน/เราเตอร์ จะไม่มี local power fallback

**Prompt สำหรับ AI แก้ไข**

```markdown
ยกระดับ offline/availability โดยรักษา UX เดิม

งานที่ต้องทำ:
1. เพิ่ม PWA service worker เพื่อ cache shell ของหน้า register และ asset สำคัญ
2. แยกสถานะ offline: client offline, Vercel/API offline, Supabase offline, ESP32 offline
3. ทำ local queue ด้วย IndexedDB แทน localStorage สำหรับข้อมูลรอ sync และเข้ารหัส/ลดข้อมูลส่วนบุคคลเท่าที่ทำได้
4. offline sync ต้องใช้ signed offline grant ตาม finding offline replay
5. เพิ่ม server fallback response ที่ชัดเจนเมื่อ Supabase ล่ม และห้ามสร้าง token/อนุมัติ/เปิดประตูโดยไม่มี DB consistency
6. เพิ่มคู่มือ hardware fallback: UPS สำหรับ ESP32/router/lock, physical override, fail-secure/fail-safe policy ตามความต้องการอาคาร
7. เพิ่ม manual tests สำหรับ Vercel unavailable, Supabase unavailable, client offline, ESP32 power loss
```

### 6. Medium: CSP ยังเป็น report-only และยังมี `unsafe-inline`/`unsafe-eval`

**หลักฐาน:** `my-app/next.config.ts:12` มี `script-src 'self' 'unsafe-inline' 'unsafe-eval'`; `my-app/next.config.ts:37` ใช้ `Content-Security-Policy-Report-Only`  
**ผลกระทบ:** CSP ยังไม่ enforce จริง และ policy ยังเปิดทางให้ XSS sink บางรูปแบบทำงานได้หากมี injection หลุดเข้ามา

**Prompt สำหรับ AI แก้ไข**

```markdown
ปรับ CSP จาก report-only ไปสู่ enforce แบบค่อยเป็นค่อยไป

งานที่ต้องทำ:
1. ตรวจ inline script/style ที่จำเป็นจริงใน Next.js app
2. ลบ `unsafe-eval` ใน production ถ้า framework ไม่จำเป็น
3. วางแผน nonce/hash สำหรับ inline script หรือคง `unsafe-inline` เฉพาะ report-only ชั่วคราวพร้อม TODO ชัดเจน
4. เพิ่ม `Content-Security-Policy` enforce สำหรับ production เมื่อ policy ผ่านการทดสอบ
5. เปิด browser console ตรวจหน้า `/`, `/admin/login`, `/admin/dashboard`, `/esp32-preview`
6. รัน `npm run build`
```

### 7. Medium: Remote/manual unlock ไม่มี cooldown และไม่มี room-level authorization

**หลักฐาน:** `my-app/app/api/system/unlock-room/route.ts:16` อนุญาต admin ที่ login แล้วเรียก unlock ห้องใดก็ได้; `my-app/app/api/students/[id]/door/route.ts` ระบุว่า both roles can open door  
**ผลกระทบ:** หากบัญชี door operator ถูกยึด session จะสามารถสั่ง unlock ซ้ำหรือ unlock ห้องที่ไม่ควรดูแลได้

**Prompt สำหรับ AI แก้ไข**

```markdown
เพิ่ม guardrail ให้ remote/manual unlock โดยไม่เปลี่ยน workflow แอดมินเดิมเกินจำเป็น

งานที่ต้องทำ:
1. เพิ่ม rate limit/cooldown ต่อ `admin_id + room` และต่อ `room` เช่น 1 ครั้งต่อ 10-30 วินาที
2. เพิ่ม room-level authorization mapping ถ้ามีหลายห้อง เช่น owner ทุกห้อง, door_operator เฉพาะห้องที่ได้รับมอบหมาย
3. บันทึก audit log ทุกครั้งทั้ง success/failure พร้อมเหตุผล
4. ถ้า role/room ไม่ผ่าน ให้ตอบ 403 โดยไม่ queue คำสั่ง
5. รักษา response shape เดิมสำหรับ dashboard
6. เพิ่ม manual test สำหรับ owner, operator ห้องที่มีสิทธิ์, operator ห้องที่ไม่มีสิทธิ์, cooldown hit
```

### 8. Low/Medium: Password policy สำหรับสร้าง admin ยังต่ำ

**หลักฐาน:** `my-app/app/api/admin-users/route.ts:46` ตรวจเพียง `password.length < 6`  
**ผลกระทบ:** owner ที่สร้างบัญชีใหม่อาจตั้งรหัสผ่านอ่อน ทำให้ brute force/credential stuffing สำเร็จง่ายขึ้น แม้ login จะมี rate limit แล้ว

**Prompt สำหรับ AI แก้ไข**

```markdown
ยกระดับ password policy สำหรับ admin โดยไม่ทำให้บัญชีเดิมใช้งานไม่ได้ทันที

งานที่ต้องทำ:
1. บังคับ password ใหม่อย่างน้อย 12 ตัวอักษร
2. block common passwords และรหัสที่ตรง username/full_name
3. เพิ่มข้อความ error ภาษาไทยที่ชัดเจน
4. ไม่บังคับ reset บัญชีเดิมใน migration แต่เพิ่ม flag/คำเตือนให้ owner เปลี่ยนรหัสผ่าน
5. รัน lint/build และทดสอบสร้าง admin ใหม่
```

### 9. Low/Medium: Public auto-fill endpoint ควรมี rate limit/token binding

**หลักฐาน:** `my-app/app/api/students/check-match/route.ts:5` เป็น public POST ที่ค้นประวัติจากชื่อ นามสกุล และรหัสนักศึกษา แต่ยังไม่เห็น rate limit หรือ QR token binding  
**ผลกระทบ:** อาจถูกใช้เป็น data oracle เพื่อยืนยันข้อมูลบางส่วนของนักศึกษา หากรู้ข้อมูลระบุตัวตนครบ

**Prompt สำหรับ AI แก้ไข**

```markdown
ลดความเสี่ยง data oracle ของ `/api/students/check-match`

งานที่ต้องทำ:
1. เพิ่ม rate limit ต่อ IP และต่อ student_id
2. ผูก endpoint นี้กับ QR token/session ปัจจุบัน หรือปิดเมื่อไม่มี scan token ที่ valid
3. คืนข้อมูลเท่าที่จำเป็นที่สุด และอย่าแยก error ที่ช่วย enumerate
4. รักษา auto-fill UX เดิมเมื่อผู้ใช้สแกน QR ถูกต้อง
5. เพิ่ม manual test สำหรับ valid scan, invalid/no scan, rate limit hit
```

### 10. Low: Pending list เปิดเผย IP ให้ operator

**หลักฐาน:** `my-app/app/api/students/pending/route.ts:22` return `ip_address` ให้ทุก admin role ที่ login แล้ว  
**ผลกระทบ:** IP address เป็นข้อมูลส่วนบุคคล/ข้อมูลระบบ ควรเห็นเฉพาะ owner หรือใช้เพื่อ audit เท่านั้น

**Prompt สำหรับ AI แก้ไข**

```markdown
ลดข้อมูลส่วนบุคคลใน pending API

งานที่ต้องทำ:
1. ถ้า admin.role ไม่ใช่ owner ให้ตัด `ip_address` ออกจาก response
2. Owner ยังดู IP ได้สำหรับ audit
3. รักษา dashboard pending table ให้ไม่พังเมื่อไม่มี `ip_address`
4. รัน lint/build
```

## Offline/Failure Matrix

| สถานการณ์ | ผลปัจจุบัน | ความเสี่ยง | ข้อเสนอ |
|---|---|---|---|
| มือถือ offline หลังโหลดหน้าแล้ว | เก็บ queue ใน `localStorage` และ flush เมื่อ online | offline payload ถูกปลอมได้ถ้าไม่มี signed grant | ใช้ signed offline grant + IndexedDB |
| มือถือเข้าเว็บตอน Vercel ล่ม | หน้าเว็บ/API โหลดไม่ได้ | ใช้งานไม่ได้ | PWA/service worker cache เฉพาะ shell + offline notice |
| Supabase ล่ม | display API fallback `503 degraded`; register/admin ทำงานไม่ได้ | ไม่มี token/command consistency | แสดง degraded ชัดเจน, ห้ามอนุมัติ/เปิดประตูโดยไม่มี DB |
| Vercel ล่ม | ESP32 poll API ไม่ได้ | QR/command cloud หยุด | เพิ่ม local emergency mode/edge failover ถ้าจำเป็น |
| ไฟดับที่ห้อง/เราเตอร์/ESP32/กลอน | ระบบ IoT หยุด | ประตูอาจเปิดไม่ได้หรือ lock policy ไม่ชัด | UPS, physical override, กำหนด fail-secure/fail-safe |

## Prompt รวมสำหรับสั่ง AI แก้ทั้งหมด

```markdown
คุณเป็น senior full-stack/security engineer ในโปรเจกต์ RMUTP Door Access Controller ให้แก้ช่องโหว่ในรายงาน `penetration_performance_offline_report_2026-05-26.md` โดยรักษาพฤติกรรมระบบเดิมและ response shape เดิมให้มากที่สุด

ลำดับความสำคัญ:
1. กำจัด secret จริงออกจาก env example/workspace และเพิ่ม dummy `.env.example`
2. ปิด public QR token exposure ของ `/api/esp32/qr`
3. แก้ offline replay ให้ต้องใช้ signed offline grant ไม่ใช่แค่ `offline_id`
4. ทำ Supabase TLS ให้ production fail-closed และ verify certificate จริง
5. เพิ่ม offline/PWA readiness แบบไม่ลด security
6. Harden CSP, remote unlock cooldown/room authorization, admin password policy, check-match rate limit, pending IP filtering

ข้อกำหนด:
- ห้าม commit หรือพิมพ์ค่า secret จริง
- ห้ามทำลาย flow เดิมของ ESP32 polling, QR registration, admin approval, bypass 5 นาที, PDF export, Discord notification
- ใช้ parameterized query ต่อไป
- เพิ่มหรือปรับ test/manual verification commands เท่าที่เหมาะสม
- หลังแก้ต้องรัน `npm audit --audit-level=moderate --json`, `npm run lint`, `npm run build`
- สรุปไฟล์ที่แก้ เหตุผล และ residual risk ที่ยังต้องทำด้วย hardware/infra เช่น UPS หรือ secret rotation
```

## Commands Used

```powershell
npm audit --audit-level=moderate --json
npm run lint
npm run build
rg --files
rg -n --glob '!node_modules/**' --glob '!.next/**' "<security patterns>" .
git ls-files -- my-app/.env.local my-app/.env.example
git status --short --ignored
node <lightweight Vercel/Supabase timing script>
node_modules/next/dist/bin/next start -p 3103  # offline DB simulation
node_modules/next/dist/bin/next start -p 3104  # local API timing
```
