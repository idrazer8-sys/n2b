import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/src/lib/db';
import { requireRestaurantAccess } from '@/src/lib/auth';
import { publishOrderEvent } from '@/src/lib/order-events';
import { errorResponse } from '@/src/lib/api-response';

const schema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('SERVE') }),
  z.object({ action: z.literal('SEND_TO_WAITER') }),
  z.object({
    action: z.literal('UNAVAILABLE'),
    note: z.string().trim().max(280).optional(),
  }),
]);

type RouteContext = {
  params: { restaurantId: string; orderId: string; itemId: string };
};

const NOT_YET_READY = ['NEW', 'ACCEPTED', 'PREPARING'];
const TERMINAL_ORDER_STATUSES = ['COMPLETED', 'CANCELLED', 'REJECTED'];

// Waiters mark individual items served as they're delivered (drinks out
// before the mains are ready, say) instead of the whole order at once.
// Kitchen can also release a single item to the waiter early — a drink
// sitting in an otherwise food-heavy order — without waiting for the
// rest of the order to reach READY, or mark an item unavailable (86'd)
// without rejecting the rest of the order.
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

    const now = new Date();

    if (body.action === 'SEND_TO_WAITER') {
      if (item.status !== 'PENDING') {
        return NextResponse.json(
          { error: `Item is already ${item.status.toLowerCase()}` },
          { status: 409 }
        );
      }

      if (!NOT_YET_READY.includes(item.order.status)) {
        return NextResponse.json(
          { error: `Order is already ${item.order.status} — nothing to send ahead` },
          { status: 409 }
        );
      }

      const { updatedItem, orderAdvancedToReady } = await db.$transaction(async (tx) => {
        const savedItem = await tx.orderItem.update({
          where: { id: item.id },
          data: { status: 'SENT_TO_WAITER', sentToWaiterAt: now },
        });

        await tx.orderEvent.create({
          data: {
            orderId: item.orderId,
            restaurantId: params.restaurantId,
            type: 'ITEM_SENT_TO_WAITER',
            actorUserId: access.user.id,
            metadata: { itemId: item.id, nameSnapshot: item.nameSnapshot },
            createdAt: now,
          },
        });

        // If every item the kitchen still owed has now either been sent
        // ahead to the waiter or 86'd, there's nothing left to accept or
        // prepare — advance the order straight to READY so it drops off
        // the kitchen's Nuevos/Aceptados/En preparación board immediately,
        // the same way a single-item "send direct to waiter" order would,
        // instead of sitting there needing pointless Accept/Prepare taps
        // for an order the kitchen has no further work on.
        const remainingPending = await tx.orderItem.count({
          where: { orderId: item.orderId, status: 'PENDING' },
        });

        let advanced = false;

        if (remainingPending === 0 && NOT_YET_READY.includes(item.order.status)) {
          await tx.order.update({
            where: { id: item.orderId },
            data: { status: 'READY', readyAt: now },
          });

          await tx.orderEvent.create({
            data: {
              orderId: item.orderId,
              restaurantId: params.restaurantId,
              type: 'ORDER_READY',
              actorUserId: access.user.id,
              metadata: {
                fromStatus: item.order.status,
                toStatus: 'READY',
                auto: true,
                reason: 'all_items_sent_to_waiter',
              },
              createdAt: now,
            },
          });

          advanced = true;
        }

        return { updatedItem: savedItem, orderAdvancedToReady: advanced };
      });

      publishOrderEvent(params.restaurantId, {
        type: 'ORDER_STATUS_CHANGED',
        orderId: item.orderId,
        status: orderAdvancedToReady ? 'READY' : item.order.status,
      });

      if (orderAdvancedToReady) {
        publishOrderEvent(params.restaurantId, {
          type: 'ORDER_READY',
          orderId: item.orderId,
        });
      }

      return NextResponse.json(updatedItem);
    }

    if (body.action === 'SERVE') {
      const eligible =
        (item.status === 'PENDING' && item.order.status === 'READY') ||
        item.status === 'SENT_TO_WAITER';

      if (!eligible) {
        return NextResponse.json(
          {
            error:
              item.status !== 'PENDING' && item.status !== 'SENT_TO_WAITER'
                ? `Item is already ${item.status.toLowerCase()}`
                : `Cannot serve an item until the order is READY or it's been sent ahead (currently ${item.order.status})`,
          },
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
        // nobody has to also press a separate whole-order button. This can
        // now happen even while the order's own status never reached
        // READY, if every item was individually sent ahead and served.
        const remaining = await tx.orderItem.count({
          where: {
            orderId: item.orderId,
            status: { in: ['PENDING', 'SENT_TO_WAITER'] },
          },
        });

        if (
          remaining === 0 &&
          !TERMINAL_ORDER_STATUSES.includes(item.order.status)
        ) {
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
              metadata: {
                fromStatus: item.order.status,
                toStatus: 'COMPLETED',
                auto: true,
              },
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

    // UNAVAILABLE — only makes sense before the item's left the kitchen;
    // once it's been sent to the waiter, served, or the whole order is
    // READY/done, the kitchen shouldn't be able to retroactively 86 it.
    if (item.status !== 'PENDING') {
      return NextResponse.json(
        { error: `Item is already ${item.status.toLowerCase()}` },
        { status: 409 }
      );
    }

    if (!NOT_YET_READY.includes(item.order.status)) {
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
