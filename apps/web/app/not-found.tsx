import type { Metadata } from "next";
import { DocumentShell } from "./components/document-shell";
import { NOT_FOUND_COPY, StatusPage } from "./components/status-page";

export const metadata: Metadata = {
  title: "Sahifa topilmadi",
  robots: { index: false, follow: false }
};

/**
 * Root 404 — the boundary for paths that never reach a locale segment (a
 * file-like request such as `/ads.txt`, or a `notFound()` thrown by
 * `app/[locale]/layout.tsx` itself).
 *
 * Renders `DocumentShell` because the root layout is a pass-through; see
 * `app/components/document-shell.tsx` for why the document moved.
 */
export default function RootNotFound() {
  return (
    <DocumentShell lang="uz">
      <StatusPage copy={NOT_FOUND_COPY.uz} locale="uz" />
    </DocumentShell>
  );
}
