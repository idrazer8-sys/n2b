-- CreateEnum
CREATE TYPE "OrderItemStatus" AS ENUM ('PENDING', 'SERVED', 'UNAVAILABLE');

-- AlterEnum: add new OrderEvent audit types
ALTER TYPE "OrderEventType" ADD VALUE 'ITEM_SERVED';
ALTER TYPE "OrderEventType" ADD VALUE 'ITEM_UNAVAILABLE';

-- AlterTable: per-item serve/unavailable tracking
ALTER TABLE "OrderItem" ADD COLUMN     "status" "OrderItemStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "servedAt" TIMESTAMP(3),
ADD COLUMN     "unavailableAt" TIMESTAMP(3),
ADD COLUMN     "unavailableNote" TEXT;
