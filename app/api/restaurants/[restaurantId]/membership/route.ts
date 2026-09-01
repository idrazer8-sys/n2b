import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/lib/db';
import { requireRestaurantAccess } from '@/src/lib/auth';
import { errorResponse } from '@/src/lib/api-response';

export async function GET(
  _req: NextRequest,
  { params }: { params: { restaurantId: string } }
) {
  try {
    const access = await requireRestaurantAccess(
      params.restaurantId,
      'STAFF',
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
      select: {
        tier: true,
        status: true,
        trialEndsAt: true,
        currentPeriodEnd: true,
        cancelAtPeriodEnd: true,
      },
    });

    return NextResponse.json(
      membership ?? {
        tier: null,
        status: 'INCOMPLETE',
        trialEndsAt: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      }
    );
  } catch (err) {
    return errorResponse(err);
  }
}
