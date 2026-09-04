-- Poster mode: manual drag-to-position layout for the customer menu,
-- as an alternative to the default reflowing list. Defaults reproduce
-- today's hardcoded List-mode background treatment exactly, so no
-- existing restaurant's rendering changes.
ALTER TABLE "Restaurant" ADD COLUMN "menuLayoutMode" TEXT NOT NULL DEFAULT 'LIST';
ALTER TABLE "Restaurant" ADD COLUMN "menuBackgroundBlur" INTEGER NOT NULL DEFAULT 18;
ALTER TABLE "Restaurant" ADD COLUMN "menuBackgroundTint" DOUBLE PRECISION NOT NULL DEFAULT 0.55;
ALTER TABLE "Restaurant" ADD COLUMN "menuFontScale" TEXT NOT NULL DEFAULT 'medium';

-- Normalized (0-1) position on the poster canvas. Null = unplaced.
ALTER TABLE "MenuItem" ADD COLUMN "posterX" DOUBLE PRECISION;
ALTER TABLE "MenuItem" ADD COLUMN "posterY" DOUBLE PRECISION;
