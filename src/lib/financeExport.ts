import 'server-only';
import type { FinanceOrderRow, FinanceSummary } from './finance';
import { extractVat } from './pricing';

function csvCell(value: string | number): string {
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function csvRow(cells: Array<string | number>): string {
  return cells.map(csvCell).join(',') + '\r\n';
}

function money(cents: number): string {
  return (cents / 100).toFixed(2);
}

function ratePercent(vatRateBps: number | null): string {
  if (vatRateBps === null) return 'not tracked';
  return `${(vatRateBps / 100).toFixed(2)}%`;
}

/**
 * One row per order line — date, order ID, the line item, its VAT rate,
 * taxable base, VAT, line total, and the order's payment method.
 */
export function buildOrdersCsv(orders: FinanceOrderRow[]): string {
  let csv = csvRow([
    'Date',
    'Order ID',
    'Order number',
    'Table',
    'Item',
    'Quantity',
    'Unit price',
    'VAT rate',
    'Taxable base',
    'VAT',
    'Line total',
    'Payment method',
  ]);

  for (const order of orders) {
    const method =
      order.paymentMethod === 'ONLINE'
        ? 'Online'
        : order.paymentMethod === 'PAY_AT_RESTAURANT'
          ? `Pay at restaurant (${order.collectionMethod ?? 'unspecified'})`
          : 'Unknown';

    for (const item of order.items) {
      const rate = item.vatRateBpsSnapshot;
      const split = rate !== null ? extractVat(item.lineTotalCents, rate) : null;

      csv += csvRow([
        order.paidAt.toISOString(),
        order.id,
        order.orderNumber,
        order.tableLabel,
        item.nameSnapshot,
        item.quantity,
        money(item.unitPriceCents),
        ratePercent(rate),
        split ? money(split.baseCents) : 'not tracked',
        split ? money(split.vatCents) : 'not tracked',
        money(item.lineTotalCents),
        method,
      ]);
    }
  }

  return csv;
}

/**
 * The structured Tax Report: taxable base + VAT grouped by rate, plus a
 * grand total — the figures an accountant needs for a quarterly VAT
 * filing. This is NOT an official AEAT-format document; it's a clean,
 * importable summary for a human (or their software) to work from.
 */
export function buildTaxReportCsv(
  summary: FinanceSummary,
  currency: string,
  periodLabel: string
): string {
  let csv = csvRow(['Not2Busy — Tax report (accountant working document, not an official AEAT filing)']);
  csv += csvRow(['Period', periodLabel]);
  csv += csvRow(['Currency', currency]);
  csv += csvRow([]);
  csv += csvRow(['VAT rate', 'Taxable base', 'VAT amount', 'Total (base + VAT)']);

  const rates = Object.keys(summary.vatBreakdown)
    .map(Number)
    .sort((a, b) => a - b);

  for (const rate of rates) {
    const entry = summary.vatBreakdown[rate];
    csv += csvRow([
      ratePercent(rate),
      money(entry.baseCents),
      money(entry.vatCents),
      money(entry.baseCents + entry.vatCents),
    ]);
  }

  csv += csvRow([]);
  csv += csvRow(['Grand total', money(summary.baseTotalCents), money(summary.vatTotalCents), money(summary.baseTotalCents + summary.vatTotalCents)]);

  if (summary.untrackedRevenueCents > 0) {
    csv += csvRow([]);
    csv += csvRow([
      'Note',
      `${money(summary.untrackedRevenueCents)} ${currency} of revenue in this period predates VAT tracking and is excluded above — not fabricated into a rate.`,
    ]);
  }

  return csv;
}
