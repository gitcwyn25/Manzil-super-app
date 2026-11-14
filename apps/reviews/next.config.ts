import type { NextConfig } from "next";

const apiOrigin = new URL(process.env.NEXT_PUBLIC_API_URL || "https://manzil-api-production.up.railway.app/v1").origin;
const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin : "https://wfabehnihelxemztmvca.supabase.co";
const config: NextConfig = {
  poweredByHeader: false,
  logging: { incomingRequests: { ignore: [/^\/auth\/callback(?:[/?]|$)/] } },
  async redirects() {
    return [
      {
        source: "/business/:slug*",
        destination: "https://app.manzilgroup.uz/places/:slug*",
        permanent: false
      },
      {
        source: "/profile/:path*",
        destination: "https://app.manzilgroup.uz/profile/me",
        permanent: false
      },
      {
        source: "/saved/:path*",
        destination: "https://app.manzilgroup.uz/saved",
        permanent: false
      },
      {
        source: "/auth/:path*",
        destination: "https://app.manzilgroup.uz/auth/:path*",
        permanent: false
      },
      {
        source: "/add-business/:path*",
        destination: "https://business.manzilgroup.uz/business/register",
        permanent: false
      },
      {
        source: "/claim/:path*",
        destination: "https://business.manzilgroup.uz/business/register",
        permanent: false
      },
      {
        source: "/owners/:path*",
        destination: "https://business.manzilgroup.uz/dashboard",
        permanent: false
      },
      {
        source: "/",
        destination: "https://app.manzilgroup.uz/discover",
        permanent: false
      },
      {
        source: "/:path*",
        destination: "https://app.manzilgroup.uz/",
        permanent: false
      }
    ];
  },
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(self)" },
      { key: "Content-Security-Policy", value: `default-src 'self'; script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}; style-src 'self' 'unsafe-inline'; img-src 'self' https: data: blob:; connect-src 'self' ${apiOrigin} ${supabaseOrigin} https://*.tile.openstreetmap.org; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'` }
    ] }, { source: "/auth/callback", headers: [{ key: "Referrer-Policy", value: "no-referrer" }] }];
  }
};
export default config;
