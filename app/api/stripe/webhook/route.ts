import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import * as Sentry from '@sentry/nextjs';
import { db } from '@/src/lib/db';
import { stripe } from '@/src/lib/stripe';
import { publishOrderEvent } from '@/src/lib/order-events';

const SUBSCRIPTION_STATUS_MAP: Record<
  string,
  'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELED'
> = {
  trialing: 'TRIALING',
  active: 'ACTIVE',
  past_due: 'PAST_DUE',
  canceled: 'CANCELED',
  unpaid: 'CANCELED',
  incomplete_expired: 'CANCELED',
};

// Newer Stripe API versions moved current_period_end/current_period_start
// off the root Subscription object onto each subscription item — read
// defensively from either shape so this keeps working across accounts on
// different API versions (our own outbound calls pin apiVersion in
// src/lib/stripe.ts, but the *webhook payload* shape follows the Stripe
// account's/endpoint's configured version, which can be newer).
function getCurrentPeriodEnd(
  subscription: Stripe.Subscription
): Date | null {
  const rootValue = (
    subscription as unknown as { current_period_end?: number }
  ).current_period_end;

  if (typeof rootValue === 'number') {
    return new Date(rootValue * 1000);
  }

  const itemValue = subscription.items?.data?.[0] as
    | { current_period_end?: number }
    | undefined;

  if (typeof itemValue?.current_period_end === 'number') {
    return new Date(itemValue.current_period_end * 1000);
  }

  return null;
}

async function syncMembershipFromSubscription(
  subscription: Stripe.Subscription
) {
  const restaurantId = subscription.metadata?.restaurantId;

  if (!restaurantId) {
    console.error(
      'Subscription event missing restaurantId metadata',
      subscription.id
    );
    return;
  }

  const status =
    SUBSCRIPTION_STATUS_MAP[subscription.status] ?? undefined;

  const currentPeriodEnd = getCurrentPeriodEnd(subscription);

  await db.membership.updateMany({
    where: { restaurantId },
    data: {
      ...(status ? { status } : {}),
      stripeSubscriptionId: subscription.id,
      trialEndsAt: subscription.trial_end
        ? new Date(subscription.trial_end * 1000)
        : null,
      ...(currentPeriodEnd ? { currentPeriodEnd } : {}),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    },
  });
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get('stripe-signature');
  const rawBody = await req.text();

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing signature' },
      { status: 400 }
    );
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error(
      'Webhook signature verification failed',
      err
    );

    // Not necessarily an incident on its own (scanners hit this endpoint
    // with garbage constantly) — but a real STRIPE_WEBHOOK_SECRET
    // misconfiguration or rotation would show up as a run of these, and
    // that IS an incident (every real payment confirmation silently
    // failing), so it's worth a low-severity breadcrumb rather than
    // nothing at all.
    Sentry.captureMessage('Stripe webhook signature verification failed', {
      level: 'warning',
      extra: { error: err instanceof Error ? err.message : String(err) },
    });

    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session =
          event.data.object as {
            id: string;
            payment_intent: string | null;
            metadata: Record<string, string> | null;
          };

        const sessionId =
          session.metadata?.sessionId;

        const orderId =
          session.metadata?.orderId;

        /*
         * FINAL TABLE PAYMENT
         *
         * The new checkout stores customerSessionId
         * in metadata, so the webhook must mark the
         * whole dining session as paid.
         */
        if (sessionId) {
          const customerSession =
            await db.customerSession.findUnique({
              where: {
                id: sessionId,
              },
            });

          if (!customerSession) {
            console.error(
              'Customer session not found:',
              sessionId
            );
            break;
          }

          const orders =
            await db.order.findMany({
              where: {
                customerSessionId: sessionId,
              },
              select: {
                id: true,
                restaurantId: true,
              },
            });

          const payment =
            await db.sessionPayment.findUnique({
              where: {
                customerSessionId: sessionId,
              },
            });

          if (
            payment &&
            payment.status !== 'SUCCEEDED'
          ) {
            await db.$transaction([
              db.sessionPayment.update({
                where: {
                  customerSessionId: sessionId,
                },
                data: {
                  status: 'SUCCEEDED',
                  stripeCheckoutSessionId:
                    session.id,
                  stripePaymentIntentId:
                    session.payment_intent ??
                    undefined,
                },
              }),

              db.customerSession.update({
                where: {
                  id: sessionId,
                },
                data: {
                  paidAt: new Date(),
                },
              }),

              db.order.updateMany({
                where: {
                  customerSessionId: sessionId,
                },
                data: {
                  paidAt: new Date(),
                },
              }),
            ]);
          }

          for (const order of orders) {
            publishOrderEvent(
              order.restaurantId,
              {
                type: 'ORDER_PAID',
                orderId: order.id,
              }
            );
          }

          break;
        }

        /*
         * LEGACY SINGLE-ORDER PAYMENT
         *
         * Keep the old flow working for orders created
         * with the original checkout endpoint.
         */
        if (orderId) {
          const order =
            await db.order.findUnique({
              where: {
                id: orderId,
              },
            });

          if (
            !order ||
            order.status !==
              'PENDING_PAYMENT'
          ) {
            break;
          }

          await db.$transaction([
            db.order.update({
              where: {
                id: orderId,
              },
              data: {
                status: 'NEW',
                paidAt: new Date(),
              },
            }),

            db.payment.update({
              where: {
                orderId,
              },
              data: {
                status: 'SUCCEEDED',
                stripePaymentIntentId:
                  session.payment_intent ??
                  undefined,
              },
            }),
          ]);

          publishOrderEvent(
            order.restaurantId,
            {
              type: 'ORDER_PAID',
              orderId,
            }
          );
        }

        break;
      }

      case 'checkout.session.expired': {
        const session =
          event.data.object as {
            metadata: Record<string, string> | null;
          };

        const sessionId =
          session.metadata?.sessionId;

        const orderId =
          session.metadata?.orderId;

        if (sessionId) {
          await db.sessionPayment.updateMany({
            where: {
              customerSessionId: sessionId,
            },
            data: {
              status: 'FAILED',
            },
          });

          break;
        }

        if (orderId) {
          const order =
            await db.order.findUnique({
              where: {
                id: orderId,
              },
            });

          if (
            !order ||
            order.status !==
              'PENDING_PAYMENT'
          ) {
            break;
          }

          await db.$transaction([
            db.order.update({
              where: {
                id: orderId,
              },
              data: {
                status: 'PAYMENT_FAILED',
              },
            }),

            db.payment.update({
              where: {
                orderId,
              },
              data: {
                status: 'FAILED',
              },
            }),
          ]);
        }

        break;
      }

      /*
       * MEMBERSHIP BILLING (Stripe Subscriptions)
       *
       * These events are the single source of truth for Membership
       * status — each one carries a full, current snapshot of the
       * subscription, so treating them as idempotent "set fields to
       * this snapshot" upserts makes out-of-order/replayed delivery
       * harmless. Never derive status from invoice.* events too —
       * that would race two handlers against the same field.
       */
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        await syncMembershipFromSubscription(
          event.data.object as Stripe.Subscription
        );

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription =
          event.data.object as Stripe.Subscription;

        const restaurantId =
          subscription.metadata?.restaurantId;

        if (restaurantId) {
          await db.membership.updateMany({
            where: { restaurantId },
            data: { status: 'CANCELED' },
          });
        }

        break;
      }

      case 'invoice.payment_failed': {
        // Logged only — customer.subscription.updated independently
        // delivers the resulting `past_due` status.
        console.warn(
          'Membership invoice payment failed',
          (event.data.object as { id: string }).id
        );

        break;
      }

      default:
        break;
    }

    return NextResponse.json({
      received: true,
    });
  } catch (err) {
    console.error(
      'Stripe webhook processing error',
      err
    );

    // A processing failure here means Stripe will retry delivery (it
    // treats a 5xx as "try again later"), so the payment/subscription
    // state isn't lost — but it IS stuck until this is noticed and fixed,
    // which is exactly the kind of silent-until-a-customer-complains
    // failure this should be reported for.
    Sentry.captureException(err, {
      tags: { area: 'stripe-webhook' },
      extra: { eventType: event.type, eventId: event.id },
    });

    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
