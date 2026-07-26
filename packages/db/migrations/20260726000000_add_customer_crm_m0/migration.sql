-- M0 CRM foundation: first-class per-business customers.
-- Backfill is handled by packages/db/scripts/backfill-customers.ts so phone
-- canonicalization and ambiguous rows can be reviewed before linking bookings.

CREATE TABLE "Customer" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "userId" TEXT,
  "phone" TEXT NOT NULL,
  "name" TEXT,
  "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastVisitAt" TIMESTAMP(3),
  "visitCount" INTEGER NOT NULL DEFAULT 0,
  "totalSpend" DECIMAL(14,2) NOT NULL DEFAULT 0,
  "loyaltyPoints" INTEGER NOT NULL DEFAULT 0,
  "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "notes" TEXT,
  "consentMarketing" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CustomerVisit" (
  "id" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "bookingId" TEXT,
  "source" TEXT NOT NULL DEFAULT 'booking_backfill',
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CustomerVisit_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Booking" ADD COLUMN "customerId" TEXT;

CREATE UNIQUE INDEX "Customer_businessId_phone_key" ON "Customer"("businessId", "phone");
CREATE INDEX "Customer_businessId_lastVisitAt_idx" ON "Customer"("businessId", "lastVisitAt");
CREATE INDEX "Customer_businessId_tags_idx" ON "Customer"("businessId", "tags");
CREATE INDEX "Customer_userId_idx" ON "Customer"("userId");
CREATE UNIQUE INDEX "CustomerVisit_bookingId_key" ON "CustomerVisit"("bookingId");
CREATE INDEX "CustomerVisit_businessId_occurredAt_idx" ON "CustomerVisit"("businessId", "occurredAt");
CREATE INDEX "CustomerVisit_customerId_occurredAt_idx" ON "CustomerVisit"("customerId", "occurredAt");
CREATE INDEX "Booking_customerId_idx" ON "Booking"("customerId");

ALTER TABLE "Customer"
  ADD CONSTRAINT "Customer_businessId_fkey"
  FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Customer"
  ADD CONSTRAINT "Customer_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CustomerVisit"
  ADD CONSTRAINT "CustomerVisit_businessId_fkey"
  FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CustomerVisit"
  ADD CONSTRAINT "CustomerVisit_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CustomerVisit"
  ADD CONSTRAINT "CustomerVisit_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Booking"
  ADD CONSTRAINT "Booking_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
