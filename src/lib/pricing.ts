import 'server-only';
import { db } from './db';

// ----------------------------------------------------------------------------
// THE single source of truth for what an order costs. The browser sends only
// { menuItemId, quantity, selectedOptionIds[], notes }. Every price shown to
// the customer before this point is a preview — this function is what
// actually gets charged, and it re-reads every price from the database.
// Never trust price/subtotal/total fields if a client ever sends them.
// ----------------------------------------------------------------------------

export type CartLineInput = {
  menuItemId: string;
  quantity: number;
  selectedOptionIds: string[];
  notes?: string;
};

export class PricingError extends Error {
  constructor(message: string, public code: string) {
    super(message);
  }
}

/**
 * Splits a tax-INCLUSIVE amount into its taxable base and VAT portion.
 * Menu prices already include VAT (this is what's actually charged to the
 * customer and never changes based on this split) — this just answers "how
 * much of that price was VAT," using the standard extract-from-gross
 * formula: base = gross / (1 + rate), vat = gross - base.
 *
 * `vatRateBps` is basis points (1000 = 10.00%). Rounds to the nearest cent
 * on the base, then derives vat as the exact residual — this guarantees
 * baseCents + vatCents === inclusiveCents for every single call, with no
 * rounding drift, which is what lets callers sum many lines' base/vat
 * separately and still have them add up to the grand total exactly.
 */
export function extractVat(
  inclusiveCents: number,
  vatRateBps: number
): { baseCents: number; vatCents: number } {
  if (vatRateBps <= 0) {
    return { baseCents: inclusiveCents, vatCents: 0 };
  }

  const baseCents = Math.round((inclusiveCents * 10000) / (10000 + vatRateBps));
  const vatCents = inclusiveCents - baseCents;
  return { baseCents, vatCents };
}

/** Per-rate totals, keyed by vatRateBps (not percentage — see extractVat). */
export type VatBreakdown = Record<number, { baseCents: number; vatCents: number }>;

export async function priceCart(restaurantId: string, lines: CartLineInput[]) {
  if (lines.length === 0) {
    throw new PricingError('Cart is empty', 'EMPTY_CART');
  }

  let subtotalCents = 0;
  const pricedLines: Array<{
    menuItemId: string;
    nameSnapshot: string;
    quantity: number;
    unitPriceCents: number;
    lineTotalCents: number;
    allergensSnapshot: string[];
    dietaryTagsSnapshot: string[];
    vatRateBpsSnapshot: number;
    notes?: string;
    modifiers: Array<{ modifierOptionId: string; nameSnapshot: string; priceDeltaCentsSnapshot: number }>;
  }> = [];

  for (const line of lines) {
    if (!Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 50) {
      throw new PricingError('Invalid quantity', 'INVALID_QUANTITY');
    }

    // Scoped by restaurantId — a menuItemId from restaurant B can never be
    // priced/ordered through restaurant A's cart, even if the client sends
    // it deliberately.
    const item = await db.menuItem.findFirst({
      where: { id: line.menuItemId, restaurantId },
      include: { modifiers: { include: { options: true } } },
    });

    if (!item) throw new PricingError('Menu item not found', 'ITEM_NOT_FOUND');
    if (!item.isAvailable) throw new PricingError(`"${item.name}" is currently unavailable`, 'ITEM_UNAVAILABLE');

    let unitPriceCents = item.priceCents;
    const modifierSnapshots: Array<{ modifierOptionId: string; nameSnapshot: string; priceDeltaCentsSnapshot: number }> = [];

    // Validate selected options against each modifier group's own rules
    // (required / min / max / single-vs-multiple) — server-side, every time.
    for (const group of item.modifiers) {
      const selectedInGroup = group.options.filter((o) => line.selectedOptionIds.includes(o.id));

      if (group.isRequired && selectedInGroup.length === 0) {
        throw new PricingError(`"${group.name}" is required for "${item.name}"`, 'MODIFIER_REQUIRED');
      }
      if (group.selectionType === 'SINGLE' && selectedInGroup.length > 1) {
        throw new PricingError(`"${group.name}" only allows one choice`, 'MODIFIER_SINGLE_VIOLATION');
      }
      if (group.minSelect && selectedInGroup.length < group.minSelect) {
        throw new PricingError(`Select at least ${group.minSelect} option(s) for "${group.name}"`, 'MODIFIER_MIN_VIOLATION');
      }
      if (group.maxSelect != null && selectedInGroup.length > group.maxSelect) {
        throw new PricingError(`Select at most ${group.maxSelect} option(s) for "${group.name}"`, 'MODIFIER_MAX_VIOLATION');
      }

      for (const opt of selectedInGroup) {
        if (!opt.isAvailable) throw new PricingError(`"${opt.name}" is currently unavailable`, 'OPTION_UNAVAILABLE');
        unitPriceCents += opt.priceDeltaCents;
        modifierSnapshots.push({
          modifierOptionId: opt.id,
          nameSnapshot: opt.name,
          priceDeltaCentsSnapshot: opt.priceDeltaCents,
        });
      }
    }

    // Reject any selected option id that didn't belong to ANY of this item's
    // modifier groups — catches a client trying to splice in an option from
    // a different (possibly cheaper-modified) item.
    const validOptionIds = new Set(item.modifiers.flatMap((g) => g.options.map((o) => o.id)));
    for (const id of line.selectedOptionIds) {
      if (!validOptionIds.has(id)) {
        throw new PricingError('Invalid modifier option for this item', 'OPTION_NOT_FOUND');
      }
    }

    const lineTotalCents = unitPriceCents * line.quantity;
    subtotalCents += lineTotalCents;

    pricedLines.push({
      menuItemId: item.id,
      nameSnapshot: item.name,
      quantity: line.quantity,
      unitPriceCents,
      lineTotalCents,
      allergensSnapshot: item.allergens,
      dietaryTagsSnapshot: item.dietaryTags,
      // Modifiers (e.g. "extra cheese") are taxed at the same rate as the
      // item they modify — a modifier changing an item's tax classification
      // isn't modeled; if that's ever needed, this is where it'd go.
      vatRateBpsSnapshot: item.vatRateBps,
      notes: line.notes?.slice(0, 280),
      modifiers: modifierSnapshots,
    });
  }

  // subtotalCents above is actually the tax-INCLUSIVE amount (what's
  // charged) — extract the VAT breakdown from it per line, per rate, then
  // derive taxCents/totalCents from that so the base+vat=total invariant
  // holds exactly (see extractVat's rounding guarantee).
  const vatBreakdown: VatBreakdown = {};
  let taxCents = 0;

  for (const line of pricedLines) {
    const { baseCents, vatCents } = extractVat(line.lineTotalCents, line.vatRateBpsSnapshot);
    taxCents += vatCents;

    const existing = vatBreakdown[line.vatRateBpsSnapshot];
    vatBreakdown[line.vatRateBpsSnapshot] = {
      baseCents: (existing?.baseCents ?? 0) + baseCents,
      vatCents: (existing?.vatCents ?? 0) + vatCents,
    };
  }

  // subtotalCents currently holds the inclusive total; totalCents (what's
  // actually charged — and what Stripe/cash collection uses) is that same
  // figure, unaffected by VAT accounting, while subtotalCents is redefined
  // to mean the taxable base, matching the Order schema's
  // subtotalCents + taxCents = totalCents invariant.
  const totalCents = subtotalCents;
  subtotalCents = totalCents - taxCents;

  return { pricedLines, subtotalCents, taxCents, totalCents, vatBreakdown };
}
