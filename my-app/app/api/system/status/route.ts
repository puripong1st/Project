export const dynamic = "force-dynamic";

// app/api/system/status/route.ts — Return dynamic status of system dependencies & all IoT boards
import { NextResponse } from "next/server";
import { getPool, getSystemSettings } from "@/lib/db";
import { getESP32Status } from "@/lib/esp32";
import { getAdminFromCookie } from "@/lib/auth";
import { getOrCreateActiveQRToken } from "@/lib/qr";
import { getDependencyState, getFallbackSettings, parseConfiguredRooms } from "@/lib/resilience";
import { cacheGet, cacheSet } from "@/lib/kv-cache";

export async function GET() {
  try {
    // 1. Authenticate the operator
    const admin = await getAdminFromCookie();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. PostgreSQL Status & Log Retention Stats & Dynamic Configurations
    let postgresqlOnline = false;
    let postgresqlError = "";
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
      if (dbTest) postgresqlOnline = true;

      // Only query dynamic settings if PostgreSQL is online
      if (postgresqlOnline) {
        // ใช้ getSystemSettings() (cache 30s, ดึงทุก key ใน query เดียว) แทนการยิง
        // หลาย query แยก (webhook + configured_rooms + room_ip ต่อห้อง) ทุก poll
        const settings = await getSystemSettings();

        isDiscordWebhookConfigured = Object.entries(settings).some(
          ([key, value]) => key.includes("webhook") && value && value.trim().startsWith("http")
        );

        roomCodes = parseConfiguredRooms(settings);
        for (const roomCode of roomCodes) {
          const ip = settings[`room_ip_${roomCode}`];
          if (ip) fallbackSettings[`room_ip_${roomCode}`] = ip;
        }

        // Only query counts if admin is owner — cache 60s เพราะ COUNT(*) บน
        // access_logs ที่โตขึ้นเรื่อย ๆ หนัก และ admin หลายคน poll ทุก 30s
        if (admin.role === "owner") {
          const cachedCounts = await cacheGet<{ total: number; expired: number }>("status:log_counts");
          if (cachedCounts) {
            totalLogs = cachedCounts.total;
            expiredLogs = cachedCounts.expired;
          } else {
            const { rows: cntRows } = await pool.query(
              `SELECT
                 COUNT(*) AS total,
                 COUNT(*) FILTER (WHERE timestamp < CURRENT_TIMESTAMP - INTERVAL '90 days') AS expired
               FROM access_logs`
            );
            const c = cntRows[0] as { total: string; expired: string };
            totalLogs = parseInt(c.total, 10) || 0;
            expiredLogs = parseInt(c.expired, 10) || 0;
            await cacheSet("status:log_counts", { total: totalLogs, expired: expiredLogs }, 60);
          }

          activeLogs = totalLogs - expiredLogs;

          // Asynchronous Auto-Garbage Collection: Delete expired logs (> 90 days) in the background
          // Runs completely non-blocking without "await" so database speed is unaffected.
          if (expiredLogs > 0) {
            pool.query("DELETE FROM access_logs WHERE timestamp < CURRENT_TIMESTAMP - INTERVAL '90 days'")
              .then(() => {
                console.log(`[Auto-GC] Successfully purged ${expiredLogs} expired logs older than 90 days from Supabase.`);
                // ล้าง cache counts หลังลบ เพื่อให้ poll ถัดไปเห็นค่าจริง
                cacheSet("status:log_counts", { total: totalLogs - expiredLogs, expired: 0 }, 60).catch(() => {});
              })
              .catch(err => {
                console.error("[Auto-GC] Failed to purge expired logs:", err);
              });
          }
        }
      }
    } catch (error) {
      console.error("[System Status DB Connection Error]:", error);
      postgresqlError = "Database connection error";
    }

    // 3. Resolve status of ALL configured rooms concurrently
    const devicesList = await Promise.all(
      roomCodes.map(async (roomCode) => {
        // room_ip ถูกดึงไว้แล้วใน fallbackSettings (จาก getSystemSettings ด้านบน)
        // — ไม่ต้อง query ซ้ำต่อห้องอีก
        const ip = fallbackSettings[`room_ip_${roomCode}`] || "192.168.1.100";

        let activeToken = "";
        if (postgresqlOnline) {
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
        serviceState: getDependencyState([postgresqlOnline, devicesList.some((device) => device.online)]),
        degraded: !postgresqlOnline || devicesList.some((device) => !device.online),
        mode: postgresqlOnline ? "online" : "local-fallback",
        postgresql: {
          online: postgresqlOnline,
          error: postgresqlError,
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
    return NextResponse.json({ error: "ไม่สามารถดึงข้อมูลระบบได้" }, { status: 500 });
  }
}
