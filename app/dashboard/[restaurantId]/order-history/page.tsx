'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useI18n } from '@/src/lib/i18n/I18nProvider';
import AllergenIconRow from '@/components/AllergenIconRow';

type RangeKey = 'today' | 'week' | 'month' | 'custom';

type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'NEW'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY'
  | 'COMPLETED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'PAYMENT_FAILED';

const ALL_STATUSES: OrderStatus[] = [
  'PENDING_PAYMENT',
  'NEW',
  'ACCEPTED',
  'PREPARING',
  'READY',
  'COMPLETED',
  'REJECTED',
  'CANCELLED',
  'PAYMENT_FAILED',
];

type Table = { id: string; label: string };

type HistoryRow = {
  id: string;
  orderNumber: number;
  createdAt: string;
  status: OrderStatus;
  totalCents: number;
  currency: string;
  table: Table | null;
  staffName: string | null;
  paymentMethod: 'ONLINE' | 'PAY_AT_RESTAURANT' | null;
  collectionMethod: 'CASH' | 'CARD' | 'OTHER' | null;
  itemCount: number;
  itemsSummary: string;
};

type DetailItem = {
  id: string;
  nameSnapshot: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  notes: string | null;
  status: string;
  allergens: string[];
  modifiers: { nameSnapshot: string; priceDeltaCentsSnapshot: number }[];
};

type OrderDetail = {
  id: string;
  orderNumber: number;
  status: OrderStatus;
  notes: string | null;
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  currency: string;
  table: Table | null;
  partySize: number | null;
  staffName: string | null;
  paymentMethod: 'ONLINE' | 'PAY_AT_RESTAURANT' | null;
  collectionMethod: 'CASH' | 'CARD' | 'OTHER' | null;
  timeline: {
    createdAt: string;
    acceptedAt: string | null;
    preparingAt: string | null;
    readyAt: string | null;
    completedAt: string | null;
    cancelledAt: string | null;
    rejectedAt: string | null;
    paidAt: string | null;
  };
  items: DetailItem[];
};

function money(cents: number, currency: string) {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency }).format(cents / 100);
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function toDateInputValue(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Local-browser-time ranges (matches the reservations calendar's approach)
// — good enough for a manager reviewing history from the restaurant itself,
// and keeps this self-contained rather than reaching for a timezone-aware
// resolver for a feature that doesn't need minute-level precision.
function computeRange(key: RangeKey, customFrom: string, customTo: string) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (key === 'today') {
    const to = new Date(startOfToday);
    to.setDate(to.getDate() + 1);
    return { from: startOfToday, to };
  }

  if (key === 'week') {
    const weekday = startOfToday.getDay(); // 0=Sun
    const back = weekday === 0 ? 6 : weekday - 1;
    const from = new Date(startOfToday);
    from.setDate(from.getDate() - back);
    const to = new Date(from);
    to.setDate(to.getDate() + 7);
    return { from, to };
  }

  if (key === 'month') {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return { from, to };
  }

  // custom
  if (!customFrom || !customTo) return null;
  const from = new Date(`${customFrom}T00:00:00`);
  const to = new Date(`${customTo}T00:00:00`);
  to.setDate(to.getDate() + 1);
  return { from, to };
}

function paymentLabel(
  method: HistoryRow['paymentMethod'],
  collection: HistoryRow['collectionMethod'],
  t: (key: string, vars?: Record<string, string | number>) => string
) {
  if (method === 'ONLINE') return t('orderHistory.payment.online');
  if (method === 'PAY_AT_RESTAURANT') {
    if (collection === 'CASH') return t('orderHistory.payment.cash');
    if (collection === 'CARD') return t('orderHistory.payment.card');
    return t('orderHistory.payment.other');
  }
  return t('orderHistory.payment.unknown');
}

function statusClass(status: OrderStatus) {
  switch (status) {
    case 'COMPLETED':
      return 'bg-[#477052]/10 text-[#406449]';
    case 'CANCELLED':
    case 'REJECTED':
    case 'PAYMENT_FAILED':
      return 'bg-[#b0392f]/10 text-[#b0392f]';
    case 'READY':
      return 'bg-[#5B3DFF]/10 text-[#5B3DFF]';
    case 'PREPARING':
    case 'ACCEPTED':
      return 'bg-[#9a6b22]/10 text-[#7a551b]';
    default:
      return 'bg-black/5 text-ink/50';
  }
}

export default function OrderHistoryPage({
  params,
}: {
  params: { restaurantId: string };
}) {
  const { t } = useI18n();
  const restaurantId = params.restaurantId;

  const [rangeKey, setRangeKey] = useState<RangeKey>('today');
  const [customFrom, setCustomFrom] = useState(() => toDateInputValue(new Date()));
  const [customTo, setCustomTo] = useState(() => toDateInputValue(new Date()));
  const [appliedCustomFrom, setAppliedCustomFrom] = useState(customFrom);
  const [appliedCustomTo, setAppliedCustomTo] = useState(customTo);

  const [tables, setTables] = useState<Table[]>([]);
  const [tableId, setTableId] = useState('');
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const [orderNumberInput, setOrderNumberInput] = useState('');
  const [orderNumberFilter, setOrderNumberFilter] = useState('');

  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/restaurants/${restaurantId}/tables`, { credentials: 'include', cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : []))
      .then((json) => setTables(Array.isArray(json) ? json : []))
      .catch(() => {});
  }, [restaurantId]);

  const range = useMemo(
    () => computeRange(rangeKey, appliedCustomFrom, appliedCustomTo),
    [rangeKey, appliedCustomFrom, appliedCustomTo]
  );

  const load = useCallback(
    async (targetPage: number) => {
      if (!range) return;

      try {
        setLoading(true);
        setError(null);

        const search = new URLSearchParams({
          from: range.from.toISOString(),
          to: range.to.toISOString(),
          page: String(targetPage),
        });
        if (tableId) search.set('tableId', tableId);
        if (status) search.set('status', status);
        if (orderNumberFilter) search.set('orderNumber', orderNumberFilter);

        const res = await fetch(
          `/api/restaurants/${restaurantId}/orders/history?${search.toString()}`,
          { credentials: 'include', cache: 'no-store' }
        );
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? t('orderHistory.error.load'));

        setRows(Array.isArray(json.orders) ? json.orders : []);
        setTotalPages(json.totalPages ?? 1);
        setTotalCount(json.totalCount ?? 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('orderHistory.error.load'));
      } finally {
        setLoading(false);
      }
    },
    [range, tableId, status, orderNumberFilter, restaurantId, t]
  );

  useEffect(() => {
    setPage(1);
    void load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, tableId, status, orderNumberFilter]);

  useEffect(() => {
    void load(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function openDetail(orderId: string) {
    try {
      setDetailLoading(true);
      setDetailError(null);
      setDetail(null);

      const res = await fetch(
        `/api/restaurants/${restaurantId}/orders/history/${orderId}`,
        { credentials: 'include', cache: 'no-store' }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? t('orderHistory.error.loadDetail'));
      setDetail(json);
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : t('orderHistory.error.loadDetail'));
    } finally {
      setDetailLoading(false);
    }
  }

  function submitOrderNumber(e: React.FormEvent) {
    e.preventDefault();
    setOrderNumberFilter(orderNumberInput.trim());
  }

  const rangeOptions: RangeKey[] = ['today', 'week', 'month', 'custom'];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-ink/40">{t('orderHistory.eyebrow')}</p>
        <h1 className="font-display text-4xl mt-1">{t('orderHistory.title')}</h1>
        <p className="text-sm text-ink/50 mt-2">{t('orderHistory.subtitle')}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {rangeOptions.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setRangeKey(option)}
            className={`px-3 py-2 text-xs border transition ${
              rangeKey === option
                ? 'border-ink bg-ink text-paper'
                : 'border-line text-ink/60 hover:text-ink'
            }`}
          >
            {t(`orderHistory.range.${option}`)}
          </button>
        ))}
      </div>

      {rangeKey === 'custom' && (
        <div className="flex flex-wrap items-end gap-3 border border-line p-4">
          <div>
            <label className="text-[10px] uppercase tracking-[0.15em] text-ink/40 block mb-1">
              {t('orderHistory.custom.from')}
            </label>
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="border border-line px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-[0.15em] text-ink/40 block mb-1">
              {t('orderHistory.custom.to')}
            </label>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="border border-line px-3 py-2 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setAppliedCustomFrom(customFrom);
              setAppliedCustomTo(customTo);
            }}
            className="px-4 py-2 text-xs border border-ink bg-ink text-paper"
          >
            {t('orderHistory.custom.apply')}
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <div>
          <label className="text-[10px] uppercase tracking-[0.15em] text-ink/40 block mb-1">
            {t('orderHistory.filters.table')}
          </label>
          <select
            value={tableId}
            onChange={(e) => setTableId(e.target.value)}
            className="border border-line px-3 py-2 text-sm bg-white min-w-[160px]"
          >
            <option value="">{t('orderHistory.filters.allTables')}</option>
            {tables.map((table) => (
              <option key={table.id} value={table.id}>
                {table.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-[0.15em] text-ink/40 block mb-1">
            {t('orderHistory.filters.status')}
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as OrderStatus | '')}
            className="border border-line px-3 py-2 text-sm bg-white min-w-[160px]"
          >
            <option value="">{t('orderHistory.filters.allStatuses')}</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(`orderHistory.status.${s}`)}
              </option>
            ))}
          </select>
        </div>

        <form onSubmit={submitOrderNumber}>
          <label className="text-[10px] uppercase tracking-[0.15em] text-ink/40 block mb-1">
            {t('orderHistory.filters.orderNumber')}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              value={orderNumberInput}
              onChange={(e) => setOrderNumberInput(e.target.value)}
              placeholder={t('orderHistory.filters.orderNumberPlaceholder')}
              className="border border-line px-3 py-2 text-sm w-32"
            />
            <button type="submit" className="px-3 py-2 text-xs border border-line hover:border-ink">
              {t('orderHistory.custom.apply')}
            </button>
          </div>
        </form>
      </div>

      {error && <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <div className="overflow-x-auto border border-line">
        <table className="w-full min-w-[900px] text-left">
          <thead>
            <tr className="border-b border-line text-[10px] uppercase tracking-[0.12em] text-ink/35">
              <th className="py-3 px-4 font-normal">{t('orderHistory.table.date')}</th>
              <th className="py-3 px-4 font-normal">{t('orderHistory.table.order')}</th>
              <th className="py-3 px-4 font-normal">{t('orderHistory.table.table')}</th>
              <th className="py-3 px-4 font-normal">{t('orderHistory.table.items')}</th>
              <th className="py-3 px-4 font-normal">{t('orderHistory.table.payment')}</th>
              <th className="py-3 px-4 font-normal">{t('orderHistory.table.servedBy')}</th>
              <th className="py-3 px-4 font-normal">{t('orderHistory.table.status')}</th>
              <th className="py-3 px-4 font-normal text-right">{t('orderHistory.table.total')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => void openDetail(row.id)}
                className="border-b border-line last:border-b-0 cursor-pointer hover:bg-ink/[0.02]"
              >
                <td className="py-3 px-4 text-sm whitespace-nowrap">
                  {new Date(row.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </td>
                <td className="py-3 px-4 text-sm">#{row.orderNumber}</td>
                <td className="py-3 px-4 text-sm">{row.table?.label ?? '—'}</td>
                <td className="py-3 px-4 text-sm max-w-[240px] truncate" title={row.itemsSummary}>
                  {row.itemCount} · {row.itemsSummary}
                </td>
                <td className="py-3 px-4 text-sm">
                  {paymentLabel(row.paymentMethod, row.collectionMethod, t)}
                </td>
                <td className="py-3 px-4 text-sm">{row.staffName ?? '—'}</td>
                <td className="py-3 px-4 text-sm">
                  <span className={`px-2 py-1 rounded-full text-[10px] uppercase tracking-[0.06em] ${statusClass(row.status)}`}>
                    {t(`orderHistory.status.${row.status}`)}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-right font-medium">
                  {money(row.totalCents, row.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!loading && rows.length === 0 && (
          <p className="py-12 text-center text-sm text-ink/40">{t('orderHistory.table.empty')}</p>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-ink/50">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 border border-line disabled:opacity-30"
          >
            {t('orderHistory.pagination.prev')}
          </button>
          <span>
            {t('orderHistory.pagination.page', { page, totalPages })} · {totalCount}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-3 py-1.5 border border-line disabled:opacity-30"
          >
            {t('orderHistory.pagination.next')}
          </button>
        </div>
      )}

      {(detail || detailLoading || detailError) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => {
            setDetail(null);
            setDetailError(null);
          }}
        >
          <div
            className="max-h-[85vh] w-full max-w-2xl overflow-y-auto bg-paper p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {detailLoading && <p className="text-sm text-ink/50">{t('orderHistory.loading')}</p>}
            {detailError && <p className="text-sm text-red-700">{detailError}</p>}

            {detail && (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-2xl">
                      {t('orderHistory.detail.title', { orderNumber: detail.orderNumber })}
                    </h3>
                    <p className="text-xs text-ink/50 mt-1">
                      {detail.table?.label ?? '—'}
                      {detail.partySize != null &&
                        ` · ${t('orderHistory.detail.partySize', { count: detail.partySize })}`}
                      {' · '}
                      {paymentLabel(detail.paymentMethod, detail.collectionMethod, t)}
                      {detail.staffName && ` · ${detail.staffName}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDetail(null)}
                    className="text-xs text-ink/40 hover:text-ink"
                  >
                    {t('orderHistory.detail.close')}
                  </button>
                </div>

                <span className={`inline-block mt-3 px-2 py-1 rounded-full text-[10px] uppercase tracking-[0.06em] ${statusClass(detail.status)}`}>
                  {t(`orderHistory.status.${detail.status}`)}
                </span>

                <div className="mt-5 overflow-x-auto">
                  <table className="w-full min-w-[480px] text-left">
                    <thead>
                      <tr className="border-b border-line text-[10px] uppercase tracking-[0.12em] text-ink/35">
                        <th className="pb-2 pr-3 font-normal">{t('orderHistory.detail.item')}</th>
                        <th className="pb-2 px-2 font-normal">{t('orderHistory.detail.qty')}</th>
                        <th className="pb-2 px-2 font-normal">{t('orderHistory.detail.unitPrice')}</th>
                        <th className="pb-2 pl-2 font-normal text-right">
                          {t('orderHistory.detail.lineTotal')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.items.map((item) => (
                        <tr key={item.id} className="border-b border-line last:border-b-0 align-top">
                          <td className="py-2 pr-3 text-sm">
                            <div>{item.nameSnapshot}</div>
                            {item.allergens.length > 0 && (
                              <AllergenIconRow allergens={item.allergens} className="mt-1 text-ink/45" />
                            )}
                            {item.modifiers.map((mod, i) => (
                              <p key={i} className="text-xs text-ink/40 mt-0.5">
                                + {mod.nameSnapshot}
                              </p>
                            ))}
                            {item.notes && (
                              <p className="text-xs italic text-ink/40 mt-0.5">{item.notes}</p>
                            )}
                          </td>
                          <td className="py-2 px-2 text-sm">{item.quantity}</td>
                          <td className="py-2 px-2 text-sm">{money(item.unitPriceCents, detail.currency)}</td>
                          <td className="py-2 pl-2 text-sm text-right font-medium">
                            {money(item.lineTotalCents, detail.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 space-y-1 text-sm ml-auto max-w-[220px]">
                  <div className="flex justify-between">
                    <span className="text-ink/50">{t('orderHistory.detail.subtotal')}</span>
                    <span>{money(detail.subtotalCents, detail.currency)}</span>
                  </div>
                  {detail.taxCents > 0 && (
                    <div className="flex justify-between">
                      <span className="text-ink/50">{t('orderHistory.detail.tax')}</span>
                      <span>{money(detail.taxCents, detail.currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-medium">
                    <span>{t('orderHistory.detail.total')}</span>
                    <span>{money(detail.totalCents, detail.currency)}</span>
                  </div>
                </div>

                {detail.notes && (
                  <p className="mt-4 text-xs text-ink/50">
                    {t('orderHistory.detail.notes')}: {detail.notes}
                  </p>
                )}

                <div className="mt-6">
                  <p className="text-[10px] uppercase tracking-[0.15em] text-ink/40 mb-3">
                    {t('orderHistory.detail.timelineHeading')}
                  </p>
                  <ol className="space-y-2">
                    {(
                      [
                        ['created', detail.timeline.createdAt],
                        ['accepted', detail.timeline.acceptedAt],
                        ['preparing', detail.timeline.preparingAt],
                        ['ready', detail.timeline.readyAt],
                        ['paid', detail.timeline.paidAt],
                        ['completed', detail.timeline.completedAt],
                        ['cancelled', detail.timeline.cancelledAt],
                        ['rejected', detail.timeline.rejectedAt],
                      ] as const
                    )
                      // Cancelled/rejected are terminal opposites of the
                      // happy path — only show whichever one actually
                      // happened, not both greyed-out "didn't happen"
                      // rows on every order.
                      .filter(
                        ([key, value]) =>
                          (key !== 'cancelled' && key !== 'rejected') || value !== null
                      )
                      .map(([key, value]) => (
                        <li key={key} className="flex items-center justify-between text-sm">
                          <span className={value ? '' : 'text-ink/30'}>
                            {t(`orderHistory.timeline.${key}`)}
                          </span>
                          <span className={value ? 'text-ink/60' : 'text-ink/25 italic'}>
                            {value
                              ? new Date(value).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
                              : t('orderHistory.detail.notReached')}
                          </span>
                        </li>
                      ))}
                  </ol>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
