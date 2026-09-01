import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/lib/db';
import { requireRestaurantAccess } from '@/src/lib/auth';
import { errorResponse } from '@/src/lib/api-response';

type RangeKey = 'today' | '7d' | '30d' | 'month' | 'custom';

type TableRow = {
  tableId: string;
  label: string;
  isActive: boolean;
  orderCount: number;
  revenueCents: bigint;
};

function getLocalDateString(date: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${values.year}-${values.month}-${values.day}`;
}

function getTimezoneOffsetMinutes(date: Date, timezone: string): number {
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

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  const localAsUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second)
  );

  return Math.round((localAsUtc - date.getTime()) / 60000);
}

function localMidnightToUtc(localDate: string, timezone: string): Date {
  const [year, month, day] = localDate.split('-').map(Number);
  const localAsUtc = Date.UTC(year, month - 1, day, 0, 0, 0, 0);

  let result = new Date(localAsUtc);

  for (let i = 0; i < 3; i += 1) {
    const offset = getTimezoneOffsetMinutes(result, timezone);
    result = new Date(localAsUtc - offset * 60 * 1000);
  }

  return result;
}

function addLocalDays(localDate: string, days: number): string {
  const [year, month, day] = localDate.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function addLocalMonths(localDate: string, months: number): string {
  const [year, month, day] = localDate.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCMonth(date.getUTCMonth() + months);
  return date.toISOString().slice(0, 10);
}

function resolveRange(searchParams: URLSearchParams, timezone: string) {
  const requestedRange = searchParams.get('range') ?? '30d';
  const range = requestedRange as RangeKey;
  const now = new Date();
  const today = getLocalDateString(now, timezone);

  let localFrom: string;
  let localToExclusive: string;

  switch (range) {
    case 'today':
      localFrom = today;
      localToExclusive = addLocalDays(today, 1);
      break;

    case '7d':
      localFrom = addLocalDays(today, -6);
      localToExclusive = addLocalDays(today, 1);
      break;

    case '30d':
      localFrom = addLocalDays(today, -29);
      localToExclusive = addLocalDays(today, 1);
      break;

    case 'month': {
      const [year, month] = today.split('-').map(Number);
      localFrom = `${year}-${String(month).padStart(2, '0')}-01`;
      localToExclusive = addLocalMonths(localFrom, 1);
      break;
    }

    case 'custom': {
      const fromParam = searchParams.get('from');
      const toParam = searchParams.get('to');

      if (!fromParam || !toParam) {
        throw new Error('Custom range requires from and to');
      }

      if (
        !/^\d{4}-\d{2}-\d{2}$/.test(fromParam) ||
        !/^\d{4}-\d{2}-\d{2}$/.test(toParam)
      ) {
        throw new Error('Custom range must use YYYY-MM-DD');
      }

      localFrom = fromParam;
      localToExclusive = addLocalDays(toParam, 1);
      break;
    }

    default:
      throw new Error('Unsupported analytics range');
  }

  return {
    range,
    from: localMidnightToUtc(localFrom, timezone),
    to: localMidnightToUtc(localToExclusive, timezone),
    localFrom,
    localToExclusive,
  };
}

function serializeBigInt(value: unknown): unknown {
  if (typeof value === 'bigint') return Number(value);
  if (Array.isArray(value)) return value.map(serializeBigInt);
  if (value instanceof Date) return value.toISOString();

  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [key, serializeBigInt(nested)])
    );
  }

  return value;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { restaurantId: string } }
) {
  try {
    const access = await requireRestaurantAccess(params.restaurantId, 'MANAGER');

    if (!access.ok) {
      return NextResponse.json({ error: access.message }, { status: access.status });
    }

    const restaurant = await db.restaurant.findUnique({
      where: { id: params.restaurantId },
      select: { id: true, timezone: true, currency: true },
    });

    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    const { range, from, to, localFrom, localToExclusive } = resolveRange(
      req.nextUrl.searchParams,
      restaurant.timezone
    );

    const rows = await db.$queryRaw<TableRow[]>`
      SELECT
        tb.id AS "tableId",
        tb.label,
        tb."isActive",
        COUNT(o.id)::int AS "orderCount",
        COALESCE(SUM(o."totalCents"), 0)::bigint AS "revenueCents"

      FROM "Table" tb

      LEFT JOIN "Order" o
        ON o."tableId" = tb.id
        AND o.status = 'COMPLETED'
        AND o."createdAt" >= ${from}
        AND o."createdAt" < ${to}

      WHERE tb."restaurantId" = ${params.restaurantId}

      GROUP BY tb.id, tb.label, tb."isActive"
      ORDER BY "orderCount" DESC, tb.label ASC
    `;

    const safeRows = serializeBigInt(rows) as Array<{
      tableId: string;
      label: string;
      isActive: boolean;
      orderCount: number;
      revenueCents: number;
    }>;

    const totalOrders = safeRows.reduce((sum, row) => sum + row.orderCount, 0);
    const totalRevenueCents = safeRows.reduce((sum, row) => sum + row.revenueCents, 0);
    const busiestTable = safeRows.length > 0 ? safeRows[0] : null;

    return NextResponse.json({
      range: {
        key: range,
        timezone: restaurant.timezone,
        currency: restaurant.currency,
        from: from.toISOString(),
        to: to.toISOString(),
        localFrom,
        localToExclusive,
      },

      tables: safeRows,
      totalOrders,
      totalRevenueCents,
      busiestTable,
    });
  } catch (err) {
    console.error('Analytics tables error:', err);
    return errorResponse(err);
  }
}
