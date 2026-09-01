import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/lib/db';
import { requireRestaurantAccess } from '@/src/lib/auth';
import { errorResponse } from '@/src/lib/api-response';

type SlaRow = {
  acceptanceTotal: number;
  acceptanceWithin: number;

  kitchenTotal: number;
  kitchenWithin: number;

  waiterTotal: number;
  waiterWithin: number;

  totalTotal: number;
  totalWithin: number;
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
  const [year, month, day] =
    localDate.split('-').map(Number);

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
    const offset =
      getTimezoneOffsetMinutes(
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
  const [year, month, day] =
    localDate.split('-').map(Number);

  const date = new Date(
    Date.UTC(year, month - 1, day)
  );

  date.setUTCDate(
    date.getUTCDate() + days
  );

  return date.toISOString().slice(0, 10);
}

function resolveRange(
  searchParams: URLSearchParams,
  timezone: string
) {
  const range =
    searchParams.get('range') ?? 'today';

  const today =
    getLocalDateString(
      new Date(),
      timezone
    );

  let localFrom = today;
  let localToExclusive =
    addLocalDays(today, 1);

  if (range === '7d') {
    localFrom =
      addLocalDays(today, -6);
  } else if (range === '30d') {
    localFrom =
      addLocalDays(today, -29);
  } else if (range === 'month') {
    const [year, month] =
      today.split('-').map(Number);

    localFrom =
      `${year}-${String(month).padStart(2, '0')}-01`;

    localToExclusive =
      `${year}-${String(month + 1).padStart(2, '0')}-01`;

    if (month === 12) {
      localToExclusive =
        `${year + 1}-01-01`;
    }
  } else if (range === 'custom') {
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
      addLocalDays(toParam, 1);
  } else if (range !== 'today') {
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

function percent(
  within: number,
  total: number
) {
  if (total < 5) {
    return null;
  }

  return Number(
    ((within / total) * 100).toFixed(1)
  );
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
          timezone: true,
          currency: true,

          acceptanceSlaSeconds: true,
          kitchenSlaSeconds: true,
          waiterSlaSeconds: true,
          totalServiceSlaSeconds: true,
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

    const acceptanceSla =
      restaurant.acceptanceSlaSeconds ??
      300;

    const kitchenSla =
      restaurant.kitchenSlaSeconds ??
      600;

    const waiterSla =
      restaurant.waiterSlaSeconds ??
      180;

    const totalSla =
      restaurant.totalServiceSlaSeconds ??
      900;

    const [row] =
      await db.$queryRaw<SlaRow[]>`
        WITH durations AS (
          SELECT
            CASE
              WHEN "createdAt" IS NOT NULL
                AND "acceptedAt" IS NOT NULL
              THEN EXTRACT(
                EPOCH FROM (
                  "acceptedAt" -
                  "createdAt"
                )
              )
            END AS acceptance_seconds,

            CASE
              WHEN "acceptedAt" IS NOT NULL
                AND "readyAt" IS NOT NULL
              THEN EXTRACT(
                EPOCH FROM (
                  "readyAt" -
                  "acceptedAt"
                )
              )
            END AS kitchen_seconds,

            CASE
              WHEN "status" = 'COMPLETED'
                AND "readyAt" IS NOT NULL
                AND "completedAt" IS NOT NULL
              THEN EXTRACT(
                EPOCH FROM (
                  "completedAt" -
                  "readyAt"
                )
              )
            END AS waiter_seconds,

            CASE
              WHEN "status" = 'COMPLETED'
                AND "createdAt" IS NOT NULL
                AND "completedAt" IS NOT NULL
              THEN EXTRACT(
                EPOCH FROM (
                  "completedAt" -
                  "createdAt"
                )
              )
            END AS total_seconds

          FROM "Order"

          WHERE "restaurantId" =
            ${params.restaurantId}

            AND "createdAt" >= ${from}
            AND "createdAt" < ${to}

            AND "status" NOT IN (
              'PENDING_PAYMENT',
              'PAYMENT_FAILED'
            )
        )

        SELECT

          COUNT(*) FILTER (
            WHERE acceptance_seconds IS NOT NULL
          )::int AS "acceptanceTotal",

          COUNT(*) FILTER (
            WHERE
              acceptance_seconds IS NOT NULL
              AND acceptance_seconds <= ${acceptanceSla}
          )::int AS "acceptanceWithin",

          COUNT(*) FILTER (
            WHERE kitchen_seconds IS NOT NULL
          )::int AS "kitchenTotal",

          COUNT(*) FILTER (
            WHERE
              kitchen_seconds IS NOT NULL
              AND kitchen_seconds <= ${kitchenSla}
          )::int AS "kitchenWithin",

          COUNT(*) FILTER (
            WHERE waiter_seconds IS NOT NULL
          )::int AS "waiterTotal",

          COUNT(*) FILTER (
            WHERE
              waiter_seconds IS NOT NULL
              AND waiter_seconds <= ${waiterSla}
          )::int AS "waiterWithin",

          COUNT(*) FILTER (
            WHERE total_seconds IS NOT NULL
          )::int AS "totalTotal",

          COUNT(*) FILTER (
            WHERE
              total_seconds IS NOT NULL
              AND total_seconds <= ${totalSla}
          )::int AS "totalWithin"

        FROM durations
      `;

    if (!row) {
      throw new Error(
        'Could not calculate SLA'
      );
    }

    const acceptanceTotal =
      Number(row.acceptanceTotal ?? 0);

    const acceptanceWithin =
      Number(row.acceptanceWithin ?? 0);

    const kitchenTotal =
      Number(row.kitchenTotal ?? 0);

    const kitchenWithin =
      Number(row.kitchenWithin ?? 0);

    const waiterTotal =
      Number(row.waiterTotal ?? 0);

    const waiterWithin =
      Number(row.waiterWithin ?? 0);

    const totalTotal =
      Number(row.totalTotal ?? 0);

    const totalWithin =
      Number(row.totalWithin ?? 0);

    return NextResponse.json({
      range: {
        key: range,
        timezone:
          restaurant.timezone,
        currency:
          restaurant.currency,
        from: from.toISOString(),
        to: to.toISOString(),
        localFrom,
        localToExclusive,
      },

      targets: {
        acceptanceSlaSeconds:
          acceptanceSla,
        kitchenSlaSeconds:
          kitchenSla,
        waiterSlaSeconds:
          waiterSla,
        totalServiceSlaSeconds:
          totalSla,
      },

      acceptance: {
        totalOrders:
          acceptanceTotal,
        withinSla:
          acceptanceWithin,
        breaches:
          acceptanceTotal -
          acceptanceWithin,
        compliancePct:
          percent(
            acceptanceWithin,
            acceptanceTotal
          ),
      },

      kitchen: {
        totalOrders:
          kitchenTotal,
        withinSla:
          kitchenWithin,
        breaches:
          kitchenTotal -
          kitchenWithin,
        compliancePct:
          percent(
            kitchenWithin,
            kitchenTotal
          ),
      },

      waiter: {
        totalOrders:
          waiterTotal,
        withinSla:
          waiterWithin,
        breaches:
          waiterTotal -
          waiterWithin,
        compliancePct:
          percent(
            waiterWithin,
            waiterTotal
          ),
      },

      totalService: {
        totalOrders:
          totalTotal,
        withinSla:
          totalWithin,
        breaches:
          totalTotal -
          totalWithin,
        compliancePct:
          percent(
            totalWithin,
            totalTotal
          ),
      },

      sampleWarning:
        acceptanceTotal < 5 ||
        kitchenTotal < 5 ||
        waiterTotal < 5 ||
        totalTotal < 5
          ? 'Some SLA metrics have fewer than 5 observations and may be statistically unreliable.'
          : null,
    });
  } catch (err) {
    console.error(
      'Analytics SLA error:',
      err
    );

    return errorResponse(err);
  }
}