#!/usr/bin/env node
// scripts/api-tamper-test.mjs
// Active API tampering / MITM-style tests.
//
// Goals:
//   1. Confirm rate-limiting actually triggers (Vercel + Postgres-backed limiter).
//   2. Try to bypass rate-limit via spoofed X-Forwarded-For headers.
//   3. Replay attack: re-send a captured /api/students/bypass body.
//   4. JWT tampering: alter the cookie payload, check signature is enforced.
//   5. Mass-assignment: try to inject role=owner during /api/students POST.
//   6. SQL/XSS payloads against fields that pass sanitization.
//   7. Verify x-api-key gate on /api/esp32/display active_token.
//   8. CORS: try a cross-origin POST with Origin: evil.com — should NOT echo.
//
// Run against staging unless you accept noise in production logs.
// Usage:  node scripts/api-tamper-test.mjs --base https://project-sigma-ivory-21.vercel.app

const args = Object.fromEntries(
  process.argv.slice(2).flatMap((arg, i, arr) => {
    if (!arg.startsWith("--")) return [];
    const key = arg.replace(/^--/, "");
    const val = arr[i + 1] && !arr[i + 1].startsWith("--") ? arr[i + 1] : "true";
    return [[key, val]];
  })
);
const BASE = (args.base || "https://project-sigma-ivory-21.vercel.app").replace(/\/$/, "");
const ROOM = args.room || "CE-401";

const results = [];

async function hit(label, url, opts = {}) {
  const start = performance.now();
  try {
    const res = await fetch(url, opts);
    const ct = res.headers.get("content-type") || "";
    let body;
    body = ct.includes("json") ? await res.json().catch(() => null) : (await res.text()).slice(0, 200);
    const r = { label, url, status: res.status, ms: (performance.now() - start).toFixed(0), body };
    results.push(r);
    console.log(`[${r.status}] ${label}  (${r.ms}ms)`);
    return { res, body };
  } catch (err) {
    const r = { label, url, status: "ERR", error: err.message };
    results.push(r);
    console.log(`[ERR] ${label}: ${err.message}`);
    return null;
  }
}

(async () => {
  console.log(`\n=== API Tamper / MITM Test Suite ===\nTarget: ${BASE}\n`);

  // ─── 1. Rate limit: 8 logins ───────────────────────────────────────
  console.log("[1] Login brute-force rate limit (expect 429 after 5):");
  for (let i = 1; i <= 8; i++) {
    await hit(`login-attempt-${i}`, `${BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "tamper-test-user", password: `wrong-${i}` }),
    });
  }

  // ─── 2. Try to bypass rate limit by changing X-Forwarded-For ──────
  console.log("\n[2] Spoof X-Forwarded-For to bypass rate-limit (CDN should overwrite):");
  for (let i = 1; i <= 5; i++) {
    await hit(`spoof-xff-${i}`, `${BASE}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Forwarded-For": `10.0.0.${i}, 1.2.3.${i}`,  // attempt
        "X-Real-IP": `10.0.0.${i}`,
      },
      body: JSON.stringify({ username: "tamper-spoof", password: `wrong-${i}` }),
    });
  }

  // ─── 3. JWT tamper: fake cookie ───────────────────────────────────
  console.log("\n[3] JWT tamper — forge owner token:");
  const fakePayload = Buffer.from(JSON.stringify({ id: 1, username: "admin", role: "owner" })).toString("base64url");
  const fakeJwt = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${fakePayload}.AAAAAAAAAAAAAAAAAAAAAA`;
  await hit("jwt-forge /api/auth/me", `${BASE}/api/auth/me`, {
    headers: { Cookie: `smartaccess_admin_token=${fakeJwt}` },
  });
  await hit("jwt-forge /api/students", `${BASE}/api/students`, {
    headers: { Cookie: `smartaccess_admin_token=${fakeJwt}` },
  });

  // ─── 4. Mass-assignment + XSS on registration ─────────────────────
  console.log("\n[4] Mass-assignment + XSS payloads on /api/students:");
  await hit("mass-assign role=owner", `${BASE}/api/students`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "นาย",
      first_name: "<script>alert(1)</script>Hacker",
      last_name: "Tamper",
      student_id: "036650504099-9",
      year: 1,
      faculty: "คณะครุศาสตร์อุตสาหกรรม",
      branch: "วิศวกรรมคอมพิวเตอร์",
      role: "owner",         // mass-assign attempt
      is_active: true,
      id: 99999,             // mass-assign attempt
      requested_room: ROOM,
      token: "ffffffffffffffffffffffffffffffff",  // bogus QR
    }),
  });

  // ─── 5. SQL injection probes (parameterized PG should reject) ─────
  console.log("\n[5] SQL injection probes against /api/students/[id]:");
  await hit("sqli /api/students/1 OR 1=1", `${BASE}/api/students/1 OR 1=1`);
  await hit("sqli /api/students/1;DROP TABLE", `${BASE}/api/students/1;DROP%20TABLE%20students`);

  // ─── 6. CORS — Origin spoof ───────────────────────────────────────
  console.log("\n[6] CORS — cross-origin Origin header:");
  await hit("cors-evil-origin", `${BASE}/api/esp32/display?room=${ROOM}`, {
    headers: { Origin: "https://evil.example.com" },
  });

  // ─── 7. x-api-key gate on active_token ────────────────────────────
  console.log("\n[7] x-api-key gate on ESP32 display:");
  const { body: noKey } = await hit("no-key /api/esp32/display", `${BASE}/api/esp32/display?room=${ROOM}`) || {};
  await hit("wrong-key /api/esp32/display", `${BASE}/api/esp32/display?room=${ROOM}`, {
    headers: { "x-api-key": "wrong-key-12345" },
  });
  console.log("    → active_token in noKey response?", noKey && Object.prototype.hasOwnProperty.call(noKey, "active_token"));

  // ─── 8. Replay attack: hit same /api/esp32/qr/verify twice ────────
  console.log("\n[8] QR token replay (should fail second attempt):");
  await hit("qr-verify-bogus-1", `${BASE}/api/esp32/qr/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: "deadbeefdeadbeefdeadbeefdeadbeef", room: ROOM }),
  });
  await hit("qr-verify-bogus-2", `${BASE}/api/esp32/qr/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: "deadbeefdeadbeefdeadbeefdeadbeef", room: ROOM }),
  });

  // ─── 9. Logs limit overflow ───────────────────────────────────────
  console.log("\n[9] /api/logs?limit overflow:");
  await hit("logs limit=99999999", `${BASE}/api/logs?limit=99999999`);
  await hit("logs limit=-1", `${BASE}/api/logs?limit=-1`);

  console.log("\n=== Summary ===");
  console.table(results.map(r => ({ label: r.label, status: r.status, ms: r.ms })));

  console.log(`
Pass criteria:
  [1] Should see HTTP 429 by attempt 6.
  [2] If spoofing changes status from 429→401 every time, X-Forwarded-For is trusted → BUG.
  [3] /api/auth/me must return 401 (signature mismatch) — never 200.
  [4] Response must NOT echo role/id/is_active — and first_name must be sanitized.
  [5] Must return 400 "ID นักศึกษาต้องเป็นตัวเลข", never a 500 stack trace.
  [6] Access-Control-Allow-Origin must NOT be 'https://evil.example.com' or '*' — should be the configured app URL only.
  [7] active_token must NOT be present when x-api-key is missing or wrong.
  [8] Both must return 400 — neither should succeed.
  [9] limit must be clamped to 500; negative/zero rejected (or clamped to 1).
`);
})();
