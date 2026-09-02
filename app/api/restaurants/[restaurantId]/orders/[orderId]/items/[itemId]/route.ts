import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/src/lib/db';
import { requireRestaurantAccess } from '@/src/lib/auth';
import { publishOrderEvent } from '@/src/lib/order-events';
import { errorResponse } from '@/src/lib/api-response';

const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('SERVE') }),
  z.object({
    action: z.literal('UNAVAILABLE'),
    note: z.string().trim().max(280).optional(),
  }),
]);

type RouteContext = {
  params: { restaurantId: string; orderId: string; itemId: string };
};

// Waiters mark individual items served as they're delivered (drinks out
// before the mains are ready, say) instead of the whole order at once.
// Kitchen marks an individual item unavailable (86'd) without rejecting
// the rest of the order — the customer sees this on their order-status
// page and can order something else instead.
export async function PATCH(req: NextRequest, { params }: RouteContext) {
  try {
    const access = await requireRestaurantAccess(params.restaurantId, 'STAFF');
    if (!access.ok) {
      return NextResponse.json({ error: access.message }, { status: access.status });
    }

    const body = schema.parse(await req.json());

    const item = await db.orderItem.findFirst({
      where: {
        id: params.itemId,
        orderId: params.orderId,
        order: { restaurantId: params.restaurantId },
      },
      include: { order: true },
    });

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    if (item.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Item is already ${item.status.toLowerCase()}` },
        { status: 409 }
      );
    }

    const now = new Date();

    if (body.action === 'SERVE') {
      if (item.order.status !== 'READY') {
        return NextResponse.json(
          { error: `Cannot serve an item until the order is READY (currently ${item.order.status})` },
          { status: 409 }
        );
      }

      const updatedItem = await db.$transaction(async (tx) => {
        const savedItem = await tx.orderItem.update({
          where: { id: item.id },
          data: { status: 'SERVED', servedAt: now },
        });

        await tx.orderEvent.create({
          data: {
            orderId: item.orderId,
            restaurantId: params.restaurantId,
            type: 'ITEM_SERVED',
            actorUserId: access.user.id,
            metadata: { itemId: item.id, nameSnapshot: item.nameSnapshot },
            createdAt: now,
          },
        });

        // Once every item that's still expected (i.e. not 86'd) has been
        // served, the order itself is done — complete it automatically so
        // the waiter doesn't also have to press a separate whole-order
        // button.
        const remaining = await tx.orderItem.count({
          where: { orderId: item.orderId, status: 'PENDING' },
        });

        if (remaining === 0 && item.order.status === 'READY') {
          await tx.order.update({
            where: { id: item.orderId },
            data: { status: 'COMPLETED', completedAt: now },
          });

          await tx.orderEvent.create({
            data: {
              orderId: item.orderId,
              restaurantId: params.restaurantId,
              type: 'ORDER_COMPLETED',
              actorUserId: access.user.id,
              metadata: { fromStatus: 'READY', toStatus: 'COMPLETED', auto: true },
              createdAt: now,
            },
          });
        }

        return savedItem;
      });

      publishOrderEvent(params.restaurantId, {
        type: 'ORDER_STATUS_CHANGED',
        orderId: item.orderId,
        status: item.order.status,
      });

      return NextResponse.json(updatedItem);
    }

    // UNAVAILABLE — only makes sense before the order has reached the
    // customer; once it's READY/COMPLETED the kitchen shouldn't be able to
    // retroactively 86 something that may already be on its way out.
    if (['READY', 'COMPLETED', 'CANCELLED', 'REJECTED'].includes(item.order.status)) {
      return NextResponse.json(
        { error: `Cannot mark an item unavailable once the order is ${item.order.status}` },
        { status: 409 }
      );
    }

    const newSubtotalCents = item.order.subtotalCents - item.lineTotalCents;
    const newTaxCents =
      item.order.subtotalCents > 0
        ? Math.round((item.order.taxCents * newSubtotalCents) / item.order.subtotalCents)
        : 0;
    const newTotalCents = newSubtotalCents + newTaxCents;

    const updatedItem = await db.$transaction(async (tx) => {
      const savedItem = await tx.orderItem.update({
        where: { id: item.id },
        data: {
          status: 'UNAVAILABLE',
          unavailableAt: now,
          unavailableNote: body.note || null,
        },
      });

      await tx.order.update({
        where: { id: item.orderId },
        data: {
          subtotalCents: newSubtotalCents,
          taxCents: newTaxCents,
          totalCents: newTotalCents,
        },
      });

      await tx.orderEvent.create({
        data: {
          orderId: item.orderId,
          restaurantId: params.restaurantId,
          type: 'ITEM_UNAVAILABLE',
          actorUserId: access.user.id,
          metadata: {
            itemId: item.id,
            nameSnapshot: item.nameSnapshot,
            note: body.note ?? null,
          },
          createdAt: now,
        },
      });

      return savedItem;
    });

    publishOrderEvent(params.restaurantId, {
      type: 'ORDER_STATUS_CHANGED',
      orderId: item.orderId,
      status: item.order.status,
    });

    return NextResponse.json(updatedItem);
  } catch (err) {
    return errorResponse(err);
  }
}
