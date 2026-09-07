-- Add the profile and research fields used by the Gurman waitlist.
-- The guarded table/type creation also repairs environments where WaitlistSignup
-- was previously created by prisma db push but never received a tracked migration.
DO $$
BEGIN
  CREATE TYPE "WaitlistTopic" AS ENUM ('city', 'gurman', 'pro');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "WaitlistSignup" (
  "id" TEXT NOT NULL,
  "topic" "WaitlistTopic" NOT NULL,
  "email" TEXT NOT NULL,
  "locale" TEXT NOT NULL DEFAULT 'uz',
  "city" TEXT,
  "businessName" TEXT,
  "firstName" TEXT,
  "lastName" TEXT,
  "heardAbout" TEXT,
  "featureInterest" TEXT,
  "source" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WaitlistSignup_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "WaitlistSignup" ADD COLUMN IF NOT EXISTS "firstName" TEXT;
ALTER TABLE "WaitlistSignup" ADD COLUMN IF NOT EXISTS "lastName" TEXT;
ALTER TABLE "WaitlistSignup" ADD COLUMN IF NOT EXISTS "heardAbout" TEXT;
ALTER TABLE "WaitlistSignup" ADD COLUMN IF NOT EXISTS "featureInterest" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "WaitlistSignup_topic_email_key"
  ON "WaitlistSignup"("topic", "email");
CREATE INDEX IF NOT EXISTS "WaitlistSignup_topic_createdAt_idx"
  ON "WaitlistSignup"("topic", "createdAt");
CREATE INDEX IF NOT EXISTS "WaitlistSignup_topic_city_idx"
  ON "WaitlistSignup"("topic", "city");
