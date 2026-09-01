// Minimal in-memory sliding-window rate limiter for the MVP. Good enough for
// a single-instance deploy; swap for a Redis/Upstash-backed limiter before
// running on multiple serverless instances (in-memory state won't be shared).
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }

  if (bucket.count >= limit) {
    return { ok: false, remaining: 0, retryAfterMs: bucket.resetAt - now };
  }

  bucket.count += 1;
  return { ok: true, remaining: limit - bucket.count };
}

// Best-effort caller identity for rate limiting when there's no session yet
// (e.g. login attempts) — IP address from standard proxy headers.
export function clientIp(headers: Headers) {
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? headers.get('x-real-ip') ?? 'unknown';
}
