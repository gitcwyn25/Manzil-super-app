import { auth } from "@clerk/nextjs/server";
import { headers } from "next/headers";

/**
 * The admin console's session cookie (`manzil_admin_session`, see
 * `apps/api/.../admin-session.util.ts`) is httpOnly and never visible to
 * client JS — and the API is a separate origin in production (see
 * `apiOrigin` in `next.config.ts`), so the browser never attaches it to a
 * cross-origin API call either. The only place it is ever readable is on
 * the incoming request to *this* app, which is why the admin login action
 * re-issues it as a first-party cookie on this app's own domain
 * (`admin/login/page.tsx`) instead of just relaying the API's `Set-Cookie`
 * verbatim.
 *
 * Every server component/action under `(workspace)/admin/*` must call this
 * before fetching `/console/*` or `/legal/*` — forwarding the incoming
 * `Cookie` header is what lets the API's `PermissionGuard` see the session.
 * Forwarding the whole header (not just this one cookie) is deliberate and
 * harmless: the API's cookie parser (`readCookieValue`) picks out only the
 * one name it cares about and ignores the rest.
 */
export async function getAdminConsoleHeaders(): Promise<Record<string, string>> {
  const incoming = await headers();
  const cookie = incoming.get("cookie");
  return cookie ? { cookie } : {};
}

function usesDevAuthFallback() {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.MANZIL_DEV_AUTH !== "false" &&
    !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  );
}

export async function getServerAuthHeaders(path?: string): Promise<Record<string, string>> {
  const { getToken } = await auth();
  const token = await getToken();

  if (token) {
    return { Authorization: `Bearer ${token}` };
  }

  if (usesDevAuthFallback() && (path?.startsWith("/admin") || path?.startsWith("/console"))) {
    return {
      "x-manzil-role": "admin",
      "x-manzil-user-id": "dev-admin"
    };
  }

  return {};
}
