-- Aligns the hand-written M0 migration with Prisma-canonical output.
-- `updatedAt` is maintained client-side by @updatedAt; the database-level
-- default was never intended and makes `migrate diff` report drift forever.
ALTER TABLE "Customer" ALTER COLUMN "updatedAt" DROP DEFAULT;
