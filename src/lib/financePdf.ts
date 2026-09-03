import 'server-only';
import PDFDocument from 'pdfkit';
import type { FinanceSummary } from './finance';

function money(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency }).format(cents / 100);
}

function ratePercent(vatRateBps: number): string {
  return `${(vatRateBps / 100).toFixed(2)}%`;
}

/**
 * A readable financial report, formatted for printing — the KPIs a
 * manager or accountant would want at a glance for a given period, plus
 * the full VAT-by-rate breakdown.
 */
export function buildFinancialReportPdf(
  summary: FinanceSummary,
  restaurantName: string,
  currency: string,
  periodLabel: string,
  timezone: string
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(20).text(restaurantName, { align: 'left' });
    doc.fontSize(12).fillColor('#666666').text('Financial report', { align: 'left' });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#666666').text(`Period: ${periodLabel}`);
    doc.text(`Timezone: ${timezone}`);
    doc.text(`Generated: ${new Date().toISOString()}`);
    doc.fillColor('#000000');
    doc.moveDown(1.5);

    doc.fontSize(14).text('Summary');
    doc.moveDown(0.5);
    doc.fontSize(11);
    doc.text(`Total revenue: ${money(summary.totalRevenueCents, currency)}`);
    doc.text(`Orders: ${summary.orderCount}`);
    doc.text(`Average order: ${money(summary.averageOrderCents, currency)}`);
    doc.moveDown(1.5);

    doc.fontSize(14).text('VAT breakdown by rate');
    doc.moveDown(0.5);

    const rates = Object.keys(summary.vatBreakdown)
      .map(Number)
      .sort((a, b) => a - b);

    if (rates.length === 0) {
      doc.fontSize(11).fillColor('#666666').text('No VAT-tracked revenue in this period.');
      doc.fillColor('#000000');
    } else {
      const colX = [50, 180, 320, 440];
      const headerY = doc.y;

      doc.fontSize(10).fillColor('#666666');
      doc.text('Rate', colX[0], headerY);
      doc.text('Taxable base', colX[1], headerY);
      doc.text('VAT', colX[2], headerY);
      doc.text('Total', colX[3], headerY);
      doc.fillColor('#000000');
      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#cccccc').stroke();
      doc.moveDown(0.3);

      doc.fontSize(11);
      for (const rate of rates) {
        const entry = summary.vatBreakdown[rate];
        const rowY = doc.y;
        doc.text(ratePercent(rate), colX[0], rowY);
        doc.text(money(entry.baseCents, currency), colX[1], rowY);
        doc.text(money(entry.vatCents, currency), colX[2], rowY);
        doc.text(money(entry.baseCents + entry.vatCents, currency), colX[3], rowY);
        doc.moveDown(0.6);
      }

      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#cccccc').stroke();
      doc.moveDown(0.3);

      const totalY = doc.y;
      doc.font('Helvetica-Bold');
      doc.text('Grand total', colX[0], totalY);
      doc.text(money(summary.baseTotalCents, currency), colX[1], totalY);
      doc.text(money(summary.vatTotalCents, currency), colX[2], totalY);
      doc.text(
        money(summary.baseTotalCents + summary.vatTotalCents, currency),
        colX[3],
        totalY
      );
      doc.font('Helvetica');
    }

    if (summary.untrackedRevenueCents > 0) {
      doc.moveDown(1.5);
      doc.fontSize(10).fillColor('#a15c00');
      doc.text(
        `Note: ${money(summary.untrackedRevenueCents, currency)} of revenue in this period is from orders placed before per-item VAT tracking was introduced. VAT for those orders was not recorded and is not estimated here.`,
        { width: 495 }
      );
      doc.fillColor('#000000');
    }

    doc.moveDown(2);
    doc.fontSize(8).fillColor('#999999').text(
      'This report is generated for internal and accounting reference. It is not an official AEAT-format tax filing document.',
      { width: 495 }
    );

    doc.end();
  });
}
