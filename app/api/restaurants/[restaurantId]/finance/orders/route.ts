import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/lib/db';
import { requireRestaurantAccess } from '@/src/lib/auth';
import { errorResponse } from '@/src/lib/api-response';
import { resolveFinanceRange, DateRangeError } from '@/src/lib/dateRange';
import { getOrdersInPeriod } from '@/src/lib/finance';

// Orders table for the Financial History page — same period as /summary,
// listed newest-first, capped per page since a full year can hold
// thousands of rows.
export async function GET(req: NextRequest, { params }: { params: { restaurantId: string } }) {
  try {
    const access = await requireRestaurantAccess(params.restaurantId, 'MANAGER');
    if (!access.ok) return NextResponse.json({ error: access.message }, { status: access.status });

    const restaurant = await db.restaurant.findUnique({
      where: { id: params.restaurantId },
      select: { timezone: true },
    });
    if (!restaurant) return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });

    let range;
    try {
      range = resolveFinanceRange(req.nextUrl.searchParams, restaurant.timezone);
    } catch (err) {
      if (err instanceof DateRangeError) {
        return NextResponse.json({ error: err.message }, { status: 400 });
      }
      throw err;
    }

    const page = Math.max(1, Number(req.nextUrl.searchParams.get('page') ?? '1') || 1);
    const pageSize = 50;

    const orders = await getOrdersInPeriod(params.restaurantId, range.from, range.to);
    const sorted = [...orders].reverse(); // newest first for the table

    const start = (page - 1) * pageSize;
    const pageOrders = sorted.slice(start, start + pageSize);

    return NextResponse.json({
      orders: pageOrders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        paidAt: order.paidAt,
        totalCents: order.totalCents,
        currency: order.currency,
        tableLabel: order.tableLabel,
        paymentMethod: order.paymentMethod,
        collectionMethod: order.collectionMethod,
        itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      })),
      page,
      pageSize,
      totalCount: sorted.length,
      totalPages: Math.max(1, Math.ceil(sorted.length / pageSize)),
    });
  } catch (err) {
    return errorResponse(err);
  }
}
