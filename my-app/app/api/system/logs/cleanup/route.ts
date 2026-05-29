import { NextRequest, NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getAdminFromCookie } from "@/lib/auth";
import { withRateLimit } from "@/lib/rate-limit-middleware";
import { logEvent, getRequestContext } from "@/lib/access-log";
import { sendDiscordNotification } from "@/lib/discord";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const rateLimitRes = await withRateLimit(request, "logs_cleanup", 3, 60);
    if (!rateLimitRes.allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }
    // 1. Authenticate the operator
    const admin = await getAdminFromCookie();
    if (!admin) {
      return NextResponse.json({ error: "กรุณาลงชื่อเข้าสู่ระบบ" }, { status: 401 });
    }

    // 2. Authorize role: only owners can manage logs
    if (admin.role !== "owner") {
      return NextResponse.json({ error: "คุณไม่มีสิทธิ์ดำเนินการลบข้อมูลระบบ" }, { status: 403 });
    }

    const body = await request.json();
    const { type, password } = body;

    const { ip, userAgent } = getRequestContext(request);
    const pool = getPool();

    // 3. Execution logic based on retention rules
    if (type === "expired") {
      // Deleting expired logs (> 90 days) — perfectly legal, no password required
      const { rowCount } = await pool.query(
        "DELETE FROM access_logs WHERE timestamp < CURRENT_TIMESTAMP - INTERVAL '90 days'"
      );
      const affectedRows = rowCount || 0;

      // Log this maintenance action in the audit trail
      const cleanupNote = `บำรุงรักษาระบบ: ล้างข้อมูลประวัติจราจรคอมพิวเตอร์ที่หมดอายุเกิน 90 วันสำเร็จ (ลบออกจำนวน ${affectedRows} รายการ)`;
      await logEvent({
        action: "maintenance_cleanup",
        performedBy: admin.id,
        ip,
        userAgent,
        esp32Response: "System Cleanup",
        notes: cleanupNote,
        severity: "warning",
      });

      // แจ้งเตือนทุกช่องทาง (Discord/Telegram/LINE)
      await sendDiscordNotification("security_alert", {
        alertTitle: "ล้างประวัติที่หมดอายุ (> 90 วัน)",
        alertDetail: `ผู้ดูแลระบบ **${admin.full_name}** ล้างประวัติที่หมดอายุออกจากระบบ`,
        adminUsername: admin.username,
        reason: `ลบออก ${affectedRows} รายการ (ประวัติเกิน 90 วันตาม พ.ร.บ.คอมพิวเตอร์ฯ ม.26)`,
        ip,
        userAgent,
      }).catch((e) => console.error("[Cleanup Notify] failed:", e));

      return NextResponse.json({
        success: true,
        message: `ล้างประวัติที่หมดอายุเรียบร้อยแล้ว (ลบออก ${affectedRows} รายการ)`,
        affectedRows,
      });
    } 
    
    if (type === "all") {
      // Deleting active logs (< 90 days) — high-alert, requires super-admin password verification
      if (!password) {
        return NextResponse.json({ error: "กรุณาระบุรหัสผ่านเพื่อยืนยันสิทธิ์แอดมินสูงสุด" }, { status: 400 });
      }

      // Query password hash from db
      const { rows } = await pool.query(
        "SELECT password_hash FROM admin_users WHERE id = $1 AND is_active = TRUE",
        [admin.id]
      );
      const userRow = (rows as { password_hash: string }[])[0];

      if (!userRow) {
        return NextResponse.json({ error: "ไม่พบข้อมูลบัญชีผู้ใช้ของคุณในระบบ" }, { status: 404 });
      }

      // Compare password hash
      const isMatch = await bcrypt.compare(password, userRow.password_hash);
      if (!isMatch) {
        return NextResponse.json({ error: "รหัสผ่านไม่ถูกต้อง การดำเนินการถูกระงับ" }, { status: 401 });
      }

      // Safe deletion of access logs
      const { rowCount } = await pool.query("DELETE FROM access_logs");
      const affectedRows = rowCount || 0;

      // Insert fresh audit trail record about this massive purge!
      const purgeNote = `การล้างข้อมูลครั้งใหญ่: ผู้ดูแลระบบสูงสุดได้ยืนยันรหัสผ่านและล้างข้อมูลประวัติเข้าออกทั้งหมดในระบบสำเร็จ (ลบออกจำนวน ${affectedRows} รายการ)`;
      await logEvent({
        action: "maintenance_purge",
        performedBy: admin.id,
        ip,
        userAgent,
        esp32Response: "System Format",
        notes: purgeNote,
        severity: "critical",
      });

      // แจ้งเตือนระดับวิกฤตทุกช่องทาง (ลบประวัติทั้งหมด = เหตุการณ์สำคัญสูงสุด)
      await sendDiscordNotification("security_alert", {
        alertTitle: "🚨 ลบประวัติทั้งหมดในระบบ (ถาวร)",
        alertDetail: `ผู้ดูแลระบบสูงสุด **${admin.full_name}** ยืนยันรหัสผ่านและล้างประวัติเข้าออก**ทั้งหมด**ออกจากระบบ`,
        adminUsername: admin.username,
        reason: `ลบออก ${affectedRows} รายการ (รวมข้อมูลที่อายุไม่ถึง 90 วัน) — โปรดตรวจสอบว่าเป็นการกระทำที่ได้รับอนุญาต`,
        ip,
        userAgent,
      }).catch((e) => console.error("[Purge Notify] failed:", e));

      return NextResponse.json({
        success: true,
        message: `ระบบได้รับการล้างข้อมูลประวัติเข้าออกทั้งหมดเรียบร้อยแล้ว (ลบออก ${affectedRows} รายการ)`,
        affectedRows,
      });
    }

    return NextResponse.json({ error: "รูปแบบคำขอทำความสะอาดข้อมูลไม่ถูกต้อง" }, { status: 400 });
  } catch (error) {
    console.error("[System Cleanup Error]:", error);
    return NextResponse.json({ error: "การล้าง log ล้มเหลว กรุณาลองใหม่" }, { status: 500 });
  }
}
