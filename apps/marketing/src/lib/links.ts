/**
 * Every outbound destination used by the marketing site.
 * Each URL was checked against the live deployments on 13 Nov 2026
 * (app.manzilgroup.uz is a Next.js app whose AuthForm reads `?mode=` and `?next=`).
 * Do not add links to legacy discover./review. hosts here.
 */
export const APP_ORIGIN = "https://app.manzilgroup.uz";
export const CORPORATE_ORIGIN = "https://manzilgroup.uz";
export const BUSINESS_ORIGIN = "https://business.manzilgroup.uz";

/** Where the customer lands after auth: the Community feed (app root). */
const COMMUNITY_HOME = "/";

export function appAuthUrl(mode: "signup" | "login", next: string = COMMUNITY_HOME) {
  // Only same-app relative paths may be passed as `next` (prevents open redirects).
  let safeNext = COMMUNITY_HOME;
  try {
    const decoded = decodeURIComponent(next);
    const hasUnsafeCharacters = [...decoded].some(
      (character) =>
        character === "\\" || character.charCodeAt(0) <= 32 || character.charCodeAt(0) === 127,
    );
    const target = new URL(next, APP_ORIGIN);
    const decodedTarget = new URL(decoded, APP_ORIGIN);
    if (
      next.startsWith("/") &&
      !hasUnsafeCharacters &&
      target.origin === APP_ORIGIN &&
      decodedTarget.origin === APP_ORIGIN
    ) {
      safeNext = `${target.pathname}${target.search}${target.hash}`;
    }
  } catch {
    // Invalid encodings and URLs return to Community.
  }
  const params = new URLSearchParams();
  if (mode === "signup") params.set("mode", "signup");
  params.set("next", safeNext);
  return `${APP_ORIGIN}/auth?${params.toString()}`;
}

export const links = {
  getStarted: appAuthUrl("signup"),
  logIn: appAuthUrl("login"),
  openApp: `${APP_ORIGIN}/`,
  forBusinesses: BUSINESS_ORIGIN,
  about: "/en/about",
  contact: "/en/contact",
  privacy: "/en/legal/privacy",
  terms: "/en/legal/terms",
  communityRules: "/en/legal/reviews",
  docs: "/docs",
  gurman: "/gurman",
  gurmanWaitlistEntry: "/gurman/waitlist",
  tallyGurmanWaitlist: "https://tally.so/r/eqJLdQ",
  gurmanWaitlist: "/gurman",
  instagram: "https://www.instagram.com/manzil.finds",
  youtube: "https://www.youtube.com/@ManzilGroupUz",
  x: "https://x.com/ManzilUz",
} as const;

export const photoCredits = [
  {
    subject: "Chorsu Bazaar, Tashkent",
    author: "Adam Harangozó",
    license: "CC BY-SA 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    source: "https://commons.wikimedia.org/wiki/File:Chorsu_Bazaar_in_Tashkent.jpg",
  },
  {
    subject: "Mustaqillik Maydoni metro station, Tashkent",
    author: "Tim Adams",
    license: "CC BY 4.0",
    licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
    source:
      "https://commons.wikimedia.org/wiki/File:Mustaqillik_Maydoni_station_of_Chilanzar_Line_of_Tashkent_Metro_in_Tashkent_Uzbekistan.jpg",
  },
] as const;
