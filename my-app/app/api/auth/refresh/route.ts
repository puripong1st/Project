import { NextRequest, NextResponse } from "next/server";
import { getAdminFromCookie, signToken, setAuthCookie } from "@/lib/auth";
import { withRateLimit } from "@/lib/rate-limit-middleware";

/**
 * POST /api/auth/refresh — Refresh admin token and return user profile
 */
export async function POST(req: NextRequest) {
  try {
    const rateLimitRes = await withRateLimit(req, "auth_refresh", 10, 60);
    if (!rateLimitRes.allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: { "Retry-After": "60" } }
      );
    }

    const admin = await getAdminFromCookie();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = signToken({
      id: admin.id,
      username: admin.username,
      full_name: admin.full_name,
      role: admin.role,
    });

    const cookieOpts = setAuthCookie(token);
    const response = NextResponse.json({ success: true, user: admin });
    response.cookies.set(cookieOpts);
    return response;
  } catch (error) {
    console.error("[Auth Refresh] error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูลใหม่" }, { status: 500 });
  }
}
