// app/api/system/test-webhook/route.ts — Live Discord webhook testing endpoint
import { NextRequest, NextResponse } from "next/server";
import { getAdminFromCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate admin user
    const admin = await getAdminFromCookie();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Vulnerability 5 fix: strictly require "owner" role to test webhooks (prevent SSRF/inconsistent privs)
    if (admin.role !== "owner") {
      return NextResponse.json({ error: "Permission denied" }, { status: 403 });
    }

    const body = await req.json();
    const { url, type, room } = body;

    if (!url || typeof url !== "string" || !url.trim().startsWith("https://discord.com/api/webhooks/")) {
      return NextResponse.json({ error: "ลิงก์ Discord Webhook ไม่ถูกต้อง" }, { status: 400 });
    }

    const testUrl = url.trim();
    const roomLabel = room && room !== "default" ? `ห้องเรียน ${room}` : "ระบบส่วนกลาง";
    const typeLabel = 
      type === "register" ? "📢 คำขอลงทะเบียนนักศึกษาใหม่" :
      type === "approve" ? "🔓 บันทึกเปิดประตู/อนุมัติสิทธิ์เข้าห้อง" :
      "📊 บันทึก Log และความปลอดภัย";

    const embed = {
      title: "🧪 ผลการทดสอบการเชื่อมต่อ Discord Webhook",
      description: `การเชื่อมต่อระหว่าง Next.js Cloud Server กับแชนแนล Discord ของคุณ **สำเร็จเรียบร้อยดีแล้ว!**`,
      color: 0x10B981, // Premium Emerald Green
      fields: [
        { name: "🏢 ตำแหน่งติดตั้ง", value: roomLabel, inline: true },
        { name: "🔔 ประเภทการส่งข้อมูล", value: typeLabel, inline: true },
        { name: "⚡ สถานะการเชื่อมต่อ", value: "🟢 ONLINE (200 OK)", inline: true },
      ],
      footer: {
        text: `ทดสอบระบบโดยแอดมิน: ${admin.full_name} | SmartAccess`,
        icon_url: "https://project-sigma-ivory-21.vercel.app/favicon.ico"
      },
      timestamp: new Date().toISOString(),
    };

    const response = await fetch(testUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "SmartAccess BOT",
        avatar_url: "https://project-sigma-ivory-21.vercel.app/favicon.ico",
        embeds: [embed],
      }),
    });

    if (response.ok) {
      return NextResponse.json({ success: true, message: "ส่งข้อความทดสอบเข้าแชนแนล Discord สำเร็จเรียบร้อยแล้ว!" });
    } else {
      const errText = await response.text();
      return NextResponse.json({ success: false, error: `Discord ปฏิเสธการส่งข้อความ: ${errText || response.statusText}` }, { status: 400 });
    }
  } catch (error) {
    console.error("[Test Webhook API] error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการติดต่อลิงก์ Discord" }, { status: 500 });
  }
}
