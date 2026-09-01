-- CreateEnum
CREATE TYPE "SessionPaymentStatus" AS ENUM ('REQUIRES_PAYMENT', 'PROCESSING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'REFUNDED');

-- AlterTable
ALTER TABLE "CustomerSession" ADD COLUMN     "finalizedAt" TIMESTAMP(3),
ADD COLUMN     "paidAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "paidAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Restaurant" ADD COLUMN     "googleReviewUrl" TEXT;

-- CreateTable
CREATE TABLE "SessionPayment" (
    "id" TEXT NOT NULL,
    "customerSessionId" TEXT NOT NULL,
    "stripeCheckoutSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "status" "SessionPaymentStatus" NOT NULL DEFAULT 'REQUIRES_PAYMENT',
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
    "applicationFeeCents" INTEGER NOT NULL,
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SessionPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SessionPayment_customerSessionId_key" ON "SessionPayment"("customerSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionPayment_stripeCheckoutSessionId_key" ON "SessionPayment"("stripeCheckoutSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "SessionPayment_stripePaymentIntentId_key" ON "SessionPayment"("stripePaymentIntentId");

-- CreateIndex
CREATE INDEX "SessionPayment_customerSessionId_idx" ON "SessionPayment"("customerSessionId");

-- AddForeignKey
ALTER TABLE "SessionPayment" ADD CONSTRAINT "SessionPayment_customerSessionId_fkey" FOREIGN KEY ("customerSessionId") REFERENCES "CustomerSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
