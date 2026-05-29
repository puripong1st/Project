// app/api/system/test-webhook/route.ts — Live notification testing endpoint (Discord / Telegram / LINE)
import { NextRequest, NextResponse } from "next/server";
import { getAdminFromCookie } from "@/lib/auth";
import { sendTelegram, sendLine } from "@/lib/notify";

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
    const { url, type, room, channel } = body;

    const roomLabelEarly = room && room !== "default" ? `ห้องเรียน ${room}` : "ระบบส่วนกลาง";
    const testMessage = `🧪 ทดสอบการเชื่อมต่อแจ้งเตือน SmartAccess\n• ตำแหน่ง: ${roomLabelEarly}\n• สถานะ: ONLINE\n• ทดสอบโดยแอดมิน: ${admin.full_name}\n• เวลา: ${new Date().toLocaleString("th-TH", { timeZone: "Asia/Bangkok" })}`;

    // ── Telegram ──
    if (channel === "telegram") {
      const botToken = typeof body.botToken === "string" ? body.botToken.trim() : "";
      const chatId = typeof body.chatId === "string" ? body.chatId.trim() : "";
      if (!botToken || !chatId) {
        return NextResponse.json({ error: "กรุณาระบุ Telegram Bot Token และ Chat ID" }, { status: 400 });
      }
      const result = await sendTelegram(botToken, chatId, testMessage);
      return result.ok
        ? NextResponse.json({ success: true, message: "ส่งข้อความทดสอบเข้า Telegram สำเร็จแล้ว!" })
        : NextResponse.json({ success: false, error: `Telegram ปฏิเสธการส่ง: ${result.error || "ตรวจสอบ Bot Token / Chat ID"}` }, { status: 400 });
    }

    // ── LINE Messaging API ──
    if (channel === "line") {
      const channelToken = typeof body.channelToken === "string" ? body.channelToken.trim() : "";
      const targetId = typeof body.targetId === "string" ? body.targetId.trim() : "";
      if (!channelToken || !targetId) {
        return NextResponse.json({ error: "กรุณาระบุ LINE Channel Access Token และ Target ID" }, { status: 400 });
      }
      const ok = await sendLine(channelToken, targetId, testMessage);
      return ok
        ? NextResponse.json({ success: true, message: "ส่งข้อความทดสอบเข้า LINE สำเร็จแล้ว!" })
        : NextResponse.json({ success: false, error: "LINE ปฏิเสธการส่ง — ตรวจสอบ Channel Token / Target ID หรือโควตา push" }, { status: 400 });
    }

    // ── Discord (default, backward-compatible) ──
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
