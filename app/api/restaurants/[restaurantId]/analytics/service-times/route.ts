import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/lib/db';
import { requireRestaurantAccess } from '@/src/lib/auth';
import { errorResponse } from '@/src/lib/api-response';

type ServiceTimeStats = {
  n: number;
  avgSeconds: number | null;
  p50Seconds: number | null;
  p75Seconds: number | null;
  p90Seconds: number | null;
  p95Seconds: number | null;
  minSeconds: number | null;
  maxSeconds: number | null;
};

type ServiceTimeRow = {
  createdToAcceptedN: number;
  createdToAcceptedAvg: number | null;
  createdToAcceptedP50: number | null;
  createdToAcceptedP75: number | null;
  createdToAcceptedP90: number | null;
  createdToAcceptedP95: number | null;
  createdToAcceptedMin: number | null;
  createdToAcceptedMax: number | null;

  acceptedToPreparingN: number;
  acceptedToPreparingAvg: number | null;
  acceptedToPreparingP50: number | null;
  acceptedToPreparingP75: number | null;
  acceptedToPreparingP90: number | null;
  acceptedToPreparingP95: number | null;
  acceptedToPreparingMin: number | null;
  acceptedToPreparingMax: number | null;

  acceptedToReadyN: number;
  acceptedToReadyAvg: number | null;
  acceptedToReadyP50: number | null;
  acceptedToReadyP75: number | null;
  acceptedToReadyP90: number | null;
  acceptedToReadyP95: number | null;
  acceptedToReadyMin: number | null;
  acceptedToReadyMax: number | null;

  preparingToReadyN: number;
  preparingToReadyAvg: number | null;
  preparingToReadyP50: number | null;
  preparingToReadyP75: number | null;
  preparingToReadyP90: number | null;
  preparingToReadyP95: number | null;
  preparingToReadyMin: number | null;
  preparingToReadyMax: number | null;

  readyToCompletedN: number;
  readyToCompletedAvg: number | null;
  readyToCompletedP50: number | null;
  readyToCompletedP75: number | null;
  readyToCompletedP90: number | null;
  readyToCompletedP95: number | null;
  readyToCompletedMin: number | null;
  readyToCompletedMax: number | null;

  createdToCompletedN: number;
  createdToCompletedAvg: number | null;
  createdToCompletedP50: number | null;
  createdToCompletedP75: number | null;
  createdToCompletedP90: number | null;
  createdToCompletedP95: number | null;
  createdToCompletedMin: number | null;
  createdToCompletedMax: number | null;
};

function getLocalDateString(
  date: Date,
  timezone: string
): string {
  const parts =
    new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);

  const values = Object.fromEntries(
    parts.map((part) => [
      part.type,
      part.value,
    ])
  );

  return `${values.year}-${values.month}-${values.day}`;
}

function getTimezoneOffsetMinutes(
  date: Date,
  timezone: string
): number {
  const parts =
    new Intl.DateTimeFormat('en-US', {
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
    parts.map((part) => [
      part.type,
      part.value,
    ])
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
    Date.UTC(
      year,
      month - 1,
      day
    )
  );

  date.setUTCDate(
    date.getUTCDate() + days
  );

  return date
    .toISOString()
    .slice(0, 10);
}

function resolveRange(
  searchParams: URLSearchParams,
  timezone: string
) {
  const range =
    searchParams.get('range') ??
    'today';

  const now = new Date();

  const today =
    getLocalDateString(
      now,
      timezone
    );

  let localFrom = today;

  let localToExclusive =
    addLocalDays(
      today,
      1
    );

  if (range === '7d') {
    localFrom =
      addLocalDays(
        today,
        -6
      );
  } else if (range === '30d') {
    localFrom =
      addLocalDays(
        today,
        -29
      );
  } else if (range === 'custom') {
    const fromParam =
      searchParams.get('from');

    const toParam =
      searchParams.get('to');

    if (
      !fromParam ||
      !toParam
    ) {
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
  } else if (
    range !== 'today'
  ) {
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

function roundSeconds(
  value: number | null
): number | null {
  return value === null
    ? null
    : Math.round(value);
}

function stage(
  n: number,
  avg: number | null,
  p50: number | null,
  p75: number | null,
  p90: number | null,
  p95: number | null,
  min: number | null,
  max: number | null
): ServiceTimeStats {
  return {
    n,
    avgSeconds:
      roundSeconds(avg),
    p50Seconds:
      roundSeconds(p50),
    p75Seconds:
      roundSeconds(p75),
    p90Seconds:
      roundSeconds(p90),
    p95Seconds:
      roundSeconds(p95),
    minSeconds:
      roundSeconds(min),
    maxSeconds:
      roundSeconds(max),
  };
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
          error:
            access.message,
        },
        {
          status:
            access.status,
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
        },
      });

    if (!restaurant) {
      return NextResponse.json(
        {
          error:
            'Restaurant not found',
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

    const [row] =
      await db.$queryRaw<ServiceTimeRow[]>`
        WITH durations AS (
          SELECT
            id,
            status,

            CASE
              WHEN "acceptedAt" IS NOT NULL
                AND "createdAt" IS NOT NULL
              THEN EXTRACT(
                EPOCH FROM (
                  "acceptedAt" -
                  "createdAt"
                )
              )
            END AS created_to_accepted,

            CASE
              WHEN "acceptedAt" IS NOT NULL
                AND "preparingAt" IS NOT NULL
              THEN EXTRACT(
                EPOCH FROM (
                  "preparingAt" -
                  "acceptedAt"
                )
              )
            END AS accepted_to_preparing,

            CASE
              WHEN "acceptedAt" IS NOT NULL
                AND "readyAt" IS NOT NULL
              THEN EXTRACT(
                EPOCH FROM (
                  "readyAt" -
                  "acceptedAt"
                )
              )
            END AS accepted_to_ready,

            CASE
              WHEN "preparingAt" IS NOT NULL
                AND "readyAt" IS NOT NULL
              THEN EXTRACT(
                EPOCH FROM (
                  "readyAt" -
                  "preparingAt"
                )
              )
            END AS preparing_to_ready,

            CASE
              WHEN status = 'COMPLETED'
                AND "readyAt" IS NOT NULL
                AND "completedAt" IS NOT NULL
              THEN EXTRACT(
                EPOCH FROM (
                  "completedAt" -
                  "readyAt"
                )
              )
            END AS ready_to_completed,

            CASE
              WHEN status = 'COMPLETED'
                AND "createdAt" IS NOT NULL
                AND "completedAt" IS NOT NULL
              THEN EXTRACT(
                EPOCH FROM (
                  "completedAt" -
                  "createdAt"
                )
              )
            END AS created_to_completed

          FROM "Order"

          WHERE "restaurantId" =
            ${params.restaurantId}

            AND "createdAt" >= ${from}

            AND "createdAt" < ${to}

            AND status NOT IN (
              'PENDING_PAYMENT',
              'PAYMENT_FAILED'
            )
        )

        SELECT

          COUNT(*) FILTER (
            WHERE created_to_accepted >= 0
          )::int
            AS "createdToAcceptedN",

          AVG(created_to_accepted)
            FILTER (
              WHERE created_to_accepted >= 0
            )
            AS "createdToAcceptedAvg",

          PERCENTILE_CONT(0.50)
            WITHIN GROUP (
              ORDER BY created_to_accepted
            )
            FILTER (
              WHERE created_to_accepted >= 0
            )
            AS "createdToAcceptedP50",

          PERCENTILE_CONT(0.75)
            WITHIN GROUP (
              ORDER BY created_to_accepted
            )
            FILTER (
              WHERE created_to_accepted >= 0
            )
            AS "createdToAcceptedP75",

          PERCENTILE_CONT(0.90)
            WITHIN GROUP (
              ORDER BY created_to_accepted
            )
            FILTER (
              WHERE created_to_accepted >= 0
            )
            AS "createdToAcceptedP90",

          PERCENTILE_CONT(0.95)
            WITHIN GROUP (
              ORDER BY created_to_accepted
            )
            FILTER (
              WHERE created_to_accepted >= 0
            )
            AS "createdToAcceptedP95",

          MIN(created_to_accepted)
            FILTER (
              WHERE created_to_accepted >= 0
            )
            AS "createdToAcceptedMin",

          MAX(created_to_accepted)
            FILTER (
              WHERE created_to_accepted >= 0
            )
            AS "createdToAcceptedMax",

          COUNT(*) FILTER (
            WHERE accepted_to_preparing >= 0
          )::int
            AS "acceptedToPreparingN",

          AVG(accepted_to_preparing)
            FILTER (
              WHERE accepted_to_preparing >= 0
            )
            AS "acceptedToPreparingAvg",

          PERCENTILE_CONT(0.50)
            WITHIN GROUP (
              ORDER BY accepted_to_preparing
            )
            FILTER (
              WHERE accepted_to_preparing >= 0
            )
            AS "acceptedToPreparingP50",

          PERCENTILE_CONT(0.75)
            WITHIN GROUP (
              ORDER BY accepted_to_preparing
            )
            FILTER (
              WHERE accepted_to_preparing >= 0
            )
            AS "acceptedToPreparingP75",

          PERCENTILE_CONT(0.90)
            WITHIN GROUP (
              ORDER BY accepted_to_preparing
            )
            FILTER (
              WHERE accepted_to_preparing >= 0
            )
            AS "acceptedToPreparingP90",

          PERCENTILE_CONT(0.95)
            WITHIN GROUP (
              ORDER BY accepted_to_preparing
            )
            FILTER (
              WHERE accepted_to_preparing >= 0
            )
            AS "acceptedToPreparingP95",

          MIN(accepted_to_preparing)
            FILTER (
              WHERE accepted_to_preparing >= 0
            )
            AS "acceptedToPreparingMin",

          MAX(accepted_to_preparing)
            FILTER (
              WHERE accepted_to_preparing >= 0
            )
            AS "acceptedToPreparingMax",

          COUNT(*) FILTER (
            WHERE accepted_to_ready >= 0
          )::int
            AS "acceptedToReadyN",

          AVG(accepted_to_ready)
            FILTER (
              WHERE accepted_to_ready >= 0
            )
            AS "acceptedToReadyAvg",

          PERCENTILE_CONT(0.50)
            WITHIN GROUP (
              ORDER BY accepted_to_ready
            )
            FILTER (
              WHERE accepted_to_ready >= 0
            )
            AS "acceptedToReadyP50",

          PERCENTILE_CONT(0.75)
            WITHIN GROUP (
              ORDER BY accepted_to_ready
            )
            FILTER (
              WHERE accepted_to_ready >= 0
            )
            AS "acceptedToReadyP75",

          PERCENTILE_CONT(0.90)
            WITHIN GROUP (
              ORDER BY accepted_to_ready
            )
            FILTER (
              WHERE accepted_to_ready >= 0
            )
            AS "acceptedToReadyP90",

          PERCENTILE_CONT(0.95)
            WITHIN GROUP (
              ORDER BY accepted_to_ready
            )
            FILTER (
              WHERE accepted_to_ready >= 0
            )
            AS "acceptedToReadyP95",

          MIN(accepted_to_ready)
            FILTER (
              WHERE accepted_to_ready >= 0
            )
            AS "acceptedToReadyMin",

          MAX(accepted_to_ready)
            FILTER (
              WHERE accepted_to_ready >= 0
            )
            AS "acceptedToReadyMax",

          COUNT(*) FILTER (
            WHERE preparing_to_ready >= 0
          )::int
            AS "preparingToReadyN",

          AVG(preparing_to_ready)
            FILTER (
              WHERE preparing_to_ready >= 0
            )
            AS "preparingToReadyAvg",

          PERCENTILE_CONT(0.50)
            WITHIN GROUP (
              ORDER BY preparing_to_ready
            )
            FILTER (
              WHERE preparing_to_ready >= 0
            )
            AS "preparingToReadyP50",

          PERCENTILE_CONT(0.75)
            WITHIN GROUP (
              ORDER BY preparing_to_ready
            )
            FILTER (
              WHERE preparing_to_ready >= 0
            )
            AS "preparingToReadyP75",

          PERCENTILE_CONT(0.90)
            WITHIN GROUP (
              ORDER BY preparing_to_ready
            )
            FILTER (
              WHERE preparing_to_ready >= 0
            )
            AS "preparingToReadyP90",

          PERCENTILE_CONT(0.95)
            WITHIN GROUP (
              ORDER BY preparing_to_ready
            )
            FILTER (
              WHERE preparing_to_ready >= 0
            )
            AS "preparingToReadyP95",

          MIN(preparing_to_ready)
            FILTER (
              WHERE preparing_to_ready >= 0
            )
            AS "preparingToReadyMin",

          MAX(preparing_to_ready)
            FILTER (
              WHERE preparing_to_ready >= 0
            )
            AS "preparingToReadyMax",

          COUNT(*) FILTER (
            WHERE
              status = 'COMPLETED'
              AND ready_to_completed >= 0
          )::int
            AS "readyToCompletedN",

          AVG(ready_to_completed)
            FILTER (
              WHERE
                status = 'COMPLETED'
                AND ready_to_completed >= 0
            )
            AS "readyToCompletedAvg",

          PERCENTILE_CONT(0.50)
            WITHIN GROUP (
              ORDER BY ready_to_completed
            )
            FILTER (
              WHERE
                status = 'COMPLETED'
                AND ready_to_completed >= 0
            )
            AS "readyToCompletedP50",

          PERCENTILE_CONT(0.75)
            WITHIN GROUP (
              ORDER BY ready_to_completed
            )
            FILTER (
              WHERE
                status = 'COMPLETED'
                AND ready_to_completed >= 0
            )
            AS "readyToCompletedP75",

          PERCENTILE_CONT(0.90)
            WITHIN GROUP (
              ORDER BY ready_to_completed
            )
            FILTER (
              WHERE
                status = 'COMPLETED'
                AND ready_to_completed >= 0
            )
            AS "readyToCompletedP90",

          PERCENTILE_CONT(0.95)
            WITHIN GROUP (
              ORDER BY ready_to_completed
            )
            FILTER (
              WHERE
                status = 'COMPLETED'
                AND ready_to_completed >= 0
            )
            AS "readyToCompletedP95",

          MIN(ready_to_completed)
            FILTER (
              WHERE
                status = 'COMPLETED'
                AND ready_to_completed >= 0
            )
            AS "readyToCompletedMin",

          MAX(ready_to_completed)
            FILTER (
              WHERE
                status = 'COMPLETED'
                AND ready_to_completed >= 0
            )
            AS "readyToCompletedMax",

          COUNT(*) FILTER (
            WHERE
              status = 'COMPLETED'
              AND created_to_completed >= 0
          )::int
            AS "createdToCompletedN",

          AVG(created_to_completed)
            FILTER (
              WHERE
                status = 'COMPLETED'
                AND created_to_completed >= 0
            )
            AS "createdToCompletedAvg",

          PERCENTILE_CONT(0.50)
            WITHIN GROUP (
              ORDER BY created_to_completed
            )
            FILTER (
              WHERE
                status = 'COMPLETED'
                AND created_to_completed >= 0
            )
            AS "createdToCompletedP50",

          PERCENTILE_CONT(0.75)
            WITHIN GROUP (
              ORDER BY created_to_completed
            )
            FILTER (
              WHERE
                status = 'COMPLETED'
                AND created_to_completed >= 0
            )
            AS "createdToCompletedP75",

          PERCENTILE_CONT(0.90)
            WITHIN GROUP (
              ORDER BY created_to_completed
            )
            FILTER (
              WHERE
                status = 'COMPLETED'
                AND created_to_completed >= 0
            )
            AS "createdToCompletedP90",

          PERCENTILE_CONT(0.95)
            WITHIN GROUP (
              ORDER BY created_to_completed
            )
            FILTER (
              WHERE
                status = 'COMPLETED'
                AND created_to_completed >= 0
            )
            AS "createdToCompletedP95",

          MIN(created_to_completed)
            FILTER (
              WHERE
                status = 'COMPLETED'
                AND created_to_completed >= 0
            )
            AS "createdToCompletedMin",

          MAX(created_to_completed)
            FILTER (
              WHERE
                status = 'COMPLETED'
                AND created_to_completed >= 0
            )
            AS "createdToCompletedMax"

        FROM durations
      `;

    if (!row) {
      throw new Error(
        'Could not calculate service times'
      );
    }

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

      stages: {
        createdToAccepted: stage(
          row.createdToAcceptedN,
          row.createdToAcceptedAvg,
          row.createdToAcceptedP50,
          row.createdToAcceptedP75,
          row.createdToAcceptedP90,
          row.createdToAcceptedP95,
          row.createdToAcceptedMin,
          row.createdToAcceptedMax
        ),

        acceptedToPreparing: stage(
          row.acceptedToPreparingN,
          row.acceptedToPreparingAvg,
          row.acceptedToPreparingP50,
          row.acceptedToPreparingP75,
          row.acceptedToPreparingP90,
          row.acceptedToPreparingP95,
          row.acceptedToPreparingMin,
          row.acceptedToPreparingMax
        ),

        acceptedToReady: stage(
          row.acceptedToReadyN,
          row.acceptedToReadyAvg,
          row.acceptedToReadyP50,
          row.acceptedToReadyP75,
          row.acceptedToReadyP90,
          row.acceptedToReadyP95,
          row.acceptedToReadyMin,
          row.acceptedToReadyMax
        ),

        preparingToReady: stage(
          row.preparingToReadyN,
          row.preparingToReadyAvg,
          row.preparingToReadyP50,
          row.preparingToReadyP75,
          row.preparingToReadyP90,
          row.preparingToReadyP95,
          row.preparingToReadyMin,
          row.preparingToReadyMax
        ),

        readyToCompleted: stage(
          row.readyToCompletedN,
          row.readyToCompletedAvg,
          row.readyToCompletedP50,
          row.readyToCompletedP75,
          row.readyToCompletedP90,
          row.readyToCompletedP95,
          row.readyToCompletedMin,
          row.readyToCompletedMax
        ),

        createdToCompleted: stage(
          row.createdToCompletedN,
          row.createdToCompletedAvg,
          row.createdToCompletedP50,
          row.createdToCompletedP75,
          row.createdToCompletedP90,
          row.createdToCompletedP95,
          row.createdToCompletedMin,
          row.createdToCompletedMax
        ),
      },
    });
  } catch (err) {
    console.error(
      'Analytics service-times error:',
      err
    );

    return errorResponse(err);
  }
}