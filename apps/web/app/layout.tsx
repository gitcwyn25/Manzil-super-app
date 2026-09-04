import type { Metadata, Viewport } from "next";
import { SITE_URL } from "./lib/seo";
import "./globals.css";
import "./styles/vibrant.scss";

/**
 * Pass-through root layout.
 *
 * `<html>` and `<body>` moved to `app/components/document-shell.tsx`, rendered
 * by `app/[locale]/layout.tsx` — the first layout that actually knows the
 * locale. Keeping the document here is what forced `lang="uz"` onto `/ru` and
 * `/en` in the server-rendered HTML, which the production audit flagged.
 *
 * The two documents outside the locale segment (`app/offline/page.tsx` and the
 * root `app/not-found.tsx`) render the shell themselves. The global stylesheets
 * stay imported here so every route in the app receives them.
 */

/**
 * Site-wide metadata defaults only.
 *
 * This object used to carry the *Manzil Business* title verbatim, so every
 * route that did not export its own metadata inherited it — which is why the
 * consumer home page introduced itself as the business product in production.
 * The title is now a template with a neutral brand default, and each route
 * supplies its own through `app/lib/seo.ts`. `metadataBase` is what makes
 * every canonical, hreflang and OG URL resolve absolutely.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Manzil — Toshkentdagi joylarni kashf eting",
    template: "%s | Manzil"
  },
  description:
    "Toshkentdagi kafe, restoran va xizmatlarni haqiqiy sharhlar asosida toping.",
  applicationName: "Manzil",
  referrer: "strict-origin-when-cross-origin",
  formatDetection: { telephone: false, address: false, email: false },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1
    }
  },
  // Next serves app/manifest.ts at this path; linking it is what makes the app
  // installable rather than merely offline-capable.
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Manzil"
  },
  icons: {
    icon: [
      // Browsers and crawlers request /favicon.ico by name before reading any
      // <link>; the file is a real 16/32/48 multi-size ICO in public/.
      { url: "/favicon.ico", sizes: "16x16 32x32 48x48", type: "image/x-icon" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    shortcut: ["/favicon.ico"],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }]
  }
};

export const viewport: Viewport = {
  themeColor: "#0058bc",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
