// lib/qr.ts — QR Code generation helper
import QRCode from "qrcode";

/**
 * Generate QR code as PNG Buffer (for ESP32 display API)
 */
export async function generateQRCodeBuffer(text: string): Promise<Buffer> {
  return QRCode.toBuffer(text, {
    type: "png",
    width: 240,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
    errorCorrectionLevel: "M",
  });
}

/**
 * Generate QR code as Base64 Data URL (for web display)
 */
export async function generateQRCodeDataURL(text: string, size = 300): Promise<string> {
  return QRCode.toDataURL(text, {
    type: "image/png",
    width: size,
    margin: 2,
    color: {
      dark: "#1B5E20",
      light: "#FFFFFF",
    },
    errorCorrectionLevel: "M",
  });
}

/**
 * Generate QR code as SVG string (for web preview)
 */
export async function generateQRCodeSVG(text: string): Promise<string> {
  return QRCode.toString(text, {
    type: "svg",
    width: 200,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });
}
