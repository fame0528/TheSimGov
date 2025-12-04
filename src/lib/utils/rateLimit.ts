/**
 * Simple in-memory rate limiter for development.
 * Keys by userId and IP; returns Retry-After and X-RateLimit-* headers.
 */

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number; // epoch ms when window resets
};

const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimitKey(key: string, limit = 60, windowMs = 60_000): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, limit, remaining: Math.max(0, limit - 1), resetAt };
  }
  if (bucket.count < limit) {
    bucket.count += 1;
    return { allowed: true, limit, remaining: Math.max(0, limit - bucket.count), resetAt: bucket.resetAt };
  }
  return { allowed: false, limit, remaining: 0, resetAt: bucket.resetAt };
}

export function getClientIpFromHeaders(h: Headers): string {
  const fwd = h.get('x-forwarded-for') || h.get('X-Forwarded-For');
  if (fwd) {
    const first = fwd.split(',')[0]?.trim();
    if (first) return first;
  }
  const real = h.get('x-real-ip') || h.get('X-Real-IP');
  return real || 'unknown';
}

export async function rateLimitRequest(request: Request, userId?: string | null, options?: { limit?: number; windowMs?: number }): Promise<{
  allowed: boolean;
  result: RateLimitResult;
  headers: Record<string, string>;
}> {
  const limit = options?.limit ?? 60;
  const windowMs = options?.windowMs ?? 60_000;
  const ip = getClientIpFromHeaders(request.headers);
  const key = userId ? `u:${userId}` : `ip:${ip}`;
  const result = rateLimitKey(key, limit, windowMs);
  const retryAfterSec = Math.max(0, Math.ceil((result.resetAt - Date.now()) / 1000));
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.floor(result.resetAt / 1000)),
  };
  if (!result.allowed) headers['Retry-After'] = String(retryAfterSec);
  return { allowed: result.allowed, result, headers };
}
