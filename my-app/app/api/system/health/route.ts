export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAdminFromCookie } from "@/lib/auth";
import { getPool } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/client-ip";
import { cacheGet, cacheSet } from "@/lib/kv-cache";

// Cache the latest Vercel deployment lookup — it rarely changes but the
// dashboard polls health frequently. Avoids hammering the Vercel API.
const VERCEL_DEPLOY_CACHE_KEY = "health:vercel_deployment";
const VERCEL_DEPLOY_TTL_S = 120;

// ── Types ──
interface VercelDeployment {
  uid: string;
  name: string;
  url: string;
  state: string;
  created: number;
  ready?: number;
  buildingAt?: number;
  meta?: {
    githubCommitSha?: string;
    githubCommitMessage?: string;
    githubCommitRef?: string;
  };
}

interface ApiProbeResult {
  endpoint: string;
  label: string;
  status: "up" | "down" | "slow";
  latency_ms: number;
  http_status: number | null;
}

// ── Helper: probe internal API ──
async function probeApi(
  baseUrl: string,
  path: string,
  label: string,
  cookie: string
): Promise<ApiProbeResult> {
  const start = Date.now();
  try {
    const res = await fetch(`${baseUrl}${path}`, {
      method: "GET",
      headers: { Cookie: cookie },
      signal: AbortSignal.timeout(8000),
    });
    const latency = Date.now() - start;
    return {
      endpoint: path,
      label,
      status: res.ok ? (latency > 2000 ? "slow" : "up") : "down",
      latency_ms: latency,
      http_status: res.status,
    };
  } catch {
    return {
      endpoint: path,
      label,
      status: "down",
      latency_ms: Date.now() - start,
      http_status: null,
    };
  }
}

// ── Helper: fetch latest Vercel deployment ──
async function fetchVercelDeployment(): Promise<{
  latest: VercelDeployment | null;
  error: string | null;
}> {
  const token = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;

  if (!token || !projectId) {
    return { latest: null, error: "VERCEL_TOKEN or VERCEL_PROJECT_ID not configured" };
  }

  // Serve from cache when available to cut external API calls on frequent polls.
  const cached = await cacheGet<{ latest: VercelDeployment | null; error: string | null }>(
    VERCEL_DEPLOY_CACHE_KEY
  );
  if (cached) return cached;

  try {
    const res = await fetch(
      `https://api.vercel.com/v6/deployments?projectId=${projectId}&limit=1&state=READY`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(6000),
      }
    );

    if (!res.ok) {
      return { latest: null, error: `Vercel API returned ${res.status}` };
    }

    const data = await res.json();
    const deployments = (data as { deployments?: VercelDeployment[] }).deployments;

    if (!deployments || deployments.length === 0) {
      return { latest: null, error: "No deployments found" };
    }

    const result = { latest: deployments[0], error: null };
    await cacheSet(VERCEL_DEPLOY_CACHE_KEY, result, VERCEL_DEPLOY_TTL_S);
    return result;
  } catch (err) {
    return { latest: null, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export async function GET(req: NextRequest) {
  try {
    const admin = await getAdminFromCookie();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ip = getClientIp(req);

    const rl = await rateLimit({
      key: `health:${ip}`,
      limit: 10,
      windowMs: 60 * 1000,
    });

    if (!rl.success) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      );
    }

    const pool = getPool();

    // ── Database Ping ──
    let dbStatus: "up" | "down" = "down";
    let dbLatencyMs = 0;
    let rateLimiterStatus: "up" | "down" = "down";
    let lastQrScan: string | null = null;
    let totalStudents = 0;
    let totalLogs = 0;

    try {
      const dbStart = Date.now();
      await pool.query("SELECT 1");
      dbLatencyMs = Date.now() - dbStart;
      dbStatus = "up";

      // Check rate_limits table is accessible
      await pool.query("SELECT 1 FROM rate_limits LIMIT 1");
      rateLimiterStatus = "up";
    } catch {
      // dbStatus/rateLimiterStatus remain "down"
    }

    if (dbStatus === "up") {
      // Single round-trip for counts + last door open (was 3 separate queries).
      try {
        const { rows } = await pool.query(
          `SELECT
             (SELECT COUNT(*) FROM students)     AS total_students,
             (SELECT COUNT(*) FROM access_logs)  AS total_logs,
             (SELECT timestamp FROM access_logs
                WHERE action = 'door_opened'
                ORDER BY timestamp DESC LIMIT 1)  AS last_qr_scan`
        );
        const row = rows[0] as { total_students: string; total_logs: string; last_qr_scan: string | null };
        totalStudents = parseInt(row.total_students, 10) || 0;
        totalLogs = parseInt(row.total_logs, 10) || 0;
        lastQrScan = row.last_qr_scan ?? null;
      } catch {
        // ignore
      }
    }

    // ── Memory ──
    const mem = process.memoryUsage();
    const rssMb = Math.round(mem.rss / 1024 / 1024);
    const heapUsedMb = Math.round(mem.heapUsed / 1024 / 1024);
    const heapTotalMb = Math.round(mem.heapTotal / 1024 / 1024);
    const externalMb = Math.round(mem.external / 1024 / 1024);

    // ── Vercel Runtime Info ──
    const vercelRuntime = {
      region: process.env.VERCEL_REGION || null,
      environment: process.env.VERCEL_ENV || (process.env.NODE_ENV === "production" ? "production" : "development"),
      git_sha: process.env.VERCEL_GIT_COMMIT_SHA || null,
      git_ref: process.env.VERCEL_GIT_COMMIT_REF || null,
      git_message: process.env.VERCEL_GIT_COMMIT_MESSAGE || null,
      is_vercel: !!process.env.VERCEL,
    };

    // ── Node.js Runtime ──
    const nodeRuntime = {
      version: process.version,
      platform: process.platform,
      arch: process.arch,
      uptime_seconds: Math.round(process.uptime()),
      pid: process.pid,
    };

    // ── Vercel Deployment Status (async) ──
    const vercelDeployment = await fetchVercelDeployment();

    // ── API Latency Probes ──
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (req.headers.get("x-forwarded-proto") || "https") +
        "://" +
        (req.headers.get("host") || "localhost:3000");

    const cookie = req.headers.get("cookie") || "";

    // Probes fan out to other internal endpoints (extra serverless invocations),
    // so only run them when explicitly requested via ?probe=1. Never probe
    // /api/system/health itself — that would recurse on every poll.
    const runProbes = new URL(req.url).searchParams.get("probe") === "1";
    const apiProbes = runProbes
      ? await Promise.all([
          probeApi(baseUrl, "/api/system/status", "System Status", cookie),
          probeApi(baseUrl, "/api/rooms", "Room List", cookie),
        ])
      : [];

    // ── Overall Status ──
    let status: "healthy" | "degraded" | "unhealthy";
    if (dbStatus === "up" && rateLimiterStatus === "up") {
      status = dbLatencyMs > 500 ? "degraded" : "healthy";
    } else if (dbStatus === "down") {
      status = "unhealthy";
    } else {
      status = "degraded";
    }

    const now = new Date();

    return NextResponse.json(
      {
        status,
        timestamp: now.toISOString(),
        server_time: now.toLocaleString("th-TH", { timeZone: "Asia/Bangkok" }),
        components: {
          database: {
            status: dbStatus,
            latency_ms: dbLatencyMs,
            total_students: totalStudents,
            total_logs: totalLogs,
          },
          rate_limiter: { status: rateLimiterStatus },
          memory: {
            rss_mb: rssMb,
            heap_used_mb: heapUsedMb,
            heap_total_mb: heapTotalMb,
            external_mb: externalMb,
          },
        },
        vercel_runtime: vercelRuntime,
        node_runtime: nodeRuntime,
        vercel_deployment: vercelDeployment.latest
          ? {
              uid: vercelDeployment.latest.uid,
              url: vercelDeployment.latest.url,
              state: vercelDeployment.latest.state,
              created: new Date(vercelDeployment.latest.created).toISOString(),
              ready: vercelDeployment.latest.ready
                ? new Date(vercelDeployment.latest.ready).toISOString()
                : null,
              git_sha: vercelDeployment.latest.meta?.githubCommitSha || null,
              git_message: vercelDeployment.latest.meta?.githubCommitMessage || null,
              git_ref: vercelDeployment.latest.meta?.githubCommitRef || null,
            }
          : null,
        vercel_deployment_error: vercelDeployment.error,
        api_probes: apiProbes,
        last_qr_scan: lastQrScan,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("[Health GET Error]:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
