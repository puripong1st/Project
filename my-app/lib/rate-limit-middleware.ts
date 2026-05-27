import { NextRequest } from "next/server";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/client-ip";

/**
 * Universal rate-limiting middleware wrapper for Next.js API Routes.
 * Relies on the robust PostgreSQL ON CONFLICT rate limiter.
 */
export async function withRateLimit(
  request: NextRequest,
  endpoint: string,
  maxRequests: number,
  windowSeconds: number = 60
): Promise<{ allowed: boolean; remaining: number }> {
  const ip = getClientIp(request);

  const result = await rateLimit({
    key: `${endpoint}:${ip}`,
    limit: maxRequests,
    windowMs: windowSeconds * 1000,
  });

  const remaining = Math.max(0, maxRequests - result.count);

  return {
    allowed: result.success,
    remaining,
  };
}
