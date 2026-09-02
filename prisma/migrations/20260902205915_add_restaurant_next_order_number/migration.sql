-- Atomic per-restaurant order-number counter, replacing the
-- read-MAX-then-insert pattern that raced under concurrent order creation.
ALTER TABLE "Restaurant" ADD COLUMN "nextOrderNumber" INTEGER NOT NULL DEFAULT 1001;

-- Backfill existing restaurants so the counter continues after whatever
-- orders they already have, instead of colliding with them.
UPDATE "Restaurant" r
SET "nextOrderNumber" = COALESCE(
  (SELECT MAX(o."orderNumber") + 1 FROM "Order" o WHERE o."restaurantId" = r.id),
  1001
);
