-- Additive only: identity remains in Supabase; no passwords or existing rows change.
CREATE TYPE "SavedPlaceList" AS ENUM ('favorites', 'want_to_try', 'visited');
CREATE TABLE "SavedPlace" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "businessId" TEXT NOT NULL,
  "listType" "SavedPlaceList" NOT NULL DEFAULT 'favorites',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SavedPlace_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "SavedPlace_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "SavedPlace_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "Business"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "SavedPlace_userId_businessId_listType_key" ON "SavedPlace"("userId", "businessId", "listType");
CREATE INDEX "SavedPlace_userId_createdAt_idx" ON "SavedPlace"("userId", "createdAt");
CREATE INDEX "SavedPlace_businessId_idx" ON "SavedPlace"("businessId");

-- Saved lists are private and accessed only through the authenticated API.
-- Supabase's default public-schema grants must not expose them through PostgREST.
ALTER TABLE "SavedPlace" ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    REVOKE ALL ON TABLE "SavedPlace" FROM anon;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    REVOKE ALL ON TABLE "SavedPlace" FROM authenticated;
  END IF;
END $$;
