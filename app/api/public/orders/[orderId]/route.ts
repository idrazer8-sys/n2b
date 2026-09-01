import { NextRequest, NextResponse } from 'next/server';
import {
  verifyCustomerSession,
  readSessionTokenFromCookies,
} from '@/src/lib/customer-session';
import { db } from '@/src/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const order = await db.order.findUnique({
    where: { id: params.orderId },
    include: {
      items: {
        include: { modifiers: true },
      },
      restaurant: true,
      table: true,
      customerSession: {
        include: {
          sessionPayment: true,
        },
      },
    },
  });

  if (!order) {
    return NextResponse.json(
      { error: 'Order not found' },
      { status: 404 }
    );
  }

  const sessionToken =
    readSessionTokenFromCookies(
      order.restaurantId
    );

  const customerSession =
    await verifyCustomerSession(
      order.restaurantId,
      sessionToken
    );

  if (
    !customerSession ||
    customerSession.id !== order.customerSessionId
  ) {
    return NextResponse.json(
      { error: 'Not authorized for this order' },
      { status: 403 }
    );
  }

  const sessionOrders =
    await db.order.findMany({
      where: {
        customerSessionId:
          order.customerSessionId,
        status: {
          notIn: [
            'REJECTED',
            'CANCELLED',
          ],
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        totalCents: true,
        currency: true,
        createdAt: true,
        acceptedAt: true,
        readyAt: true,
        completedAt: true,
        paidAt: true,
      },
    });

  const payableOrders =
    sessionOrders.filter(
      (item) =>
        item.status === 'COMPLETED' &&
        !item.paidAt
    );

  const hasUnservedOrders =
    sessionOrders.some(
      (item) =>
        item.status !== 'COMPLETED'
    );

  const sessionTotalCents =
    payableOrders.reduce(
      (sum, item) =>
        sum + item.totalCents,
      0
    );

  const sessionPaid =
    Boolean(order.customerSessionId) &&
    sessionOrders.length > 0 &&
    sessionOrders.every(
      (item) => Boolean(item.paidAt)
    );

  const sessionPayment =
    order.customerSession.sessionPayment;

  return NextResponse.json({
    ...order,

    session: {
      id: order.customerSessionId,
      orders: sessionOrders,
      allOrdersServed:
        !hasUnservedOrders,
      payableTotalCents:
        sessionTotalCents,
      paid: sessionPaid,
      paidAt:
        sessionOrders.find(
          (item) => item.paidAt
        )?.paidAt ?? null,

      payment: sessionPayment
        ? {
            id: sessionPayment.id,
            status:
              sessionPayment.status,
            paymentMethod:
              sessionPayment.paymentMethod,
            collectionMethod:
              sessionPayment.collectionMethod,
            confirmedAt:
              sessionPayment.confirmedAt,
          }
        : null,
    },

    googleReviewUrl:
      order.restaurant.googleReviewUrl ??
      null,
  });
}
