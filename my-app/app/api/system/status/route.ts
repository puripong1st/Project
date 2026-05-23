import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getESP32Status } from "@/lib/esp32";
import { getAdminFromCookie } from "@/lib/auth";

export async function GET() {
  try {
    // 1. Authenticate the operator
    const admin = await getAdminFromCookie();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. MySQL Status & Log Retention Stats
    let mysqlOnline = false;
    let mysqlError = "";
    let totalLogs = 0;
    let activeLogs = 0;
    let expiredLogs = 0;

    const pool = getPool();
    try {
      const [dbTest] = await pool.query("SELECT 1");
      if (dbTest) mysqlOnline = true;

      // Only query counts if MySQL is online
      if (mysqlOnline && admin.role === "owner") {
        const [totalRes] = await pool.query("SELECT COUNT(*) as count FROM access_logs");
        totalLogs = (totalRes as any[])[0]?.count || 0;

        const [expiredRes] = await pool.query(
          "SELECT COUNT(*) as count FROM access_logs WHERE timestamp < NOW() - INTERVAL 90 DAY"
        );
        expiredLogs = (expiredRes as any[])[0]?.count || 0;

        activeLogs = totalLogs - expiredLogs;
      }
    } catch (error: any) {
      mysqlError = error?.message || "Database connection error";
    }

    // 3. ESP32 Status
    let esp32Status: { online: boolean; doorStatus?: string; ip: string; mock: boolean } = { 
      online: false, 
      doorStatus: "closed", 
      ip: "", 
      mock: false 
    };
    try {
      esp32Status = await getESP32Status();
    } catch (error) {
      console.error("[Status API] ESP32 status check failed:", error);
    }

    // 4. Discord Webhook Config
    const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL || "";
    const discordConfigured = !!discordWebhookUrl;

    return NextResponse.json({
      mysql: {
        online: mysqlOnline,
        host: process.env.MYSQL_HOST || "localhost",
        database: process.env.MYSQL_DATABASE || "rmutp_access",
        error: mysqlError,
      },
      esp32: {
        online: esp32Status.online,
        doorStatus: esp32Status.doorStatus || "closed",
        ip: esp32Status.ip,
        mock: esp32Status.mock,
      },
      discord: {
        configured: discordConfigured,
      },
      logSummary: {
        total: totalLogs,
        active: activeLogs,
        expired: expiredLogs,
        retentionDays: 90,
      },
    });
  } catch (error: any) {
    console.error("[System Status GET Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
