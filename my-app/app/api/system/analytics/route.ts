// app/api/system/analytics/route.ts — Dashboard analytics queries
import { NextRequest, NextResponse } from "next/server";
import { initDatabase, getPool } from "@/lib/db";
import { getAdminFromCookie } from "@/lib/auth";
import { cacheGet, cacheSet } from "@/lib/kv-cache";

let initialized = false;
async function ensureInit() {
  if (!initialized) { await initDatabase(); initialized = true; }
}

// Analytics aggregations scan up to 30 days of logs — heavy on free Supabase.
// Cache results for 120s (KV when configured, in-memory fallback otherwise).
const ANALYTICS_TTL_S = 120;

export async function GET(req: NextRequest) {
  await ensureInit();
  const admin = await getAdminFromCookie();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const pool = getPool();
  const { searchParams } = new URL(req.url);
  const metric = searchParams.get("metric") || "all";

  const cacheKey = `analytics:${metric}`;
  const cached = await cacheGet<Record<string, unknown>>(cacheKey);
  if (cached) {
    return NextResponse.json(cached, {
      headers: { "Cache-Control": "private, max-age=60" },
    });
  }

  try {
    const results: Record<string, unknown> = {};

    // 1. Peak hours heatmap — ชั่วโมงไหนมีการเข้ามากสุด (7 วัน × 24 ชม.)
    if (metric === "all" || metric === "heatmap") {
      const { rows: heatRows } = await pool.query(`
        SELECT
          EXTRACT(DOW FROM timestamp AT TIME ZONE 'Asia/Bangkok')::int  AS day_of_week,
          EXTRACT(HOUR FROM timestamp AT TIME ZONE 'Asia/Bangkok')::int AS hour,
          COUNT(*) AS count
        FROM access_logs
        WHERE action IN ('door_opened', 'approved')
          AND timestamp >= NOW() - INTERVAL '30 days'
          AND room_code NOT IN ('default', 'system') AND room_code IS NOT NULL
        GROUP BY day_of_week, hour
        ORDER BY day_of_week, hour
      `);
      results.heatmap = heatRows;
    }

    // 2. Approval rate per admin — แต่ละแอดมินอนุมัติ/ปฏิเสธเท่าไหร่
    if (metric === "all" || metric === "admin_stats") {
      const { rows: adminRows } = await pool.query(`
        SELECT
          a.full_name,
          a.role,
          COUNT(*) FILTER (WHERE al.action = 'approved') AS approved_count,
          COUNT(*) FILTER (WHERE al.action = 'rejected') AS rejected_count,
          COUNT(*) FILTER (WHERE al.action = 'door_opened') AS door_opened_count,
          ROUND(
            COUNT(*) FILTER (WHERE al.action = 'approved') * 100.0
            / NULLIF(COUNT(*) FILTER (WHERE al.action IN ('approved','rejected')), 0),
            1
          ) AS approval_rate_pct,
          MAX(al.timestamp) AS last_action_at
        FROM admin_users a
        LEFT JOIN access_logs al ON al.performed_by = a.id
          AND al.timestamp >= NOW() - INTERVAL '30 days'
        WHERE a.is_active = TRUE
        GROUP BY a.id, a.full_name, a.role
        ORDER BY approved_count DESC
      `);
      results.admin_stats = adminRows;
    }

    // 3. Room utilization — ห้องไหนถูกใช้เยอะสุด
    if (metric === "all" || metric === "room_utilization") {
      const { rows: roomRows } = await pool.query(`
        SELECT
          COALESCE(s.requested_room, al.room_code, 'unknown') AS room,
          COUNT(*) FILTER (WHERE al.action = 'door_opened')  AS door_opens,
          COUNT(*) FILTER (WHERE al.action = 'approved')     AS approvals,
          COUNT(*) FILTER (WHERE al.action = 'registered')   AS registrations,
          COUNT(*) FILTER (WHERE al.action = 'rejected')     AS rejections,
          COUNT(DISTINCT DATE(al.timestamp AT TIME ZONE 'Asia/Bangkok')) AS active_days
        FROM access_logs al
        LEFT JOIN students s ON al.student_id = s.id
        WHERE al.timestamp >= NOW() - INTERVAL '30 days'
          AND COALESCE(s.requested_room, al.room_code) NOT IN ('default', 'system', 'unknown')
          AND COALESCE(s.requested_room, al.room_code) IS NOT NULL
        GROUP BY 1
        ORDER BY door_opens DESC
        LIMIT 20
      `);
      results.room_utilization = roomRows;
    }

    // 4. Daily trend — 14 วันล่าสุด
    if (metric === "all" || metric === "daily_trend") {
      const { rows: trendRows } = await pool.query(`
        SELECT
          DATE(timestamp AT TIME ZONE 'Asia/Bangkok') AS date,
          COUNT(*) FILTER (WHERE action = 'registered') AS registrations,
          COUNT(*) FILTER (WHERE action = 'approved')   AS approvals,
          COUNT(*) FILTER (WHERE action = 'rejected')   AS rejections,
          COUNT(*) FILTER (WHERE action = 'door_opened') AS door_opens
        FROM access_logs
        WHERE timestamp >= NOW() - INTERVAL '14 days'
          AND room_code NOT IN ('default', 'system') AND room_code IS NOT NULL
        GROUP BY date
        ORDER BY date ASC
      `);
      results.daily_trend = trendRows;
    }

    // 5. Summary KPIs
    if (metric === "all" || metric === "kpi") {
      const { rows: kpiRows } = await pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE action = 'registered' AND timestamp >= NOW() - INTERVAL '7 days') AS reg_7d,
          COUNT(*) FILTER (WHERE action = 'approved'   AND timestamp >= NOW() - INTERVAL '7 days') AS approved_7d,
          COUNT(*) FILTER (WHERE action = 'door_opened'AND timestamp >= NOW() - INTERVAL '7 days') AS opens_7d,
          COUNT(*) FILTER (WHERE action = 'rejected'   AND timestamp >= NOW() - INTERVAL '7 days') AS rejected_7d,
          COUNT(*) FILTER (WHERE action = 'registered' AND timestamp >= NOW() - INTERVAL '24 hours') AS reg_24h,
          COUNT(*) FILTER (WHERE action = 'door_opened'AND timestamp >= NOW() - INTERVAL '24 hours') AS opens_24h
        FROM access_logs
      `);
      results.kpi = kpiRows[0];
    }

    await cacheSet(cacheKey, results, ANALYTICS_TTL_S);
    return NextResponse.json(results, {
      headers: { "Cache-Control": "private, max-age=60" },
    });
  } catch (error) {
    console.error("[Analytics API]", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
