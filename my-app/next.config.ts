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
  // Next.js App Router ships inline bootstrap/hydration scripts without nonces by default.
  // 'strict-dynamic' would cause modern browsers to ignore 'self' and 'unsafe-inline',
  // blocking those inline scripts and leaving the app stuck on a loading spinner.
  "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
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
  // gzip responses to cut bandwidth on the free Vercel tier
  compress: true,
  // Source maps bloat the build output and aren't needed in production
  productionBrowserSourceMaps: false,
  // Drop console.* (except warn/error) from the production client bundle
  compiler: {
    removeConsole: isProduction ? { exclude: ["error", "warn"] } : false,
  },
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
