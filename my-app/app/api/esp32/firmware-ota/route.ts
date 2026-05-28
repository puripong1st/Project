import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getPool } from '@/lib/db';
import { sendDiscordNotification } from '@/lib/discord';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const room = searchParams.get('room') || 'unknown';

    // 1. ดึงเวอร์ชันและตรวจสอบคีย์การเข้าถึงผ่าน Header
    const clientVersion = req.headers.get('x-esp32-version') || '1.0.0';
    const authHeader = req.headers.get('authorization') || '';
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                     req.headers.get('x-real-ip') || 'unknown';

    const EXPECTED_API_KEY = process.env.ESP32_API_KEY || 'SUPER_SECURE_ESP32_ACCESS_TOKEN';
    if (!authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] !== EXPECTED_API_KEY) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized Access Prohibited' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 2. ดึงเวอร์ชันเฟิร์มแวร์ล่าสุดจากฐานข้อมูล Supabase PostgreSQL
    let latestVersion = '1.0.1';
    let fileHash = 'c13c713b1dc3d6e5a593333333333333';
    let hasRelease = false;
    let dbReleasePath = '';

    try {
      const pool = getPool();
      const { rows } = await pool.query(
        "SELECT version, file_path, checksum_md5 FROM firmware_releases ORDER BY uploaded_at DESC LIMIT 1"
      );
      if (rows && rows.length > 0) {
        latestVersion = rows[0].version;
        fileHash = rows[0].checksum_md5;
        dbReleasePath = rows[0].file_path;
        hasRelease = true;
      }
    } catch (dbErr) {
      console.error('[OTA DB Fetch Error] falling back to defaults:', dbErr);
    }

    // 3. หากรุ่นตรงกัน ส่งกลับ 304 Not Modified ทันที
    if (clientVersion === latestVersion) {
      return new Response(null, { status: 304 });
    }

    console.log(`[OTA Dispatcher] Room: ${room} | IP: ${clientIp} | Version: ${clientVersion} -> ${latestVersion} | Hash: ${fileHash}`);

    // 4. บันทึก Log และแจ้งเตือน Discord เมื่อบอร์ดเริ่มดาวน์โหลดเฟิร์มแวร์ใหม่
    try {
      const pool = getPool();
      await pool.query(
        "INSERT INTO access_logs (action, notes, room_code, ip_address, method) VALUES ('firmware_ota_triggered', $1, $2, $3, 'HTTPS_OTA')",
        [
          `ESP32 ห้อง ${room} (IP: ${clientIp}) ดาวน์โหลดเฟิร์มแวร์ v${clientVersion} → v${latestVersion} (MD5: ${fileHash})`,
          room || 'system',
          clientIp
        ]
      );

      sendDiscordNotification("firmware_ota_triggered", {
        room,
        ip: clientIp,
        firmwareVersion: latestVersion,
        previousVersion: clientVersion,
        firmwareChecksum: fileHash,
      }).catch(err => console.error("[OTA Discord] trigger notify failed:", err));
    } catch (logErr) {
      console.error('[OTA Log Error]:', logErr);
    }

    // 5. แผนความปลอดภัย & จัดเก็บ: หากมีลิงก์อัปโหลดจริงให้ Redirect ไปยัง Supabase Storage
    if (!hasRelease) {
      const filePath = path.join(process.cwd(), 'public', 'firmware', `v_${latestVersion.replace(/\./g, '_')}.bin`);
      if (!fs.existsSync(filePath)) {
        const dirPath = path.dirname(filePath);
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }
        fs.writeFileSync(filePath, Buffer.from("SMARTACCESS_MOCK_FIRMWARE_BINARY_DATA"));
      }

      const fileBuffer = fs.readFileSync(filePath);
      const calculatedHash = crypto.createHash('md5').update(fileBuffer).digest('hex');

      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Length': fileBuffer.length.toString(),
          'x-MD5-Checksum': calculatedHash,
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
        },
      });
    }

    // 6. ส่ง Redirect (302 Found) ไปยัง Supabase Storage
    return new NextResponse(null, {
      status: 302,
      headers: {
        'Location': dbReleasePath,
        'x-MD5-Checksum': fileHash,
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      }
    });

  } catch (err: any) {
    console.error('[OTA API Error]:', err);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error', detail: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
