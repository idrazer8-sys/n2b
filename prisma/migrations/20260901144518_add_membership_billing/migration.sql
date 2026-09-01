-- CreateEnum
CREATE TYPE "MembershipTier" AS ENUM ('BASIC', 'PRO', 'BUSINESS');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('INCOMPLETE', 'TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED');

-- AlterTable
ALTER TABLE "Restaurant" DROP COLUMN "platformFeeBps";

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "tier" "MembershipTier",
    "status" "MembershipStatus" NOT NULL DEFAULT 'INCOMPLETE',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "trialEndsAt" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Membership_restaurantId_key" ON "Membership"("restaurantId");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_stripeCustomerId_key" ON "Membership"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_stripeSubscriptionId_key" ON "Membership"("stripeSubscriptionId");

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
