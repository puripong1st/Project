import type { NextConfig } from "next";

const nextConfig = {
  serverExternalPackages: ["mysql2", "pdfkit", "bcryptjs", "jsonwebtoken", "qrcode"],
  experimental: {
    turbopack: {
      root: "./",
    },
  },
} as any;

export default nextConfig as NextConfig;
