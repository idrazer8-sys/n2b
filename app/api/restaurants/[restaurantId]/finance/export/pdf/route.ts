import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/lib/db';
import { requireRestaurantAccess } from '@/src/lib/auth';
import { errorResponse } from '@/src/lib/api-response';
import { resolveFinanceRange, DateRangeError } from '@/src/lib/dateRange';
import { getOrdersInPeriod, summarizeOrders } from '@/src/lib/finance';
import { buildFinancialReportPdf } from '@/src/lib/financePdf';

export const runtime = 'nodejs';

export async function GET(req: NextRequest, { params }: { params: { restaurantId: string } }) {
  try {
    const access = await requireRestaurantAccess(params.restaurantId, 'MANAGER');
    if (!access.ok) return NextResponse.json({ error: access.message }, { status: access.status });

    const restaurant = await db.restaurant.findUnique({
      where: { id: params.restaurantId },
      select: { name: true, timezone: true, currency: true },
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
    const periodLabel = `${range.localFrom} to ${range.localToExclusive} (exclusive)`;

    const pdf = await buildFinancialReportPdf(
      summary,
      restaurant.name,
      restaurant.currency,
      periodLabel,
      range.timezone
    );

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="financial-report-${range.localFrom}_to_${range.localToExclusive}.pdf"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
