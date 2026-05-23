// app/api/esp32/display/route.ts — JSON display state for ESP32 polling
import { NextRequest, NextResponse } from "next/server";
import { initDatabase, getPool } from "@/lib/db";

let initialized = false;
async function ensureInit() {
  if (!initialized) {
    await initDatabase();
    initialized = true;
  }
}

export async function GET() {
  try {
    await ensureInit();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const pool = getPool();
    // Count pending students
    const [pendingRows] = await pool.query(
      "SELECT COUNT(*) as count FROM students WHERE status = 'pending'"
    );
    const pendingCount = (pendingRows as { count: number }[])[0].count;

    // Get last approved student
    const [lastApproved] = await pool.query(
      `SELECT CONCAT(first_name, ' ', last_name) as name, student_id, approved_at
       FROM students WHERE status = 'approved' AND approved_at IS NOT NULL
       ORDER BY approved_at DESC LIMIT 1`
    );

    const lastStudent = (lastApproved as { name: string; student_id: string; approved_at: Date }[])[0];

    return NextResponse.json(
      {
        // Display info for ESP32
        title: "RMUTP Door Access",
        subtitle: "มหาวิทยาลัยเทคโนโลยีราชมงคลพระนคร",
        qr_url: `${appUrl}/api/esp32/qr`,
        register_url: `${appUrl}/`,
        pending_count: pendingCount,
        last_approved: lastStudent
          ? {
              name: lastStudent.name,
              student_id: lastStudent.student_id,
              time: lastStudent.approved_at,
            }
          : null,
        server_time: new Date().toISOString(),
        status: "online",
        // Display dimensions hint for LAFVIN 3.2" (320x240)
        display: {
          width: 320,
          height: 240,
          orientation: "landscape",
          color_theme: {
            bg: "#000000",
            primary: "#4CAF50",
            secondary: "#FFD700",
            text: "#FFFFFF",
            error: "#F44336",
          },
        },
      },
      {
        headers: {
          "Cache-Control": "no-store",
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("[ESP32/Display] error:", error);
    return NextResponse.json(
      { status: "error", message: "Server error", server_time: new Date().toISOString() },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
}

// ESP32 can POST its status here
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("[ESP32] Status update received:", body);
    return NextResponse.json(
      { received: true, server_time: new Date().toISOString() },
      { headers: { "Access-Control-Allow-Origin": "*" } }
    );
  } catch {
    return NextResponse.json({ received: false }, { status: 400 });
  }
}
