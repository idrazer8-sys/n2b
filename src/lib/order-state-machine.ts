// The single source of truth for which Order status transitions are legal.
// Used by app/api/restaurants/[restaurantId]/orders/[orderId]/route.ts to
// enforce this server-side (never trust a status change to be valid just
// because the frontend sent it) and exercised directly by
// tests/order-state-machine.test.ts.
export const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  // NEW -> READY directly is the "straight to the waiter" shortcut for
  // drinks-only orders, which need no kitchen preparation.
  NEW: ['ACCEPTED', 'REJECTED', 'READY'],
  ACCEPTED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY', 'CANCELLED'],
  READY: ['COMPLETED'],
};

export const ALL_ORDER_STATUSES = [
  'PENDING_PAYMENT',
  'NEW',
  'ACCEPTED',
  'REJECTED',
  'PREPARING',
  'READY',
  'COMPLETED',
  'CANCELLED',
  'PAYMENT_FAILED',
] as const;

export const TERMINAL_ORDER_STATUSES = [
  'COMPLETED',
  'CANCELLED',
  'REJECTED',
  'PAYMENT_FAILED',
] as const;

export function isOrderTransitionAllowed(
  from: string,
  to: string
): boolean {
  return (ALLOWED_TRANSITIONS[from] ?? []).includes(to);
}
