import { API_BASE_URL } from "./api-base-url";
import { getAdminConsoleHeaders } from "./auth";

/**
 * Server-side read helpers for the admin console (`/console/*`,
 * `/console/supabase/*`). Every call forwards the incoming session cookie
 * (see `getAdminConsoleHeaders`) and never caches — admin data is
 * per-authenticated-operator and must never leak across requests via the
 * Next.js data cache, the same reasoning `getAdminOverview` in `api.ts`
 * already documents for the older admin surface.
 */
async function consoleGet<T>(path: string): Promise<T | null> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: await getAdminConsoleHeaders(),
    cache: "no-store"
  });

  if (!response.ok) {
    return null;
  }

  const payload = await response.json();
  return payload.data as T;
}

export type ConsoleMe = {
  id: string;
  email: string;
  name: string;
  roles: string[];
  permissions: string[];
};

export function getMe() {
  return consoleGet<ConsoleMe>("/console/me");
}

export type ConsoleOverview = {
  pendingBusinesses: number;
  flaggedReviews: number;
  bannedUsers: number;
  admins: number;
};

export function getConsoleOverview() {
  return consoleGet<ConsoleOverview>("/console/overview");
}

/* ---------- Notifications ---------- */

export type AdminNotificationRow = {
  id: string;
  kind: "business_awaiting_approval" | "review_reported" | "photo_pending" | "contract_pending";
  title: string;
  body: string | null;
  businessId: string | null;
  business: { id: string; slug: string; name: string } | null;
  readAt: string | null;
  readBy: string | null;
  createdAt: string;
};

export function getNotifications(params: { unread?: boolean; limit?: number } = {}) {
  const query = new URLSearchParams();
  if (params.unread) query.set("unread", "true");
  if (params.limit) query.set("limit", String(params.limit));
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return consoleGet<{ notifications: AdminNotificationRow[]; unreadCount: number }>(
    `/console/notifications${suffix}`
  );
}

/* ---------- Businesses ---------- */

export type ConsoleBusinessRow = {
  id: string;
  slug: string;
  name: string;
  status: "unclaimed" | "pending_claim" | "claimed" | "suspended";
  category: string;
  district: string;
  address: string;
  phone: string | null;
  avgRating: number;
  reviewCount: number;
  owner: { id: string; email: string | null; displayName: string } | null;
  createdAt: string;
};

export function getConsoleBusinesses(params: { status?: string; q?: string } = {}) {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.q) query.set("q", params.q);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return consoleGet<{ businesses: ConsoleBusinessRow[] }>(`/console/businesses${suffix}`);
}

export type ConsoleBusinessDetail = {
  business: {
    id: string;
    slug: string;
    name: string;
    categoryId: string;
    categoryName: string;
    descriptionUz: string;
    address: string;
    district: string;
    city: string;
    phone: string | null;
    email: string | null;
    website: string | null;
    instagram: string | null;
    telegram: string | null;
    legalName: string | null;
    taxId: string | null;
    priceTier: string | null;
    status: "unclaimed" | "pending_claim" | "claimed" | "suspended";
    verificationStatus: string;
    featured: boolean;
    claimedAt: string | null;
    createdAt: string;
    avgRating: number;
    reviewCount: number;
    owner: { id: string; displayName: string; email: string | null; phone: string | null } | null;
    subscription: { plan: string; status: string; renewsAt: string | null } | null;
  };
  pendingPhotos: Array<{
    id: string;
    publicUrl: string | null;
    storageKey: string;
    isReviewPhoto: boolean;
    createdAt: string;
  }>;
  legal: {
    acceptances: Array<{
      id: string;
      kind: string;
      version: string;
      locale: string;
      title: string;
      acceptedAt: string;
      acceptedBy: string;
      ipAddress: string | null;
    }>;
    contracts: Array<{
      id: string;
      contractNo: string;
      templateVersion: string;
      generatedAt: string;
      hasFile: boolean;
    }>;
  };
  activity: { visitCount: number; bookingCount: number; reviewCount: number; customerCount: number };
};

export function getConsoleBusinessDetail(id: string) {
  return consoleGet<ConsoleBusinessDetail>(`/console/businesses/${id}/detail`);
}

export type ConsoleConsumerRow = {
  userId: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  sources: Array<"customer" | "reviewer">;
  customer: {
    id: string;
    visitCount: number;
    totalSpend: number;
    loyaltyPoints: number;
    lastVisitAt: string | null;
    tags: string[];
  } | null;
  reviews: { count: number; avgRating: number; lastReviewAt: string } | null;
};

export function getConsoleBusinessConsumers(id: string) {
  return consoleGet<{ consumers: ConsoleConsumerRow[]; totalCount: number }>(
    `/console/businesses/${id}/consumers`
  );
}

/* ---------- Reviews ---------- */

export type ConsoleReviewRow = {
  id: string;
  rating: number;
  text: string;
  moderationStatus: "pending" | "approved" | "rejected";
  createdAt: string;
  business: { slug: string; name: string };
  author: { id: string; email: string | null; displayName: string; status: string };
  openReports: Array<{ id: string; reason: string }>;
  spam: { last24hReviews: number };
};

/**
 * `businessId` is an additive filter on top of the existing `/console/reviews`
 * contract (status/flagged) — see the report for why: the per-company Reviews
 * tab has no other way to scope reviews to one business, and this is fully
 * backward compatible (omitted, existing callers are unaffected).
 */
export function getConsoleReviews(
  params: { status?: string; flagged?: boolean; businessId?: string } = {}
) {
  const query = new URLSearchParams();
  if (params.status) query.set("status", params.status);
  if (params.flagged) query.set("flagged", "true");
  if (params.businessId) query.set("businessId", params.businessId);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return consoleGet<{ reviews: ConsoleReviewRow[] }>(`/console/reviews${suffix}`);
}

/* ---------- Legal ---------- */

export type ConsoleLegalDocument = {
  id: string;
  kind: "terms_of_service" | "privacy_policy" | "contract_template";
  version: string;
  locale: string;
  title: string;
  body: string;
  publishedAt: string | null;
  acceptanceCount: number;
  contractCount: number;
  createdAt: string;
};

export function getConsoleLegalDocuments() {
  return consoleGet<{ documents: ConsoleLegalDocument[] }>("/console/legal");
}

/* ---------- Audit ---------- */

export type ConsoleAuditRow = {
  id: string;
  action: string;
  targetType: string;
  targetId: string | null;
  reason: string | null;
  beforeState: unknown;
  afterState: unknown;
  ipAddress: string | null;
  actor: { email: string; name: string } | null;
  createdAt: string;
};

/**
 * `targetId` is an additive filter on top of the existing `/console/audit`
 * contract (actorId/action/targetType), for the same reason as
 * `getConsoleReviews`'s `businessId` — the per-company Audit tab needs to
 * scope to one business, which `targetType=business` alone cannot do.
 */
export function getConsoleAudit(
  params: { actorId?: string; action?: string; targetType?: string; targetId?: string } = {}
) {
  const query = new URLSearchParams();
  if (params.actorId) query.set("actorId", params.actorId);
  if (params.action) query.set("action", params.action);
  if (params.targetType) query.set("targetType", params.targetType);
  if (params.targetId) query.set("targetId", params.targetId);
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return consoleGet<{ entries: ConsoleAuditRow[] }>(`/console/audit${suffix}`);
}

/* ---------- Supabase browser (read-only) ---------- */

export type SupabaseTableCount = { table: string; rowCount: number };

export type SupabaseBucketStat = {
  name: string;
  public: boolean;
  objectCount: number;
  totalBytes: number;
  truncated: boolean;
};

export type SupabaseStorageOverview = { configured: boolean; buckets: SupabaseBucketStat[] };

export function getSupabaseOverview() {
  return consoleGet<{ tables: SupabaseTableCount[]; storage: SupabaseStorageOverview }>(
    "/console/supabase/overview"
  );
}

export function getSupabaseStorage() {
  return consoleGet<SupabaseStorageOverview>("/console/supabase/storage");
}

export type SupabaseTableRows = {
  table: string;
  rows: Array<Record<string, unknown>>;
  totalCount: number;
  limit: number;
  offset: number;
};

export function getSupabaseTable(table: string, limit: number, offset: number) {
  return consoleGet<SupabaseTableRows>(
    `/console/supabase/tables/${encodeURIComponent(table)}?limit=${limit}&offset=${offset}`
  );
}
