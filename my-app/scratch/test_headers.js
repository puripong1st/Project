const fs = require('fs');
const path = require('path');

const htmlPath = path.join(__dirname, '..', '..', 'complete_system_manual_th.html');
const htmlContent = fs.readFileSync(htmlPath, 'utf8');

// Simple regex to find h2 and h3 elements inside article compiledContent
const contentStart = htmlContent.indexOf('id="compiledContent"');
const contentEnd = htmlContent.indexOf('</article>', contentStart);
const contentHtml = htmlContent.substring(contentStart, contentEnd);

// Find all h2 and h3 elements
const headerRegex = /<(h2|h3)[^>]*>([\s\S]*?)<\/\1>/gi;
let match;
const headers = [];

while ((match = headerRegex.exec(contentHtml)) !== null) {
  headers.push({
    tag: match[1].toUpperCase(),
    text: match[2].replace(/<[^>]*>/g, '').trim() // Strip inner tags
  });
}

function getSectionNumber(text) {
  const cleanText = text.replace(/^§/, "").trim();
  const m = cleanText.match(/^(\d+)/);
  if (m) {
    return parseInt(m[1], 10);
  }
  return null;
}

const groups = [
  { id: "group-1", title: "📘 ภาคหลัก (1-19)", range: [1, 19] },
  { id: "group-2", title: "🔬 ภาคผนวกเชิงลึก (20-34)", range: [20, 34] },
  { id: "group-3", title: "⚙️ ภาคผนวกระดับวิศวกร (35-44)", range: [35, 44] },
  { id: "group-4", title: "🎯 ภาคเจาะลึกขั้นสูง (45-73)", range: [45, 999] }
];

let currentGroupId = null;

headers.forEach((h, index) => {
  const text = h.text;
  
  if (text === "สารบัญ" || 
      text.includes("ภาคหลัก (1-19)") || 
      text.includes("ภาคผนวกเชิงลึก (20-34)") || 
      text.includes("ภาคผนวกระดับวิศวกร (35-44)") || 
      text.includes("ภาคเจาะลึกขั้นสูง")) {
    return;
  }

  const sectionNum = getSectionNumber(text);
  if (sectionNum !== null && sectionNum >= 33 && sectionNum <= 38) {
    if (h.tag === "H2") {
      const foundGroup = groups.find(g => sectionNum >= g.range[0] && sectionNum <= g.range[1]);
      if (foundGroup) {
        currentGroupId = foundGroup.id;
      } else {
        currentGroupId = null;
      }
      console.log(`H2 Heading: "${text}" -> sectionNum: ${sectionNum} -> Group: ${currentGroupId}`);
    } else {
      console.log(`  H3 Heading: "${text}" -> Parent Group: ${currentGroupId}`);
    }
  }
});
