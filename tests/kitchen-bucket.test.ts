import { describe, it, expect } from 'vitest';
import { kitchenBucket } from '../components/piso/PisoBoard';

describe('kitchenBucket', () => {
  it('is "available" when a table has no active orders', () => {
    expect(kitchenBucket([])).toBe('available');
  });

  it('is "ordering" for NEW, ACCEPTED, or PENDING_PAYMENT', () => {
    for (const status of ['PENDING_PAYMENT', 'NEW', 'ACCEPTED'] as const) {
      expect(
        kitchenBucket([{ id: '1', orderNumber: 1, status, totalCents: 0 }])
      ).toBe('ordering');
    }
  });

  it('is "preparing" while the kitchen is working the order', () => {
    expect(
      kitchenBucket([{ id: '1', orderNumber: 1, status: 'PREPARING', totalCents: 0 }])
    ).toBe('preparing');
  });

  it('is "ready" when READY and unclaimed (staffId null)', () => {
    expect(
      kitchenBucket([
        { id: '1', orderNumber: 1, status: 'READY', totalCents: 0, staffId: null },
      ])
    ).toBe('ready');
  });

  it('is "serving" when READY and a waiter has claimed it', () => {
    expect(
      kitchenBucket([
        { id: '1', orderNumber: 1, status: 'READY', totalCents: 0, staffId: 'staff_1' },
      ])
    ).toBe('serving');
  });

  it('is "serving" once the order is fully COMPLETED', () => {
    expect(
      kitchenBucket([{ id: '1', orderNumber: 1, status: 'COMPLETED', totalCents: 0 }])
    ).toBe('serving');
  });

  it('falls back to "available" for a status with no active meaning (REJECTED/CANCELLED/PAYMENT_FAILED)', () => {
    for (const status of ['REJECTED', 'CANCELLED', 'PAYMENT_FAILED'] as const) {
      expect(
        kitchenBucket([{ id: '1', orderNumber: 1, status, totalCents: 0 }])
      ).toBe('available');
    }
  });

  it('uses only the most recent order when a table has more than one', () => {
    // Mirrors the existing "ordersInProgress" convention elsewhere in
    // PisoBoard: the array is in creation order, so the last entry is the
    // most recently placed order.
    const orders = [
      { id: '1', orderNumber: 1, status: 'COMPLETED' as const, totalCents: 0 },
      { id: '2', orderNumber: 2, status: 'PREPARING' as const, totalCents: 0 },
    ];
    expect(kitchenBucket(orders)).toBe('preparing');
  });
});
