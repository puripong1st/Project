// app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAdminFromCookie } from "@/lib/auth";
import { getPool } from "@/lib/db";
import { getClientIp } from "@/lib/client-ip";
import { sendDiscordNotification } from "@/lib/discord";

export async function POST(req: NextRequest) {
  // Read identity before clearing the cookie
  const admin = await getAdminFromCookie().catch(() => null);
  const ip = getClientIp(req);

  const response = NextResponse.json({ success: true });
  response.cookies.delete("smartaccess_admin_token");

  if (admin) {
    await sendDiscordNotification("admin_logout", {
      adminName: admin.full_name,
      adminUsername: admin.username,
      adminRole: admin.role,
      ip,
    }).catch((err) => console.error("[Logout Notification] failed:", err));

    getPool().query(
      `INSERT INTO access_logs (action, performed_by, ip_address, notes) VALUES ($1, $2, $3, $4)`,
      ["admin_logout", admin.id, ip, `ออกจากระบบสำเร็จ — Role: ${admin.role}`]
    ).catch(() => {});
  }

  return response;
}
