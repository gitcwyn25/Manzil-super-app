-- CreateEnum
CREATE TYPE "LegalDocumentKind" AS ENUM ('terms_of_service', 'privacy_policy', 'contract_template');

-- AlterTable
ALTER TABLE "Business" ADD COLUMN     "claimedAt" TIMESTAMP(3),
ADD COLUMN     "featured" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "bookingId" TEXT;

-- CreateTable
CREATE TABLE "ReviewHelpfulVote" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewHelpfulVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalDocument" (
    "id" TEXT NOT NULL,
    "kind" "LegalDocumentKind" NOT NULL,
    "version" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'uz',
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalAcceptance" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,

    CONSTRAINT "LegalAcceptance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "contractNo" TEXT NOT NULL,
    "renderedBody" TEXT NOT NULL,
    "storageKey" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReviewHelpfulVote_userId_idx" ON "ReviewHelpfulVote"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewHelpfulVote_reviewId_userId_key" ON "ReviewHelpfulVote"("reviewId", "userId");

-- CreateIndex
CREATE INDEX "LegalDocument_kind_publishedAt_idx" ON "LegalDocument"("kind", "publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "LegalDocument_kind_version_locale_key" ON "LegalDocument"("kind", "version", "locale");

-- CreateIndex
CREATE INDEX "LegalAcceptance_businessId_acceptedAt_idx" ON "LegalAcceptance"("businessId", "acceptedAt");

-- CreateIndex
CREATE INDEX "LegalAcceptance_documentId_idx" ON "LegalAcceptance"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "LegalAcceptance_businessId_documentId_key" ON "LegalAcceptance"("businessId", "documentId");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_contractNo_key" ON "Contract"("contractNo");

-- CreateIndex
CREATE INDEX "Contract_businessId_generatedAt_idx" ON "Contract"("businessId", "generatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Review_bookingId_key" ON "Review"("bookingId");

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewHelpfulVote" ADD CONSTRAINT "ReviewHelpfulVote_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewHelpfulVote" ADD CONSTRAINT "ReviewHelpfulVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalAcceptance" ADD CONSTRAINT "LegalAcceptance_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalAcceptance" ADD CONSTRAINT "LegalAcceptance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalAcceptance" ADD CONSTRAINT "LegalAcceptance_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "LegalDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "LegalDocument"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
