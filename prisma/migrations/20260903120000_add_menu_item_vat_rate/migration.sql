-- Per-item VAT rate (basis points) — see the doc comments on MenuCategory
-- .defaultVatRateBps, MenuItem.vatRateBps, and OrderItem.vatRateBpsSnapshot
-- in schema.prisma for the full reasoning.

-- Optional category-level default. Nullable — no default set yet for any
-- existing category.
ALTER TABLE "MenuCategory" ADD COLUMN "defaultVatRateBps" INTEGER;

-- Every existing menu item gets Spain's reduced hostelry rate (10%) as a
-- starting point — a sensible default, not a guess about any specific
-- item's real classification. Restaurants should review and correct this
-- per item.
ALTER TABLE "MenuItem" ADD COLUMN "vatRateBps" INTEGER NOT NULL DEFAULT 1000;

-- Snapshot on OrderItem — deliberately NULLABLE with NO backfill for
-- existing rows. NULL means "this order predates VAT tracking" and must be
-- reported as such, never fabricated as if some rate had applied.
ALTER TABLE "OrderItem" ADD COLUMN "vatRateBpsSnapshot" INTEGER;
