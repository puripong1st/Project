import { describe, it, expect } from "vitest";
import type { NextRequest } from "next/server";
import { getClientIp } from "../lib/client-ip";

// สร้าง NextRequest จำลองที่มีเฉพาะ headers.get ตามที่ getClientIp ใช้งาน
function reqWithHeaders(headers: Record<string, string>): NextRequest {
  return {
    headers: {
      get: (name: string) => headers[name.toLowerCase()] ?? null,
    },
  } as unknown as NextRequest;
}

describe("getClientIp (กัน V05: X-Forwarded-For spoofing)", () => {
  it("ใช้ IP ตัวขวาสุดของ X-Forwarded-For (Vercel-appended) เสมอ", () => {
    const req = reqWithHeaders({ "x-forwarded-for": "1.1.1.1, 2.2.2.2, 203.0.113.9" });
    expect(getClientIp(req)).toBe("203.0.113.9");
  });

  it("ไม่หลงเชื่อ IP ปลอมที่ผู้โจมตียัดมาทางซ้าย", () => {
    const req = reqWithHeaders({ "x-forwarded-for": "8.8.8.8, 203.0.113.9" });
    // ค่าที่ได้ต้องไม่ใช่ตัวซ้ายสุด (ที่ client ปลอมได้)
    expect(getClientIp(req)).not.toBe("8.8.8.8");
    expect(getClientIp(req)).toBe("203.0.113.9");
  });

  it("fallback ไปที่ x-real-ip เมื่อไม่มี X-Forwarded-For", () => {
    const req = reqWithHeaders({ "x-real-ip": "198.51.100.5" });
    expect(getClientIp(req)).toBe("198.51.100.5");
  });

  it("คืน 'anonymous' เมื่อไม่มี header ใด ๆ", () => {
    expect(getClientIp(reqWithHeaders({}))).toBe("anonymous");
  });

  it("รองรับ IPv6 ในช่องขวาสุด", () => {
    const req = reqWithHeaders({ "x-forwarded-for": "2001:db8::1" });
    expect(getClientIp(req)).toBe("2001:db8::1");
  });
});
