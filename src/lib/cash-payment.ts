// Pure parsing/validation helpers for the "pay at restaurant, cash" flow —
// extracted out of app/api/public/session/checkout/route.ts and
// app/api/restaurants/[restaurantId]/payment-requests/route.ts so this logic
// (which decides real money amounts: split shares, change owed) is
// unit-testable without spinning up a Next.js request/response cycle.
// No behavior change from the original inline versions — same rules, same
// rounding, same tolerances.

export type CollectionMethod = 'CASH' | 'CARD' | 'OTHER' | null;

export type ParsedSplit = {
  personIndex: number;
  label: string | null;
  shareCents: number;
  tenderedCents: number | null;
};

/**
 * Parses the customer-submitted `splits[]` payload for a cash split bill.
 * Only meaningful when collectionMethod is CASH — any other method (or no
 * splits array) yields an empty result, matching the original inline logic.
 * Silently drops malformed entries (non-object, non-positive shareCents)
 * rather than throwing, since this describes a customer-facing form where a
 * partial/garbled entry shouldn't block the rest of the table's split.
 */
export function parseCashSplits(
  rawSplits: unknown,
  collectionMethod: CollectionMethod
): ParsedSplit[] {
  const entries: unknown[] = Array.isArray(rawSplits) ? rawSplits : [];
  const parsed: ParsedSplit[] = [];

  if (collectionMethod !== 'CASH' || entries.length === 0) {
    return parsed;
  }

  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    if (!entry || typeof entry !== 'object') continue;

    const record = entry as Record<string, unknown>;
    const shareCents = Math.round(Number(record.shareCents));

    const tenderedCentsRaw = record.tenderedCents;
    const tenderedCents: number | null =
      tenderedCentsRaw === undefined ||
      tenderedCentsRaw === null ||
      Number.isNaN(Number(tenderedCentsRaw))
        ? null
        : Math.round(Number(tenderedCentsRaw));

    const label: string | null =
      typeof record.label === 'string' && record.label.trim()
        ? record.label.trim().slice(0, 60)
        : null;

    if (!Number.isFinite(shareCents) || shareCents <= 0) continue;

    parsed.push({ personIndex: index, label, shareCents, tenderedCents });
  }

  return parsed;
}

/** A bill only counts as "split" once there's more than one paying share. */
export function isSplitBill(splits: ParsedSplit[]): boolean {
  return splits.length > 1;
}

/**
 * The single-payer cash-tendered amount — only set for CASH, only for a
 * non-split bill (a split bill's tendered amounts live per-person instead).
 */
export function parseCashTenderedCents(
  rawValue: unknown,
  collectionMethod: CollectionMethod,
  isSplit: boolean
): number | null {
  return collectionMethod === 'CASH' &&
    !isSplit &&
    typeof rawValue === 'number' &&
    Number.isFinite(rawValue)
    ? Math.round(rawValue)
    : null;
}

/**
 * Whether a split bill's shares add up to the actual total, within a small
 * per-person rounding tolerance (splitting an odd total N ways can leave a
 * few cents of rounding slack across people — this isn't a bug to reject,
 * it's arithmetic). An empty split list trivially "matches" since there's
 * nothing to validate.
 */
export function splitsSumMatchesTotal(
  splits: Pick<ParsedSplit, 'shareCents'>[],
  amountCents: number
): boolean {
  if (splits.length === 0) return true;
  const sum = splits.reduce((total, item) => total + item.shareCents, 0);
  return Math.abs(sum - amountCents) <= splits.length;
}

/**
 * Change owed back to the customer for a cash payment — null whenever
 * there's nothing to compute (not cash, or no tendered amount recorded
 * yet). Works for both the single-payer case (pass amountCents as
 * `dueCents`) and each person's share on a split bill (pass shareCents).
 */
export function computeChangeDueCents(
  collectionMethod: CollectionMethod,
  tenderedCents: number | null,
  dueCents: number
): number | null {
  if (collectionMethod !== 'CASH' || tenderedCents === null) return null;
  return tenderedCents - dueCents;
}
