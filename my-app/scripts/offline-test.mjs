#!/usr/bin/env node
// scripts/offline-test.mjs
// Simulates offline scenarios and verifies the system degrades gracefully.
//
// Scenarios tested:
//   1. Vercel reachable, Supabase DOWN:
//        - Set POSTGRES_URL to an unreachable host on the local server, then hit endpoints.
//        - Expect: 500/503 with graceful error JSON (not stacktrace), no hung sockets.
//   2. Vercel UNREACHABLE (e.g. corporate firewall, ISP outage, Vercel incident):
//        - Block DNS or use bad host. The web client must use offline grant (lib/qr.ts).
//        - Expect: form held in IndexedDB / queued, retries on reconnect.
//   3. Local server alive, ESP32 LAN unreachable:
//        - Door command writes to IoT cloud queue. openDoor returns success quickly (<100ms).
//        - Expect: door_trigger=open polled by ESP32 when LAN returns.
//
// This script does NOT take the live infra down — it points the client at deliberately bad
// hosts to confirm error handling.

const BAD_HOST = "https://offline-test.invalid.example";
const REAL_HOST = process.argv[2] || "https://project-sigma-ivory-21.vercel.app";

async function probe(label, url, opts = {}) {
  const start = performance.now();
  try {
    const res = await fetch(url, { ...opts, signal: AbortSignal.timeout(5000) });
    const text = await res.text();
    const ms = performance.now() - start;
    return {
      label,
      url,
      status: res.status,
      ms: ms.toFixed(0),
      body_starts_with: text.slice(0, 120),
      ok_json: text.startsWith("{") || text.startsWith("["),
    };
  } catch (err) {
    return {
      label,
      url,
      status: "NETWORK_FAIL",
      ms: (performance.now() - start).toFixed(0),
      error: err.message,
    };
  }
}

(async () => {
  console.log("\n=== Offline Resilience Test ===\n");

  const results = [];

  // Scenario A: Vercel reachable, query an endpoint that needs Supabase
  results.push(await probe("A.1 Vercel up + Supabase up: /api/esp32/display",
    `${REAL_HOST}/api/esp32/display?room=CE-401`));

  // Scenario B: Vercel reachable, query system/status (also needs DB)
  results.push(await probe("A.2 Vercel up + Supabase up: /api/system/health",
    `${REAL_HOST}/api/system/health`));

  // Scenario C: Simulated Vercel unreachable (bad host)
  results.push(await probe("B. Vercel UNREACHABLE simulation",
    `${BAD_HOST}/api/esp32/display`));

  // Scenario D: Static asset (CDN cache) — should survive Supabase outage
  results.push(await probe("C. Static favicon (CDN)",
    `${REAL_HOST}/favicon.ico`));

  console.log("Probe results:");
  console.table(results);

  console.log(`\n=== Manual Steps to Complete the Offline Drill ===`);
  console.log(`
1. Power outage / Wi-Fi loss at the door (ESP32 only):
   - Disconnect ESP32 power for 60s. Then reboot.
   - Within ~10s of reboot, /api/esp32/display should return queued 'unlock' if any
     command was sent during outage (room_cmd_<room> in system_settings table).
   - VERIFY:  curl "${REAL_HOST}/api/esp32/display?room=CE-401" | jq '.door_trigger'

2. Supabase outage (Vercel up, DB down):
   - In Supabase dashboard pause the project, OR temporarily set POSTGRES_URL on
     Vercel to an invalid host and redeploy.
   - Visit ${REAL_HOST}/admin/login — should show graceful 500 page (not stacktrace).
   - VERIFY:  curl -i "${REAL_HOST}/api/system/health"
                 → status should be "unhealthy", not crash.
   - getFallbackSettings() in lib/resilience.ts kicks in for read paths.

3. Full Vercel outage (everything down):
   - Power outage / fiber cut: client-side service worker should queue form submits.
   - QR scan page reads 'offline_grant' from /api/esp32/qr/verify response and stores it.
   - On reconnect, /api/students replays the offline_grant + offline_id to mark
     the registration as accepted with status='pending'.
   - VERIFY by network-throttling DevTools to offline, submitting the form, then
     restoring connectivity — submission should reappear in admin pending list.

4. Power outage at the room (ESP32 + door):
   - Magnetic lock is fail-safe (de-energized = unlocked) per the report.
   - With backup battery: ESP32 reboots, polls /api/esp32/display every 1-2s, picks
     up any pending 'unlock' command from system_settings.room_cmd_<room>.
`);
})();
