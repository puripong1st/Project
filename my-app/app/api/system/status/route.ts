export const dynamic = "force-dynamic";

// app/api/system/status/route.ts — Return dynamic status of system dependencies & all IoT boards
import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getESP32Status } from "@/lib/esp32";
import { getAdminFromCookie } from "@/lib/auth";
import { getOrCreateActiveQRToken } from "@/lib/qr";
import { getDependencyState, getFallbackSettings, parseConfiguredRooms } from "@/lib/resilience";

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
    let isDiscordWebhookConfigured = false;
    let roomCodes: string[] = parseConfiguredRooms(getFallbackSettings());
    const fallbackSettings = getFallbackSettings();

    let pool: ReturnType<typeof getPool> | null = null;
    try {
      pool = getPool();
      const { rows: dbTest } = await pool.query("SELECT 1");
      if (dbTest) mysqlOnline = true;

      // Only query dynamic settings if MySQL is online
      if (mysqlOnline) {
        // Query Discord webhook settings from DB
        const { rows: webhookRows } = await pool.query(
          "SELECT setting_value FROM system_settings WHERE setting_key LIKE '%webhook%'"
        );
        const webhookSettings = webhookRows as { setting_value: string }[];
        isDiscordWebhookConfigured = webhookSettings.some(
          row => row.setting_value && row.setting_value.trim().startsWith("http")
        );

        // Query configured rooms from DB
        const { rows: roomsRows } = await pool.query(
          "SELECT setting_value FROM system_settings WHERE setting_key = 'configured_rooms'"
        );
        const roomsConfig = roomsRows as { setting_value: string }[];
        if (roomsConfig.length > 0 && roomsConfig[0].setting_value) {
          roomCodes = roomsConfig[0].setting_value.split(",").filter(Boolean);
        }
        for (const roomCode of roomCodes) {
          const { rows: ipRows } = await pool.query(
            "SELECT setting_value FROM system_settings WHERE setting_key = $1",
            [`room_ip_${roomCode}`]
          );
          if (ipRows[0]?.setting_value) {
            fallbackSettings[`room_ip_${roomCode}`] = ipRows[0].setting_value;
          }
        }

        // Only query counts if admin is owner
        if (admin.role === "owner") {
          const { rows: totalRes } = await pool.query("SELECT COUNT(*) as count FROM access_logs");
          totalLogs = (totalRes as { count: number }[])[0]?.count || 0;

          const { rows: expiredRes } = await pool.query(
            "SELECT COUNT(*) as count FROM access_logs WHERE timestamp < CURRENT_TIMESTAMP - INTERVAL '90 days'"
          );
          expiredLogs = (expiredRes as { count: number }[])[0]?.count || 0;

          activeLogs = totalLogs - expiredLogs;

          // Asynchronous Auto-Garbage Collection: Delete expired logs (> 90 days) in the background
          // Runs completely non-blocking without "await" so database speed is unaffected.
          if (expiredLogs > 0) {
            pool.query("DELETE FROM access_logs WHERE timestamp < CURRENT_TIMESTAMP - INTERVAL '90 days'")
              .then(() => {
                console.log(`[Auto-GC] Successfully purged ${expiredLogs} expired logs older than 90 days from Supabase.`);
              })
              .catch(err => {
                console.error("[Auto-GC] Failed to purge expired logs:", err);
              });
          }
        }
      }
    } catch (error) {
      mysqlError = error instanceof Error ? error.message : "Database connection error";
    }

    // 3. Resolve status of ALL configured rooms concurrently
    const devicesList = await Promise.all(
      roomCodes.map(async (roomCode) => {
        let ip = "192.168.1.100";
        ip = fallbackSettings[`room_ip_${roomCode}`] || ip;
        if (mysqlOnline && pool) {
          try {
            const { rows: ipRows } = await pool.query(
              "SELECT setting_value FROM system_settings WHERE setting_key = $1",
              [`room_ip_${roomCode}`]
            );
            const ipSetting = ipRows as { setting_value: string }[];
            if (ipSetting.length > 0 && ipSetting[0].setting_value) {
              ip = ipSetting[0].setting_value;
            }
          } catch {}
        }

        let activeToken = "";
        if (mysqlOnline) {
          try {
            activeToken = await getOrCreateActiveQRToken(roomCode);
          } catch (tokErr) {
            console.error(`[Status API] Failed to fetch active token for room: ${roomCode}`, tokErr);
          }
        }

        try {
          const status = await getESP32Status(roomCode);
          return {
            room: roomCode,
            online: status.online,
            ip: status.ip || ip,
            doorStatus: status.online ? (status.doorStatus || "closed") : "closed",
            mock: status.mock,
            mode: status.mode,
            activeToken: activeToken,
          };
        } catch {
          return {
            room: roomCode,
            online: false,
            ip: ip,
            doorStatus: "closed",
            mock: false,
            mode: "physical" as const,
            activeToken: activeToken,
          };
        }
      })
    );

    // 4. Discord Webhook Config
    const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL || "";
    const discordConfigured = isDiscordWebhookConfigured || !!discordWebhookUrl;

    // 5. Strip sensitive fields based on role — only "owner" sees activeToken
    const isOwner = admin.role === "owner";
    const sanitizedDevices = isOwner
      ? devicesList
      : devicesList.map(({ activeToken: _token, ...rest }) => ({ ...rest, activeToken: "" }));

    return NextResponse.json(
      {
        serviceState: getDependencyState([mysqlOnline, devicesList.some((device) => device.online)]),
        degraded: !mysqlOnline || devicesList.some((device) => !device.online),
        mode: mysqlOnline ? "online" : "local-fallback",
        mysql: {
          online: mysqlOnline,
          error: mysqlError,
        },
        esp32: sanitizedDevices.length > 0 ? {
          online: sanitizedDevices[0].online,
          doorStatus: sanitizedDevices[0].doorStatus,
          ip: sanitizedDevices[0].ip,
          mock: sanitizedDevices[0].mock,
          room: sanitizedDevices[0].room,
        } : {
          online: false,
          doorStatus: "closed",
          ip: "192.168.1.100",
          mock: false,
          room: "ไม่มีห้อง",
        },
        esp32Devices: sanitizedDevices,
        discord: {
          configured: discordConfigured,
        },
        logSummary: {
          total: totalLogs,
          active: activeLogs,
          expired: expiredLogs,
          retentionDays: 90,
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("[System Status GET Error]:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
