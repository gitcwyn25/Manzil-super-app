export type Locale = "en" | "uz" | "ru";
export type Localized = Record<Locale, string>;
export type Category = { id: string; slug: string; name: Localized; parentId?: string };
export type Business = {
  id: string; slug: string; name: string; categorySlug: string; description: Localized;
  address: string; district: string; city: string; phone?: string; lat?: number; lng?: number;
  hours: string; hoursSchedule?: Record<string, string>; priceTier?: "$" | "$$" | "$$$"; status: string; avgRating: number;
  reviewCount: number; coverPhotoUrl?: string | null; tags: string[];
};
export type Review = {
  id: string; businessSlug: string; authorName: string; rating: number; text: string;
  locale: Locale; createdAt: string; helpfulCount: number; verifiedVisit?: boolean;
  moderationStatus?: string; reply?: { id: string; text: string; createdAt: string };
};
export type ListType = "favorites" | "want_to_try" | "visited";
export type Favorite = { id: string; businessId: string; listType: ListType; business: Business; createdAt: string };
export type DirectoryData = { businesses: Business[]; categories: Category[] };
export const API_URL = (process.env.NEXT_PUBLIC_API_URL || "https://manzil-api-production.up.railway.app/v1").replace(/\/$/, "");
export const SITE_URL = "https://review.manzilgroup.uz";

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) { super(message); this.name = "ApiError"; }
}

export async function api<T>(path: string, init: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData)) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(`${API_URL}${path}`, { ...init, headers, cache: "no-store", signal: init.signal || AbortSignal.timeout(15000) });
  const result = await res.json().catch(() => ({})) as { data?: T; message?: string | string[] };
  if (!res.ok) {
    const message = Array.isArray(result.message) ? result.message.join(". ") : result.message;
    throw new ApiError(message || (res.status === 401 ? "Please sign in to continue." : res.status === 404 ? "This page is not available." : "We could not complete that request. Please try again."), res.status);
  }
  if (!result.data) throw new Error("The service returned an incomplete response. Please try again.");
  return result.data;
}

export function text(value: Localized | undefined, locale: Locale) { return value?.[locale] || value?.en || value?.uz || ""; }
export function safeImage(value?: string | null) {
  if (!value) return undefined;
  try { const url = new URL(value); return url.protocol === "https:" ? url.href : undefined; } catch { return undefined; }
}
export function coordinates(b: Business) { return Number.isFinite(b.lat) && Number.isFinite(b.lng) && Math.abs(b.lat!) <= 90 && Math.abs(b.lng!) <= 180; }
/** Use stored weekly schedules, never assume the legacy weekday label applies daily. */
export function opening(business: Pick<Business, "hoursSchedule">, date = new Date()): boolean | null {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Tashkent", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(date);
  const part = (type: string) => parts.find(p => p.type === type)?.value || "";
  const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const names = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const day = days.indexOf(part("weekday").toLowerCase()), minute = Number(part("hour")) * 60 + Number(part("minute"));
  const schedule = business.hoursSchedule || {};
  const rangeFor = (d: number) => schedule[names[d]] ?? schedule[days[d]] ?? (d > 0 && d < 6 ? schedule.weekdays : schedule.weekend ?? schedule.weekends) ?? schedule.daily;
  function parse(value?: string): [number, number] | "closed" | null {
    if (!value) return null;
    if (/^(closed|yopiq|выходной|закрыто)$/i.test(value.trim())) return "closed";
    if (/^24\s*\/\s*7$/.test(value.trim())) return [0, 1440];
    const match = value.match(/^\s*(\d{1,2}):(\d{2})\s*[-–—]\s*(\d{1,2}):(\d{2})\s*$/);
    if (!match) return null;
    const [sh, sm, eh, em] = match.slice(1).map(Number);
    if (sh > 23 || eh > 24 || sm > 59 || em > 59 || (eh === 24 && em !== 0)) return null;
    const start = sh * 60 + sm, end = eh * 60 + em;
    return start === end ? null : [start, end];
  }
  const previous = parse(rangeFor((day + 6) % 7));
  if (Array.isArray(previous) && previous[0] > previous[1] && minute < previous[1]) return true;
  const current = parse(rangeFor(day));
  if (current === "closed") return false;
  if (!current) return null;
  return current[0] < current[1] ? minute >= current[0] && minute < current[1] : minute >= current[0];
}

export async function directoryData(query = "", category = ""): Promise<DirectoryData> {
  const params = new URLSearchParams({ q: query, category: category || "all" });
  const data = await api<DirectoryData>(`/reviews-directory?${params}`);
  const covers: Record<string, string> = {};
  await Promise.all(Array.from({ length: Math.ceil(data.businesses.length / 50) }, async (_, index) => {
    const slugs = data.businesses.slice(index * 50, index * 50 + 50).map(b => b.slug).join(",");
    const response = await api<{ covers: Record<string, string> }>(`/media/business-covers?slugs=${encodeURIComponent(slugs)}`).catch(() => ({ covers: {} }));
    Object.assign(covers, response.covers);
  }));
  return { ...data, businesses: data.businesses.map(b => ({ ...b, coverPhotoUrl: safeImage(covers[b.slug]) })) };
}
export function distance(b: Business, location?: [number, number]) {
  if (!location || !coordinates(b)) return undefined;
  const rad = (n: number) => n * Math.PI / 180;
  const dLat = rad(b.lat! - location[0]), dLng = rad(b.lng! - location[1]);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(location[0])) * Math.cos(rad(b.lat!)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
