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
  customerCount: number;
};

export type CrmSubscription = {
  plan: "free" | "pro" | "max";
  status: "trial" | "active" | "invoice_pending" | "canceled";
  renewsAt: string | null;
} | null;

export function getAnnouncements(slug: string) {
  return crmGet<{ announcements: CrmAnnouncement[] }>(`/crm/businesses/${slug}/announcements`);
}

export function getPublicAnnouncements(slug: string) {
  return crmGet<{ announcements: CrmAnnouncement[] }>(`/businesses/${slug}/announcements`);
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

export type CustomerBooking = {
  id: string;
  serviceName: string;
  startsAt: string;
  status: string;
  amount: string;
};

export type CustomerReview = {
  id: string;
  rating: number;
  text: string;
  createdAt: string;
};

export type CustomerVisitEntry = {
  id: string;
  occurredAt: string;
  source: string;
};

export type CustomerDetail = CustomerSummary & {
  notes: string | null;
  firstSeenAt: string;
  /** False when the customer booked by phone without a Manzil account — they cannot have reviews. */
  hasAccount: boolean;
  bookings: CustomerBooking[];
  reviews: CustomerReview[];
  visits: CustomerVisitEntry[];
};

export function getCustomer(slug: string, customerId: string) {
  return crmGet<{ customer: CustomerDetail }>(
    `/crm/businesses/${slug}/customers/${customerId}`
  );
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

export type BookingStatus = "pending" | "confirmed" | "canceled" | "completed" | "no_show";

export type CrmBooking = {
  id: string;
  customerId: string | null;
  customerName: string | null;
  customerPhone: string;
  serviceName: string;
  startsAt: string;
  endsAt: string | null;
  status: BookingStatus;
  depositAmount: string | null;
  createdAt: string;
  updatedAt: string;
};

export function getBookings(
  slug: string,
  filters: { status?: BookingStatus; from?: string; to?: string } = {}
) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  const query = params.toString();

  return crmGet<{ bookings: CrmBooking[]; total: number }>(
    `/crm/businesses/${slug}/bookings${query ? `?${query}` : ""}`
  );
}

export type CrmPhoto = {
  id: string;
  publicUrl: string | null;
  moderationStatus: "pending" | "approved" | "rejected";
  isCover: boolean;
  createdAt: string;
};

/** Owner-only: the business's own photos, for the register/photos step and the settings photo manager. */
export function getBusinessPhotos(slug: string) {
  return crmGet<{ photos: CrmPhoto[] }>(`/media/photos?business=${slug}`);
}
