import type { Metadata } from "next";
import { AppShell } from "@/components/shell/app-shell";
import { CommandPalette } from "@/components/command-palette";
import { getMe } from "@/lib/console";
import "./globals.css";

export const metadata: Metadata = { title: "Manzil Operations", description: "Manzil Group merchant activation and trust control room" };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const me = await getMe().catch(() => null);
  return <html lang="en"><body>{me ? <><AppShell identity={me}>{children}</AppShell><CommandPalette /></> : <main className="min-h-screen">{children}</main>}</body></html>;
}
