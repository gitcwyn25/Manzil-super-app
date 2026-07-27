import { PrismaClient } from "@prisma/client";
import { config } from "./config.js";

/**
 * Read-only view of the real platform database.
 *
 * The bot reports actual numbers or says it cannot — it never estimates. An
 * admin dashboard that quietly invents figures is worse than one that admits
 * the database is unreachable.
 */
let prisma: PrismaClient | null = null;

function client(): PrismaClient | null {
  if (!config.databaseUrl) return null;
  if (!prisma) prisma = new PrismaClient();
  return prisma;
}

export type PlatformStats = {
  businesses: number;
  claimed: number;
  pendingClaims: number;
  reviews: number;
  customers: number;
  campaigns: number;
};

export async function getPlatformStats(): Promise<PlatformStats | null> {
  const db = client();
  if (!db) return null;

  try {
    const [businesses, claimed, pendingClaims, reviews, customers, campaigns] = await Promise.all([
      db.business.count({ where: { mergedIntoId: null } }),
      db.business.count({ where: { status: "claimed", mergedIntoId: null } }),
      db.claim.count({ where: { status: "pending" } }),
      db.review.count({ where: { moderationStatus: "approved" } }),
      db.customer.count(),
      db.campaign.count()
    ]);

    return { businesses, claimed, pendingClaims, reviews, customers, campaigns };
  } catch {
    return null;
  }
}

export type BusinessSummary = {
  name: string;
  slug: string;
  status: string;
  district: string;
  reviewCount: number;
  avgRating: number;
};

/** Most recently listed businesses, for the admin overview. */
export async function getRecentBusinesses(limit = 8): Promise<BusinessSummary[] | null> {
  const db = client();
  if (!db) return null;

  try {
    const rows = await db.business.findMany({
      where: { mergedIntoId: null },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        name: true,
        slug: true,
        status: true,
        district: true,
        reviewCount: true,
        avgRating: true
      }
    });

    return rows.map((row) => ({ ...row, avgRating: Number(row.avgRating) }));
  } catch {
    return null;
  }
}

/** Businesses awaiting an admin decision. */
export async function getPendingClaims(limit = 8) {
  const db = client();
  if (!db) return null;

  try {
    const rows = await db.claim.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { business: { select: { name: true, district: true, slug: true } } }
    });

    return rows.map((row) => ({
      businessName: row.business.name,
      district: row.business.district,
      slug: row.business.slug,
      createdAt: row.createdAt
    }));
  } catch {
    return null;
  }
}

/** Most recent approved reviews, for the admin overview. */
export async function getRecentReviews(limit = 5) {
  const db = client();
  if (!db) return null;

  try {
    const rows = await db.review.findMany({
      where: { moderationStatus: "approved" },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { business: { select: { name: true } } }
    });

    return rows.map((row) => ({
      businessName: row.business.name,
      rating: row.rating,
      text: row.text,
      createdAt: row.createdAt
    }));
  } catch {
    return null;
  }
}

/**
 * Looks up a business by name or phone, for the public "my status" flow.
 *
 * Returns only what the enquirer is entitled to see — name, district, status —
 * and never the owner's contact details, since anyone can type any name here.
 */
export async function findBusinessForStatus(query: string): Promise<BusinessSummary | null> {
  const db = client();
  if (!db) return null;

  const trimmed = query.trim();
  if (trimmed.length < 2) return null;

  try {
    const row = await db.business.findFirst({
      where: {
        mergedIntoId: null,
        OR: [
          { name: { contains: trimmed, mode: "insensitive" } },
          { phone: { contains: trimmed.replace(/[^\d]/g, "") } }
        ]
      },
      select: {
        name: true,
        slug: true,
        status: true,
        district: true,
        reviewCount: true,
        avgRating: true
      }
    });

    return row ? { ...row, avgRating: Number(row.avgRating) } : null;
  } catch {
    return null;
  }
}

export async function disconnect(): Promise<void> {
  await prisma?.$disconnect();
}
