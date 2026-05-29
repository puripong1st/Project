"use client";

export const getConfigCode = (roomCode: string, origin: string, mode: "wokwi" | "physical" = "physical") => {
  const wifiBlock = mode === "wokwi"
    ? `const char *ssid     = "Wokwi-GUEST";
const char *password = "";`
    : `const char *ssid     = "YOUR_WIFI_SSID";      // ← แก้เป็นชื่อ Wi-Fi จริง
const char *password = "YOUR_WIFI_PASSWORD"; // ← แก้เป็นรหัส Wi-Fi จริง`;

  const certBlock = mode === "wokwi"
    ? `// Wokwi Simulator — ไม่ต้องใช้ CA Certificate (setInsecure() ถูกใช้แทน)
// สำหรับบอร์ดจริงให้เปลี่ยนโหมดเป็น Physical ESP32 เพื่อดู CA Cert`
    : `// --- TLS Security: Root CA Certificate ---
// ⚠️  Wokwi builds (#define WOKWI_SIM) skip this and use setInsecure() instead.
// Production: replace with full ISRG Root X1 PEM from https://letsencrypt.org/certs/isrgrootx1.pem
const char *root_ca_cert =
"-----BEGIN CERTIFICATE-----\\n"
"MIIFazCCA1OgAwIBAgIRAIIRxZ96RhG2Hae8TZtOGMEwDQYJKoZIhvcNAQELBQAw\\n"
"TzELMAkGA1UEBhMCVVMxKTAnBgNVBAoTIEludGVybmV0IFNlY3VyaXR5IFJlc2Vh\\n"
"cmNoIEdyb3VwMRUwEwYDVQQDEwxJU1JHIFJvb3QgWDEwHhcNMTUwNjA0MTEwNDM4\\n"
"WhcNMzUwNjA0MTEwNDM4WjBPMQswCQYDVQQGEwJVUzEpMCcGA1UEChMgSW50ZXJu\\n"
"ZXQgU2VjdXJpdHkgUmVzZWFyY2ggR3JvdXAxFTATBgNVBAMTDElTUkcgUm9vdCBY\\n"
"MTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCCAgoCggIBAK3oJHP0FDfzmHwXyEFD\\n"
"aVY+5gE2Dux6ClJHdEEXJKmcfcPChBkuv3Gz/kOHegC6MyTPd50rtW71mMR6ZkvF\\n"
"m5yOYyFL9PJA65geg8gCyRFyat6J4Rg8L3AzoU3dZCPqy8gKKHWMVfuxgpJEnt4f\\n"
"mCjOt21KKOAQCFAJUsT18H3OPC9CDH5SM5KC9CTWgrOB8Uo18m1751g6M6Wd095M\\n"
"O44692GUP8xQG07xEQ2g5K31LCT79kXyNdc29F2574cVH6k8xmMAlvJMm5mOKMJp\\n"
"sX1d8Yc/CJsxYtxnD+LJDlzUWD+MnP+xO8N1jYNL8mHiHqAm7k5jJMgTDH//fjv\\n"
"oE04k3X6xQ5gYMBW4JN5+9GHRopz7NXaqimD9g2qy0n3Ri3d0ZPPgLKFbCXVpOoX\\n"
"1RQ0PAvEkQqYSqBEqGhNFGFUAKxBNAiSl7VPvb5gqxUhTbNDsGJvXhOaOTlIMFqX\\n"
"aVlUy+I2nXlBxwv8JW7Iqjlq4GRdTmfCgBKNbTJ7Bz7j5MXiSJOXsMx1FxnTNw8\\n"
"A8S/UNKUj6AZVdClZl0XOjDwVOXkJrFEiUiYYOeBQAqI/gT3UNJeFsEkw8HwJq5u\\n"
"QhHJBX4P4jGVJtEnOmFxTL67KGAiZxCmXjUHOMONVWnolWaBDPLbLZLCVIVnVqyN\\n"
"AgMBAAGjQjBAMA4GA1UdDwEB/wQEAwIBBjAPBgNVHRMBAf8EBTADAQH/MB0GA1Ud\\n"
"DgQWBBR5tFnme7bl5AFzgAiIyBpY9umbbjANBgkqhkiG9w0BAQsFAAOCAgEAVR9Y\\n"
"qbyyqFDQDLHYGmkgJykIyrJzA/kRMG5m0GSCAB6g9LHb0O5+MIFJRbK3MCnZWXy2\\n"
"tA/yTX/yW/3c+h6I2WvHVq+IjTRy5xqmV5i8LI5z4I+JG+uBCuoaF8wONOlCVBi\\n"
"DPbL8h7xuvx3L0NNFm0R/F4t7fMl5rC8NHrgmUQg1B9bZL6D6O/4W/fPCdxL6bvC\\n"
"pTFJjbzB3WH3R0oq9bM3lFKR7mN9Jmvur1S5jMKp1TNkEOy6XP+/TYH5T+WH5J5W\\n"
"P3m4TbSH3yXSqBJ7FNdG3fNrC7Vy26bCf7sBfWPkWbxj8HHV3rH5Z9bv/ZZxXGv\\n"
"LgZuiGqkJgwF7tZVMN9X6stREq2cSfSfFCXiEFKbWECuq/FKw3nI2wT+yBMNqxaB\\n"
"SdUNRN3D3/fToX7WvXQ7OqJzI6MWFQ/x7mBPW5ub9l3DjjECVETzgamRMeibNWCI\\n"
"Jv1EaNLCq1M+HVriNBMBzIJ43Y07IFo7zqt/2MwAXQBoCQh0O8yECNovWmwSfn+m\\n"
"hLtN2stCoJGQDqXXKLJRO3NJGF8QFLAk37LoxLSl+G7kQ5DXMv55XUaH0PPGT4Zs\\n"
"7k2UrX/bIIv7ZCGSm16QHFY9TxlXhTbBJGh/Q0hm7KyM1GRr2Cv5PomXS3P2Bz+r\\n"
"VV+7FvKYzv5hRMiWjK6TBJLR7SqiGcDOF2cFvCJFxrJfzMhD1qU=\\n"
"-----END CERTIFICATE-----\\n";`;

  return `/*
  ========================================================================
  SmartAccess Door Access Controller - Configuration for ESP32
  ห้องปฏิบัติการเรียนการสอน: Classroom \${roomCode}
  โหมด: \${mode === "wokwi" ? "Wokwi Simulator" : "Physical ESP32 Board"}
  ========================================================================
*/

#ifndef CONFIG_H
#define CONFIG_H

// --- WiFi Configuration ---
\${wifiBlock}

// --- IoT Cloud Server Configuration ---
const char *server_url = "\${origin}/api/esp32/display?room=\${roomCode}";
const char *room_code  = "\${roomCode}";

// --- Security Provisioning: Shared Pre-shared API Key ---
// ⚠️ IMPORTANT: ใส่ค่าจาก ESP32_API_KEY ใน Vercel Environment Variables
// ห้ามนำ key จริงขึ้น version control
const char *api_key = "YOUR_UNIQUE_ESP32_API_KEY_HERE";

\${certBlock}

#endif // CONFIG_H`;
};

export const getArduinoCode = (roomCode: string, origin: string, mode: "wokwi" | "physical" = "physical") => {
  const wokwiDefine = mode === "wokwi"
    ? `#define WOKWI_SIM  // Wokwi Simulator mode — NEVER deploy to production with this defined!
// 💡 สำหรับจำลองบน Wokwi Web อย่าลืมสร้างแท็บ libraries.txt และระบุ:
// Adafruit GFX Library
// Adafruit ILI9341
// ArduinoJson@6.21.3
// ElegantOTA@2.2.9
// QRCode`
    : `// #define WOKWI_SIM  // Uncomment ONLY when running in Wokwi Simulator — NEVER in production!`;
  return `/*
  ==============================================================
  SmartAccess Door Access Controller - Firmware for ESP32
  ห้องปฏิบัติการเรียนการสอน: Classroom \${roomCode}
  โหมด: \${mode === "wokwi" ? "Wokwi Simulator" : "Physical ESP32 Board"}
  ระบบรองรับการรันผ่านคลาวด์ Vercel (HTTPS WiFiClientSecure)
  ==============================================================
*/
\${wokwiDefine}
#define DEBUG_MODE false  // ⚠️ Set true for development ONLY

#if DEBUG_MODE
  #define DBG(x) Serial.println(x)
  #define DBGF(fmt, ...) Serial.printf(fmt, __VA_ARGS__)
#else
  #define DBG(x)
  #define DBGF(fmt, ...)
#endif

#include "ricmoo_qrcode.h"
#include <Adafruit_GFX.h>
#include <Adafruit_ILI9341.h>
#include <ArduinoJson.h> // ติดตั้งผ่าน Library Manager (เวอร์ชัน 6.x)
#include <FS.h>
#include <HTTPClient.h>
#ifndef WOKWI_SIM
#include <HTTPUpdate.h> // สำหรับระบบดึงข้อมูลอัปเดต HTTPS OTA
#include <WebServer.h> // สำหรับระบบบริการเว็บอัปเดตระยะใกล้ LAN OTA
#include <ElegantOTA.h> // สำหรับบริการ ElegantOTA เว็บเซิร์ฟเวอร์บอร์ด
#endif
#include <SPI.h>
#include <SPIFFS.h>
#include <WiFi.h>
#include <WiFiClientSecure.h> // สำหรับรัน HTTPS บนระบบคลาวด์ Vercel
#include <mbedtls/md.h>
#include <time.h> // สำหรับ NTP time sync (ใช้ใน HMAC timestamp)

#include "config.h"

// เวอร์ชันซอฟต์แวร์ปัจจุบันของบอร์ด
const char* CURRENT_VERSION = "1.0.0";
const char* FIRMWARE_URL = "https://project-sigma-ivory-21.vercel.app/api/esp32/firmware-ota";

#ifndef WOKWI_SIM
WebServer localServer(80); // พอร์ตเว็บเซิร์ฟเวอร์สำหรับคิวและ ElegantOTA
bool localServerStarted = false;
#endif


// ─── Compile-time production safety guard ───────────────────────────────────
// Prevents accidentally shipping a Wokwi simulation build to a real device.
#ifdef PRODUCTION
  #ifdef WOKWI_SIM
    #error "WOKWI_SIM must not be defined in production builds!"
  #endif
#endif
// ────────────────────────────────────────────────────────────────────────────

// --- การต่อขาอุปกรณ์ (Hardware Pins) ---
#define TFT_CS 15
#define TFT_RST 4
#define TFT_DC 2
#define RELAY_PIN 12  // รีเลย์ประตู (GPIO 12)
#define LED_WIFI 14   // WiFi Status LED (GPIO 14)
#define LED_REJECT 26 // Reject LED (GPIO 26)
#define BUZZER_PIN 27 // Buzzer (GPIO 27)

Adafruit_ILI9341 tft = Adafruit_ILI9341(TFT_CS, TFT_DC, TFT_RST);

// ─── Adaptive Polling ────────────────────────────────────────────────────────
// เร่งความเร็ว polling เมื่อตรวจพบกิจกรรม ชะลอลงเมื่อ idle ประหยัด API call
const unsigned long POLL_FAST   = 200;   // ms — มีคำสั่งรอ / เพิ่งปลดล็อก
const unsigned long POLL_NORMAL = 1000;  // ms — ทำงานปกติ
const unsigned long POLL_SLOW   = 5000;  // ms — idle ต่อเนื่อง 5 รอบ
unsigned long currentPollDelay  = POLL_NORMAL;
int idleCycles = 0; // นับรอบที่ไม่มีกิจกรรม
String lastEtag = ""; // ETag จาก server สำหรับ 304 check

// ─── TFT Dirty-region tracking ───────────────────────────────────────────────
// เก็บค่าเดิม — วาดเฉพาะส่วนที่เปลี่ยน ไม่ fillScreen ทั้งหน้าทุกรอบ
int last_queue_count = -1;
String last_approved_name = "";
String last_active_token = "";
String last_server_time = "";
String last_status_text = "";
String ip_address_str = "0.0.0.0";

// ฟังก์ชันสำหรับสร้างและวาดภาพ QR Code แท้ๆ ที่สแกนได้ด้วยโทรศัพท์มือถือ 100%!
void drawQRCode(String qrText, int startX, int startY, int boxSize) {
  QRCode qrcode;

  // ใช้ QR Code Version 7 (45x45 modules) รองรับ URL ยาวสูงสุด 154 ตัวอักษร
  int qrVersion = 7;
  if (qrText.length() > 154) {
    qrVersion = 9; // ถ้าข้อความยาวมากเป็นพิเศษ ให้สลับเป็น Version 9 (53x53 modules)
  }

  uint8_t qrcodeData[qrcode_getBufferSize(qrVersion)];
  qrcode_initText(&qrcode, qrcodeData, qrVersion, ECC_LOW, qrText.c_str());

  // ขยายพิกเซลบล็อก (Scale) ให้ใหญ่พอที่จะใช้โทรศัพท์สแกนได้คมชัด
  int scale = 2;
  int qrRealSize = qrcode.size * scale;

  // คำนวณขอบขาว (Quiet Zone) ให้อยู่กึ่งกลางกล่องเฟรมพอดี
  int paddingX = (boxSize - qrRealSize) / 2;
  int paddingY = (boxSize - qrRealSize) / 2;

  // วาดพื้นหลังสีขาวบริสุทธิ์
  tft.fillRect(startX, startY, boxSize, boxSize, ILI9341_WHITE);

  // วาดโมดูลจุดสีดำของรหัส QR
  for (uint8_t y = 0; y < qrcode.size; y++) {
    for (uint8_t x = 0; x < qrcode.size; x++) {
      if (qrcode_getModule(&qrcode, x, y)) {
        tft.fillRect(startX + paddingX + (x * scale),
                     startY + paddingY + (y * scale), scale, scale,
                     ILI9341_BLACK);
      }
    }
  }
}

// 1. หน้าจอหลักโหมดสแตนด์บาย (Idle Mode) — ดีไซน์พรีเมียมถอดแบบมาจาก Next.js
// esp32-preview
void drawMainScreen(int queueCount, String lastApprovedName, String timeStr,
                    String qrText) {
  // พื้นหลังสีน้ำเงินดำหรูหรา #06070D
  tft.fillScreen(tft.color565(6, 7, 13));

  // --- ส่วนหัว (Top Status Bar) #0E111C ---
  tft.fillRect(0, 0, 320, 20, tft.color565(14, 17, 28));
  tft.drawFastHLine(0, 20, 320, tft.color565(40, 40, 50)); // เส้นใต้เมนู

  tft.setTextSize(1);
  tft.setTextColor(tft.color565(226, 232, 240)); // สีตัวอักษรขาวสว่าง #E2E8F0
  tft.setCursor(8, 6);
  tft.print("SmartAccess DOOR ACCESS  ");

  // ปุ่มตราสัญลักษณ์ ACTIVE สีเขียวมะนาว
  tft.setTextColor(tft.color565(16, 185, 129)); // #10B981
  tft.print("ACTIVE");

  // นาฬิกาดิจิทัลเรียลไทม์ฝั่งขวา
  tft.setCursor(265, 6);
  tft.print(timeStr);

  // --- กล่องแสดงผล QR Code สแกนผ่านทางด้านซ้าย ---
  // วาดเฟรมกรอบโค้งสองชั้นสีกระจกเขียวเรืองแสงแบบ Glassmorphism
  tft.drawRoundRect(10, 32, 120, 120, 6, tft.color565(16, 185, 129));
  tft.drawRoundRect(11, 33, 118, 118, 5, tft.color565(16, 185, 129));

  // แสดงผลภาพคีย์ QR Code ที่สแกนได้จริง
  if (qrText.length() > 0) {
    drawQRCode(qrText, 13, 35, 114);
  } else {
    // หากข้อมูลยังโหลดไม่เสร็จสิ้น
    tft.fillRect(13, 35, 114, 114, ILI9341_WHITE);
    tft.setTextColor(ILI9341_BLACK);
    tft.setCursor(40, 85);
    tft.print("Loading QR...");
  }

  // คำแนะนำภาษาอังกฤษสีเหลืองทองเรืองแสง
  tft.setTextColor(tft.color565(255, 215, 0)); // #FFD700
  tft.setCursor(24, 162);
  tft.print("SCAN FOR ACCESS");

  // --- การ์ดฝั่งขวา: รายละเอียดห้องและคิวผู้ขออนุมัติ ---
  tft.setTextSize(1);
  tft.setTextColor(tft.color565(240, 244, 240)); // สีขาวงาช้าง #F0F4F0
  tft.setCursor(145, 36);
  tft.print("ROOM: ");
  tft.print(room_code);

  tft.setTextColor(tft.color565(59, 130, 246)); // สีฟ้าพรีเมียม #3B82F6
  tft.setCursor(145, 48);
  tft.print("LAB DOOR CONTROLLER");

  // การ์ดแสดงคิวสีเหลืองเหล้าองุ่น PENDING REQUESTS
  tft.fillRoundRect(145, 65, 165, 50, 6, tft.color565(24, 16, 1));
  tft.drawRoundRect(145, 65, 165, 50, 6,
                    tft.color565(245, 158, 11)); // ขอบสีส้มเหลือง

  tft.setTextColor(tft.color565(245, 158, 11));
  tft.setCursor(153, 75);
  tft.print("PENDING REQUESTS");
  tft.setTextColor(tft.color565(156, 163, 175)); // สีเทา
  tft.setCursor(153, 90);
  tft.print("QUEUE COUNTER");

  // ตัวเลขคิวใหญ่พิเศษขนาด 3 เท่า
  tft.setTextSize(3);
  tft.setTextColor(tft.color565(245, 158, 11));
  tft.setCursor(275, 78);
  tft.print(queueCount);

  // การ์ดผู้ได้รับการอนุมัติล่าสุด LATEST APPROVED
  tft.setTextSize(1);
  if (lastApprovedName.length() > 0) {
    tft.fillRoundRect(145, 125, 165, 45, 6,
                      tft.color565(1, 18, 12)); // แถบพื้นหลังเขียวเข้ม
    tft.drawRoundRect(145, 125, 165, 45, 6,
                      tft.color565(16, 185, 129)); // ขอบเขียวสว่าง

    tft.setTextColor(tft.color565(16, 185, 129));
    tft.setCursor(153, 133);
    tft.print("LATEST APPROVED");

    tft.setTextColor(ILI9341_WHITE);
    tft.setCursor(153, 148);
    tft.print("ID: " + lastApprovedName);
  } else {
    // กรอบประวัติว่างกรณีไม่มีข้อมูล
    tft.drawRoundRect(145, 125, 165, 45, 6, tft.color565(60, 70, 60));
    tft.setTextColor(tft.color565(107, 122, 112));
    tft.setCursor(160, 143);
    tft.print("NO RECENT ACCESS");
  }

  // --- แถบข้อมูลด้านล่างสุด (Bottom Status Bar) #0A0B10 ---
  tft.fillRect(0, 220, 320, 20, tft.color565(10, 11, 16));
  tft.drawFastHLine(0, 220, 320, tft.color565(30, 30, 40));

  tft.setTextSize(1);
  tft.setTextColor(tft.color565(107, 122, 112));
  tft.setCursor(8, 226);
  tft.print("SmartAccess Faculty of Education");

  // แสดงค่าหมายเลขไอพีแอดเดรสของอุปกรณ์
  tft.setTextColor(tft.color565(16, 185, 129));
  tft.setCursor(240, 226);
  tft.print(ip_address_str);
}

// 2. หน้าจอกำลังตรวจสอบข้อมูล (Scanning/Processing Mode)
void drawScanningScreen() {
  tft.fillScreen(tft.color565(3, 8, 15)); // สีน้ำเงินมหาสมุทรเข้ม #03080F

  // วงแหวนเรืองแสงสีฟ้าจำลองตัวอ่านกำลังประมวลผล
  tft.drawCircle(160, 70, 30, tft.color565(59, 130, 246));
  tft.drawCircle(160, 70, 31, tft.color565(59, 130, 246));
  tft.fillCircle(160, 70, 8, tft.color565(59, 130, 246));

  tft.setTextSize(3);
  tft.setTextColor(tft.color565(59, 130, 246)); // #3B82F6
  tft.setCursor(45, 125);
  tft.print("PROCESSING...");

  tft.setTextSize(1);
  tft.setTextColor(ILI9341_WHITE);
  tft.setCursor(75, 165);
  tft.print("VERIFYING REQUEST WITH SERVER");

  tft.setTextColor(tft.color565(107, 122, 112));
  tft.setCursor(85, 185);
  tft.print("SECURE CLOUD ACCESS VALIDATION");
}

// 3. หน้าจอปลดล็อกผ่านสำเร็จ (Access Granted Mode) — สีเขียวสะท้อนแสงหรูหราดีไซน์พรีเมียม
void drawUnlockedScreen(String approvedName, String studentId) {
  tft.fillScreen(tft.color565(3, 12, 5)); // สีเขียวเข้มสไตล์ฟอเรสต์ #030C05

  // วงกลมไฟสีเขียวสลักตราถูก
  tft.fillCircle(160, 65, 32, tft.color565(6, 78, 59));    // กรอบใน
  tft.drawCircle(160, 65, 32, tft.color565(16, 185, 129)); // เส้นขอบสีเขียวเรืองแสง
  tft.drawCircle(160, 65, 33, tft.color565(16, 185, 129));

  // เครื่องหมาย ถูก (v)
  tft.setTextColor(ILI9341_WHITE);
  tft.setTextSize(3);
  tft.setCursor(151, 55);
  tft.print("v");

  tft.setTextSize(3);
  tft.setTextColor(tft.color565(16, 185, 129));
  tft.setCursor(35, 115);
  tft.print("ACCESS GRANTED");

  tft.setTextSize(1);
  tft.setTextColor(tft.color565(255, 215, 0));
  tft.setCursor(65, 148);
  tft.print("DOOR UNLOCKED (ACCESSING)...");

  // ตลับแคปซูลสำหรับครอบชื่อผู้เข้าใช้ห้องปฏิบัติการ
  tft.fillRoundRect(30, 168, 260, 26, 13, tft.color565(30, 30, 40));
  tft.drawRoundRect(30, 168, 260, 26, 13, tft.color565(50, 50, 60));
  tft.setTextColor(ILI9341_WHITE);
  tft.setTextSize(1);

  // แสดงผลสถานะผู้เข้าใช้เป็นภาษาอังกฤษพรีเมียมแทนการแสดงชื่อภาษาไทยเพื่อเลี่ยงฟอนต์ต่างดาว
  String statusMsg = "VERIFIED MEMBER";
  int nameX = 160 - (statusMsg.length() * 3);
  tft.setCursor(nameX, 177);
  tft.print(statusMsg);

  // รหัสประจำตัวของนักศึกษา
  tft.setTextColor(tft.color565(156, 163, 175));
  int idX = 160 - (studentId.length() * 3);
  if (idX < 35)
    idX = 35;
  tft.setCursor(idX, 202);
  tft.print(studentId);
}

// 4. หน้าจอสำหรับกรณีระบบไม่อนุมัติ (Access Denied Mode) — แดงเรืองแสง
void drawRejectedScreen() {
  tft.fillScreen(tft.color565(15, 3, 3)); // สีแดงเข้มมืด #0F0303

  // วงแหวนแดงสลัก X
  tft.fillCircle(160, 65, 32, tft.color565(127, 29, 29));
  tft.drawCircle(160, 65, 32, tft.color565(239, 68, 68));
  tft.drawCircle(160, 65, 33, tft.color565(239, 68, 68));

  tft.setTextColor(ILI9341_WHITE);
  tft.setTextSize(3);
  tft.setCursor(151, 55);
  tft.print("X");

  tft.setTextSize(3);
  tft.setTextColor(tft.color565(239, 68, 68));
  tft.setCursor(45, 115);
  tft.print("ACCESS DENIED");

  tft.setTextSize(1);
  tft.setTextColor(tft.color565(255, 199, 199));
  tft.setCursor(85, 148);
  tft.print("REJECTED ACCESS ATTEMPT");

  tft.setTextColor(tft.color565(156, 163, 175));
  tft.setCursor(55, 180);
  tft.print("PLEASE CONTACT CLASSROOM INSTRUCTOR");
}

// ─── Persistent TLS Connection (HTTP Keep-alive) ─────────────────────────────
// ประกาศนอก loop() เพื่อให้ reuse TLS session ข้ามรอบ poll → ลด TLS handshake
#ifndef WOKWI_SIM
WiFiClientSecure persistentTlsClient;
bool tlsClientInitialized = false;
#endif

// ─── Offline Mode Configurations & Helper Functions (Prompt 18) ─────────────
bool is_offline_mode = false;
int api_fail_count = 0;
unsigned long last_student_sync = 0;
unsigned long last_log_sync = 0;
const unsigned long SYNC_STUDENTS_INTERVAL = 300000; // 5 minutes
const unsigned long SYNC_LOGS_INTERVAL = 60000;     // 1 minute

String cached_qr_key = "";
const char* cache_students_file = "/student_cache.json";
const char* cache_logs_file = "/offline_logs.json";
const char* cache_key_file = "/qr_key.bin";

// Forward declarations
bool validateOfflineQR(String grant);
void triggerDoorOpenOffline(String grant);
void saveOfflineLog(String student_id);
void syncStudentCache();
void syncOfflineLogs();

#ifndef WOKWI_SIM
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

// ─── OTA Progress Bar บน TFT ─────────────────────────────────────────────────
void onOTAProgress(int current, int total) {
  if (total <= 0) return;
  int pct = (current * 100) / total;
  int barW = (pct * 280) / 100;
  // Progress bar background
  tft.drawRect(20, 130, 280, 16, ILI9341_WHITE);
  tft.fillRect(21, 131, barW, 14, tft.color565(124, 58, 237));
  // เคลียร์ + วาดตัวเลข %
  tft.fillRect(20, 155, 160, 16, ILI9341_BLACK);
  tft.setTextColor(ILI9341_WHITE);
  tft.setTextSize(1);
  tft.setCursor(20, 155);
  tft.print(pct);
  tft.print("% (");
  tft.print(current / 1024);
  tft.print(" / ");
  tft.print(total / 1024);
  tft.println(" KB)");
}

void performHTTPSOTA() {
  WiFiClientSecure secureClient;
  secureClient.setInsecure();

  tft.fillScreen(ILI9341_BLACK);
  tft.setTextColor(ILI9341_YELLOW);
  tft.setTextSize(2);
  tft.setCursor(10, 30);
  tft.println("SMARTACCESS OTA");
  tft.drawFastHLine(10, 60, 300, tft.color565(124, 58, 237));
  tft.setCursor(10, 80);
  tft.setTextColor(ILI9341_WHITE);
  tft.setTextSize(1);
  tft.println("Connecting to update server...");
  tft.setCursor(10, 100);
  tft.println("Please wait, do not power off.");

  httpUpdate.rebootOnUpdate(true);
  httpUpdate.addHeader("x-esp32-version", CURRENT_VERSION);
  httpUpdate.addHeader("Authorization", "Bearer SUPER_SECURE_ESP32_ACCESS_TOKEN");
  // แนบ callback แสดง progress bar
  httpUpdate.onProgress(onOTAProgress);

  tft.fillRect(10, 80, 300, 20, ILI9341_BLACK);
  tft.setCursor(10, 80);
  tft.setTextColor(ILI9341_WHITE);
  tft.setTextSize(1);
  tft.println("Downloading firmware...");

  t_httpUpdate_return ret = httpUpdate.update(secureClient, FIRMWARE_URL);
  if (ret == HTTP_UPDATE_FAILED) {
    tft.fillScreen(ILI9341_BLACK);
    tft.setTextColor(ILI9341_RED);
    tft.setTextSize(2);
    tft.setCursor(10, 40);
    tft.println("OTA FAILED");
    tft.setTextSize(1);
    tft.setCursor(10, 80);
    tft.setTextColor(ILI9341_WHITE);
    tft.print("Error: ");
    tft.println(httpUpdate.getLastErrorString());
    delay(5000);
  }
}
#endif // !WOKWI_SIM

void startLocalServer() {
#ifndef WOKWI_SIM
  if (!localServerStarted) {
    // กำหนด ElegantOTA Web Endpoint & Callbacks
    ElegantOTA.begin(&localServer);
    ElegantOTA.onStart(onOTAStart);
    ElegantOTA.onEnd(onOTAEnd);

    localServer.begin();
    localServerStarted = true;
    DBG("Local web server started on port 80 with ElegantOTA.");
  }
#endif
}

String base64Decode(String input) {
  input.replace("-", "+");
  input.replace("_", "/");
  while (input.length() % 4) {
    input += "=";
  }
  int len = input.length();
  uint8_t* out = (uint8_t*)malloc(len);
  int decoded_len = 0;
  const char* lookup = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  int bits = 0;
  int val = 0;
  for (int i = 0; i < len; i++) {
    char c = input[i];
    if (c == '=') break;
    const char* p = strchr(lookup, c);
    if (!p) continue;
    int idx = p - lookup;
    val = (val << 6) | idx;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out[decoded_len++] = (val >> bits) & 0xFF;
    }
  }
  String res = "";
  for (int i = 0; i < decoded_len; i++) {
    res += (char)out[i];
  }
  free(out);
  return res;
}

// Hex-encoded HMAC-SHA256 — ตรงกับ Node.js crypto.createHmac('sha256', key).digest('hex')
// ใช้สำหรับ x-hmac-signature header ที่ server ตรวจสอบ
String generateHMACHex(String payload, String key) {
  uint8_t hmacResult[32];
  mbedtls_md_context_t ctx;
  mbedtls_md_init(&ctx);
  mbedtls_md_setup(&ctx, mbedtls_md_info_from_type(MBEDTLS_MD_SHA256), 1);
  mbedtls_md_hmac_starts(&ctx, (const unsigned char *)key.c_str(), key.length());
  mbedtls_md_hmac_update(&ctx, (const unsigned char *)payload.c_str(), payload.length());
  mbedtls_md_hmac_finish(&ctx, hmacResult);
  mbedtls_md_free(&ctx);
  char hexBuf[65];
  for (int i = 0; i < 32; i++) {
    sprintf(hexBuf + i * 2, "%02x", hmacResult[i]);
  }
  hexBuf[64] = '\\0';
  return String(hexBuf);
}

// Base64url-encoded HMAC-SHA256 (ใช้สำหรับ offline grant validation)
String generateHMAC(String payload, String key) {
  uint8_t hmacResult[32];
  mbedtls_md_context_t ctx;
  mbedtls_md_type_t md_type = MBEDTLS_MD_SHA256;
  mbedtls_md_init(&ctx);
  mbedtls_md_setup(&ctx, mbedtls_md_info_from_type(md_type), 1);
  mbedtls_md_hmac_starts(&ctx, (const unsigned char*)key.c_str(), key.length());
  mbedtls_md_hmac_update(&ctx, (const unsigned char*)payload.c_str(), payload.length());
  mbedtls_md_hmac_finish(&ctx, hmacResult);
  mbedtls_md_free(&ctx);

  String encoded = "";
  const char* lookup = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  int bits = 0;
  int val = 0;
  for (int i = 0; i < 32; i++) {
    val = (val << 8) | hmacResult[i];
    bits += 8;
    while (bits >= 6) {
      bits -= 6;
      encoded += lookup[(val >> bits) & 0x3F];
    }
  }
  if (bits > 0) {
    encoded += lookup[(val << (6 - bits)) & 0x3F];
  }
  return encoded;
}

bool validateOfflineQR(String grant) {
  if (cached_qr_key == "") {
    DBG("No cached QR signing key. Cannot validate offline.");
    return false;
  }
  int dotIdx = grant.indexOf(".");
  if (dotIdx == -1) return false;
  
  String encodedPayload = grant.substring(0, dotIdx);
  String signature = grant.substring(dotIdx + 1);
  
  String expectedSignature = generateHMAC(encodedPayload, cached_qr_key);
  if (!secureCompare(signature.c_str(), expectedSignature.c_str())) {
    DBG("Offline signature verification failed!");
    return false;
  }
  
  String decoded = base64Decode(encodedPayload);
  StaticJsonDocument<384> doc;
  DeserializationError err = deserializeJson(doc, decoded);
  if (err) {
    DBG("Failed to parse decoded payload JSON!");
    return false;
  }
  
  const char* room = doc["room"];
  const char* student_id = doc["student_id"];
  
  if (String(room) != String(room_code)) {
    DBG("Room mismatch in offline grant!");
    return false;
  }
  
  if (!SPIFFS.exists(cache_students_file)) {
    DBG("No student cache JSON file exists!");
    return false;
  }
  
  File f = SPIFFS.open(cache_students_file, "r");
  if (!f) return false;
  
  StaticJsonDocument<2048> cacheDoc;
  DeserializationError cacheErr = deserializeJson(cacheDoc, f);
  f.close();
  if (cacheErr) {
    DBG("Failed to parse student cache JSON file!");
    return false;
  }
  
  JsonArray arr = cacheDoc.as<JsonArray>();
  bool found = false;
  for (JsonVariant v : arr) {
    if (v.as<String>() == String(student_id)) {
      found = true;
      break;
    }
  }
  if (!found) {
    DBG("Student ID not found in local offline cache!");
    return false;
  }
  DBG("Offline QR validation successful!");
  return true;
}

void saveOfflineLog(String student_id) {
  StaticJsonDocument<1536> logDoc;
  if (SPIFFS.exists(cache_logs_file)) {
    File f = SPIFFS.open(cache_logs_file, "r");
    if (f) {
      deserializeJson(logDoc, f);
      f.close();
    }
  }
  JsonArray logs;
  if (logDoc.containsKey("logs")) {
    logs = logDoc["logs"].as<JsonArray>();
  } else {
    logs = logDoc.to<JsonArray>();
  }
  if (logs.size() >= 50) {
    logs.remove(0);
  }
  JsonObject newLog = logs.createNestedObject();
  newLog["student_id"] = student_id;
  newLog["action"] = "door_opened_offline";
  newLog["timestamp"] = millis() / 1000;
  File f = SPIFFS.open(cache_logs_file, "w");
  if (f) {
    serializeJson(logDoc, f);
    f.close();
    DBG("Saved offline access log to SPIFFS.");
  }
}

void triggerDoorOpenOffline(String grant) {
  int dotIdx = grant.indexOf(".");
  String encodedPayload = grant.substring(0, dotIdx);
  String decoded = base64Decode(encodedPayload);
  StaticJsonDocument<256> doc;
  deserializeJson(doc, decoded);
  String student_id = doc["student_id"].as<String>();
  
  saveOfflineLog(student_id);
  
  Serial.println("[INFO] Door unlocked");
  DBG("🔓 OFFLINE ACCESS GRANTED! Opening door...");
  
  drawScanningScreen();
  tone(BUZZER_PIN, 1500, 100);
  delay(1200);
  
  drawUnlockedScreen("OFFLINE MEMBER", student_id);
  digitalWrite(RELAY_PIN, HIGH);
  
  tone(BUZZER_PIN, 1000, 150);
  delay(180);
  tone(BUZZER_PIN, 1500, 150);
  delay(180);
  tone(BUZZER_PIN, 2000, 300);
  
  int countdownMs = 3800;
  int stepSize = 320 / 38;
  for (int i = 0; i < 38; i++) {
    tft.fillRect(0, 236, 320 - (i * stepSize), 4, tft.color565(16, 185, 129));
    tft.fillRect(320 - (i * stepSize), 236, stepSize, 4, tft.color565(6, 78, 59));
    delay(100);
  }
  digitalWrite(RELAY_PIN, LOW);
  Serial.println("[INFO] Door locked");
  DBG("🔒 Door auto locked (Offline).");
  tone(BUZZER_PIN, 800, 250);
  
  last_queue_count = -1;
  last_approved_name = "FORCE_REDRAW";
  last_active_token = "FORCE_REDRAW";
}

#ifndef WOKWI_SIM
void handleLocalValidation() {
  WiFiClient client = localServer.available();
  if (!client) return;
  DBG("New client connected to local offline validation server.");
  unsigned long timeout = millis() + 2000;
  String req = "";
  while (client.connected() && millis() < timeout) {
    if (client.available()) {
      char c = client.read();
      req += c;
      if (req.endsWith("\\r\\n\\r\\n")) break;
    }
  }
  if (req.indexOf("POST /door/open") != -1) {
    // ─── [Real-Time HTTP Push opening from Next.js (Online Mode)] ───
    client.println("HTTP/1.1 200 OK");
    client.println("Content-Type: application/json; charset=utf-8");
    client.println("Connection: close");
    client.println();
    client.println("{\\"success\\":true}");
    client.stop();

    // Extract studentId from request body if present
    String studentId = "";
    int bodyIdx = req.indexOf("\\r\\n\\r\\n");
    if (bodyIdx != -1) {
      String body = req.substring(bodyIdx + 4);
      int sIdIdx = body.indexOf("\\"studentId\\"");
      if (sIdIdx != -1) {
        int colonIdx = body.indexOf(":", sIdIdx);
        if (colonIdx != -1) {
          int quoteStart = body.indexOf("\\"", colonIdx);
          if (quoteStart != -1) {
            int quoteEnd = body.indexOf("\\"", quoteStart + 1);
            if (quoteEnd != -1) {
              studentId = body.substring(quoteStart + 1, quoteEnd);
            }
          }
        }
      }
    }

    Serial.println("[INFO] Real-time Door unlocked via HTTP Push");
    DBG("🔓 REAL-TIME ACCESS GRANTED! Opening door...");

    drawScanningScreen();
    tone(BUZZER_PIN, 1500, 100);
    delay(1200);

    drawUnlockedScreen("VERIFIED MEMBER", studentId != "" ? studentId : "ONLINE STUDENT");
    digitalWrite(RELAY_PIN, HIGH);

    tone(BUZZER_PIN, 1000, 150);
    delay(180);
    tone(BUZZER_PIN, 1500, 150);
    delay(180);
    tone(BUZZER_PIN, 2000, 300);

    int stepSize = 320 / 38;
    for (int i = 0; i < 38; i++) {
      tft.fillRect(0, 236, 320 - (i * stepSize), 4, tft.color565(16, 185, 129));
      tft.fillRect(320 - (i * stepSize), 236, stepSize, 4, tft.color565(6, 78, 59));
      delay(100);
    }
    digitalWrite(RELAY_PIN, LOW);
    Serial.println("[INFO] Door locked");
    DBG("🔒 Door auto locked (Real-time).");
    tone(BUZZER_PIN, 800, 250);

    last_queue_count = -1;
    last_approved_name = "FORCE_REDRAW";
    last_active_token = "FORCE_REDRAW";
    return;
  }

  if (req.indexOf("POST /unlock") != -1 || req.indexOf("GET /unlock") != -1) {
    int grantIdx = req.indexOf("grant=");
    if (grantIdx != -1) {
      int endIdx = req.indexOf(" ", grantIdx);
      if (endIdx == -1) endIdx = req.indexOf("\\r", grantIdx);
      String grant = req.substring(grantIdx + 6, endIdx);
      grant.replace("%2E", ".");
      grant.replace("%2D", "-");
      grant.replace("%5F", "_");
      
      bool valid = validateOfflineQR(grant);
      if (valid) {
        client.println("HTTP/1.1 200 OK");
        client.println("Content-Type: text/plain; charset=utf-8");
        client.println("Connection: close");
        client.println();
        client.println("ACCESS GRANTED");
        triggerDoorOpenOffline(grant);
      } else {
        client.println("HTTP/1.1 403 Forbidden");
        client.println("Content-Type: text/plain; charset=utf-8");
        client.println("Connection: close");
        client.println();
        client.println("ACCESS DENIED");
      }
    }
  } else {
    client.println("HTTP/1.1 200 OK");
    client.println("Content-Type: text/html; charset=utf-8");
    client.println("Connection: close");
    client.println();
    client.println("<!DOCTYPE html><html><head><meta charset='utf-8'><title>SmartAccess Offline Mode</title></head>");
    client.println("<body style='font-family:sans-serif; text-align:center; padding:50px;'>");
    client.println("<h1 style='color:#F59E0B;'>⚠️ OFFLINE MODE ACTIVE</h1>");
    client.println("<p>ระบบอยู่ในโหมดออฟไลน์ (อินเทอร์เน็ตขัดข้อง)</p>");
    client.println("<p>กรุณาสแกนคีย์ QR โค้ดปลดล็อกของท่านเพื่อยืนยันสิทธิ์กับบอร์ดโดยตรง</p>");
    client.println("</body></html>");
  }
  delay(1);
  client.stop();
}
#endif // !WOKWI_SIM


void syncStudentCache() {
  if (WiFi.status() != WL_CONNECTED) return;
  HTTPClient http;
  String syncUrl = String(server_url) + "&sync=1";
  static WiFiClientSecure secureClient;
  WiFiClientSecure *client = &secureClient;
  client->setInsecure();
  http.begin(*client, syncUrl);
  http.addHeader("x-api-key", api_key);
  int httpCode = http.GET();
  if (httpCode == 200) {
    String payload = http.getString();
    StaticJsonDocument<2048> doc;
    DeserializationError error = deserializeJson(doc, payload);
    if (!error) {
      if (doc.containsKey("qr_key")) {
        const char* key = doc["qr_key"];
        cached_qr_key = String(key);
        File f = SPIFFS.open(cache_key_file, "w");
        if (f) {
          f.print(cached_qr_key);
          f.close();
          DBG("Synced and saved QR signing key.");
        }
      }
      if (doc.containsKey("students")) {
        File f = SPIFFS.open(cache_students_file, "w");
        if (f) {
          serializeJson(doc["students"], f);
          f.close();
          DBG("Synced and saved approved student list to SPIFFS.");
        }
      }
    }
  }
  http.end();
}

void syncOfflineLogs() {
  if (WiFi.status() != WL_CONNECTED) return;
  if (!SPIFFS.exists(cache_logs_file)) return;
  File f = SPIFFS.open(cache_logs_file, "r");
  if (!f) return;
  String content = f.readString();
  f.close();
  HTTPClient http;
  String logUrl = String(server_url);
  logUrl.replace("display", "logs/sync");
  static WiFiClientSecure secureClient;
  WiFiClientSecure *client = &secureClient;
  client->setInsecure();
  http.begin(*client, logUrl);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("x-api-key", api_key);
  int httpCode = http.POST(content);
  if (httpCode == 200 || httpCode == 201) {
    SPIFFS.remove(cache_logs_file);
    DBG("Successfully synchronized and cleared offline access logs.");
  }
  http.end();
}

void setup() {
  Serial.begin(115200);
  Serial.println("[BOOT] System starting...");

  // Initialize SPIFFS cache storage
  if (!SPIFFS.begin(true)) {
    Serial.println("[ERROR] SPIFFS mount failed!");
  } else {
    Serial.println("[INFO] SPIFFS mounted successfully.");
    if (SPIFFS.exists(cache_key_file)) {
      File f = SPIFFS.open(cache_key_file, "r");
      if (f) {
        cached_qr_key = f.readString();
        f.close();
        DBG("Loaded cached QR signing key from SPIFFS.");
      }
    }
  }

  // Pin modes
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(LED_WIFI, OUTPUT);
  pinMode(LED_REJECT, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);

  digitalWrite(RELAY_PIN, LOW); // Default locked
  digitalWrite(LED_WIFI, LOW);
  digitalWrite(LED_REJECT, LOW);

  tft.begin();
  tft.setRotation(1); // Landscape

  tft.fillScreen(tft.color565(6, 7, 13));
  tft.fillRect(0, 0, 320, 45, tft.color565(14, 17, 28));
  tft.drawRect(0, 45, 320, 2, tft.color565(16, 185, 129));

  tft.setTextColor(ILI9341_WHITE);
  tft.setTextSize(2);
  tft.setCursor(20, 12);
  tft.print("SmartAccess DOOR ACCESS");

  tft.setTextSize(2);
  tft.setTextColor(tft.color565(59, 130, 246));
  tft.setCursor(40, 100);
  tft.print("CONNECTING WIFI...");

  tft.setTextSize(1);
  tft.setTextColor(tft.color565(156, 163, 175));
  tft.setCursor(40, 140);
  tft.print("SSID Virtual Router: Wokwi-GUEST");

  DBG("Connecting to Wi-Fi...");
  WiFi.begin(ssid, password);

  bool wifi_led_state = false;
  while (WiFi.status() != WL_CONNECTED) {
    wifi_led_state = !wifi_led_state;
    digitalWrite(LED_WIFI, wifi_led_state ? HIGH : LOW);
    delay(400);
    DBG(".");
  }

  digitalWrite(LED_WIFI, HIGH);
  DBG("\\nWiFi connected successfully!");

  // UTC+7 (Bangkok ICT) — offset 7*3600 = 25200
  configTime(25200, 0, "pool.ntp.org", "time.cloudflare.com");
  {
    int ntp_wait = 0;
    while (time(nullptr) < 1000000000UL && ntp_wait < 50) {
      delay(100);
      ntp_wait++;
    }
  }
  Serial.println("[INFO] NTP synced: " + String((long)time(nullptr)));

  ip_address_str = WiFi.localIP().toString();

  tone(BUZZER_PIN, 1200, 150);
  delay(180);
  tone(BUZZER_PIN, 1600, 250);

#ifndef WOKWI_SIM
  startLocalServer();
#endif

  drawMainScreen(0, "", "12:00:00", "");
}

void loop() {
#ifndef WOKWI_SIM
  handleLocalValidation();
#endif
  
#ifndef WOKWI_SIM
  ElegantOTA.loop();
#endif

  if (is_offline_mode) {
    bool hasCache = SPIFFS.exists(cache_students_file);
    if (hasCache) {
      static unsigned long lastBlink = 0;
      static bool ledState = false;
      if (millis() - lastBlink > 1000) {
        lastBlink = millis();
        ledState = !ledState;
        digitalWrite(LED_WIFI, ledState ? HIGH : LOW);
        digitalWrite(LED_REJECT, LOW);
      }

      unsigned long sec = millis() / 1000;
      unsigned long hh = (sec / 3600) % 24;
      unsigned long mm = (sec / 60) % 60;
      unsigned long ss = sec % 60;
      char timeBuf[10];
      snprintf(timeBuf, sizeof(timeBuf), "%02d:%02d:%02d", (int)hh, (int)mm, (int)ss);

      static unsigned long lastScreenUpdate = 0;
      if (millis() - lastScreenUpdate > 5000) {
        lastScreenUpdate = millis();
        drawMainScreen(0, "OFFLINE CACHE ACTIVE", String(timeBuf), "");
      }
    } else {
      digitalWrite(LED_WIFI, LOW);
      digitalWrite(LED_REJECT, HIGH);

      static unsigned long lastScreenUpdate = 0;
      if (millis() - lastScreenUpdate > 5000) {
        lastScreenUpdate = millis();
        tft.fillScreen(tft.color565(15, 3, 3));
        tft.setTextColor(tft.color565(239, 68, 68));
        tft.setTextSize(3);
        tft.setCursor(45, 80);
        tft.print("OFFLINE MODE");
        tft.setTextSize(2);
        tft.setTextColor(ILI9341_WHITE);
        tft.setCursor(55, 130);
        tft.print("NO CACHED DATA");
      }
    }
  }

  static unsigned long lastPollTime = 0;
  if (WiFi.status() == WL_CONNECTED && !is_offline_mode) {
    digitalWrite(LED_WIFI, HIGH);

    if (millis() - lastPollTime >= currentPollDelay) {
      lastPollTime = millis();

      String time_str = "12:00:00";
      unsigned long sec = millis() / 1000;
      unsigned long hh = (sec / 3600) % 24;
      unsigned long mm = (sec / 60) % 60;
      unsigned long ss = sec % 60;
      char timeBuf[10];
      snprintf(timeBuf, sizeof(timeBuf), "%02d:%02d:%02d", (int)hh, (int)mm, (int)ss);
      time_str = String(timeBuf);

      HTTPClient http;
      if (String(server_url).startsWith("https://")) {
#ifdef WOKWI_SIM
        static WiFiClientSecure simClient;
        simClient.setInsecure();
        http.begin(simClient, server_url);
#else
        if (!tlsClientInitialized) {
          persistentTlsClient.setCACert(root_ca_cert);
          tlsClientInitialized = true;
        }
        http.setReuse(true);
        http.begin(persistentTlsClient, server_url);
#endif
      } else {
        http.begin(server_url);
      }

      http.setTimeout(5000);
      http.addHeader("Content-Type", "application/json");
      http.addHeader("x-api-key", api_key);
      http.addHeader("x-esp32-version", CURRENT_VERSION);

      time_t nowTs = time(nullptr);
      String timestampStr = String((long)nowTs);
      String hmacPayload = timestampStr + ":/api/esp32/display";
      String signature = generateHMACHex(hmacPayload, String(api_key));
      http.addHeader("x-timestamp", timestampStr);
      http.addHeader("x-hmac-signature", signature);
      if (lastEtag.length() > 0) {
        http.addHeader("If-None-Match", lastEtag);
      }

      int httpCode = http.GET();

      if (httpCode == 304) {
        idleCycles++;
        if (idleCycles >= 5) {
          currentPollDelay = POLL_SLOW;
        }
        http.end();
        return;
      }

      if (httpCode == 200) {
        String newEtag = http.header("ETag");
        if (newEtag.length() > 0) {
          lastEtag = newEtag;
        }
        api_fail_count = 0;
        is_offline_mode = false;
        if (millis() - last_student_sync > SYNC_STUDENTS_INTERVAL) {
          last_student_sync = millis();
          syncStudentCache();
        }
        if (millis() - last_log_sync > SYNC_LOGS_INTERVAL) {
          last_log_sync = millis();
          syncOfflineLogs();
        }
        String payload = http.getString();
        StaticJsonDocument<768> doc;
        DeserializationError error = deserializeJson(doc, payload);

        if (!error) {
          bool update_available = doc["update_available"] | false;
          if (update_available) {
            Serial.println("[OTA] New version found! Starting OTA...");
            http.end();
#ifndef WOKWI_SIM
            performHTTPSOTA();
#endif
            return;
          }

          const char *door_trigger = doc["door_trigger"];
          int pending_count = doc["pending_count"];
          const char *server_time_text = doc["server_time_text"];
          if (server_time_text && strlen(server_time_text) >= 8) {
            time_str = String(server_time_text).substring(0, 8);
          }

          String approvedName = "";
          String studentId = "";
          if (doc.containsKey("last_approved") && !doc["last_approved"].isNull()) {
            approvedName = doc["last_approved"]["name"].as<String>();
            studentId = doc["last_approved"]["student_id"].as<String>();
          }

          const char *active_token = doc["active_token"];
          const char *register_url = doc["register_url"];
          const char *requested_room = doc["requested_room"];

          String qrText = "";
          if (active_token && register_url && requested_room) {
            String regUrl = String(register_url);
            int idx = regUrl.indexOf("/?room=");
            String baseUrl = "";
            if (idx != -1) {
              baseUrl = regUrl.substring(0, idx);
            } else {
              baseUrl = "https://project-sigma-ivory-21.vercel.app";
            }
            qrText = baseUrl + "/?scan=" + String(active_token) + "&room=" + String(requested_room);
          }

          DBGF("Door command: %s | Queue: %d\\n", door_trigger ? door_trigger : "NULL", pending_count);

          if (String(door_trigger) == "open") {
            idleCycles = 0;
            currentPollDelay = POLL_FAST;
          } else if (pending_count != last_queue_count || studentId != last_approved_name || (active_token && String(active_token) != last_active_token)) {
            idleCycles = 0;
            currentPollDelay = POLL_NORMAL;
          } else {
            idleCycles++;
            if (idleCycles >= 5) currentPollDelay = POLL_SLOW;
          }

          if (String(door_trigger) == "open") {
            Serial.println("[INFO] Door unlocked");
            DBG("🔓 UNLOCK SIGNAL RECEIVED! Opening door...");

            drawScanningScreen();
            tone(BUZZER_PIN, 1500, 100);
            delay(300);

            drawUnlockedScreen(approvedName, studentId);
            digitalWrite(RELAY_PIN, HIGH);

            tone(BUZZER_PIN, 1000, 150);
            delay(180);
            tone(BUZZER_PIN, 1500, 150);
            delay(180);
            tone(BUZZER_PIN, 2000, 300);

            int stepSize = 320 / 38;
            for (int i = 0; i < 38; i++) {
              tft.fillRect(0, 236, 320 - (i * stepSize), 4, tft.color565(16, 185, 129));
              tft.fillRect(320 - (i * stepSize), 236, stepSize, 4, tft.color565(6, 78, 59));
              delay(100);
            }

            digitalWrite(RELAY_PIN, LOW);
            Serial.println("[INFO] Door locked");
            DBG("🔒 Door auto locked.");
            tone(BUZZER_PIN, 800, 250);

            last_queue_count = -1;
            last_approved_name = "FORCE_REDRAW";
            last_active_token = "FORCE_REDRAW";
          }
          else if (pending_count != last_queue_count || studentId != last_approved_name || (active_token && String(active_token) != last_active_token)) {
            last_queue_count = pending_count;
            last_approved_name = studentId;
            if (active_token)
              last_active_token = String(active_token);

            drawMainScreen(pending_count, studentId, time_str, qrText);
          } else {
            tft.setTextSize(1);
            tft.fillRect(265, 0, 55, 20, tft.color565(14, 17, 28));
            tft.setTextColor(tft.color565(16, 185, 129));
            tft.setCursor(265, 6);
            tft.print(time_str);
          }
        }
      } else {
        Serial.println("[ERROR] Connection failed");
        DBGF("HTTP Error: %d\\n", httpCode);
        api_fail_count++;
        if (api_fail_count >= 5) {
          if (!is_offline_mode) {
            is_offline_mode = true;
            DBG("Entering offline fallback mode.");
          }
        }
      }
      http.end();
    }
  } else if (WiFi.status() != WL_CONNECTED) {
    digitalWrite(LED_WIFI, LOW);
    delay(250);
    digitalWrite(LED_WIFI, HIGH);
    delay(250);
  }
}

bool secureCompare(const char* a, const char* b) {
  size_t lenA = strlen(a);
  size_t lenB = strlen(b);
  size_t len = (lenA > lenB) ? lenA : lenB;
  
  volatile uint8_t result = lenA ^ lenB;
  for (size_t i = 0; i < len; i++) {
    uint8_t ca = (i < lenA) ? a[i] : 0;
    uint8_t cb = (i < lenB) ? b[i] : 0;
    result |= ca ^ cb;
  }
  return result == 0;
}
`;
};
