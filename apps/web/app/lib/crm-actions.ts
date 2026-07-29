"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { API_BASE_URL } from "./api-base-url";
import { getServerAuthHeaders } from "./auth";

/** Server actions for CRM mutations. All requests carry the Clerk token. */

async function crmSend(path: string, method: "POST" | "PATCH" | "DELETE", body?: unknown) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      ...(await getServerAuthHeaders(path))
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store"
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      (payload as { message?: string | string[] }).message ?? `Request failed (${response.status})`;
    throw new Error(Array.isArray(message) ? message.join(", ") : message);
  }

  return payload;
}

function text(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Converts a `<input type="datetime-local">` value ("YYYY-MM-DDTHH:mm", no
 * timezone) into an ISO-8601 string with an explicit offset.
 *
 * This runs on the server, which may not run in Tashkent's timezone (or even
 * a consistent one across deployments) — `new Date("2026-08-01T09:00")` would
 * silently parse "09:00" as the server's local time, not the business owner's,
 * quietly shifting every booking by the server/Tashkent offset. Uzbekistan
 * has used a fixed UTC+5 with no DST since 2024, so the offset can be
 * appended directly rather than resolved dynamically.
 */
function tashkentIso(formData: FormData, key: string): string | undefined {
  const raw = text(formData, key);
  if (!raw) return undefined;
  // The browser default step (whole minutes, no seconds) always yields
  // "YYYY-MM-DDTHH:mm" — seconds are appended before the offset so the result
  // is unambiguous ISO-8601 rather than relying on the runtime's parser.
  return `${raw}:00+05:00`;
}

/* ---------- Registration + plan ---------- */

export async function registerBusinessAction(formData: FormData) {
  const locale = text(formData, "locale") ?? "uz";

  // An unchecked checkbox is simply absent from FormData, so this is false
  // unless the user actually ticked it. The API enforces the same rule with
  // @Equals(true) — the client check is for a fast, clear error, not security.
  const acceptedTerms = formData.get("acceptedTerms") === "on";

  const payload = await crmSend("/crm/register", "POST", {
    name: text(formData, "name"),
    categorySlug: text(formData, "categorySlug"),
    descriptionUz: text(formData, "description"),
    address: text(formData, "address"),
    district: text(formData, "district"),
    city: text(formData, "city"),
    phone: text(formData, "phone"),
    email: text(formData, "email"),
    website: text(formData, "website"),
    instagram: text(formData, "instagram"),
    telegram: text(formData, "telegram"),
    legalName: text(formData, "legalName"),
    taxId: text(formData, "taxId"),
    acceptedTerms,
    acceptedTermsVersion: text(formData, "acceptedTermsVersion")
  });

  const slug = (payload as { data: { slug: string } }).data.slug;
  redirect(`/${locale}/business/plans?business=${slug}`);
}

export async function choosePlanAction(formData: FormData) {
  const locale = text(formData, "locale") ?? "uz";
  const slug = text(formData, "business");
  const plan = text(formData, "plan") ?? "free";

  if (!slug) {
    throw new Error("Business is required");
  }

  if (plan === "free") {
    await crmSend(`/crm/businesses/${slug}/subscription`, "POST", { plan });
    // Photos are an optional step after the business exists and a plan is
    // chosen, before the dashboard — never in front of the monetisation step.
    redirect(`/${locale}/business/register/photos?business=${slug}`);
    return;
  }

  // Paid tiers never set the plan directly — the API creates a Stripe
  // Checkout session and the subscription only activates once Stripe
  // confirms payment via the webhook. The tier/price are re-resolved
  // server-side from `businessSlug`; nothing here is trusted as-is.
  const payload = await crmSend("/billing/checkout", "POST", {
    businessSlug: slug,
    tier: plan,
    locale
  });

  const url = (payload as { data: { url: string } }).data.url;
  redirect(url);
}

/* ---------- Announcements ---------- */

export async function createAnnouncementAction(formData: FormData) {
  const slug = text(formData, "business");
  const kind = text(formData, "kind") ?? "news";

  await crmSend(`/crm/businesses/${slug}/announcements`, "POST", {
    kind,
    title: text(formData, "title"),
    body: text(formData, "body"),
    status: text(formData, "status") ?? "published",
    discountPercent: kind === "discount" ? Number(text(formData, "discountPercent") ?? 0) : undefined,
    startsAt: text(formData, "startsAt"),
    endsAt: text(formData, "endsAt")
  });

  revalidatePath("/[locale]/dashboard/announcements", "page");
}

export async function setAnnouncementStatusAction(formData: FormData) {
  await crmSend(`/crm/announcements/${text(formData, "id")}`, "PATCH", {
    status: text(formData, "status")
  });
  revalidatePath("/[locale]/dashboard/announcements", "page");
}

export async function deleteAnnouncementAction(formData: FormData) {
  await crmSend(`/crm/announcements/${text(formData, "id")}`, "DELETE");
  revalidatePath("/[locale]/dashboard/announcements", "page");
}

/* ---------- Packages ---------- */

export async function createPackageAction(formData: FormData) {
  await crmSend(`/crm/businesses/${text(formData, "business")}/packages`, "POST", {
    name: text(formData, "name"),
    description: text(formData, "description"),
    price: Number(text(formData, "price") ?? 0)
  });
  revalidatePath("/[locale]/dashboard/packages", "page");
}

export async function togglePackageAction(formData: FormData) {
  await crmSend(`/crm/packages/${text(formData, "id")}`, "PATCH", {
    isActive: text(formData, "isActive") === "true"
  });
  revalidatePath("/[locale]/dashboard/packages", "page");
}

export async function deletePackageAction(formData: FormData) {
  await crmSend(`/crm/packages/${text(formData, "id")}`, "DELETE");
  revalidatePath("/[locale]/dashboard/packages", "page");
}

/* ---------- Bookings ---------- */

export async function createBookingAction(formData: FormData) {
  await crmSend(`/crm/businesses/${text(formData, "business")}/bookings`, "POST", {
    serviceName: text(formData, "serviceName"),
    customerPhone: text(formData, "customerPhone"),
    startsAt: tashkentIso(formData, "startsAt"),
    endsAt: tashkentIso(formData, "endsAt"),
    depositAmount: text(formData, "depositAmount") ? Number(text(formData, "depositAmount")) : undefined
  });
  revalidatePath("/[locale]/dashboard/bookings", "page");
}

export async function setBookingStatusAction(formData: FormData) {
  await crmSend(`/crm/bookings/${text(formData, "id")}/status`, "PATCH", {
    status: text(formData, "status")
  });
  revalidatePath("/[locale]/dashboard/bookings", "page");
}

/* ---------- Reviews ---------- */

export async function replyToReviewAction(formData: FormData) {
  await crmSend(`/reviews/${text(formData, "reviewId")}/replies`, "POST", {
    text: text(formData, "text")
  });
  revalidatePath("/[locale]/dashboard/reviews", "page");
}

/* ---------- Settings ---------- */

export async function updateBusinessAction(formData: FormData) {
  const slug = text(formData, "business");

  await crmSend(`/businesses/${slug}`, "PATCH", {
    name: text(formData, "name"),
    address: text(formData, "address"),
    district: text(formData, "district"),
    phone: text(formData, "phone"),
    email: text(formData, "email"),
    website: text(formData, "website"),
    instagram: text(formData, "instagram"),
    telegram: text(formData, "telegram"),
    legalName: text(formData, "legalName"),
    taxId: text(formData, "taxId"),
    hours: text(formData, "hours"),
    description: text(formData, "description") ? { uz: text(formData, "description") } : undefined
  });

  revalidatePath("/[locale]/dashboard/settings", "page");
}
