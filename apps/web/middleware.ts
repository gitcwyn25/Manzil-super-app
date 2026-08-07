import { clerkMiddleware } from "@clerk/nextjs/server";
import { defaultLocale, isLocale } from "@manzil/shared";
import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "./utils/supabase/middleware";

const clerkEnabled = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

/**
 * Root-level paths that are real routes or assets and must never be given a
 * locale prefix. Each either has its own file in `app/` (robots, sitemap,
 * llms, manifest, offline, opengraph-image), lives in `public/`, or belongs to
 * the framework / the Sentry tunnel.
 */
const ROOT_PATHS = new Set([
  "/robots.txt",
  "/sitemap.xml",
  "/llms.txt",
  "/favicon.ico",
  "/manifest.webmanifest",
  "/sw.js",
  "/offline",
  "/monitoring",
  "/opengraph-image",
  "/icon.jpg"
]);

const ROOT_PREFIXES = ["/_next", "/api", "/trpc", "/monitoring", "/icons/", "/gurman/"];

function isRootPath(pathname: string) {
  return (
    ROOT_PATHS.has(pathname) ||
    ROOT_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
    // Any other file-like request (a public asset, a probe for /ads.txt) must
    // 404 as a missing file rather than become /uz/ads.txt.
    pathname.includes(".")
  );
}

/**
 * Send anything that is not locale-prefixed to the default locale.
 *
 * This is the fix for the highest-severity finding of the production audit.
 * `/robots.txt`, `/sitemap.xml`, `/llms.txt` and `/favicon.ico` — and in fact
 * *any* unknown top-level path, e.g. `/xyz` — used to fall through to the
 * `/[locale]` dynamic segment with `locale = "robots.txt"`. That segment's
 * layout calls `notFound()`, which under `next start` surfaces as 404 but on
 * Vercel surfaced as **HTTP 500** (`x-matched-path: /500`): `/[locale]` is an
 * ISR route (`revalidate: 1m`), and an uncached dynamic param whose layout
 * not-founds cannot be served from that path.
 *
 * With this guard the dynamic segment only ever receives a real locale. The
 * four paths above now resolve to their own routes (added alongside this
 * change) and a genuinely unknown path becomes `/uz/xyz` — a real 404 page
 * with a 404 status, never a 500.
 */
function localeRedirect(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  const [, first] = pathname.split("/");

  if (isLocale(first)) return null;

  const url = request.nextUrl.clone();
  url.pathname = `/${defaultLocale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url, 307);
}

async function handle(request: NextRequest) {
  // robots.txt / sitemap.xml / llms.txt are crawler entry points. Running the
  // Supabase session refresh for them would put a third-party network call in
  // front of the two files a crawler fetches first — precisely the shape of
  // failure that produced the 500s this change removes.
  if (isRootPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  return localeRedirect(request) ?? (await updateSession(request));
}

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
  ? clerkMiddleware(async (_auth, request) => handle(request as NextRequest))
  : (request: NextRequest) => handle(request);

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)"
  ]
};
