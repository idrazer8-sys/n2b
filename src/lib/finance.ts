import 'server-only';
import { db } from './db';
import { extractVat, type VatBreakdown } from './pricing';

// Revenue is recognized at the moment an order is actually paid
// (Order.paidAt), not when it's placed — set uniformly by both the Stripe
// webhook and the waiter's cash-confirmation flow, regardless of payment
// method. This is what lets "Today"'s report match what's actually in the
// till/Stripe balance for today.

export type FinanceOrderItemRow = {
  id: string;
  nameSnapshot: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  vatRateBpsSnapshot: number | null;
};

export type FinanceOrderRow = {
  id: string;
  orderNumber: number;
  status: string;
  paidAt: Date;
  totalCents: number;
  currency: string;
  tableLabel: string;
  paymentMethod: 'ONLINE' | 'PAY_AT_RESTAURANT' | null;
  collectionMethod: 'CASH' | 'CARD' | 'OTHER' | null;
  items: FinanceOrderItemRow[];
};

export async function getOrdersInPeriod(
  restaurantId: string,
  from: Date,
  to: Date
): Promise<FinanceOrderRow[]> {
  const orders = await db.order.findMany({
    where: {
      restaurantId,
      paidAt: { gte: from, lt: to },
    },
    orderBy: { paidAt: 'asc' },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      paidAt: true,
      totalCents: true,
      currency: true,
      table: { select: { label: true } },
      payment: { select: { paymentMethod: true, collectionMethod: true } },
      customerSession: {
        select: {
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
          vatRateBpsSnapshot: true,
        },
      },
    },
  });

  return orders.map((order) => {
    // Legacy per-order Payment record takes priority if present; every
    // order today goes through the session-level payment instead.
    const method = order.payment ?? order.customerSession.sessionPayment;

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paidAt: order.paidAt!,
      totalCents: order.totalCents,
      currency: order.currency,
      tableLabel: order.table.label,
      paymentMethod: method?.paymentMethod ?? null,
      collectionMethod: method?.collectionMethod ?? null,
      items: order.items,
    };
  });
}

export async function getOrderReceipt(restaurantId: string, orderId: string): Promise<FinanceOrderRow | null> {
  const order = await db.order.findFirst({
    where: { id: orderId, restaurantId },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      paidAt: true,
      totalCents: true,
      currency: true,
      table: { select: { label: true } },
      payment: { select: { paymentMethod: true, collectionMethod: true } },
      customerSession: {
        select: {
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
          vatRateBpsSnapshot: true,
        },
      },
    },
  });

  if (!order || !order.paidAt) return null;

  const method = order.payment ?? order.customerSession.sessionPayment;

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paidAt: order.paidAt,
    totalCents: order.totalCents,
    currency: order.currency,
    tableLabel: order.table.label,
    paymentMethod: method?.paymentMethod ?? null,
    collectionMethod: method?.collectionMethod ?? null,
    items: order.items,
  };
}

export type FinanceSummary = {
  orderCount: number;
  totalRevenueCents: number;
  averageOrderCents: number;
  vatBreakdown: VatBreakdown;
  vatTotalCents: number;
  baseTotalCents: number;
  // Revenue from line items placed before VAT tracking existed
  // (vatRateBpsSnapshot is NULL) — never fabricated into a rate, always
  // called out separately so the report can flag it explicitly.
  untrackedRevenueCents: number;
  untrackedOrderCount: number;
};

export function summarizeOrders(orders: FinanceOrderRow[]): FinanceSummary {
  let totalRevenueCents = 0;
  const vatBreakdown: VatBreakdown = {};
  let untrackedRevenueCents = 0;
  let untrackedOrderCount = 0;

  for (const order of orders) {
    totalRevenueCents += order.totalCents;
    let orderHasUntracked = false;

    for (const item of order.items) {
      if (item.vatRateBpsSnapshot === null) {
        untrackedRevenueCents += item.lineTotalCents;
        orderHasUntracked = true;
        continue;
      }

      const { baseCents, vatCents } = extractVat(item.lineTotalCents, item.vatRateBpsSnapshot);
      const existing = vatBreakdown[item.vatRateBpsSnapshot];
      vatBreakdown[item.vatRateBpsSnapshot] = {
        baseCents: (existing?.baseCents ?? 0) + baseCents,
        vatCents: (existing?.vatCents ?? 0) + vatCents,
      };
    }

    if (orderHasUntracked) untrackedOrderCount += 1;
  }

  const orderCount = orders.length;
  const averageOrderCents = orderCount > 0 ? Math.round(totalRevenueCents / orderCount) : 0;

  let vatTotalCents = 0;
  let baseTotalCents = 0;
  for (const rate of Object.values(vatBreakdown)) {
    vatTotalCents += rate.vatCents;
    baseTotalCents += rate.baseCents;
  }

  return {
    orderCount,
    totalRevenueCents,
    averageOrderCents,
    vatBreakdown,
    vatTotalCents,
    baseTotalCents,
    untrackedRevenueCents,
    untrackedOrderCount,
  };
}
