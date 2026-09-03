import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { db } from '../src/lib/db';
import { stripe } from '../src/lib/stripe';
import { POST as webhookPost } from '../app/api/stripe/webhook/route';

// Integration test against the real DB and the real Stripe SDK's local
// signature verification (constructEvent does an offline HMAC check — no
// network call to Stripe is made by any of this). Every request goes
// through the actual route handler, so signature verification, idempotency
// guards, and both payment flows are exercised exactly as production would
// run them, not re-implemented in the test.

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET!;

function signedRequest(eventPayload: object, opts?: { badSignature?: boolean; noSignature?: boolean }) {
  const payload = JSON.stringify(eventPayload);

  const headers: Record<string, string> = {};

  if (!opts?.noSignature) {
    headers['stripe-signature'] = opts?.badSignature
      ? 't=1700000000,v1=deadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef'
      : stripe.webhooks.generateTestHeaderString({ payload, secret: WEBHOOK_SECRET });
  }

  return new NextRequest('http://localhost/api/stripe/webhook', {
    method: 'POST',
    body: payload,
    headers,
  });
}

let restaurantId: string;
let tableId: string;

beforeAll(async () => {
  const restaurant = await db.restaurant.create({
    data: {
      name: `Webhook Test Restaurant ${Date.now()}`,
      slug: `webhook-test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    },
  });
  restaurantId = restaurant.id;

  const table = await db.table.create({ data: { restaurantId, label: 'W1' } });
  tableId = table.id;
});

afterAll(async () => {
  await db.membership.deleteMany({ where: { restaurantId } });
  await db.order.deleteMany({ where: { restaurantId } });
  await db.customerSession.deleteMany({ where: { restaurantId } });
  await db.table.deleteMany({ where: { restaurantId } });
  await db.restaurant.delete({ where: { id: restaurantId } });
});

describe('Stripe webhook: signature verification', () => {
  it('rejects a request with no signature header', async () => {
    const res = await webhookPost(
      signedRequest({ id: 'evt_1', type: 'checkout.session.completed', data: { object: {} } }, { noSignature: true })
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/signature/i);
  });

  it('rejects a request with a garbage/forged signature', async () => {
    const res = await webhookPost(
      signedRequest({ id: 'evt_2', type: 'checkout.session.completed', data: { object: {} } }, { badSignature: true })
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/signature/i);
  });

  it('accepts a correctly signed request', async () => {
    const res = await webhookPost(
      signedRequest({ id: 'evt_3', type: 'some.unhandled.event.type', data: { object: {} } })
    );
    expect(res.status).toBe(200);
  });
});

describe('Stripe webhook: session-based payment flow', () => {
  it('marks the session, its orders, and the SessionPayment as paid — and is idempotent on redelivery', async () => {
    const session = await db.customerSession.create({
      data: { restaurantId, tableId, expiresAt: new Date(Date.now() + 3600_000) },
    });

    const order = await db.order.create({
      data: {
        restaurantId,
        tableId,
        customerSessionId: session.id,
        orderNumber: Math.floor(Math.random() * 1_000_000),
        status: 'COMPLETED',
        subtotalCents: 1000,
        taxCents: 0,
        totalCents: 1000,
        currency: 'EUR',
      },
    });

    await db.sessionPayment.create({
      data: {
        customerSessionId: session.id,
        status: 'REQUIRES_PAYMENT',
        paymentMethod: 'ONLINE',
        amountCents: 1000,
        currency: 'EUR',
        applicationFeeCents: 0,
        stripeCheckoutSessionId: `cs_test_${session.id}`,
      },
    });

    const eventPayload = {
      id: `evt_session_${session.id}`,
      type: 'checkout.session.completed',
      data: {
        object: {
          id: `cs_test_${session.id}`,
          payment_intent: `pi_test_${session.id}`,
          metadata: { sessionId: session.id },
        },
      },
    };

    const res1 = await webhookPost(signedRequest(eventPayload));
    expect(res1.status).toBe(200);

    const paymentAfterFirst = await db.sessionPayment.findUniqueOrThrow({
      where: { customerSessionId: session.id },
    });
    expect(paymentAfterFirst.status).toBe('SUCCEEDED');
    expect(paymentAfterFirst.stripePaymentIntentId).toBe(`pi_test_${session.id}`);

    const sessionAfterFirst = await db.customerSession.findUniqueOrThrow({ where: { id: session.id } });
    expect(sessionAfterFirst.paidAt).not.toBeNull();

    const orderAfterFirst = await db.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(orderAfterFirst.paidAt).not.toBeNull();

    const paidAtAfterFirst = sessionAfterFirst.paidAt!.getTime();

    // Stripe redelivers events (at-least-once delivery) — the exact same
    // event arriving again must not double-apply or throw.
    const res2 = await webhookPost(signedRequest({ ...eventPayload, id: `${eventPayload.id}_redelivered` }));
    expect(res2.status).toBe(200);

    const sessionAfterSecond = await db.customerSession.findUniqueOrThrow({ where: { id: session.id } });
    expect(sessionAfterSecond.paidAt!.getTime()).toBe(paidAtAfterFirst); // untouched — guard skipped the update
  });
});

describe('Stripe webhook: legacy single-order payment flow', () => {
  it('flips PENDING_PAYMENT -> NEW and Payment -> SUCCEEDED, and is idempotent on redelivery', async () => {
    const session = await db.customerSession.create({
      data: { restaurantId, tableId, expiresAt: new Date(Date.now() + 3600_000) },
    });

    const order = await db.order.create({
      data: {
        restaurantId,
        tableId,
        customerSessionId: session.id,
        orderNumber: Math.floor(Math.random() * 1_000_000),
        status: 'PENDING_PAYMENT',
        subtotalCents: 500,
        taxCents: 0,
        totalCents: 500,
        currency: 'EUR',
      },
    });

    await db.payment.create({
      data: {
        orderId: order.id,
        status: 'REQUIRES_PAYMENT',
        paymentMethod: 'ONLINE',
        amountCents: 500,
        currency: 'EUR',
        applicationFeeCents: 0,
        stripeCheckoutSessionId: `cs_test_legacy_${order.id}`,
      },
    });

    const eventPayload = {
      id: `evt_legacy_${order.id}`,
      type: 'checkout.session.completed',
      data: {
        object: {
          id: `cs_test_legacy_${order.id}`,
          payment_intent: `pi_test_legacy_${order.id}`,
          metadata: { orderId: order.id },
        },
      },
    };

    const res1 = await webhookPost(signedRequest(eventPayload));
    expect(res1.status).toBe(200);

    const orderAfterFirst = await db.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(orderAfterFirst.status).toBe('NEW');
    expect(orderAfterFirst.paidAt).not.toBeNull();

    const paymentAfterFirst = await db.payment.findUniqueOrThrow({ where: { orderId: order.id } });
    expect(paymentAfterFirst.status).toBe('SUCCEEDED');

    const paidAtAfterFirst = orderAfterFirst.paidAt!.getTime();

    // Redelivery: order is no longer PENDING_PAYMENT, so the guard must
    // skip re-applying the update entirely.
    const res2 = await webhookPost(signedRequest({ ...eventPayload, id: `${eventPayload.id}_redelivered` }));
    expect(res2.status).toBe(200);

    const orderAfterSecond = await db.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(orderAfterSecond.status).toBe('NEW');
    expect(orderAfterSecond.paidAt!.getTime()).toBe(paidAtAfterFirst);
  });

  it('checkout.session.expired flips PENDING_PAYMENT -> PAYMENT_FAILED', async () => {
    const session = await db.customerSession.create({
      data: { restaurantId, tableId, expiresAt: new Date(Date.now() + 3600_000) },
    });

    const order = await db.order.create({
      data: {
        restaurantId,
        tableId,
        customerSessionId: session.id,
        orderNumber: Math.floor(Math.random() * 1_000_000),
        status: 'PENDING_PAYMENT',
        subtotalCents: 500,
        taxCents: 0,
        totalCents: 500,
        currency: 'EUR',
      },
    });

    await db.payment.create({
      data: {
        orderId: order.id,
        status: 'REQUIRES_PAYMENT',
        paymentMethod: 'ONLINE',
        amountCents: 500,
        currency: 'EUR',
        applicationFeeCents: 0,
      },
    });

    const res = await webhookPost(
      signedRequest({
        id: `evt_expired_${order.id}`,
        type: 'checkout.session.expired',
        data: { object: { metadata: { orderId: order.id } } },
      })
    );
    expect(res.status).toBe(200);

    const orderAfter = await db.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(orderAfter.status).toBe('PAYMENT_FAILED');

    const paymentAfter = await db.payment.findUniqueOrThrow({ where: { orderId: order.id } });
    expect(paymentAfter.status).toBe('FAILED');
  });

  it('does not resurrect an order that is no longer PENDING_PAYMENT on expiry', async () => {
    const session = await db.customerSession.create({
      data: { restaurantId, tableId, expiresAt: new Date(Date.now() + 3600_000) },
    });

    const order = await db.order.create({
      data: {
        restaurantId,
        tableId,
        customerSessionId: session.id,
        orderNumber: Math.floor(Math.random() * 1_000_000),
        status: 'COMPLETED', // already paid/completed via some other path
        subtotalCents: 500,
        taxCents: 0,
        totalCents: 500,
        currency: 'EUR',
        paidAt: new Date(),
      },
    });

    await db.payment.create({
      data: {
        orderId: order.id,
        status: 'SUCCEEDED',
        paymentMethod: 'ONLINE',
        amountCents: 500,
        currency: 'EUR',
        applicationFeeCents: 0,
      },
    });

    const res = await webhookPost(
      signedRequest({
        id: `evt_stale_expired_${order.id}`,
        type: 'checkout.session.expired',
        data: { object: { metadata: { orderId: order.id } } },
      })
    );
    expect(res.status).toBe(200);

    const orderAfter = await db.order.findUniqueOrThrow({ where: { id: order.id } });
    expect(orderAfter.status).toBe('COMPLETED'); // untouched
  });
});

describe('Stripe webhook: membership subscription sync', () => {
  afterEach(async () => {
    await db.membership.deleteMany({ where: { restaurantId } });
  });

  it('syncs a trialing subscription to Membership', async () => {
    await db.membership.create({ data: { restaurantId, status: 'INCOMPLETE' } });

    const res = await webhookPost(
      signedRequest({
        id: 'evt_sub_created',
        type: 'customer.subscription.created',
        data: {
          object: {
            id: 'sub_test_1',
            status: 'trialing',
            metadata: { restaurantId },
            trial_end: Math.floor(Date.now() / 1000) + 7 * 86400,
            cancel_at_period_end: false,
            current_period_end: Math.floor(Date.now() / 1000) + 7 * 86400,
          },
        },
      })
    );
    expect(res.status).toBe(200);

    const membership = await db.membership.findUniqueOrThrow({ where: { restaurantId } });
    expect(membership.status).toBe('TRIALING');
    expect(membership.stripeSubscriptionId).toBe('sub_test_1');
    expect(membership.trialEndsAt).not.toBeNull();
  });

  it('syncs active -> past_due -> canceled across repeated updates', async () => {
    await db.membership.create({ data: { restaurantId, status: 'TRIALING' } });

    await webhookPost(
      signedRequest({
        id: 'evt_sub_active',
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_test_2',
            status: 'active',
            metadata: { restaurantId },
            trial_end: null,
            cancel_at_period_end: false,
            current_period_end: Math.floor(Date.now() / 1000) + 30 * 86400,
          },
        },
      })
    );
    expect((await db.membership.findUniqueOrThrow({ where: { restaurantId } })).status).toBe('ACTIVE');

    await webhookPost(
      signedRequest({
        id: 'evt_sub_past_due',
        type: 'customer.subscription.updated',
        data: {
          object: {
            id: 'sub_test_2',
            status: 'past_due',
            metadata: { restaurantId },
            trial_end: null,
            cancel_at_period_end: false,
            current_period_end: Math.floor(Date.now() / 1000) + 30 * 86400,
          },
        },
      })
    );
    expect((await db.membership.findUniqueOrThrow({ where: { restaurantId } })).status).toBe('PAST_DUE');

    await webhookPost(
      signedRequest({
        id: 'evt_sub_deleted',
        type: 'customer.subscription.deleted',
        data: { object: { id: 'sub_test_2', metadata: { restaurantId } } },
      })
    );
    expect((await db.membership.findUniqueOrThrow({ where: { restaurantId } })).status).toBe('CANCELED');
  });

  it('ignores a subscription event with no restaurantId metadata rather than throwing', async () => {
    const res = await webhookPost(
      signedRequest({
        id: 'evt_sub_no_metadata',
        type: 'customer.subscription.updated',
        data: { object: { id: 'sub_orphan', status: 'active', metadata: {} } },
      })
    );
    expect(res.status).toBe(200);
  });

  it('invoice.payment_failed is logged only and does not error', async () => {
    const res = await webhookPost(
      signedRequest({
        id: 'evt_invoice_failed',
        type: 'invoice.payment_failed',
        data: { object: { id: 'in_test_1' } },
      })
    );
    expect(res.status).toBe(200);
  });
});
