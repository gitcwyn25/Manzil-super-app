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
