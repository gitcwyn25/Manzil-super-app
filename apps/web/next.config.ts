import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const isDev = process.env.NODE_ENV !== "production";

/** Safely extract an origin (scheme://host[:port]) from a URL, or null. */
function toOrigin(url?: string): string | null {
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

// Origins the browser legitimately connects to, derived from env so the CSP
// stays correct across local/preview/production without editing this file.
const apiOrigin = toOrigin(process.env.NEXT_PUBLIC_API_URL) ?? "https://manzil-api-production.up.railway.app";
const supabaseOrigin = toOrigin(process.env.NEXT_PUBLIC_SUPABASE_URL);
const supabaseSources = supabaseOrigin
  ? `${supabaseOrigin} wss://${new URL(supabaseOrigin).host}`
  : "https://*.supabase.co wss://*.supabase.co";

// Clerk (auth) — dev instances serve from *.clerk.accounts.dev; production from
// clerk.<your-domain> + *.clerk.com. Bot protection uses Cloudflare Turnstile.
const clerk = "https://*.clerk.accounts.dev https://*.clerk.com https://clerk.com";
const turnstile = "https://challenges.cloudflare.com";
// Vercel preview comment toolbar (harmless in production).
const vercel = "https://vercel.live";

// Sentry ingest. Derived from the DSN in the same style as the origins above:
// a hardcoded region host would silently break reporting the moment the project
// moves region, and a blocked connect-src fails without any visible error.
const sentryOrigin = toOrigin(process.env.NEXT_PUBLIC_SENTRY_DSN);
const sentry = sentryOrigin ?? "";

// Cloudflare R2 serves uploaded business photos. Derived from the same env the
// API signs uploads against, so the CSP cannot drift from where the bytes
// actually live. Without this, an uploaded cover photo is fetched and then
// blocked by img-src, which looks like a broken upload rather than a policy
// problem. The wildcard fallback covers the default r2.dev domain when no
// custom CDN domain is configured yet.
const r2Origin = toOrigin(process.env.CLOUDFLARE_R2_PUBLIC_URL);
const r2Images = r2Origin ?? "https://*.r2.dev https://*.r2.cloudflarestorage.com";

// Supabase Storage is the media backend when R2 is not configured, and it
// serves objects from the same origin as the database project. Included
// unconditionally: whichever backend answers, its host must be allowed or the
// uploaded cover is fetched and then blocked, which reads as a broken upload.
const supabaseImages = supabaseOrigin ?? "https://*.supabase.co";

const csp = [
  `default-src 'self'`,
  `base-uri 'self'`,
  `object-src 'none'`,
  `frame-ancestors 'self'`,
  `form-action 'self' ${clerk}`,
  // Next.js injects inline bootstrap/hydration scripts (no nonce here), so
  // 'unsafe-inline' is required; dev additionally needs 'unsafe-eval' for HMR.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} ${clerk} ${turnstile} ${vercel}`,
  `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: blob: https://img.clerk.com https://*.clerk.com ${r2Images} ${supabaseImages}`,
  `font-src 'self' data:`,
  `connect-src 'self' ${apiOrigin} ${supabaseSources} ${clerk} https://clerk-telemetry.com ${vercel} ${sentry}${
    isDev ? " ws://localhost:* http://localhost:*" : ""
  }`,
  `worker-src 'self' blob:`,
  `frame-src 'self' ${clerk} ${turnstile} ${vercel}`,
  `manifest-src 'self'`,
  // Upgrade http subresources to https in production only (would break the
  // local http://localhost API during development).
  ...(isDev ? [] : [`upgrade-insecure-requests`])
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // App uses none of these; disable them everywhere. Add the origin here if a
  // feature (e.g. map "use my location") ever needs it.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" }
];

const nextConfig: NextConfig = {
  transpilePackages: ["@manzil/shared"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders
      }
    ];
  }
};

// Only wrap when a Sentry org/project is configured. Unconditional wrapping
// makes every local and CI build attempt source-map upload and emit warnings.
export default process.env.SENTRY_ORG && process.env.SENTRY_PROJECT
  ? withSentryConfig(nextConfig, {
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      authToken: process.env.SENTRY_AUTH_TOKEN,

      // Upload source maps so production stack traces are readable, then delete
      // them from the deployed bundle — shipping them would expose the app's
      // original source to anyone who opens devtools.
      sourcemaps: { deleteSourcemapsAfterUpload: true },

      silent: !process.env.CI,

      // Proxies Sentry through the app's own origin so ad blockers (which block
      // *.sentry.io by default) do not silently drop error reports.
      tunnelRoute: "/monitoring",

      disableLogger: true
    })
  : nextConfig;
