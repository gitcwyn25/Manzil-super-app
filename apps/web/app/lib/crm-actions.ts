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

/* ---------- Registration + plan ---------- */

export async function registerBusinessAction(formData: FormData) {
  const locale = text(formData, "locale") ?? "uz";

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
    taxId: text(formData, "taxId")
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

  await crmSend(`/crm/businesses/${slug}/subscription`, "POST", { plan });
  redirect(`/${locale}/dashboard`);
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
