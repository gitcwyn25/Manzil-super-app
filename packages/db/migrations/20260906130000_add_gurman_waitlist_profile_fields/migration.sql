-- Add optional profile, intent, referral, and legal-consent data for Gurman Mobile waitlist signups.
ALTER TABLE "WaitlistSignup"
  ADD COLUMN "firstName" TEXT,
  ADD COLUMN "lastName" TEXT,
  ADD COLUMN "purpose" TEXT,
  ADD COLUMN "heardFrom" TEXT,
  ADD COLUMN "acceptedLegalAt" TIMESTAMP(3);
