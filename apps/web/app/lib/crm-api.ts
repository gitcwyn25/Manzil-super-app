import { API_BASE_URL } from "./api-base-url";
import { getServerAuthHeaders } from "./auth";

/** Server-side helpers for the business CRM API. */

async function crmGet<T>(path: string): Promise<T | null> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: await getServerAuthHeaders(path),
    cache: "no-store"
  });

  if (!response.ok) {
    return null;
  }

  const payload = await response.json();
  return payload.data as T;
}

export type CrmAnnouncement = {
  id: string;
  kind: "news" | "discount" | "broadcast";
  status: "draft" | "published" | "archived";
  title: string;
  body: string;
  discountPercent: number | null;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string;
};

export type CrmPackage = {
  id: string;
  name: string;
  description: string | null;
  price: string;
  currency: string;
  isActive: boolean;
  sortOrder: number;
};

export type CrmStats = {
  business: { name: string; slug: string; status: string; avgRating: number; reviewCount: number };
  reviews: { total: number; lastSevenDays: number; distribution: Record<string, number> };
  visits: { totalLast30Days: number; uniqueLast30Days: number; daily: Array<{ date: string; count: number }> };
  announcements: Record<string, number>;
  activePackages: number;
};

export type CrmSubscription = {
  plan: "free" | "pro" | "max";
  status: "trial" | "active" | "invoice_pending" | "canceled";
  renewsAt: string | null;
} | null;

export function getAnnouncements(slug: string) {
  return crmGet<{ announcements: CrmAnnouncement[] }>(`/crm/businesses/${slug}/announcements`);
}

export function getPackages(slug: string) {
  return crmGet<{ packages: CrmPackage[] }>(`/crm/businesses/${slug}/packages`);
}

export function getStats(slug: string) {
  return crmGet<CrmStats>(`/crm/businesses/${slug}/stats`);
}

export function getSubscription(slug: string) {
  return crmGet<{ subscription: CrmSubscription }>(`/crm/businesses/${slug}/subscription`);
}

export type CustomerSummary = {
  id: string;
  phone: string;
  name: string | null;
  lastVisitAt: string | null;
  visitCount: number;
  totalSpend: string;
  tags: string[];
  consentMarketing: boolean;
};

export function getCustomers(slug: string) {
  return crmGet<{ customers: CustomerSummary[] }>(`/crm/businesses/${slug}/customers`);
}

export type FunnelStage = {
  type: "view" | "photo_view" | "directions" | "call" | "message";
  count: number;
  /** Null when there are no views yet — a percentage of zero is undefined, not 0%. */
  conversionFromView: number | null;
};

export type BusinessAnalytics = {
  windowDays: number;
  visits: { total: number; unique: number; trend: Array<{ date: string; value: number }> };
  funnel: FunnelStage[];
  reviews: {
    count: number;
    averageRating: number | null;
    trend: Array<{ date: string; value: number | null; count: number }>;
  };
  bookings: { total: number; byStatus: Record<string, number> };
  revenue: { totalAmount: string; currency: string; paymentCount: number };
};

/**
 * Returns null when the plan lacks the `analytics.basic` entitlement (the API
 * answers 403) — the caller renders the upgrade prompt rather than an error.
 */
export function getBusinessAnalytics(slug: string, days = 30) {
  return crmGet<BusinessAnalytics>(`/analytics/businesses/${slug}?days=${days}`);
}
