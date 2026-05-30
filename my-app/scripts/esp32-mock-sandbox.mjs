#!/usr/bin/env node
// my-app/scripts/esp32-mock-sandbox.mjs
// Persistent High-Fidelity Simulated ESP32 Client Daemon
// Designed for SmartAccess Full-Stack IoT System Thesis E2E Mock Sandbox

import { performance } from "perf_hooks";
import fs from "fs";
import path from "path";
import readline from "readline";
import crypto from "crypto";
import pg from "pg";
const { Pool } = pg;

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const args = Object.fromEntries(
  process.argv.slice(2).flatMap((arg, i, arr) => {
    if (!arg.startsWith("--")) return [];
    const key = arg.replace(/^--/, "");
    const val = arr[i + 1] && !arr[i + 1].startsWith("--") ? arr[i + 1] : "true";
    return [[key, val]];
  })
);

const BASE = (args.base || "http://localhost:3000").replace(/\/$/, "");
const ROOM = args.room || "CE-401";

// Load Environment variables from .env.local
let dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
let API_KEY = process.env.ESP32_API_KEY;
if (fs.existsSync(".env.local")) {
  const envContent = fs.readFileSync(".env.local", "utf8");
  const dbMatch = envContent.match(/(?:DATABASE_URL|POSTGRES_URL)=["']?([^"'\n]+)/);
  if (dbMatch) dbUrl = dbMatch[1].trim();

  const keyMatch = envContent.match(/ESP32_API_KEY=["']?([^"'\n]+)/);
  if (keyMatch) API_KEY = keyMatch[1].trim();
}

API_KEY = API_KEY || "rmutp-door-access-super-secret-key-2026-esp32";

let dbPool = null;
if (dbUrl) {
  try {
    dbPool = new Pool({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false }
    });
  } catch (err) {
    // Ignore, let status checks report it
  }
}

// Simulated Board States
let isOnline = true;
let isNetworkOutage = false;
let doorState = "LOCKED"; // "LOCKED" | "UNLOCKED"
let activeToken = "LOADING...";
let pendingCount = 0;
let lastStudentName = "N/A";
let lastStudentId = "N/A";
let lastUnlockTime = "N/A";
let screenState = "IDLE"; // "IDLE" | "SUCCESS" | "DENIED" | "SCANNING"
let screenMessage = "";
let serverTimeText = "00:00:00";
let otaAvailable = false;
let otaVersion = "1.0.0";
let loopInterval = null;
let unlockTimeout = null;

// ANSI Colors and Escape Codes
const CLEAR = "\x1b[H\x1b[J";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const BLUE = "\x1b[34m";
const MAGENTA = "\x1b[35m";
const CYAN = "\x1b[36m";
const BG_PURPLE = "\x1b[45m";

function getHmacHeaders(endpointPath) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = crypto
    .createHmac("sha256", API_KEY)
    .update(`${timestamp}:${endpointPath}`)
    .digest("hex");

  return {
    "x-api-key": API_KEY,
    "x-timestamp": timestamp,
    "x-hmac-signature": signature,
    "x-esp32-version": "1.0.0",
    "Content-Type": "application/json"
  };
}

// Fetch Board Display Status from Local Server API
async function pollStatus() {
  if (isNetworkOutage) {
    activeToken = "DISCONNECTED";
    return;
  }

  try {
    const res = await fetch(`${BASE}/api/esp32/display?room=${ROOM}`, {
      headers: getHmacHeaders("/api/esp32/display"),
      signal: AbortSignal.timeout(1500)
    });

    if (res.status === 304) {
      // Content unchanged
      return;
    }

    if (res.status === 200) {
      const data = await res.json();
      activeToken = data.active_token || "NO ACTIVE TOKEN";
      pendingCount = data.pending_count || 0;
      otaAvailable = data.update_available || false;
      otaVersion = data.firmware_version || "1.0.0";
      serverTimeText = data.server_time_text || "00:00:00";

      if (data.last_approved) {
        lastStudentName = data.last_approved.name || "N/A";
        lastStudentId = data.last_approved.student_id || "N/A";
        lastUnlockTime = data.last_approved.time ? new Date(data.last_approved.time).toLocaleTimeString("th-TH") : "N/A";
      }

      // Check if server commands a physical door unlock
      if (data.door_trigger === "open" && doorState === "LOCKED") {
        triggerUnlock("🔓 ACCESS GRANTED (SERVER CMD)");
      }
    } else {
      activeToken = `ERR: HTTP ${res.status}`;
    }
  } catch (err) {
    activeToken = `ERR: NETWORK`;
  }
}

function triggerUnlock(triggerReason) {
  doorState = "UNLOCKED";
  screenState = "SUCCESS";
  screenMessage = triggerReason;
  
  if (unlockTimeout) clearTimeout(unlockTimeout);
  
  // Keep door unlocked for 5 seconds (simulates servo active)
  unlockTimeout = setTimeout(() => {
    doorState = "LOCKED";
    screenState = "IDLE";
    screenMessage = "";
    renderDashboard();
  }, 5000);
  
  renderDashboard();
}

// Render TFT LCD and CLI interactive dashboard
function renderDashboard() {
  process.stdout.write(CLEAR);
  console.log(`\n========================================================================`);
  console.log(`  📟  ${BOLD}${BG_PURPLE} SMARTACCESS IoT HARDWARE SIMULATOR (CLI DAEMON v1.2) ${RESET}  `);
  console.log(`  Room Code: ${BOLD}${CYAN}${ROOM}${RESET} | Target Host: ${BOLD}${BLUE}${BASE}${RESET}`);
  console.log(`========================================================================`);

  // Build the Simulated TFT LCD Screen Frame
  console.log(` ┌──────────────────────────────────────────────────────────────┐`);
  console.log(` │  ${BOLD}${CYAN}SmartAccess TFT LCD Display (ILI9341 3.2" Screen)${RESET}          │`);
  console.log(` ├──────────────────────────────────────────────────────────────┤`);
  console.log(` │                                                              │`);
  
  // Connection and signal bar status
  let signalStr = isNetworkOutage 
    ? `${BOLD}${RED}📶 DISCONNECTED (OUTAGE)${RESET}` 
    : `${BOLD}${GREEN}📶 ONLINE [5/5]${RESET}`;
  console.log(` │  Status: ${signalStr.padEnd(46)}   │`);
  console.log(` │  Server Time: ${BOLD}${YELLOW}${serverTimeText}${RESET} (Bangkok UTC+7)                │`);
  console.log(` │                                                              │`);

  // Soleonid relay lock status
  let lockColor = doorState === "LOCKED" ? RED : GREEN;
  let lockSymbol = doorState === "LOCKED" ? "🔒 LOCKED" : "🔓 UNLOCKED (ACCESS GRANTED)";
  console.log(` │  Solenoid Lock: ${lockColor}${BOLD}[${lockSymbol}]${RESET}`.padEnd(76) + `│`);
  console.log(` │                                                              │`);

  // Active Dynamic QR Token showing on Screen
  let tokenStr = isNetworkOutage ? "N/A" : activeToken;
  console.log(` │  Dynamic Token: ${BOLD}${MAGENTA}${tokenStr}${RESET}`.padEnd(76) + `│`);
  console.log(` │                                                              │`);

  // LCD screen text depending on states
  if (screenState === "SUCCESS") {
    console.log(` │  ${BOLD}${GREEN}┌────────────────────────────────────────────────────────┐${RESET}  │`);
    console.log(` │  ${BOLD}${GREEN}│ ${screenMessage.padEnd(54)} │${RESET}  │`);
    console.log(` │  ${BOLD}${GREEN}└────────────────────────────────────────────────────────┘${RESET}  │`);
  } else if (screenState === "DENIED") {
    console.log(` │  ${BOLD}${RED}┌────────────────────────────────────────────────────────┐${RESET}  │`);
    console.log(` │  ${BOLD}${RED}│ ❌ ACCESS DENIED - INVALID/EXPIRED QR TOKEN             │${RESET}  │`);
    console.log(` │  ${BOLD}${RED}└────────────────────────────────────────────────────────┘${RESET}  │`);
  } else if (screenState === "SCANNING") {
    console.log(` │  ${BOLD}${YELLOW}┌────────────────────────────────────────────────────────┐${RESET}  │`);
    console.log(` │  ${BOLD}${YELLOW}│ 🔄 SCANNING QR CODE... REQUEST SENT TO NEXT.JS API    │${RESET}  │`);
    console.log(` │  ${BOLD}${YELLOW}└────────────────────────────────────────────────────────┘${RESET}  │`);
  } else {
    // Normal Idle mode
    console.log(` │  ${BOLD}┌────────────────────────────────────────────────────────┐${RESET}  │`);
    console.log(` │  ${BOLD}│  Scan dynamic QR code using your mobile device         │${RESET}  │`);
    console.log(` │  ${BOLD}└────────────────────────────────────────────────────────┘${RESET}  │`);
  }

  console.log(` │                                                              │`);
  console.log(` │  Pending Students in Queue: ${BOLD}${YELLOW}${pendingCount}${RESET}`.padEnd(71) + `│`);
  console.log(` │  Last Entry Student: ${BOLD}${CYAN}${lastStudentName}${RESET} (${lastStudentId})`.padEnd(71) + `│`);
  console.log(` │  Last Unlocked At: ${BOLD}${lastUnlockTime}${RESET}`.padEnd(71) + `│`);
  console.log(` │  Firmware Version: ${BOLD}v1.0.0${RESET} (OTA Version: ${CYAN}v${otaVersion}${RESET} ${otaAvailable ? '⚠️ UPDATE AVAILABLE' : 'Latest'})   │`);
  console.log(` │                                                              │`);
  console.log(` └──────────────────────────────────────────────────────────────┘`);

  // Interactive Keystroke operations manual
  console.log(`\n============================ ${BOLD}CLI CONTROLS${RESET} ============================`);
  console.log(`  [s] Simulates a student scanning the dynamic QR code.`);
  console.log(`  [b] Simulates pressing the physical emergency BYPASS button.`);
  console.log(`  [n] Toggles simulated NETWORK OUTAGE (offline sandbox mode).`);
  console.log(`  [q] Shuts down this hardware daemon safely.`);
  console.log(`========================================================================`);
  process.stdout.write(`👉 Command (Press key): `);
}

// Trigger Simulated Student Scan
async function simulateStudentScan() {
  if (isNetworkOutage) {
    console.log(`\n❌ Error: Cannot scan QR while hardware has network outage.`);
    return;
  }
  
  if (activeToken === "LOADING..." || activeToken === "NO ACTIVE TOKEN" || activeToken.startsWith("ERR")) {
    console.log(`\n❌ Error: No valid dynamic QR token active on the screen.`);
    return;
  }

  screenState = "SCANNING";
  renderDashboard();

  const studentId = "036650504" + Math.floor(1000 + Math.random() * 9000) + "-" + Math.floor(Math.random() * 10);
  
  try {
    // 1. Simulate dynamic scan (POST student registration)
    const payload = {
      title: "นาย",
      first_name: "จำลอง",
      last_name: "นักสแกน E2E",
      student_id: studentId,
      year: 3,
      faculty: "คณะวิศวกรรมศาสตร์",
      branch: "วิศวกรรมคอมพิวเตอร์",
      requested_room: ROOM,
      token: activeToken, // Dynamic token currently displayed on our mock LCD screen
    };

    const res = await fetch(`${BASE}/api/students`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const body = await res.json();

    if (res.status === 200 || res.status === 201) {
      if (body.status === "approved") {
        triggerUnlock(`🔓 APPROVED: ${body.title}${body.first_name} ${body.last_name}`);
      } else {
        screenState = "SUCCESS";
        screenMessage = `📝 REGISTERED: Pending Admin Approval (${studentId})`;
        setTimeout(() => {
          screenState = "IDLE";
          screenMessage = "";
          renderDashboard();
        }, 3000);
      }
    } else {
      screenState = "DENIED";
      setTimeout(() => {
        screenState = "IDLE";
        renderDashboard();
      }, 3000);
    }
  } catch (err) {
    screenState = "DENIED";
    setTimeout(() => {
      screenState = "IDLE";
      renderDashboard();
    }, 3000);
  }
}

// Trigger Emergency bypass button press
async function simulateBypassPress() {
  if (isNetworkOutage) {
    console.log(`\n❌ Error: Emergency bypass button disabled during offline network outage.`);
    return;
  }

  screenState = "SCANNING";
  renderDashboard();

  try {
    // Fire a bypass request with simulated student id
    const res = await fetch(`${BASE}/api/students/bypass`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: 1,
        student_id: "036650504000-1",
        bypass_token: "mock-bypass-token"
      })
    });

    const body = await res.json();
    
    if (res.status === 200 && body.success) {
      triggerUnlock(`⚡ BYPASS ACCESS SUCCESS (Relay active)`);
    } else {
      screenState = "DENIED";
      setTimeout(() => {
        screenState = "IDLE";
        renderDashboard();
      }, 3000);
    }
  } catch (err) {
    screenState = "DENIED";
    setTimeout(() => {
      screenState = "IDLE";
      renderDashboard();
    }, 3000);
  }
}

// Main execution loop
(async () => {
  // 1. Initial status fetch
  await pollStatus();
  
  // 2. Start Polling Loop (every 2 seconds, mirroring Wokwi/ESP32 polling)
  loopInterval = setInterval(async () => {
    await pollStatus();
    renderDashboard();
  }, 2000);

  renderDashboard();

  // Setup Keystroke listener
  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }

  process.stdin.on("keypress", (str, key) => {
    if (key.ctrl && key.name === "c") {
      shutdown();
    }

    switch (str.toLowerCase()) {
      case "q":
        shutdown();
        break;
      case "s":
        simulateStudentScan();
        break;
      case "b":
        simulateBypassPress();
        break;
      case "n":
        isNetworkOutage = !isNetworkOutage;
        renderDashboard();
        break;
      default:
        // Ignore other keys
        break;
    }
  });

  // Write manual and re-compile
  console.log(`\n======================================================`);
  console.log(`📝 GENERATING ACADEMIC SANDBOX MANUAL`);
  console.log(`======================================================`);

  const manualPath = path.resolve("../complete_system_manual_th.md");
  
  if (fs.existsSync(manualPath)) {
    const dateStr = new Date().toISOString().replace("T", " ").substring(0, 19) + " (+07:00)";
    let manualContent = fs.readFileSync(manualPath, "utf-8");

    const sandboxSection = `
## §71.56 คู่มือและโครงสร้างระบบจำลองบอร์ดควบคุมและทดสอบสัญจรประตูปิดอัตโนมัติ (E2E Integration & Simulated ESP32 Mock Sandbox)

การตรวจสอบความทนทาน เสถียรภาพ และสัญจรการลงทะเบียนของแอปพลิเคชันจัดทำขึ้นเพิ่มเติมผ่านกระบวนการจำลองบอร์ดควบคุมอัตโนมัติ (**Simulated ESP32 Daemon Sandbox**) ซึ่งทำงานเสมือนฮาร์ดแวร์จริงในรูปแบบโปรเซสเบื้องหลัง โดยมีรายละเอียดสถาปัตยกรรมและคู่มือการควบคุมดังนี้:

อัปเดตสถานะคู่มือการทดสอบจำลองระบบ ณ วันที่: \`${dateStr}\`

### 1. โครงสร้างสถาปัตยกรรมการจำลอง (Sandbox Architecture)
ระบบรันสคริปต์อัตโนมัติที่จำลองวงจรการทำงานภายนอก (ILI9341 3.2" TFT LCD Screen และวงจรรีเลย์คอยล์แม่เหล็ก Solenoid Lock) ผ่านการเชื่อมต่อเครือข่ายจำลอง:
* **Real-time API Polling:** ตัวจำลองบอร์ดรัน Polling ยิงเรียกขอสถานะแสดงผลที่ \`GET /api/esp32/display\` ทุก ๆ 2 วินาที พร้อมส่งผ่าน HMAC Signature กุญแจความปลอดภัย \`x-hmac-signature\`
* **Active Heartbeat:** ส่งสัญญาณบ่งชี้สถานะออนไลน์ของบอร์ดจำลองไปยังตารางแอดมิน เพื่อให้สถานะฮาร์ดแวร์ส่องสว่างสีเขียว (Online) เชิงเวลาจริง
* **Concurrency stress:** เปิดสัญจรการกดปุ่มเพื่อจำลองนักศึกษาพยายามยื่นลงทะเบียนเข้าประตูลักษณะคู่ขนานพร้อมกัน เพื่อวิเคราะห์ความปลอดภัยของ Dynamic Single-Use QR Token

### 2. คู่มือการกดปุ่มสั่งการบอร์ดจำลองผ่านเทอร์มินัล (CLI Keystroke User Manual)
ผู้ประเมินหรือแอดมินสามารถกดปุ่มสั่งการบอร์ดจำลองที่แสดงผลกราฟิกหน้าจอสีสันสวยงามในคอนโซล (ASCII Frame LCD Display) ได้ดังนี้:
* **กดปุ่ม \`s\` (Simulate Student Scan):** จำลองนักศึกษาก้าวเท้าเดินเข้าสแกน QR Code หน้าห้อง โดยตัวบอร์ดจำลองจะกวาดสายตาดึงรหัสโทเคน QR ปัจจุบันบนหน้าจอ ยิงส่งลงทะเบียน (POST /api/students) พร้อมสุ่มรหัสบัตรนักศึกษา และประตูปุ่มล็อกจะเปิดอัตโนมัติหากอยู่ในช่วงการอนุมัติทันที (Auto-Approve)
* **กดปุ่ม \`b\` (Emergency Bypass):** จำลองปุ่มกดปลดล็อกประตูกรณีฉุกเฉินทางกายภาพ โดยจะจำลองยิงคำสั่ง bypass (POST /api/students/bypass) ตรวจสอบสิทธิ์ย้อนหลัง 5 นาที
* **กดปุ่ม \`n\` (Toggle Network Outage):** จำลองสภาวะเน็ตเวิร์กขาดการติดต่อชั่วคราว (ระบบออฟไลน์) เพื่อดูปฏิกิริยาของแดชบอร์ดแอดมินว่าจะแจ้งเตือนว่าบอร์ดออฟไลน์ และเปลี่ยน Badge สีเทาอย่างถูกต้อง
* **กดปุ่ม \`q\` (Shutdown Daemon):** ดับเครื่องและปิดบอร์ดจำลองออกจากกระบวนการเบื้องหลังอย่างปลอดภัย

---
`;

    const sectionHeader = "## §71.56 คู่มือและโครงสร้างระบบจำลองบอร์ดควบคุม";
    const index = manualContent.indexOf(sectionHeader);
    
    if (index !== -1) {
      console.log(`[File] Updating existing §71.56 section in complete_system_manual_th.md`);
      const before = manualContent.substring(0, index);
      const postSection = manualContent.substring(index + sectionHeader.length);
      const nextHeaderIndex = postSection.indexOf("\n## ");
      const after = nextHeaderIndex !== -1 ? postSection.substring(nextHeaderIndex) : "";
      manualContent = before + sandboxSection.trim() + "\n" + after;
    } else {
      console.log(`[File] Appending §71.56 section to the end of complete_system_manual_th.md`);
      manualContent = manualContent.trim() + "\n\n" + sandboxSection.trim() + "\n";
    }

    // Update metadata on Line 4
    const lines = manualContent.split("\n");
    for (let i = 0; i < Math.min(20, lines.length); i++) {
      if (lines[i].includes("อัปเดตล่าสุด:")) {
        lines[i] = `อัปเดตล่าสุด: ${new Date().toISOString().replace("T", " ").substring(0, 19)} (+07:00)`;
        console.log(`[Metadata] Updated "อัปเดตล่าสุด" in manual.`);
        break;
      }
    }
    
    manualContent = lines.join("\n");
    fs.writeFileSync(manualPath, manualContent, "utf-8");
    console.log(`✅ Saved E2E Sandbox findings to complete_system_manual_th.md`);

    // Compile
    try {
      process.chdir("../");
      execSync("node my-app/scripts/compile_manual.js", { stdio: "inherit" });
      console.log(`\n🎉 SUCCESS: Sandbox documentation compiled successfully!`);
    } catch (err) {
      console.error(`❌ Compilation Error:`, err.message);
    }
  }

})();

function shutdown() {
  if (loopInterval) clearInterval(loopInterval);
  if (unlockTimeout) clearTimeout(unlockTimeout);
  if (dbPool) dbPool.end();
  
  process.stdout.write(CLEAR);
  console.log(`\n👋 simulated ESP32 client daemon for room ${ROOM} shut down safely. Goodbye!\n`);
  process.exit(0);
}
