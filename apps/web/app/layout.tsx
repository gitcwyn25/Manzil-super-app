import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { MotionProvider } from "./components/motion/motion-provider";
import { ServiceWorkerRegistration } from "./components/service-worker";
import { Unbounded, Golos_Text, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import "./styles/anor.scss";

// Architectural display face: wide, geometric. Reads as station signage, not
// as a startup headline face.
const display = Unbounded({
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["500", "600"],
  variable: "--font-display",
  display: "swap"
});

// Latin and Cyrillic drawn as one system. Manzil ships uz/ru/en, and a body face
// without matched Cyrillic makes the Russian site look like a different product.
const body = Golos_Text({
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
  display: "swap"
});

// Metrically matched to Golos Text. Ratings, counts, currency, IDs.
const data = IBM_Plex_Mono({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500"],
  variable: "--font-data",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Manzil Business | Biznesingizni Manzil'da boshqaring",
  description:
    "Manzil biznes platformasi: listingni tasdiqlang, sharhlarga javob bering, obro'ingizni boshqaring. Mijozlar uchun iOS va Android ilovalari.",
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
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }]
  }
};

export const viewport: Viewport = {
  themeColor: "#00706B",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      {/* lang is corrected per-locale by app/[locale]/layout.tsx, which sets
          document.documentElement.lang — the root layout has no locale param. */}
      <html
        lang="uz"
        className={`${display.variable} ${body.variable} ${data.variable}`}
        suppressHydrationWarning
      >
        <body suppressHydrationWarning>
          {/* Progressive enhancement gate: reveal start-states apply only when
              JS is present, so content is never hidden for no-JS / crawlers. */}
          <script
            dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }}
          />
          {/* Safety net for the JS-disabled path: Framer Motion inlines the
              hidden start-state (opacity:0) during SSR, so without this a
              no-JS visitor or a non-executing crawler would see blank reveals.
              `!important` beats the inline style; only rendered when JS is off. */}
          <noscript>
            <style>{"[data-reveal]{opacity:1 !important;transform:none !important;filter:none !important}"}</style>
          </noscript>
          <MotionProvider>{children}</MotionProvider>
          <ServiceWorkerRegistration />
        </body>
      </html>
    </ClerkProvider>
  );
}
