import { describe, expect, it } from 'vitest';
import {
  ALLOWED_TRANSITIONS,
  ALL_ORDER_STATUSES,
  TERMINAL_ORDER_STATUSES,
  isOrderTransitionAllowed,
} from '../src/lib/order-state-machine';

describe('order state machine', () => {
  it('allows the real kitchen flow: NEW -> ACCEPTED -> PREPARING -> READY -> COMPLETED', () => {
    expect(isOrderTransitionAllowed('NEW', 'ACCEPTED')).toBe(true);
    expect(isOrderTransitionAllowed('ACCEPTED', 'PREPARING')).toBe(true);
    expect(isOrderTransitionAllowed('PREPARING', 'READY')).toBe(true);
    expect(isOrderTransitionAllowed('READY', 'COMPLETED')).toBe(true);
  });

  it('allows the drinks-only shortcut straight from NEW to READY', () => {
    expect(isOrderTransitionAllowed('NEW', 'READY')).toBe(true);
  });

  it('allows rejecting a brand-new order and cancelling one already in the kitchen', () => {
    expect(isOrderTransitionAllowed('NEW', 'REJECTED')).toBe(true);
    expect(isOrderTransitionAllowed('ACCEPTED', 'CANCELLED')).toBe(true);
    expect(isOrderTransitionAllowed('PREPARING', 'CANCELLED')).toBe(true);
  });

  it('rejects skipping straight from ACCEPTED to COMPLETED', () => {
    expect(isOrderTransitionAllowed('ACCEPTED', 'COMPLETED')).toBe(false);
  });

  it('rejects skipping PREPARING entirely (ACCEPTED -> READY)', () => {
    expect(isOrderTransitionAllowed('ACCEPTED', 'READY')).toBe(false);
  });

  it('rejects going backwards from a later stage to an earlier one', () => {
    expect(isOrderTransitionAllowed('READY', 'PREPARING')).toBe(false);
    expect(isOrderTransitionAllowed('PREPARING', 'ACCEPTED')).toBe(false);
    expect(isOrderTransitionAllowed('COMPLETED', 'READY')).toBe(false);
  });

  it('rejects any transition out of a terminal status — a completed/cancelled/rejected order is done', () => {
    for (const terminal of TERMINAL_ORDER_STATUSES) {
      for (const target of ALL_ORDER_STATUSES) {
        expect(
          isOrderTransitionAllowed(terminal, target),
          `${terminal} -> ${target} should never be allowed`
        ).toBe(false);
      }
    }
  });

  it('never lists a status as transitionable to itself (no-op transitions are not modeled as moves)', () => {
    for (const [from, targets] of Object.entries(ALLOWED_TRANSITIONS)) {
      expect(targets).not.toContain(from);
    }
  });

  it('every transition target is a real, known order status (no typos in the map)', () => {
    for (const targets of Object.values(ALLOWED_TRANSITIONS)) {
      for (const target of targets) {
        expect(ALL_ORDER_STATUSES as readonly string[]).toContain(target);
      }
    }
  });

  it('PENDING_PAYMENT has no entry — nothing PATCHes an order out of it directly (payment webhooks own that move)', () => {
    expect(ALLOWED_TRANSITIONS.PENDING_PAYMENT).toBeUndefined();
  });
});
