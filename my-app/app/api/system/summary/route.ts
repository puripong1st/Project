// app/api/system/summary/route.ts — สรุปการใช้งานระบบรายวัน/สัปดาห์ แล้วส่งแจ้งเตือน
// เรียกได้ 2 ทาง:
//   1) Vercel Cron / ภายนอก: แนบ header  Authorization: Bearer <CRON_SECRET>
//   2) แอดมิน owner ผ่านคุกกี้ (กดทดสอบเองได้)  ?period=day|week
import { NextRequest, NextResponse } from "next/server";
import { getPool, initDatabase } from "@/lib/db";
import { getAdminFromCookie } from "@/lib/auth";
import { sendDiscordNotification } from "@/lib/discord";

let initialized = false;
async function ensureInit() {
  if (!initialized) {
    await initDatabase();
    initialized = true;
  }
}

function num(v: unknown): number {
  const n = parseInt(String(v ?? "0"), 10);
  return isNaN(n) ? 0 : n;
}

export async function GET(req: NextRequest) {
  try {
    await ensureInit();

    // ── Authorization: cron secret หรือ owner ──
    const cronSecret = process.env.CRON_SECRET || "";
    const authHeader = req.headers.get("authorization") || "";
    const isCron = !!cronSecret && authHeader === `Bearer ${cronSecret}`;

    if (!isCron) {
      const admin = await getAdminFromCookie();
      if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      if (admin.role !== "owner") return NextResponse.json({ error: "Permission denied — owner only" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const period = searchParams.get("period") === "week" ? "week" : "day";
    const interval = period === "week" ? "7 days" : "1 day";

    const pool = getPool();

    // นับเหตุการณ์แยกตาม action ในช่วงเวลา
    const { rows: actionRows } = await pool.query(
      `SELECT action, COUNT(*)::int AS cnt
         FROM access_logs
        WHERE timestamp >= CURRENT_TIMESTAMP - $1::interval
        GROUP BY action`,
      [interval]
    );
    const byAction: Record<string, number> = {};
    let total = 0;
    for (const r of actionRows as { action: string; cnt: number }[]) {
      byAction[r.action] = r.cnt;
      total += r.cnt;
    }

    // นับเหตุ critical
    const { rows: critRows } = await pool.query(
      `SELECT COUNT(*)::int AS cnt FROM access_logs
        WHERE timestamp >= CURRENT_TIMESTAMP - $1::interval AND severity = 'critical'`,
      [interval]
    );
    const critical = num(critRows[0]?.cnt);

    // ห้องที่ใช้งานมากสุด
    const { rows: roomRows } = await pool.query(
      `SELECT room_code, COUNT(*)::int AS cnt FROM access_logs
        WHERE timestamp >= CURRENT_TIMESTAMP - $1::interval
          AND room_code IS NOT NULL AND room_code <> '' AND room_code <> 'system'
        GROUP BY room_code ORDER BY cnt DESC LIMIT 1`,
      [interval]
    );
    const topRoom = roomRows[0] ? `${roomRows[0].room_code} (${roomRows[0].cnt} ครั้ง)` : undefined;

    const periodLabel =
      period === "week"
        ? "7 วันล่าสุด"
        : `วันนี้ (${new Date().toLocaleDateString("th-TH", { timeZone: "Asia/Bangkok", day: "numeric", month: "short", year: "numeric" })})`;

    const summary = {
      period: periodLabel,
      total,
      doorOpened: num(byAction["door_opened"]),
      doorFailed: num(byAction["door_failed"]),
      registered: num(byAction["registered"]),
      approved: num(byAction["approved"]) + num(byAction["door_opened"]),
      rejected: num(byAction["rejected"]),
      bypassRateLimited: num(byAction["bypass_rate_limited"]),
      loginFailed: num(byAction["admin_login_failed"]),
      critical,
      topRoom,
    };

    await sendDiscordNotification("system_summary", { summary }).catch((e) =>
      console.error("[Summary] notify failed:", e)
    );

    return NextResponse.json({ success: true, summary });
  } catch (error) {
    console.error("[System Summary] error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการสร้างรายงานสรุป" }, { status: 500 });
  }
}
