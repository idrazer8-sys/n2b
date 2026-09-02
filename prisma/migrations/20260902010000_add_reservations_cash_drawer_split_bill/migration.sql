-- AlterTable Restaurant: add reservation buffer setting
ALTER TABLE "Restaurant" ADD COLUMN     "reservationBufferMinutes" INTEGER NOT NULL DEFAULT 15;

-- AlterTable SessionPayment: add cash-split support
ALTER TABLE "SessionPayment" ADD COLUMN     "isSplit" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "cashTenderedCents" INTEGER;

-- CreateEnum
CREATE TYPE "ReservationStatus" AS ENUM ('CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');

-- CreateTable
CREATE TABLE "Reservation" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "tableId" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "partySize" INTEGER NOT NULL,
    "customerName" TEXT,
    "customerPhone" TEXT,
    "notes" TEXT,
    "status" "ReservationStatus" NOT NULL DEFAULT 'CONFIRMED',
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Reservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashDenomination" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "valueCents" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CashDenomination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionPaymentSplit" (
    "id" TEXT NOT NULL,
    "sessionPaymentId" TEXT NOT NULL,
    "personIndex" INTEGER NOT NULL,
    "label" TEXT,
    "shareCents" INTEGER NOT NULL,
    "tenderedCents" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionPaymentSplit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Reservation_restaurantId_idx" ON "Reservation"("restaurantId");

-- CreateIndex
CREATE INDEX "Reservation_tableId_idx" ON "Reservation"("tableId");

-- CreateIndex
CREATE INDEX "Reservation_restaurantId_startsAt_idx" ON "Reservation"("restaurantId", "startsAt");

-- CreateIndex
CREATE UNIQUE INDEX "CashDenomination_restaurantId_valueCents_key" ON "CashDenomination"("restaurantId", "valueCents");

-- CreateIndex
CREATE INDEX "CashDenomination_restaurantId_idx" ON "CashDenomination"("restaurantId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionPaymentSplit_sessionPaymentId_personIndex_key" ON "SessionPaymentSplit"("sessionPaymentId", "personIndex");

-- CreateIndex
CREATE INDEX "SessionPaymentSplit_sessionPaymentId_idx" ON "SessionPaymentSplit"("sessionPaymentId");

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "Table"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashDenomination" ADD CONSTRAINT "CashDenomination_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionPaymentSplit" ADD CONSTRAINT "SessionPaymentSplit_sessionPaymentId_fkey" FOREIGN KEY ("sessionPaymentId") REFERENCES "SessionPayment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
