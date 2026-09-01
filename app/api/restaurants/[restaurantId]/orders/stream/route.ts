import { NextRequest } from 'next/server';
import { requireRestaurantAccess } from '@/src/lib/auth';
import { subscribeOrderEvents } from '@/src/lib/order-events';

export const dynamic = 'force-dynamic';

// Server-Sent Events stream for the live order board. Simpler to operate
// than WebSockets for a one-directional "push new orders to staff" feed —
// no separate socket server, works over plain HTTP, and the browser's
// built-in EventSource handles reconnection automatically.
export async function GET(_req: NextRequest, { params }: { params: { restaurantId: string } }) {
  const access = await requireRestaurantAccess(params.restaurantId, 'STAFF');
  if (!access.ok) {
    return new Response('Not authorized', { status: access.status });
  }

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const send = (data: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      send({ type: 'CONNECTED' });
      const unsubscribe = subscribeOrderEvents(params.restaurantId, send);

      // Heartbeat keeps intermediary proxies/load balancers from closing
      // the connection as idle.
      const heartbeat = setInterval(() => controller.enqueue(encoder.encode(': ping\n\n')), 25000);

      const abort = () => {
        clearInterval(heartbeat);
        unsubscribe();
        controller.close();
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
