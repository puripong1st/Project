export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getAdminFromCookie } from "@/lib/auth";
import { getPool } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/client-ip";

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

    // Database ping
    let dbStatus: "up" | "down" = "down";
    let dbLatencyMs = 0;
    let rateLimiterStatus: "up" | "down" = "down";
    let lastQrScan: string | null = null;

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
      try {
        const { rows } = await pool.query(
          `SELECT timestamp FROM access_logs
           WHERE action = 'door_opened'
           ORDER BY timestamp DESC
           LIMIT 1`
        );
        if (rows.length > 0) {
          lastQrScan = (rows[0] as { timestamp: string }).timestamp;
        }
      } catch {
        // ignore
      }
    }

    const mem = process.memoryUsage();
    const rssMb = Math.round(mem.rss / 1024 / 1024);
    const heapUsedMb = Math.round(mem.heapUsed / 1024 / 1024);
    const uptimeSeconds = Math.floor(process.uptime());

    // Determine overall status
    let status: "healthy" | "degraded" | "unhealthy";
    if (dbStatus === "up" && rateLimiterStatus === "up") {
      status = dbLatencyMs > 500 ? "degraded" : "healthy";
    } else if (dbStatus === "down") {
      status = "unhealthy";
    } else {
      status = "degraded";
    }

    return NextResponse.json(
      {
        status,
        timestamp: new Date().toISOString(),
        components: {
          database: { status: dbStatus, latency_ms: dbLatencyMs },
          rate_limiter: { status: rateLimiterStatus },
          memory: { rss_mb: rssMb, heap_used_mb: heapUsedMb },
        },
        uptime_seconds: uptimeSeconds,
        last_qr_scan: lastQrScan,
      },
      {
        headers: { "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0" },
      }
    );
  } catch (error) {
    console.error("[Health GET Error]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
