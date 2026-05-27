#!/usr/bin/env node
// scripts/perf-test.mjs
// Reusable performance test: client (this PC) → Vercel → Supabase → ESP32 cloud-polling
//
// Usage:
//   node scripts/perf-test.mjs [--base https://your-app.vercel.app] [--room CE-401] [--runs 20]
//
// Measures latency for representative endpoints. Each endpoint is hit N times.
// Reports min / p50 / p95 / max / avg in ms.

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
const RUNS = parseInt(args.runs || "20", 10);

const endpoints = [
  { name: "GET / (home page)",                  url: `${BASE}/` },
  { name: "GET /api/esp32/display (ESP32 poll)", url: `${BASE}/api/esp32/display?room=${ROOM}` },
  { name: "GET /api/esp32/qr (QR image)",        url: `${BASE}/api/esp32/qr?room=${ROOM}` },
  { name: "POST /api/auth/login (bad creds)",    url: `${BASE}/api/auth/login`, method: "POST", body: JSON.stringify({ username: "perfbot", password: "wrong" }) },
];

function percentile(sorted, p) {
  if (!sorted.length) return 0;
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
}

async function timeOne(ep) {
  const start = performance.now();
  let status = 0;
  let bytes = 0;
  try {
    const res = await fetch(ep.url, {
      method: ep.method || "GET",
      headers: ep.body ? { "Content-Type": "application/json" } : undefined,
      body: ep.body,
    });
    status = res.status;
    const buf = await res.arrayBuffer();
    bytes = buf.byteLength;
  } catch (err) {
    status = -1;
  }
  return { ms: performance.now() - start, status, bytes };
}

async function bench(ep) {
  const samples = [];
  let lastStatus = 0;
  let totalBytes = 0;
  for (let i = 0; i < RUNS; i++) {
    const { ms, status, bytes } = await timeOne(ep);
    samples.push(ms);
    lastStatus = status;
    totalBytes += bytes;
  }
  samples.sort((a, b) => a - b);
  return {
    name: ep.name,
    status: lastStatus,
    runs: RUNS,
    avg_ms: (samples.reduce((a, b) => a + b, 0) / samples.length).toFixed(1),
    min_ms: samples[0].toFixed(1),
    p50_ms: percentile(samples, 50).toFixed(1),
    p95_ms: percentile(samples, 95).toFixed(1),
    max_ms: samples[samples.length - 1].toFixed(1),
    avg_bytes: Math.round(totalBytes / RUNS),
  };
}

(async () => {
  console.log(`\n=== Performance Test ===`);
  console.log(`Target : ${BASE}`);
  console.log(`Room   : ${ROOM}`);
  console.log(`Runs/EP: ${RUNS}\n`);

  const results = [];
  for (const ep of endpoints) {
    process.stdout.write(`  testing ${ep.name} ... `);
    const r = await bench(ep);
    results.push(r);
    console.log(`status=${r.status} avg=${r.avg_ms}ms p95=${r.p95_ms}ms`);
  }

  console.log(`\n=== Results (ms) ===`);
  console.table(results);

  console.log(`\nInterpretation:`);
  console.log(`  - Client→Vercel cold start: see 'max_ms' (first request hits cold lambda)`);
  console.log(`  - Vercel→Supabase round trip: dominates avg_ms on DB-backed endpoints`);
  console.log(`  - Static page (/) shows pure Vercel CDN latency`);
  console.log(`  - ESP32 polling endpoint (display) shows the loop latency the device sees`);
})();
