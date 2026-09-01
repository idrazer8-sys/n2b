import {
  NextRequest,
  NextResponse,
} from 'next/server';

import { db } from '@/src/lib/db';

import {
  requireRestaurantPortalAccess,
} from '@/src/lib/auth';

import {
  errorResponse,
} from '@/src/lib/api-response';

type Context = {
  params: {
    restaurantId: string;
    orderId: string;
  };
};

export async function POST(
  _req: NextRequest,
  {
    params,
  }: Context
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

    const staffId =
      access.membership.id;

    const order =
      await db.order.findFirst({
        where: {
          id:
            params.orderId,

          restaurantId:
            params.restaurantId,
        },

        select: {
          id: true,
          orderNumber: true,
          status: true,
          staffId: true,
        },
      });

    if (!order) {
      return NextResponse.json(
        {
          error:
            'Order not found',
        },
        {
          status: 404,
        }
      );
    }

    if (
      order.status !==
      'READY'
    ) {
      return NextResponse.json(
        {
          error:
            `Order is ${order.status}, not READY.`,
        },
        {
          status: 409,
        }
      );
    }

    /*
     * Already owned by the current waiter.
     *
     * This makes the operation idempotent.
     */
    if (
      order.staffId ===
      staffId
    ) {
      return NextResponse.json({
        ok: true,
        alreadyMine: true,
        orderId:
          order.id,
        staffId,
      });
    }

    /*
     * The critical concurrency operation.
     *
     * Only a READY order with staffId=NULL can be
     * successfully claimed.
     *
     * If two Waiters click simultaneously, PostgreSQL
     * allows only one update to match this WHERE clause.
     */
    const result =
      await db.order.updateMany({
        where: {
          id:
            order.id,

          restaurantId:
            params.restaurantId,

          status:
            'READY',

          staffId:
            null,
        },

        data: {
          staffId,
        },
      });

    if (
      result.count !==
      1
    ) {
      const current =
        await db.order.findFirst({
          where: {
            id:
              order.id,

            restaurantId:
              params.restaurantId,
          },

          select: {
            status: true,
            staffId: true,

            RestaurantStaff: {
              select: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        });

      if (
        current?.staffId &&
        current.staffId !==
          staffId
      ) {
        return NextResponse.json(
          {
            error:
              current.RestaurantStaff?.user?.name
                ? `Already assigned to ${current.RestaurantStaff.user.name}.`
                : 'Already assigned to another waiter.',
          },
          {
            status: 409,
          }
        );
      }

      return NextResponse.json(
        {
          error:
            'This order can no longer be claimed.',
        },
        {
          status: 409,
        }
      );
    }

    /*
     * Historical audit event.
     */
    await db.orderEvent.create({
      data: {
        orderId:
          order.id,

        restaurantId:
          params.restaurantId,

        type:
          'ORDER_CLAIMED',

        actorUserId:
          access.user.id,

        metadata: {
          orderNumber:
            order.orderNumber,

          staffId,
        },
      },
    });

    return NextResponse.json({
      ok: true,
      alreadyMine: false,
      orderId:
        order.id,
      staffId,
    });
  } catch (error) {
    console.error(
      'POST order claim error:',
      error
    );

    return errorResponse(error);
  }
}