const fs = require('fs');
const path = require('path');

const filePath = path.join('c:', 'Users', 'aunkh', 'OneDrive', 'Desktop', 'Project', 'my-app', 'app', 'admin', 'dashboard', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Normalize line endings
content = content.replace(/\r\n/g, '\n');

// 6. Inject headers into loop() for main polling
if (!content.includes('String ts3 = getTimestamp();')) {
    content = content.replace(
        /      http\.addHeader\("x-api-key", api_key\);\n\n      int httpCode = http\.GET\(\);/g,
        '      http.addHeader("x-api-key", api_key);\n      String ts3 = getTimestamp();\n      http.addHeader("x-timestamp", ts3);\n      http.addHeader("x-hmac-signature", generateCloudHMAC(ts3, "/api/esp32/display"));\n\n      int httpCode = http.GET();'
    );
}

fs.writeFileSync(filePath, content, 'utf8');
console.log("Patched page.tsx successfully with regex");
