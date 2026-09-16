-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('SCHEDULED', 'LIVE', 'CLOSED');

-- CreateTable
CREATE TABLE "Listing" (
    "id" UUID NOT NULL,
    "sellerId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "images" TEXT[],
    "category" TEXT NOT NULL,
    "startingPrice" DECIMAL(65,30) NOT NULL,
    "reservePrice" DECIMAL(65,30),
    "currentHighestBid" DECIMAL(65,30),
    "currentHighestBidderId" TEXT,
    "minIncrement" DECIMAL(65,30) NOT NULL DEFAULT 5,
    "scheduledStartAt" TIMESTAMP(3) NOT NULL,
    "scheduledEndAt" TIMESTAMP(3) NOT NULL,
    "currentEndAt" TIMESTAMP(3) NOT NULL,
    "extensionCount" INTEGER NOT NULL DEFAULT 0,
    "status" "ListingStatus" NOT NULL DEFAULT 'SCHEDULED',
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Listing_sellerId_idx" ON "Listing"("sellerId");

-- CreateIndex
CREATE INDEX "Listing_status_idx" ON "Listing"("status");

-- CreateIndex
CREATE INDEX "Listing_scheduledStartAt_idx" ON "Listing"("scheduledStartAt");

-- CreateIndex
CREATE INDEX "Listing_currentEndAt_idx" ON "Listing"("currentEndAt");

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
