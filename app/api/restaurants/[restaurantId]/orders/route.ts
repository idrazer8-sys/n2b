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
          menuItem: {
            select: {
              category: {
                select: { kitchenKind: true },
              },
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  // Flatten each item's category-level kitchen kind onto the item itself
  // (and drop the nested menuItem we only fetched for that), so the
  // kitchen/waiter UI can decide per order whether it's eligible for the
  // "straight to the waiter" shortcut (drinks need no preparation)
  // without a deep lookup.
  const withKitchenKind = orders.map((order) => ({
    ...order,
    items: order.items.map((item) => {
      const { menuItem, ...rest } = item;
      return {
        ...rest,
        kitchenKind: menuItem?.category?.kitchenKind ?? 'FOOD',
      };
    }),
  }));

  return NextResponse.json(withKitchenKind);
}