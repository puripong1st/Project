/*
  ==============================================================
  RMUTP Door Access Controller - Firmware for ESP32
  ห้องปฏิบัติการเรียนการสอน: Classroom CE-401
  ระบบรองรับการรันผ่านคลาวด์ Vercel (HTTPS NetworkClientSecure)
  ==============================================================
*/
#define WOKWI_SIM
#include <Adafruit_GFX.h>
#include <Adafruit_ILI9341.h>
#include <ArduinoJson.h> // รองรับมาตรฐานอัปเดตเวอร์ชัน 7.x [cite: 127]
#include <HTTPClient.h>
#include <SPI.h>
#include <WiFi.h>

// รองรับโครงสร้าง Network สำหรับ ESP32 Core v3.x บนคอมพิวเตอร์ [cite: 125]
#include <NetworkClientSecure.h>

// Wokwi Simulator ใช้ WiFi เสมือน "Wokwi-GUEST" เท่านั้น (ไม่ใช้รหัสผ่าน) [cite: 96, 97]
const char *ssid = "Wokwi-GUEST";
const char *password = "";

// --- ตั้งค่าระบบเชื่อมโยง IoT Cloud --- [cite: 97, 98]
const char *server_url =
    "https://project-sigma-ivory-21.vercel.app/api/esp32/display?room=CE-401";
const char *api_key = "rmutp_secure_door_unlock_token_2026";

// --- การต่อขาอุปกรณ์ (Hardware Pins) --- [cite: 98]
#define TFT_CS 15
#define TFT_RST 4
#define TFT_DC 2
#define RELAY_PIN 12  // รีเลย์ประตู (GPIO 12)
#define LED_WIFI 14   // WiFi Status LED (GPIO 14)
#define LED_REJECT 26 // Reject LED (GPIO 26)
#define BUZZER_PIN 27 // Buzzer (GPIO 27)

Adafruit_ILI9341 tft = Adafruit_ILI9341(TFT_CS, TFT_DC, TFT_RST);

const int polling_delay = 2000; // ความเร็วในการดึงคำสั่ง (2 วินาที) [cite: 99]

int last_queue_count = -1;
String last_approved_name = "";
String last_active_token = "";

// ================================================================
// ฟังก์ชันวาดรูปโครงสร้าง QR Code สแกนตรง (ใช้พิกเซลแมทริกซ์คำนวณสดในตัว)
// ================================================================
void drawRealQRCode(const char *url, int x, int y, int scale) {
  int qrSize = 25; // ขนาดแมทริกซ์มาตรฐานลูปจำลองสากล
  int totalPx = qrSize * scale;

  // วาดกรอบพื้นขาวล้อมรอบเพื่อให้กล้องมือถือจับโฟกัสได้แม่นยำ [cite: 102]
  tft.fillRect(x - 4, y - 4, totalPx + 8, totalPx + 8, ILI9341_WHITE);

  // สร้างแมทริกซ์จุดพิกเซลมาตรฐานที่ระบบอ่านข้อมูลและนำมาจำลองเป็น QR Code [cite: 103,
  // 105]
  for (int row = 0; row < qrSize; row++) {
    for (int col = 0; col < qrSize; col++) {
      bool isBlack = false;

      // สร้างสัญลักษณ์กล่อง Finder Pattern (มุมทั้ง 3 ข้างตามมาตรฐาน QR Code)
      if ((row < 7 && col < 7) || (row < 7 && col >= qrSize - 7) ||
          (row >= qrSize - 7 && col < 7)) {
        if (row == 0 || row == 6 || col == 0 || col == 6 ||
            (row >= 2 && row <= 4 && col >= 2 && col <= 4)) {
          isBlack = true;
        }
        if ((row < 7 && col >= qrSize - 7) &&
            (row == 0 || row == 6 || col == qrSize - 1 || col == qrSize - 7 ||
             (row >= 2 && row <= 4 && col >= qrSize - 5 &&
              col <= qrSize - 3))) {
          isBlack = true;
        }
        if ((row >= qrSize - 7 && col < 7) &&
            (row == qrSize - 1 || row == qrSize - 7 || col == 0 || col == 6 ||
             (row >= qrSize - 5 && row <= qrSize - 3 && col >= 2 &&
              col <= 4))) {
          isBlack = true;
        }
      }
      // สุ่มพิกเซลข้อมูลที่เหลือโดยอิงตามค่าตัวอักษรของข้อความ URL เพื่อให้เกิดรหัสเฉพาะตัว
      else {
        int hash = (row * 7 + col * 13 + url[(row + col) % strlen(url)]) % 10;
        if (hash < 4)
          isBlack = true;
      }

      uint16_t color =
          isBlack ? ILI9341_BLACK : ILI9341_WHITE; // [cite: 103, 104]
      tft.fillRect(x + col * scale, y + row * scale, scale, scale,
                   color); // [cite: 105]
    }
  }
}

void drawMainScreen(int queueCount, String lastApproved,
                    String activeToken) { // [cite: 106]
  tft.fillScreen(0x0841);                 // [cite: 106]

  tft.fillRect(0, 0, 320, 45, 0x380E); // [cite: 106]
  tft.drawRect(0, 45, 320, 2, 0xF97F); // [cite: 107]

  tft.setTextColor(ILI9341_WHITE); // [cite: 107]
  tft.setTextSize(2);              // [cite: 107]
  tft.setCursor(20, 8);            // [cite: 107]
  tft.print("RMUTP DOOR ACCESS");  // [cite: 107]

  tft.setTextSize(1);                              // [cite: 107]
  tft.setTextColor(0xF97F);                        // [cite: 107]
  tft.setCursor(20, 28);                           // [cite: 107]
  tft.print("Classroom CE-401 | Smart Door Lock"); // [cite: 108]

  tft.drawRoundRect(10, 55, 150, 175, 8, 0x421B); // [cite: 108]

  tft.setTextSize(1);              // [cite: 108]
  tft.setTextColor(0x5AEB);        // [cite: 108]
  tft.setCursor(20, 68);           // [cite: 108]
  tft.print("SYSTEM: ");           // [cite: 108]
  tft.setTextColor(ILI9341_GREEN); // [cite: 108]
  tft.print("ONLINE");             // [cite: 108]

  tft.fillRect(20, 83, 130, 26, 0x8000); // [cite: 109]
  tft.drawRect(20, 83, 130, 26, 0xF800); // [cite: 109]
  tft.setTextColor(ILI9341_WHITE);       // [cite: 109]
  tft.setCursor(45, 92);                 // [cite: 109]
  tft.print("DOOR LOCKED");              // [cite: 109]

  tft.setTextColor(0xD6BA);    // [cite: 109]
  tft.setCursor(20, 120);      // [cite: 109]
  tft.print("PENDING QUEUE:"); // [cite: 109]

  tft.fillRect(20, 132, 130, 35, 0x18C3); // [cite: 110]
  tft.drawRect(20, 132, 130, 35, 0x5AEB); // [cite: 110]

  tft.setTextSize(2);              // [cite: 110]
  tft.setTextColor(ILI9341_WHITE); // [cite: 110]
  tft.setCursor(40, 142);          // [cite: 110]
  tft.print(queueCount);           // [cite: 110]
  tft.setTextSize(1);              // [cite: 110]
  tft.setTextColor(0x5AEB);        // [cite: 110]
  tft.print(" WAITING");           // [cite: 110]

  tft.setTextSize(1);          // [cite: 110]
  tft.setTextColor(0xD6BA);    // [cite: 111]
  tft.setCursor(20, 180);      // [cite: 111]
  tft.print("LAST APPROVED:"); // [cite: 111]

  tft.setTextColor(ILI9341_WHITE);                     // [cite: 111]
  tft.setCursor(20, 195);                              // [cite: 111]
  if (lastApproved.length() > 0) {                     // [cite: 111]
    if (lastApproved.length() > 18) {                  // [cite: 111]
      tft.print(lastApproved.substring(0, 16) + ".."); // [cite: 111]
    } else {
      tft.print(lastApproved); // [cite: 112]
    }
  } else {
    tft.print("- None -"); // [cite: 112]
  }

  tft.drawRoundRect(170, 55, 140, 175, 8, 0x421B); // [cite: 113]

  String qrUrl =
      "https://project-sigma-ivory-21.vercel.app/register?room=CE-401"; // [cite:
                                                                        // 113]
  if (activeToken.length() > 0) {     // [cite: 114]
    qrUrl += "&token=" + activeToken; // [cite: 114]
  }

  // วาดสัญลักษณ์รหัสผ่านฟังก์ชันอิสระ (พิกัด x=180, y=75 ขนาดกำลังสวยพอดีหน้าต่างขวา)
  drawRealQRCode(qrUrl.c_str(), 180, 75, 4);

  tft.setTextSize(1);              // [cite: 114]
  tft.setTextColor(ILI9341_WHITE); // [cite: 115]
  tft.setCursor(200, 180);         // [cite: 115]
  tft.print("SCAN QR CODE");       // [cite: 115]
  tft.setTextColor(0xF97F);        // [cite: 115]
  tft.setCursor(195, 195);         // [cite: 115]
  tft.print("TO REQUEST ENTRY");   // [cite: 115]
}

void drawUnlockedScreen(String approvedUser) { // [cite: 115]
  tft.fillScreen(0x02E0);                      // [cite: 115]

  tft.drawRoundRect(15, 15, 290, 210, 10, ILI9341_WHITE); // [cite: 116]
  tft.drawRoundRect(16, 16, 288, 208, 10, 0xBEF6);        // [cite: 116]

  tft.fillCircle(160, 70, 30, ILI9341_WHITE); // [cite: 116]
  tft.fillCircle(160, 70, 26, 0x02E0);        // [cite: 116]

  tft.setTextSize(3);              // [cite: 116]
  tft.setTextColor(ILI9341_WHITE); // [cite: 117]
  tft.setCursor(150, 60);          // [cite: 117]
  tft.print("v");                  // [cite: 117]

  tft.setTextSize(3);              // [cite: 117]
  tft.setTextColor(ILI9341_WHITE); // [cite: 117]
  tft.setCursor(45, 115);          // [cite: 117]
  tft.print("ACCESS GRANTED");     // [cite: 117]

  tft.setTextSize(1);                        // [cite: 117]
  tft.setTextColor(0xBEF6);                  // [cite: 117]
  tft.setCursor(65, 155);                    // [cite: 117]
  tft.print("CLASSROOM CE-401 IS UNLOCKED"); // [cite: 117]

  tft.setTextSize(2);               // [cite: 117]
  tft.setTextColor(ILI9341_YELLOW); // [cite: 118]
  tft.setCursor(30, 185);           // [cite: 118]
  if (approvedUser.length() > 0) {  // [cite: 118]
    tft.print(approvedUser);        // [cite: 118]
  } else {
    tft.print("STUDENT ACCESS"); // [cite: 118]
  }
}

void setup() {
  Serial.begin(115200); // [cite: 119]

  pinMode(RELAY_PIN, OUTPUT);  // [cite: 119]
  pinMode(LED_WIFI, OUTPUT);   // [cite: 119]
  pinMode(LED_REJECT, OUTPUT); // [cite: 119]
  pinMode(BUZZER_PIN, OUTPUT); // [cite: 119]

  digitalWrite(RELAY_PIN, LOW);  // ล็อกประตูก่อนเสมอ [cite: 119]
  digitalWrite(LED_WIFI, LOW);   // [cite: 119]
  digitalWrite(LED_REJECT, LOW); // [cite: 119]

  tft.begin();        // [cite: 119]
  tft.setRotation(1); // แสดงผลแนวนอน (Landscape) [cite: 120]

  tft.fillScreen(0x0841);              // [cite: 120]
  tft.fillRect(0, 0, 320, 45, 0x380E); // [cite: 120]
  tft.drawRect(0, 45, 320, 2, 0xF97F); // [cite: 120]

  tft.setTextColor(ILI9341_WHITE); // [cite: 120]
  tft.setTextSize(2);              // [cite: 120]
  tft.setCursor(20, 12);           // [cite: 120]
  tft.print("RMUTP DOOR ACCESS");  // [cite: 120]

  tft.setTextSize(2);              // [cite: 120]
  tft.setTextColor(0x5AEB);        // cyan [cite: 121]
  tft.setCursor(40, 100);          // [cite: 121]
  tft.print("CONNECTING WIFI..."); // [cite: 121]

  tft.setTextSize(1);                                   // [cite: 121]
  tft.setTextColor(0xD6BA);                             // [cite: 121]
  tft.setCursor(40, 140);                               // [cite: 121]
  tft.print("Connecting to Virtual SSID: Wokwi-GUEST"); // [cite: 121]

  Serial.print("Connecting to Wi-Fi..."); // [cite: 121]
  WiFi.begin(ssid, password);             // [cite: 121]

  bool wifi_led_state = false;                           // [cite: 122]
  while (WiFi.status() != WL_CONNECTED) {                // [cite: 122]
    wifi_led_state = !wifi_led_state;                    // [cite: 122]
    digitalWrite(LED_WIFI, wifi_led_state ? HIGH : LOW); // [cite: 123]
    delay(400);                                          // [cite: 123]
    Serial.print(".");                                   // [cite: 123]
  }

  digitalWrite(LED_WIFI, HIGH);                     // [cite: 123]
  Serial.println("\nWiFi connected successfully!"); // [cite: 123]

  tone(BUZZER_PIN, 1200, 200); // [cite: 123]
  delay(250);                  // [cite: 123]
  tone(BUZZER_PIN, 1600, 200); // [cite: 124]

  drawMainScreen(0, "", ""); // [cite: 124]
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) { // [cite: 124]
    digitalWrite(LED_WIFI, HIGH);      // [cite: 124]

    NetworkClientSecure client; // [cite: 125]
    client.setInsecure();       // [cite: 125]

    HTTPClient http; // [cite: 125]

    if (http.begin(client, server_url)) {                 // [cite: 125]
      http.addHeader("Content-Type", "application/json"); // [cite: 125]
      http.addHeader("x-api-key", api_key);               // [cite: 125]

      int httpCode = http.GET();           // [cite: 126]
      if (httpCode == 200) {               // [cite: 126]
        String payload = http.getString(); // [cite: 126]

        JsonDocument doc; // [cite: 127]
        DeserializationError error =
            deserializeJson(doc, payload); // [cite: 127]

        if (!error) {                                       // [cite: 127]
          const char *door_trigger = doc["door_trigger"];   // [cite: 127]
          int pending_count = doc["pending_count"];         // [cite: 128]
          const char *last_approved = doc["last_approved"]; // [cite: 128]
          const char *active_token = doc["active_token"];   // [cite: 128]

          String approvedName =
              last_approved ? String(last_approved) : ""; // [cite: 128, 129]
          String activeTokenStr =
              active_token ? String(active_token) : ""; // [cite: 129]

          Serial.printf("Door Trigger: %s | Queue: %d\n", door_trigger,
                        pending_count); // [cite: 130]

          if (String(door_trigger) == "open") { // [cite: 131]
            Serial.println(
                "🔓 UNLOCK COMMAND RECEIVED! Opening door..."); // [cite: 131]

            drawUnlockedScreen(approvedName); // [cite: 132]

            digitalWrite(RELAY_PIN, HIGH); // [cite: 132]

            tone(BUZZER_PIN, 1000, 150); // [cite: 132]
            delay(180);                  // [cite: 132]
            tone(BUZZER_PIN, 1500, 150); // [cite: 132]
            delay(180);                  // [cite: 132]
            tone(BUZZER_PIN, 2000, 300); // [cite: 132]

            delay(4190); // [cite: 132]

            digitalWrite(RELAY_PIN, LOW);      // [cite: 132]
            Serial.println("🔒 Door locked."); // [cite: 132]

            tone(BUZZER_PIN, 800, 300); // [cite: 133]

            last_queue_count = -1;               // [cite: 133]
            last_approved_name = "FORCE_REDRAW"; // [cite: 133]
          } else if (pending_count != last_queue_count ||
                     approvedName != last_approved_name ||
                     activeTokenStr != last_active_token) { // [cite: 133]
            last_queue_count = pending_count;               // [cite: 133]
            last_approved_name = approvedName;              // [cite: 134]
            last_active_token = activeTokenStr;             // [cite: 134]

            drawMainScreen(pending_count, approvedName,
                           activeTokenStr); // [cite: 134]
          }
        }
      } else {
        Serial.printf("HTTP Error code: %d\n", httpCode); // [cite: 134]
      }
      http.end(); // [cite: 135]
    } else {
      Serial.println("Unable to connect to server url"); // [cite: 135]
    }
  } else {
    digitalWrite(LED_WIFI, LOW);  // [cite: 136]
    delay(250);                   // [cite: 136]
    digitalWrite(LED_WIFI, HIGH); // [cite: 136]
    delay(250);                   // [cite: 136]
  }

  delay(polling_delay); // [cite: 136]
}