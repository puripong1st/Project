const fs = require('fs');
const path = require('path');
const vm = require('vm');

const htmlPath = path.join(__dirname, '..', 'complete_system_manual_th.html');
console.log(`Reading HTML file from ${htmlPath}...`);

if (!fs.existsSync(htmlPath)) {
  console.error("HTML file not found!");
  process.exit(1);
}

const html = fs.readFileSync(htmlPath, 'utf8');

// Simple regex to extract <script> tag contents
const scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
let match;
let scriptIndex = 1;
let hasErrors = false;

while ((match = scriptRegex.exec(html)) !== null) {
  const scriptContent = match[1].trim();
  const tagHeader = match[0].split('>')[0] + '>';
  
  if (tagHeader.includes('src=') || tagHeader.includes('type="module"')) {
    console.log(`Script tag ${scriptIndex}: Module or external script, skipping...`);
    scriptIndex++;
    continue;
  }
  
  if (!scriptContent) {
    scriptIndex++;
    continue;
  }
  
  console.log(`Script tag ${scriptIndex}: Syntax checking (${scriptContent.substring(0, 50).replace(/\n/g, ' ')}...)...`);
  
  try {
    // Compile the script content to verify syntax
    new vm.Script(scriptContent, { filename: `script_tag_${scriptIndex}.js` });
    console.log(`✅ Script tag ${scriptIndex} is syntax valid!`);
  } catch (err) {
    console.error(`❌ Syntax error in script tag ${scriptIndex}:`);
    console.error(err.stack);
    hasErrors = true;
  }
  
  scriptIndex++;
}

if (hasErrors) {
  console.error("❌ Verification failed! Mismatched braces or syntax errors found!");
  process.exit(1);
} else {
  console.log("🎉 All script tags are 100% syntax valid!");
}
