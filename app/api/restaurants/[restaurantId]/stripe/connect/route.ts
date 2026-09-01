import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/lib/db';
import { stripe } from '@/src/lib/stripe';
import { requireRestaurantAccess } from '@/src/lib/auth';
import { errorResponse } from '@/src/lib/api-response';

// Starts (or resumes) Stripe Connect Express onboarding for a restaurant.
// Express is the right Connect flow here: Stripe hosts the KYC/bank-details
// form, so we never collect or store the restaurant's banking info
// ourselves. Returns an onboarding URL the OWNER opens to finish setup.
export async function POST(
  _req: NextRequest,
  { params }: { params: { restaurantId: string } }
) {
  try {
    const access = await requireRestaurantAccess(params.restaurantId, 'OWNER');
    if (!access.ok) return NextResponse.json({ error: access.message }, { status: access.status });

    const restaurant = await db.restaurant.findUnique({
      where: { id: params.restaurantId },
      include: { stripeAccount: true },
    });
    if (!restaurant) return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });

    let stripeAccountId = restaurant.stripeAccount?.stripeAccountId;

    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        type: 'express',
        business_type: 'company',
        metadata: { restaurantId: restaurant.id },
      });
      stripeAccountId = account.id;
      await db.stripeAccount.create({
        data: { restaurantId: restaurant.id, stripeAccountId },
      });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${appUrl}/dashboard/${restaurant.id}/settings/payments?refresh=1`,
      return_url: `${appUrl}/dashboard/${restaurant.id}/settings/payments?return=1`,
      type: 'account_onboarding',
    });

    return NextResponse.json({ onboardingUrl: accountLink.url });
  } catch (err) {
    return errorResponse(err);
  }
}
