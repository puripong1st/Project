import type { Metadata } from "next";
import { Noto_Sans_Thai, Inter } from "next/font/google";
import "./globals.css";
import CookieConsent from "./components/CookieConsent";
import { ThemeProvider } from "./components/ThemeProvider";

// Self-hosted via next/font — ตัด render-blocking @import จาก Google Fonts CDN
// และ preload อัตโนมัติ (เร็วกว่า + ลด external request)
const notoSansThai = Noto_Sans_Thai({
  subsets: ["thai"],
  display: "swap",
  variable: "--font-noto-thai",
});
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "SmartAccess Door Access System",
  description: "SmartAccess — ระบบควบคุมการเข้าออกห้องเรียนแบบไร้สาย (Innovative system for managing access rights and controlling classroom access via wireless network) คณะครุศาสตร์อุตสาหกรรม มหาวิทยาลัยเทคโนโลยีราชมงคลพระนคร",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${notoSansThai.variable} ${inter.variable}`} suppressHydrationWarning>
      <body style={{ minHeight: "100vh" }}>
        <ThemeProvider>
          {children}
          <CookieConsent />
        </ThemeProvider>
      </body>
    </html>
  );
}

