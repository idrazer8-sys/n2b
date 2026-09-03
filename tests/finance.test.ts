import { describe, it, expect } from 'vitest';
import { summarizeOrders, type FinanceOrderRow } from '../src/lib/finance';

function makeOrder(overrides: Partial<FinanceOrderRow> & { items: FinanceOrderRow['items'] }): FinanceOrderRow {
  const totalCents = overrides.items.reduce((sum, item) => sum + item.lineTotalCents, 0);
  return {
    id: 'order_1',
    orderNumber: 1,
    status: 'COMPLETED',
    paidAt: new Date('2026-01-01T12:00:00Z'),
    totalCents,
    currency: 'EUR',
    tableLabel: 'T1',
    paymentMethod: 'ONLINE',
    collectionMethod: null,
    ...overrides,
  };
}

describe('summarizeOrders', () => {
  it('returns zeroed-out figures for an empty order list', () => {
    const summary = summarizeOrders([]);
    expect(summary).toEqual({
      orderCount: 0,
      totalRevenueCents: 0,
      averageOrderCents: 0,
      vatBreakdown: {},
      vatTotalCents: 0,
      baseTotalCents: 0,
      untrackedRevenueCents: 0,
      untrackedOrderCount: 0,
    });
  });

  it('aggregates a single order at a single VAT rate', () => {
    const order = makeOrder({
      items: [
        {
          id: 'item_1',
          nameSnapshot: 'Pizza',
          quantity: 1,
          unitPriceCents: 1000,
          lineTotalCents: 1000,
          vatRateBpsSnapshot: 1000, // 10%
        },
      ],
    });

    const summary = summarizeOrders([order]);
    expect(summary.orderCount).toBe(1);
    expect(summary.totalRevenueCents).toBe(1000);
    expect(summary.averageOrderCents).toBe(1000);
    // base = 1000 / 1.10 = 909.09 -> rounds to 909, vat = 91
    expect(summary.vatBreakdown[1000]).toEqual({ baseCents: 909, vatCents: 91 });
    expect(summary.vatTotalCents).toBe(91);
    expect(summary.baseTotalCents).toBe(909);
  });

  it('keeps different VAT rates as separate breakdown entries across orders', () => {
    const foodOrder = makeOrder({
      id: 'order_food',
      items: [
        {
          id: 'item_food',
          nameSnapshot: 'Pasta',
          quantity: 1,
          unitPriceCents: 1000,
          lineTotalCents: 1000,
          vatRateBpsSnapshot: 1000,
        },
      ],
    });

    const alcoholOrder = makeOrder({
      id: 'order_alcohol',
      items: [
        {
          id: 'item_alcohol',
          nameSnapshot: 'Wine',
          quantity: 1,
          unitPriceCents: 500,
          lineTotalCents: 500,
          vatRateBpsSnapshot: 2100,
        },
      ],
    });

    const summary = summarizeOrders([foodOrder, alcoholOrder]);
    expect(summary.orderCount).toBe(2);
    expect(summary.totalRevenueCents).toBe(1500);
    expect(Object.keys(summary.vatBreakdown).sort()).toEqual(['1000', '2100']);
    expect(summary.vatBreakdown[1000]).toEqual({ baseCents: 909, vatCents: 91 });
    // base = 500 / 1.21 = 413.22 -> rounds to 413, vat = 87
    expect(summary.vatBreakdown[2100]).toEqual({ baseCents: 413, vatCents: 87 });
  });

  it('merges two lines at the same rate into one breakdown entry', () => {
    const order = makeOrder({
      items: [
        {
          id: 'item_1',
          nameSnapshot: 'Burger',
          quantity: 2,
          unitPriceCents: 800,
          lineTotalCents: 1600,
          vatRateBpsSnapshot: 1000,
        },
        {
          id: 'item_2',
          nameSnapshot: 'Fries',
          quantity: 1,
          unitPriceCents: 400,
          lineTotalCents: 400,
          vatRateBpsSnapshot: 1000,
        },
      ],
    });

    const summary = summarizeOrders([order]);
    expect(Object.keys(summary.vatBreakdown)).toEqual(['1000']);
    // Extracted per-line then summed (not from the merged 2000): line1
    // 1600/1.10 -> base 1455, vat 145; line2 400/1.10 -> base 364, vat 36.
    expect(summary.vatBreakdown[1000]).toEqual({ baseCents: 1819, vatCents: 181 });
  });

  it('never fabricates a VAT rate for historical items — routes them to untracked instead', () => {
    const historicalOrder = makeOrder({
      items: [
        {
          id: 'item_1',
          nameSnapshot: 'Old menu item',
          quantity: 1,
          unitPriceCents: 1000,
          lineTotalCents: 1000,
          vatRateBpsSnapshot: null,
        },
      ],
    });

    const summary = summarizeOrders([historicalOrder]);
    expect(summary.vatBreakdown).toEqual({});
    expect(summary.vatTotalCents).toBe(0);
    expect(summary.baseTotalCents).toBe(0);
    expect(summary.untrackedRevenueCents).toBe(1000);
    expect(summary.untrackedOrderCount).toBe(1);
    // Revenue itself is still counted — only the VAT split is withheld.
    expect(summary.totalRevenueCents).toBe(1000);
  });

  it('counts an order as untracked only once even with multiple untracked lines', () => {
    const order = makeOrder({
      items: [
        {
          id: 'item_1',
          nameSnapshot: 'A',
          quantity: 1,
          unitPriceCents: 500,
          lineTotalCents: 500,
          vatRateBpsSnapshot: null,
        },
        {
          id: 'item_2',
          nameSnapshot: 'B',
          quantity: 1,
          unitPriceCents: 500,
          lineTotalCents: 500,
          vatRateBpsSnapshot: null,
        },
      ],
    });

    const summary = summarizeOrders([order]);
    expect(summary.untrackedOrderCount).toBe(1);
    expect(summary.untrackedRevenueCents).toBe(1000);
  });

  it('handles a mixed order — some lines tracked, some not — without losing either figure', () => {
    const order = makeOrder({
      items: [
        {
          id: 'item_tracked',
          nameSnapshot: 'New item',
          quantity: 1,
          unitPriceCents: 1100,
          lineTotalCents: 1100,
          vatRateBpsSnapshot: 1000,
        },
        {
          id: 'item_untracked',
          nameSnapshot: 'Old item',
          quantity: 1,
          unitPriceCents: 500,
          lineTotalCents: 500,
          vatRateBpsSnapshot: null,
        },
      ],
    });

    const summary = summarizeOrders([order]);
    expect(summary.totalRevenueCents).toBe(1600);
    expect(summary.untrackedRevenueCents).toBe(500);
    expect(summary.untrackedOrderCount).toBe(1);
    // base = 1100/1.10 = 1000 exactly, vat = 100
    expect(summary.vatBreakdown[1000]).toEqual({ baseCents: 1000, vatCents: 100 });
  });

  it('computes averageOrderCents as an integer rounded from total/count', () => {
    const orders = [
      makeOrder({
        id: 'o1',
        items: [
          { id: 'i1', nameSnapshot: 'A', quantity: 1, unitPriceCents: 100, lineTotalCents: 100, vatRateBpsSnapshot: 0 },
        ],
      }),
      makeOrder({
        id: 'o2',
        items: [
          { id: 'i2', nameSnapshot: 'B', quantity: 1, unitPriceCents: 200, lineTotalCents: 200, vatRateBpsSnapshot: 0 },
        ],
      }),
      makeOrder({
        id: 'o3',
        items: [
          { id: 'i3', nameSnapshot: 'C', quantity: 1, unitPriceCents: 100, lineTotalCents: 100, vatRateBpsSnapshot: 0 },
        ],
      }),
    ];

    const summary = summarizeOrders(orders);
    expect(summary.totalRevenueCents).toBe(400);
    expect(summary.orderCount).toBe(3);
    expect(summary.averageOrderCents).toBe(133); // 400/3 = 133.33 -> rounds to 133
  });
});
