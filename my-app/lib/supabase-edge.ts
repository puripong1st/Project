// lib/supabase-edge.ts — Supabase REST API client (Edge Runtime compatible, no pg pool)
// ใช้ fetch() ล้วน ทำงานได้ใน Vercel Edge Runtime

const SUPABASE_URL = (process.env.NEXT_PUBLIC_SUPABASE_URL || "").replace(/\/$/, "");
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const BASE_HEADERS = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=representation",
};

type Row = Record<string, unknown>;

/** SELECT rows from a table */
export async function sbSelect(
  table: string,
  params: Record<string, string> = {},
  options: { single?: boolean; count?: boolean } = {}
): Promise<Row[]> {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  if (options.count) url.searchParams.set("select", "count");

  const res = await fetch(url.toString(), {
    headers: {
      ...BASE_HEADERS,
      ...(options.count ? { Prefer: "count=exact" } : {}),
    },
    // Edge: no keepalive needed (managed by Vercel infra)
  });

  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : data ? [data] : [];
}

/** SELECT with raw PostgREST filter string */
export async function sbRPC(
  table: string,
  select: string,
  filters: string[],
  order?: string,
  limit?: number
): Promise<Row[]> {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  url.searchParams.set("select", select);
  filters.forEach((f) => {
    const [col, op, val] = f.split(".", 3);
    url.searchParams.set(col, `${op}.${val}`);
  });
  if (order) url.searchParams.set("order", order);
  if (limit) url.searchParams.set("limit", String(limit));

  const res = await fetch(url.toString(), { headers: BASE_HEADERS });
  if (!res.ok) return [];
  return res.json();
}

/** UPDATE a row */
export async function sbUpdate(
  table: string,
  filters: Record<string, string>,
  data: Record<string, unknown>
): Promise<void> {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
  Object.entries(filters).forEach(([k, v]) => url.searchParams.set(k, `eq.${v}`));

  fetch(url.toString(), {
    method: "PATCH",
    headers: BASE_HEADERS,
    body: JSON.stringify(data),
  }).catch((e) => console.error("[supabase-edge] update error:", e));
}

/** UPSERT a row (INSERT … ON CONFLICT DO UPDATE) */
export async function sbUpsert(
  table: string,
  data: Record<string, unknown>,
  onConflict: string
): Promise<void> {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);

  fetch(url.toString(), {
    method: "POST",
    headers: { ...BASE_HEADERS, Prefer: `resolution=merge-duplicates,return=minimal` },
    body: JSON.stringify(data),
  }).catch((e) => console.error("[supabase-edge] upsert error:", e));
  void onConflict; // PostgREST handles via unique constraint automatically
}

/** Read specific system_settings keys (batch) */
export async function sbGetSettings(keys: string[]): Promise<Record<string, string>> {
  if (!keys.length) return {};
  // PostgREST: setting_key=in.(key1,key2,...)
  const url = new URL(`${SUPABASE_URL}/rest/v1/system_settings`);
  url.searchParams.set("setting_key", `in.(${keys.join(",")})`);
  url.searchParams.set("select", "setting_key,setting_value");

  const res = await fetch(url.toString(), { headers: BASE_HEADERS });
  if (!res.ok) return {};
  const rows: { setting_key: string; setting_value: string }[] = await res.json();
  return Object.fromEntries(rows.map((r) => [r.setting_key, r.setting_value]));
}

/** Read ALL system_settings (for full settings cache) */
export async function sbGetAllSettings(): Promise<Record<string, string>> {
  const url = new URL(`${SUPABASE_URL}/rest/v1/system_settings`);
  url.searchParams.set("select", "setting_key,setting_value");
  const res = await fetch(url.toString(), { headers: BASE_HEADERS });
  if (!res.ok) return {};
  const rows: { setting_key: string; setting_value: string }[] = await res.json();
  return Object.fromEntries(rows.map((r) => [r.setting_key, r.setting_value]));
}
