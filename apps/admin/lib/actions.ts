"use server";

import { revalidatePath } from "next/cache";
import { consoleSend, getMe } from "./console";

type ActionState = { ok: boolean; error?: string };

/**
 * Step-up guard for destructive actions: re-fetch the admin's live permissions
 * from the API immediately before mutating, so a revoked permission can't be
 * exploited from a stale page/session. The API re-checks again independently.
 */
async function ensure(permission: string): Promise<string | null> {
  const me = await getMe();
  if (!me) return "Your admin session is no longer valid. Please sign in again.";
  if (!me.permissions.includes(permission)) return `You no longer have the '${permission}' permission.`;
  return null;
}

function field(form: FormData, key: string): string {
  const v = form.get(key);
  return typeof v === "string" ? v.trim() : "";
}

/* ---------- businesses ---------- */

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
    const value = field(form, key);
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

  const id = field(form, "id");
  const r = await consoleSend("/categories", "POST", {
    ...(id ? { id } : {}),
    slug: field(form, "slug"),
    nameUz: field(form, "nameUz"),
    nameRu: field(form, "nameRu"),
    nameEn: field(form, "nameEn"),
    parentId: field(form, "parentId") || null
  });
  revalidatePath("/categories");
  return r.ok ? { ok: true } : { ok: false, error: r.error };
}
