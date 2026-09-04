-- Adds per-item VAT (basis points). The DEFAULT means every existing
-- MenuItem row is backfilled to 1000 (10%) by Postgres itself as part of
-- adding the column — no separate UPDATE needed, and no existing item is
-- left without a rate.
ALTER TABLE "MenuItem" ADD COLUMN "vatRateBps" INTEGER NOT NULL DEFAULT 1000;

-- Nullable, no default: existing OrderItem rows get NULL, meaning "placed
-- before VAT tracking existed" — distinct from a legitimate 0% rate.
ALTER TABLE "OrderItem" ADD COLUMN "vatRateBpsSnapshot" INTEGER;
