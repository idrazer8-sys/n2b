import { NextRequest, NextResponse } from 'next/server';
import { requireRestaurantAccess } from '@/src/lib/auth';
import { errorResponse } from '@/src/lib/api-response';
import { getOrderReceipt } from '@/src/lib/finance';
import { extractVat } from '@/src/lib/pricing';

// Itemized receipt view for a single paid order — each line shows the VAT
// rate that actually applied to it at the time it was ordered (or "not
// tracked" for orders that predate VAT tracking).
export async function GET(
  _req: NextRequest,
  { params }: { params: { restaurantId: string; orderId: string } }
) {
  try {
    const access = await requireRestaurantAccess(params.restaurantId, 'MANAGER');
    if (!access.ok) return NextResponse.json({ error: access.message }, { status: access.status });

    const order = await getOrderReceipt(params.restaurantId, params.orderId);
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    return NextResponse.json({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paidAt: order.paidAt,
      totalCents: order.totalCents,
      currency: order.currency,
      tableLabel: order.tableLabel,
      paymentMethod: order.paymentMethod,
      collectionMethod: order.collectionMethod,
      items: order.items.map((item) => {
        if (item.vatRateBpsSnapshot === null) {
          return {
            id: item.id,
            nameSnapshot: item.nameSnapshot,
            quantity: item.quantity,
            unitPriceCents: item.unitPriceCents,
            lineTotalCents: item.lineTotalCents,
            vatRateBps: null,
            baseCents: null,
            vatCents: null,
          };
        }

        const { baseCents, vatCents } = extractVat(item.lineTotalCents, item.vatRateBpsSnapshot);
        return {
          id: item.id,
          nameSnapshot: item.nameSnapshot,
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
          lineTotalCents: item.lineTotalCents,
          vatRateBps: item.vatRateBpsSnapshot,
          baseCents,
          vatCents,
        };
      }),
    });
  } catch (err) {
    return errorResponse(err);
  }
}
