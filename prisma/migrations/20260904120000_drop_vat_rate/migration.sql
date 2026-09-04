-- Reverts the per-item VAT feature (Financial History was removed).
ALTER TABLE "MenuCategory" DROP COLUMN "defaultVatRateBps";
ALTER TABLE "MenuItem" DROP COLUMN "vatRateBps";
ALTER TABLE "OrderItem" DROP COLUMN "vatRateBpsSnapshot";
