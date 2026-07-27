import { PrismaClient } from "@prisma/client";

/**
 * Deterministic fixtures the specs assert against.
 *
 * Prefixed so they are recognisable in a shared database and can be removed
 * without guessing which rows were the suite's.
 */
export const E2E_BUSINESS_SLUG = "e2e-test-cafe";
export const E2E_CATEGORY_SLUG = "e2e-cafes";
export const E2E_TERMS_VERSION = "e2e-1.0";

export type SeedResult = {
  businessSlug: string;
  businessId: string;
  userId: string;
  termsVersion: string;
};

/**
 * Seeds the minimum state the authenticated specs need:
 *
 *   - a Manzil `User` keyed to the Clerk test user, so `syncUser` (which
 *     upserts by clerkId) reuses this row rather than creating a second one;
 *   - a `claimed` + `verified` business owned by that user, so the dashboard,
 *     review form, and CRM routes all resolve;
 *   - a published terms document, so the registration form renders its version
 *     pin instead of the "no terms published" notice.
 *
 * Idempotent: every write is an upsert, because the suite runs repeatedly and
 * against a shared database as often as a fresh one.
 */
export async function seedE2EData(clerkId: string, email: string): Promise<SeedResult> {
  const prisma = new PrismaClient();

  try {
    const user = await prisma.user.upsert({
      where: { clerkId },
      update: { role: "business_owner" },
      create: {
        clerkId,
        email,
        displayName: "E2E Review Bot",
        locale: "uz",
        role: "business_owner"
      }
    });

    const category = await prisma.category.upsert({
      where: { slug: E2E_CATEGORY_SLUG },
      update: {},
      create: {
        slug: E2E_CATEGORY_SLUG,
        nameUz: "E2E Kafelar",
        nameRu: "E2E Кафе",
        nameEn: "E2E Cafes"
      }
    });

    const business = await prisma.business.upsert({
      where: { slug: E2E_BUSINESS_SLUG },
      update: {
        status: "claimed",
        verificationStatus: "verified",
        claimedByUserId: user.id,
        claimedAt: new Date()
      },
      create: {
        slug: E2E_BUSINESS_SLUG,
        name: "E2E Test Cafe",
        categoryId: category.id,
        descriptionUz: "Avtomatlashtirilgan testlar uchun yaratilgan biznes.",
        address: "Test ko'chasi 1",
        district: "Yunusobod",
        city: "Tashkent",
        status: "claimed",
        verificationStatus: "verified",
        claimedByUserId: user.id,
        createdByUserId: user.id,
        claimedAt: new Date()
      }
    });

    // A published terms version, so the registration spec can assert the
    // version pin rather than skipping.
    await prisma.legalDocument.upsert({
      where: {
        kind_version_locale: {
          kind: "terms_of_service",
          version: E2E_TERMS_VERSION,
          locale: "uz"
        }
      },
      update: { publishedAt: new Date() },
      create: {
        kind: "terms_of_service",
        version: E2E_TERMS_VERSION,
        locale: "uz",
        title: "E2E test shartlari",
        body: "Bu avtomatlashtirilgan testlar uchun hujjat. TODO: LEGAL REVIEW.",
        publishedAt: new Date()
      }
    });

    return {
      businessSlug: business.slug,
      businessId: business.id,
      userId: user.id,
      termsVersion: E2E_TERMS_VERSION
    };
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Removes this run's review so the suite can submit again.
 *
 * `Review` has a unique (businessId, userId), so without this the second run
 * would hit a duplicate constraint and the submission spec would test the
 * conflict path instead of the success path it exists to cover.
 */
export async function resetE2EReviews(): Promise<void> {
  const prisma = new PrismaClient();

  try {
    const business = await prisma.business.findUnique({
      where: { slug: E2E_BUSINESS_SLUG },
      select: { id: true }
    });

    if (business) {
      await prisma.review.deleteMany({ where: { businessId: business.id } });
    }
  } finally {
    await prisma.$disconnect();
  }
}
