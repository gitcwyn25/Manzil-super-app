"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { API_BASE_URL } from "./api-base-url";
import { getServerAuthHeaders } from "./auth";
import { formError, type FormActionState } from "./pxs/form-state";
import { idempotencyHeaders, idempotencyKeyFrom } from "./pxs/idempotency";

/** Server actions for CRM mutations. All requests carry the Clerk token. */

/**
 * The single outbound path for every CRM write, and therefore the one place
 * the `Idempotency-Key` header has to be threaded (Epic 17).
 *
 * The key is only ever sent on POST — the creates. PATCH and DELETE here
 * address a specific resource by id and are idempotent by construction, so a
 * duplicate of either is harmless; a duplicate POST is a second row in the
 * catalogue.
 *
 * The key must arrive from the browser, carried through `FormData` by
 * `MutationForm`. Minting one here would produce a different value on every
 * attempt and deduplicate nothing, so `idempotencyHeaders()` deliberately
 * returns `{}` when the caller has none rather than inventing one. Actions
 * that do not yet pass one still work exactly as before — see the migration
 * table in docs/design/PRODUCT-EXPERIENCE-SYSTEM.md.
 */
async function crmSend(
  path: string,
  method: "POST" | "PATCH" | "DELETE",
  body?: unknown,
  idempotencyKey?: string
) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      ...(await getServerAuthHeaders(path)),
      ...(method === "POST" ? idempotencyHeaders(idempotencyKey) : {})
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

/**
 * Business onboarding — a create of a pending application, never an immediate
 * public listing or workspace access before Manzil review and contract.
 *
 * Two changes from the previous version, both required by the mutation system
 * (Epic 17) and both about what happens when things go wrong:
 *
 * 1. **It returns a `FormActionState` instead of throwing.** A thrown Server
 *    Action hands the route to `error.tsx`, which destroys thirteen fields of
 *    typing. Returning an error keeps the form mounted and filled; the user
 *    gets the API's own message in a toast and can fix one field and resubmit.
 *    The `useActionState` signature (previous state first) is what enables it.
 *
 * 2. **It forwards the browser's `Idempotency-Key`.** The interface already
 *    refuses a second click, but a first request whose *response* was lost is
 *    ambiguous to the browser, and the retry is the dangerous one. Carrying
 *    the same key lets the API recognise it as the same intent. The server
 *    half is specified in docs/design/PRODUCT-EXPERIENCE-SYSTEM.md and is not
 *    implemented here — `apps/api` is a concurrent workstream.
 *
 * `redirect()` stays outside the try/catch on purpose: it signals by throwing
 * `NEXT_REDIRECT`, and catching that would turn every successful registration
 * into an error toast.
 */
export async function registerBusinessAction(
  _previousState: FormActionState,
  formData: FormData
): Promise<FormActionState> {
  const locale = text(formData, "locale") ?? "uz";

  // An unchecked checkbox is simply absent from FormData, so this is false
  // unless the user actually ticked it. The API enforces the same rule with
  // @Equals(true) — the client check is for a fast, clear error, not security.
  const acceptedTermsValue = formData.get("acceptedTerms");
  const acceptedTerms = acceptedTermsValue === "on" || acceptedTermsValue === "true";

  let applicationId: string;

  try {
    const payload = await crmSend(
      "/crm/applications",
      "POST",
      {
        name: text(formData, "name"),
        categorySlug: text(formData, "categorySlug"),
        descriptionUz: text(formData, "description"),
        address: text(formData, "address"),
        district: text(formData, "district"),
        city: text(formData, "city"),
        phone: text(formData, "phone"),
        email: text(formData, "email"),
        website: text(formData, "website"),
        workingHours: text(formData, "workingHours"),

        telegram: text(formData, "telegram"),


        acceptedTerms,
        acceptedTermsVersion: text(formData, "acceptedTermsVersion"),
        applicationId: text(formData, "applicationId")
      },
      idempotencyKeyFrom(formData)
    );

    applicationId = (payload as { data: { id: string } }).data.id;
  } catch (error) {
    // Localized only as a last resort: `crmSend` lifts the API's validation
    // messages into `Error.message`, and telling the owner which field is
    // wrong beats a generic sentence in their own language.
    return formError(
      error,
      locale === "ru"
        ? "Не удалось отправить заявку. Попробуйте ещё раз."
        : locale === "en"
          ? "Couldn't submit the application. Please try again."
          : "Arizani yuborib bo'lmadi. Qayta urinib ko'ring."
    );
  }

  redirect(`/${locale}/business/application/${applicationId}`);
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
  const body = text(formData, "body");
  const discountPercent =
    kind === "discount" ? Number(text(formData, "discountPercent") ?? 0) : undefined;

  // The update composer has no title field (per the approved screen): the
  // title is derived from the owner's own text — whitespace collapsed, cut to
  // the API's 200-char cap. Forms that do send a title pass through untouched.
  const title = text(formData, "title") ?? body?.replace(/\s+/g, " ").slice(0, 200);

  // The discount form likewise has no body field; the API requires one, so it
  // is assembled from the discount's real facts (service name + percentage) —
  // never invented copy. It is storage only: campaign rows render title,
  // percent, dates, and status, not the body.
  const resolvedBody =
    body ?? (kind === "discount" && title ? `${title} — ${discountPercent ?? 0}%` : undefined);

  // Discounts are entered as a duration in days; the API takes dates. The
  // window is computed against Uzbekistan's fixed UTC+5 (see tashkentIso), not
  // the server's zone, so "today" is the owner's today.
  let startsAt = text(formData, "startsAt");
  let endsAt = text(formData, "endsAt");
  const durationDays = Number(text(formData, "durationDays") ?? Number.NaN);
  if (!startsAt && !endsAt && Number.isInteger(durationDays) && durationDays > 0) {
    const DAY_MS = 86_400_000;
    const tashkentNow = Date.now() + 5 * 3_600_000;
    startsAt = new Date(tashkentNow).toISOString().slice(0, 10);
    endsAt = new Date(tashkentNow + durationDays * DAY_MS).toISOString().slice(0, 10);
  }

  await crmSend(`/crm/businesses/${slug}/announcements`, "POST", {
    kind,
    title,
    body: resolvedBody,
    status: text(formData, "status") ?? "published",
    discountPercent,
    startsAt,
    endsAt
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
