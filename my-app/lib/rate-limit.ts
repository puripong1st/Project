import { getPool } from "./db";

export interface RateLimitOptions {
  key: string;
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  count: number;
  resetTime: number;
}

/**
 * Atomic PostgreSQL-backed rate limiter for serverless environments.
 * Uses a single query with ON CONFLICT DO UPDATE to ensure race-condition safety.
 */
export async function rateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
  const { key, limit, windowMs } = options;
  const pool = getPool();
  const now = Date.now();
  const defaultResetTime = now + windowMs;

  const query = `
    INSERT INTO rate_limits (key, count, reset_time)
    VALUES ($1, 1, $2)
    ON CONFLICT (key)
    DO UPDATE SET
      count = CASE WHEN $3 < rate_limits.reset_time THEN rate_limits.count + 1 ELSE 1 END,
      reset_time = CASE WHEN $3 < rate_limits.reset_time THEN rate_limits.reset_time ELSE $4 END
    RETURNING count, reset_time;
  `;

  const { rows } = await pool.query(query, [key, defaultResetTime, now, defaultResetTime]);
  const current = rows[0];

  return {
    success: current.count <= limit,
    count: current.count,
    resetTime: Number(current.reset_time),
  };
}
