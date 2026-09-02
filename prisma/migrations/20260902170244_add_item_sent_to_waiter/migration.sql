-- AlterEnum
ALTER TYPE "OrderItemStatus" ADD VALUE 'SENT_TO_WAITER';

-- AlterEnum
ALTER TYPE "OrderEventType" ADD VALUE 'ITEM_SENT_TO_WAITER';

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "sentToWaiterAt" TIMESTAMP(3);
