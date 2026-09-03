'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useI18n } from '@/src/lib/i18n/I18nProvider';

type RangeKey = 'today' | 'week' | 'month' | 'year' | 'custom';

type VatBreakdownEntry = { baseCents: number; vatCents: number };

type SummaryData = {
  range: {
    key: string;
    timezone: string;
    currency: string;
    localFrom: string;
    localToExclusive: string;
  };
  orderCount: number;
  totalRevenueCents: number;
  averageOrderCents: number;
  vatBreakdown: Record<string, VatBreakdownEntry>;
  vatTotalCents: number;
  baseTotalCents: number;
  untrackedRevenueCents: number;
  untrackedOrderCount: number;
};

type OrderRow = {
  id: string;
  orderNumber: number;
  paidAt: string;
  totalCents: number;
  currency: string;
  tableLabel: string;
  paymentMethod: 'ONLINE' | 'PAY_AT_RESTAURANT' | null;
  collectionMethod: 'CASH' | 'CARD' | 'OTHER' | null;
  itemCount: number;
};

type OrdersData = {
  orders: OrderRow[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

type ReceiptItem = {
  id: string;
  nameSnapshot: string;
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  vatRateBps: number | null;
  baseCents: number | null;
  vatCents: number | null;
};

type ReceiptData = {
  id: string;
  orderNumber: number;
  status: string;
  paidAt: string;
  totalCents: number;
  currency: string;
  tableLabel: string;
  paymentMethod: 'ONLINE' | 'PAY_AT_RESTAURANT' | null;
  collectionMethod: 'CASH' | 'CARD' | 'OTHER' | null;
  items: ReceiptItem[];
};

const rangeOptions: RangeKey[] = ['today', 'week', 'month', 'year', 'custom'];

function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency }).format(cents / 100);
}

function ratePercent(vatRateBps: number) {
  return `${(vatRateBps / 100).toFixed(2).replace(/\.00$/, '')}%`;
}

function paymentLabel(
  method: OrderRow['paymentMethod'],
  collection: OrderRow['collectionMethod'],
  t: (key: string, vars?: Record<string, string | number>) => string
) {
  if (method === 'ONLINE') return t('financials.payment.online');
  if (method === 'PAY_AT_RESTAURANT') {
    if (collection === 'CASH') return t('financials.payment.cash');
    if (collection === 'CARD') return t('financials.payment.card');
    return t('financials.payment.other');
  }
  return t('financials.payment.unknown');
}

export default function FinancialsPage({ params }: { params: { restaurantId: string } }) {
  const { t } = useI18n();

  const [range, setRange] = useState<RangeKey>('today');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [appliedCustomFrom, setAppliedCustomFrom] = useState('');
  const [appliedCustomTo, setAppliedCustomTo] = useState('');

  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [orders, setOrders] = useState<OrdersData | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [receiptError, setReceiptError] = useState<string | null>(null);

  const rangeQuery = useMemo(() => {
    if (range === 'custom') {
      if (!appliedCustomFrom || !appliedCustomTo) return null;
      return `range=custom&from=${appliedCustomFrom}&to=${appliedCustomTo}`;
    }
    return `range=${range}`;
  }, [range, appliedCustomFrom, appliedCustomTo]);

  const loadSummary = useCallback(async () => {
    if (!rangeQuery) return;
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/restaurants/${params.restaurantId}/finance/summary?${rangeQuery}`,
        { credentials: 'include', cache: 'no-store' }
      );

      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? t('financials.error.loadSummary'));
      setSummary(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('financials.error.loadSummary'));
    } finally {
      setLoading(false);
    }
  }, [rangeQuery, params.restaurantId, t]);

  const loadOrders = useCallback(
    async (targetPage: number) => {
      if (!rangeQuery) return;
      try {
        const response = await fetch(
          `/api/restaurants/${params.restaurantId}/finance/orders?${rangeQuery}&page=${targetPage}`,
          { credentials: 'include', cache: 'no-store' }
        );

        const json = await response.json();
        if (!response.ok) throw new Error(json.error ?? t('financials.error.loadOrders'));
        setOrders(json);
      } catch (err) {
        console.error('Finance orders error:', err);
      }
    },
    [rangeQuery, params.restaurantId, t]
  );

  useEffect(() => {
    setPage(1);
    void loadSummary();
    void loadOrders(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rangeQuery]);

  useEffect(() => {
    void loadOrders(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function openReceipt(orderId: string) {
    try {
      setReceiptLoading(true);
      setReceiptError(null);
      setReceipt(null);

      const response = await fetch(
        `/api/restaurants/${params.restaurantId}/finance/orders/${orderId}`,
        { credentials: 'include', cache: 'no-store' }
      );

      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? t('financials.error.loadReceipt'));
      setReceipt(json);
    } catch (err) {
      setReceiptError(err instanceof Error ? err.message : t('financials.error.loadReceipt'));
    } finally {
      setReceiptLoading(false);
    }
  }

  async function downloadExport(kind: 'csv' | 'pdf' | 'tax-report') {
    if (!rangeQuery) return;

    const path = kind === 'csv' ? 'export/csv' : kind === 'pdf' ? 'export/pdf' : 'export/tax-report';

    const response = await fetch(
      `/api/restaurants/${params.restaurantId}/finance/${path}?${rangeQuery}`,
      { credentials: 'include' }
    );

    if (!response.ok) return;

    const blob = await response.blob();
    const disposition = response.headers.get('Content-Disposition') ?? '';
    const match = disposition.match(/filename="(.+?)"/);
    const filename = match ? match[1] : `export.${kind === 'pdf' ? 'pdf' : 'csv'}`;

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function applyCustomRange() {
    if (!customFrom || !customTo) return;
    setAppliedCustomFrom(customFrom);
    setAppliedCustomTo(customTo);
  }

  const vatRates = summary
    ? Object.keys(summary.vatBreakdown)
        .map(Number)
        .sort((a, b) => a - b)
    : [];

  if (loading && !summary) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm text-ink/50">{t('financials.loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-ink/40">{t('financials.eyebrow')}</p>
          <h1 className="font-display text-4xl mt-1">{t('financials.title')}</h1>
          <p className="text-sm text-ink/50 mt-2">{t('financials.subtitle')}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {rangeOptions.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setRange(option)}
              className={`px-3 py-2 text-xs border transition ${
                range === option ? 'border-ink bg-ink text-paper' : 'border-line text-ink/60 hover:text-ink'
              }`}
            >
              {t(`financials.range.${option}`)}
            </button>
          ))}
        </div>
      </div>

      {range === 'custom' && (
        <div className="flex flex-wrap items-end gap-3 border border-line p-4">
          <div>
            <label className="text-[10px] uppercase tracking-[0.15em] text-ink/40 block mb-1">
              {t('financials.custom.from')}
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
              {t('financials.custom.to')}
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
            onClick={applyCustomRange}
            className="px-4 py-2 text-xs border border-ink bg-ink text-paper"
          >
            {t('financials.custom.apply')}
          </button>
        </div>
      )}

      {error && (
        <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {summary && (
        <>
          {/* KPIS */}
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="border border-line p-5">
              <p className="text-[10px] uppercase tracking-[0.15em] text-ink/40">
                {t('financials.kpi.revenue')}
              </p>
              <p className="font-display text-3xl mt-2">
                {formatMoney(summary.totalRevenueCents, summary.range.currency)}
              </p>
            </div>
            <div className="border border-line p-5">
              <p className="text-[10px] uppercase tracking-[0.15em] text-ink/40">
                {t('financials.kpi.orders')}
              </p>
              <p className="font-display text-3xl mt-2">{summary.orderCount}</p>
            </div>
            <div className="border border-line p-5">
              <p className="text-[10px] uppercase tracking-[0.15em] text-ink/40">
                {t('financials.kpi.averageOrder')}
              </p>
              <p className="font-display text-3xl mt-2">
                {formatMoney(summary.averageOrderCents, summary.range.currency)}
              </p>
            </div>
          </section>

          {/* EXPORTS */}
          <section className="border border-line p-5">
            <p className="text-[10px] uppercase tracking-[0.15em] text-ink/40">
              {t('financials.export.title')}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void downloadExport('csv')}
                className="px-4 py-2 text-xs border border-line hover:border-ink transition"
              >
                {t('financials.export.csv')}
              </button>
              <button
                type="button"
                onClick={() => void downloadExport('pdf')}
                className="px-4 py-2 text-xs border border-line hover:border-ink transition"
              >
                {t('financials.export.pdf')}
              </button>
              <button
                type="button"
                onClick={() => void downloadExport('tax-report')}
                className="px-4 py-2 text-xs border border-line hover:border-ink transition"
              >
                {t('financials.export.taxReport')}
              </button>
            </div>
            <p className="text-[10px] text-ink/35 mt-3">{t('financials.export.taxReportHint')}</p>
          </section>

          {/* VAT BREAKDOWN */}
          <section className="border border-line p-5">
            <p className="text-[10px] uppercase tracking-[0.15em] text-ink/40">{t('financials.vat.title')}</p>
            <h2 className="font-display text-2xl mt-1">{t('financials.vat.subtitle')}</h2>

            {vatRates.length === 0 ? (
              <p className="text-sm text-ink/40 mt-6">{t('financials.vat.empty')}</p>
            ) : (
              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[480px] text-left">
                  <thead>
                    <tr className="border-b border-line text-[10px] uppercase tracking-[0.12em] text-ink/35">
                      <th className="pb-3 pr-4 font-normal">{t('financials.vat.rate')}</th>
                      <th className="pb-3 px-3 font-normal">{t('financials.vat.base')}</th>
                      <th className="pb-3 px-3 font-normal">{t('financials.vat.amount')}</th>
                      <th className="pb-3 px-3 font-normal">{t('financials.vat.total')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vatRates.map((rate) => {
                      const entry = summary.vatBreakdown[rate];
                      return (
                        <tr key={rate} className="border-b border-line last:border-b-0">
                          <td className="py-3 pr-4 text-sm">{ratePercent(rate)}</td>
                          <td className="py-3 px-3 text-sm">
                            {formatMoney(entry.baseCents, summary.range.currency)}
                          </td>
                          <td className="py-3 px-3 text-sm">
                            {formatMoney(entry.vatCents, summary.range.currency)}
                          </td>
                          <td className="py-3 px-3 text-sm font-medium">
                            {formatMoney(entry.baseCents + entry.vatCents, summary.range.currency)}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="font-medium">
                      <td className="py-3 pr-4 text-sm">{t('financials.vat.grandTotal')}</td>
                      <td className="py-3 px-3 text-sm">
                        {formatMoney(summary.baseTotalCents, summary.range.currency)}
                      </td>
                      <td className="py-3 px-3 text-sm">
                        {formatMoney(summary.vatTotalCents, summary.range.currency)}
                      </td>
                      <td className="py-3 px-3 text-sm">
                        {formatMoney(
                          summary.baseTotalCents + summary.vatTotalCents,
                          summary.range.currency
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {summary.untrackedRevenueCents > 0 && (
              <div className="mt-5 border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
                {t('financials.untracked.note', {
                  amount: formatMoney(summary.untrackedRevenueCents, summary.range.currency),
                })}
              </div>
            )}
          </section>

          {/* ORDERS TABLE */}
          <section className="border border-line p-5">
            <h2 className="font-display text-2xl">{t('financials.orders.title')}</h2>

            {!orders || orders.orders.length === 0 ? (
              <p className="text-sm text-ink/40 mt-6">{t('financials.orders.empty')}</p>
            ) : (
              <>
                <div className="mt-5 overflow-x-auto">
                  <table className="w-full min-w-[680px] text-left">
                    <thead>
                      <tr className="border-b border-line text-[10px] uppercase tracking-[0.12em] text-ink/35">
                        <th className="pb-3 pr-4 font-normal">{t('financials.orders.date')}</th>
                        <th className="pb-3 px-3 font-normal">{t('financials.orders.order')}</th>
                        <th className="pb-3 px-3 font-normal">{t('financials.orders.table')}</th>
                        <th className="pb-3 px-3 font-normal">{t('financials.orders.items')}</th>
                        <th className="pb-3 px-3 font-normal">{t('financials.orders.payment')}</th>
                        <th className="pb-3 px-3 font-normal text-right">{t('financials.orders.total')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.orders.map((order) => (
                        <tr
                          key={order.id}
                          onClick={() => void openReceipt(order.id)}
                          className="border-b border-line last:border-b-0 cursor-pointer hover:bg-ink/[0.02]"
                        >
                          <td className="py-3 pr-4 text-sm">
                            {new Date(order.paidAt).toLocaleString([], {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </td>
                          <td className="py-3 px-3 text-sm">#{order.orderNumber}</td>
                          <td className="py-3 px-3 text-sm">{order.tableLabel}</td>
                          <td className="py-3 px-3 text-sm">{order.itemCount}</td>
                          <td className="py-3 px-3 text-sm">
                            {paymentLabel(order.paymentMethod, order.collectionMethod, t)}
                          </td>
                          <td className="py-3 px-3 text-sm text-right font-medium">
                            {formatMoney(order.totalCents, order.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {orders.totalPages > 1 && (
                  <div className="mt-5 flex items-center justify-between text-xs text-ink/50">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1.5 border border-line disabled:opacity-30"
                    >
                      {t('financials.orders.prev')}
                    </button>
                    <span>
                      {t('financials.orders.page', { page: orders.page, totalPages: orders.totalPages })}
                    </span>
                    <button
                      type="button"
                      disabled={page >= orders.totalPages}
                      onClick={() => setPage((p) => Math.min(orders.totalPages, p + 1))}
                      className="px-3 py-1.5 border border-line disabled:opacity-30"
                    >
                      {t('financials.orders.next')}
                    </button>
                  </div>
                )}
              </>
            )}
          </section>

          {/* FOOTER */}
          <div className="pt-2 text-[10px] uppercase tracking-[0.12em] text-ink/30">
            {summary.range.localFrom} → {summary.range.localToExclusive}
            {' · '}
            {summary.range.timezone}
          </div>
        </>
      )}

      {/* RECEIPT MODAL */}
      {(receipt || receiptLoading || receiptError) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => {
            setReceipt(null);
            setReceiptError(null);
          }}
        >
          <div
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto bg-paper p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {receiptLoading && <p className="text-sm text-ink/50">{t('financials.loading')}</p>}

            {receiptError && <p className="text-sm text-red-700">{receiptError}</p>}

            {receipt && (
              <>
                <div className="flex items-start justify-between">
                  <h3 className="font-display text-2xl">
                    {t('financials.receipt.title', { orderNumber: receipt.orderNumber })}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setReceipt(null)}
                    className="text-xs text-ink/40 hover:text-ink"
                  >
                    {t('financials.receipt.close')}
                  </button>
                </div>

                <p className="text-xs text-ink/50 mt-2">
                  {receipt.tableLabel} ·{' '}
                  {new Date(receipt.paidAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  {' · '}
                  {paymentLabel(receipt.paymentMethod, receipt.collectionMethod, t)}
                </p>

                <div className="mt-5 overflow-x-auto">
                  <table className="w-full min-w-[480px] text-left">
                    <thead>
                      <tr className="border-b border-line text-[10px] uppercase tracking-[0.12em] text-ink/35">
                        <th className="pb-2 pr-3 font-normal">{t('financials.receipt.item')}</th>
                        <th className="pb-2 px-2 font-normal">{t('financials.receipt.qty')}</th>
                        <th className="pb-2 px-2 font-normal">{t('financials.receipt.rate')}</th>
                        <th className="pb-2 px-2 font-normal">{t('financials.receipt.base')}</th>
                        <th className="pb-2 px-2 font-normal">{t('financials.receipt.vat')}</th>
                        <th className="pb-2 pl-2 font-normal text-right">
                          {t('financials.receipt.lineTotal')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {receipt.items.map((item) => (
                        <tr key={item.id} className="border-b border-line last:border-b-0">
                          <td className="py-2 pr-3 text-sm">{item.nameSnapshot}</td>
                          <td className="py-2 px-2 text-sm">{item.quantity}</td>
                          <td className="py-2 px-2 text-sm">
                            {item.vatRateBps !== null
                              ? ratePercent(item.vatRateBps)
                              : t('financials.receipt.notTracked')}
                          </td>
                          <td className="py-2 px-2 text-sm">
                            {item.baseCents !== null
                              ? formatMoney(item.baseCents, receipt.currency)
                              : '—'}
                          </td>
                          <td className="py-2 px-2 text-sm">
                            {item.vatCents !== null ? formatMoney(item.vatCents, receipt.currency) : '—'}
                          </td>
                          <td className="py-2 pl-2 text-sm text-right font-medium">
                            {formatMoney(item.lineTotalCents, receipt.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 flex justify-end text-sm font-medium">
                  {formatMoney(receipt.totalCents, receipt.currency)}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
