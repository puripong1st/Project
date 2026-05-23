import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  serverExternalPackages: ["mysql2", "pdfkit", "bcryptjs", "jsonwebtoken", "qrcode"],
  turbopack: {
    // CRITICAL: A stray package-lock.json at C:\Users\aunkh\ causes Turbopack
    // to use the home directory as workspace root, scanning thousands of files
    // and causing OOM crashes. This locks the root to this project folder.
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
