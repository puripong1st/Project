export const runtime = "nodejs";

// middleware.ts — Route protection in Next.js 16
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "./lib/auth";

// V07 fix: security headers applied to all non-ESP32 responses
const SECURITY_HEADERS: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "X-DNS-Prefetch-Control": "off",
};

function applySecurityHeaders(response: NextResponse, pathname: string): NextResponse {
  // Skip ESP32 routes — they have their own CORS headers
  if (pathname.startsWith("/api/esp32")) return response;
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect admin dashboard routes
  if (pathname.startsWith("/admin/dashboard")) {
    const token = request.cookies.get("smartaccess_admin_token")?.value;
    if (!token) {
      return applySecurityHeaders(NextResponse.redirect(new URL("/admin/login", request.url)), pathname);
    }
    const payload = verifyToken(token);
    if (!payload) {
      const response = NextResponse.redirect(new URL("/admin/login", request.url));
      response.cookies.delete("smartaccess_admin_token");
      return applySecurityHeaders(response, pathname);
    }
  }

  // Redirect /admin to /admin/dashboard (if logged in) or /admin/login
  if (pathname === "/admin" || pathname === "/admin/") {
    const token = request.cookies.get("smartaccess_admin_token")?.value;
    if (token && verifyToken(token)) {
      return applySecurityHeaders(NextResponse.redirect(new URL("/admin/dashboard", request.url)), pathname);
    }
    return applySecurityHeaders(NextResponse.redirect(new URL("/admin/login", request.url)), pathname);
  }

  const response = NextResponse.next();
  return applySecurityHeaders(response, pathname);
}

export const config = {
  matcher: ["/admin", "/admin/", "/admin/dashboard/:path*"],
};
