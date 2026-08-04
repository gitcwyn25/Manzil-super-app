"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { API_BASE_URL } from "./api-base-url";
import { getAdminConsoleHeaders } from "./auth";

/**
 * Mirrors `ADMIN_SESSION_COOKIE_NAME` in
 * `apps/api/src/modules/console/admin-session.util.ts` — duplicated rather
 * than imported across the workspace boundary, the same call the API side
 * already makes for its password-hash scheme in `seed-admin-credentials.ts`.
 * Keep the two in sync if the cookie name ever changes.
 */
const ADMIN_SESSION_COOKIE_NAME = "manzil_admin_session";
/** Mirrors admin-session.util.ts's SESSION_TTL_MS (7 days), in seconds — the
 * unit `cookies().set({ maxAge })` expects. */
const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function extractSetCookieValue(setCookieHeader: string | null, name: string): string | null {
  if (!setCookieHeader) return null;
  const match = setCookieHeader.match(new RegExp(`(?:^|,\\s*|;\\s*)${name}=([^;]+)`));
  return match ? match[1] : null;
}

export type AdminLoginState = { error: boolean };

/**
 * Signs in against `POST /console/auth/login` and, on success, re-issues the
 * API's session cookie as a first-party cookie on this app's own domain.
 *
 * This has to be a server-to-server call rather than a browser fetch: the
 * API's own `Set-Cookie` is scoped to the API's origin and `/v1/console`
 * path, so a browser talking to the API directly would never send it back
 * to *this* app on the next page load. Re-issuing it here (same name, path
 * "/", this app's own domain) is what lets `getAdminConsoleHeaders` forward
 * it on every later `/console/*` call. See `lib/auth.ts`.
 *
 * Every non-success outcome — unknown username, wrong password, inactive
 * account, a network failure, a missing cookie in the response — collapses
 * to the identical `{ error: true }`, mirroring the API's own "one generic
 * message for every failure mode" rule: the client must never be able to
 * tell which one it was.
 */
export async function adminLoginAction(
  _prevState: AdminLoginState,
  formData: FormData
): Promise<AdminLoginState> {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const locale = String(formData.get("locale") ?? "uz");

  if (!username || !password) {
    return { error: true };
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/console/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ username, password }),
      cache: "no-store"
    });
  } catch {
    return { error: true };
  }

  if (!response.ok) {
    return { error: true };
  }

  const sessionValue = extractSetCookieValue(response.headers.get("set-cookie"), ADMIN_SESSION_COOKIE_NAME);
  if (!sessionValue) {
    return { error: true };
  }

  (await cookies()).set(ADMIN_SESSION_COOKIE_NAME, sessionValue, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS
  });

  redirect(`/${locale}/admin`);
}

export async function adminLogoutAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "uz");

  await fetch(`${API_BASE_URL}/console/auth/logout`, {
    method: "POST",
    headers: await getAdminConsoleHeaders(),
    cache: "no-store"
  }).catch(() => undefined);

  (await cookies()).delete(ADMIN_SESSION_COOKIE_NAME);
  redirect(`/${locale}/admin/login`);
}

/* ---------- generic mutation helper ---------- */

async function consoleSend(path: string, method: "POST" | "PATCH", body?: unknown) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "content-type": "application/json",
      ...(await getAdminConsoleHeaders())
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store"
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = (payload as { message?: string | string[] }).message ?? `Request failed (${response.status})`;
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

/* ---------- Businesses ---------- */

export async function approveBusinessAction(formData: FormData) {
  await consoleSend(`/console/businesses/${text(formData, "id")}/approve`, "POST");
  revalidatePath("/[locale]/admin/companies", "page");
  revalidatePath("/[locale]/admin/companies/[id]", "page");
  revalidatePath("/[locale]/admin", "page");
}

export async function rejectBusinessAction(formData: FormData) {
  await consoleSend(`/console/businesses/${text(formData, "id")}/reject`, "POST", {
    reason: text(formData, "reason")
  });
  revalidatePath("/[locale]/admin/companies", "page");
  revalidatePath("/[locale]/admin/companies/[id]", "page");
  revalidatePath("/[locale]/admin", "page");
}

export async function featureBusinessAction(formData: FormData) {
  await consoleSend(`/console/businesses/${text(formData, "id")}/feature`, "POST", {
    featured: text(formData, "featured") === "true"
  });
  revalidatePath("/[locale]/admin/companies/[id]", "page");
}

export async function editBusinessAction(formData: FormData) {
  await consoleSend(`/console/businesses/${text(formData, "id")}`, "PATCH", {
    name: text(formData, "name"),
    address: text(formData, "address"),
    district: text(formData, "district"),
    phone: text(formData, "phone"),
    email: text(formData, "email"),
    website: text(formData, "website"),
    priceTier: text(formData, "priceTier")
  });
  revalidatePath("/[locale]/admin/companies/[id]", "page");
  revalidatePath("/[locale]/admin/companies", "page");
}

/* ---------- Reviews ---------- */

export async function approveReviewAction(formData: FormData) {
  await consoleSend(`/console/reviews/${text(formData, "id")}/approve`, "POST");
  revalidatePath("/[locale]/admin/companies/[id]", "page");
  revalidatePath("/[locale]/admin", "page");
}

export async function rejectReviewAction(formData: FormData) {
  await consoleSend(`/console/reviews/${text(formData, "id")}/reject`, "POST", {
    reason: text(formData, "reason")
  });
  revalidatePath("/[locale]/admin/companies/[id]", "page");
  revalidatePath("/[locale]/admin", "page");
}

export async function deleteReviewAction(formData: FormData) {
  await consoleSend(`/console/reviews/${text(formData, "id")}/delete`, "POST", {
    reason: text(formData, "reason")
  });
  revalidatePath("/[locale]/admin/companies/[id]", "page");
  revalidatePath("/[locale]/admin", "page");
}

/* ---------- Photos ---------- */

export async function moderatePhotoAction(formData: FormData) {
  await consoleSend(`/console/photos/${text(formData, "id")}/moderate`, "POST", {
    decision: text(formData, "decision") ?? "approve",
    reason: text(formData, "reason")
  });
  revalidatePath("/[locale]/admin/companies/[id]", "page");
}

/* ---------- Legal ---------- */

export async function publishLegalDocumentAction(formData: FormData) {
  await consoleSend("/console/legal", "POST", {
    kind: text(formData, "kind"),
    version: text(formData, "version"),
    locale: text(formData, "locale") ?? "uz",
    title: text(formData, "title"),
    body: text(formData, "body")
  });
  revalidatePath("/[locale]/admin/companies/[id]", "page");
}

/* ---------- Notifications ---------- */

export async function markNotificationReadAction(formData: FormData) {
  await consoleSend(`/console/notifications/${text(formData, "id")}/read`, "POST");
  revalidatePath("/[locale]/admin", "page");
  revalidatePath("/[locale]/admin/notifications", "page");
}

export async function markAllNotificationsReadAction() {
  await consoleSend("/console/notifications/read-all", "POST");
  revalidatePath("/[locale]/admin", "page");
  revalidatePath("/[locale]/admin/notifications", "page");
}
