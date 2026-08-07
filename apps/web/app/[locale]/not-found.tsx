import type { Metadata } from "next";
import { LocalizedNotFound } from "../components/localized-not-found";

export const metadata: Metadata = {
  title: "Sahifa topilmadi",
  robots: { index: false, follow: false }
};

/**
 * 404 for any path under a valid locale that matched no route — including
 * every unknown top-level path, which the middleware now redirects here
 * (`/xyz` → `/uz/xyz`) instead of letting it fall into `/[locale]` and 500.
 */
export default function LocaleNotFound() {
  return <LocalizedNotFound />;
}
