import { afterAll, describe, expect, it } from 'vitest';
import { rateLimit } from '../src/lib/rate-limit';
import { db } from '../src/lib/db';

// Integration tests against the real DB — RateLimitBucket only being real
// shared state (not a per-instance in-memory Map) is the entire point of
// this module, so a mock would test nothing meaningful. Each test uses a
// unique key and cleans up after itself.
const testKeys: string[] = [];

function uniqueKey(label: string) {
  const key = `test-${label}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  testKeys.push(key);
  return key;
}

afterAll(async () => {
  await db.rateLimitBucket.deleteMany({ where: { key: { in: testKeys } } });
});

describe('rateLimit', () => {
  it('allows requests up to the limit, then blocks', async () => {
    const key = uniqueKey('sequential');

    const results = [];
    for (let i = 0; i < 7; i++) {
      results.push(await rateLimit(key, 5, 60_000));
    }

    expect(results.slice(0, 5).every((r) => r.ok)).toBe(true);
    expect(results.slice(5).every((r) => !r.ok)).toBe(true);
  });

  it('never lets more than `limit` concurrent requests through for the same key', async () => {
    const key = uniqueKey('concurrent');

    const results = await Promise.all(
      Array.from({ length: 10 }, () => rateLimit(key, 5, 60_000))
    );

    const allowed = results.filter((r) => r.ok).length;
    // The atomic INSERT ... ON CONFLICT is what guarantees this is exactly
    // 5, not "5 or fewer due to a lost update" — a naive read-then-write
    // implementation could let more than 5 through under real concurrency.
    expect(allowed).toBe(5);
  });

  it('resets the count once the window has passed', async () => {
    const key = uniqueKey('reset');

    const first = await rateLimit(key, 1, 300);
    expect(first.ok).toBe(true);

    const second = await rateLimit(key, 1, 300);
    expect(second.ok).toBe(false);

    await new Promise((resolve) => setTimeout(resolve, 400));

    const third = await rateLimit(key, 1, 300);
    expect(third.ok).toBe(true);
  });

  it('tracks separate keys independently', async () => {
    const keyA = uniqueKey('independent-a');
    const keyB = uniqueKey('independent-b');

    await rateLimit(keyA, 1, 60_000);
    const blockedA = await rateLimit(keyA, 1, 60_000);
    const okB = await rateLimit(keyB, 1, 60_000);

    expect(blockedA.ok).toBe(false);
    expect(okB.ok).toBe(true);
  });
});
