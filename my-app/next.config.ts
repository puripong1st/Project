import type { NextConfig } from "next";
import path from "path";

const isProduction = process.env.NODE_ENV === "production";

const supabaseHost = process.env.POSTGRES_HOST
  ? `https://${process.env.POSTGRES_HOST}`
  : "https://*.supabase.co";

const cspDirectives = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  // 'strict-dynamic' allows scripts loaded by already-trusted scripts (needed by Next.js).
  // 'unsafe-inline' is kept as a fallback for browsers that do not support strict-dynamic.
  // 'unsafe-eval' has been removed.
  "script-src 'self' 'unsafe-inline' 'strict-dynamic'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  `connect-src 'self' ${supabaseHost} https://*.supabase.co`,
  "manifest-src 'self'",
  "media-src 'self'",
  "worker-src 'self' blob:",
  "upgrade-insecure-requests",
];

const securityHeaders = [
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: cspDirectives.join("; "),
  },
  ...(isProduction
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]
    : []),
];

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.2.49"],
  serverExternalPackages: ["pg", "pdfkit", "bcryptjs", "jsonwebtoken", "qrcode"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  turbopack: {
    // CRITICAL: A stray package-lock.json at C:\Users\aunkh\ causes Turbopack
    // to use the home directory as workspace root, scanning thousands of files
    // and causing OOM crashes. This locks the root to this project folder.
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
