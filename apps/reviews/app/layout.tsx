import type { Metadata } from "next";
import { Providers } from "./components/providers";
import { Shell } from "./components/shell";
import "leaflet/dist/leaflet.css";
import "./globals.css";
export const metadata: Metadata = {
  metadataBase: new URL("https://review.manzilgroup.uz"),
  title: { default: "Manzil Reviews — Discover local places in Tashkent", template: "%s | Manzil Reviews" },
  description: "Find local businesses in Tashkent, read community reviews, save places to visit, and share your experience with Manzil Reviews.",
  alternates: { canonical: "/" },
  openGraph: { type: "website", siteName: "Manzil Reviews", locale: "en_US" },
  icons: { icon: "/icon.svg" }
};
export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="en"><body><Providers><Shell>{children}</Shell></Providers></body></html>; }
