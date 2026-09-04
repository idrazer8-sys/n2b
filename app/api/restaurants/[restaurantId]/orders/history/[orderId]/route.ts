import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/lib/db';
import { requireRestaurantAccess } from '@/src/lib/auth';
import { errorResponse } from '@/src/lib/api-response';

// The full receipt for one historical order: itemized lines (with
// modifiers, notes, and each line's allergen snapshot — never the menu
// item's CURRENT allergens, which may have changed since), and the status
// timeline read straight off Order's own timestamp columns rather than
// re-derived, since the model already has one column per stage.
export async function GET(
  _req: NextRequest,
  { params }: { params: { restaurantId: string; orderId: string } }
) {
  try {
    const access = await requireRestaurantAccess(params.restaurantId, 'MANAGER');
    if (!access.ok) return NextResponse.json({ error: access.message }, { status: access.status });

    const order = await db.order.findFirst({
      where: { id: params.orderId, restaurantId: params.restaurantId },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        notes: true,
        subtotalCents: true,
        taxCents: true,
        totalCents: true,
        currency: true,
        createdAt: true,
        acceptedAt: true,
        preparingAt: true,
        readyAt: true,
        completedAt: true,
        cancelledAt: true,
        rejectedAt: true,
        paidAt: true,
        table: { select: { id: true, label: true } },
        RestaurantStaff: { select: { user: { select: { name: true } } } },
        payment: { select: { paymentMethod: true, collectionMethod: true } },
        customerSession: {
          select: {
            partySize: true,
            sessionPayment: { select: { paymentMethod: true, collectionMethod: true } },
          },
        },
        items: {
          select: {
            id: true,
            nameSnapshot: true,
            quantity: true,
            unitPriceCents: true,
            lineTotalCents: true,
            notes: true,
            status: true,
            allergensSnapshot: true,
            modifiers: {
              select: { nameSnapshot: true, priceDeltaCentsSnapshot: true },
            },
          },
        },
      },
    });

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    const method = order.payment ?? order.customerSession.sessionPayment;

    return NextResponse.json({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      notes: order.notes,
      subtotalCents: order.subtotalCents,
      // Only meaningful once a future phase actually computes it again —
      // right now every order prices at a flat 0% tax, so this is always
      // 0. Included as-is (never inflated/guessed); the page decides
      // whether showing a "0" tax line is worth it.
      taxCents: order.taxCents,
      totalCents: order.totalCents,
      currency: order.currency,
      table: order.table,
      partySize: order.customerSession.partySize,
      staffName: order.RestaurantStaff?.user.name ?? null,
      paymentMethod: method?.paymentMethod ?? null,
      collectionMethod: method?.collectionMethod ?? null,
      timeline: {
        createdAt: order.createdAt,
        acceptedAt: order.acceptedAt,
        preparingAt: order.preparingAt,
        readyAt: order.readyAt,
        completedAt: order.completedAt,
        cancelledAt: order.cancelledAt,
        rejectedAt: order.rejectedAt,
        paidAt: order.paidAt,
      },
      items: order.items.map((item) => ({
        id: item.id,
        nameSnapshot: item.nameSnapshot,
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
        lineTotalCents: item.lineTotalCents,
        notes: item.notes,
        status: item.status,
        allergens: item.allergensSnapshot,
        modifiers: item.modifiers,
      })),
    });
  } catch (err) {
    return errorResponse(err);
  }
}
