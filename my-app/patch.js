const fs = require('fs');
const path = require('path');

const filePath = path.join('c:', 'Users', 'aunkh', 'OneDrive', 'Desktop', 'Project', 'my-app', 'app', 'admin', 'dashboard', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add time.h
if (!content.includes('#include <time.h>')) {
    content = content.replace('#include "config.h"', '#include "config.h"\n#include <time.h>');
}

// 2. Add NTP setup in setup()
const ntpSetup = `
  // Setup NTP for HMAC Time Signature
  configTime(7 * 3600, 0, "pool.ntp.org");
  Serial.print("[INFO] Waiting for NTP time sync: ");
  time_t now = time(nullptr);
  while (now < 24 * 3600) {
    Serial.print(".");
    delay(100);
    now = time(nullptr);
  }
  Serial.println(" OK");
`;
if (!content.includes('configTime(')) {
    content = content.replace('  Serial.println("[BOOT] System starting...");', '  Serial.println("[BOOT] System starting...");' + ntpSetup);
}

// 3. Add getTimestamp and generateCloudHMAC functions before syncStudentCache
const hmacFuncs = `
String getTimestamp() {
  time_t now = time(nullptr);
  return String((long)now);
}

String generateCloudHMAC(String timestamp, String path) {
  String payload = timestamp + ":" + path;
  uint8_t hmacResult[32];
  mbedtls_md_context_t ctx;
  mbedtls_md_type_t md_type = MBEDTLS_MD_SHA256;
  mbedtls_md_init(&ctx);
  mbedtls_md_setup(&ctx, mbedtls_md_info_from_type(md_type), 1);
  mbedtls_md_hmac_starts(&ctx, (const unsigned char*)api_key, strlen(api_key));
  mbedtls_md_hmac_update(&ctx, (const unsigned char*)payload.c_str(), payload.length());
  mbedtls_md_hmac_finish(&ctx, hmacResult);
  mbedtls_md_free(&ctx);

  String encoded = "";
  const char* hex = "0123456789abcdef";
  for(int i=0; i<32; i++){
    encoded += hex[hmacResult[i] >> 4];
    encoded += hex[hmacResult[i] & 0x0F];
  }
  return encoded;
}
`;
if (!content.includes('String generateCloudHMAC')) {
    content = content.replace('void syncStudentCache() {', hmacFuncs + '\nvoid syncStudentCache() {');
}

// 4. Inject headers into syncStudentCache
if (!content.includes('String ts1 = getTimestamp();')) {
    content = content.replace(
        '  http.addHeader("x-api-key", api_key);\n  int httpCode = http.GET();',
        '  http.addHeader("x-api-key", api_key);\n  String ts1 = getTimestamp();\n  http.addHeader("x-timestamp", ts1);\n  http.addHeader("x-hmac-signature", generateCloudHMAC(ts1, "/api/esp32/display"));\n  int httpCode = http.GET();'
    );
}

// 5. Inject headers into syncOfflineLogs
if (!content.includes('String ts2 = getTimestamp();')) {
    content = content.replace(
        '  http.addHeader("x-api-key", api_key);\n  int httpCode = http.POST(content);',
        '  http.addHeader("x-api-key", api_key);\n  String ts2 = getTimestamp();\n  http.addHeader("x-timestamp", ts2);\n  http.addHeader("x-hmac-signature", generateCloudHMAC(ts2, "/api/esp32/logs/sync"));\n  int httpCode = http.POST(content);'
    );
}

// 6. Inject headers into loop() for main polling
if (!content.includes('String ts3 = getTimestamp();')) {
    content = content.replace(
        '      http.addHeader("x-api-key", api_key);\n\n      int httpCode = http.GET();',
        '      http.addHeader("x-api-key", api_key);\n      String ts3 = getTimestamp();\n      http.addHeader("x-timestamp", ts3);\n      http.addHeader("x-hmac-signature", generateCloudHMAC(ts3, "/api/esp32/display"));\n\n      int httpCode = http.GET();'
    );
}

fs.writeFileSync(filePath, content, 'utf8');
console.log("Patched page.tsx successfully");
