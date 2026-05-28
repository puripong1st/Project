import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const room = searchParams.get('room') || 'unknown';
    
    // 1. ดึงเวอร์ชันและตรวจสอบคีย์การเข้าถึงผ่าน Header เพื่อป้องกันผู้บุกรุกดึงโค้ดไบนารีไปย้อนรอย (Reverse Engineering)
    const clientVersion = req.headers.get('x-esp32-version') || '1.0.0';
    const authHeader = req.headers.get('authorization') || '';
    
    const EXPECTED_API_KEY = process.env.ESP32_API_KEY || 'SUPER_SECURE_ESP32_ACCESS_TOKEN';
    if (!authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] !== EXPECTED_API_KEY) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized Access Prohibited' }), { 
        status: 401, 
        headers: { 'Content-Type': 'application/json' } 
      });
    }

    // 2. ระบุเลขเวอร์ชันล่าสุดบนเซิร์ฟเวอร์
    const latestVersion = '1.0.1'; 

    // 3. หากรุ่นตรงกัน ส่งกลับ 304 Not Modified ทันทีเพื่อความเร็วและประหยัด Bandwidth ของคลาวด์
    if (clientVersion === latestVersion) {
      return new Response(null, { status: 304 });
    }

    // 4. ค้นหาไฟล์เฟิร์มแวร์ .bin ที่ผ่านการคอมไพล์จากโปรเจกต์
    const filePath = path.join(process.cwd(), 'public', 'firmware', `v_${latestVersion.replace(/\./g, '_')}.bin`);
    
    if (!fs.existsSync(filePath)) {
      // สร้างโฟลเดอร์และไฟล์จำลองเพื่อความพร้อมสำหรับ local dev/testing
      const dirPath = path.dirname(filePath);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      // สร้างไฟล์จำลองขนาดเล็กไว้หากยังไม่มีเพื่อป้องกันการ error ตอนคอมไพล์หรือทดสอบ
      fs.writeFileSync(filePath, Buffer.from("SMARTACCESS_MOCK_FIRMWARE_BINARY_DATA"));
    }

    // 5. อ่านไฟล์ไบนารีและคำนวณ MD5 Checksum เพื่อเตรียมนำไปใส่ใน Header (บอร์ดใช้เทียบยืนยันความสมบูรณ์ไฟล์)
    const fileBuffer = fs.readFileSync(filePath);
    const fileHash = crypto.createHash('md5').update(fileBuffer).digest('hex');

    console.log(`[OTA Dispatcher] Room: ${room} | Version: ${clientVersion} -> ${latestVersion} | Hash: ${fileHash}`);

    // 6. ส่งไฟล์ไบนารีกลับไปในรูปแบบ Octet-Stream พร้อมแนบขนาดไฟล์และ Checksum
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Length': fileBuffer.length.toString(),
        'x-MD5-Checksum': fileHash,
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
      },
    });
  } catch (err: any) {
    console.error('[OTA API Error]:', err);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error', detail: err.message }), { 
      status: 500, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}
