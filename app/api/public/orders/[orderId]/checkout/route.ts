import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/src/lib/db';
import { stripe } from '@/src/lib/stripe';
import { verifyCustomerSession, readSessionTokenFromCookies } from '@/src/lib/customer-session';
import { errorResponse } from '@/src/lib/api-response';

// Creates a Stripe Checkout Session for an existing PENDING_PAYMENT order.
// Uses Stripe Checkout (not a raw PaymentIntent) because it gives us
// card + Apple Pay + Google Pay with zero extra frontend work, and Stripe
// hosts the actual card entry page — we never touch card data.
export async function POST(
  _req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const order = await db.order.findUnique({
      where: { id: params.orderId },
      include: { restaurant: { include: { stripeAccount: true } } },
    });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    // Verify the customer session cookie actually corresponds to THIS
    // order's restaurant+table — prevents customer B from paying (and thus
    // learning details of) customer A's order by guessing an order id.
    const sessionToken = readSessionTokenFromCookies(order.restaurantId);
    const customerSession = await verifyCustomerSession(order.restaurantId, sessionToken);
    if (!customerSession || customerSession.id !== order.customerSessionId) {
      return NextResponse.json({ error: 'Not authorized for this order' }, { status: 403 });
    }

    if (order.status !== 'PENDING_PAYMENT') {
      return NextResponse.json({ error: 'This order is not awaiting payment' }, { status: 409 });
    }

    // The platform no longer takes a per-order commission — restaurants
    // keep 100% of order revenue under the membership billing model (see
    // /api/restaurants/[id]/membership). Connect still routes funds
    // straight to the restaurant's own account via transfer_data below.
    const applicationFeeCents = 0;

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      payment_method_types: ['card'], // Apple Pay / Google Pay surface automatically via card + domain verification
      line_items: [
        {
          price_data: {
            currency: order.currency.toLowerCase(),
            product_data: { name: `${order.restaurant.name} — Order #${order.orderNumber}` },
            unit_amount: order.totalCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/r/${order.restaurant.slug}/order/${order.id}?paid=1`,
      cancel_url: `${appUrl}/r/${order.restaurant.slug}?t=${customerSession.tableId}`,
      metadata: { orderId: order.id, restaurantId: order.restaurantId },
    };

    // Split payment via Stripe Connect once the restaurant has completed
    // onboarding. Until then we fail closed rather than silently taking
    // 100% of the payment with no way to pay the restaurant out — see
    // /api/restaurants/[id]/stripe/connect for onboarding.
    if (order.restaurant.stripeAccount?.chargesEnabled) {
      sessionParams.payment_intent_data = {
        transfer_data: { destination: order.restaurant.stripeAccount.stripeAccountId },
      };
    } else if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'This restaurant has not finished payment setup yet' },
        { status: 409 }
      );
    }
    // In development, we allow checkout without Connect so the flow can be
    // tested end-to-end with a single platform Stripe account.

    const checkoutSession = await stripe.checkout.sessions.create(sessionParams);

    await db.payment.upsert({
      where: { orderId: order.id },
      create: {
        orderId: order.id,
        stripeCheckoutSessionId: checkoutSession.id,
        status: 'REQUIRES_PAYMENT',
        amountCents: order.totalCents,
        currency: order.currency,
        applicationFeeCents,
      },
      update: { stripeCheckoutSessionId: checkoutSession.id },
    });

    return NextResponse.json({ checkoutUrl: checkoutSession.url });
  } catch (err) {
    return errorResponse(err);
  }
}
