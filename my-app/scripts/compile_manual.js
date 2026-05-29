const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("Checking dependencies...");
try {
  require.resolve('marked');
} catch (e) {
  console.log("Installing 'marked' library for high-performance markdown compilation...");
  execSync('npm install marked --no-save', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
}

const { marked } = require('marked');

// Configure marked options
marked.setOptions({
  gfm: true,
  breaks: true,
  headerIds: true,
  mangle: false
});

const mdPath = path.join(__dirname, '..', '..', 'complete_system_manual_th.md');
const htmlOutputPath = path.join(__dirname, '..', '..', 'complete_system_manual_th.html');

console.log(`Reading manual markdown from: ${mdPath}`);
let markdown = fs.readFileSync(mdPath, 'utf8');

// Replace alerts like > [!NOTE] with beautiful HTML alerts
markdown = markdown.replace(/>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*\n>\s*([^\n]+)/gi, (match, type, content) => {
  const lowerType = type.toLowerCase();
  return `<div class="alert-box alert-${lowerType}"><strong>${type}:</strong> ${content}</div>`;
});

console.log("Compiling Markdown to HTML...");
const rawHtmlContent = marked(markdown);

console.log("Injecting premium responsive CSS, print styles, and interactive navigation...");

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
      line-height: 1.7;
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
      z-index: 100;
      flex-shrink: 0;
    }

    .sidebar-header {
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 2px dashed var(--border);
      text-align: center;
    }

    .sidebar-logo {
      font-size: 20px;
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
      font-size: 15px;
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

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 28px 0;
      font-size: 14px;
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

    /* Responsive adjustments */
    @media (max-width: 1024px) {
      .sidebar {
        display: none; /* Hide sidebar on small tablets/mobile */
      }
      .main-content {
        padding: 24px;
      }
      .content-card {
        padding: 24px;
      }
    }

    /* 🖨️ PRINT OPTIMIZED CSS (Save to PDF) */
    @media print {
      body {
        background-color: white !important;
        color: black !important;
        font-size: 12pt;
      }
      .sidebar, .header-panel, .back-to-top, .sidebar-search {
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

  <div class="app-container">
    <!-- Sidebar Left -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-logo">SmartAccess</div>
        <div class="sidebar-subtitle">Thesis System Manual</div>
      </div>
      <input type="text" id="searchInput" class="sidebar-search" placeholder="🔍 ค้นหาหัวข้อคู่มือ...">
      <ul class="toc-menu" id="tocMenu">
        <!-- Will be populated dynamically or static list -->
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

  <!-- Mermaid.js for Diagrams -->
  <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
  <script>
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      securityLevel: 'loose'
    });
  </script>

  <script>
    // Build floating TOC sidebar dynamically from h2 elements
    document.addEventListener("DOMContentLoaded", function() {
      const headers = document.querySelectorAll("#compiledContent h2");
      const tocMenu = document.getElementById("tocMenu");
      
      headers.forEach((h, index) => {
        // Set id if missing
        if (!h.id) {
          h.id = "sec-auto-" + index;
        }
        
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = "#" + h.id;
        a.title = h.textContent;
        a.textContent = h.textContent;
        li.appendChild(a);
        tocMenu.appendChild(li);
      });
    });

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

console.log(`Writing fully pre-rendered static HTML to: ${htmlOutputPath}`);
fs.writeFileSync(htmlOutputPath, htmlTemplate, 'utf8');
console.log("Success! Compiled complete_system_manual_th.html is ready!");
