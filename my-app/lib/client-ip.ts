import { NextRequest } from "next/server";

export function getClientIp(req: NextRequest): string {
  // Vercel แนบ IP จริงที่ right-most ของ X-Forwarded-For
  const xff = req.headers.get("x-forwarded-for") || "";
  const parts = xff.split(",").map(s => s.trim()).filter(Boolean);
  if (parts.length > 0) {
    // ใช้ตัวขวาสุดเสมอ (Vercel-appended) เพื่อกัน client spoofing
    const ip = parts[parts.length - 1];
    // basic IP validation
    if (/^(\d{1,3}\.){3}\d{1,3}$/.test(ip) || /^[0-9a-fA-F:]+$/.test(ip)) {
      return ip;
    }
  }
  const real = req.headers.get("x-real-ip");
  if (real && /^[0-9a-fA-F.:]+$/.test(real)) return real;
  return "anonymous";
}
