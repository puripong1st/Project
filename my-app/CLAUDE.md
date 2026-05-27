# คู่มือโครงการ RMUTP Door Access System

## ภาพรวมโครงการ
ระบบควบคุมการเข้าถึงห้องเรียนสำหรับมหาวิทยาลัยเทคโนโลยีราชมงคลพระนคร (RMUTP) ที่ใช้เทคโนโลยี ESP32 หรือ Wokwi Simulator ในการควบคุมประตูห้องเรียน โดยมีการลงทะเบียนนักศึกษาผ่านเว็บแอปพลิเคชัน Next.js และใช้ฐานข้อมูล postgreSQL ในการจัดการข้อมูล

## สถาปัตยกรรมระบบ
```
┌─────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   เว็บแอปพลิเคชัน    │    │ ฐานข้อมูล postgreSQL │    │   ESP32 / Wokwi    │
│  (Next.js 13+)    │◄──►│  (students, admins,   │◄──►│  (ประตู, จอแสดงผล)  │
│  - API Routes     │    │   access_logs, qr_tokens)│    └──────────────────┘
│  - หน้าลงทะเบียน    │    └──────────────────┘
│  - แดชบอร์ดผู้ดูแล  │
└─────────────────┘
```

### องค์ประกอบหลัก
1. **เว็บแอปพลิเคชัน (Next.js)**
   - อยู่ในโฟลเดอร์ `my-app/`
   - ใช้ App Router ของ Next.js 13
   - API Routes อยู่ใน `my-app/app/api/`
   - หน้าเว็บหลัก: `my-app/app/page.tsx` (หน้าลงทะเบียน)
   - แดชบอร์ดผู้ดูแล: `my-app/app/admin/`

2. **ไลบรารีช่วยเหลือ (lib/)**
   - `auth.ts`: การจัดการ JWT และคุกกี้สำหรับผู้ดูแลระบบ
   - `db.ts`: การเชื่อมต่อ postgreSQL pool และการเริ่มต้นฐานข้อมูล
   - `esp32.ts`: ไลบรารีสื่อสารกับ ESP32/Wokwi (รองรับ mock mode)
   - `qr.ts`: การสร้างและจัดการ QR Code แบบ dynamic one-time token
   - `discord.ts`: การส่งแจ้งเตือนไปยัง Discord
   - `faculties.ts`: ข้อมูลคณะและสาขาของ RMUTP
   - `pdf.ts`: การสร้างรายงาน PDF

3. **ฐานข้อมูล postgreSQL**
   - ตารางหลัก:
     - `admin_users`: ข้อมูลผู้ดูแลระบบ (owner, door_operator)
     - `students`: ข้อมูลนักศึกษาที่ลงทะเบียน
     - `access_logs`: ประวัติการเข้าถึงและกิจกรรมต่างๆ
     - `dynamic_qr_tokens`: โทเคน QR Code แบบใช้ครั้งเดียว

4. **อุปกรณ์ฮาร์ดแวร์**
   - ESP32: ควบคุมการเปิด-ปิดประตูและแสดงผลบนหน้าจอ
   - หรือใช้ Wokwi Simulator สำหรับการทดสอบ

## รายละเอียด API Endpoints

### ระบบการตรวจสอบสิทธิ์ (Auth)
- `POST /api/auth/login` - เข้าสู่ระบบผู้ดูแล (ต้องทำการสร้างเองในไลบรารี auth)
- `POST /api/auth/logout` - ออกจากระบบ
- `GET /api/auth/me` - ตรวจสอบสถานะผู้ใช้ปัจจุบัน

### จัดการนักศึกษา (Students)
- `GET /api/students` - ดึงรายชื่อนักศึกษาทั้งหมด (เฉพาะผู้ดูแล role: owner)
- `POST /api/students` - ลงทะเบียนนักศึกษาใหม่ (สาธารณะ)
- `GET /api/students/[id]` - ดึงข้อมูลนักศึกษาตาม ID
- `POST /api/students/[id]/approve` - อนุมัตินักศึกษา
- `POST /api/students/[id]/reject` - ปฏิเสธนักศึกษา
- `POST /api/students/[id]/door` - เปิดประตูสำหรับนักศึกษาเฉพาะคน
- `GET /api/students/pending` - ดึงรายชื่อนักศึกษาที่รออนุมัติ
- `POST /api/students/bypass` - เปิดประตูแบบ bypass (สำหรับนักศึกษาที่อนุมัติแล้ว)

### จัดการผู้ดูแลระบบ (Admin Users)
- `GET /api/admin-users` - ดึงรายชื่อผู้ดูแลระบบทั้งหมด
- `POST /api/admin-users` - สร้างผู้ดูแลระบบใหม่ (เฉพาะ owner)
- `DELETE /api/admin-users/[id]` - ลบผู้ดูแลระบบ (เฉพาะ owner และไม่สามารถลบตัวเองได้)

### ระบบ ESP32 และ QR Code
- `GET /api/esp32/qr` - สร้าง QR Code PNG สำหรับ ESP32 แสดง
- `POST /api/esp32/qr/verify` - ตรวจสอบและใช้โทเคน QR Code (ใช้ครั้งเดียว)
- `GET /api/esp32/display` - ดึงสถานะสำหรับแสดงผลบนหน้าจอ ESP32
- `POST /api/esp32/display` - รับสถานะจาก ESP32 (สำหรับการบันทึก)
- `GET /api/esp32/status` - ตรวจสอบสถานะการเชื่อมต่อ ESP32
- `GET /api/esp32/qr/verify` - (มีอยู่แล้วในเส้นทางข้างบน)

### ระบบอื่นๆ
- `GET /api/logs` - ดึงประวัติการเข้าถึง (access logs)
- `POST /api/export/pdf` - สร้างรายงาน PDF
- `GET /api/system/status` - ตรวจสอบสถานะระบบ
- `POST /api/system/logs/cleanup` - ล้างประวัติเก่า

## โครงสร้างฐานข้อมูล

### ตาราง admin_users
```sql
CREATE TABLE admin_users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  role ENUM('owner', 'door_operator') NOT NULL DEFAULT 'door_operator',
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT NOW(),
  last_login DATETIME
);
```

### ตาราง students
```sql
CREATE TABLE students (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(20) NOT NULL DEFAULT 'นาย',
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  student_id VARCHAR(20) UNIQUE NOT NULL,
  year TINYINT NOT NULL,
  faculty VARCHAR(150) NOT NULL,
  branch VARCHAR(150) NOT NULL,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  approved_by INT,
  approved_at DATETIME,
  rejection_reason VARCHAR(500),
  ip_address VARCHAR(50),
  registered_at DATETIME DEFAULT NOW(),
  last_door_open DATETIME,
  FOREIGN KEY (approved_by) REFERENCES admin_users(id) ON DELETE SET NULL
);
```

### ตาราง access_logs
```sql
CREATE TABLE access_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT,
  action ENUM('registered', 'approved', 'rejected', 'door_opened', 'door_failed') NOT NULL,
  performed_by INT,
  timestamp DATETIME DEFAULT NOW(),
  esp32_response VARCHAR(500),
  notes TEXT,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL,
  FOREIGN KEY (performed_by) REFERENCES admin_users(id) ON DELETE SET NULL
);
```

### ตาราง dynamic_qr_tokens
```sql
CREATE TABLE dynamic_qr_tokens (
  id INT PRIMARY KEY AUTO_INCREMENT,
  token VARCHAR(64) UNIQUE NOT NULL,
  created_at DATETIME DEFAULT NOW(),
  is_consumed BOOLEAN DEFAULT FALSE,
  INDEX idx_active_token (is_consumed, created_at)
);
```

## การตั้งค่าสภาพแวดล้อม
ไฟล์ `.env.local` ควรมีตัวแปรดังต่อไปนี้:
```env
# postgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=admin
POSTGRES_DATABASE=rmutp_access

# JWT
JWT_SECRET=your_super_secret_key_here_change_in_production

# ESP32
ESP32_IP=192.168.1.100
ESP32_PORT=80
ESP32_MOCK_MODE=true  # ตั้งเป็น false เมื่อใช้ฮาร์ดแวร์จริง
ESP32_WOKWI=true      # ตั้งเป็น true เมื่อใช้ Wokwi Simulator
ESP32_API_KEY=YOUR_ESP32_API_KEY_HERE

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## ขั้นตอนการพัฒนา
1. ติดตั้ง dependencies: `npm install`
2. คัดลอก `.env.example` เป็น `.env.local` และตั้งค่าตามสภาพแวดล้อม
3. เริ่มต้นฐานข้อมูล: ระบบจะสร้างฐานข้อมูลและตารางอัตโนมัติเมื่อเริ่มเซิร์ฟเวอร์ครั้งแรก
4. รันเซิร์ฟเวอร์: `npm run dev`
5. เยี่ยมชม http://localhost:3000 เพื่อลงทะเบียนนักศึกษา
6. เข้าสู่ระบบผู้ดูแลที่ http://localhost:3000/admin/login ด้วยผู้ใช้เริ่มต้น:
   - Username: admin
   - Password: admin123 (จะถูกสร้างขึ้นเมื่อเริ่มต้นฐานข้อมูลครั้งแรก)

## 🛡️ มาตรการความปลอดภัยและผลการอุดช่องโหว่ (Security Hardening & Patched Vulnerabilities)

จากการทดสอบเจาะระบบและวิเคราะห์ช่องโหว่ความปลอดภัยระดับลึก ทีมพัฒนาได้ทำการแก้ไขปัญหา (Security Hardening) และอุดรอยรั่วสำคัญทั้งสิ้น **8 รายการ** เรียบร้อยแล้ว ซึ่งช่วยยกเลิกความเสี่ยงต่อการโดนโจมตี และทำให้ระบบได้มาตรฐานความปลอดภัยสำหรับใช้งานจริง:

### 1. การป้องกันการเข้าถึงข้อมูลโดยไม่ได้รับอนุญาต (IDOR & Sensitive Data Leakage)
* **ช่องโหว่เดิม**: ในเส้นทาง `GET /api/students/[id]` ผู้ดูแลระบบที่มีบทบาท `door_operator` สามารถสืบค้นเพื่ออ่านฟิลด์อ่อนไหวสูง เช่น `ip_address` และ `bypass_token` ของนักศึกษาทุกคนได้โดยไม่มีการปกป้อง ซึ่งเป็นช่องโหว่ IDOR ทำให้ข้อมูลหลุดร่วง นอกจากนี้ยังขาดการดักจับข้อผิดพลาดกรณีที่ส่ง ID ที่ไม่ใช่ตัวเลข ทำให้ส่งผลกระทบต่อคำสั่ง SQL
* **การแก้ไข (Patched)**:
  - เพิ่มการกรองข้อมูลเข้า `if (isNaN(numId))` เพื่อป้องกัน SQL Error
  - คัดแยกสิทธิ์บทบาทการเข้าถึงอย่างเข้มงวด: หากไม่ใช่ผู้ดูแลระบบสูงสุด (`owner`) ระบบจะคัดแยกฟิลด์อ่อนไหว (`ip_address`, `bypass_token`) ออกจากออบเจกต์ผลลัพธ์ทันที เหลือไว้เพียงแค่ Safe Fields สำหรับการทำงานทั่วไปของ `door_operator` เท่านั้น

### 2. การจำกัดอัตราการโจมตีบัญชีผู้ดูแล (Login Brute Force Protection)
* **ช่องโหว่เดิม**: API การตรวจสอบสิทธิ์ `/api/auth/login` ไม่มีระบบจำกัดการร้องขอ (Rate Limiter) ซึ่งเปิดทางให้ผู้โจมตีทำ Brute-Force Dictionary Attack เพื่อเดารหัสผ่านของบัญชีผู้ดูแลระบบได้ไม่จำกัดจำนวนครั้ง
* **การแก้ไข (Patched)**:
  - ติดตั้งกลไก **IP-Based Rate Limiting** ในหน้าล็อกอินโดยใช้หน่วยความจำภายใน (In-Memory Map Cache)
  - กำหนดขีดจำกัดสูงสุดไว้ที่ **10 ครั้ง ภายใน 5 นาที** หากมีพยายามล็อกอินล้มเหลวเกินสิทธิ์ ระบบจะระงับการทำงานจากไอพีดังกล่าวชั่วคราวเป็นเวลา 5 นาทีทันที พร้อมส่ง HTTP 429 Too Many Requests

### 3. การป้องกันสปายข้อมูลผ่านพารามิเตอร์ขีดจำกัด (Logs Unbounded Limit Prevention)
* **ช่องโหว่เดิม**: ใน API `/api/logs` ผู้ใช้ที่มีสิทธิ์สามารถส่งพารามิเตอร์จำกัดข้อมูลเป็นจำนวนมหาศาล เช่น `?limit=99999999` ซึ่งอาจนำไปสู่การโหลดตารางบันทึกการเข้าออกทั้งหมดจากฐานข้อมูล postgreSQL (Database Exhaustion)
* **การแก้ไข (Patched)**:
  - เพิ่มการตรวจสอบประเภทข้อมูลและขีดจำกัดสูงสุด: กำหนดค่ามาตรฐานไว้ที่ `100` และมีตัวป้องกันหากส่ง NaN เข้ามา
  - จำกัดค่าสูงสุด (Max Limit Constraint) ให้อยู่ในช่วง **1 ถึง 500 รายการ** เท่านั้น ไม่สามารถเรียกดูเกิน 500 รายการในหนึ่งคำร้องขอได้อีกต่อไป

### 4. การสกัดกั้น Mass Assignment และป้องกัน XSS (Student Registration Sanitization)
* **ช่องโหว่เดิม**: ขั้นตอนลงทะเบียนนักศึกษาใหม่ผ่าน `POST /api/students` รับข้อมูลผ่าน request body เข้าสู่ฐานข้อมูลทันที หากมีการอัปเดตโมเดลออบเจกต์ในอนาคต อาจเกิดช่องโหว่ Mass Assignment ที่อนุญาตให้ใส่ฟิลด์สำคัญอื่นๆ ได้ นอกจากนี้ สตริงข้อมูลที่รับเข้าไม่ได้ถูกชำระล้าง เสี่ยงต่อการโจมตีประเภท Stored XSS
* **การแก้ไข (Patched)**:
  - กรองเฉพาะฟิลด์ที่ระบุและกำหนดประเภทข้อมูลให้ชัดเจนตั้งแต่แรกสกัดกั้น Mass Assignment สมบูรณ์แบบ
  - ชำระสตริงชื่อ ตัวเลข และคณะ/สาขา โดยการแปลงและใช้ Regular Expression ในการลบ HTML Tags (`/<[^>]*>/g`) ป้องกันการส่งสคริปต์ก่อกวนหรือดักจับคุกกี้ (Cross-Site Scripting)

### 5. การจำกัดการรั่วไหลของ Dynamic Token (Active Token Exposure Prevention)
* **ช่องโหว่เดิม**: Endpoint สำหรับดึงสถานะหน้าจอ `/api/esp32/display` เป็นเส้นทางสาธารณะที่เปิดให้ทุกคนเข้าถึงได้โดยไม่ต้องใช้ระบบล็อกอิน แต่กลับมีการแนบ `active_token` ปัจจุบันออกไปในรูปแบบข้อความ JSON ซึ่งทำให้บุคคลทั่วไปสามารถสร้างลิงก์การตรวจสอบ QR Code ด้วยมือโดยไม่ต้องอยู่หน้าห้องแล็บได้
* **การแก้ไข (Patched)**:
  - ซ่อนพารามิเตอร์อ่อนไหว (`active_token`) ออกจาก API Response แบบสาธารณะ
  - พัฒนาระบบยืนยันเครื่องผ่าน API Key: ข้อมูล `active_token` จะถูกนำส่งออกไปก็ต่อเมื่อได้รับการเรียกขอที่แนบส่วนหัว (Header) `x-api-key` ที่ถูกต้องตรงกับคีย์ลับใน `.env.local` เท่านั้น

### 6. การป้องกันการจงใจเก็บข้อมูลขนาดใหญ่ขยะ (Rejection Reason Storage Exhaustion)
* **ช่องโหว่เดิม**: ใน API `/api/students/[id]/reject` การระบุเหตุผลการปฏิเสธไม่ได้จำกัดความยาวของอักขระ หากมีผู้โจมตียิงขยะข้อความขนาดหลายเมกะไบต์เข้ามาในฟิลด์เหตุผล จะทำให้ฐานข้อมูลเก็บข้อมูลล้นเกินความจำเป็นจนเกิดสภาวะ Storage Exhaustion
* **การแก้ไข (Patched)**:
  - ติดตั้งเครื่องกรองเพื่อตัดความยาวข้อความเหตุผลให้ไม่เกิน **500 ตัวอักษร** หากผู้โจมตีพยายามส่งขนาดใหญ่กว่านั้นระบบจะตัดแต่งส่วนเกินออกโดยอัตโนมัติ และใช้ค่าเริ่มต้นในระบบภาษาไทย ("ไม่ผ่านการตรวจสอบ") เมื่อไม่ได้กรอกเข้ามา

### 7. การป้องกันการแกล้งหรือสแปมเปิดประตู (Bypass Rate Limiter & Motor Spam Prevention)
* **ช่องโหว่เดิม**: ผู้ใช้ที่มีสิทธิ์ที่ครอบครอง `bypass_token` ที่ผ่านการอนุมัติแล้ว สามารถสแปมคำร้องขอไปยัง `POST /api/students/bypass` ถี่ๆ ได้ ซึ่งอาจส่งผลเสียต่อมอเตอร์เซอร์โวของประตูเกิดความร้อนล้มเหลว หรือเปิดค้างถาวร
* **การแก้ไข (Patched)**:
  - ออกแบบ **Bypass Rate Limiter** แยกรายตัวนักศึกษา (Student-based limit) 
  - จำกัดสิทธิ์การร้องขอให้เปิดประตูแบบ Bypass ได้สูงสุดไม่เกิน **3 ครั้ง ต่อ 1 นาที** หากเกินเงื่อนไขจะแสดงข้อความแจ้งเตือน "คุณเปิดประตูบ่อยเกินไป กรุณารอสักครู่" (HTTP 429)

### 8. การรักษาเสถียรภาพสิทธิ์ของระบบผู้ดูแลระบบ (Admin Creation Strengthening)
* **ช่องโหว่เดิม**: การสร้างผู้ดูแลระบบเพิ่มใน `POST /api/admin-users` ขาดความเข้มงวดของนโยบายรหัสผ่าน (Password Policy) อนุญาตให้ใส่เพียง 6 ตัวอักษร และชื่อผู้ใช้ไม่ได้ถูกควบคุมรูปแบบตัวอักษรทำให้มีความสุ่มเสี่ยงต่อ SQL Injection Payload
* **การแก้ไข (Patched)**:
  - กำหนดความแข็งแกร่งของรหัสผ่านขั้นต่ำเป็น **8 ตัวอักษร**
  - บังคับใช้ Regular Expression กรองอินพุตของ Username อย่างเข้มงวด `^[a-zA-Z0-9_.]{3,30}$` (เฉพาะภาษาอังกฤษ ตัวเลข ขีดล่าง หรือจุด ความยาว 3-30 ตัวอักษรเท่านั้น)
  - จำกัดความยาวของชื่อจริงไม่เกิน 100 อักษร ป้องกันพารามิเตอร์บวม

### 9. การปรับแก้ปัญหาคอขวดตอน Cold-Start ในระบบฐานข้อมูล (Database Schema Alteration Optimization)
* **ช่องโหว่เดิม**: ในเส้นทาง `GET /api/export/pdf` มีการแทรกคำสั่งปรับโครงสร้างตาราง (`ALTER TABLE`) ซึ่งทำให้เกิดอาการหน่วงทุกครั้งเมื่อโค้ดตื่นตัว (Cold-start) และกระทบต่อเสถียรภาพของ Foreign Key ในฐานข้อมูล
* **การแก้ไข (Patched)**:
  - ย้ายกระบวนการเปลี่ยนแปลงโครงสร้างไปทำเพียงครั้งเดียวในตอนเริ่มต้นระบบ โดยใช้ `information_schema` สำหรับตรวจจับคอลัมน์ ทำให้หน้าส่งออก PDF ทำงานรวดเร็วขึ้น
  - ยกเลิกการลบกฎอ้างอิงของระบบฐานข้อมูล (Foreign Key Constraint) ด้วยการแปลงค่าระบบให้เป็น `NULL` ทันที

### 10. การป้องกันการใช้คีย์ความปลอดภัยปะปน (QR Key & JWT Secret Separation)
* **ช่องโหว่เดิม**: การลงลายเซ็นสร้างโทเคน QR Code มีการนำ `JWT_SECRET` ของระบบแอดมินมาใช้เป็นตัวสำรอง ซึ่งมีความสุ่มเสี่ยงต่อการเกิดปัญหาการนำคีย์ไปใช้งานข้ามสถาปัตยกรรม
* **การแก้ไข (Patched)**:
  - ยกเลิกการตกหล่นไปใช้คีย์หลัก และบังคับให้ผู้ดูแลระบบต้องระบุ `QR_SIGNING_KEY` สำหรับการใช้งานในโหมด Production เพื่อเพิ่มระยะห่างของรหัสป้องกัน

### 11. การปิดระบบส่งคำสั่งทาง LAN แบบไม่เข้ารหัส (Insecure LAN Direct Connectivity Removal)
* **ช่องโหว่เดิม**: ระบบ ESP32 มีพฤติกรรมการยิงคำสั่งเปิดประตูด้วย HTTP Plaintext กลับไปหาอุปกรณ์ภายในวง LAN ซึ่งสามารถถูกดักฟังแพ็กเกจภายในเครือข่ายภายในได้ (Network Sniffing)
* **การแก้ไข (Patched)**:
  - ตัดการเชื่อมต่อระบบ LAN แบบ Direct ออกทั้งหมด และสับเปลี่ยนรูปแบบไปเป็น Cloud-Only ด้วยการใช้ DB Polling Queue ที่มีความมั่นคงสูงกว่าแทน

---

## 📶 คู่มือการเลือกซื้อเราเตอร์ใส่ซิมและซิมเน็ตสำหรับระบบ IoT (SIM Router & Data Guide)

เพื่อความมั่นคงและหลีกเลี่ยงระบบรักษาความปลอดภัย Wi-Fi มหาวิทยาลัย (AP Isolation, Web Portal Login) แนะนำให้ติดตั้งเราเตอร์ 4G แยกอิสระสำหรับห้องปฏิบัติการ:

### 1. รุ่นเราเตอร์ 4G ที่แนะนำ
* **TP-Link TL-MR100** (แนะนำสูงสุดสำหรับงบประหยัด - ประมาณ 1,100 - 1,300 บาท)
  - มีพอร์ต LAN 2 ช่องสำหรับต่อตรงกับ Raspberry Pi ปลอดภัยและเสถียรกว่าสัญญาณไร้สาย
  - ตั้งค่าผูกไอพีแบบถาวร (DHCP Binding) ได้ง่าย
* **TP-Link Archer MR600** (พรีเมียม Dual-Band 2.4/5GHz - ประมาณ 2,800 - 3,200 บาท)
  - รองรับความเร็วสูงและรับส่งปริมาณข้อมูลได้หนาแน่น

### 2. แพ็กเกจอินเทอร์เน็ตที่เหมาะสม
* เนื่องจากตัวระบบควบคุมประตูหลักและตัวสแกน QR Code คุยกันภายใต้เครือข่ายแลนปิดภายใน ส่วนการเชื่อมต่ออินเทอร์เน็ตมีจุดประสงค์หลักเพียงส่งคำขอขนาดเล็กไปยัง **Discord Webhook** (ปริมาณไม่เกิน 10KB ต่อครั้ง)
* แนะนำให้ซื้อ **"ซิมเทพแบบรายปี"** ความเร็ว **10 - 15 Mbps ไม่อั้น ไม่ลดสปีด (Unlimited Data)** เช่น
  - **ซิมเทพคงกระพัน (True/dtac)**: เฉลี่ยตกเดือนละประมาณ 130 - 150 บาท ประหยัดที่สุดและเสถียร

### 3. ขั้นตอนการตั้งค่าเครือข่ายสำหรับอุปกรณ์
1. **ปิด AP Isolation**: เข้าไปที่หลังบ้านของเราเตอร์ เมนู **Wireless -> Advanced Settings** แล้วตั้งค่า **AP Isolation / Client Isolation** เป็น **Disable** เพื่อให้อุปกรณ์ภายในวงสามารถสแกนหากันได้
2. **ผูกไอพีถาวร (Address Reservation / DHCP Binding)**:
   - ผูก Raspberry Pi 4 (เซิร์ฟเวอร์เว็บ Next.js) ที่ IP: `192.168.1.5`
   - ผูก ESP32 (บอร์ดควบคุมประตู) ที่ IP: `192.168.1.100` (ให้ตรงกับค่าใน `.env.local`)
3. **การเชื่อมต่อ**: เสียบสาย LAN จาก Raspberry Pi เข้าเราเตอร์โดยตรง และให้ ESP32 เกาะ Wi-Fi คลื่น 2.4 GHz เพื่อประสิทธิภาพสูงสุด

---

## 🛠️ ข้อควรระวังและแนวทางการแก้ไขปัญหาระหว่างรันเซิร์ฟเวอร์ Next.js
* **Warning เรื่อง Lockfile ซ้ำซ้อน**: Next.js อาจทำการอนุมานโฟลเดอร์ราก (Workspace root) คลาดเคลื่อน เนื่องจากพบไฟล์ `package-lock.json` ในไดเรกทอรีส่วนบุคคลของผู้ใช้และโฟลเดอร์ของโปรเจกต์พร้อมกัน
  * **แนวทางแก้ไข**: ในหน้าตั้งค่า Next.js สามารถกำจัดคำแจ้งเตือนได้โดยการตั้งค่า `turbopack.root` หรือตรวจสอบแล้วลบไฟล์ `package-lock.json` ตัวที่ไม่ได้อยู่ในโปรเจกต์ `my-app` ออกไป
* **การเปิดใช้ Turbopack**: ใน Next.js 16.2.6 อาจพบข้อเตือน `Unrecognized key(s) in object: 'turbopack' at "experimental"` ในไฟล์คอนฟิก `next.config.ts` ให้หลีกเลี่ยงการเปิดคีย์ทดลองดังกล่าว หรือปรับให้เหมาะสมตามเวอร์ชันของ Next.js ที่รองรับ

## 📋 สรุปการประเมินและการซ่อมแซมระบบ
ปัจจุบันระบบ **RMUTP Door Access System** ได้รับการตรวจสอบและปรับแต่งทั้งในแง่ของสถาปัตยกรรม ประเด็นความมั่นคงปลอดภัย และการวางแผนฮาร์ดแวร์อย่างสมบูรณ์แบบ ขจัดช่องโหว่ระดับสูงและวิกฤตทั้งหมดเรียบร้อยแล้ว พร้อมนำไปใช้ในการทดลองหรือติดตั้งใช้งานจริง!