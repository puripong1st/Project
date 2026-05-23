// proxy.ts — Route protection in Next.js 16
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "./lib/auth";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect admin dashboard routes
  if (pathname.startsWith("/admin/dashboard")) {
    const token = request.cookies.get("rmutp_admin_token")?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
    const payload = verifyToken(token);
    if (!payload) {
      const response = NextResponse.redirect(new URL("/admin/login", request.url));
      response.cookies.delete("rmutp_admin_token");
      return response;
    }
  }

  // Redirect /admin to /admin/dashboard (if logged in) or /admin/login
  if (pathname === "/admin" || pathname === "/admin/") {
    const token = request.cookies.get("rmutp_admin_token")?.value;
    if (token && verifyToken(token)) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/", "/admin/dashboard/:path*"],
};
