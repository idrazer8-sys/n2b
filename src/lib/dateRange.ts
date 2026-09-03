import 'server-only';

// Timezone-aware period resolution, shared by the Financial History page.
// Boundaries are computed in the restaurant's own timezone (not the
// server's or the browser's) so "Today" means the restaurant's calendar
// day — critical for a report a manager will reconcile against a physical
// cash drawer at closing time.

export type FinanceRangeKey = 'today' | 'week' | 'month' | 'year' | 'custom';

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
  // A fixed-point iteration: the offset itself depends on the date (DST),
  // so re-derive it against our current guess a couple of times until it
  // stops moving.
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

export class DateRangeError extends Error {}

export function resolveFinanceRange(
  searchParams: URLSearchParams,
  timezone: string
): {
  rangeKey: FinanceRangeKey;
  from: Date;
  to: Date;
  localFrom: string;
  localToExclusive: string;
  timezone: string;
} {
  const rangeKey = (searchParams.get('range') ?? 'today') as FinanceRangeKey;
  const now = new Date();
  const today = getLocalDateString(now, timezone);

  let localFrom: string;
  let localToExclusive: string;

  switch (rangeKey) {
    case 'today':
      localFrom = today;
      localToExclusive = addLocalDays(today, 1);
      break;

    case 'week': {
      // Monday-start calendar week, matching Spain/EU convention.
      const [year, month, day] = today.split('-').map(Number);
      const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay(); // 0=Sun..6=Sat
      const daysSinceMonday = weekday === 0 ? 6 : weekday - 1;
      localFrom = addLocalDays(today, -daysSinceMonday);
      localToExclusive = addLocalDays(localFrom, 7);
      break;
    }

    case 'month': {
      const [year, month] = today.split('-').map(Number);
      localFrom = `${year}-${String(month).padStart(2, '0')}-01`;
      localToExclusive = addLocalMonths(localFrom, 1);
      break;
    }

    case 'year': {
      const [year] = today.split('-').map(Number);
      localFrom = `${year}-01-01`;
      localToExclusive = `${year + 1}-01-01`;
      break;
    }

    case 'custom': {
      const fromParam = searchParams.get('from');
      const toParam = searchParams.get('to');

      if (!fromParam || !toParam) {
        throw new DateRangeError('Custom range requires from and to');
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(fromParam) || !/^\d{4}-\d{2}-\d{2}$/.test(toParam)) {
        throw new DateRangeError('Custom range must use YYYY-MM-DD');
      }

      localFrom = fromParam;
      localToExclusive = addLocalDays(toParam, 1);
      break;
    }

    default:
      throw new DateRangeError('Unsupported range');
  }

  return {
    rangeKey,
    from: localMidnightToUtc(localFrom, timezone),
    to: localMidnightToUtc(localToExclusive, timezone),
    localFrom,
    localToExclusive,
    timezone,
  };
}
