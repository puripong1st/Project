// app/api/sse/route.ts — Server-Sent Events for real-time dashboard updates
// Replaces 10s interval polling for students/logs with push-based updates
import { NextRequest } from "next/server";
import { initDatabase, getPool } from "@/lib/db";
import { getAdminFromCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";
// Vercel caps serverless duration; cap the stream lifetime so the client
// reconnects cleanly instead of the platform killing it mid-flight.
export const maxDuration = 60;

// Poll DB every 8s (was 3s) — cuts query volume ~60% per open tab while
// staying near-real-time for approving pending requests on free Supabase.
const POLL_INTERVAL_MS = 8000;
// Close the stream just before maxDuration so the EventSource reconnects.
const STREAM_LIFETIME_MS = 50_000;

let initialized = false;
async function ensureInit() {
  if (!initialized) {
    await initDatabase();
    initialized = true;
  }
}

async function fetchSnapshot() {
  const pool = getPool();
  // Only pending + logs are consumed by the dashboard (applySnapshot).
  // The previous room_last_seen query was unused, so it's removed.
  const [pendingRes, logsRes] = await Promise.all([
    pool.query(
      `SELECT s.*, CONCAT(a.full_name) as approved_by_name
       FROM students s
       LEFT JOIN admin_users a ON s.approved_by = a.id
       WHERE s.status = 'pending'
       ORDER BY s.registered_at DESC`
    ),
    pool.query(
      `SELECT al.*,
         CONCAT(s.first_name, ' ', s.last_name) as student_name,
         s.student_id as student_code,
         s.requested_room as requested_room,
         a.full_name as admin_name
       FROM access_logs al
       LEFT JOIN students s ON al.student_id = s.id
       LEFT JOIN admin_users a ON al.performed_by = a.id
       ORDER BY al.timestamp DESC LIMIT 50`
    ),
  ]);

  return {
    pending: pendingRes.rows,
    logs: logsRes.rows,
    ts: Date.now(),
  };
}

export async function GET(req: NextRequest) {
  await ensureInit();
  const admin = await getAdminFromCookie();
  if (!admin) {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          closed = true;
        }
      };

      // Initial snapshot immediately on connect
      try {
        const snapshot = await fetchSnapshot();
        send("snapshot", snapshot);
      } catch (e) {
        console.error("[SSE] initial snapshot error:", e);
      }

      // Poll DB on an interval and push only if changed
      let lastHash = "";
      const interval = setInterval(async () => {
        if (closed) {
          clearInterval(interval);
          return;
        }
        try {
          const snapshot = await fetchSnapshot();
          // Simple change detection via pending count + last log id
          const hash = `${snapshot.pending.length}:${snapshot.logs[0]?.id ?? ""}`;
          if (hash !== lastHash) {
            lastHash = hash;
            send("update", snapshot);
          } else {
            // Heartbeat to keep connection alive
            send("heartbeat", { ts: Date.now() });
          }
        } catch (e) {
          console.error("[SSE] poll error:", e);
        }
      }, POLL_INTERVAL_MS);

      // Proactively end the stream before Vercel's function timeout so the
      // browser EventSource reconnects cleanly instead of erroring out.
      const lifetimeTimer = setTimeout(() => {
        closed = true;
        clearInterval(interval);
        try { controller.close(); } catch { /* already closed */ }
      }, STREAM_LIFETIME_MS);

      // Clean up when client disconnects
      req.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(interval);
        clearTimeout(lifetimeTimer);
        try { controller.close(); } catch { /* already closed */ }
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
