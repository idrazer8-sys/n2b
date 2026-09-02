-- CreateEnum
CREATE TYPE "TableShape" AS ENUM ('SQUARE', 'RECT', 'CIRCLE');

-- CreateTable
CREATE TABLE "TableZone" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "x" INTEGER NOT NULL DEFAULT 0,
    "y" INTEGER NOT NULL DEFAULT 0,
    "width" INTEGER NOT NULL DEFAULT 260,
    "height" INTEGER NOT NULL DEFAULT 220,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TableZone_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TableZone_restaurantId_idx" ON "TableZone"("restaurantId");

-- AddForeignKey
ALTER TABLE "TableZone" ADD CONSTRAINT "TableZone_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable Table: add floor-plan position/shape/zone columns
ALTER TABLE "Table" ADD COLUMN     "zoneId" TEXT,
ADD COLUMN     "x" INTEGER,
ADD COLUMN     "y" INTEGER,
ADD COLUMN     "width" INTEGER DEFAULT 88,
ADD COLUMN     "height" INTEGER DEFAULT 88,
ADD COLUMN     "shape" "TableShape" NOT NULL DEFAULT 'SQUARE';

-- CreateIndex
CREATE INDEX "Table_zoneId_idx" ON "Table"("zoneId");

-- AddForeignKey
ALTER TABLE "Table" ADD CONSTRAINT "Table_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "TableZone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable CustomerSession: add partySize column
ALTER TABLE "CustomerSession" ADD COLUMN     "partySize" INTEGER;
