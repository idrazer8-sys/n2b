-- CreateEnum
CREATE TYPE "MenuCategoryKind" AS ENUM ('FOOD', 'DRINKS', 'DESSERT');

-- AlterTable
ALTER TABLE "MenuCategory" ADD COLUMN     "kitchenKind" "MenuCategoryKind" NOT NULL DEFAULT 'FOOD';
