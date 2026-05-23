/**
 * RMUTP ACCS — ESP32 Door Lock Controller
 * ----------------------------------------------------
 * พัฒนาสำหรับบอร์ดควบคุมสิทธิ์การเข้าออกห้อง คณะครุศาสตร์ มทร.พระนคร
 * 
 * คุณสมบัติ:
 * 1. รองรับการเชื่อมต่อ Wi-Fi พร้อมระบบกู้คืนการเชื่อมต่ออัตโนมัติ (Auto Reconnect)
 * 2. รัน HTTP Server บนพอร์ต 80 เพื่อรับคำสั่งจาก Next.js API
 * 3. Endpoint:
 *    - POST /door/open : สั่งปลดล็อกกลอนแม่เหล็กไฟฟ้า (Relay) พร้อมเสียง Buzzer แจ้งเตือน
 *    - GET /status      : ให้ระบบหลังบ้านตรวจสอบสถานะการออนไลน์และสถานะประตู
 *    - POST /display   : รับคำสั่งแสดงผลข้อมูลนักศึกษา/สถานะอนุมัติลงบน Serial/หน้าจอ
 * 
 * ไลบรารีที่จำเป็น (ติดตั้งผ่าน Arduino IDE Library Manager):
 * - ArduinoJson (โดย Benoit Blanchon)
 * - WebServer (มาพร้อมบอร์ด ESP32)
 */

#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>

// ==========================================
// 1. การตั้งค่า Wi-Fi และเครือข่าย
// ==========================================
const char* ssid = "YOUR_WIFI_SSID";         // ใส่ชื่อ Wi-Fi ของคุณ
const char* password = "YOUR_WIFI_PASSWORD"; // ใส่รหัสผ่าน Wi-Fi ของคุณ

// ==========================================
// API Key สำหรับยืนยันตัวตนจาก Next.js (Vulnerability 1 Fix)
// ต้องตรงกับ ESP32_API_KEY ใน .env.local ของ Next.js
// ==========================================
const char* VALID_API_KEY = "rmutp_secure_door_unlock_token_2026";

// ตั้งค่า Static IP (แนะนำสำหรับการใช้งานระดับองค์กร เพื่อป้องกัน IP เปลี่ยนแปลง)
IPAddress local_IP(192, 168, 1, 100);       // IP ของบอร์ด ESP32 ที่ตั้งค่าใน .env
IPAddress gateway(192, 168, 1, 1);
IPAddress subnet(255, 255, 255, 0);
IPAddress dns(8, 8, 8, 8);

// ==========================================
// 2. การกำหนดขาเชื่อมต่ออุปกรณ์ (Pinout Mappings)
// ==========================================
#define RELAY_PIN       4   // ขาควบคุมรีเลย์กลอนแม่เหล็ก Solenoid (Active HIGH/LOW ตั้งค่าด้านล่าง)
#define BUZZER_PIN      5   // ขาควบคุมบัซเซอร์แจ้งเตือนแบบมีเสียง
#define STATUS_LED_PIN  2   // ไฟ LED บนบอร์ดแสดงสถานะการเชื่อมต่อ Wi-Fi

// โหมดการทำงานของรีเลย์
#define RELAY_ACTIVE    HIGH  // ปลดล็อกด้วยไฟบวก (HIGH) หรือ โหมดตัดไฟ (LOW)
#define RELAY_IDLE      LOW   // สถานะล็อกปกติ

// เวลาเปิดประตูค้างไว้ (มิลลิวินาที)
const int DOOR_OPEN_DURATION = 4000; // 4 วินาที

// สร้างอินสแตนซ์ของ Web Server บนพอร์ต 80
WebServer server(80);

// ==========================================
// 3. ฟังก์ชันควบคุมสัญญาณเสียง (Buzzer Tones)
// ==========================================
void toneSuccess() {
  digitalWrite(BUZZER_PIN, HIGH);
  delay(150);
  digitalWrite(BUZZER_PIN, LOW);
  delay(80);
  digitalWrite(BUZZER_PIN, HIGH);
  delay(300);
  digitalWrite(BUZZER_PIN, LOW);
}

void toneReject() {
  for (int i = 0; i < 3; i++) {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(100);
    digitalWrite(BUZZER_PIN, LOW);
    delay(50);
  }
}

void toneError() {
  digitalWrite(BUZZER_PIN, HIGH);
  delay(1000);
  digitalWrite(BUZZER_PIN, LOW);
}

// ==========================================
// 3. ฟังก์ชันตรวจสอบ API Key (Vulnerability 1 Fix)
// ==========================================
bool validateApiKey() {
  if (!server.hasHeader("X-API-Key")) {
    Serial.println("[SECURITY] Rejected: Missing X-API-Key header!");
    toneReject();
    server.send(401, "application/json", "{\"success\":false,\"message\":\"Unauthorized: Missing API Key\"}");
    return false;
  }
  if (server.header("X-API-Key") != String(VALID_API_KEY)) {
    Serial.println("[SECURITY] Rejected: Invalid X-API-Key!");
    toneReject();
    server.send(401, "application/json", "{\"success\":false,\"message\":\"Unauthorized: Invalid API Key\"}");
    return false;
  }
  return true;
}

// ==========================================
// 4. API Endpoints Handlers
// ==========================================

// GET /status — ส่งสถานะการออนไลน์และบอร์ดไปยังระบบ Next.js
void handleGetStatus() {
  StaticJsonDocument<200> doc;
  doc["online"] = true;
  doc["door_status"] = (digitalRead(RELAY_PIN) == RELAY_ACTIVE) ? "open" : "closed";
  doc["device"] = "ESP32 Door Controller";
  doc["faculty"] = "Education";
  doc["university"] = "RMUTP";
  
  String response;
  serializeJson(doc, response);
  server.send(200, "application/json", response);
  
  Serial.println("[API] GET /status - Requested status payload sent.");
}

// POST /door/open — คำสั่งปลดล็อกประตูจากแอดมินหลังบ้าน
void handlePostDoorOpen() {
  // ตรวจสอบ API Key ก่อนทุกครั้ง (Vulnerability 1 Fix)
  if (!validateApiKey()) return;

  if (server.hasArg("plain") == false) {
    server.send(400, "application/json", "{\"success\":false,\"message\":\"Body missing\"}");
    return;
  }
  
  String body = server.arg("plain");
  StaticJsonDocument<500> doc;
  DeserializationError error = deserializeJson(doc, body);
  
  if (error) {
    server.send(400, "application/json", "{\"success\":false,\"message\":\"Invalid JSON\"}");
    return;
  }
  
  const char* studentId = doc["studentId"] | "Unknown";
  const char* timestamp = doc["timestamp"] | "-";
  
  Serial.println("");
  Serial.println("================================================");
  Serial.print("🔓 [COMMAND RECEIVED] Door opening triggered by API!");
  Serial.print("Student ID: "); Serial.println(studentId);
  Serial.print("Timestamp: "); Serial.println(timestamp);
  Serial.println("================================================");

  // อนุมัติสิทธิ์การตอบกลับกลับไปยัง Next.js ก่อน เพื่อไม่ให้เกิด Timeout
  server.send(200, "application/json", "{\"success\":true,\"message\":\"🔓 ประตูเปิดสำเร็จ กำลังปลดล็อกรีเลย์\"}");
  
  // สั่งงานรีเลย์และระบบเสียงแจ้งเตือนแบบเรียลไทม์
  digitalWrite(RELAY_PIN, RELAY_ACTIVE);
  toneSuccess();
  
  // รอตามระยะเวลาเปิดค้างที่ตั้งค่าไว้
  delay(DOOR_OPEN_DURATION);
  
  // ล็อกประตูกลับคืนสถานะปกติ
  digitalWrite(RELAY_PIN, RELAY_IDLE);
  Serial.println("🔒 [LOCK RESTORED] Solenoid locked back to safe status.");
}

// POST /display — รับข้อมูลอัปเดตหน้าจอ LCD/TFT
void handlePostDisplay() {
  // ตรวจสอบ API Key ก่อนทุกครั้ง (Vulnerability 1 Fix)
  if (!validateApiKey()) return;

  if (server.hasArg("plain") == false) {
    server.send(400, "application/json", "{\"success\":false,\"message\":\"Body missing\"}");
    return;
  }
  
  String body = server.arg("plain");
  StaticJsonDocument<500> doc;
  DeserializationError error = deserializeJson(doc, body);
  
  if (error) {
    server.send(400, "application/json", "{\"success\":false,\"message\":\"Invalid JSON\"}");
    return;
  }
  
  const char* type = doc["type"] | "idle";
  const char* message = doc["message"] | "";
  const char* studentName = doc["studentName"] | "";
  
  Serial.println("");
  Serial.println("┌──────────────── DISPLAY UPDATE ────────────────┐");
  Serial.print("│ Type   : "); Serial.println(type);
  Serial.print("│ Name   : "); Serial.println(studentName);
  Serial.print("│ Message: "); Serial.println(message);
  Serial.println("└────────────────────────────────────────────────┘");

  // ควบคุมเสียงตามประเภทของการอัปเดตหน้าจอ
  if (strcmp(type, "approved") == 0) {
    // เสียงอนุมัติ (ถ้าไม่ได้มาจากการเปิดทาง HTTP หลัก)
  } else if (strcmp(type, "rejected") == 0) {
    toneReject();
  }

  // หากติดตั้งหน้าจอเพิ่มเติม (เช่น I2C LCD 1602 หรือ TFT ST7735):
  // สามารถเอาโค้ดล้างจอและเขียนตัวหนังสือมาใส่ในบล็อกนี้ได้เลยครับ!
  
  server.send(200, "application/json", "{\"success\":true,\"message\":\"Display status updated successfully\"}");
}

// กรณีเรียก Endpoint ที่ไม่มีในระบบ
void handleNotFound() {
  server.send(404, "application/json", "{\"success\":false,\"message\":\"Endpoint not found\"}");
}

// ==========================================
// 5. การเริ่มต้นระบบ (Setup)
// ==========================================
void setup() {
  Serial.begin(115200);
  delay(10);
  
  // กำหนดโหมดเอาต์พุตของขา Pins
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(STATUS_LED_PIN, OUTPUT);
  
  // ตั้งสถานะเริ่มต้น
  digitalWrite(RELAY_PIN, RELAY_IDLE);
  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(STATUS_LED_PIN, LOW);
  
  Serial.println("");
  Serial.println("================================================");
  Serial.println("     RMUTP Door Access Controller System v1.0   ");
  Serial.println("================================================");
  
  // กำหนด Static IP (หากต้องการใช้งาน DHCP ให้ลบบรรทัดข้างล่างนี้ออก)
  if (!WiFi.config(local_IP, gateway, subnet, dns)) {
    Serial.println("[Wi-Fi] Static IP Configuration Failed. Using DHCP.");
  }
  
  // เชื่อมต่อ Wi-Fi
  Serial.print("[Wi-Fi] Connecting to: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  
  int retryCount = 0;
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    // กระพริบไฟบอร์ดระหว่างรอการเชื่อมต่อ
    digitalWrite(STATUS_LED_PIN, !digitalRead(STATUS_LED_PIN));
    
    retryCount++;
    if (retryCount > 40) { // หากเชื่อมต่อล้มเหลวนานเกิน 20 วินาที
      Serial.println("");
      Serial.println("[Wi-Fi] Connect Timeout! Playing alert buzzer...");
      toneError();
      retryCount = 0;
    }
  }
  
  // เชื่อม Wi-Fi สำเร็จ
  digitalWrite(STATUS_LED_PIN, HIGH); // เปิดไฟค้างเพื่อบอกสถานะออนไลน์ปกติ
  Serial.println("");
  Serial.println("[Wi-Fi] Connected Successfully!");
  Serial.print("[Wi-Fi] ESP32 Local IP Address: ");
  Serial.println(WiFi.localIP());
  
  // กำหนดเส้นทาง API ของ Web Server
  server.on("/status", HTTP_GET, handleGetStatus);
  server.on("/door/open", HTTP_POST, handlePostDoorOpen);
  server.on("/display", HTTP_POST, handlePostDisplay);
  server.onNotFound(handleNotFound);

  // กำหนดให้ WebServer ดักจับ Custom Header X-API-Key (Vulnerability 1 Fix)
  const char* headerkeys[] = {"X-API-Key"};
  size_t headerkeyssize = sizeof(headerkeys) / sizeof(char*);
  server.collectHeaders(headerkeys, headerkeyssize);

  // เริ่มทำงาน HTTP Server
  server.begin();
  Serial.println("[HTTP] Web Server running on port 80.");
  
  // เสียงบี๊บยินดีต้อนรับบอร์ดรันสำเร็จ
  digitalWrite(BUZZER_PIN, HIGH);
  delay(100);
  digitalWrite(BUZZER_PIN, LOW);
  delay(50);
  digitalWrite(BUZZER_PIN, HIGH);
  delay(100);
  digitalWrite(BUZZER_PIN, LOW);
}

// ==========================================
// 6. วนลูปการทำงานหลัก (Loop)
// ==========================================
void loop() {
  // รันให้ Web Server คอยดักฟังคำขอ
  server.handleClient();
  
  // ตรวจสอบการหลุดการเชื่อมต่อของ Wi-Fi เป็นระยะๆ
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[Wi-Fi] Connection lost! Reconnecting...");
    digitalWrite(STATUS_LED_PIN, LOW);
    WiFi.disconnect();
    WiFi.begin(ssid, password);
    
    // รอรีบูทกลับมา
    int timeout = 0;
    while (WiFi.status() != WL_CONNECTED && timeout < 20) {
      delay(500);
      digitalWrite(STATUS_LED_PIN, !digitalRead(STATUS_LED_PIN));
      timeout++;
    }
    
    if (WiFi.status() == WL_CONNECTED) {
      digitalWrite(STATUS_LED_PIN, HIGH);
      Serial.print("[Wi-Fi] Reconnected successfully! IP: ");
      Serial.println(WiFi.localIP());
    }
  }
  
  // ลดการทำงาน CPU เล็กน้อย (1 มิลลิวินาที) เพื่อป้องกันความร้อนบอร์ดสูง
  delay(1);
}
