import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/lib/db';
import { requireRestaurantAccess } from '@/src/lib/auth';
import { errorResponse } from '@/src/lib/api-response';

type RangeKey =
  | 'today'
  | '7d'
  | '30d'
  | 'month'
  | 'custom';

type KpiRow = {
  revenueCents: bigint;
  orderCount: number;
  sessionCount: number;
  averageOrderCents: number | null;
  averageServiceSeconds: number | null;
};

type RevenueDayRow = {
  date: string;
  revenueCents: bigint;
  orderCount: number;
};

type HourRow = {
  hour: number;
  orderCount: number;
  revenueCents: bigint;
};

type DayOfWeekRow = {
  dayOfWeek: number;
  orderCount: number;
  revenueCents: bigint;
};

type CategoryRow = {
  categoryId: string;
  name: string;
  revenueCents: bigint;
  quantitySold: number;
};

type ProductRow = {
  menuItemId: string;
  name: string;
  quantitySold: number;
  revenueCents: bigint;
};

type CountRow = {
  count: number;
};

function getLocalDateString(
  date: Date,
  timezone: string
): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  return `${values.year}-${values.month}-${values.day}`;
}

function getTimezoneOffsetMinutes(
  date: Date,
  timezone: string
): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  const localAsUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second)
  );

  return Math.round(
    (localAsUtc - date.getTime()) / 60000
  );
}

function localMidnightToUtc(
  localDate: string,
  timezone: string
): Date {
  const [year, month, day] = localDate
    .split('-')
    .map(Number);

  const localAsUtc = Date.UTC(
    year,
    month - 1,
    day,
    0,
    0,
    0,
    0
  );

  let result = new Date(localAsUtc);

  for (let i = 0; i < 3; i += 1) {
    const offset = getTimezoneOffsetMinutes(
      result,
      timezone
    );

    result = new Date(
      localAsUtc - offset * 60 * 1000
    );
  }

  return result;
}

function addLocalDays(
  localDate: string,
  days: number
): string {
  const [year, month, day] = localDate
    .split('-')
    .map(Number);

  const date = new Date(
    Date.UTC(year, month - 1, day)
  );

  date.setUTCDate(
    date.getUTCDate() + days
  );

  return date.toISOString().slice(0, 10);
}

function addLocalMonths(
  localDate: string,
  months: number
): string {
  const [year, month, day] = localDate
    .split('-')
    .map(Number);

  const date = new Date(
    Date.UTC(year, month - 1, day)
  );

  date.setUTCMonth(
    date.getUTCMonth() + months
  );

  return date.toISOString().slice(0, 10);
}

function resolveRange(
  searchParams: URLSearchParams,
  timezone: string
) {
  const requestedRange =
    searchParams.get('range') ?? 'today';

  const range = requestedRange as RangeKey;

  const now = new Date();

  const today = getLocalDateString(
    now,
    timezone
  );

  let localFrom: string;
  let localToExclusive: string;

  switch (range) {
    case 'today':
      localFrom = today;
      localToExclusive = addLocalDays(
        today,
        1
      );
      break;

    case '7d':
      localFrom = addLocalDays(
        today,
        -6
      );
      localToExclusive = addLocalDays(
        today,
        1
      );
      break;

    case '30d':
      localFrom = addLocalDays(
        today,
        -29
      );
      localToExclusive = addLocalDays(
        today,
        1
      );
      break;

    case 'month': {
      const [year, month] = today
        .split('-')
        .map(Number);

      localFrom =
        `${year}-${String(month).padStart(2, '0')}-01`;

      localToExclusive =
        addLocalMonths(
          localFrom,
          1
        );

      break;
    }

    case 'custom': {
      const fromParam =
        searchParams.get('from');

      const toParam =
        searchParams.get('to');

      if (!fromParam || !toParam) {
        throw new Error(
          'Custom range requires from and to'
        );
      }

      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(
          fromParam
        ) ||
        !/^\d{4}-\d{2}-\d{2}$/.test(
          toParam
        )
      ) {
        throw new Error(
          'Custom range must use YYYY-MM-DD'
        );
      }

      localFrom = fromParam;

      localToExclusive =
        addLocalDays(
          toParam,
          1
        );

      break;
    }

    default:
      throw new Error(
        'Unsupported analytics range'
      );
  }

  return {
    range,

    from: localMidnightToUtc(
      localFrom,
      timezone
    ),

    to: localMidnightToUtc(
      localToExclusive,
      timezone
    ),

    localFrom,
    localToExclusive,
  };
}

function serializeBigInt(
  value: unknown
): unknown {
  if (typeof value === 'bigint') {
    return Number(value);
  }

  if (Array.isArray(value)) {
    return value.map(serializeBigInt);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (
    value !== null &&
    typeof value === 'object'
  ) {
    return Object.fromEntries(
      Object.entries(value).map(
        ([key, nested]) => [
          key,
          serializeBigInt(nested),
        ]
      )
    );
  }

  return value;
}

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
  try {
    const access =
      await requireRestaurantAccess(
        params.restaurantId,
        'MANAGER'
      );

    if (!access.ok) {
      return NextResponse.json(
        {
          error: access.message,
        },
        {
          status: access.status,
        }
      );
    }

    const restaurant =
      await db.restaurant.findUnique({
        where: {
          id: params.restaurantId,
        },

        select: {
          id: true,
          timezone: true,
          currency: true,
        },
      });

    if (!restaurant) {
      return NextResponse.json(
        {
          error: 'Restaurant not found',
        },
        {
          status: 404,
        }
      );
    }

    const {
      range,
      from,
      to,
      localFrom,
      localToExclusive,
    } = resolveRange(
      req.nextUrl.searchParams,
      restaurant.timezone
    );

    const [kpis] =
      await db.$queryRaw<KpiRow[]>`
        SELECT
          COALESCE(
            SUM(o."totalCents"),
            0
          )::bigint AS "revenueCents",

          COUNT(*)::int AS "orderCount",

          COUNT(
            DISTINCT o."customerSessionId"
          )::int AS "sessionCount",

          COALESCE(
            ROUND(
              AVG(o."totalCents")
            ),
            0
          )::int AS "averageOrderCents",

          COALESCE(
            ROUND(
              AVG(
                EXTRACT(
                  EPOCH FROM (
                    o."completedAt" -
                    o."createdAt"
                  )
                )
              )
            ),
            0
          )::int AS "averageServiceSeconds"

        FROM "Order" o

        WHERE o."restaurantId" =
          ${params.restaurantId}

          AND o.status = 'COMPLETED'

          AND o."createdAt" >= ${from}
          AND o."createdAt" < ${to}
      `;

    const revenueByDay =
      await db.$queryRaw<RevenueDayRow[]>`
        SELECT
          TO_CHAR(
            o."createdAt"
              AT TIME ZONE 'UTC'
              AT TIME ZONE ${restaurant.timezone},
            'YYYY-MM-DD'
          ) AS date,

          COALESCE(
            SUM(o."totalCents"),
            0
          )::bigint AS "revenueCents",

          COUNT(*)::int AS "orderCount"

        FROM "Order" o

        WHERE o."restaurantId" =
          ${params.restaurantId}

          AND o.status = 'COMPLETED'

          AND o."createdAt" >= ${from}
          AND o."createdAt" < ${to}

        GROUP BY 1
        ORDER BY 1
      `;

    const ordersByHour =
      await db.$queryRaw<HourRow[]>`
        SELECT
          EXTRACT(
            HOUR FROM (
              o."createdAt"
                AT TIME ZONE 'UTC'
                AT TIME ZONE ${restaurant.timezone}
            )
          )::int AS hour,

          COUNT(*)::int AS "orderCount",

          COALESCE(
            SUM(o."totalCents"),
            0
          )::bigint AS "revenueCents"

        FROM "Order" o

        WHERE o."restaurantId" =
          ${params.restaurantId}

          AND o.status = 'COMPLETED'

          AND o."createdAt" >= ${from}
          AND o."createdAt" < ${to}

        GROUP BY 1
        ORDER BY 1
      `;

    const ordersByDayOfWeek =
      await db.$queryRaw<DayOfWeekRow[]>`
        SELECT
          EXTRACT(
            ISODOW FROM (
              o."createdAt"
                AT TIME ZONE 'UTC'
                AT TIME ZONE ${restaurant.timezone}
            )
          )::int AS "dayOfWeek",

          COUNT(*)::int AS "orderCount",

          COALESCE(
            SUM(o."totalCents"),
            0
          )::bigint AS "revenueCents"

        FROM "Order" o

        WHERE o."restaurantId" =
          ${params.restaurantId}

          AND o.status = 'COMPLETED'

          AND o."createdAt" >= ${from}
          AND o."createdAt" < ${to}

        GROUP BY 1
        ORDER BY 1
      `;

    const categories =
      await db.$queryRaw<CategoryRow[]>`
        SELECT
          mc.id AS "categoryId",
          mc.name,

          COALESCE(
            SUM(oi."lineTotalCents"),
            0
          )::bigint AS "revenueCents",

          COALESCE(
            SUM(oi.quantity),
            0
          )::int AS "quantitySold"

        FROM "OrderItem" oi

        JOIN "Order" o
          ON o.id = oi."orderId"

        JOIN "MenuItem" mi
          ON mi.id = oi."menuItemId"

        JOIN "MenuCategory" mc
          ON mc.id = mi."categoryId"

        WHERE o."restaurantId" =
          ${params.restaurantId}

          AND o.status = 'COMPLETED'

          AND o."createdAt" >= ${from}
          AND o."createdAt" < ${to}

        GROUP BY
          mc.id,
          mc.name

        ORDER BY
          "revenueCents" DESC
      `;

    const topProducts =
      await db.$queryRaw<ProductRow[]>`
        SELECT
          mi.id AS "menuItemId",
          mi.name,

          COALESCE(
            SUM(oi.quantity),
            0
          )::int AS "quantitySold",

          COALESCE(
            SUM(oi."lineTotalCents"),
            0
          )::bigint AS "revenueCents"

        FROM "OrderItem" oi

        JOIN "Order" o
          ON o.id = oi."orderId"

        JOIN "MenuItem" mi
          ON mi.id = oi."menuItemId"

        WHERE o."restaurantId" =
          ${params.restaurantId}

          AND o.status = 'COMPLETED'

          AND o."createdAt" >= ${from}
          AND o."createdAt" < ${to}

        GROUP BY
          mi.id,
          mi.name

        ORDER BY
          "quantitySold" DESC

        LIMIT 10
      `;

    const [dessertRow] =
      await db.$queryRaw<CountRow[]>`
        SELECT
          COUNT(
            DISTINCT o."customerSessionId"
          )::int AS count

        FROM "Order" o

        JOIN "OrderItem" oi
          ON oi."orderId" = o.id

        JOIN "MenuItem" mi
          ON mi.id = oi."menuItemId"

        JOIN "MenuCategory" mc
          ON mc.id = mi."categoryId"

        WHERE o."restaurantId" =
          ${params.restaurantId}

          AND o.status = 'COMPLETED'

          AND o."createdAt" >= ${from}
          AND o."createdAt" < ${to}

          AND mc."isDessertCategory" = true
      `;

    const [sessionRow] =
      await db.$queryRaw<CountRow[]>`
        SELECT
          COUNT(
            DISTINCT o."customerSessionId"
          )::int AS count

        FROM "Order" o

        WHERE o."restaurantId" =
          ${params.restaurantId}

          AND o.status = 'COMPLETED'

          AND o."createdAt" >= ${from}
          AND o."createdAt" < ${to}
      `;

    const safeKpis =
      serializeBigInt(
        kpis
      ) as KpiRow | undefined;

    const safeRevenue =
      serializeBigInt(
        revenueByDay
      );

    const safeHours =
      serializeBigInt(
        ordersByHour
      ) as Array<{
        hour: number;
        orderCount: number;
        revenueCents: number;
      }>;

    const safeDays =
      serializeBigInt(
        ordersByDayOfWeek
      );

    const safeCategories =
      serializeBigInt(
        categories
      );

    const safeProducts =
      serializeBigInt(
        topProducts
      );

    const revenueCents =
      Number(
        safeKpis?.revenueCents ?? 0
      );

    const orderCount =
      Number(
        safeKpis?.orderCount ?? 0
      );

    const sessionCount =
      Number(
        sessionRow?.count ?? 0
      );

    const dessertSessions =
      Number(
        dessertRow?.count ?? 0
      );

    const busiestHour =
      safeHours.length > 0
        ? safeHours.reduce(
            (best, current) =>
              current.orderCount >
              best.orderCount
                ? current
                : best
          ).hour
        : null;

    const quietestHour =
      safeHours.length > 0
        ? safeHours.reduce(
            (best, current) =>
              current.orderCount <
              best.orderCount
                ? current
                : best
          ).hour
        : null;

    const dessertConversionPct =
      sessionCount > 0
        ? Number(
            (
              (dessertSessions /
                sessionCount) *
              100
            ).toFixed(1)
          )
        : 0;

    return NextResponse.json({
      range: {
        key: range,
        timezone:
          restaurant.timezone,
        currency:
          restaurant.currency,
        from:
          from.toISOString(),
        to:
          to.toISOString(),
        localFrom,
        localToExclusive,
      },

      kpis: {
        revenueCents,
        orderCount,
        sessionCount,

        averageOrderCents:
          Number(
            safeKpis?.averageOrderCents ??
              0
          ),

        averageServiceSeconds:
          Number(
            safeKpis?.averageServiceSeconds ??
              0
          ),
      },

      revenueByDay:
        safeRevenue,

      ordersByHour:
        safeHours,

      ordersByDayOfWeek:
        safeDays,

      categories:
        safeCategories,

      topProducts:
        safeProducts,

      busiestHour,
      quietestHour,

      dessert: {
        sessionCount,
        dessertSessions,
        conversionPct:
          dessertConversionPct,
      },
    });
  } catch (err) {
    console.error(
      'Analytics overview error:',
      err
    );

    return errorResponse(err);
  }
}