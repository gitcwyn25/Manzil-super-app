import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono, Inter, Libre_Caslon_Display } from "next/font/google";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist"
});

// Editorial display: institutional high-contrast serif — the "monument/plaque"
// voice for headlines, paired against geometric Geist on a contrast axis.
const caslon = Libre_Caslon_Display({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-serif"
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono"
});

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter"
});

export const metadata: Metadata = {
  title: "Manzil Business | Biznesingizni Manzil'da boshqaring",
  description:
    "Manzil biznes platformasi: listingni tasdiqlang, sharhlarga javob bering, obro'ingizni boshqaring. Mijozlar uchun iOS va Android ilovalari."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html
        lang="uz"
        className={`${geist.variable} ${geistMono.variable} ${inter.variable} ${caslon.variable}`}
        suppressHydrationWarning
      >
        <body suppressHydrationWarning>
          {/* Progressive enhancement gate: reveal start-states apply only when
              JS is present, so content is never hidden for no-JS / crawlers. */}
          <script
            dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }}
          />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
