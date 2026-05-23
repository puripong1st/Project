import type { NextConfig } from "next";

const nextConfig = {
  serverExternalPackages: ["mysql2", "pdfkit", "bcryptjs", "jsonwebtoken", "qrcode"],
  turbopack: {
    root: "./", // Explicitly lock workspace root to the my-app folder
  },
} as unknown as NextConfig;

export default nextConfig;
