// lib/auto-reject.ts — Auto-reject pending students after timeout
import { getPool } from "@/lib/db";
import { sendDiscordNotification } from "@/lib/discord";

const TIMEOUT_MINUTES = 5;
const AUTO_REJECT_REASON =
  "ไม่ได้รับการอนุมัติภายในเวลาที่กำหนด (เกิน 5 นาที) — ปฏิเสธอัตโนมัติโดยระบบ";

let lastRun = 0;
let inFlight: Promise<number> | null = null;

export async function sweepExpiredPending(): Promise<number> {
  const now = Date.now();
  if (inFlight) return inFlight;
  if (now - lastRun < 10_000) return 0;
  lastRun = now;

  inFlight = (async () => {
    const pool = getPool();
    try {
      const { rows } = await pool.query(
        `WITH expired AS (
           UPDATE students
              SET status = 'rejected',
                  rejection_reason = $1,
                  approved_at = CURRENT_TIMESTAMP
            WHERE status = 'pending'
              AND registered_at < NOW() - INTERVAL '${TIMEOUT_MINUTES} minutes'
            RETURNING id, first_name, last_name, student_id, requested_room
         ),
         logged AS (
           INSERT INTO access_logs (student_id, action, performed_by, notes, room_code)
           SELECT id, 'rejected', NULL, $2, COALESCE(requested_room, 'default') FROM expired
           RETURNING student_id
         )
         SELECT id, first_name, last_name, student_id, requested_room FROM expired`,
        [AUTO_REJECT_REASON, `เหตุผล: ${AUTO_REJECT_REASON} | โดย: ระบบอัตโนมัติ`]
      );

      for (const s of rows as Array<{
        first_name: string;
        last_name: string;
        student_id: string;
        requested_room: string;
      }>) {
        sendDiscordNotification("student_rejected", {
          studentName: `${s.first_name} ${s.last_name}`,
          studentId: s.student_id,
          adminName: "ระบบอัตโนมัติ",
          reason: AUTO_REJECT_REASON,
          room: s.requested_room,
        }).catch(() => {});
      }

      return rows.length;
    } catch (err) {
      console.error("[AutoReject] sweep failed:", err);
      return 0;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}
