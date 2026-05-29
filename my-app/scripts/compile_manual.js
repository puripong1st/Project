const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("Checking dependencies...");
try {
  require.resolve('marked');
} catch (e) {
  console.log("Installing 'marked' library...");
  execSync('npm install marked --no-save', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
}

const { marked } = require('marked');

// Custom HTML escaper
function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Intercept code blocks for Mermaid rendering and Prism syntax highlighting
const renderer = {
  code(codeBlock) {
    const codeText = typeof codeBlock === 'string' ? codeBlock : codeBlock.text;
    const lang = typeof codeBlock === 'object' ? (codeBlock.lang || '') : '';
    
    if (lang === 'mermaid') {
      return `<div class="mermaid">${codeText}</div>`;
    }
    
    return `<pre><code class="language-${lang || 'text'}">${escapeHtml(codeText)}</code></pre>`;
  }
};

marked.use({ renderer });

const mdPath = path.join(__dirname, '..', '..', 'complete_system_manual_th.md');
const htmlOutputPathRoot = path.join(__dirname, '..', '..', 'complete_system_manual_th.html');
const htmlOutputPathPublic = path.join(__dirname, '..', 'public', 'complete_system_manual_th.html');

console.log(`Reading manual markdown from: ${mdPath}`);
let markdown = fs.readFileSync(mdPath, 'utf8');

// Replace alerts like > [!NOTE] with beautiful HTML alerts
markdown = markdown.replace(/>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*\n>\s*([^\n]+)/gi, (match, type, content) => {
  const lowerType = type.toLowerCase();
  return `<div class="alert-box alert-${lowerType}"><strong>${type}:</strong> ${content}</div>`;
});

console.log("Compiling Markdown to HTML...");
const rawHtmlContent = marked(markdown);

console.log("Injecting premium responsive CSS (fully supporting Mobile & iPad), print styles, and interactive navigation...");

const htmlTemplate = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>คู่มือระบบควบคุมประตู SmartAccess (Thesis Manual)</title>
  
  <!-- Google Fonts & Icons -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700;800&family=Inter:wght@400;500;600;700;800&family=Fira+Code:wght@400;500;600&display=swap" rel="stylesheet">
  
  <!-- Prism.js for code syntax highlighting -->
  <link href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css" rel="stylesheet" />
  
  <style>
    :root {
      --primary: #7C3AED;      /* Purple */
      --primary-dark: #6D28D9;
      --primary-pale: rgba(124, 58, 237, 0.05);
      --secondary: #DB2777;    /* Pink */
      --secondary-dark: #C2185B;
      --bg-primary: #F8FAFC;
      --bg-card: #FFFFFF;
      --text-main: #1E293B;
      --text-muted: #64748B;
      --border: #E2E8F0;
      --code-bg: #0F172A;
      --shadow: 0 10px 25px -5px rgba(124, 58, 237, 0.05), 0 8px 10px -6px rgba(124, 58, 237, 0.05);
      --font-th: 'Sarabun', sans-serif;
      --font-mono: 'Fira Code', monospace;
    }

    body.dark-mode {
      --bg-primary: #0F172A;
      --bg-card: #1E293B;
      --text-main: #F1F5F9;
      --text-muted: #94A3B8;
      --border: #334155;
      --primary-pale: rgba(139, 92, 246, 0.15);
      --shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
    }

    * {
      box-sizing: border-box;
      scroll-behavior: smooth;
    }

    body {
      margin: 0;
      padding: 0;
      font-family: var(--font-th);
      background-color: var(--bg-primary);
      color: var(--text-main);
      line-height: 1.75;
      font-size: 15.5px;
      transition: background-color 0.3s, color 0.3s;
    }

    /* Layout Wrapper */
    .app-container {
      display: flex;
      max-width: 1600px;
      margin: 0 auto;
      min-height: 100vh;
      position: relative;
    }

    /* Mobile Header Panel */
    .mobile-nav-bar {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 56px;
      background: var(--bg-card);
      border-bottom: 1px solid var(--border);
      z-index: 1000;
      padding: 0 16px;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    }

    .mobile-logo {
      font-weight: 800;
      font-size: 17px;
      background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .btn-hamburger {
      background: var(--primary-pale);
      border: 1px solid var(--border);
      color: var(--primary);
      padding: 6px 12px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 13px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    /* Sidebar Navigation */
    .sidebar {
      width: 320px;
      height: 100vh;
      position: sticky;
      top: 0;
      border-right: 1px solid var(--border);
      background-color: var(--bg-card);
      padding: 24px;
      overflow-y: auto;
      z-index: 99;
      flex-shrink: 0;
      transition: transform 0.3s ease;
    }

    .sidebar-header {
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 2px dashed var(--border);
      text-align: center;
    }

    .sidebar-logo {
      font-size: 21px;
      font-weight: 800;
      background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 4px;
    }

    .sidebar-subtitle {
      font-size: 11px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .sidebar-search {
      width: 100%;
      padding: 10px 14px;
      border-radius: 10px;
      border: 1px solid var(--border);
      background-color: var(--bg-primary);
      color: var(--text-main);
      font-family: var(--font-th);
      font-size: 13px;
      margin-bottom: 20px;
      outline: none;
      transition: border-color 0.2s;
    }

    .sidebar-search:focus {
      border-color: var(--primary);
    }

    .toc-menu {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .toc-menu li {
      margin-bottom: 4px;
    }

    .toc-menu a {
      display: block;
      padding: 8px 12px;
      color: var(--text-main);
      text-decoration: none;
      font-size: 13.5px;
      border-radius: 8px;
      transition: all 0.2s;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .toc-menu a:hover {
      background-color: var(--bg-primary);
      color: var(--primary);
      padding-left: 16px;
    }

    /* Main Content Area */
    .main-content {
      flex: 1;
      padding: 48px 64px;
      overflow-x: hidden;
      background-color: var(--bg-primary);
      min-width: 0;
    }

    .content-card {
      background-color: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 56px;
      box-shadow: var(--shadow);
      transition: background-color 0.3s, border-color 0.3s;
    }

    /* Typography */
    h1 {
      font-size: 32px;
      font-weight: 800;
      color: var(--primary);
      line-height: 1.3;
      margin-top: 0;
      margin-bottom: 24px;
      border-bottom: 3px solid var(--border);
      padding-bottom: 16px;
    }

    h2 {
      font-size: 24px;
      font-weight: 750;
      color: var(--primary-dark);
      margin-top: 48px;
      margin-bottom: 20px;
      border-bottom: 2px solid var(--border);
      padding-bottom: 8px;
    }

    body.dark-mode h2 {
      color: #A78BFA;
    }

    h3 {
      font-size: 19px;
      font-weight: 700;
      color: var(--secondary);
      margin-top: 32px;
      margin-bottom: 16px;
    }

    p, li {
      color: var(--text-main);
      font-size: 15.5px;
    }

    ul, ol {
      padding-left: 24px;
      margin-bottom: 20px;
    }

    li {
      margin-bottom: 8px;
    }

    /* Links */
    a {
      color: var(--primary);
      text-decoration: none;
      font-weight: 600;
    }

    a:hover {
      text-decoration: underline;
    }

    /* Tables responsive wrapping */
    .table-container {
      width: 100%;
      overflow-x: auto;
      margin: 28px 0;
      border-radius: 8px;
      border: 1px solid var(--border);
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
      min-width: 600px;
    }

    th, td {
      padding: 12px 16px;
      border: 1px solid var(--border);
      text-align: left;
    }

    th {
      background-color: var(--bg-primary);
      font-weight: 700;
      color: var(--primary-dark);
    }

    tr:nth-child(even) {
      background-color: rgba(124, 58, 237, 0.02);
    }

    /* Code Blocks */
    pre {
      background-color: var(--code-bg) !important;
      border-radius: 12px;
      padding: 20px !important;
      overflow-x: auto;
      margin: 24px 0;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
    }

    code {
      font-family: var(--font-mono);
      font-size: 13.5px;
      background-color: rgba(124, 58, 237, 0.08);
      color: var(--primary-dark);
      padding: 2px 6px;
      border-radius: 6px;
      word-break: break-word;
    }

    body.dark-mode code {
      color: #F472B6;
      background-color: rgba(219, 39, 119, 0.15);
    }

    pre code {
      background-color: transparent;
      color: inherit;
      padding: 0;
      border-radius: 0;
      word-break: normal;
    }

    /* Mermaid Diagrams Styling */
    .mermaid {
      background: white !important;
      padding: 24px;
      border-radius: 12px;
      border: 1px solid var(--border);
      margin: 28px 0;
      display: flex;
      justify-content: center;
      box-shadow: var(--shadow);
      overflow-x: auto;
      position: relative; /* Added for absolute positioning of download button */
    }

    /* Alert Boxes (Callouts) */
    .alert-box {
      padding: 16px 20px;
      border-left: 4px solid #7C3AED;
      border-radius: 8px;
      margin: 24px 0;
      background-color: rgba(124, 58, 237, 0.04);
      font-size: 14.5px;
    }

    .alert-note {
      border-left-color: #3B82F6;
      background-color: rgba(59, 130, 246, 0.04);
    }
    .alert-tip {
      border-left-color: #10B981;
      background-color: rgba(16, 185, 129, 0.04);
    }
    .alert-warning {
      border-left-color: #F59E0B;
      background-color: rgba(245, 158, 11, 0.04);
    }
    .alert-caution {
      border-left-color: #EF4444;
      background-color: rgba(239, 68, 68, 0.04);
    }

    /* Header Panel with utilities */
    .header-panel {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-bottom: 24px;
    }

    .btn-tool {
      background: var(--bg-card);
      border: 1px solid var(--border);
      color: var(--text-main);
      padding: 10px 18px;
      border-radius: 10px;
      cursor: pointer;
      font-family: var(--font-th);
      font-size: 13.5px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.02);
      transition: all 0.2s;
    }

    .btn-tool:hover {
      border-color: var(--primary);
      color: var(--primary);
      transform: translateY(-1px);
    }

    /* Backdrop Sidebar Overlay for mobile */
    .sidebar-overlay {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(15, 23, 42, 0.5);
      backdrop-filter: blur(4px);
      z-index: 98;
    }

    .sidebar-overlay.active {
      display: block;
    }

    /* Back to Top button */
    .back-to-top {
      position: fixed;
      bottom: 30px;
      right: 30px;
      width: 46px;
      height: 46px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
      color: white;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      box-shadow: 0 4px 12px rgba(124,58,237,0.3);
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s;
      z-index: 999;
    }

    .back-to-top.visible {
      opacity: 1;
      visibility: visible;
    }

    /* 📱📱 HIGH RESPONSIVENESS FOR TABLET (iPad) & MOBILE 📱📱 */
    @media (max-width: 1024px) {
      .mobile-nav-bar {
        display: flex; /* Show top action bar on Mobile/iPad */
      }

      .app-container {
        padding-top: 56px; /* Offset for top bar */
      }

      .sidebar {
        position: fixed;
        top: 0;
        left: 0;
        transform: translateX(-100%); /* Hide sidebar offscreen initially */
        z-index: 999;
        height: 100vh;
        box-shadow: 10px 0 25px rgba(0,0,0,0.1);
      }

      .sidebar.active {
        transform: translateX(0); /* Slide in sidebar */
      }

      .main-content {
        padding: 24px 20px;
      }

      .content-card {
        padding: 32px 24px;
        border-radius: 14px;
      }

      h1 {
        font-size: 26px;
      }

      h2 {
        font-size: 20px;
        margin-top: 36px;
      }

      h3 {
        font-size: 17px;
      }

      pre {
        padding: 14px !important;
      }

      code {
        font-size: 12.5px;
      }
      
      .header-panel {
        margin-top: 8px;
        justify-content: center;
      }
    }

    /* 🖨️ PRINT OPTIMIZED CSS (Save to PDF) */
    @media print {
      body {
        background-color: white !important;
        color: black !important;
        font-size: 12pt;
      }
      .sidebar, .header-panel, .back-to-top, .sidebar-search, .mobile-nav-bar, .sidebar-overlay {
        display: none !important;
      }
      .main-content {
        padding: 0 !important;
        margin: 0 !important;
        width: 100% !important;
      }
      .content-card {
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
        background: transparent !important;
      }
      pre, code {
        background-color: #f1f5f9 !important;
        color: black !important;
        border: 1px solid #cbd5e1 !important;
        page-break-inside: avoid;
      }
      .mermaid {
        border: 1px solid var(--border) !important;
        box-shadow: none !important;
        page-break-inside: avoid;
      }
      h1, h2, h3 {
        page-break-after: avoid;
        color: black !important;
      }
      table {
        page-break-inside: auto;
      }
      tr {
        page-break-inside: avoid;
        page-break-after: auto;
      }
    }
  </style>
</head>
<body>

  <!-- Top bar for Mobile & iPad -->
  <header class="mobile-nav-bar">
    <button class="btn-hamburger" onclick="toggleSidebar()">
      ☰ สารบัญ / เมนู
    </button>
    <div class="mobile-logo">SmartAccess Manual</div>
  </header>

  <!-- Mobile Sidebar Backdrop Overlay -->
  <div class="sidebar-overlay" id="sidebarOverlay" onclick="toggleSidebar()"></div>

  <div class="app-container">
    <!-- Sidebar Left -->
    <aside class="sidebar" id="appSidebar">
      <div class="sidebar-header">
        <div class="sidebar-logo">SmartAccess</div>
        <div class="sidebar-subtitle">Thesis System Manual</div>
      </div>
      <input type="text" id="searchInput" class="sidebar-search" placeholder="🔍 ค้นหาหัวข้อคู่มือ...">
      <ul class="toc-menu" id="tocMenu">
        <!-- Will be populated dynamically -->
      </ul>
    </aside>

    <!-- Main Content Area -->
    <main class="main-content">
      <div class="header-panel">
        <button class="btn-tool" onclick="toggleDarkMode()">
          🌓 <span id="themeText">โหมดมืด</span>
        </button>
        <button class="btn-tool" onclick="window.print()">
          🖨️ บันทึกเป็น PDF / สั่งพิมพ์
        </button>
      </div>

      <article class="content-card" id="compiledContent">
        ${rawHtmlContent}
      </article>
    </main>
  </div>

  <button class="back-to-top" id="btnBackToTop" onclick="scrollToTop()" title="กลับไปด้านบน">
    ▲
  </button>

  <!-- Prism.js for code rendering -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-c.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-cpp.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-javascript.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-typescript.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-json.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-bash.min.js"></script>

  <!-- Mermaid.js for Dynamic Diagrams -->
  <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
  <script>
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      securityLevel: 'loose',
      flowchart: { useWidth: true, htmlLabels: true }
    });

    // Automatically inject "Download PNG" buttons after Mermaid renders diagrams
    window.addEventListener("load", function() {
      setTimeout(function() {
        const mermaidDivs = document.querySelectorAll(".mermaid");
        mermaidDivs.forEach((div, index) => {
          const svg = div.querySelector("svg");
          if (!svg) return;

          div.style.position = "relative";
          div.style.paddingTop = "54px"; // Spacing for absolute button

          // Create Download Button
          const btn = document.createElement("button");
          btn.innerHTML = "📥 เซฟภาพ PNG";
          btn.style.position = "absolute";
          btn.style.top = "12px";
          btn.style.right = "12px";
          btn.style.background = "linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)";
          btn.style.color = "white";
          btn.style.border = "none";
          btn.style.padding = "7px 14px";
          btn.style.borderRadius = "8px";
          btn.style.fontSize = "12px";
          btn.style.fontWeight = "700";
          btn.style.cursor = "pointer";
          btn.style.boxShadow = "0 4px 10px rgba(124,58,237,0.2)";
          btn.style.fontFamily = "'Sarabun', sans-serif";
          btn.style.transition = "all 0.2s";
          btn.style.zIndex = "10";

          btn.onmouseover = () => {
            btn.style.transform = "translateY(-1px)";
            btn.style.boxShadow = "0 6px 14px rgba(124,58,237,0.3)";
          };
          btn.onmouseout = () => {
            btn.style.transform = "translateY(0)";
            btn.style.boxShadow = "0 4px 10px rgba(124,58,237,0.2)";
          };

          btn.addEventListener("click", function() {
            saveSvgAsPng(svg, "smartaccess_diagram_" + (index + 1) + ".png");
          });

          div.appendChild(btn);
        });
      }, 1500);
    });

    // Convert SVG to high-quality PNG and trigger download
    function saveSvgAsPng(svgElement, fileName) {
      try {
        const svgString = new XMLSerializer().serializeToString(svgElement);
        let correctedSvgString = svgString;
        if (!svgString.match(/^<svg[^>]+xmlns="http:\\/\\/www\\.w3\\.org\\/2000\\/svg"/)) {
          correctedSvgString = svgString.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
        }
        
        const svgBlob = new Blob([correctedSvgString], { type: 'image/svg+xml;charset=utf-8' });
        const URL = window.URL || window.webkitURL || window;
        const blobURL = URL.createObjectURL(svgBlob);
        
        const image = new Image();
        image.onload = () => {
          // 2x Scaling for HD quality
          const scale = 2;
          const rect = svgElement.getBoundingClientRect();
          const width = (rect.width || 800) * scale;
          const height = (rect.height || 600) * scale;
          
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const context = canvas.getContext('2d');
          
          // White background
          context.fillStyle = '#FFFFFF';
          context.fillRect(0, 0, width, height);
          
          context.drawImage(image, 0, 0, width, height);
          
          const pngURL = canvas.toDataURL('image/png');
          const downloadLink = document.createElement('a');
          downloadLink.href = pngURL;
          downloadLink.download = fileName;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          
          URL.revokeObjectURL(blobURL);
        };
        image.onerror = (err) => {
          console.error("Failed to load SVG into image", err);
          alert("ไม่สามารถแปลงรูปภาพได้ กรุณาลองเซฟผ่านเบราว์เซอร์โดยตรง");
        };
        image.src = blobURL;
      } catch (e) {
        console.error("Error converting SVG to PNG", e);
        alert("เกิดข้อผิดพลาดในการแปลงรูปภาพ: " + e.message);
      }
    }
  </script>

  <script>
    // Build floating TOC sidebar dynamically from h2 elements
    document.addEventListener("DOMContentLoaded", function() {
      const headers = document.querySelectorAll("#compiledContent h2");
      const tocMenu = document.getElementById("tocMenu");
      
      headers.forEach((h, index) => {
        if (!h.id) {
          h.id = "sec-auto-" + index;
        }
        
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = "#" + h.id;
        a.title = h.textContent;
        a.textContent = h.textContent;
        a.addEventListener("click", () => {
          if (window.innerWidth <= 1024) {
            toggleSidebar();
          }
        });
        li.appendChild(a);
        tocMenu.appendChild(li);
      });

      // Wrap tables in responsive wrapper div
      const tables = document.querySelectorAll("#compiledContent table");
      tables.forEach(table => {
        const wrapper = document.createElement("div");
        wrapper.className = "table-container";
        table.parentNode.insertBefore(wrapper, table);
        wrapper.appendChild(table);
      });
    });

    // Mobile Sidebar toggle function
    function toggleSidebar() {
      const sidebar = document.getElementById("appSidebar");
      const overlay = document.getElementById("sidebarOverlay");
      sidebar.classList.toggle("active");
      overlay.classList.toggle("active");
    }

    // Simple search inside Sidebar
    const searchInput = document.getElementById("searchInput");
    searchInput.addEventListener("input", function(e) {
      const query = e.target.value.toLowerCase();
      const links = document.querySelectorAll("#tocMenu li");
      links.forEach(link => {
        const text = link.textContent.toLowerCase();
        if (text.includes(query)) {
          link.style.display = "block";
        } else {
          link.style.display = "none";
        }
      });
    });

    // Dark Mode Toggle
    function toggleDarkMode() {
      document.body.classList.toggle("dark-mode");
      const isDark = document.body.classList.contains("dark-mode");
      document.getElementById("themeText").textContent = isDark ? "โหมดสว่าง" : "โหมดมืด";
    }

    // Scroll to Top
    const btnBackToTop = document.getElementById("btnBackToTop");
    window.onscroll = function() {
      if (document.body.scrollTop > 300 || document.documentElement.scrollTop > 300) {
        btnBackToTop.classList.add("visible");
      } else {
        btnBackToTop.classList.remove("visible");
      }
    };

    function scrollToTop() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  </script>
</body>
</html>`;

console.log(`Writing fully pre-rendered static HTML to root: ${htmlOutputPathRoot}`);
fs.writeFileSync(htmlOutputPathRoot, htmlTemplate, 'utf8');

console.log(`Writing fully pre-rendered static HTML to public: ${htmlOutputPathPublic}`);
fs.writeFileSync(htmlOutputPathPublic, htmlTemplate, 'utf8');

console.log("Success! Compiled complete_system_manual_th.html in both locations with full Mobile/iPad support, Mermaid renderer, and PNG download triggers is ready!");
