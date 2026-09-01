import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/lib/db';
import { stripe } from '@/src/lib/stripe';
import { requireRestaurantAccess } from '@/src/lib/auth';
import { errorResponse } from '@/src/lib/api-response';

export async function POST(
  _req: NextRequest,
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

    const membership = await db.membership.findUnique({
      where: { restaurantId: params.restaurantId },
      select: { stripeCustomerId: true },
    });

    if (!membership?.stripeCustomerId) {
      return NextResponse.json(
        {
          error:
            'No billing account yet — start a plan first.',
        },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: membership.stripeCustomerId,
      return_url: `${appUrl}/dashboard/${params.restaurantId}/billing`,
    });

    return NextResponse.json({ portalUrl: portalSession.url });
  } catch (err) {
    return errorResponse(err);
  }
}
