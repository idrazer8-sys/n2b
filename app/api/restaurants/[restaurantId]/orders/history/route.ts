import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/lib/db';
import { requireRestaurantAccess } from '@/src/lib/auth';
import { errorResponse } from '@/src/lib/api-response';

const VALID_STATUSES = [
  'PENDING_PAYMENT',
  'NEW',
  'ACCEPTED',
  'PREPARING',
  'READY',
  'COMPLETED',
  'REJECTED',
  'CANCELLED',
  'PAYMENT_FAILED',
] as const;

const PAGE_SIZE = 25;

// Separate on purpose from GET .../orders, which stays exactly what it is
// today (the live board, active statuses only, no pagination). This one is
// the searchable archive: every status including finished/cancelled/
// rejected, filterable by date/table/status/order number, and paginated —
// a restaurant open for years shouldn't load its whole order history in
// one response.
export async function GET(
  req: NextRequest,
  { params }: { params: { restaurantId: string } }
) {
  try {
    const access = await requireRestaurantAccess(params.restaurantId, 'MANAGER');
    if (!access.ok) return NextResponse.json({ error: access.message }, { status: access.status });

    const searchParams = req.nextUrl.searchParams;
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');
    const tableId = searchParams.get('tableId');
    const statusParam = searchParams.get('status');
    const orderNumberParam = searchParams.get('orderNumber');

    if (statusParam && !VALID_STATUSES.includes(statusParam as (typeof VALID_STATUSES)[number])) {
      return NextResponse.json({ error: 'Invalid status filter' }, { status: 400 });
    }

    const pageParam = Number(searchParams.get('page') ?? '1');
    const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;

    const orderNumber = orderNumberParam ? Number(orderNumberParam) : null;
    if (orderNumberParam && (!Number.isInteger(orderNumber) || orderNumber! < 0)) {
      return NextResponse.json({ error: 'Invalid order number' }, { status: 400 });
    }

    const where = {
      restaurantId: params.restaurantId,
      ...(fromParam || toParam
        ? {
            createdAt: {
              ...(fromParam ? { gte: new Date(fromParam) } : {}),
              ...(toParam ? { lt: new Date(toParam) } : {}),
            },
          }
        : {}),
      ...(tableId ? { tableId } : {}),
      ...(statusParam ? { status: statusParam as (typeof VALID_STATUSES)[number] } : {}),
      ...(orderNumber !== null ? { orderNumber } : {}),
    };

    const [orders, totalCount] = await Promise.all([
      db.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          orderNumber: true,
          createdAt: true,
          status: true,
          totalCents: true,
          currency: true,
          staffId: true,
          table: { select: { id: true, label: true } },
          RestaurantStaff: { select: { user: { select: { name: true } } } },
          payment: { select: { paymentMethod: true, collectionMethod: true } },
          customerSession: {
            select: {
              sessionPayment: { select: { paymentMethod: true, collectionMethod: true } },
            },
          },
          items: { select: { quantity: true, nameSnapshot: true } },
        },
      }),
      db.order.count({ where }),
    ]);

    const rows = orders.map((order) => {
      const method = order.payment ?? order.customerSession?.sessionPayment ?? null;
      return {
        id: order.id,
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        status: order.status,
        totalCents: order.totalCents,
        currency: order.currency,
        table: order.table,
        staffName: order.RestaurantStaff?.user.name ?? null,
        paymentMethod: method?.paymentMethod ?? null,
        collectionMethod: method?.collectionMethod ?? null,
        itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
        itemsSummary: order.items.map((item) => item.nameSnapshot).join(', '),
      };
    });

    return NextResponse.json({
      orders: rows,
      page,
      pageSize: PAGE_SIZE,
      totalCount,
      totalPages: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
    });
  } catch (err) {
    return errorResponse(err);
  }
}
