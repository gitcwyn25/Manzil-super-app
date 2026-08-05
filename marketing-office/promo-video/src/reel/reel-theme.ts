/**
 * Kosmonavtlar tokens for the 45s reel.
 *
 * Separate from `src/theme.ts`, which mirrors the *previous* brand (teal +
 * heritage serif + arch motif). The web app moved to the Kosmonavtlar system in
 * `docs/design-system.md`, and a promo shot in the old palette next to a site in
 * the new one reads as two different companies. Values here are copied from
 * `apps/web/app/globals.css` so the reel and the product cannot drift.
 */

export const c = {
  /** Deep vault. Backgrounds, the ground the brand stands on. */
  void: "#0a1a1e",
  voidLift: "#10242a",
  /** Cool concrete. Light surfaces. */
  panel: "#f1f3f2",
  /** Brand teal. */
  ceramic: "#00706b",
  ceramicBright: "#0a8f88",
  /** Lit-sign aqua. LIVE / active state ONLY — never decoration. */
  signal: "#4de1c1",
  /** Metal trim. Value: ratings, one CTA. */
  brass: "#c8a24c",
  /** Secondary text. Darkened from the doc's #6b7c7a, which fails AA on panel. */
  dust: "#5c6c6a",
  ink: "#0d1a1c",
  white: "#ffffff",
} as const;

/**
 * Type scale for a 1080x1920 frame.
 *
 * Above the video-layout minimums (headline 84, supporting 44, labels 32)
 * because a Reel is watched on a phone held at arm's length and often muted —
 * the type carries the message alone.
 */
export const t = {
  hook: 128,
  headline: 96,
  title: 68,
  body: 48,
  label: 34,
} as const;

export const SAFE = { x: 88, top: 160, bottom: 200 } as const;

/** Exponential ease-out. Matches the product's --ease-out; no bounce anywhere. */
export const EASE = [0.16, 1, 0.3, 1] as const;
