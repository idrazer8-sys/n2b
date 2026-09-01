'use client';

import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '@/src/lib/i18n/I18nProvider';

type AnalyticsData = {
  range: {
    key: string;
    timezone: string;
    currency: string;
    localFrom: string;
    localToExclusive: string;
  };

  kpis: {
    revenueCents: number;
    orderCount: number;
    sessionCount: number;
    averageOrderCents: number;
    averageServiceSeconds: number;
  };

  revenueByDay: Array<{
    date: string;
    revenueCents: number;
    orderCount: number;
  }>;

  ordersByHour: Array<{
    hour: number;
    orderCount: number;
    revenueCents: number;
  }>;

  ordersByDayOfWeek: Array<{
    dayOfWeek: number;
    orderCount: number;
    revenueCents: number;
  }>;

  categories: Array<{
    categoryId: string;
    name: string;
    revenueCents: number;
    quantitySold: number;
  }>;

  topProducts: Array<{
    menuItemId: string;
    name: string;
    quantitySold: number;
    revenueCents: number;
  }>;

  busiestHour: number | null;
  quietestHour: number | null;

  dessert: {
    sessionCount: number;
    dessertSessions: number;
    conversionPct: number;
  };
};

type ServiceStage = {
  n: number;
  avgSeconds: number | null;
  p50Seconds: number | null;
  p75Seconds: number | null;
  p90Seconds: number | null;
  p95Seconds: number | null;
  minSeconds: number | null;
  maxSeconds: number | null;
};

type ServiceTimesData = {
  range: {
    key: string;
    timezone: string;
    currency: string;
    localFrom: string;
    localToExclusive: string;
  };

  stages: {
    createdToAccepted: ServiceStage;
    acceptedToPreparing: ServiceStage;
    acceptedToReady: ServiceStage;
    preparingToReady: ServiceStage;
    readyToCompleted: ServiceStage;
    createdToCompleted: ServiceStage;
  };
};

type SlaMetric = {
  totalOrders: number;
  withinSla: number;
  breaches: number;
  compliancePct: number | null;
};

type SlaData = {
  range: {
    key: string;
    timezone: string;
    currency: string;
    from: string;
    to: string;
    localFrom: string;
    localToExclusive: string;
  };

  targets: {
    acceptanceSlaSeconds: number;
    kitchenSlaSeconds: number;
    waiterSlaSeconds: number;
    totalServiceSlaSeconds: number;
  };

  acceptance: SlaMetric;
  kitchen: SlaMetric;
  waiter: SlaMetric;
  totalService: SlaMetric;

  sampleWarning: string | null;
};

type TableHistoryRow = {
  tableId: string;
  label: string;
  isActive: boolean;
  orderCount: number;
  revenueCents: number;
};

type TablesData = {
  range: {
    key: string;
    timezone: string;
    currency: string;
    localFrom: string;
    localToExclusive: string;
  };

  tables: TableHistoryRow[];
  totalOrders: number;
  totalRevenueCents: number;
  busiestTable: TableHistoryRow | null;
};

type LiveReadyOrder = {
  id: string;
  orderNumber: number;
  tableId: string;
  tableLabel: string;
  readyAt: string;
  waitingSeconds: number;
  severity: 'NORMAL' | 'WARNING' | 'CRITICAL';
};

type LiveData = {
  restaurantTimezone: string;
  generatedAt: string;

  kitchen: {
    status: 'HEALTHY' | 'BUSY' | 'CRITICAL';
    backlog: number;
  };

  readyWaiting: {
    count: number;
    criticalCount: number;
    warningCount: number;
    orders: LiveReadyOrder[];
  };
};

const rangeOptions = [
  { key: 'today' },
  { key: '7d' },
  { key: '30d' },
  { key: 'month' },
];

const stageLabels = [
  { key: 'createdToAccepted' as const },
  { key: 'acceptedToPreparing' as const },
  { key: 'preparingToReady' as const },
  { key: 'readyToCompleted' as const },
  { key: 'createdToCompleted' as const },
];

function formatMoney(
  cents: number,
  currency: string
) {
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency,
  }).format(cents / 100);
}

function formatDuration(
  seconds: number | null
) {
  if (
    seconds === null ||
    !Number.isFinite(seconds)
  ) {
    return '—';
  }

  const rounded = Math.max(
    0,
    Math.round(seconds)
  );

  const mins = Math.floor(
    rounded / 60
  );

  const secs = rounded % 60;

  if (mins === 0) {
    return `${secs}s`;
  }

  return `${mins}m ${secs}s`;
}

function formatHour(
  hour: number | null
) {
  if (hour === null) {
    return '—';
  }

  return `${String(hour).padStart(2, '0')}:00`;
}

function formatWaiting(
  seconds: number
) {
  return formatDuration(seconds);
}

function dayName(
  day: number,
  t: (key: string, vars?: Record<string, string | number>) => string
) {
  if (day < 1 || day > 7) {
    return '';
  }

  return t(`analytics.day.${day}`);
}

function severityClass(
  severity: LiveReadyOrder['severity']
) {
  if (severity === 'CRITICAL') {
    return 'border-red-300 bg-red-50 text-red-800';
  }

  if (severity === 'WARNING') {
    return 'border-amber-300 bg-amber-50 text-amber-800';
  }

  return 'border-line bg-white text-ink';
}

function kitchenStatusClass(
  status: LiveData['kitchen']['status']
) {
  if (status === 'CRITICAL') {
    return 'border-red-300 bg-red-50 text-red-800';
  }

  if (status === 'BUSY') {
    return 'border-amber-300 bg-amber-50 text-amber-800';
  }

  return 'border-emerald-300 bg-emerald-50 text-emerald-800';
}

function formatCompliance(
  value: number | null | undefined
) {
  if (
    value === null ||
    value === undefined
  ) {
    return '—';
  }

  return `${value}%`;
}

export default function AnalyticsPage({
  params,
}: {
  params: {
    restaurantId: string;
  };
}) {
  const { t } = useI18n();

  const [range, setRange] =
    useState('today');

  const [data, setData] =
    useState<AnalyticsData | null>(null);

  const [serviceTimes, setServiceTimes] =
    useState<ServiceTimesData | null>(null);

  const [sla, setSla] =
    useState<SlaData | null>(null);

  const [tablesData, setTablesData] =
    useState<TablesData | null>(null);

  const [live, setLive] =
    useState<LiveData | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [liveLoading, setLiveLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  const [lastLiveUpdate, setLastLiveUpdate] =
    useState<Date | null>(null);

  async function loadOverview(
    selectedRange: string
  ) {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/restaurants/${params.restaurantId}/analytics/overview?range=${selectedRange}`,
        {
          credentials: 'include',
          cache: 'no-store',
        }
      );

      const json =
        await response.json();

      if (!response.ok) {
        throw new Error(
          json.error ??
            t('analytics.error.loadAnalytics')
        );
      }

      setData(json);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('analytics.error.loadAnalytics')
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadServiceTimes(
    selectedRange: string
  ) {
    try {
      const response = await fetch(
        `/api/restaurants/${params.restaurantId}/analytics/service-times?range=${selectedRange}`,
        {
          credentials: 'include',
          cache: 'no-store',
        }
      );

      const json =
        await response.json();

      if (!response.ok) {
        throw new Error(
          json.error ??
            t('analytics.error.loadServiceTimes')
        );
      }

      setServiceTimes(json);
    } catch (err) {
      console.error(
        'Service times error:',
        err
      );
    }
  }

  async function loadSla(
    selectedRange: string
  ) {
    try {
      const response = await fetch(
        `/api/restaurants/${params.restaurantId}/analytics/sla?range=${selectedRange}`,
        {
          credentials: 'include',
          cache: 'no-store',
        }
      );

      const json =
        await response.json();

      if (!response.ok) {
        throw new Error(
          json.error ??
            t('analytics.error.loadSla')
        );
      }

      setSla(json);
    } catch (err) {
      console.error(
        'SLA analytics error:',
        err
      );
    }
  }

  async function loadTables(
    selectedRange: string
  ) {
    try {
      const response = await fetch(
        `/api/restaurants/${params.restaurantId}/analytics/tables?range=${selectedRange}`,
        {
          credentials: 'include',
          cache: 'no-store',
        }
      );

      const json =
        await response.json();

      if (!response.ok) {
        throw new Error(
          json.error ??
            t('analytics.error.loadTables')
        );
      }

      setTablesData(json);
    } catch (err) {
      console.error(
        'Table history error:',
        err
      );
    }
  }

  async function loadLive() {
    try {
      setLiveLoading(true);

      const response = await fetch(
        `/api/restaurants/${params.restaurantId}/analytics/live`,
        {
          credentials: 'include',
          cache: 'no-store',
        }
      );

      const json =
        await response.json();

      if (!response.ok) {
        throw new Error(
          json.error ??
            t('analytics.error.loadLive')
        );
      }

      setLive(json);
      setLastLiveUpdate(new Date());
    } catch (err) {
      console.error(
        'Live analytics error:',
        err
      );
    } finally {
      setLiveLoading(false);
    }
  }

  useEffect(() => {
    void loadOverview(range);
    void loadServiceTimes(range);
    void loadSla(range);
    void loadTables(range);
  }, [
    range,
    params.restaurantId,
  ]);

  useEffect(() => {
    void loadLive();

    const interval =
      window.setInterval(
        () => {
          void loadLive();
        },
        10_000
      );

    return () =>
      window.clearInterval(interval);
  }, [params.restaurantId]);

  const maxRevenue =
    useMemo(() => {
      if (!data?.revenueByDay.length) {
        return 1;
      }

      return Math.max(
        ...data.revenueByDay.map(
          (item) =>
            item.revenueCents
        ),
        1
      );
    }, [data]);

  const maxHourOrders =
    useMemo(() => {
      if (!data?.ordersByHour.length) {
        return 1;
      }

      return Math.max(
        ...data.ordersByHour.map(
          (item) =>
            item.orderCount
        ),
        1
      );
    }, [data]);

  const maxCategoryRevenue =
    useMemo(() => {
      if (!data?.categories.length) {
        return 1;
      }

      return Math.max(
        ...data.categories.map(
          (item) =>
            item.revenueCents
        ),
        1
      );
    }, [data]);

  const maxDayOrders =
    useMemo(() => {
      if (!data?.ordersByDayOfWeek.length) {
        return 1;
      }

      return Math.max(
        ...data.ordersByDayOfWeek.map(
          (item) => item.orderCount
        ),
        1
      );
    }, [data]);

  const maxTableOrders =
    useMemo(() => {
      if (!tablesData?.tables.length) {
        return 1;
      }

      return Math.max(
        ...tablesData.tables.map(
          (item) => item.orderCount
        ),
        1
      );
    }, [tablesData]);

  const p90TotalService =
    serviceTimes?.stages
      .createdToCompleted
      .p90Seconds ?? null;

  /*
   * IMPORTANT:
   *
   * Kitchen SLA is:
   * Accepted → Ready
   *
   * Therefore Kitchen P90 must use the
   * combined Accepted → Ready metric,
   * not Preparing → Ready.
   */
  const p90Kitchen =
    serviceTimes?.stages
      .acceptedToReady
      .p90Seconds ?? null;

  const p90Acceptance =
    serviceTimes?.stages
      .createdToAccepted
      .p90Seconds ?? null;

  const p90Waiter =
    serviceTimes?.stages
      .readyToCompleted
      .p90Seconds ?? null;

  const acceptanceSla =
    sla?.targets
      .acceptanceSlaSeconds ??
    300;

  const kitchenSla =
    sla?.targets
      .kitchenSlaSeconds ??
    600;

  const waiterSla =
    sla?.targets
      .waiterSlaSeconds ??
    180;

  const totalServiceSla =
    sla?.targets
      .totalServiceSlaSeconds ??
    900;

  const activeAlerts = useMemo(() => {
    const alerts: Array<{
      severity:
        | 'HIGH'
        | 'MEDIUM'
        | 'LOW';
      title: string;
      detail: string;
    }> = [];

    if (
      live?.kitchen.status ===
      'CRITICAL'
    ) {
      alerts.push({
        severity: 'HIGH',
        title:
          t('analytics.alert.kitchenCritical.title'),
        detail:
          t('analytics.alert.kitchenCritical.detail', {
            backlog: live.kitchen.backlog,
          }),
      });
    } else if (
      live?.kitchen.status === 'BUSY'
    ) {
      alerts.push({
        severity: 'MEDIUM',
        title:
          t('analytics.alert.kitchenBusy.title'),
        detail:
          t('analytics.alert.kitchenBusy.detail', {
            backlog: live.kitchen.backlog,
          }),
      });
    }

    if (
      live &&
      live.readyWaiting
        .criticalCount > 0
    ) {
      alerts.push({
        severity: 'HIGH',
        title:
          t('analytics.alert.readyWaitingCritical.title'),
        detail:
          t('analytics.alert.readyWaitingCritical.detail', {
            count: live.readyWaiting.criticalCount,
          }),
      });
    } else if (
      live &&
      live.readyWaiting
        .warningCount > 0
    ) {
      alerts.push({
        severity: 'MEDIUM',
        title:
          t('analytics.alert.readyWaitingWarning.title'),
        detail:
          t('analytics.alert.readyWaitingWarning.detail', {
            count: live.readyWaiting.warningCount,
          }),
      });
    }

    if (
      p90Acceptance !== null &&
      p90Acceptance >=
        acceptanceSla
    ) {
      alerts.push({
        severity: 'MEDIUM',
        title:
          t('analytics.alert.acceptanceSlaExceeded.title'),
        detail:
          t('analytics.alert.acceptanceSlaExceeded.detail', {
            p90: formatDuration(p90Acceptance),
            target: formatDuration(acceptanceSla),
          }),
      });
    }

    if (
      p90TotalService !== null &&
      p90TotalService >=
        totalServiceSla
    ) {
      alerts.push({
        severity: 'MEDIUM',
        title:
          t('analytics.alert.totalServiceSlaExceeded.title'),
        detail:
          t('analytics.alert.totalServiceSlaExceeded.detail', {
            p90: formatDuration(p90TotalService),
            target: formatDuration(totalServiceSla),
          }),
      });
    }

    if (alerts.length === 0) {
      alerts.push({
        severity: 'LOW',
        title:
          t('analytics.alert.none.title'),
        detail:
          t('analytics.alert.none.detail'),
      });
    }

    return alerts.slice(0, 5);
  }, [
    live,
    p90Acceptance,
    p90TotalService,
    acceptanceSla,
    totalServiceSla,
    t,
  ]);

  if (loading && !data) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-ink/50">
          {t('analytics.loading.analytics')}
        </p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-20 text-center">
        <p className="text-red-700">
          {error ??
            t('analytics.error.loadAnalytics')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">

      {/* HEADER */}

      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-ink/40">
            {t('analytics.header.eyebrow')}
          </p>

          <h1 className="font-display text-4xl mt-1">
            {t('analytics.header.title')}
          </h1>

          <p className="text-sm text-ink/50 mt-2">
            {t('analytics.header.subtitle')}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {rangeOptions.map(
            (option) => (
              <button
                key={option.key}
                type="button"
                onClick={() =>
                  setRange(
                    option.key
                  )
                }
                className={`px-3 py-2 text-xs border transition ${
                  range === option.key
                    ? 'border-ink bg-ink text-paper'
                    : 'border-line text-ink/60 hover:text-ink'
                }`}
              >
                {t(`analytics.range.${option.key}`)}
              </button>
            )
          )}
        </div>
      </div>

      {error && (
        <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* EXECUTIVE KPIS */}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">

        <div className="border border-line p-5">
          <p className="text-[10px] uppercase tracking-[0.15em] text-ink/40">
            {t('analytics.kpi.revenue')}
          </p>

          <p className="font-display text-3xl mt-2">
            {formatMoney(
              data.kpis.revenueCents,
              data.range.currency
            )}
          </p>
        </div>

        <div className="border border-line p-5">
          <p className="text-[10px] uppercase tracking-[0.15em] text-ink/40">
            {t('analytics.kpi.orders')}
          </p>

          <p className="font-display text-3xl mt-2">
            {data.kpis.orderCount}
          </p>
        </div>

        <div className="border border-line p-5">
          <p className="text-[10px] uppercase tracking-[0.15em] text-ink/40">
            {t('analytics.kpi.averageCheck')}
          </p>

          <p className="font-display text-3xl mt-2">
            {formatMoney(
              data.kpis.averageOrderCents,
              data.range.currency
            )}
          </p>
        </div>

        <div className="border border-line p-5">
          <p className="text-[10px] uppercase tracking-[0.15em] text-ink/40">
            {t('analytics.kpi.p90Service')}
          </p>

          <p className="font-display text-3xl mt-2">
            {formatDuration(
              p90TotalService
            )}
          </p>

          <p className="text-[10px] text-ink/35 mt-1">
            {t('analytics.kpi.orderToServed')}
          </p>
        </div>

        <div className="border border-line p-5">
          <p className="text-[10px] uppercase tracking-[0.15em] text-ink/40">
            {t('analytics.kpi.sessions')}
          </p>

          <p className="font-display text-3xl mt-2">
            {data.kpis.sessionCount}
          </p>
        </div>
      </section>

      {/* LIVE OPERATIONS */}

      <section>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">

          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-ink/40">
              {t('analytics.live.eyebrow')}
            </p>

            <h2 className="font-display text-2xl mt-1">
              {t('analytics.live.title')}
            </h2>
          </div>

          <p className="text-[10px] uppercase tracking-[0.1em] text-ink/30">
            {liveLoading
              ? t('analytics.live.updating')
              : lastLiveUpdate
                ? t('analytics.live.updatedAt', {
                    time: lastLiveUpdate.toLocaleTimeString(
                      [],
                      {
                        hour: '2-digit',
                        minute:
                          '2-digit',
                        second:
                          '2-digit',
                      }
                    ),
                  })
                : t('analytics.live.waitingForUpdate')}
          </p>

        </div>

        <div className="grid gap-3 mt-4 lg:grid-cols-3">

          <div
            className={`border p-5 ${
              live
                ? kitchenStatusClass(
                    live.kitchen.status
                  )
                : 'border-line'
            }`}
          >

            <div className="flex items-center justify-between">

              <p className="text-[10px] uppercase tracking-[0.15em] opacity-60">
                {t('analytics.live.kitchen')}
              </p>

              <span className="text-[10px] uppercase tracking-[0.12em]">
                {live?.kitchen.status
                  ? t(`analytics.kitchenStatus.${live.kitchen.status}`)
                  : t('analytics.live.loadingStatus')}
              </span>

            </div>

            <p className="font-display text-3xl mt-3">
              {live?.kitchen.backlog ??
                '—'}
            </p>

            <p className="text-xs opacity-60 mt-1">
              {t('analytics.live.ordersInBacklog')}
            </p>

          </div>

          <div className="border border-line p-5">

            <div className="flex items-center justify-between">

              <p className="text-[10px] uppercase tracking-[0.15em] text-ink/40">
                {t('analytics.live.readyWaiting')}
              </p>

              <span className="text-[10px] uppercase tracking-[0.12em] text-ink/35">
                {t('analytics.live.liveBadge')}
              </span>

            </div>

            <p className="font-display text-3xl mt-3">
              {live?.readyWaiting.count ??
                '—'}
            </p>

            <p className="text-xs text-ink/50 mt-1">
              {t('analytics.live.ordersWaitingToBeServed')}
            </p>

          </div>

          <div className="border border-line p-5">

            <div className="flex items-center justify-between">

              <p className="text-[10px] uppercase tracking-[0.15em] text-ink/40">
                {t('analytics.live.kitchenP90')}
              </p>

              <span className="text-[10px] uppercase tracking-[0.12em] text-ink/35">
                {t('analytics.live.historicalBadge')}
              </span>

            </div>

            <p className="font-display text-3xl mt-3">
              {formatDuration(
                p90Kitchen
              )}
            </p>

            <p className="text-xs text-ink/50 mt-1">
              {t('analytics.arrow.acceptedToReady')}
            </p>

          </div>

        </div>
      </section>

      {/* ALERTS */}

      <section className="border border-line p-5">

        <div className="flex items-end justify-between">

          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-ink/40">
              {t('analytics.alerts.eyebrow')}
            </p>

            <h2 className="font-display text-2xl mt-1">
              {t('analytics.alerts.title')}
            </h2>
          </div>

          <span className="text-[10px] uppercase tracking-[0.12em] text-ink/30">
            {t('analytics.alerts.activeCount', { count: activeAlerts.length })}
          </span>

        </div>

        <div className="mt-5 space-y-3">

          {activeAlerts.map(
            (alert, index) => (
              <div
                key={`${alert.title}-${index}`}
                className="flex gap-4 border-b border-line pb-3 last:border-b-0 last:pb-0"
              >

                <span
                  className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                    alert.severity ===
                    'HIGH'
                      ? 'bg-red-600'
                      : alert.severity ===
                        'MEDIUM'
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                  }`}
                />

                <div>
                  <p className="text-sm font-medium">
                    {alert.title}
                  </p>

                  <p className="text-xs text-ink/50 mt-1">
                    {alert.detail}
                  </p>
                </div>

              </div>
            )
          )}

        </div>
      </section>

      {/* MAIN CHARTS */}

      <div className="grid gap-6 lg:grid-cols-2">

        <section className="border border-line p-5">

          <div>
            <h2 className="font-display text-2xl">
              {t('analytics.chart.revenue.title')}
            </h2>

            <p className="text-xs text-ink/40 mt-1">
              {t('analytics.chart.revenue.subtitle')}
            </p>
          </div>

          <div className="mt-6 flex h-60 items-stretch gap-1.5">

            {data.revenueByDay.map(
              (item, index) => {
                const height =
                  Math.max(
                    3,
                    (item.revenueCents /
                      maxRevenue) *
                      100
                  );

                const showLabel =
                  data.revenueByDay.length <= 10 ||
                  index %
                    Math.ceil(
                      data.revenueByDay.length / 8
                    ) ===
                    0;

                return (
                  <div
                    key={item.date}
                    className="group relative flex flex-1 flex-col items-center justify-end"
                  >

                    <div className="relative w-full flex-1 overflow-visible rounded-t bg-n2bLavender/25">
                      <div
                        className="absolute bottom-0 left-0 right-0 rounded-t bg-n2bPurple transition-colors group-hover:bg-n2bPurpleLight"
                        style={{
                          height: `${height}%`,
                        }}
                      />

                      <div
                        className="pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded bg-n2bNavy px-2 py-1 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100"
                        style={{
                          bottom: `calc(${height}% + 8px)`,
                        }}
                      >
                        {item.date} ·{' '}
                        {formatMoney(
                          item.revenueCents,
                          data.range.currency
                        )}
                      </div>
                    </div>

                    <span className="mt-2 h-3 text-[10px] text-ink/40">
                      {showLabel
                        ? item.date.slice(5)
                        : ''}
                    </span>

                  </div>
                );
              }
            )}

          </div>
        </section>

        <section className="border border-line p-5">

          <div className="flex items-end justify-between">

            <div>
              <h2 className="font-display text-2xl">
                {t('analytics.chart.ordersByHour.title')}
              </h2>

              <p className="text-xs text-ink/40 mt-1">
                {t('analytics.chart.ordersByHour.peak', {
                  hour: formatHour(data.busiestHour),
                })}
              </p>
            </div>

          </div>

          <div className="mt-6 space-y-3">

            {data.ordersByHour.map(
              (item) => {
                const width =
                  Math.max(
                    4,
                    (item.orderCount /
                      maxHourOrders) *
                      100
                  );

                return (
                  <div key={item.hour} className="group">

                    <div className="flex items-center justify-between text-xs mb-1">

                      <span>
                        {formatHour(
                          item.hour
                        )}
                      </span>

                      <span className="text-ink/50">
                        {t('analytics.chart.ordersByHour.ordersAndRevenue', {
                          count: item.orderCount,
                          revenue: formatMoney(
                            item.revenueCents,
                            data.range.currency
                          ),
                        })}
                      </span>

                    </div>

                    <div className="h-3 rounded-full bg-n2bLavender/25">

                      <div
                        className="h-3 rounded-full bg-n2bPurple transition-colors group-hover:bg-n2bPurpleLight"
                        style={{
                          width: `${width}%`,
                        }}
                      />

                    </div>

                  </div>
                );
              }
            )}

            {data.ordersByHour.length ===
              0 && (
              <p className="text-sm text-ink/40">
                {t('analytics.chart.ordersByHour.empty')}
              </p>
            )}

          </div>
        </section>

      </div>

      {/* SERVICE TIMES */}

      <section className="border border-line p-5">

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <p className="text-[10px] uppercase tracking-[0.15em] text-ink/40">
              {t('analytics.eyebrow.serviceIntelligence')}
            </p>

            <h2 className="font-display text-2xl mt-1">
              {t('analytics.serviceTimes.title')}
            </h2>

            <p className="text-xs text-ink/40 mt-1">
              {t('analytics.serviceTimes.subtitle')}
            </p>

          </div>

          <div className="text-right">

            <p className="text-[10px] uppercase tracking-[0.12em] text-ink/35">
              {t('analytics.serviceTimes.p90Total')}
            </p>

            <p className="font-display text-2xl">
              {formatDuration(
                p90TotalService
              )}
            </p>

          </div>

        </div>

        <div className="mt-6 overflow-x-auto">

          <table className="w-full min-w-[680px] text-left">

            <thead>

              <tr className="border-b border-line text-[10px] uppercase tracking-[0.12em] text-ink/35">

                <th className="pb-3 pr-4 font-normal">
                  {t('analytics.table.stage')}
                </th>

                <th className="pb-3 px-3 font-normal">
                  {t('analytics.table.sample')}
                </th>

                <th className="pb-3 px-3 font-normal">
                  {t('analytics.table.avg')}
                </th>

                <th className="pb-3 px-3 font-normal">
                  {t('analytics.table.p50')}
                </th>

                <th className="pb-3 px-3 font-normal">
                  {t('analytics.table.p75')}
                </th>

                <th className="pb-3 px-3 font-normal">
                  {t('analytics.table.p90')}
                </th>

                <th className="pb-3 px-3 font-normal">
                  {t('analytics.table.p95')}
                </th>

              </tr>

            </thead>

            <tbody>

              {serviceTimes &&
                stageLabels.map(
                  (stageInfo) => {

                    const stage =
                      serviceTimes.stages[
                        stageInfo.key
                      ];

                    return (
                      <tr
                        key={
                          stageInfo.key
                        }
                        className="border-b border-line last:border-b-0"
                      >

                        <td className="py-4 pr-4">

                          <p className="text-sm font-medium">
                            {t(`analytics.stage.${stageInfo.key}.label`)}
                          </p>

                          <p className="text-[10px] text-ink/40 mt-1">
                            {t(`analytics.stage.${stageInfo.key}.description`)}
                          </p>

                        </td>

                        <td className="py-4 px-3 text-sm">
                          {stage.n}
                        </td>

                        <td className="py-4 px-3 text-sm">
                          {formatDuration(
                            stage.avgSeconds
                          )}
                        </td>

                        <td className="py-4 px-3 text-sm">
                          {formatDuration(
                            stage.p50Seconds
                          )}
                        </td>

                        <td className="py-4 px-3 text-sm">
                          {formatDuration(
                            stage.p75Seconds
                          )}
                        </td>

                        <td className="py-4 px-3 text-sm font-medium">
                          {formatDuration(
                            stage.p90Seconds
                          )}
                        </td>

                        <td className="py-4 px-3 text-sm">
                          {formatDuration(
                            stage.p95Seconds
                          )}
                        </td>

                      </tr>
                    );
                  }
                )}

            </tbody>
          </table>
        </div>
      </section>

      {/* SLA COMPLIANCE */}

      <section className="border border-line p-5">

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <p className="text-[10px] uppercase tracking-[0.15em] text-ink/40">
              {t('analytics.eyebrow.serviceIntelligence')}
            </p>

            <h2 className="font-display text-2xl mt-1">
              {t('analytics.sla.title')}
            </h2>

            <p className="text-xs text-ink/40 mt-1">
              {t('analytics.sla.subtitle')}
            </p>

          </div>

          {sla?.sampleWarning && (
            <p className="text-[10px] text-amber-600">
              {sla.sampleWarning}
            </p>
          )}

        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">

          {/* ACCEPTANCE */}

          <div className="border border-line p-5">

            <div className="flex items-center justify-between gap-3">

              <p className="text-[10px] uppercase tracking-[0.15em] text-ink/40">
                {t('analytics.sla.acceptance.label')}
              </p>

              <span className="text-[10px] uppercase tracking-[0.12em] text-ink/35">
                {t('analytics.sla.target', {
                  duration: formatDuration(acceptanceSla),
                })}
              </span>

            </div>

            <p className="font-display text-3xl mt-3">
              {formatCompliance(
                sla?.acceptance
                  .compliancePct
              )}
            </p>

            <div className="flex items-center justify-between mt-2">

              <p className="text-xs text-ink/50">
                {t('analytics.sla.withinSla', {
                  count: sla?.acceptance.withinSla ?? 0,
                })}
              </p>

              <p className="text-xs text-ink/50">
                {t('analytics.sla.breaches', {
                  count: sla?.acceptance.breaches ?? 0,
                })}
              </p>

            </div>

            <p className="text-[10px] text-ink/35 mt-3">
              {t('analytics.arrow.createdToAccepted')}
            </p>

          </div>

          {/* KITCHEN */}

          <div className="border border-line p-5">

            <div className="flex items-center justify-between gap-3">

              <p className="text-[10px] uppercase tracking-[0.15em] text-ink/40">
                {t('analytics.sla.kitchen.label')}
              </p>

              <span className="text-[10px] uppercase tracking-[0.12em] text-ink/35">
                {t('analytics.sla.target', {
                  duration: formatDuration(kitchenSla),
                })}
              </span>

            </div>

            <p className="font-display text-3xl mt-3">
              {formatCompliance(
                sla?.kitchen
                  .compliancePct
              )}
            </p>

            <div className="flex items-center justify-between mt-2">

              <p className="text-xs text-ink/50">
                {t('analytics.sla.withinSla', {
                  count: sla?.kitchen.withinSla ?? 0,
                })}
              </p>

              <p className="text-xs text-ink/50">
                {t('analytics.sla.breaches', {
                  count: sla?.kitchen.breaches ?? 0,
                })}
              </p>

            </div>

            <p className="text-[10px] text-ink/35 mt-3">
              {t('analytics.arrow.acceptedToReady')}
            </p>

          </div>

          {/* WAITER */}

          <div className="border border-line p-5">

            <div className="flex items-center justify-between gap-3">

              <p className="text-[10px] uppercase tracking-[0.15em] text-ink/40">
                {t('analytics.sla.waiter.label')}
              </p>

              <span className="text-[10px] uppercase tracking-[0.12em] text-ink/35">
                {t('analytics.sla.target', {
                  duration: formatDuration(waiterSla),
                })}
              </span>

            </div>

            <p className="font-display text-3xl mt-3">
              {formatCompliance(
                sla?.waiter
                  .compliancePct
              )}
            </p>

            <div className="flex items-center justify-between mt-2">

              <p className="text-xs text-ink/50">
                {t('analytics.sla.withinSla', {
                  count: sla?.waiter.withinSla ?? 0,
                })}
              </p>

              <p className="text-xs text-ink/50">
                {t('analytics.sla.breaches', {
                  count: sla?.waiter.breaches ?? 0,
                })}
              </p>

            </div>

            <p className="text-[10px] text-ink/35 mt-3">
              {t('analytics.stage.readyToCompleted.label')}
            </p>

          </div>

          {/* TOTAL SERVICE */}

          <div className="border border-line p-5">

            <div className="flex items-center justify-between gap-3">

              <p className="text-[10px] uppercase tracking-[0.15em] text-ink/40">
                {t('analytics.sla.totalService.label')}
              </p>

              <span className="text-[10px] uppercase tracking-[0.12em] text-ink/35">
                {t('analytics.sla.target', {
                  duration: formatDuration(totalServiceSla),
                })}
              </span>

            </div>

            <p className="font-display text-3xl mt-3">
              {formatCompliance(
                sla?.totalService
                  .compliancePct
              )}
            </p>

            <div className="flex items-center justify-between mt-2">

              <p className="text-xs text-ink/50">
                {t('analytics.sla.withinSla', {
                  count: sla?.totalService.withinSla ?? 0,
                })}
              </p>

              <p className="text-xs text-ink/50">
                {t('analytics.sla.breaches', {
                  count: sla?.totalService.breaches ?? 0,
                })}
              </p>

            </div>

            <p className="text-[10px] text-ink/35 mt-3">
              {t('analytics.arrow.createdToServed')}
            </p>

          </div>

        </div>
      </section>

      {/* READY WAITING */}

      <section className="border border-line p-5">

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <p className="text-[10px] uppercase tracking-[0.15em] text-ink/40">
              {t('analytics.readyWaiting.eyebrow')}
            </p>

            <h2 className="font-display text-2xl mt-1">
              {t('analytics.readyWaiting.title')}
            </h2>

            <p className="text-xs text-ink/40 mt-1">
              {t('analytics.readyWaiting.subtitle')}
            </p>

          </div>

          <span className="text-xs text-ink/40">
            {t('analytics.readyWaiting.refreshNote')}
          </span>

        </div>

        <div className="mt-5">

          {!live ||
          live.readyWaiting.orders.length ===
            0 ? (

            <div className="border border-dashed border-line py-10 text-center">

              <p className="text-sm text-ink/50">
                {t('analytics.readyWaiting.empty')}
              </p>

            </div>

          ) : (

            <div className="space-y-3">

              {live.readyWaiting.orders.map(
                (order) => (
                  <div
                    key={order.id}
                    className={`border p-4 ${severityClass(
                      order.severity
                    )}`}
                  >

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">

                      <div className="flex-1">

                        <div className="flex items-center gap-3">

                          <span className="font-display text-xl">
                            #{order.orderNumber}
                          </span>

                          <span className="text-sm">
                            {order.tableLabel}
                          </span>

                        </div>

                        <p className="text-xs opacity-60 mt-1">
                          {t('analytics.readyWaiting.readyAt', {
                            time: new Date(
                              order.readyAt
                            ).toLocaleTimeString(
                              [],
                              {
                                hour: '2-digit',
                                minute:
                                  '2-digit',
                              }
                            ),
                          })}
                        </p>

                      </div>

                      <div className="sm:text-right">

                        <p className="font-display text-xl">
                          {formatWaiting(
                            order.waitingSeconds
                          )}
                        </p>

                        <p className="text-[10px] uppercase tracking-[0.12em] opacity-60">
                          {t(`analytics.severity.${order.severity}`)}
                        </p>

                      </div>

                    </div>
                  </div>
                )
              )}

            </div>
          )}

        </div>
      </section>

      {/* CATEGORY + PRODUCTS */}

      <div className="grid gap-6 lg:grid-cols-2">

        <section className="border border-line p-5">

          <h2 className="font-display text-2xl">
            {t('analytics.category.title')}
          </h2>

          <div className="mt-5 space-y-5">

            {data.categories.map(
              (category) => (

                <div
                  key={
                    category.categoryId
                  }
                >

                  <div className="flex items-center justify-between text-sm">

                    <span>
                      {category.name}
                    </span>

                    <span className="font-medium">
                      {formatMoney(
                        category.revenueCents,
                        data.range.currency
                      )}
                    </span>

                  </div>

                  <div className="mt-2 h-2 bg-ink/5">

                    <div
                      className="h-2 bg-ink"
                      style={{
                        width: `${Math.min(
                          100,
                          (category.revenueCents /
                            maxCategoryRevenue) *
                            100
                        )}%`,
                      }}
                    />

                  </div>

                  <p className="text-[10px] text-ink/40 mt-1">
                    {t('analytics.category.itemsSold', {
                      count: category.quantitySold,
                    })}
                  </p>

                </div>
              )
            )}

          </div>
        </section>

        <section className="border border-line p-5">

          <div>

            <h2 className="font-display text-2xl">
              {t('analytics.products.title')}
            </h2>

            <p className="text-xs text-ink/40 mt-1">
              {t('analytics.products.subtitle')}
            </p>

          </div>

          <div className="mt-5 space-y-3">

            {data.topProducts.map(
              (product, index) => (

                <div
                  key={
                    product.menuItemId
                  }
                  className="flex items-center gap-3 border-b border-line pb-3 last:border-b-0"
                >

                  <span className="w-6 text-xs text-ink/30">
                    {index + 1}
                  </span>

                  <span className="flex-1 text-sm">
                    {product.name}
                  </span>

                  <span className="text-xs text-ink/50">
                    {product.quantitySold}
                  </span>

                  <span className="text-sm font-medium">
                    {formatMoney(
                      product.revenueCents,
                      data.range.currency
                    )}
                  </span>

                </div>

              )
            )}

          </div>
        </section>

      </div>

      {/* DESSERT + WEEK */}

      <div className="grid gap-6 lg:grid-cols-2">

        <section className="border border-line p-5">

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">

            <div>

              <h2 className="font-display text-2xl">
                {t('analytics.dessert.title')}
              </h2>

              <p className="text-xs text-ink/40 mt-1">
                {t('analytics.dessert.subtitle')}
              </p>

            </div>

            <p className="font-display text-4xl">
              {data.dessert.conversionPct}%
            </p>

          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">

            <div className="bg-ink/[0.03] p-4">

              <p className="text-[10px] uppercase tracking-[0.15em] text-ink/40">
                {t('analytics.kpi.sessions')}
              </p>

              <p className="text-2xl font-medium mt-1">
                {data.dessert.sessionCount}
              </p>

            </div>

            <div className="bg-ink/[0.03] p-4">

              <p className="text-[10px] uppercase tracking-[0.15em] text-ink/40">
                {t('analytics.dessert.withDessert')}
              </p>

              <p className="text-2xl font-medium mt-1">
                {data.dessert.dessertSessions}
              </p>

            </div>

            <div className="bg-ink/[0.03] p-4">

              <p className="text-[10px] uppercase tracking-[0.15em] text-ink/40">
                {t('analytics.dessert.noDessert')}
              </p>

              <p className="text-2xl font-medium mt-1">
                {Math.max(
                  0,
                  data.dessert
                    .sessionCount -
                    data.dessert
                      .dessertSessions
                )}
              </p>

            </div>

          </div>
        </section>

        <section className="border border-line p-5">

          <h2 className="font-display text-2xl">
            {t('analytics.week.title')}
          </h2>

          <div className="mt-6 flex h-48 items-stretch gap-3">

            {data.ordersByDayOfWeek.map(
              (day) => {
                const height =
                  Math.max(
                    3,
                    (day.orderCount /
                      maxDayOrders) *
                      100
                  );

                return (
                  <div
                    key={day.dayOfWeek}
                    className="group relative flex flex-1 flex-col items-center justify-end"
                  >

                    <div className="relative w-full flex-1 overflow-visible rounded-t bg-n2bLavender/25">
                      <div
                        className="absolute bottom-0 left-0 right-0 rounded-t bg-n2bPurple transition-colors group-hover:bg-n2bPurpleLight"
                        style={{
                          height: `${height}%`,
                        }}
                      />

                      <div
                        className="pointer-events-none absolute left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded bg-n2bNavy px-2 py-1 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100"
                        style={{
                          bottom: `calc(${height}% + 8px)`,
                        }}
                      >
                        {formatMoney(
                          day.revenueCents,
                          data.range.currency
                        )}
                      </div>

                      <span className="absolute top-1.5 left-0 right-0 text-center text-[11px] font-medium text-n2bNavy">
                        {day.orderCount}
                      </span>
                    </div>

                    <span className="mt-2 text-[10px] text-ink/40">
                      {dayName(
                        day.dayOfWeek,
                        t
                      )}
                    </span>

                  </div>
                );
              }
            )}

          </div>
        </section>

        <section className="border border-line p-5 lg:col-span-2">

          <div>
            <h2 className="font-display text-2xl">
              {t('analytics.tableHistory.title')}
            </h2>

            <p className="text-xs text-ink/40 mt-1">
              {t('analytics.tableHistory.subtitle')}
            </p>
          </div>

          {!tablesData ||
          tablesData.tables.length === 0 ? (
            <p className="text-sm text-ink/40 mt-6">
              {t('analytics.tableHistory.empty')}
            </p>
          ) : (
            <>
              {tablesData.busiestTable &&
                tablesData.busiestTable.orderCount > 0 && (
                  <p className="text-xs text-ink/45 mt-2">
                    {t('analytics.tableHistory.busiestLabel')}
                    {': '}
                    <span className="font-medium text-ink">
                      {tablesData.busiestTable.label}
                    </span>
                    {' — '}
                    {t('analytics.tableHistory.countLabel', {
                      count: tablesData.busiestTable.orderCount,
                      word:
                        tablesData.busiestTable.orderCount === 1
                          ? t('analytics.tableHistory.orderSingular')
                          : t('analytics.tableHistory.orderPlural'),
                    })}
                  </p>
                )}

              <div className="mt-5 space-y-3">
                {tablesData.tables.map((tableRow) => {
                  const width = Math.max(
                    tableRow.orderCount > 0 ? 3 : 0,
                    (tableRow.orderCount / maxTableOrders) * 100
                  );

                  return (
                    <div key={tableRow.tableId} className="group">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="flex items-center gap-2">
                          {tableRow.label}
                          {!tableRow.isActive && (
                            <span className="text-[9px] uppercase tracking-[0.08em] text-ink/35 border border-line rounded px-1.5 py-0.5">
                              {t('analytics.tableHistory.inactiveBadge')}
                            </span>
                          )}
                        </span>

                        <span className="text-ink/50">
                          {t('analytics.tableHistory.countLabel', {
                            count: tableRow.orderCount,
                            word:
                              tableRow.orderCount === 1
                                ? t('analytics.tableHistory.orderSingular')
                                : t('analytics.tableHistory.orderPlural'),
                          })}
                          {' · '}
                          {formatMoney(
                            tableRow.revenueCents,
                            data.range.currency
                          )}
                        </span>
                      </div>

                      <div className="h-3 rounded-full bg-n2bLavender/25">
                        <div
                          className="h-3 rounded-full bg-n2bPurple transition-colors group-hover:bg-n2bPurpleLight"
                          style={{
                            width: `${width}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>

      </div>

      {/* FOOTER */}

      <div className="pt-2 text-[10px] uppercase tracking-[0.12em] text-ink/30">
        {data.range.localFrom} →{' '}
        {data.range.localToExclusive}
        {' · '}
        {data.range.timezone}
      </div>

    </div>
  );
}