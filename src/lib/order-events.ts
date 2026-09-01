import 'server-only';
import { EventEmitter } from 'events';

const emitter = new EventEmitter();
emitter.setMaxListeners(0);

export type OrderEvent =
  | { type: 'ORDER_CREATED'; orderId: string }
  | { type: 'ORDER_PAID'; orderId: string }
  | { type: 'ORDER_STATUS_CHANGED'; orderId: string; status: string }
  | { type: 'ORDER_READY'; orderId: string }
  | { type: 'SESSION_PAID'; customerSessionId: string };

export function publishOrderEvent(
  restaurantId: string,
  event: OrderEvent
) {
  emitter.emit(`restaurant:${restaurantId}`, event);
}

export function subscribeOrderEvents(
  restaurantId: string,
  handler: (event: OrderEvent) => void
) {
  const channel = `restaurant:${restaurantId}`;
  emitter.on(channel, handler);

  return () => emitter.off(channel, handler);
}
