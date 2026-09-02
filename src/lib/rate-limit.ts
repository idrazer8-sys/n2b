import { db } from './db';

// Sliding-window-ish rate limiter backed by RateLimitBucket, so the count
// is real shared state across every serverless instance — a plain
// in-memory Map (the original implementation) resets per cold start and
// can land a brute-force login or order-spam run on a fresh, empty bucket
// on nearly every request on Vercel, making it decorative in production.
//
// The INSERT ... ON CONFLICT below is one atomic statement: concurrent
// requests for the same key can't both read count=N and both write N+1
// (the classic lost-update race), because Postgres serializes the
// conflicting writes at the row level, same as the nextOrderNumber counter
// in app/api/public/orders/route.ts.
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<{ ok: boolean; remaining: number; retryAfterMs?: number }> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMs);

  const rows = await db.$queryRaw<
    { count: number; resetAt: Date }[]
  >`
    INSERT INTO "RateLimitBucket" ("key", "count", "resetAt")
    VALUES (${key}, 1, ${resetAt})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "RateLimitBucket"."resetAt" < ${now} THEN 1
        ELSE "RateLimitBucket"."count" + 1
      END,
      "resetAt" = CASE
        WHEN "RateLimitBucket"."resetAt" < ${now} THEN ${resetAt}
        ELSE "RateLimitBucket"."resetAt"
      END
    RETURNING "count", "resetAt"
  `;

  const bucket = rows[0];

  // Opportunistic cleanup so the table doesn't grow forever — cheap,
  // no cron needed, and harmless if it occasionally overlaps another
  // request's cleanup sweep.
  if (Math.random() < 0.01) {
    const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    void db.rateLimitBucket
      .deleteMany({ where: { resetAt: { lt: cutoff } } })
      .catch(() => {});
  }

  if (bucket.count > limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterMs: Math.max(0, bucket.resetAt.getTime() - now.getTime()),
    };
  }

  return { ok: true, remaining: limit - bucket.count };
}

// Best-effort caller identity for rate limiting when there's no session yet
// (e.g. login attempts) — IP address from standard proxy headers.
export function clientIp(headers: Headers) {
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? headers.get('x-real-ip') ?? 'unknown';
}
