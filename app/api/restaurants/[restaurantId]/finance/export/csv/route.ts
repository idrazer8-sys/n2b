import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/lib/db';
import { requireRestaurantAccess } from '@/src/lib/auth';
import { errorResponse } from '@/src/lib/api-response';
import { resolveFinanceRange, DateRangeError } from '@/src/lib/dateRange';
import { getOrdersInPeriod } from '@/src/lib/finance';
import { buildOrdersCsv } from '@/src/lib/financeExport';

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

    const orders = await getOrdersInPeriod(params.restaurantId, range.from, range.to);
    const csv = buildOrdersCsv(orders);

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="orders-${range.localFrom}_to_${range.localToExclusive}.csv"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
