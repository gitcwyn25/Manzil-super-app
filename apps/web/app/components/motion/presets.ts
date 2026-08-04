/**
 * Shared Framer Motion vocabulary for the web app.
 *
 * These mirror the CSS motion tokens in globals.css (`--ease-out`,
 * `--ease-spring`, `--speed-*`) one-to-one, so motion driven by JS feels
 * identical to motion driven by CSS. Import from here rather than hand-rolling
 * easings per component — one curve, one language.
 */
import type { Transition, Variants } from "framer-motion";

// cubic-bezier(0.16, 1, 0.3, 1) — --ease-out. Confident, decisive deceleration.
export const EASE_OUT = [0.16, 1, 0.3, 1] as const;
// cubic-bezier(0.22, 1, 0.36, 1) — --ease-spring. Slightly snappier, no bounce.
export const EASE_SPRING = [0.22, 1, 0.36, 1] as const;

/** Durations in seconds, matched to the CSS --speed-* / --ws-speed tokens. */
export const DUR = {
  fast: 0.18, // --speed-fast (feedback: press, toggle)
  med: 0.36, // --speed-med (hover, state change)
  slow: 0.7, // --speed-slow (entrance)
  ws: 0.14 // --ws-speed (workspace shell — deliberately ~2.5x faster)
} as const;

export type RevealVariant =
  | "fade-up"
  | "fade-in"
  | "scale-in"
  | "slide-left"
  | "slide-right"
  | "blur-up";

// Hidden start-states per variant, mirroring the old `.reveal-*` CSS classes.
const HIDDEN: Record<RevealVariant, Record<string, number | string>> = {
  "fade-up": { opacity: 0, y: 30 },
  "fade-in": { opacity: 0 },
  "scale-in": { opacity: 0, scale: 0.94 },
  "slide-left": { opacity: 0, x: 44 },
  "slide-right": { opacity: 0, x: -44 },
  "blur-up": { opacity: 0, y: 26, filter: "blur(10px)" }
};

const SHOWN: Record<string, number | string> = {
  opacity: 1,
  y: 0,
  x: 0,
  scale: 1,
  filter: "blur(0px)"
};

/**
 * Build a hidden/visible variant pair for a scroll reveal.
 * `duration` and `delay` are in SECONDS.
 */
export function revealVariants(
  variant: RevealVariant,
  duration: number = DUR.slow,
  delay = 0
): Variants {
  const hidden = HIDDEN[variant];
  // Only animate the properties this variant actually moves, so a "fade-in"
  // never pays for a transform it doesn't use.
  const visible: Record<string, number | string> = { opacity: 1 };
  for (const key of Object.keys(hidden)) {
    if (key !== "opacity") visible[key] = SHOWN[key];
  }
  return {
    hidden,
    visible: {
      ...visible,
      transition: { duration, delay, ease: EASE_OUT }
    }
  };
}

/**
 * Container + item variants for a staggered list reveal.
 * `step` and `start` are in SECONDS.
 */
export function staggerVariants(
  variant: RevealVariant,
  step = 0.09,
  start = 0,
  itemDuration: number = DUR.med
): { container: Variants; item: Variants } {
  return {
    container: {
      hidden: {},
      visible: {
        transition: { staggerChildren: step, delayChildren: start }
      }
    },
    item: revealVariants(variant, itemDuration, 0)
  };
}

/** Standard viewport config for scroll-triggered reveals. */
export const REVEAL_VIEWPORT = {
  once: true,
  amount: 0.18,
  margin: "0px 0px -8% 0px"
} as const;

// ---- Interaction (hover / press) --------------------------------------------

export const hoverTransition: Transition = { duration: DUR.med, ease: EASE_SPRING };
export const tapTransition: Transition = { duration: DUR.fast, ease: EASE_OUT };

/** Card-scale lift: a card or tile rising toward the pointer. */
export const cardHover = { y: -6, transition: hoverTransition };
export const cardTap = { scale: 0.985, transition: tapTransition };

/** Button / pill: gentle scale, no vertical drift. */
export const buttonHover = { scale: 1.03, transition: hoverTransition };
export const buttonTap = { scale: 0.96, transition: tapTransition };

/** Small chip / badge / nav link: the lightest possible acknowledgement. */
export const liftHover = { y: -2, transition: hoverTransition };
export const liftTap = { y: 0, scale: 0.97, transition: tapTransition };

/** Workspace-shell hover: faster and flatter, per the product register. */
export const wsRowHover = { x: 2, transition: { duration: DUR.ws, ease: EASE_OUT } };
export const wsCardHover = { y: -3, transition: { duration: DUR.ws, ease: EASE_OUT } };
