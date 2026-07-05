import { auth } from "@clerk/nextjs/server";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/v1";

/** Attaches the Clerk session token so the API can resolve the AdminUser. */
async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};

  // auth() throws when Clerk middleware isn't active (local dev-impersonation
  // mode). Never let that surface as a 500 — degrade to the dev fallback.
  try {
    const { getToken } = await auth();
    const token = await getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  } catch {
    // no Clerk session available
  }

  // Local dev without Clerk: impersonate the bootstrap admin via dev headers.
  if (!headers.Authorization && process.env.ADMIN_DEV_CLERK_ID) {
    headers["x-manzil-role"] = "admin";
    headers["x-manzil-user-id"] = process.env.ADMIN_DEV_CLERK_ID;
  }
  return headers;
}

export type ConsoleResult<T> = { ok: true; data: T } | { ok: false; status: number; error: string };

export async function consoleGet<T>(path: string): Promise<ConsoleResult<T>> {
  const res = await fetch(`${API_BASE_URL}/console${path}`, {
    headers: await authHeaders(),
    cache: "no-store"
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return { ok: false, status: res.status, error: body.message ?? `Request failed (${res.status})` };
  }
  const payload = await res.json();
  return { ok: true, data: payload.data as T };
}

export async function consoleSend<T>(
  path: string,
  method: "POST" | "PATCH",
  body?: unknown
): Promise<ConsoleResult<T>> {
  const res = await fetch(`${API_BASE_URL}/console${path}`, {
    method,
    headers: { "content-type": "application/json", ...(await authHeaders()) },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store"
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = payload.message ?? `Request failed (${res.status})`;
    return { ok: false, status: res.status, error: Array.isArray(msg) ? msg.join(", ") : msg };
  }
  return { ok: true, data: payload.data as T };
}

/* ---- shared types ---- */

export type AdminMe = { id: string; email: string; name: string; roles: string[]; permissions: string[] };

export async function getMe(): Promise<AdminMe | null> {
  const r = await consoleGet<AdminMe>("/me");
  return r.ok ? r.data : null;
}

export function can(me: AdminMe | null, permission: string): boolean {
  return !!me && me.permissions.includes(permission);
}
