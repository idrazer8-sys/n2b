import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/src/lib/db';
import { requireRestaurantAccess } from '@/src/lib/auth';
import { publishOrderEvent } from '@/src/lib/order-events';
import { errorResponse } from '@/src/lib/api-response';
import { ALLOWED_TRANSITIONS } from '@/src/lib/order-state-machine';

const schema = z.object({
  status: z.enum([
    'ACCEPTED',
    'REJECTED',
    'PREPARING',
    'READY',
    'COMPLETED',
    'CANCELLED',
  ]),
});

const EVENT_BY_STATUS = {
  ACCEPTED: 'ORDER_ACCEPTED',
  REJECTED: 'ORDER_REJECTED',
  PREPARING: 'ORDER_PREPARING',
  READY: 'ORDER_READY',
  COMPLETED: 'ORDER_COMPLETED',
  CANCELLED: 'ORDER_CANCELLED',
} as const;

export async function PATCH(
  req: NextRequest,
  {
    params,
  }: {
    params: {
      restaurantId: string;
      orderId: string;
    };
  }
) {
  try {
    const access = await requireRestaurantAccess(
      params.restaurantId,
      'STAFF'
    );

    if (!access.ok) {
      return NextResponse.json(
        { error: access.message },
        { status: access.status }
      );
    }

    const body = schema.parse(await req.json());

    const order = await db.order.findFirst({
      where: {
        id: params.orderId,
        restaurantId: params.restaurantId,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const allowed =
      ALLOWED_TRANSITIONS[order.status] ?? [];

    if (!allowed.includes(body.status)) {
      return NextResponse.json(
        {
          error: `Cannot move order from ${order.status} to ${body.status}`,
        },
        { status: 409 }
      );
    }

    const now = new Date();

    let timestampField:
      | 'acceptedAt'
      | 'preparingAt'
      | 'readyAt'
      | 'completedAt'
      | 'rejectedAt'
      | 'cancelledAt'
      | undefined;

    switch (body.status) {
      case 'ACCEPTED':
        timestampField = 'acceptedAt';
        break;

      case 'PREPARING':
        timestampField = 'preparingAt';
        break;

      case 'READY':
        timestampField = 'readyAt';
        break;

      case 'COMPLETED':
        timestampField = 'completedAt';
        break;

      case 'REJECTED':
        timestampField = 'rejectedAt';
        break;

      case 'CANCELLED':
        timestampField = 'cancelledAt';
        break;
    }

    const eventType =
      EVENT_BY_STATUS[body.status];

    const updated = await db.$transaction(
      async (tx) => {
        const updatedOrder =
          await tx.order.update({
            where: {
              id: params.orderId,
            },
            data: {
              status: body.status,
              ...(timestampField
                ? {
                    [timestampField]: now,
                  }
                : {}),
            },
          });

        await tx.orderEvent.create({
          data: {
            orderId: order.id,
            restaurantId:
              params.restaurantId,
            type: eventType,
            actorUserId:
              access.user.id,
            metadata: {
              fromStatus: order.status,
              toStatus: body.status,
            },
            createdAt: now,
          },
        });

        return updatedOrder;
      }
    );

    publishOrderEvent(
      params.restaurantId,
      {
        type: 'ORDER_STATUS_CHANGED',
        orderId: params.orderId,
        status: body.status,
      }
    );

    if (body.status === 'READY') {
      publishOrderEvent(
        params.restaurantId,
        {
          type: 'ORDER_READY',
          orderId: params.orderId,
        }
      );
    }

    return NextResponse.json(updated);
  } catch (err) {
    return errorResponse(err);
  }
}