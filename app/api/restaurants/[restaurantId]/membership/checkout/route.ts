import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/src/lib/db';
import { stripe } from '@/src/lib/stripe';
import { requireRestaurantAccess } from '@/src/lib/auth';
import { errorResponse } from '@/src/lib/api-response';

const schema = z.object({
  tier: z.enum(['BASIC', 'PRO', 'BUSINESS']),
  billingPeriod: z.enum(['MONTHLY', 'ANNUAL']),
});

const PRICE_ENV_VAR: Record<string, string> = {
  'BASIC:MONTHLY': 'STRIPE_PRICE_BASIC',
  'BASIC:ANNUAL': 'STRIPE_PRICE_BASIC_ANNUAL',
  'PRO:MONTHLY': 'STRIPE_PRICE_PRO',
  'PRO:ANNUAL': 'STRIPE_PRICE_PRO_ANNUAL',
  'BUSINESS:MONTHLY': 'STRIPE_PRICE_BUSINESS',
  'BUSINESS:ANNUAL': 'STRIPE_PRICE_BUSINESS_ANNUAL',
};

export async function POST(
  req: NextRequest,
  { params }: { params: { restaurantId: string } }
) {
  try {
    const access = await requireRestaurantAccess(
      params.restaurantId,
      'OWNER',
      { skipMembershipCheck: true }
    );

    if (!access.ok) {
      return NextResponse.json(
        { error: access.message },
        { status: access.status }
      );
    }

    const body = schema.parse(await req.json());

    const priceEnvVar =
      PRICE_ENV_VAR[`${body.tier}:${body.billingPeriod}`];

    const priceId = process.env[priceEnvVar];

    if (!priceId) {
      return NextResponse.json(
        {
          error:
            'This plan is not available yet — pricing has not been configured.',
        },
        { status: 409 }
      );
    }

    const restaurant = await db.restaurant.findUnique({
      where: { id: params.restaurantId },
      select: { id: true, name: true },
    });

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    let membership = await db.membership.findUnique({
      where: { restaurantId: params.restaurantId },
    });

    let stripeCustomerId = membership?.stripeCustomerId ?? null;

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        name: restaurant.name,
        metadata: { restaurantId: restaurant.id },
      });

      stripeCustomerId = customer.id;
    }

    membership = await db.membership.upsert({
      where: { restaurantId: params.restaurantId },
      create: {
        restaurantId: params.restaurantId,
        stripeCustomerId,
        tier: body.tier,
        stripePriceId: priceId,
      },
      update: {
        stripeCustomerId,
        tier: body.tier,
        stripePriceId: priceId,
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: stripeCustomerId,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          restaurantId: params.restaurantId,
          tier: body.tier,
        },
      },
      success_url: `${appUrl}/dashboard/${params.restaurantId}/billing?checkout=success`,
      cancel_url: `${appUrl}/dashboard/${params.restaurantId}/billing?checkout=cancelled`,
    });

    return NextResponse.json({ checkoutUrl: checkoutSession.url });
  } catch (err) {
    return errorResponse(err);
  }
}
