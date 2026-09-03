import type {
  Achievement,
  BusinessPlatform,
  Category,
  ClaimStatus,
  CommunityList,
  DiscoverableUser,
  ModerationQueueItem,
  ModerationStatus,
  Occasion,
  ReportStatus,
  Review,
  SocialActivity,
  SubscriptionPlan,
  UserProfile,
  UserRole
} from "@manzil/shared";
import * as mockApi from "./mock-api";
import { API_BASE_URL } from "./api-base-url";
import { idempotencyHeaders } from "./pxs/idempotency";

const useMockData = process.env.NEXT_PUBLIC_USE_MOCK !== "false";

/**
 * The one place a mutating request is built in this module (Epic 17).
 *
 * Every POST below routes through here so the `Idempotency-Key` header is
 * threaded once rather than remembered at each call site — the failure mode
 * with per-call-site headers being that the next POST somebody adds simply
 * forgets it, and nothing catches that in review.
 *
 * `idempotencyKey` is optional and must originate in the browser, carried down
 * from the control the user clicked. A key minted here would be different on
 * every attempt and deduplicate nothing, so when none is supplied the header
 * is omitted rather than fabricated — see `./pxs/idempotency`.
 *
 * Applied to POST only. The admin endpoints below are all POSTs that change
 * state (approve, reject, resolve); a duplicate approve is at best noise in the
 * audit trail and at worst a double state transition.
 */
async function postJson(path: string, body: unknown, idempotencyKey?: string) {
  const { getServerAuthHeaders } = await import("./auth");

  return fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(await getServerAuthHeaders(path)),
      ...idempotencyHeaders(idempotencyKey)
    },
    body: JSON.stringify(body ?? {}),
    cache: "no-store"
  });
}

/**
 * Batched cover-photo lookup, keyed by slug — every list/detail response
 * already has a slug on hand, so nothing else needs to change to join this
 * in. A failed or empty lookup resolves to `{}` rather than throwing: the
 * gradient fallback is the correct rendering either way, so a media outage
 * should not take the businesses list down with it.
 */
/**
 * Approved photos for a business profile gallery.
 *
 * Public and approved-only — the owner-facing endpoint returns pending photos
 * too, which must never reach a visitor. Returns an empty list on any failure
 * so the profile falls back to its gradient tiles rather than erroring.
 */
export async function getBusinessPhotos(slug: string): Promise<string[]> {
  if (useMockData) {
    return [];
  }

  try {
    const response = await fetch(`${API_BASE_URL}/media/businesses/${slug}/photos`, {
      next: { revalidate: 30 }
    });

    if (!response.ok) {
      return [];
    }

    const payload = await response.json();
    const photos = (payload?.data?.photos ?? []) as Array<{ publicUrl: string | null }>;
    return photos.map((photo) => photo.publicUrl).filter((url): url is string => Boolean(url));
  } catch {
    return [];
  }
}

async function fetchBusinessCovers(
slugs: string[]): Promise<Record<string, string>> {
  const uniqueSlugs = [...new Set(slugs.filter(Boolean))];

  if (uniqueSlugs.length === 0) {
    return {};
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/media/business-covers?slugs=${encodeURIComponent(uniqueSlugs.join(","))}`,
      { next: { revalidate: 30 } }
    );

    if (!response.ok) {
      return {};
    }

    const payload = await response.json();
    return (payload?.data?.covers as Record<string, string> | undefined) ?? {};
  } catch {
    return {};
  }
}

function withCovers<T extends { slug: string; coverPhotoUrl?: string | null }>(
  items: T[],
  covers: Record<string, string>
): T[] {
  return items.map((item) => (covers[item.slug] ? { ...item, coverPhotoUrl: covers[item.slug] } : item));
}

export async function getCategories(): Promise<Category[]> {
  if (useMockData) {
    return mockApi.getCategories();
  }

  const { getServerAuthHeaders } = await import("./auth");
  const response = await fetch(`${API_BASE_URL}/categories`, {
    headers: await getServerAuthHeaders("/categories"),
    next: { revalidate: 30 }
  });
  const payload = await response.json();
  return payload.data.categories;
}

export async function getBusinesses(): Promise<BusinessPlatform[]> {
  if (useMockData) {
    return mockApi.getBusinesses();
  }

  const { getServerAuthHeaders } = await import("./auth");
  const response = await fetch(`${API_BASE_URL}/businesses`, {
    headers: await getServerAuthHeaders("/businesses"),
    next: { revalidate: 30 }
  });
  const payload = await response.json();
  const businesses = payload.data.businesses as BusinessPlatform[];
  const covers = await fetchBusinessCovers(businesses.map((business) => business.slug));
  return withCovers(businesses, covers);
}

/**
 * Catalogue search.
 *
 * Degrades to an empty result instead of throwing. Before Epic 00 an API
 * hiccup here took `/discover` down with an unhandled `TypeError: fetch
 * failed` and a hard HTTP 500 — verified locally against a build with the API
 * unreachable. A public browse page must not 500 because a backend blipped:
 * the empty state says "nothing here yet" and offers the next action, which is
 * a page, while a 500 is a dead end that also costs crawl trust.
 *
 * `getHomeFeed` already worked this way; this brings the other public reads in
 * line with it.
 */
export async function searchBusinesses(query = "", category = "all"): Promise<{
  businesses: BusinessPlatform[];
  categories: Category[];
}> {
  if (useMockData) {
    return mockApi.searchBusinesses(query, category);
  }

  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (category && category !== "all") params.set("category", category);
  const suffix = params.size > 0 ? `?${params.toString()}` : "";

  try {
    const { getServerAuthHeaders } = await import("./auth");
    const response = await fetch(`${API_BASE_URL}/search${suffix}`, {
      headers: await getServerAuthHeaders("/search"),
      next: { revalidate: 30 }
    });

    if (!response.ok) {
      return { businesses: [], categories: [] };
    }

    const payload = await response.json();
    const data = payload.data as { businesses: BusinessPlatform[]; categories: Category[] };
    const businesses = data?.businesses ?? [];
    const covers = await fetchBusinessCovers(businesses.map((business) => business.slug));
    return { categories: data?.categories ?? [], businesses: withCovers(businesses, covers) };
  } catch {
    return { businesses: [], categories: [] };
  }
}

export async function getBusiness(slug: string): Promise<{ business: BusinessPlatform; reviews: Review[] }> {
  if (useMockData) {
    return mockApi.getBusiness(slug);
  }

  const { getServerAuthHeaders } = await import("./auth");
  const response = await fetch(`${API_BASE_URL}/businesses/${slug}`, {
    headers: await getServerAuthHeaders(`/businesses/${slug}`),
    next: { revalidate: 30 }
  });
  const payload = await response.json();
  const data = payload.data as { business: BusinessPlatform; reviews: Review[] };

  if (data.business) {
    const covers = await fetchBusinessCovers([data.business.slug]);
    const [business] = withCovers([data.business], covers);
    data.business = business;
  }

  return data;
}

export type HomeCard = {
  slug: string;
  name: string;
  district: string;
  city: string;
  priceTier: string | null;
  avgRating: number;
  reviewCount: number;
  claimedAt: string | null;
  featured: boolean;
  category: { slug: string; nameUz: string; nameRu: string; nameEn: string };
  /** Approved cover photo URL, joined in client-side. Absent means no cover yet. */
  coverPhotoUrl?: string | null;
};

export type HomeSections = {
  justJoined: HomeCard[];
  featured: HomeCard[];
  categories: Array<{
    slug: string;
    nameUz: string;
    nameRu: string;
    nameEn: string;
    businessCount: number;
  }>;
  totalBusinesses: number;
};

/**
 * Real landing-page sections, with the mock feed retained for the parts that
 * are still mock (occasions, lists, social activity).
 *
 * Previously this returned mock data unconditionally — it did not even consult
 * `useMockData`, so setting NEXT_PUBLIC_USE_MOCK=false changed nothing here and
 * the homepage stayed permanently fake.
 *
 * A failed fetch degrades to empty sections rather than throwing: the homepage
 * is the first thing a visitor sees, and rendering it without the curated rows
 * is better than rendering an error page.
 */
export async function getHomeFeed(locale = "uz") {
  const mock = await mockApi.getHomeFeed();

  if (useMockData) {
    return { ...mock, sections: null as HomeSections | null };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/home?locale=${locale}`, {
      next: { revalidate: 60 }
    });

    if (!response.ok) {
      return { ...mock, sections: null as HomeSections | null };
    }

    const payload = await response.json();
    const sections = payload.data as HomeSections;
    const covers = await fetchBusinessCovers([
      ...sections.featured.map((card) => card.slug),
      ...sections.justJoined.map((card) => card.slug)
    ]);

    return {
      ...mock,
      sections: {
        ...sections,
        featured: withCovers(sections.featured, covers),
        justJoined: withCovers(sections.justJoined, covers)
      }
    };
  } catch {
    return { ...mock, sections: null as HomeSections | null };
  }
}

/** Empty on failure — see `searchBusinesses` for why a public index page must
 *  never 500 on a backend blip. The page renders its empty state instead. */
export async function getOccasions(): Promise<Occasion[]> {
  if (useMockData) {
    return mockApi.getOccasions();
  }

  try {
    const { getServerAuthHeaders } = await import("./auth");
    const response = await fetch(`${API_BASE_URL}/occasions`, {
      headers: await getServerAuthHeaders("/occasions"),
      next: { revalidate: 300 }
    });

    if (!response.ok) {
      return [];
    }

    const payload = await response.json();
    return payload?.data?.occasions ?? [];
  } catch {
    return [];
  }
}

/** Empty on failure — see `searchBusinesses`. */
export async function getListsPage(): Promise<CommunityList[]> {
  if (useMockData) {
    return mockApi.getListsPage();
  }

  try {
    const { getServerAuthHeaders } = await import("./auth");
    const response = await fetch(`${API_BASE_URL}/lists`, {
      headers: await getServerAuthHeaders("/lists"),
      next: { revalidate: 300 }
    });

    if (!response.ok) {
      return [];
    }

    const payload = await response.json();
    return payload?.data?.lists ?? [];
  } catch {
    return [];
  }
}

export async function getAchievements(): Promise<Achievement[]> {
  return mockApi.getAchievements();
}

export async function getAdminOverview() {
  if (useMockData) {
    return mockApi.getAdminOverview();
  }

  const { getServerAuthHeaders } = await import("./auth");
  // Admin data is per-authenticated-user and must never be shared across
  // requests via the Next.js data cache.
  const response = await fetch(`${API_BASE_URL}/admin/overview`, {
    headers: await getServerAuthHeaders("/admin/overview"),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Admin overview failed: ${response.status}`);
  }

  const payload = await response.json();
  return payload.data;
}

export type AdminClaim = {
  id: string;
  status: ClaimStatus;
  verificationMethod: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
  business: BusinessPlatform;
  requester: {
    id: string;
    displayName: string;
    email: string | null;
    phone: string | null;
    role: UserRole;
  };
};

export async function getAdminClaims(status: ClaimStatus = "pending"): Promise<AdminClaim[]> {
  if (useMockData) {
    return mockApi.getAdminClaims(status);
  }

  const { getServerAuthHeaders } = await import("./auth");
  const response = await fetch(`${API_BASE_URL}/admin/claims?status=${status}`, {
    headers: await getServerAuthHeaders("/admin/claims"),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Admin claims failed: ${response.status}`);
  }

  const payload = await response.json();
  return payload.data.claims;
}

export async function getUserProfile(): Promise<UserProfile> {
  return mockApi.getUserProfile();
}

export async function getDiscoverableUsers(): Promise<DiscoverableUser[]> {
  return mockApi.getDiscoverableUsers();
}

export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  return mockApi.getSubscriptionPlans();
}

export async function getSocialActivities(): Promise<SocialActivity[]> {
  return mockApi.getSocialActivities();
}

type ListDetailResponse = {
  list: CommunityList;
  businesses: BusinessPlatform[];
};

type OccasionDetailResponse = {
  occasion: Occasion;
  businesses: BusinessPlatform[];
};

export async function approveClaim(id: string, idempotencyKey?: string) {
  if (useMockData) {
    return mockApi.approveClaim(id);
  }

  const response = await postJson(`/admin/claims/${id}/approve`, {}, idempotencyKey);
  return response.json();
}

export async function rejectClaim(id: string, idempotencyKey?: string) {
  if (useMockData) {
    return mockApi.rejectClaim(id);
  }

  const response = await postJson(`/admin/claims/${id}/reject`, {}, idempotencyKey);
  return response.json();
}

export async function getModerationQueue(status: ReportStatus = "open"): Promise<ModerationQueueItem[]> {
  if (useMockData) {
    return [];
  }

  const { getServerAuthHeaders } = await import("./auth");
  const response = await fetch(`${API_BASE_URL}/admin/moderation?status=${status}`, {
    headers: await getServerAuthHeaders("/admin/moderation"),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Moderation queue failed: ${response.status}`);
  }

  const payload = await response.json();
  return payload.data.reports;
}

export async function resolveReport(
  id: string,
  moderationStatus: ModerationStatus = "rejected",
  idempotencyKey?: string
) {
  if (useMockData) {
    return { data: { ok: true } };
  }

  const response = await postJson(
    `/admin/reports/${id}/resolve`,
    { moderationStatus },
    idempotencyKey
  );
  return response.json();
}

export async function rejectReport(id: string, idempotencyKey?: string) {
  if (useMockData) {
    return { data: { ok: true } };
  }

  const response = await postJson(`/admin/reports/${id}/reject`, {}, idempotencyKey);
  return response.json();
}

export async function getMyBusinesses(): Promise<{ businesses: BusinessPlatform[]; reviews: Review[] }> {
  if (useMockData) {
    return { businesses: [], reviews: [] };
  }

  const { getServerAuthHeaders } = await import("./auth");
  const response = await fetch(`${API_BASE_URL}/businesses/mine`, {
    headers: await getServerAuthHeaders("/businesses/mine"),
    cache: "no-store"
  });

  if (!response.ok) {
    return { businesses: [], reviews: [] };
  }

  const payload = await response.json();
  return payload.data;
}

export async function replyToReview(reviewId: string, text: string) {
  const { getServerAuthHeaders } = await import("./auth");
  const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}/replies`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(await getServerAuthHeaders(`/reviews/${reviewId}/replies`))
    },
    body: JSON.stringify({ text }),
    cache: "no-store"
  });
  return response.json();
}

export {
  getHomeFeed as getHomeFeedMock,
} from "./mock-api";

export async function getListDetail(slug: string): Promise<ListDetailResponse> {
  if (useMockData) {
    return mockApi.getListDetail(slug);
  }

  const { getServerAuthHeaders } = await import("./auth");
  const response = await fetch(`${API_BASE_URL}/lists/${slug}`, {
    headers: await getServerAuthHeaders(`/lists/${slug}`),
    next: { revalidate: 300 }
  });
  const payload = await response.json();
  return payload.data;
}

export async function getOccasionPage(slug: string): Promise<OccasionDetailResponse> {
  if (useMockData) {
    return mockApi.getOccasionPage(slug);
  }

  const { getServerAuthHeaders } = await import("./auth");
  const response = await fetch(`${API_BASE_URL}/occasions/${slug}`, {
    headers: await getServerAuthHeaders(`/occasions/${slug}`),
    next: { revalidate: 300 }
  });
  const payload = await response.json();
  return payload.data;
}
