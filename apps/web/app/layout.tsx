import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { MotionProvider } from "./components/motion/motion-provider";
import { ServiceWorkerRegistration } from "./components/service-worker";
import { Golos_Text, Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import "./styles/vibrant.scss";

// One grotesque across all levels (DESIGN.md). Weights map to the type ramp:
// 400 body, 500 label-sm, 600 headline-md/labels/buttons, 700 headline-lg,
// 800 display-lg. latin-ext covers Uzbek-Latin's okina and diacritics.
const sans = Hanken_Grotesk({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
  fallback: ["system-ui", "Segoe UI", "Roboto", "sans-serif"]
});

// Hanken Grotesk ships no Cyrillic cut, and Manzil is trilingual (uz/ru/en):
// Golos Text rides second in the stack as the designed Cyrillic companion so
// Russian never falls back to system-ui (decision D4).
const golos = Golos_Text({
  subsets: ["cyrillic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
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
  themeColor: "#0058bc",
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
        className={`${sans.variable} ${golos.variable}`}
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
