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

const TAX_RATE_BPS = 0; // MVP: menu prices are tax-inclusive (common EU model).
// If you switch to tax-exclusive pricing, set this per-restaurant and apply
// it below instead of leaving it at 0.

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
      notes: line.notes?.slice(0, 280),
      modifiers: modifierSnapshots,
    });
  }

  const taxCents = Math.round((subtotalCents * TAX_RATE_BPS) / 10000);
  const totalCents = subtotalCents + taxCents;

  return { pricedLines, subtotalCents, taxCents, totalCents };
}
