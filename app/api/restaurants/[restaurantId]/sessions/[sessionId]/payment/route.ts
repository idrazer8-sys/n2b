import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/lib/db';
import { requireRestaurantAccess } from '@/src/lib/auth';
import { publishOrderEvent } from '@/src/lib/order-events';

export async function POST(
  _req: NextRequest,
  {
    params,
  }: {
    params: {
      restaurantId: string;
      sessionId: string;
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

    const session =
      await db.customerSession.findFirst({
        where: {
          id: params.sessionId,
          restaurantId: params.restaurantId,
        },
        include: {
          sessionPayment: true,
          orders: {
            where: {
              status: {
                notIn: ['REJECTED', 'CANCELLED'],
              },
            },
            select: {
              id: true,
              restaurantId: true,
              status: true,
              paidAt: true,
            },
          },
        },
      });

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    if (!session.sessionPayment) {
      return NextResponse.json(
        {
          error:
            'No payment request exists for this session',
        },
        { status: 409 }
      );
    }

    if (
      session.sessionPayment.paymentMethod !==
      'PAY_AT_RESTAURANT'
    ) {
      return NextResponse.json(
        {
          error:
            'This session uses online payment',
        },
        { status: 409 }
      );
    }

    if (
      session.sessionPayment.status ===
      'SUCCEEDED'
    ) {
      return NextResponse.json(
        {
          error:
            'Payment has already been confirmed',
        },
        { status: 409 }
      );
    }

    const collectionMethod =
      session.sessionPayment.collectionMethod;

    if (!collectionMethod) {
      return NextResponse.json(
        {
          error:
            'The customer has not chosen a payment method yet.',
        },
        { status: 409 }
      );
    }

    const unpaidOrders =
      session.orders.filter(
        (order) => order.paidAt === null
      );

    const result =
      await db.$transaction(
        async (tx) => {
          const now = new Date();

          const payment =
            await tx.sessionPayment.update({
              where: {
                customerSessionId:
                  session.id,
              },
              data: {
                status: 'SUCCEEDED',
                // IMPORTANT:
                // Do not accept collectionMethod from
                // the waiter request. It comes only from
                // the customer-selected value in the DB.
                confirmedByUserId:
                  access.user.id,
                confirmedAt: now,
                paidAt: now,
              },
              select: {
                id: true,
                status: true,
                paymentMethod: true,
                collectionMethod: true,
                amountCents: true,
                currency: true,
                confirmedByUserId: true,
                confirmedAt: true,
                paidAt: true,
              },
            });

          await tx.customerSession.update({
            where: {
              id: session.id,
            },
            data: {
              paidAt: now,
            },
          });

          if (unpaidOrders.length > 0) {
            await tx.order.updateMany({
              where: {
                customerSessionId:
                  session.id,
                paidAt: null,
                status: {
                  notIn: [
                    'REJECTED',
                    'CANCELLED',
                  ],
                },
              },
              data: {
                paidAt: now,
              },
            });

            await tx.orderEvent.createMany({
              data: unpaidOrders.map(
                (order) => ({
                  orderId: order.id,
                  restaurantId:
                    order.restaurantId,
                  type:
                    'PAYMENT_SUCCEEDED',
                  actorUserId:
                    access.user.id,
                  createdAt: now,
                  metadata: {
                    paymentMethod:
                      'PAY_AT_RESTAURANT',
                    collectionMethod,
                    source: 'staff',
                  },
                })
              ),
            });
          }

          return {
            payment,
            orderIds:
              unpaidOrders.map(
                (order) => order.id
              ),
          };
        }
      );

    for (const orderId of result.orderIds) {
      publishOrderEvent(
        params.restaurantId,
        {
          type: 'ORDER_PAID',
          orderId,
        }
      );
    }

    return NextResponse.json({
      success: true,
      payment: result.payment,
      orderIds: result.orderIds,
    });
  } catch (err) {
    console.error(
      'Session payment confirmation error:',
      err
    );

    return NextResponse.json(
      {
        error:
          'Internal server error',
      },
      { status: 500 }
    );
  }
}