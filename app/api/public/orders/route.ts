import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/src/lib/db';
import { priceCart } from '@/src/lib/pricing';
import {
  verifyCustomerSession,
  readSessionTokenFromCookies,
} from '@/src/lib/customer-session';
import { errorResponse } from '@/src/lib/api-response';
import { rateLimit, clientIp } from '@/src/lib/rate-limit';
import { publishOrderEvent } from '@/src/lib/order-events';
import { verifySameOrigin, crossOriginRejection } from '@/src/lib/csrf';

const lineSchema = z.object({
  menuItemId: z.string().min(1),
  quantity: z.number().int().min(1).max(50),
  selectedOptionIds: z.array(z.string()).max(50).default([]),
  notes: z.string().max(280).optional(),
});

const schema = z.object({
  restaurantSlug: z.string().min(1),
  lines: z.array(lineSchema).min(1).max(60),
  orderNotes: z.string().max(280).optional(),
});

// Creates a new Order with server-computed pricing.
// Orders immediately enter the normal restaurant workflow as NEW.
// The current PRIMARY waiter is snapshotted on the order when available.
// Payment is handled separately when the table finishes the meal.
export async function POST(req: NextRequest) {
  try {
    if (!verifySameOrigin(req)) {
      return crossOriginRejection();
    }

    const ip = clientIp(req.headers);

    const limited = await rateLimit(
      `create-order:${ip}`,
      30,
      10 * 60 * 1000
    );

    if (!limited.ok) {
      return NextResponse.json(
        { error: 'Too many requests, slow down' },
        { status: 429 }
      );
    }

    const body = schema.parse(await req.json());

    const restaurant = await db.restaurant.findUnique({
      where: {
        slug: body.restaurantSlug,
      },
    });

    if (!restaurant || !restaurant.isActive) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    if (!restaurant.isOpen) {
      return NextResponse.json(
        {
          error:
            'This restaurant is currently closed',
        },
        { status: 409 }
      );
    }

    const sessionToken =
      readSessionTokenFromCookies(
        restaurant.id
      );

    const customerSession =
      await verifyCustomerSession(
        restaurant.id,
        sessionToken
      );

    if (!customerSession) {
      return NextResponse.json(
        {
          error:
            'Session expired — please rescan the table QR code',
        },
        { status: 401 }
      );
    }

    const {
      pricedLines,
      subtotalCents,
      taxCents,
      totalCents,
    } = await priceCart(
      restaurant.id,
      body.lines
    );

    const order = await db.$transaction(
      async (tx) => {
        // Atomically claim the next order number. Postgres serializes
        // concurrent UPDATEs to the same row, so two simultaneous orders
        // can never be handed the same number the way a separate
        // "read MAX(orderNumber), then insert +1" could (and did, under
        // load — a unique constraint violation that dropped the order).
        const restaurantWithNumber =
          await tx.restaurant.update({
            where: {
              id: restaurant.id,
            },
            data: {
              nextOrderNumber: {
                increment: 1,
              },
            },
            select: {
              nextOrderNumber: true,
            },
          });

        const orderNumber =
          restaurantWithNumber.nextOrderNumber -
          1;

        // Snapshot the PRIMARY waiter currently
        // assigned to this table.
        const primaryAssignment =
          await tx.tableAssignment.findFirst({
            where: {
              restaurantId:
                restaurant.id,
              tableId:
                customerSession.tableId,
              role: 'PRIMARY',
              endedAt: null,
            },
            orderBy: {
              assignedAt: 'desc',
            },
            select: {
              staffId: true,
            },
          });

        const createdOrder =
          await tx.order.create({
            data: {
              restaurantId:
                restaurant.id,
              tableId:
                customerSession.tableId,
              customerSessionId:
                customerSession.id,
              staffId:
                primaryAssignment?.staffId ??
                null,
              orderNumber,
              status: 'NEW',
              notes:
                body.orderNotes?.slice(
                  0,
                  280
                ),
              subtotalCents,
              taxCents,
              totalCents,
              currency:
                restaurant.currency,
              items: {
                create:
                  pricedLines.map(
                    (line) => ({
                      menuItemId:
                        line.menuItemId,
                      nameSnapshot:
                        line.nameSnapshot,
                      unitPriceCents:
                        line.unitPriceCents,
                      quantity:
                        line.quantity,
                      lineTotalCents:
                        line.lineTotalCents,
                      allergensSnapshot:
                        line.allergensSnapshot,
                      dietaryTagsSnapshot:
                        line.dietaryTagsSnapshot,
                      vatRateBpsSnapshot:
                        line.vatRateBpsSnapshot,
                      notes:
                        line.notes,
                      modifiers: {
                        create:
                          line.modifiers.map(
                            (modifier) => ({
                              modifierOptionId:
                                modifier.modifierOptionId,
                              nameSnapshot:
                                modifier.nameSnapshot,
                              priceDeltaCentsSnapshot:
                                modifier.priceDeltaCentsSnapshot,
                            })
                          ),
                      },
                    })
                  ),
              },
            },
            include: {
              items: {
                include: {
                  modifiers: true,
                },
              },
            },
          });

        await tx.orderEvent.create({
          data: {
            orderId:
              createdOrder.id,
            restaurantId:
              restaurant.id,
            type:
              'ORDER_CREATED',
            actorUserId: null,
            metadata: {
              orderNumber:
                createdOrder.orderNumber,
              source: 'customer',
              staffId:
                createdOrder.staffId,
            },
          },
        });

        return createdOrder;
      },
      // A burst of simultaneous orders for the same restaurant serializes
      // on the nextOrderNumber row lock — later ones in the queue can
      // outlive Prisma's 5s default interactive-transaction timeout while
      // just waiting their turn, not because any single query is slow.
      { timeout: 15000 }
    );

    publishOrderEvent(
      restaurant.id,
      {
        type: 'ORDER_CREATED',
        orderId: order.id,
      }
    );

    return NextResponse.json(
      order,
      {
        status: 201,
      }
    );
  } catch (err) {
    return errorResponse(err);
  }
}