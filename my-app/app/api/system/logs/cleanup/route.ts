import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { getAdminFromCookie } from "@/lib/auth";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
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

    const pool = getPool();

    // 3. Execution logic based on retention rules
    if (type === "expired") {
      // Deleting expired logs (> 90 days) — perfectly legal, no password required
      const { rowCount } = await pool.query(
        "DELETE FROM access_logs WHERE timestamp < CURRENT_TIMESTAMP - INTERVAL '90 days'"
      );
      const affectedRows = rowCount || 0;

      // Log this maintenance action in the audit trail
      await pool.query(
        `INSERT INTO access_logs (action, performed_by, esp32_response, notes) 
         VALUES ('maintenance_cleanup', $1, 'System Cleanup', $2)`,
        [
          admin.id,
          `บำรุงรักษาระบบ: ล้างข้อมูลประวัติจราจรคอมพิวเตอร์ที่หมดอายุอายุเกิน 90 วันสำเร็จ (ลบออกจำนวน ${affectedRows} รายการ)`
        ]
      );

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
      await pool.query(
        `INSERT INTO access_logs (action, performed_by, esp32_response, notes) 
         VALUES ('maintenance_purge', $1, 'System Format', $2)`,
        [
          admin.id,
          `การล้างข้อมูลครั้งใหญ่: ผู้ดูแลระบบสูงสุดได้ยืนยันรหัสผ่านและล้างข้อมูลประวัติเข้าออกทั้งหมดในระบบสำเร็จ (ลบออกจำนวน ${affectedRows} รายการ)`
        ]
      );

      return NextResponse.json({
        success: true,
        message: `ระบบได้รับการล้างข้อมูลประวัติเข้าออกทั้งหมดเรียบร้อยแล้ว (ลบออก ${affectedRows} รายการ)`,
        affectedRows,
      });
    }

    return NextResponse.json({ error: "รูปแบบคำขอทำความสะอาดข้อมูลไม่ถูกต้อง" }, { status: 400 });
  } catch (error) {
    console.error("[System Cleanup Error]:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: `เกิดข้อผิดพลาดภายในระบบ: ${message}` }, { status: 500 });
  }
}
