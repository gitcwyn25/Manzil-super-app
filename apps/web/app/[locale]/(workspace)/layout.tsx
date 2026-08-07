import type { Metadata } from "next";

/**
 * The whole workspace is per-account data behind a session. Nothing under it
 * should ever enter an index — robots.txt disallows the paths, and this is the
 * belt-and-braces header for a crawler that reached one anyway (a shared link,
 * a referrer leak).
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false, googleBot: { index: false, follow: false } }
};

/**
 * Business workspace frame. Deliberately renders no consumer header, mobile nav,
 * or footer — a workspace that carries marketing chrome reads as a page rather
 * than a tool. Per-section navigation is owned by the nested layouts:
 * dashboard/layout.tsx renders the CRM rail, admin renders its own.
 *
 * data-shell drives the density layer in globals.css (34px rows, 140ms
 * transitions, no scroll reveals).
 */
export default async function WorkspaceLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  await params;

  return (
    <div className="ws-root" data-shell="workspace">
      {children}
    </div>
  );
}
