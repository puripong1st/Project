// app/api/sse/student-status/route.ts — Real-time status SSE for students
import { NextRequest } from "next/server";
import { initDatabase, getPool } from "@/lib/db";

let initialized = false;
async function ensureInit() {
  if (!initialized) { await initDatabase(); initialized = true; }
}

export async function GET(req: NextRequest) {
  await ensureInit();
  const { searchParams } = new URL(req.url);
  const studentId = (searchParams.get("student_id") || "").trim();
  const room = (searchParams.get("room") || "").trim();

  if (!studentId) {
    return new Response("student_id required", { status: 400 });
  }

  const enc = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(enc.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch { closed = true; }
      };

      const fetchStatus = async () => {
        const pool = getPool();
        const { rows } = await pool.query(
          `SELECT id, status, first_name, last_name, student_id, requested_room,
                  rejection_reason, approved_at, registered_at
           FROM students
           WHERE student_id = $1 ${room ? "AND requested_room = $2" : ""}
           ORDER BY registered_at DESC LIMIT 1`,
          room ? [studentId, room] : [studentId]
        );
        return rows[0] || null;
      };

      // Initial snapshot
      try {
        const student = await fetchStatus();
        send("status", student ? { found: true, student } : { found: false });
      } catch (e) {
        console.error("[SSE student-status] init error:", e);
        send("error", { message: "ไม่สามารถดึงข้อมูลได้" });
      }

      // Poll every 2s (faster than admin SSE because student is waiting for approval)
      let lastStatus = "";
      const interval = setInterval(async () => {
        if (closed) { clearInterval(interval); return; }
        try {
          const student = await fetchStatus();
          const currentStatus = student?.status || "not_found";
          if (currentStatus !== lastStatus) {
            lastStatus = currentStatus;
            send("status", student ? { found: true, student } : { found: false });

            // Stop polling once approved or rejected (terminal state)
            if (currentStatus === "approved" || currentStatus === "rejected") {
              clearInterval(interval);
              setTimeout(() => {
                try { controller.close(); } catch { /* ignore */ }
              }, 3000);
            }
          } else {
            send("heartbeat", { ts: Date.now() });
          }
        } catch { /* ignore */ }
      }, 2000);

      req.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(interval);
        try { controller.close(); } catch { /* ignore */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
