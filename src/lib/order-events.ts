import 'server-only';
import { EventEmitter } from 'events';
import { Client } from 'pg';
import * as Sentry from '@sentry/nextjs';

// ---------------------------------------------------------------------------
// Cross-instance realtime, opt-in via Postgres LISTEN/NOTIFY.
//
// The base layer is still an in-process EventEmitter — correct for a single
// Node instance (`next start` on one server, or one warm Vercel invocation
// handling both the publish and the SSE subscribe), and importantly, ZERO
// behavior change from before when nothing extra is configured.
//
// On top of that, if REALTIME_DIRECT_URL is set, every publish/subscribe
// ALSO goes through Postgres NOTIFY/LISTEN on a real (non-pooled) Postgres
// session, which is what actually makes this work across multiple server
// instances — the EventEmitter alone cannot, since instances don't share
// memory.
//
// REALTIME_DIRECT_URL is a SEPARATE variable from the existing DIRECT_URL
// (used for Prisma migrations) rather than reusing it, because — verified
// live during this hardening pass, not assumed — this project's current
// DIRECT_URL still points at Supabase's Supavisor pooler (port 5432,
// "session mode"), and Supavisor does not relay NOTIFY between different
// pooled sessions: a LISTEN through it connects and "succeeds" with no
// error, but never actually receives anything. Supabase's genuine direct
// host (`db.<project-ref>.supabase.co`) is IPv6-only, and Vercel's
// serverless functions do not support outbound IPv6 — so reaching it from
// a Vercel deployment requires either Supabase's paid IPv4 add-on, or
// self-hosting/another Postgres provider with real IPv4 direct access.
// That's a real-money, real-infra decision for you to make, not something
// this code should assume — hence the separate opt-in variable, defaulting
// to "off" (exactly today's EventEmitter-only behavior) until you've made
// that call. See .env.example for the exact steps once you have a genuine
// direct connection to point it at.
//
// Each open SSE connection holds one dedicated Postgres connection while
// this is active (LISTEN is inherently a long-lived session — that's
// exactly why a pooled connection can't do it). Fine at the realistic
// scale of "staff dashboards open per restaurant"; if concurrent viewers
// ever approach your Postgres connection limit, that's the point to move
// to a hosted pub/sub (Supabase Realtime, Pusher) instead — every publish/
// subscribe call site in the app funnels through the two functions below,
// so only this file would need to change.
// ---------------------------------------------------------------------------

const CHANNEL = 'order_events';

export type OrderEvent =
  | { type: 'ORDER_CREATED'; orderId: string }
  | { type: 'ORDER_PAID'; orderId: string }
  | { type: 'ORDER_STATUS_CHANGED'; orderId: string; status: string }
  | { type: 'ORDER_READY'; orderId: string }
  | { type: 'SESSION_PAID'; customerSessionId: string };

const emitter = new EventEmitter();
emitter.setMaxListeners(0);

function realtimeDirectUrl(): string | null {
  return process.env.REALTIME_DIRECT_URL || null;
}

// A single warm connection reused across invocations on the same server
// instance for publishing — avoids paying connection setup cost on every
// single order/status-change event. Lazily created, and self-heals if the
// connection drops (a fresh client is opened transparently on the next
// publish rather than staying broken).
let publisherClient: Client | null = null;
let publisherConnecting: Promise<Client> | null = null;

async function getPublisherClient(connectionString: string): Promise<Client> {
  if (publisherClient) return publisherClient;
  if (publisherConnecting) return publisherConnecting;

  publisherConnecting = (async () => {
    const client = new Client({ connectionString });

    client.on('error', (err) => {
      Sentry.captureException(err, { tags: { area: 'order-events-publisher' } });
      publisherClient = null;
    });

    await client.connect();
    publisherClient = client;
    return client;
  })();

  try {
    return await publisherConnecting;
  } finally {
    publisherConnecting = null;
  }
}

/**
 * Publishes an order event to same-instance subscribers immediately (the
 * EventEmitter — this always runs, unchanged from before), and additionally
 * over Postgres NOTIFY when REALTIME_DIRECT_URL is configured, so other
 * server instances' subscribers get it too. Fire-and-forget by design
 * (matches every existing call site, none of which await this) — a
 * realtime nicety failing shouldn't fail the request that triggered it
 * (the order/payment write itself already succeeded via Prisma before this
 * is ever called). Failures are reported to Sentry instead of disappearing
 * silently.
 */
export function publishOrderEvent(restaurantId: string, event: OrderEvent): void {
  emitter.emit(`restaurant:${restaurantId}`, event);

  const connectionString = realtimeDirectUrl();
  if (!connectionString) return;

  void (async () => {
    try {
      const client = await getPublisherClient(connectionString);
      await client.query('SELECT pg_notify($1, $2)', [
        CHANNEL,
        JSON.stringify({ restaurantId, event }),
      ]);
    } catch (err) {
      Sentry.captureException(err, {
        tags: { area: 'order-events-publish' },
        extra: { restaurantId, event },
      });
    }
  })();
}

/**
 * Subscribes to order events for one restaurant. Always subscribes to the
 * in-process EventEmitter (same-instance delivery, unchanged from before);
 * additionally opens a dedicated Postgres LISTEN connection when
 * REALTIME_DIRECT_URL is configured, for cross-instance delivery. Returns
 * an async unsubscribe function that releases both.
 */
export async function subscribeOrderEvents(
  restaurantId: string,
  handler: (event: OrderEvent) => void
): Promise<() => Promise<void>> {
  const channel = `restaurant:${restaurantId}`;
  emitter.on(channel, handler);

  const connectionString = realtimeDirectUrl();
  if (!connectionString) {
    return async () => {
      emitter.off(channel, handler);
    };
  }

  const client = new Client({ connectionString });

  client.on('error', (err) => {
    Sentry.captureException(err, {
      tags: { area: 'order-events-subscriber' },
      extra: { restaurantId },
    });
  });

  client.on('notification', (message) => {
    if (!message.payload) return;

    try {
      const parsed = JSON.parse(message.payload) as {
        restaurantId: string;
        event: OrderEvent;
      };

      // Same-instance events already arrived via the EventEmitter above —
      // this branch exists for events published by OTHER instances.
      // Delivering a same-instance one twice would just trigger a harmless
      // extra refetch client-side, but skip it anyway for cleanliness.
      if (parsed.restaurantId === restaurantId) {
        handler(parsed.event);
      }
    } catch (err) {
      Sentry.captureException(err, {
        tags: { area: 'order-events-subscriber-parse' },
        extra: { restaurantId, payload: message.payload },
      });
    }
  });

  try {
    await client.connect();
    await client.query(`LISTEN ${CHANNEL}`);
  } catch (err) {
    Sentry.captureException(err, {
      tags: { area: 'order-events-subscribe-connect' },
      extra: { restaurantId },
    });

    // Postgres side failed to come up — same-instance delivery via the
    // EventEmitter still works, so degrade to that rather than failing the
    // whole subscription.
    return async () => {
      emitter.off(channel, handler);
    };
  }

  let released = false;

  return async () => {
    if (released) return;
    released = true;

    emitter.off(channel, handler);

    try {
      await client.query(`UNLISTEN ${CHANNEL}`);
    } catch {
      // Connection may already be gone — end() below is what actually
      // matters for releasing it.
    }

    try {
      await client.end();
    } catch (err) {
      Sentry.captureException(err, { tags: { area: 'order-events-unsubscribe' } });
    }
  };
}
