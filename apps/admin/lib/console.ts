import { cookies } from "next/headers";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/v1";
const ADMIN_SESSION_COOKIE = "manzil_admin_session";

/** Forward the first-party admin session cookie to the API. The API remains the source of truth for identity and RBAC. */
async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (session) headers.Cookie = `${ADMIN_SESSION_COOKIE}=${encodeURIComponent(session)}`;

  // Local-only fallback for the existing seeded developer workflow.
  if (!session && process.env.ADMIN_DEV_CLERK_ID) {
    headers["x-manzil-role"] = "admin";
    headers["x-manzil-user-id"] = process.env.ADMIN_DEV_CLERK_ID;
  }
  return headers;
}

export type ConsoleResult<T> = { ok: true; data: T } | { ok: false; status: number; error: string };

export async function consoleGet<T>(path: string): Promise<ConsoleResult<T>> {
  try {
    const res = await fetch(`${API_BASE_URL}/console${path}`, { headers: await authHeaders(), cache: "no-store" });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, status: res.status, error: body.message ?? `Request failed (${res.status})` };
    return { ok: true, data: body.data as T };
  } catch (error) {
    return { ok: false, status: 503, error: error instanceof Error ? error.message : "Console API unavailable" };
  }
}

export async function consoleSend<T>(path: string, method: "POST" | "PATCH", body?: unknown): Promise<ConsoleResult<T>> {
  try {
    const res = await fetch(`${API_BASE_URL}/console${path}`, { method, headers: { "content-type": "application/json", ...(await authHeaders()) }, body: body === undefined ? undefined : JSON.stringify(body), cache: "no-store" });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = payload.message ?? `Request failed (${res.status})`;
      return { ok: false, status: res.status, error: Array.isArray(msg) ? msg.join(", ") : msg };
    }
    return { ok: true, data: payload.data as T };
  } catch (error) {
    return { ok: false, status: 503, error: error instanceof Error ? error.message : "Console API unavailable" };
  }
}

export type AdminMe = { id: string; email: string; name: string; roles: string[]; permissions: string[] };

export async function getMeResult(): Promise<ConsoleResult<AdminMe>> {
  return consoleGet<AdminMe>("/me");
}

export async function getMe(): Promise<AdminMe | null> {
  const result = await getMeResult();
  return result.ok ? result.data : null;
}

export function can(me: AdminMe | null, permission: string): boolean {
  return !!me && (me.permissions.includes(permission) || me.permissions.includes("*"));
}
