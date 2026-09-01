-- CreateEnum
CREATE TYPE "AssignmentRole" AS ENUM ('PRIMARY', 'ASSISTING');

-- DropIndex
DROP INDEX "User_email_idx";

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "staffId" TEXT;

-- CreateTable
CREATE TABLE "TableAssignment" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "role" "AssignmentRole" NOT NULL DEFAULT 'PRIMARY',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "assignedBy" TEXT NOT NULL,
    "shiftId" TEXT,

    CONSTRAINT "TableAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TableAssignment_restaurantId_tableId_endedAt_idx" ON "TableAssignment"("restaurantId", "tableId", "endedAt");

-- CreateIndex
CREATE INDEX "TableAssignment_restaurantId_staffId_endedAt_idx" ON "TableAssignment"("restaurantId", "staffId", "endedAt");

-- CreateIndex
CREATE INDEX "Order_restaurantId_staffId_idx" ON "Order"("restaurantId", "staffId");

-- AddForeignKey
ALTER TABLE "TableAssignment" ADD CONSTRAINT "TableAssignment_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TableAssignment" ADD CONSTRAINT "TableAssignment_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TableAssignment" ADD CONSTRAINT "TableAssignment_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "RestaurantStaff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TableAssignment" ADD CONSTRAINT "TableAssignment_assignedBy_fkey" FOREIGN KEY ("assignedBy") REFERENCES "RestaurantStaff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "RestaurantStaff"("id") ON DELETE SET NULL ON UPDATE CASCADE;
