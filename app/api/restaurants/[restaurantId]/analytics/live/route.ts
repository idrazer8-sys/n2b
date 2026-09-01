import { NextResponse } from 'next/server';
import { db } from '@/src/lib/db';
import { requireRestaurantAccess } from '@/src/lib/auth';
import { errorResponse } from '@/src/lib/api-response';

type BacklogRow = {
  count: number;
};

type ReadyOrderRow = {
  id: string;
  orderNumber: number;
  tableId: string;
  tableLabel: string;
  readyAt: Date;
};

function classifyWaitingTime(waitingSeconds: number) {
  if (waitingSeconds >= 600) {
    return 'CRITICAL' as const;
  }

  if (waitingSeconds >= 300) {
    return 'WARNING' as const;
  }

  return 'NORMAL' as const;
}

function serializeDate(value: Date) {
  return value.toISOString();
}

export async function GET(
  req: Request,
  {
    params,
  }: {
    params: {
      restaurantId: string;
    };
  }
) {
  try {
    const access = await requireRestaurantAccess(
      params.restaurantId,
      'MANAGER'
    );

    if (!access.ok) {
      return NextResponse.json(
        { error: access.message },
        { status: access.status }
      );
    }

    const restaurant = await db.restaurant.findUnique({
      where: {
        id: params.restaurantId,
      },
      select: {
        timezone: true,
      },
    });

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    const [backlogRow] =
      await db.$queryRaw<BacklogRow[]>`
        SELECT COUNT(*)::int AS count
        FROM "Order"
        WHERE "restaurantId" = ${params.restaurantId}
          AND status IN ('ACCEPTED', 'PREPARING')
      `;

    const readyOrders =
      await db.$queryRaw<ReadyOrderRow[]>`
        SELECT
          o.id,
          o."orderNumber",
          o."tableId",
          t.label AS "tableLabel",
          o."readyAt"
        FROM "Order" o
        JOIN "Table" t
          ON t.id = o."tableId"
        WHERE o."restaurantId" = ${params.restaurantId}
          AND o.status = 'READY'
          AND o."readyAt" IS NOT NULL
        ORDER BY o."readyAt" ASC
      `;

    const now = Date.now();

    const readyWaiting = readyOrders.map((order) => {
      const waitingSeconds = Math.max(
        0,
        Math.floor(
          (now - order.readyAt.getTime()) / 1000
        )
      );

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        tableId: order.tableId,
        tableLabel: order.tableLabel,
        readyAt: serializeDate(order.readyAt),
        waitingSeconds,
        severity:
          classifyWaitingTime(waitingSeconds),
      };
    });

    const backlog = Number(
      backlogRow?.count ?? 0
    );

    const criticalReadyCount =
      readyWaiting.filter(
        (order) =>
          order.severity === 'CRITICAL'
      ).length;

    const warningReadyCount =
      readyWaiting.filter(
        (order) =>
          order.severity === 'WARNING'
      ).length;

    let kitchenStatus:
      | 'HEALTHY'
      | 'BUSY'
      | 'CRITICAL';

    if (
      backlog >= 8 ||
      criticalReadyCount >= 2
    ) {
      kitchenStatus = 'CRITICAL';
    } else if (
      backlog >= 4 ||
      criticalReadyCount >= 1 ||
      warningReadyCount >= 2
    ) {
      kitchenStatus = 'BUSY';
    } else {
      kitchenStatus = 'HEALTHY';
    }

    return NextResponse.json({
      restaurantTimezone:
        restaurant.timezone,

      generatedAt:
        new Date().toISOString(),

      kitchen: {
        status: kitchenStatus,
        backlog,
      },

      readyWaiting: {
        count: readyWaiting.length,
        criticalCount:
          criticalReadyCount,
        warningCount:
          warningReadyCount,
        orders: readyWaiting,
      },
    });
  } catch (err) {
    console.error(
      'Analytics live error:',
      err
    );

    return errorResponse(err);
  }
}