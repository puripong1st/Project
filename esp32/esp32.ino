/*
  ==============================================================
  RMUTP Door Access Controller - Firmware for ESP32
  ห้องปฏิบัติการเรียนการสอน: Classroom CE-402
  ระบบรองรับการรันผ่านคลาวด์ Vercel (HTTPS WiFiClientSecure)
  ==============================================================
*/
#define WOKWI_SIM // <-- ต้องมีบรรทัดนี้อยู่บนสุดของโค้ดใน Wokwi
#include "ricmoo_qrcode.h"
#include <Adafruit_GFX.h>
#include <Adafruit_ILI9341.h>
#include <ArduinoJson.h> // ติดตั้งผ่าน Library Manager (เวอร์ชัน 6.x)
#include <HTTPClient.h>
#include <SPI.h>
#include <WiFi.h>
#include <WiFiClientSecure.h> // สำหรับรัน HTTPS บนระบบคลาวด์ Vercel

// Wokwi Simulator ใช้ WiFi เสมือน "Wokwi-GUEST" เท่านั้น (ไม่ใช้รหัสผ่าน)
const char *ssid = "Wokwi-GUEST";
const char *password = "";

// --- ตั้งค่าระบบเชื่อมโยง IoT Cloud ---
const char *server_url =
    "https://project-sigma-ivory-21.vercel.app/api/esp32/display?room=CE-402";
const char *api_key = "rmutp_secure_door_unlock_token_2026";
const char *room_code = "CE-402";

// --- การต่อขาอุปกรณ์ (Hardware Pins) ---
#define TFT_CS 15
#define TFT_RST 4
#define TFT_DC 2
#define RELAY_PIN 12  // รีเลย์ประตู (GPIO 12)
#define LED_WIFI 14   // WiFi Status LED (GPIO 14)
#define LED_REJECT 26 // Reject LED (GPIO 26)
#define BUZZER_PIN 27 // Buzzer (GPIO 27)

Adafruit_ILI9341 tft = Adafruit_ILI9341(TFT_CS, TFT_DC, TFT_RST);

const int polling_delay = 2000; // ความเร็วในการดึงคำสั่ง (2 วินาที)

// ตัวแปรเก็บสเตตัสเดิมเพื่อลดการวาดหน้าจอซ้ำซ้อน (ลดการกะพริบ)
int last_queue_count = -1;
String last_approved_name = "";
String last_active_token = "";
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
  tft.print("RMUTP DOOR ACCESS  ");

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
  tft.print("RMUTP Faculty of Education");

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

void setup() {
  Serial.begin(115200);

  // กำหนดรูปแบบอินพุตเอาต์พุตพิน
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(LED_WIFI, OUTPUT);
  pinMode(LED_REJECT, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);

  digitalWrite(RELAY_PIN, LOW); // ค่าดีฟอลต์ประตูล็อกเสมอ
  digitalWrite(LED_WIFI, LOW);
  digitalWrite(LED_REJECT, LOW);

  // สตาร์ตการทำงานหน้าจอ TFT LCD
  tft.begin();
  tft.setRotation(1); // แนวนอน (Landscape)

  // วาดหน้าจอกำลังล็อกอินเครือข่าย Wi-Fi
  tft.fillScreen(tft.color565(6, 7, 13));
  tft.fillRect(0, 0, 320, 45, tft.color565(14, 17, 28));
  tft.drawRect(0, 45, 320, 2, tft.color565(16, 185, 129));

  tft.setTextColor(ILI9341_WHITE);
  tft.setTextSize(2);
  tft.setCursor(20, 12);
  tft.print("RMUTP DOOR ACCESS");

  tft.setTextSize(2);
  tft.setTextColor(tft.color565(59, 130, 246));
  tft.setCursor(40, 100);
  tft.print("CONNECTING WIFI...");

  tft.setTextSize(1);
  tft.setTextColor(tft.color565(156, 163, 175));
  tft.setCursor(40, 140);
  tft.print("SSID Virtual Router: Wokwi-GUEST");

  Serial.print("Connecting to Wi-Fi...");
  WiFi.begin(ssid, password);

  // ระบบกะพริบไฟสถานะระหว่างรอ WiFi
  bool wifi_led_state = false;
  while (WiFi.status() != WL_CONNECTED) {
    wifi_led_state = !wifi_led_state;
    digitalWrite(LED_WIFI, wifi_led_state ? HIGH : LOW);
    delay(400);
    Serial.print(".");
  }

  digitalWrite(LED_WIFI, HIGH); // สว่างค้างเมื่อเชื่อมต่อได้แล้ว
  Serial.println("\nWiFi connected successfully!");

  // บันทึก IP แอดมินของบอร์ดสำหรับการนำไปแสดง
  ip_address_str = WiFi.localIP().toString();

  // เสียงดนตรีบูตระบบเสร็จสิ้นพร้อมใช้ (Sweet boot melody)
  tone(BUZZER_PIN, 1200, 150);
  delay(180);
  tone(BUZZER_PIN, 1600, 250);

  // วาดแผงหน้าจอหลักเริ่มต้น
  drawMainScreen(0, "", "12:00:00", "");
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    digitalWrite(LED_WIFI, HIGH);

    // ดึงเวลาปัจจุบันจำลอง
    String time_str = "12:00:00";
    // คำนวณเวลาแบบง่าย (ชั่วโมง:นาที:วินาที)
    unsigned long sec = millis() / 1000;
    unsigned long hh = (sec / 3600) % 24;
    unsigned long mm = (sec / 60) % 60;
    unsigned long ss = sec % 60;
    char timeBuf[10];
    sprintf(timeBuf, "%02d:%02d:%02d", (int)hh, (int)mm, (int)ss);
    time_str = String(timeBuf);

    HTTPClient http;
    if (String(server_url).startsWith("https://")) {
      WiFiClientSecure *client = new WiFiClientSecure;
      if (client) {
        client->setInsecure(); // ข้าม CA Cert เพื่อรับความรวดเร็วในการติดต่อเซิร์ฟเวอร์
        http.begin(*client, server_url);
      } else {
        Serial.println("Unable to create WiFiClientSecure");
        return;
      }
    } else {
      http.begin(server_url);
    }

    http.addHeader("Content-Type", "application/json");
    http.addHeader("x-api-key", api_key);

    int httpCode = http.GET();
    if (httpCode == 200) {
      String payload = http.getString();
      StaticJsonDocument<768> doc;
      DeserializationError error = deserializeJson(doc, payload);

      if (!error) {
        const char *door_trigger = doc["door_trigger"]; // "open" หรือ "idle"
        int pending_count = doc["pending_count"];

        // อ่านประวัติและชื่อล่าสุด
        String approvedName = "";
        String studentId = "";
        if (doc.containsKey("last_approved") &&
            !doc["last_approved"].isNull()) {
          approvedName = doc["last_approved"]["name"].as<String>();
          studentId = doc["last_approved"]["student_id"].as<String>();
        }

        // รับค่าคีย์ลงทะเบียนและ active token ล่าสุดจากคลาวด์เซิร์ฟเวอร์
        const char *active_token = doc["active_token"];
        const char *register_url = doc["register_url"];
        const char *requested_room = doc["requested_room"];

        // สร้างหน้าลิงก์สแกน QR Code ประจำตัวบอร์ดแบบสมบูรณ์
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
          qrText = baseUrl + "/?scan=" + String(active_token) +
                   "&room=" + String(requested_room);
        }

        Serial.print("Door command: ");
        Serial.print(door_trigger);
        Serial.print(" | Queue: ");
        Serial.println(pending_count);

        // --- ลำดับการอนุมัติปลดล็อกประตู (UNLOCKED SEQUENCE) ---
        if (String(door_trigger) == "open") {
          Serial.println("🔓 UNLOCK SIGNAL RECEIVED! Opening door...");

          // ขั้น 1: วาดหน้าจอกำลังประมวลผล (Scanning) 1.2 วินาทีเพื่อความเหมือนจริง!
          drawScanningScreen();
          tone(BUZZER_PIN, 1500, 100);
          delay(1200);

          // ขั้น 2: แสดงหน้าจออนุมัติ (Access Granted)
          drawUnlockedScreen(approvedName, studentId);

          // ส่งสัญญาณพอร์ตบวกไประดมการเปิดรีเลย์จริง
          digitalWrite(RELAY_PIN, HIGH);

          // เล่นเพลงเสียงระดับสูงหวานหรูหราต้อนรับ
          tone(BUZZER_PIN, 1000, 150);
          delay(180);
          tone(BUZZER_PIN, 1500, 150);
          delay(180);
          tone(BUZZER_PIN, 2000, 300);

          // ลูปแสดงเกจคูลดาวน์เวลาเปิดประตูก่อนที่จะกลับมาล็อก
          // (ช่วยเพิ่มแอนิเมชันเกจลดเวลาประดับบนจอจำลองให้เหมือน esp32-preview)
          int countdownMs = 3800; // หน่วงเวลารวม 5 วินาที
          int stepSize = 320 / 38;
          for (int i = 0; i < 38; i++) {
            tft.fillRect(0, 236, 320 - (i * stepSize), 4,
                         tft.color565(16, 185, 129));
            tft.fillRect(320 - (i * stepSize), 236, stepSize, 4,
                         tft.color565(6, 78, 59));
            delay(100);
          }

          digitalWrite(RELAY_PIN, LOW); // ดึงพินกลับคืนประตูล็อก
          Serial.println("🔒 Door auto locked.");

          // เสียงติ๊ดสั้นเมื่อประตูล็อกกลับคืน
          tone(BUZZER_PIN, 800, 250);

          // บังคับให้ล้างค่าเก่าเพื่อรีดรอการวาดหน้าหลักสแตนด์บายรอบใหม่
          last_queue_count = -1;
          last_approved_name = "FORCE_REDRAW";
          last_active_token = "FORCE_REDRAW";
        }
        // --- ส่วนลดการกะพริบ: โหลดข้อมูลใหม่เฉพาะจุดที่มีการอัปเดตสเตตัส ---
        else if (pending_count != last_queue_count ||
                 studentId != last_approved_name ||
                 (active_token && String(active_token) != last_active_token)) {
          last_queue_count = pending_count;
          last_approved_name = studentId;
          if (active_token)
            last_active_token = String(active_token);

          drawMainScreen(pending_count, studentId, time_str, qrText);
        } else {
          // หากไม่มีคำสั่งและข้อมูลไม่เปลี่ยน แต่อยากให้อัปเดตเฉพาะนาฬิกา
          tft.setTextSize(1);
          tft.fillRect(265, 0, 55, 20,
                       tft.color565(14, 17, 28)); // ล้างแถบเวลาเก่า
          tft.setTextColor(tft.color565(16, 185, 129));
          tft.setCursor(265, 6);
          tft.print(time_str);
        }
      }
    } else {
      Serial.print("HTTP Error: ");
      Serial.println(httpCode);
    }
    http.end();
  } else {
    // กะพริบเตือนกรณีสัญญาณเครือข่ายสูญหาย
    digitalWrite(LED_WIFI, LOW);
    delay(250);
    digitalWrite(LED_WIFI, HIGH);
    delay(250);
  }

  delay(polling_delay);
}