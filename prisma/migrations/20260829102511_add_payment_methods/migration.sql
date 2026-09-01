-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('ONLINE', 'PAY_AT_RESTAURANT');

-- CreateEnum
CREATE TYPE "PaymentCollectionMethod" AS ENUM ('CASH', 'CARD', 'OTHER');

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "collectionMethod" "PaymentCollectionMethod",
ADD COLUMN     "confirmedAt" TIMESTAMP(3),
ADD COLUMN     "confirmedByUserId" TEXT,
ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'ONLINE';

-- AlterTable
ALTER TABLE "SessionPayment" ADD COLUMN     "collectionMethod" "PaymentCollectionMethod",
ADD COLUMN     "confirmedAt" TIMESTAMP(3),
ADD COLUMN     "confirmedByUserId" TEXT,
ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'ONLINE';

-- AlterTable
ALTER TABLE "StripeAccount" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "Payment_confirmedByUserId_idx" ON "Payment"("confirmedByUserId");

-- CreateIndex
CREATE INDEX "SessionPayment_confirmedByUserId_idx" ON "SessionPayment"("confirmedByUserId");

-- AddForeignKey
ALTER TABLE "SessionPayment" ADD CONSTRAINT "SessionPayment_confirmedByUserId_fkey" FOREIGN KEY ("confirmedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_confirmedByUserId_fkey" FOREIGN KEY ("confirmedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
