// PDPA ม.19 + PDPC Cookie Guideline 2565 — Server-side consent audit trail
// Endpoints:
//   POST   /api/consent  → บันทึก consent ใหม่ / อัปเดต
//   GET    /api/consent  → ดึง consent ล่าสุดของ IP ปัจจุบัน (PDPA ม.30)
//   DELETE /api/consent  → ถอนความยินยอม (PDPA ม.19 วรรค 5)
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getPool, initDatabase } from "@/lib/db";
import { getClientIp } from "@/lib/client-ip";
import { withRateLimit } from "@/lib/rate-limit-middleware";

const CONSENT_VERSION = "2.0";
const VALID_ACTIONS = ["granted", "withdrawn", "updated", "declined"] as const;
type ConsentAction = (typeof VALID_ACTIONS)[number];

function hashIp(ip: string): string {
  // SHA-256 hash — ไม่เก็บ raw IP ใน consent_records
  return crypto.createHash("sha256").update(ip).digest("hex");
}

function generateUuid(): string {
  return crypto.randomUUID();
}

interface ConsentBody {
  functional?: boolean;
  analytics?: boolean;
  marketing?: boolean;
  action?: ConsentAction;
}

export async function POST(req: NextRequest) {
  const rl = await withRateLimit(req, "consent_post", 20, 60);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  await initDatabase();

  let body: ConsentBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const action: ConsentAction =
    body.action && VALID_ACTIONS.includes(body.action) ? body.action : "granted";

  const functional = Boolean(body.functional);
  const analytics = Boolean(body.analytics);
  const marketing = Boolean(body.marketing);

  const ip = getClientIp(req);
  const ipHash = hashIp(ip);
  const ua = (req.headers.get("user-agent") || "").slice(0, 500);
  const uuid = generateUuid();

  try {
    const pool = getPool();
    await pool.query(
      `INSERT INTO consent_records
         (consent_uuid, ip_hash, user_agent, version, necessary, functional, analytics, marketing, action)
       VALUES ($1, $2, $3, $4, TRUE, $5, $6, $7, $8)`,
      [uuid, ipHash, ua, CONSENT_VERSION, functional, analytics, marketing, action]
    );
    return NextResponse.json({
      ok: true,
      consent_uuid: uuid,
      version: CONSENT_VERSION,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[/api/consent POST]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const rl = await withRateLimit(req, "consent_get", 30, 60);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  await initDatabase();

  const ipHash = hashIp(getClientIp(req));
  try {
    const pool = getPool();
    const { rows } = await pool.query(
      `SELECT consent_uuid, version, necessary, functional, analytics, marketing, action, created_at
         FROM consent_records
        WHERE ip_hash = $1
        ORDER BY created_at DESC
        LIMIT 1`,
      [ipHash]
    );
    if (rows.length === 0) {
      return NextResponse.json({ found: false });
    }
    return NextResponse.json({ found: true, consent: rows[0] });
  } catch (err) {
    console.error("[/api/consent GET]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  // PDPA ม.19 วรรค 5: เพิกถอนต้องง่ายเท่ากับให้
  // เราไม่ลบประวัติ (เพื่อ audit trail) แต่บันทึก action='withdrawn' รายการใหม่
  const rl = await withRateLimit(req, "consent_delete", 10, 60);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  await initDatabase();

  const ip = getClientIp(req);
  const ipHash = hashIp(ip);
  const ua = (req.headers.get("user-agent") || "").slice(0, 500);
  const uuid = generateUuid();

  try {
    const pool = getPool();
    await pool.query(
      `INSERT INTO consent_records
         (consent_uuid, ip_hash, user_agent, version, necessary, functional, analytics, marketing, action)
       VALUES ($1, $2, $3, $4, TRUE, FALSE, FALSE, FALSE, 'withdrawn')`,
      [uuid, ipHash, ua, CONSENT_VERSION]
    );
    return NextResponse.json({
      ok: true,
      consent_uuid: uuid,
      withdrawn_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[/api/consent DELETE]", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
