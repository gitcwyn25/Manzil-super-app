-- CreateEnum
CREATE TYPE "BusinessApplicationStatus" AS ENUM ('draft', 'submitted', 'under_review', 'changes_requested', 'approved', 'rejected', 'withdrawn');

-- CreateTable
CREATE TABLE "BusinessApplication" (
    "id" TEXT NOT NULL,
    "applicantUserId" TEXT NOT NULL,
    "businessId" TEXT,
    "status" "BusinessApplicationStatus" NOT NULL DEFAULT 'draft',
    "name" TEXT NOT NULL,
    "categorySlug" TEXT NOT NULL,
    "descriptionUz" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "city" TEXT NOT NULL DEFAULT 'Tashkent',
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "telegram" TEXT,
    "workingHours" JSONB,
    "acceptedTermsVersion" TEXT,
    "acceptedTermsAt" TIMESTAMP(3),
    "acceptedTermsIp" TEXT,
    "acceptedTermsUserAgent" TEXT,
    "submittedAt" TIMESTAMP(3),
    "reviewedByUserId" TEXT,
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BusinessApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BusinessApplication_businessId_key" ON "BusinessApplication"("businessId");
CREATE INDEX "BusinessApplication_applicantUserId_status_idx" ON "BusinessApplication"("applicantUserId", "status");
CREATE INDEX "BusinessApplication_status_createdAt_idx" ON "BusinessApplication"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "BusinessApplication" ADD CONSTRAINT "BusinessApplication_applicantUserId_fkey" FOREIGN KEY ("applicantUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BusinessApplication" ADD CONSTRAINT "BusinessApplication_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "BusinessApplication" ADD CONSTRAINT "BusinessApplication_reviewedByUserId_fkey" FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
