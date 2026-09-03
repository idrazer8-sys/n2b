import { NextRequest } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { requireRestaurantAccess } from '@/src/lib/auth';
import { subscribeOrderEvents } from '@/src/lib/order-events';

export const dynamic = 'force-dynamic';

// Server-Sent Events stream for the live order board. Simpler to operate
// than WebSockets for a one-directional "push new orders to staff" feed —
// no separate socket server, works over plain HTTP, and the browser's
// built-in EventSource handles reconnection automatically.
//
// The actual push mechanism (subscribeOrderEvents) is Postgres LISTEN/
// NOTIFY under the hood, not an in-process EventEmitter — see the comment
// at the top of src/lib/order-events.ts for why that swap was necessary
// for this to work correctly across multiple server instances.
export async function GET(_req: NextRequest, { params }: { params: { restaurantId: string } }) {
  const access = await requireRestaurantAccess(params.restaurantId, 'STAFF');
  if (!access.ok) {
    return new Response('Not authorized', { status: access.status });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let closed = false;

      const send = (data: unknown) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch (err) {
          // The client can disconnect between the abort listener firing and
          // a heartbeat/event tick already being in flight — enqueueing on a
          // closed controller throws. Not a bug worth paging on, but worth
          // knowing about if it happens far more than expected.
          Sentry.captureException(err, { tags: { area: 'order-events-sse-send' } });
        }
      };

      send({ type: 'CONNECTED' });

      let unsubscribe: (() => Promise<void>) | null = null;

      try {
        unsubscribe = await subscribeOrderEvents(params.restaurantId, send);
      } catch (err) {
        Sentry.captureException(err, {
          tags: { area: 'order-events-sse-subscribe' },
          extra: { restaurantId: params.restaurantId },
        });
        // Still keep the connection open on heartbeats alone rather than
        // failing the whole request — the client will just see no live
        // updates until it naturally reconnects, instead of an error loop.
      }

      // Heartbeat keeps intermediary proxies/load balancers from closing
      // the connection as idle.
      const heartbeat = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(': ping\n\n'));
        } catch (err) {
          Sentry.captureException(err, { tags: { area: 'order-events-sse-heartbeat' } });
        }
      }, 25000);

      const abort = () => {
        if (closed) return;
        closed = true;
        clearInterval(heartbeat);
        void unsubscribe?.();
        try {
          controller.close();
        } catch {
          // Already closed — fine.
        }
      };

      _req.signal.addEventListener('abort', abort);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
