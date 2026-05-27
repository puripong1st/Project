import type { Metadata } from "next";
import "./globals.css";
import CookieConsent from "./components/CookieConsent";

export const metadata: Metadata = {
  title: "RMUTP Door Access System",
  description: "ระบบควบคุมการเข้าออก มหาวิทยาลัยเทคโนโลยีราชมงคลพระนคร",
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

