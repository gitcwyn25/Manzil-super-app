import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import { CommandHint, CommandPalette } from "@/components/command-palette";
import { Sidebar } from "@/components/sidebar";
import { getMe } from "@/lib/console";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Manzil Admin",
  description: "Manzil operations console"
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const me = await getMe().catch(() => null);

  return (
    <ClerkProvider>
      <html lang="en" className={`dark ${inter.variable}`}>
        <body className="min-h-screen bg-bg text-fg">
          {me ? (
            <div className="grid min-h-screen grid-cols-[220px_1fr]">
              <aside className="border-r border-border bg-panel">
                <div className="flex h-14 items-center gap-2 border-b border-border px-4">
                  <span className="text-sm font-bold tracking-tight">Manzil</span>
                  <span className="rounded bg-brand/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-brand">
                    Admin
                  </span>
                </div>
                <Sidebar permissions={me.permissions} />
                <div className="mt-auto border-t border-border p-3 text-xs text-muted">
                  <div className="truncate font-medium text-fg">{me.name}</div>
                  <div className="truncate">{me.email}</div>
                  <div className="mt-1">{me.roles.join(", ")}</div>
                </div>
              </aside>

              <div className="flex flex-col">
                <header className="flex h-14 items-center justify-between border-b border-border px-6">
                  <div className="text-sm text-muted">
                    Press <CommandHint /> to jump between queues
                  </div>
                </header>
                <main className="flex-1 overflow-y-auto p-6">{children}</main>
              </div>

              <CommandPalette />
            </div>
          ) : (
            <main className="min-h-screen">{children}</main>
          )}
        </body>
      </html>
    </ClerkProvider>
  );
}
