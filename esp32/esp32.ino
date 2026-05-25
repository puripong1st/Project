/*
  ==============================================================
  RMUTP Door Access Controller - Firmware for ESP32
  ห้องปฏิบัติการเรียนการสอน: Classroom CE-401
  ระบบรองรับการรันผ่านคลาวด์ Vercel (HTTPS WiFiClientSecure)
  ==============================================================
*/
#define WOKWI_SIM // <-- ต้องมีบรรทัดนี้อยู่บนสุดของโค้ดใน Wokwi
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
    "https://project-sigma-ivory-21.vercel.app/api/esp32/display?room=CE-401";
const char *api_key = "rmutp_secure_door_unlock_token_2026";

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

// ฟังก์ชันวาดรูปโครงสร้าง QR Code จำลอง
void drawSimulatedQRCode(int x, int y, int size) {
  tft.fillRect(x, y, size, size, ILI9341_WHITE);

  // มุมซ้ายบน
  tft.fillRect(x + 4, y + 4, 24, 24, ILI9341_BLACK);
  tft.fillRect(x + 8, y + 8, 16, 16, ILI9341_WHITE);
  tft.fillRect(x + 12, y + 12, 8, 8, ILI9341_BLACK);

  // มุมขวาบน
  tft.fillRect(x + size - 28, y + 4, 24, 24, ILI9341_BLACK);
  tft.fillRect(x + size - 24, y + 8, 16, 16, ILI9341_WHITE);
  tft.fillRect(x + size - 20, y + 12, 8, 8, ILI9341_BLACK);

  // มุมซ้ายล่าง
  tft.fillRect(x + 4, y + size - 28, 24, 24, ILI9341_BLACK);
  tft.fillRect(x + 8, y + size - 24, 16, 16, ILI9341_WHITE);
  tft.fillRect(x + 12, y + size - 20, 8, 8, ILI9341_BLACK);

  // จุดพิกเซลจำลองในพื้นที่ตรงกลาง
  tft.fillRect(x + 35, y + 15, 6, 10, ILI9341_BLACK);
  tft.fillRect(x + 50, y + 5, 8, 8, ILI9341_BLACK);
  tft.fillRect(x + 45, y + 25, 12, 4, ILI9341_BLACK);
  tft.fillRect(x + 35, y + 45, 18, 6, ILI9341_BLACK);
  tft.fillRect(x + 65, y + 35, 6, 12, ILI9341_BLACK);
  tft.fillRect(x + 35, y + 65, 8, 8, ILI9341_BLACK);
  tft.fillRect(x + 55, y + 55, 14, 6, ILI9341_BLACK);
  tft.fillRect(x + 75, y + 70, 8, 14, ILI9341_BLACK);
  tft.fillRect(x + 45, y + 80, 10, 8, ILI9341_BLACK);
  tft.fillRect(x + 15, y + 45, 8, 8, ILI9341_BLACK);
  tft.fillRect(x + 75, y + 15, 12, 12, ILI9341_BLACK);
}

void drawMainScreen(int queueCount, String lastApproved) {
  // เคลียร์จอสีเทาเข้ม
  tft.fillScreen(0x0841);

  // ส่วนหัว (Header) สีม่วงหรูหรา
  tft.fillRect(0, 0, 320, 45, 0x380E); // Deep purple
  tft.drawRect(0, 45, 320, 2, 0xF97F); // Pink border line

  tft.setTextColor(ILI9341_WHITE);
  tft.setTextSize(2);
  tft.setCursor(20, 8);
  tft.print("RMUTP DOOR ACCESS");

  tft.setTextSize(1);
  tft.setTextColor(0xF97F);
  tft.setCursor(20, 28);
  tft.print("Classroom CE-401 | Smart Door Lock");

  // --- การ์ดฝั่งซ้าย: สถานะระบบ ---
  tft.drawRoundRect(10, 55, 150, 175, 8, 0x421B);

  tft.setTextSize(1);
  tft.setTextColor(0x5AEB); // Cyan
  tft.setCursor(20, 68);
  tft.print("SYSTEM: ");
  tft.setTextColor(ILI9341_GREEN);
  tft.print("ONLINE");

  // ตราสัญลักษณ์ประตูล็อก (DOOR LOCKED)
  tft.fillRect(20, 83, 130, 26, 0x8000); // สีแดงเข้ม
  tft.drawRect(20, 83, 130, 26, 0xF800); // เส้นขอบสีแดงสว่าง
  tft.setTextColor(ILI9341_WHITE);
  tft.setCursor(45, 92);
  tft.print("DOOR LOCKED");

  // ตัวเลขนักศึกษาที่รออนุมัติ (Queue Count)
  tft.setTextColor(0xD6BA); // สีเงิน
  tft.setCursor(20, 120);
  tft.print("PENDING QUEUE:");

  tft.fillRect(20, 132, 130, 35, 0x18C3); // พื้นหลังสีกรมท่า
  tft.drawRect(20, 132, 130, 35, 0x5AEB);

  tft.setTextSize(2);
  tft.setTextColor(ILI9341_WHITE);
  tft.setCursor(40, 142);
  tft.print(queueCount);
  tft.setTextSize(1);
  tft.setTextColor(0x5AEB);
  tft.print(" WAITING");

  // ผู้เข้าใช้งานล่าสุด (Last Approved)
  tft.setTextSize(1);
  tft.setTextColor(0xD6BA);
  tft.setCursor(20, 180);
  tft.print("LAST APPROVED:");

  tft.setTextColor(ILI9341_WHITE);
  tft.setCursor(20, 195);
  if (lastApproved.length() > 0) {
    // ตัดความยาวหากชื่อยาวเกินไป
    if (lastApproved.length() > 18) {
      tft.print(lastApproved.substring(0, 16) + "..");
    } else {
      tft.print(lastApproved);
    }
  } else {
    tft.print("- None -");
  }

  // --- การ์ดฝั่งขวา: จอจำลอง QR CODE ---
  tft.drawRoundRect(170, 55, 140, 175, 8, 0x421B);

  // วาด QR Code จำลอง
  drawSimulatedQRCode(190, 70, 100);

  // ฉลากประกอบ
  tft.setTextSize(1);
  tft.setTextColor(ILI9341_WHITE);
  tft.setCursor(200, 180);
  tft.print("SCAN QR CODE");
  tft.setTextColor(0xF97F);
  tft.setCursor(195, 195);
  tft.print("TO REQUEST ENTRY");
}

void drawUnlockedScreen(String approvedUser) {
  // เคลียร์หน้าจอสีเขียวหรูหรา
  tft.fillScreen(0x02E0); // Deep forest green

  // วาดกรอบหน้าต่างแจ้งเตือนกลางจอ
  tft.drawRoundRect(15, 15, 290, 210, 10, ILI9341_WHITE);
  tft.drawRoundRect(16, 16, 288, 208, 10, 0xBEF6);

  // วาดวงกลมและสัญลักษณ์ถูก (Checkmark)
  tft.fillCircle(160, 70, 30, ILI9341_WHITE);
  tft.fillCircle(160, 70, 26, 0x02E0);

  tft.setTextSize(3);
  tft.setTextColor(ILI9341_WHITE);
  tft.setCursor(150, 60);
  tft.print("v");

  // หัวข้อความสำเร็จ
  tft.setTextSize(3);
  tft.setTextColor(ILI9341_WHITE);
  tft.setCursor(45, 115);
  tft.print("ACCESS GRANTED");

  tft.setTextSize(1);
  tft.setTextColor(0xBEF6);
  tft.setCursor(65, 155);
  tft.print("CLASSROOM CE-401 IS UNLOCKED");

  // แสดงชื่อผู้ได้รับอนุญาต
  tft.setTextSize(2);
  tft.setTextColor(ILI9341_YELLOW);
  tft.setCursor(30, 185);
  if (approvedUser.length() > 0) {
    tft.print(approvedUser);
  } else {
    tft.print("STUDENT ACCESS");
  }
}

void setup() {
  Serial.begin(115200);

  // ตั้งค่าพินเอาท์พุท
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(LED_WIFI, OUTPUT);
  pinMode(LED_REJECT, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);

  digitalWrite(RELAY_PIN, LOW); // ล็อกประตูก่อนเสมอ
  digitalWrite(LED_WIFI, LOW);
  digitalWrite(LED_REJECT, LOW);

  // เริ่มต้นหน้าจอ TFT
  tft.begin();
  tft.setRotation(1); // แสดงผลแนวนอน (Landscape)

  // วาดหน้าจอกำลังเชื่อมต่อ WiFi
  tft.fillScreen(0x0841);
  tft.fillRect(0, 0, 320, 45, 0x380E);
  tft.drawRect(0, 45, 320, 2, 0xF97F);

  tft.setTextColor(ILI9341_WHITE);
  tft.setTextSize(2);
  tft.setCursor(20, 12);
  tft.print("RMUTP DOOR ACCESS");

  tft.setTextSize(2);
  tft.setTextColor(0x5AEB); // cyan
  tft.setCursor(40, 100);
  tft.print("CONNECTING WIFI...");

  tft.setTextSize(1);
  tft.setTextColor(0xD6BA);
  tft.setCursor(40, 140);
  tft.print("Connecting to Virtual SSID: Wokwi-GUEST");

  Serial.print("Connecting to Wi-Fi...");
  WiFi.begin(ssid, password);

  // ไฟสถานะกะพริบระหว่างต่อ WiFi
  bool wifi_led_state = false;
  while (WiFi.status() != WL_CONNECTED) {
    wifi_led_state = !wifi_led_state;
    digitalWrite(LED_WIFI, wifi_led_state ? HIGH : LOW);
    delay(400);
    Serial.print(".");
  }

  digitalWrite(LED_WIFI, HIGH); // สว่างค้างเมื่อต่อสำเร็จ
  Serial.println("\nWiFi connected successfully!");

  // เสียงบี๊บยินดีต้อนรับเมื่อระบบสแตนด์บาย
  tone(BUZZER_PIN, 1200, 200);
  delay(250);
  tone(BUZZER_PIN, 1600, 200);

  // วาดหน้าจอหลักสแตนด์บายเริ่มต้น
  drawMainScreen(0, "");
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    digitalWrite(LED_WIFI, HIGH); // มั่นใจว่าไฟ WiFi สว่างอยู่

    HTTPClient http;
    // เชื่อมต่อ Vercel แบบ HTTPS
    if (String(server_url).startsWith("https://")) {
      WiFiClientSecure *client = new WiFiClientSecure;
      if (client) {
        client->setInsecure(); // ข้ามการเช็ก CA Certificate เพื่อประมวลผลเร็ว
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
        const char *last_approved = doc["last_approved"];
        const char *active_token = doc["active_token"];

        String approvedName = last_approved ? String(last_approved) : "";
        String activeTokenStr = active_token ? String(active_token) : "";

        Serial.print("Door Trigger: ");
        Serial.print(door_trigger);
        Serial.print(" | Queue: ");
        Serial.println(pending_count);

        // กรณีได้รับคำสั่งปลดล็อกบอร์ด (ACCESS GRANTED!)
        if (String(door_trigger) == "open") {
          Serial.println("🔓 UNLOCK COMMAND RECEIVED! Opening door...");

          // สลับหน้าจอเป็นปลดล็อกแล้ว
          drawUnlockedScreen(approvedName);

          // ส่งสัญญาณเสียงและแสง
          digitalWrite(
              RELAY_PIN,
              HIGH); // สับสวิตช์รีเลย์ปลดล็อกกลอนจริง! (ไฟเขียว led-door จะสว่างผ่าน NO)

          // เล่นเพลง 3 ระดับเสียงต้อนรับอย่างหรูหรา
          tone(BUZZER_PIN, 1000, 150);
          delay(180);
          tone(BUZZER_PIN, 1500, 150);
          delay(180);
          tone(BUZZER_PIN, 2000, 300);

          delay(4190); // หน่วงเวลาเปิดประตูกว้าง 5 วินาทีหักลบเวลาก่อนหน้า

          digitalWrite(RELAY_PIN, LOW); // ปิดรีเลย์ ล็อกประตูตามเดิม
          Serial.println("🔒 Door locked.");

          // เสียงปิดล็อก
          tone(BUZZER_PIN, 800, 300);

          // ล้างตัวแปรสถานะเพื่อบีบให้หน้าจอวาดหน้าหลักใหม่
          last_queue_count = -1;
          last_approved_name = "FORCE_REDRAW";
        }
        // อัปเดตข้อมูลหน้าจอเฉพาะกรณีที่มีการเปลี่ยนแปลง (ลดการกะพริบของจอ)
        else if (pending_count != last_queue_count ||
                 approvedName != last_approved_name ||
                 activeTokenStr != last_active_token) {
          last_queue_count = pending_count;
          last_approved_name = approvedName;
          last_active_token = activeTokenStr;

          drawMainScreen(pending_count, approvedName);
        }
      }
    } else {
      Serial.print("HTTP Error: ");
      Serial.println(httpCode);
    }
    http.end();
  } else {
    // กรณีเน็ตหลุด ไฟสถานะ WiFi จะกะพริบเตือน
    digitalWrite(LED_WIFI, LOW);
    delay(250);
    digitalWrite(LED_WIFI, HIGH);
    delay(250);
  }

  delay(polling_delay);
}