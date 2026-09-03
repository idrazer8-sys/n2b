import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/lib/db';
import { requireRestaurantAccess } from '@/src/lib/auth';
import { errorResponse } from '@/src/lib/api-response';
import { resolveFinanceRange, DateRangeError } from '@/src/lib/dateRange';
import { getOrdersInPeriod, summarizeOrders } from '@/src/lib/finance';

export async function GET(req: NextRequest, { params }: { params: { restaurantId: string } }) {
  try {
    const access = await requireRestaurantAccess(params.restaurantId, 'MANAGER');
    if (!access.ok) return NextResponse.json({ error: access.message }, { status: access.status });

    const restaurant = await db.restaurant.findUnique({
      where: { id: params.restaurantId },
      select: { timezone: true, currency: true },
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

    const orders = await getOrdersInPeriod(params.restaurantId, range.from, range.to);
    const summary = summarizeOrders(orders);

    return NextResponse.json({
      range: {
        key: range.rangeKey,
        timezone: range.timezone,
        currency: restaurant.currency,
        localFrom: range.localFrom,
        localToExclusive: range.localToExclusive,
      },
      ...summary,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
