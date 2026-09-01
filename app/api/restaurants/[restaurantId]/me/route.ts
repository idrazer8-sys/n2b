import { NextRequest, NextResponse } from 'next/server';

import {
  requireRestaurantPortalAccess,
} from '@/src/lib/auth';

export async function GET(
  _req: NextRequest,
  {
    params,
  }: {
    params: {
      restaurantId: string;
    };
  }
) {
  try {
    const access =
      await requireRestaurantPortalAccess(
        params.restaurantId,
        'WAITER',
        'STAFF'
      );

    if (!access.ok) {
      return NextResponse.json(
        {
          error:
            access.message,
        },
        {
          status:
            access.status,
        }
      );
    }

    return NextResponse.json({
      staffId:
        access.membership.id,

      role:
        access.role,

      staffPortal:
        access.portal,

      user: {
        id:
          access.user.id,
        name:
          access.user.name,
        email:
          access.user.email,
      },
    });
  } catch (error) {
    console.error(
      'GET /api/restaurants/[restaurantId]/me error:',
      error
    );

    return NextResponse.json(
      {
        error:
          'Internal server error',
      },
      {
        status: 500,
      }
    );
  }
}