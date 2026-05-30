import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // ค่า secret สำหรับเทสเท่านั้น — lib/auth.ts และ lib/qr.ts จะ throw หากไม่มี
    env: {
      JWT_SECRET: "test-jwt-secret-not-for-production",
      QR_SIGNING_KEY: "test-qr-signing-key-not-for-production",
      NODE_ENV: "test",
    },
  },
});
