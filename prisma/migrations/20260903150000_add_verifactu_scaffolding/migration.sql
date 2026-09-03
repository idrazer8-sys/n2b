-- Phase 2: VeriFactu-readiness scaffolding.
-- Nothing in the app writes to OrderCorrection or FinancialRecordHash yet;
-- these exist so the append-only pattern is available from day one for
-- whichever feature builds on it next.

ALTER TABLE "Restaurant" ADD COLUMN "taxId" TEXT;

CREATE TABLE "OrderCorrection" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "correctedSubtotalCents" INTEGER NOT NULL,
    "correctedTaxCents" INTEGER NOT NULL,
    "correctedTotalCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdByUserId" TEXT NOT NULL,

    CONSTRAINT "OrderCorrection_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OrderCorrection_orderId_idx" ON "OrderCorrection"("orderId");

ALTER TABLE "OrderCorrection" ADD CONSTRAINT "OrderCorrection_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "OrderCorrection" ADD CONSTRAINT "OrderCorrection_createdByUserId_fkey"
    FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TYPE "FinancialRecordType" AS ENUM ('ORDER', 'CORRECTION');

CREATE TABLE "FinancialRecordHash" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "sequenceNumber" INTEGER NOT NULL,
    "recordType" "FinancialRecordType" NOT NULL,
    "orderId" TEXT,
    "orderCorrectionId" TEXT,
    "recordHash" TEXT NOT NULL,
    "previousHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinancialRecordHash_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FinancialRecordHash_orderCorrectionId_key" ON "FinancialRecordHash"("orderCorrectionId");
CREATE UNIQUE INDEX "FinancialRecordHash_restaurantId_sequenceNumber_key" ON "FinancialRecordHash"("restaurantId", "sequenceNumber");
CREATE INDEX "FinancialRecordHash_restaurantId_idx" ON "FinancialRecordHash"("restaurantId");
CREATE INDEX "FinancialRecordHash_orderId_idx" ON "FinancialRecordHash"("orderId");

ALTER TABLE "FinancialRecordHash" ADD CONSTRAINT "FinancialRecordHash_restaurantId_fkey"
    FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FinancialRecordHash" ADD CONSTRAINT "FinancialRecordHash_orderId_fkey"
    FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "FinancialRecordHash" ADD CONSTRAINT "FinancialRecordHash_orderCorrectionId_fkey"
    FOREIGN KEY ("orderCorrectionId") REFERENCES "OrderCorrection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
