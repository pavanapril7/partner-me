-- CreateEnum
CREATE TYPE "PartnershipRole" AS ENUM ('HELPER', 'OUTLET');

-- CreateEnum
CREATE TYPE "PartnershipStatus" AS ENUM ('PENDING', 'CONTACTED', 'ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "business_ideas" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "images" TEXT[],
    "budgetMin" DOUBLE PRECISION NOT NULL,
    "budgetMax" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_ideas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partnership_requests" (
    "id" TEXT NOT NULL,
    "businessIdeaId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "role" "PartnershipRole" NOT NULL,
    "status" "PartnershipStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "partnership_requests_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "partnership_requests" ADD CONSTRAINT "partnership_requests_businessIdeaId_fkey" FOREIGN KEY ("businessIdeaId") REFERENCES "business_ideas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
