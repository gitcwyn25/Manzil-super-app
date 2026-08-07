import type { Locale } from "@manzil/shared";
import { AppProviders } from "../components/app-providers";

/**
 * Client-side stores for the locale subtree.
 *
 * This used to seed the preferences store from `getUserProfile()` — the demo
 * fixture in `@manzil/shared` — so every first-time visitor's browser was
 * pre-populated with saved businesses (`caravan-coffee`,
 * `yunusobod-osh-markazi`), followed users (`user_sara`, `user_john`) and a
 * followed list (`hidden-cafes`), none of which exist in the live catalogue.
 * Two things were wrong with that: the visitor was shown a history they never
 * had, and because `UserPreferencesProvider` fell back to the defaults whenever
 * stored state was empty, un-saving everything made the fake entries reappear —
 * the state was literally impossible to clear.
 *
 * A new visitor now starts empty, which is the truth.
 */
export function LocaleProviders({
  children,
  locale
}: {
  children: React.ReactNode;
  locale: Locale;
}) {
  // `locale` was previously accepted and ignored. The Product Experience
  // System (Epic 17) needs it: every toast, dialog, banner and announcement it
  // renders is user-facing copy, and it is resolved from this one value rather
  // than being threaded through every call site.
  return <AppProviders locale={locale}>{children}</AppProviders>;
}
