import { clerkMiddleware } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";
import { updateSession } from "./utils/supabase/middleware";

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

// `/:locale/admin*` used to be gated here via Clerk's `auth.protect()`. The
// admin console is credential-cookie-only now (AdminAuthService.resolveAdmin
// no longer matches a Clerk actor at all) — it has no Clerk identity, so
// gating it through Clerk here would lock every admin out before they ever
// reach the console's own login page. Its own layout
// ((workspace)/admin/(console)/layout.tsx) checks the `manzil_admin_session`
// cookie via `GET /console/me` and redirects to `/admin/login` itself, the
// same way (workspace)/dashboard/layout.tsx checks Clerk's `auth()` directly
// rather than relying on this middleware.
export default clerkEnabled
  ? clerkMiddleware(async (_auth, request) => updateSession(request as NextRequest))
  : (request: NextRequest) => updateSession(request);

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)"
  ]
};
