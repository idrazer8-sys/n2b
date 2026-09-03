import { describe, expect, it, vi } from 'vitest';
import { publishOrderEvent, subscribeOrderEvents } from '../src/lib/order-events';

// REALTIME_DIRECT_URL is intentionally unset in the test environment (see
// tests/setup.ts / .env), so these tests exercise the always-on
// EventEmitter path — the base layer every deployment gets whether or not
// Postgres LISTEN/NOTIFY is configured. The Postgres-backed cross-instance
// path was verified separately, live, against the real dev database during
// this hardening pass (a genuine two-process test), rather than re-mocked
// here.
describe('order-events (in-process EventEmitter layer)', () => {
  it('delivers a published event to a subscriber for the same restaurant', async () => {
    const restaurantId = `test-restaurant-${Math.random()}`;
    const handler = vi.fn();

    const unsubscribe = await subscribeOrderEvents(restaurantId, handler);

    publishOrderEvent(restaurantId, { type: 'ORDER_CREATED', orderId: 'order-1' });

    expect(handler).toHaveBeenCalledWith({ type: 'ORDER_CREATED', orderId: 'order-1' });

    await unsubscribe();
  });

  it('does not deliver an event published for a different restaurant', async () => {
    const restaurantId = `test-restaurant-${Math.random()}`;
    const otherRestaurantId = `test-restaurant-${Math.random()}`;
    const handler = vi.fn();

    const unsubscribe = await subscribeOrderEvents(restaurantId, handler);

    publishOrderEvent(otherRestaurantId, { type: 'ORDER_CREATED', orderId: 'order-2' });

    expect(handler).not.toHaveBeenCalled();

    await unsubscribe();
  });

  it('stops delivering events after unsubscribe', async () => {
    const restaurantId = `test-restaurant-${Math.random()}`;
    const handler = vi.fn();

    const unsubscribe = await subscribeOrderEvents(restaurantId, handler);
    await unsubscribe();

    publishOrderEvent(restaurantId, { type: 'ORDER_READY', orderId: 'order-3' });

    expect(handler).not.toHaveBeenCalled();
  });

  it('delivers each event to multiple independent subscribers on the same restaurant', async () => {
    const restaurantId = `test-restaurant-${Math.random()}`;
    const handlerA = vi.fn();
    const handlerB = vi.fn();

    const unsubA = await subscribeOrderEvents(restaurantId, handlerA);
    const unsubB = await subscribeOrderEvents(restaurantId, handlerB);

    publishOrderEvent(restaurantId, {
      type: 'ORDER_STATUS_CHANGED',
      orderId: 'order-4',
      status: 'PREPARING',
    });

    expect(handlerA).toHaveBeenCalledTimes(1);
    expect(handlerB).toHaveBeenCalledTimes(1);

    await unsubA();
    await unsubB();
  });

  it('a publish with zero subscribers does not throw', () => {
    expect(() =>
      publishOrderEvent(`test-restaurant-${Math.random()}`, {
        type: 'SESSION_PAID',
        customerSessionId: 'session-1',
      })
    ).not.toThrow();
  });
});
