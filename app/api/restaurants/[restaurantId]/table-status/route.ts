import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/lib/db';
import { requireRestaurantAccess } from '@/src/lib/auth';

export async function GET(
  _req: NextRequest,
  {
    params,
  }: {
    params: { restaurantId: string };
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

    let tableIds: string[] | null = null;
    const mine = _req.nextUrl.searchParams.get('mine') === '1';

    if (access.role === 'STAFF' || mine) {
      const membership = await db.restaurantStaff.findUnique({
        where: {
          userId_restaurantId: {
            userId: access.user.id,
            restaurantId: params.restaurantId,
          },
        },
        select: { id: true },
      });

      if (!membership) {
        return NextResponse.json(
          { error: 'Staff membership not found' },
          { status: 403 }
        );
      }

      const assignments = await db.tableAssignment.findMany({
        where: {
          restaurantId: params.restaurantId,
          staffId: membership.id,
          endedAt: null,
        },
        select: { tableId: true },
      });

      tableIds = assignments.map((assignment) => assignment.tableId);
    }

    const tables = await db.table.findMany({
      where: {
        restaurantId: params.restaurantId,
        isActive: true,
        ...(tableIds !== null ? { id: { in: tableIds } } : {}),
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        label: true,
        isActive: true,
      },
    });

    const now = new Date();

    // One batched query for the latest session per table, instead of firing
    // a concurrent query per table — with enough tables open at once this
    // was exhausting the Supabase pooler's connection limit.
    const latestSessions =
      tables.length === 0
        ? []
        : await db.customerSession.findMany({
            where: {
              restaurantId: params.restaurantId,
              tableId: { in: tables.map((table) => table.id) },
            },
            orderBy: [{ tableId: 'asc' }, { createdAt: 'desc' }],
            distinct: ['tableId'],
            include: {
              sessionPayment: {
                include: { splits: { orderBy: { personIndex: 'asc' } } },
              },
              orders: {
                where: {
                  status: {
                    notIn: ['REJECTED', 'CANCELLED'],
                  },
                },
                orderBy: { createdAt: 'asc' },
                select: {
                  id: true,
                  orderNumber: true,
                  status: true,
                  totalCents: true,
                  paidAt: true,
                },
              },
            },
          });

    const sessionByTableId = new Map(
      latestSessions.map((session) => [session.tableId, session])
    );

    const rows = tables.map((table) => {
      const session = sessionByTableId.get(table.id);

      if (!session) {
          return {
            table,
            status: 'FREE' as const,
            statusLabel: 'Free',
            customerSessionId: null,
            paymentMethod: null,
            collectionMethod: null,
            totalCents: 0,
            orders: [],
            updatedAt: now.toISOString(),
          };
        }

        const activeOrders = session.orders.filter(
          (order) => order.paidAt === null
        );
        const totalCents = activeOrders.reduce(
          (sum, order) => sum + order.totalCents,
          0
        );
        const payment = session.sessionPayment;

        if (session.paidAt) {
          return {
            table,
            status: 'PAID' as const,
            statusLabel: 'Paid',
            customerSessionId: session.id,
            paymentMethod: payment?.paymentMethod ?? null,
            collectionMethod: payment?.collectionMethod ?? null,
            totalCents,
            partySize: session.partySize,
            orders: activeOrders,
            updatedAt: (payment?.paidAt ?? session.paidAt).toISOString(),
          };
        }

        if (
          payment?.paymentMethod === 'PAY_AT_RESTAURANT' &&
          payment.status === 'REQUIRES_PAYMENT'
        ) {
          return {
            table,
            status: 'PAYMENT_REQUESTED' as const,
            statusLabel: 'Payment requested',
            customerSessionId: session.id,
            paymentMethod: payment.paymentMethod,
            collectionMethod: payment.collectionMethod,
            totalCents: payment.amountCents,
            partySize: session.partySize,
            orders: activeOrders,
            updatedAt: payment.updatedAt.toISOString(),
            isSplit: payment.isSplit,
            cashTenderedCents: payment.cashTenderedCents,
            changeDueCents:
              payment.collectionMethod === 'CASH' &&
              !payment.isSplit &&
              payment.cashTenderedCents !== null
                ? payment.cashTenderedCents - payment.amountCents
                : null,
            splits: payment.splits.map((split: { id: string; personIndex: number; label: string | null; shareCents: number; tenderedCents: number | null }) => ({
              id: split.id,
              personIndex: split.personIndex,
              label: split.label,
              shareCents: split.shareCents,
              tenderedCents: split.tenderedCents,
              changeDueCents:
                payment.collectionMethod === 'CASH' && split.tenderedCents !== null
                  ? split.tenderedCents - split.shareCents
                  : null,
            })),
          };
        }

        if (
          activeOrders.length > 0 &&
          activeOrders.every((order) => order.status === 'COMPLETED')
        ) {
          return {
            table,
            status: 'READY_TO_PAY' as const,
            statusLabel: 'Ready to pay',
            customerSessionId: session.id,
            paymentMethod: payment?.paymentMethod ?? null,
            collectionMethod: payment?.collectionMethod ?? null,
            totalCents,
            partySize: session.partySize,
            orders: activeOrders,
            updatedAt: session.createdAt.toISOString(),
          };
        }

        if (activeOrders.length > 0) {
          return {
            table,
            status: 'OCCUPIED' as const,
            statusLabel: 'Occupied',
            customerSessionId: session.id,
            paymentMethod: payment?.paymentMethod ?? null,
            collectionMethod: payment?.collectionMethod ?? null,
            totalCents,
            partySize: session.partySize,
            orders: activeOrders,
            updatedAt: session.createdAt.toISOString(),
          };
        }

        return {
          table,
          status: 'OPEN' as const,
          statusLabel: 'Open',
          customerSessionId: session.id,
          paymentMethod: payment?.paymentMethod ?? null,
          collectionMethod: payment?.collectionMethod ?? null,
          totalCents: 0,
          partySize: session.partySize,
          orders: [],
          updatedAt: session.createdAt.toISOString(),
        };
    });

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      tables: rows,
    });
  } catch (err) {
    console.error('Table status GET error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}