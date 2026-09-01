import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/lib/db';
import { requireRestaurantAccess } from '@/src/lib/auth';

export async function GET(
  req: NextRequest,
  {
    params,
  }: {
    params: {
      restaurantId: string;
    };
  }
) {
  const access = await requireRestaurantAccess(
    params.restaurantId,
    'STAFF'
  );

  if (!access.ok) {
    return NextResponse.json(
      { error: access.message },
      { status: access.status }
    );
  }

  const statusFilter =
    req.nextUrl.searchParams.get('status');

  const orders = await db.order.findMany({
    where: {
      restaurantId: params.restaurantId,
      status: statusFilter
        ? (statusFilter as any)
        : {
            in: [
              'NEW',
              'ACCEPTED',
              'PREPARING',
              'READY',
            ],
          },
    },
    include: {
      table: true,
      items: {
        include: {
          modifiers: true,
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  return NextResponse.json(orders);
}