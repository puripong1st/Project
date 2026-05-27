import type { Metadata } from "next";
import "./globals.css";
import CookieConsent from "./components/CookieConsent";

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
    <html lang="th" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body style={{ minHeight: "100vh" }}>
        {children}
        <CookieConsent />
      </body>
    </html>
  );
}

