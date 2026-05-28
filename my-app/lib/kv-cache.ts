// lib/kv-cache.ts — Vercel KV (Redis) cache layer
// Falls back to in-memory if KV_REST_API_URL is not configured
import { kv } from "@vercel/kv";

const memoryCache = new Map<string, { value: unknown; expiresAt: number }>();

async function kvAvailable(): Promise<boolean> {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (await kvAvailable()) {
    try {
      return await kv.get<T>(key);
    } catch {
      // fall through to memory
    }
  }
  const entry = memoryCache.get(key);
  if (!entry || Date.now() > entry.expiresAt) return null;
  return entry.value as T;
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  if (await kvAvailable()) {
    try {
      await kv.set(key, value, { ex: ttlSeconds });
      return;
    } catch {
      // fall through to memory
    }
  }
  memoryCache.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

export async function cacheDel(key: string): Promise<void> {
  if (await kvAvailable()) {
    try { await kv.del(key); } catch { /* ignore */ }
  }
  memoryCache.delete(key);
}

// Invalidate system_settings cache — call this after saving settings
export async function invalidateSettingsCache(): Promise<void> {
  await cacheDel("system_settings:all");
}
