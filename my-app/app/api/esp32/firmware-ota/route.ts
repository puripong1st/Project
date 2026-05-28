import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getPool } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const room = searchParams.get('room') || 'unknown';
    
    // 1. ดึงเวอร์ชันและตรวจสอบคีย์การเข้าถึงผ่าน Header
    const clientVersion = req.headers.get('x-esp32-version') || '1.0.0';
    const authHeader = req.headers.get('authorization') || '';
    
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

    console.log(`[OTA Dispatcher] Room: ${room} | Version: ${clientVersion} -> ${latestVersion} | Hash: ${fileHash}`);

    // 4. แผนความปลอดภัย & จัดเก็บ: หากมีลิงก์อัปโหลดจริงให้ Redirect ไปยัง Supabase Storage เพื่อเซฟ Bandwidth ของ Vercel
    // กรณีที่ไม่ได้อัปโหลดผ่าน Supabase Storage (เช่น คืนค่าไฟล์ mock เพื่อ Local Dev/Testing)
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

    // 5. ส่ง Redirect (302 Found) ไปยัง Supabase Storage เพื่อประหยัด CPU execution
    // บอร์ด ESP32 ESPhttpUpdate รองรับ 302 redirection อัตโนมัติอยู่แล้ว
    return new NextResponse(null, {
      status: 302,
      headers: {
        'Location': dbReleasePath, // Supabase Storage Public File URL
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
