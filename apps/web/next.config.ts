import type { NextConfig } from "next";

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
  `img-src 'self' data: blob: https://img.clerk.com https://*.clerk.com`,
  `font-src 'self' data:`,
  `connect-src 'self' ${apiOrigin} ${supabaseSources} ${clerk} https://clerk-telemetry.com ${vercel}${
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

export default nextConfig;
