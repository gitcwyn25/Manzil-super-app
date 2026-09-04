"use server";

import { revalidatePath } from "next/cache";
import { consoleGet, consoleSend, getMeResult } from "./console";

type ActionState = { ok: boolean; error?: string };

export type WaitlistBusinessCandidate = {
  id: string;
  slug: string;
  name: string;
  status: string;
  category: string;
  district: string;
  address: string;
  phone: string | null;
  owner: { email: string | null; displayName: string } | null;
};

export type BusinessLookupState =
  | { ok: true; businesses: WaitlistBusinessCandidate[] }
  | { ok: false; error: string };

/**
 * Step-up guard for destructive actions: re-fetch the admin's live permissions
 * from the API immediately before mutating, so a revoked permission can't be
 * exploited from a stale page/session. The API re-checks again independently.
 */
async function ensure(permission: string): Promise<string | null> {
  const result = await getMeResult();
  if (!result.ok) {
    if (result.status === 401 || result.status === 403) return "Your admin session is no longer valid or lacks access. Please sign in again.";
    return `Console API unavailable (${result.status}). No change was made; retry after the service recovers.`;
  }
  const me = result.data;
  if (!me.permissions.includes(permission) && !me.permissions.includes("*")) return `You no longer have the '${permission}' permission.`;
  return null;
}

function field(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === "string" ? v.trim() : "";
}

/* ---------- businesses ---------- */

export async function lookupWaitlistBusinesses(query: string): Promise<BusinessLookupState> {
  const denied = await ensure("business.view");
  if (denied) return { ok: false, error: denied };
  const normalized = query.trim();
  if (normalized.length < 2) return { ok: true, businesses: [] };

  const result = await consoleGet<{ businesses: WaitlistBusinessCandidate[] }>(
    `/businesses?q=${encodeURIComponent(normalized)}&take=8`
  );
  return result.ok ? { ok: true, businesses: result.data.businesses } : { ok: false, error: result.error };
}

export async function approveBusiness(_prev: ActionState, form: FormData): Promise<ActionState> {
  const denied = await ensure("business.approve");
  if (denied) return { ok: false, error: denied };
  const r = await consoleSend(`/businesses/${field(form, "id")}/approve`, "POST", {});
  revalidatePath("/businesses");
  return r.ok ? { ok: true } : { ok: false, error: r.error };
}

export async function rejectBusiness(_prev: ActionState, form: FormData): Promise<ActionState> {
  const denied = await ensure("business.reject");
  if (denied) return { ok: false, error: denied };
  const r = await consoleSend(`/businesses/${field(form, "id")}/reject`, "POST", { reason: field(form, "reason") });
  revalidatePath("/businesses");
  return r.ok ? { ok: true } : { ok: false, error: r.error };
}

export async function mergeBusiness(_prev: ActionState, form: FormData): Promise<ActionState> {
  const denied = await ensure("business.merge");
  if (denied) return { ok: false, error: denied };
  const r = await consoleSend(`/businesses/${field(form, "id")}/merge`, "POST", {
    targetId: field(form, "targetId"),
    reason: field(form, "reason")
  });
  revalidatePath("/businesses");
  return r.ok ? { ok: true } : { ok: false, error: r.error };
}

/* ---------- business applications ---------- */

function revalidateApplication(id: string) {
  revalidatePath("/applications");
  revalidatePath(`/applications/${id}`);
  revalidatePath("/businesses");
}

export async function reviewBusinessApplication(_prev: ActionState, form: FormData): Promise<ActionState> {
  const denied = await ensure("business.approve");
  if (denied) return { ok: false, error: denied };
  const id = field(form, "id");
  const r = await consoleSend(`/business-applications/${id}/under-review`, "POST", { reason: field(form, "reason") });
  revalidateApplication(id);
  return r.ok ? { ok: true } : { ok: false, error: r.error };
}

export async function requestBusinessApplicationChanges(_prev: ActionState, form: FormData): Promise<ActionState> {
  const denied = await ensure("business.approve");
  if (denied) return { ok: false, error: denied };
  const id = field(form, "id");
  const r = await consoleSend(`/business-applications/${id}/request-changes`, "POST", { reason: field(form, "reason") });
  revalidateApplication(id);
  return r.ok ? { ok: true } : { ok: false, error: r.error };
}

export async function approveBusinessApplication(_prev: ActionState, form: FormData): Promise<ActionState> {
  const denied = await ensure("business.approve");
  if (denied) return { ok: false, error: denied };
  const id = field(form, "id");
  const r = await consoleSend(`/business-applications/${id}/approve`, "POST", { reason: field(form, "reason") });
  revalidateApplication(id);
  return r.ok ? { ok: true } : { ok: false, error: r.error };
}

export async function rejectBusinessApplication(_prev: ActionState, form: FormData): Promise<ActionState> {
  const denied = await ensure("business.reject");
  if (denied) return { ok: false, error: denied };
  const id = field(form, "id");
  const r = await consoleSend(`/business-applications/${id}/reject`, "POST", { reason: field(form, "reason") });
  revalidateApplication(id);
  return r.ok ? { ok: true } : { ok: false, error: r.error };
}

/* ---------- reviews ---------- */

export async function approveReview(_prev: ActionState, form: FormData): Promise<ActionState> {
  const denied = await ensure("review.approve");
  if (denied) return { ok: false, error: denied };
  const r = await consoleSend(`/reviews/${field(form, "id")}/approve`, "POST", {});
  revalidatePath("/reviews");
  return r.ok ? { ok: true } : { ok: false, error: r.error };
}

export async function rejectReview(_prev: ActionState, form: FormData): Promise<ActionState> {
  const denied = await ensure("review.reject");
  if (denied) return { ok: false, error: denied };
  const r = await consoleSend(`/reviews/${field(form, "id")}/reject`, "POST", { reason: field(form, "reason") });
  revalidatePath("/reviews");
  return r.ok ? { ok: true } : { ok: false, error: r.error };
}

export async function deleteReview(_prev: ActionState, form: FormData): Promise<ActionState> {
  const denied = await ensure("review.delete");
  if (denied) return { ok: false, error: denied };
  const r = await consoleSend(`/reviews/${field(form, "id")}/delete`, "POST", { reason: field(form, "reason") });
  revalidatePath("/reviews");
  return r.ok ? { ok: true } : { ok: false, error: r.error };
}

/* ---------- users ---------- */

export async function banUser(_prev: ActionState, form: FormData): Promise<ActionState> {
  const denied = await ensure("user.ban");
  if (denied) return { ok: false, error: denied };
  const r = await consoleSend(`/users/${field(form, "id")}/ban`, "POST", { reason: field(form, "reason") });
  revalidatePath("/users");
  return r.ok ? { ok: true } : { ok: false, error: r.error };
}

export async function suspendUser(_prev: ActionState, form: FormData): Promise<ActionState> {
  const denied = await ensure("user.suspend");
  if (denied) return { ok: false, error: denied };
  const r = await consoleSend(`/users/${field(form, "id")}/suspend`, "POST", { reason: field(form, "reason") });
  revalidatePath("/users");
  return r.ok ? { ok: true } : { ok: false, error: r.error };
}

export async function unbanUser(_prev: ActionState, form: FormData): Promise<ActionState> {
  const denied = await ensure("user.unban");
  if (denied) return { ok: false, error: denied };
  const r = await consoleSend(`/users/${field(form, "id")}/unban`, "POST", {});
  revalidatePath("/users");
  return r.ok ? { ok: true } : { ok: false, error: r.error };
}

/* ---------- plans (dynamic pricing) ---------- */

export async function updatePlanPrice(_prev: ActionState, form: FormData): Promise<ActionState> {
  const denied = await ensure("plan.manage");
  if (denied) return { ok: false, error: denied };
  const tier = field(form, "tier");
  const priceMonthly = Number(field(form, "priceMonthly"));
  if (!Number.isFinite(priceMonthly) || priceMonthly < 0) return { ok: false, error: "Invalid price" };
  const r = await consoleSend(`/plans/${tier}`, "PATCH", { priceMonthly });
  revalidatePath("/plans");
  return r.ok ? { ok: true } : { ok: false, error: r.error };
}

export async function togglePlanActive(_prev: ActionState, form: FormData): Promise<ActionState> {
  const denied = await ensure("plan.manage");
  if (denied) return { ok: false, error: denied };
  const r = await consoleSend(`/plans/${field(form, "tier")}`, "PATCH", {
    isActive: field(form, "isActive") === "true"
  });
  revalidatePath("/plans");
  return r.ok ? { ok: true } : { ok: false, error: r.error };
}

/* ---------- business detail: edit, feature, media ---------- */

export async function editBusinessDetail(_prev: ActionState, form: FormData): Promise<ActionState> {
  const denied = await ensure("business.edit");
  if (denied) return { ok: false, error: denied };

  const id = field(form, "id");

  // Only send fields the admin actually filled in. Sending "" for an untouched
  // optional field would blank it out, which is a silent data-loss bug when the
  // form posts every input on every save.
  const editable = ["name", "address", "district", "phone", "email", "website", "priceTier"] as const;
  const payload: Record<string, string> = {};
  for (const key of editable) {
    const rawValue = field(form, key);
    const value = key === "priceTier" && rawValue === "__none" ? "" : rawValue;
    if (value) payload[key] = value;
  }

  if (Object.keys(payload).length === 0) return { ok: false, error: "No changes to save." };

  const r = await consoleSend(`/businesses/${id}`, "PATCH", payload);
  revalidatePath(`/businesses/${id}`);
  return r.ok ? { ok: true } : { ok: false, error: r.error };
}

export async function toggleBusinessFeatured(_prev: ActionState, form: FormData): Promise<ActionState> {
  const denied = await ensure("business.edit");
  if (denied) return { ok: false, error: denied };
  const id = field(form, "id");
  const r = await consoleSend(`/businesses/${id}/feature`, "POST", {
    featured: field(form, "featured") === "true"
  });
  revalidatePath(`/businesses/${id}`);
  revalidatePath("/businesses");
  return r.ok ? { ok: true } : { ok: false, error: r.error };
}

export async function moderatePhoto(_prev: ActionState, form: FormData): Promise<ActionState> {
  const decision = field(form, "decision");
  // Approve and reject are separate permissions in the seed; check the one the
  // decision actually needs rather than a single blanket "media" permission.
  const denied = await ensure(decision === "reject" ? "media.reject" : "media.approve");
  if (denied) return { ok: false, error: denied };

  const r = await consoleSend(`/photos/${field(form, "photoId")}/moderate`, "POST", {
    decision,
    reason: field(form, "reason") || undefined
  });
  revalidatePath(`/businesses/${field(form, "businessId")}`);
  return r.ok ? { ok: true } : { ok: false, error: r.error };
}

/* ---------- legal documents ---------- */

export async function publishLegalDocument(_prev: ActionState, form: FormData): Promise<ActionState> {
  const denied = await ensure("legal.publish");
  if (denied) return { ok: false, error: denied };

  const r = await consoleSend("/legal", "POST", {
    kind: field(form, "kind"),
    version: field(form, "version"),
    locale: field(form, "locale") || "uz",
    title: field(form, "title"),
    body: field(form, "body")
  });
  revalidatePath("/legal");
  return r.ok ? { ok: true } : { ok: false, error: r.error };
}

/* ---------- categories ---------- */

export async function upsertCategory(_prev: ActionState, form: FormData): Promise<ActionState> {
  const denied = await ensure("category.manage");
  if (denied) return { ok: false, error: denied };

  const rawId = field(form, "id");
  const id = rawId === "__create" ? "" : rawId;
  const rawParentId = field(form, "parentId");
  const parentId = rawParentId === "__none" ? "" : rawParentId;
  const r = await consoleSend("/categories", "POST", {
    ...(id ? { id } : {}),
    slug: field(form, "slug"),
    nameUz: field(form, "nameUz"),
    nameRu: field(form, "nameRu"),
    nameEn: field(form, "nameEn"),
    parentId: parentId || null
  });
  revalidatePath("/categories");
  return r.ok ? { ok: true } : { ok: false, error: r.error };
}

/* ---------- merchant activation ---------- */

export async function transitionWaitlist(_prev: ActionState, form: FormData): Promise<ActionState> {
  const denied = await ensure("waitlist.manage");
  if (denied) return { ok: false, error: denied };
  const r = await consoleSend(`/waitlist/${field(form, "id")}/transition`, "POST", {
    status: field(form, "status"),
    reason: field(form, "reason") || undefined,
    expectedUpdatedAt: field(form, "expectedUpdatedAt") || undefined
  });
  revalidatePath("/waitlist");
  return r.ok ? { ok: true } : { ok: false, error: r.error };
}

export async function assignWaitlist(_prev: ActionState, form: FormData): Promise<ActionState> {
  const denied = await ensure("waitlist.manage");
  if (denied) return { ok: false, error: denied };
  const adminId = field(form, "adminId");
  const r = await consoleSend(`/waitlist/${field(form, "id")}/assignment`, "PATCH", {
    adminId: adminId || null,
    expectedUpdatedAt: field(form, "expectedUpdatedAt") || undefined
  });
  revalidatePath("/waitlist");
  return r.ok ? { ok: true } : { ok: false, error: r.error };
}

export async function connectWaitlistCompany(_prev: ActionState, form: FormData): Promise<ActionState> {
  const denied = await ensure("business.connect");
  if (denied) return { ok: false, error: denied };
  const r = await consoleSend(`/waitlist/${field(form, "id")}/connect`, "POST", {
    businessId: field(form, "businessId"),
    reason: field(form, "reason"),
    expectedUpdatedAt: field(form, "expectedUpdatedAt") || undefined
  });
  revalidatePath("/waitlist");
  return r.ok ? { ok: true } : { ok: false, error: r.error };
}

export async function queueWaitlistEmailDraft(_prev: ActionState, form: FormData): Promise<ActionState> {
  const denied = await ensure("outbox.create");
  if (denied) return { ok: false, error: denied };
  const subject = field(form, "subject");
  const body = field(form, "body");
  const r = await consoleSend(`/waitlist/${field(form, "id")}/email-drafts`, "POST", {
    ...(subject ? { subject } : {}),
    ...(body ? { body } : {})
  });
  revalidatePath("/waitlist");
  revalidatePath("/outbox");
  return r.ok ? { ok: true } : { ok: false, error: r.error };
}

export async function retryOutboxMessage(_prev: ActionState, form: FormData): Promise<ActionState> {
  const denied = await ensure("outbox.retry");
  if (denied) return { ok: false, error: denied };
  const r = await consoleSend(`/outbox/${field(form, "id")}/retry`, "POST", { reason: field(form, "reason") });
  revalidatePath("/outbox");
  revalidatePath("/waitlist");
  return r.ok ? { ok: true } : { ok: false, error: r.error };
}

export async function activateSignature(_prev: ActionState, form: FormData): Promise<ActionState> {
  const denied = await ensure("signature.create");
  if (denied) return { ok: false, error: denied };
  const title = field(form, "title");
  const r = await consoleSend("/signature", "POST", title ? { title } : {});
  revalidatePath("/signature");
  revalidatePath("/team");
  return r.ok ? { ok: true } : { ok: false, error: r.error };
}
