export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getPool, getSystemSettings, updateSystemSetting } from "@/lib/db";
import { getAdminFromCookie } from "@/lib/auth";
import { sendDiscordNotification } from "@/lib/discord";

// GET /api/system/settings — ดึงค่าการตั้งค่าระบบทั้งหมด (เฉพาะ owner เท่านั้น)
export async function GET(req: NextRequest) {
  try {
    const admin = await getAdminFromCookie();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (admin.role !== "owner") return NextResponse.json({ error: "Permission denied" }, { status: 403 });

    const settings = await getSystemSettings();
    return NextResponse.json(
      { settings },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("[System Settings] GET error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูลตั้งค่า" }, { status: 500 });
  }
}

// POST /api/system/settings — อัปเดตค่าการตั้งค่าระบบ (เฉพาะ owner เท่านั้น)
export async function POST(req: NextRequest) {
  try {
    const admin = await getAdminFromCookie();
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (admin.role !== "owner") return NextResponse.json({ error: "Permission denied" }, { status: 403 });

    const body = await req.json();
    const {
      auto_approve_enabled,
      auto_approve_start_time,
      auto_approve_end_time,
      auto_approve_days,
      discord_webhook_register,
      discord_webhook_approve,
      discord_webhook_logs,
      auto_fill_enabled,
      auto_fill_mode,
      student_id_display_mode,
    } = body;

    // ชำระล้างและตรวจสอบข้อมูลเบื้องต้น
    if (student_id_display_mode !== undefined) {
      const mode = String(student_id_display_mode).trim();
      if (["full", "masked", "hidden"].includes(mode)) {
        await updateSystemSetting("student_id_display_mode", mode);
      }
    }
    if (auto_approve_enabled !== undefined) {
      await updateSystemSetting("auto_approve_enabled", auto_approve_enabled === "1" || auto_approve_enabled === true ? "1" : "0");
    }
    if (auto_fill_enabled !== undefined) {
      await updateSystemSetting("auto_fill_enabled", auto_fill_enabled === "1" || auto_fill_enabled === true ? "1" : "0");
    }
    if (auto_fill_mode !== undefined) {
      const mode = String(auto_fill_mode).trim();
      if (["auto", "manual"].includes(mode)) {
        await updateSystemSetting("auto_fill_mode", mode);
      }
    }
    if (auto_approve_start_time !== undefined) {
      const timeRegex = /^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
      if (auto_approve_start_time === "" || timeRegex.test(auto_approve_start_time)) {
        await updateSystemSetting("auto_approve_start_time", auto_approve_start_time);
      }
    }
    if (auto_approve_end_time !== undefined) {
      const timeRegex = /^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;
      if (auto_approve_end_time === "" || timeRegex.test(auto_approve_end_time)) {
        await updateSystemSetting("auto_approve_end_time", auto_approve_end_time);
      }
    }
    if (auto_approve_days !== undefined) {
      // ป้องกันค่าแปลกปลอมกรองเอาเฉพาะ 0-6 คั่นด้วยจุลภาค
      const days = String(auto_approve_days).split(",").map(Number).filter(d => !isNaN(d) && d >= 0 && d <= 6).join(",");
      await updateSystemSetting("auto_approve_days", days);
    }
    if (discord_webhook_register !== undefined) {
      await updateSystemSetting("discord_webhook_register", String(discord_webhook_register).trim());
    }
    if (discord_webhook_approve !== undefined) {
      await updateSystemSetting("discord_webhook_approve", String(discord_webhook_approve).trim());
    }
    if (discord_webhook_logs !== undefined) {
      await updateSystemSetting("discord_webhook_logs", String(discord_webhook_logs).trim());
    }

    // อัปเดตการตั้งค่าเพิ่มเติม (custom settings) เช่น รายชื่อห้องเรียน และ IP แยกห้อง
    const { custom_settings } = body;
    if (custom_settings && typeof custom_settings === "object") {
      for (const [key, value] of Object.entries(custom_settings)) {
        if (typeof key === "string" && typeof value === "string") {
          await updateSystemSetting(key, value.trim());
        }
      }
    }

    // บันทึก log ในระบบ
    const pool = getPool();
    await pool.query(
      "INSERT INTO access_logs (action, performed_by, notes, room_code) VALUES ('approved', $1, $2, 'system')",
      [admin.id, `อัปเดตการตั้งค่าระบบและการแจ้งเตือน Discord Webhook โดยแอดมิน: ${admin.full_name}`]
    );

    // ยิงแจ้งเตือนเข้าระบบ Discord logs
    try {
      sendDiscordNotification("esp32_offline", {
        adminName: admin.full_name,
        reason: "อัปเดตตัวแปรตั้งค่าระบบและตัวแจ้งเตือนแยกช่องใหม่เรียบร้อยแล้ว",
      }).catch(() => {});
    } catch {}

    return NextResponse.json({ success: true, message: "บันทึกการตั้งค่าระบบเรียบร้อยแล้ว" });
  } catch (error) {
    console.error("[System Settings] POST error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการบันทึกข้อมูลตั้งค่า" }, { status: 500 });
  }
}
