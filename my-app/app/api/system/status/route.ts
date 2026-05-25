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

    // 2. MySQL Status & Log Retention Stats & Dynamic Configurations
    let mysqlOnline = false;
    let mysqlError = "";
    let totalLogs = 0;
    let activeLogs = 0;
    let expiredLogs = 0;
    let firstRoomCode = "default";
    let firstRoomIp = "";
    let isDiscordWebhookConfigured = false;

    const pool = getPool();
    try {
      const [dbTest] = await pool.query("SELECT 1");
      if (dbTest) mysqlOnline = true;

      // Only query dynamic settings if MySQL is online
      if (mysqlOnline) {
        // Query Discord webhook settings from DB
        const [webhookRows] = await pool.query(
          "SELECT setting_value FROM system_settings WHERE setting_key LIKE '%webhook%'"
        );
        const webhookSettings = webhookRows as { setting_value: string }[];
        isDiscordWebhookConfigured = webhookSettings.some(
          row => row.setting_value && row.setting_value.trim().startsWith("http")
        );

        // Query configured rooms from DB
        const [roomsRows] = await pool.query(
          "SELECT setting_value FROM system_settings WHERE setting_key = 'configured_rooms'"
        );
        const roomsConfig = roomsRows as { setting_value: string }[];
        if (roomsConfig.length > 0 && roomsConfig[0].setting_value) {
          const roomCodes = roomsConfig[0].setting_value.split(",").filter(Boolean);
          if (roomCodes.length > 0) {
            firstRoomCode = roomCodes[0];
            const [ipRows] = await pool.query(
              "SELECT setting_value FROM system_settings WHERE setting_key = ?",
              [`room_ip_${firstRoomCode}`]
            );
            const ipSetting = ipRows as { setting_value: string }[];
            if (ipSetting.length > 0 && ipSetting[0].setting_value) {
              firstRoomIp = ipSetting[0].setting_value;
            }
          }
        }

        // Only query counts if admin is owner
        if (admin.role === "owner") {
          const [totalRes] = await pool.query("SELECT COUNT(*) as count FROM access_logs");
          totalLogs = (totalRes as { count: number }[])[0]?.count || 0;

          const [expiredRes] = await pool.query(
            "SELECT COUNT(*) as count FROM access_logs WHERE timestamp < NOW() - INTERVAL 90 DAY"
          );
          expiredLogs = (expiredRes as { count: number }[])[0]?.count || 0;

          activeLogs = totalLogs - expiredLogs;
        }
      }
    } catch (error) {
      mysqlError = error instanceof Error ? error.message : "Database connection error";
    }

    // 3. ESP32 Status based on the first configured room dynamically
    let esp32Status: { online: boolean; doorStatus?: string; ip: string; mock: boolean } = { 
      online: false, 
      doorStatus: "closed", 
      ip: firstRoomIp || "192.168.1.100", 
      mock: false 
    };
    try {
      esp32Status = await getESP32Status(firstRoomCode);
    } catch (error) {
      console.error("[Status API] ESP32 status check failed for room:", firstRoomCode, error);
    }

    // 4. Discord Webhook Config
    const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL || "";
    const discordConfigured = isDiscordWebhookConfigured || !!discordWebhookUrl;

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
        room: firstRoomCode !== "default" ? firstRoomCode : "ทั่วไป",
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
  } catch (error) {
    console.error("[System Status GET Error]:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
