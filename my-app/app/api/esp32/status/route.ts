// app/api/esp32/status/route.ts — ESP32 connection status & mode info
import { NextResponse } from "next/server";
import { getESP32Status, getESP32BaseUrl } from "@/lib/esp32";

export async function GET() {
  try {
    const status = await getESP32Status();
    const url    = getESP32BaseUrl();

    return NextResponse.json({ ...status, url });
  } catch (error) {
    console.error("[ESP32/Status]", error);
    return NextResponse.json({ online: false, mode: "physical", error: "Status check failed" }, { status: 500 });
  }
}
