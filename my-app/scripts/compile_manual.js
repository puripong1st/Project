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

// Configure marked options
marked.setOptions({
  gfm: true,
  breaks: true,
  headerIds: true,
  mangle: false
});

const mdPath = path.join(__dirname, '..', '..', 'complete_system_manual_th.md');
const htmlOutputPathRoot = path.join(__dirname, '..', '..', 'complete_system_manual_th.html');
const htmlOutputPathPublic = path.join(__dirname, '..', 'public', 'complete_system_manual_th.html');

console.log(`Reading manual markdown from: ${mdPath}`);
if (!fs.existsSync(mdPath)) {
  console.warn(`[WARNING] complete_system_manual_th.md not found at ${mdPath}.`);
  console.warn("This is expected on Vercel deployment if only 'my-app' is uploaded in the root context.");
  console.warn("Skipping compilation and utilizing the committed public HTML manual instead.");
  process.exit(0); // Exit successfully to prevent Vercel build failures
}
let markdown = fs.readFileSync(mdPath, 'utf8');

// Replace alerts like > [!NOTE] with beautiful HTML alerts
markdown = markdown.replace(/>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*\n>\s*([^\n]+)/gi, (match, type, content) => {
  const lowerType = type.toLowerCase();
  return `<div class="alert-box alert-${lowerType}"><strong>${type}:</strong> ${content}</div>`;
});

console.log("Compiling Markdown to HTML...");
let rawHtmlContent = marked(markdown);

// BULLETPROOF MERMAID BLOCK TRANSFORMATION
// This catches the standard <pre><code class="language-mermaid"> block, preserves newlines,
// decodes XML/HTML escapes, and transforms it into a clean <div class="mermaid"> block for Mermaid.js
const mermaidRegex = /<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/g;
rawHtmlContent = rawHtmlContent.replace(mermaidRegex, (match, code) => {
  const decodedCode = code
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
  return `<div class="mermaid">${decodedCode}</div>`;
});

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
  <link rel="preload" href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700;800&family=Inter:wght@400;500;600;700;800&family=Fira+Code:wght@400;500;600&display=swap" as="style" onload="this.onload=null;this.rel='stylesheet'">
  <noscript><link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700;800&family=Inter:wght@400;500;600;700;800&family=Fira+Code:wght@400;500;600&display=swap" rel="stylesheet"></noscript>
  
  <!-- Prism.js for code syntax highlighting -->
  <link rel="preload" href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
  <noscript><link href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css" rel="stylesheet"></noscript>
  
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

    /* Code Blocks - STRICT READABILITY FIX */
    pre {
      background-color: var(--code-bg) !important;
      color: #F8FAFC !important; /* Bright white/gray text */
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
      background-color: transparent !important;
      color: #E2E8F0 !important; /* Bright text for dark background */
      padding: 0 !important;
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
      transition: background-color 0.3s, border-color 0.3s;
    }

    /* Mermaid Loader Skeleton & Spinner */
    .mermaid-loader-skeleton {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      width: 100%;
      min-height: 250px;
      background: rgba(248, 250, 252, 0.4);
      border-radius: 8px;
      transition: background-color 0.3s;
    }
    body.dark-mode .mermaid-loader-skeleton {
      background: rgba(30, 41, 59, 0.4);
    }
    .mermaid-loader-skeleton .spinner {
      width: 32px;
      height: 32px;
      border: 3.5px solid rgba(124, 58, 237, 0.15);
      border-top-color: var(--primary);
      border-radius: 50%;
      animation: mermaid-spin 1s linear infinite;
    }
    @keyframes mermaid-spin {
      to { transform: rotate(360deg); }
    }

    /* Mermaid text readability and spacing fixes */
    .mermaid svg {
      font-family: var(--font-th) !important;
    }
    
    .mermaid .edgeLabel rect {
      fill: #FFFFFF !important;
      opacity: 0.95 !important;
    }
    
    .mermaid .edgeLabel text {
      fill: #1E293B !important;
      font-size: 11.5px !important;
      font-weight: 600 !important;
    }

    /* 🌓 COMPREHENSIVE DARK MODE DIALECT FOR MERMAID DIAGRAMS */
    body.dark-mode .mermaid {
      background: #1E293B !important; /* Premium dark background */
      border-color: #334155 !important;
    }

    /* Dark Mode Flowcharts nodes styling */
    body.dark-mode .mermaid svg g.node rect,
    body.dark-mode .mermaid svg g.node circle,
    body.dark-mode .mermaid svg g.node polygon,
    body.dark-mode .mermaid svg g.node path {
      fill: #2E1065 !important; /* Deep royal dark purple */
      stroke: #A78BFA !important; /* Glowing light purple border */
    }

    body.dark-mode .mermaid svg g.node .label,
    body.dark-mode .mermaid svg g.node text,
    body.dark-mode .mermaid svg text,
    body.dark-mode .mermaid svg tspan,
    body.dark-mode .mermaid svg span,
    body.dark-mode .mermaid svg div,
    body.dark-mode .mermaid svg .messageText,
    body.dark-mode .mermaid svg .messageText tspan,
    body.dark-mode .mermaid svg .loopText,
    body.dark-mode .mermaid svg .loopText tspan,
    body.dark-mode .mermaid svg .noteText,
    body.dark-mode .mermaid svg .noteText tspan,
    body.dark-mode .mermaid svg .labelText,
    body.dark-mode .mermaid svg .labelText tspan {
      fill: #F8FAFC !important; /* Bright crisp text */
      color: #F8FAFC !important;
    }

    body.dark-mode .mermaid svg .edgePath .path {
      stroke: #94A3B8 !important; /* Bright silver arrow lines */
    }

    body.dark-mode .mermaid svg .edgeLabel rect {
      fill: #1E293B !important; /* Dark overlay box under text on arrows */
    }

    body.dark-mode .mermaid svg .edgeLabel text {
      fill: #F8FAFC !important; /* Crisp text on arrows */
    }

    /* Dark Mode Sequence Diagrams elements */
    body.dark-mode .mermaid svg .actor {
      fill: #2E1065 !important;
      stroke: #A78BFA !important;
    }

    body.dark-mode .mermaid svg text.actor {
      fill: #F8FAFC !important;
      stroke: none !important;
    }

    body.dark-mode .mermaid svg line {
      stroke: #94A3B8 !important; /* Bright connector lines */
    }

    body.dark-mode .mermaid svg .messageText {
      fill: #F8FAFC !important;
      stroke: none !important;
    }

    body.dark-mode .mermaid svg .labelBox {
      fill: #2E1065 !important;
      stroke: #A78BFA !important;
    }

    body.dark-mode .mermaid svg .labelText {
      fill: #F8FAFC !important;
    }

    body.dark-mode .mermaid svg .loopLine {
      stroke: #94A3B8 !important;
    }

    body.dark-mode .mermaid svg .loopText {
      fill: #F8FAFC !important;
    }

    body.dark-mode .mermaid svg .note {
      fill: #312E81 !important; /* Deep dark indigo for notes */
      stroke: #818CF8 !important;
    }

    body.dark-mode .mermaid svg .noteText {
      fill: #F8FAFC !important;
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

    /* ⚡ Performance Optimizations for Large Documents */
    .mermaid, pre, .table-container, .alert-box {
      content-visibility: auto;
      contain-intrinsic-size: auto 200px;
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

  <!-- Prism.js for code rendering (Deferred for instant page load) -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js" defer></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-c.min.js" defer></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-cpp.min.js" defer></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-javascript.min.js" defer></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-typescript.min.js" defer></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-json.min.js" defer></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-bash.min.js" defer></script>

  <!-- Mermaid.js for Dynamic Diagrams (Deferred for instant page load) -->
  <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js" defer></script>

    // Reusable function to inject download triggers
    function injectDownloadButtons(div, svg, index) {
      // Create Button Container
      const btnContainer = document.createElement("div");
      btnContainer.style.position = "absolute";
      btnContainer.style.top = "12px";
      btnContainer.style.right = "12px";
      btnContainer.style.display = "flex";
      btnContainer.style.gap = "8px";
      btnContainer.style.zIndex = "10";

      // Helper to style buttons beautifully
      function styleMermaidBtn(btn) {
        btn.style.background = "linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)";
        btn.style.color = "white";
        btn.style.border = "none";
        btn.style.padding = "6px 12px";
        btn.style.borderRadius = "8px";
        btn.style.fontSize = "11.5px";
        btn.style.fontWeight = "700";
        btn.style.cursor = "pointer";
        btn.style.boxShadow = "0 4px 10px rgba(124,58,237,0.15)";
        btn.style.fontFamily = "'Sarabun', sans-serif";
        btn.style.transition = "all 0.2s";

        btn.onmouseover = () => {
          btn.style.transform = "translateY(-1px)";
          btn.style.boxShadow = "0 6px 14px rgba(124,58,237,0.25)";
        };
        btn.onmouseout = () => {
          btn.style.transform = "translateY(0)";
          btn.style.boxShadow = "0 4px 10px rgba(124,58,237,0.15)";
        };
      }

      // Create PNG Button
      const btnPng = document.createElement("button");
      btnPng.innerHTML = "🖼️ เซฟรูป PNG";
      styleMermaidBtn(btnPng);
      btnPng.addEventListener("click", function() {
        saveSvgAsPng(svg, "smartaccess_diagram_" + index + ".png");
      });

      // Create SVG Button
      const btnSvg = document.createElement("button");
      btnSvg.innerHTML = "📐 เซฟเวกเตอร์ SVG (ชัวร์สุด)";
      styleMermaidBtn(btnSvg);
      btnSvg.addEventListener("click", function() {
        saveSvgAsSvg(svg, "smartaccess_diagram_" + index + ".svg");
      });

      btnContainer.appendChild(btnPng);
      btnContainer.appendChild(btnSvg);
      div.appendChild(btnContainer);
    }

    // Lazy load and progressively render Mermaid diagrams using IntersectionObserver
    window.addEventListener("DOMContentLoaded", function() {
      // Initialize Mermaid safely now that script is loaded with 'defer'
      mermaid.initialize({
        startOnLoad: false, // CRITICAL: Stop auto-rendering to prevent mobile CPU freezing!
        theme: 'default',
        securityLevel: 'loose',
        htmlLabels: false, // Force native SVG text elements to calculate text dimensions properly
        flowchart: { useWidth: true, htmlLabels: false }
      });

      const mermaidDivs = document.querySelectorAll(".mermaid");
      
      // 1. Initialize beautiful loading skeletons and backup raw code
      mermaidDivs.forEach((div, index) => {
        const diagramNum = index + 1;
        
        // Backup raw mermaid syntax
        const rawCode = div.textContent.trim();
        div.setAttribute("data-mermaid-code", rawCode);
        div.setAttribute("data-index", diagramNum);
        div.textContent = ""; // Clear content so it doesn't flash raw code
        
        const skeleton = document.createElement("div");
        skeleton.className = "mermaid-loader-skeleton";
        skeleton.innerHTML = '<div class="spinner"></div>' +
          '<span style="font-size: 13px; color: var(--text-muted); font-weight: 600; font-family: \'Sarabun\', sans-serif;">' +
          'กำลังโหลดไดอะแกรมที่ ' + diagramNum + '...' +
          '</span>';
        div.appendChild(skeleton);
      });

      // 2. Setup IntersectionObserver to only render diagrams as the user scrolls near them
      const observer = new IntersectionObserver((entries, observerInstance) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const div = entry.target;
            observerInstance.unobserve(div); // Trigger only once
            
            const rawCode = div.getAttribute("data-mermaid-code");
            const diagramIndex = div.getAttribute("data-index");
            const skeleton = div.querySelector(".mermaid-loader-skeleton");
            
            // Restore diagram raw code for rendering
            div.textContent = rawCode;
            
            // Render this specific diagram asynchronously
            mermaid.run({
              nodes: [div]
            }).then(() => {
              // Clean up the skeleton
              if (skeleton && skeleton.parentNode === div) {
                div.removeChild(skeleton);
              }
              
              const svg = div.querySelector("svg");
              if (!svg) return;
              
              div.style.position = "relative";
              div.style.paddingTop = "54px"; // Create space for the download panel
              
              // Inject download triggers
              injectDownloadButtons(div, svg, diagramIndex);
            }).catch(err => {
              console.error("Error rendering diagram " + diagramIndex + ":", err);
              if (skeleton) {
                skeleton.innerHTML = '<span style="color: #EF4444; font-size: 13px; font-weight: 600; font-family: \'Sarabun\', sans-serif;">' +
                  '⚠️ ไม่สามารถแสดงผลไดอะแกรมที่ ' + diagramIndex + ' ได้' +
                  '</span>';
              }
            });
          }
        });
      }, {
        rootMargin: "250px 0px", // Render when diagram is within 250px of viewport
        threshold: 0.01
      });

      // 3. Observe each Mermaid container
      mermaidDivs.forEach(div => {
        observer.observe(div);
      });
    });

    // 100% Bulletproof Direct SVG Vector Download
    function saveSvgAsSvg(svgElement, fileName) {
      try {
        const svgClone = svgElement.cloneNode(true);
        const rect = svgElement.getBoundingClientRect();
        const width = rect.width || svgElement.viewBox.baseVal.width || 800;
        const height = rect.height || svgElement.viewBox.baseVal.height || 600;
        
        svgClone.setAttribute("width", width);
        svgClone.setAttribute("height", height);

        const svgString = new XMLSerializer().serializeToString(svgClone);
        let correctedSvgString = svgString;
        if (!svgString.includes('xmlns="http://www.w3.org/2000/svg"')) {
          correctedSvgString = svgString.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
        }
        
        const blob = new Blob([correctedSvgString], { type: 'image/svg+xml;charset=utf-8' });
        const URL = window.URL || window.webkitURL || window;
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (e) {
        console.error("Error saving SVG", e);
        alert("ไม่สามารถบันทึกไฟล์ SVG ได้: " + e.message);
      }
    }

    // High compatibility SVG to PNG using HTML5 canvas
    function saveSvgAsPng(svgElement, fileName) {
      try {
        const svgClone = svgElement.cloneNode(true);
        const rect = svgElement.getBoundingClientRect();
        const width = rect.width || svgElement.viewBox.baseVal.width || 800;
        const height = rect.height || svgElement.viewBox.baseVal.height || 600;
        
        svgClone.setAttribute("width", width);
        svgClone.setAttribute("height", height);

        const svgString = new XMLSerializer().serializeToString(svgClone);
        let correctedSvgString = svgString;
        if (!svgString.includes('xmlns="http://www.w3.org/2000/svg"')) {
          correctedSvgString = svgString.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
        }
        
        const blob = new Blob([correctedSvgString], { type: 'image/svg+xml;charset=utf-8' });
        const URL = window.URL || window.webkitURL || window;
        const blobURL = URL.createObjectURL(blob);
        
        const image = new Image();
        image.onload = () => {
          const scale = 2; // HD Quality
          const canvas = document.createElement('canvas');
          canvas.width = width * scale;
          canvas.height = height * scale;
          const context = canvas.getContext('2d');
          
          // White background
          context.fillStyle = '#FFFFFF';
          context.fillRect(0, 0, canvas.width, canvas.height);
          
          context.drawImage(image, 0, 0, canvas.width, canvas.height);
          
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
          console.error("Failed canvas rendering, falling back to SVG download", err);
          // If canvas fails due to security (e.g. foreignObjects on desktop Chrome), download SVG directly
          saveSvgAsSvg(svgElement, fileName.replace('.png', '.svg'));
          alert("⚠️ เบราว์เซอร์คอมพิวเตอร์ของคุณจำกัดสิทธิ์ความปลอดภัยในเครื่อง ระบบจึงสลับไปดาวน์โหลดไฟล์เป็นฟอร์แมต Vector SVG คมชัดสูงให้แทน ซึ่งสามารถนำไปใช้วางในเล่มวิจัยได้ดีเยี่ยมเช่นกันครับ!");
        };
        
        image.src = blobURL;
      } catch (e) {
        console.error("Error converting to PNG, falling back to SVG", e);
        saveSvgAsSvg(svgElement, fileName.replace('.png', '.svg'));
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
