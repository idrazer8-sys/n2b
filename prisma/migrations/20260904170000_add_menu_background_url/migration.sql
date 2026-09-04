-- Nullable, no default: every existing restaurant keeps its current solid
-- background (--color-paper) unchanged until they opt into a photo one.
ALTER TABLE "Restaurant" ADD COLUMN "menuBackgroundUrl" TEXT;
