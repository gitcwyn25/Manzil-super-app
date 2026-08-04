"use client";

import { Children, isValidElement, type CSSProperties, type ReactNode } from "react";
import { motion } from "framer-motion";
import {
  DUR,
  REVEAL_VIEWPORT,
  revealVariants,
  staggerVariants,
  type RevealVariant
} from "./presets";

/**
 * Scroll-triggered entrance animations, driven by Framer Motion.
 *
 * The public API (variant / delay / duration / as / className / once) is kept
 * identical to the previous CSS-class implementation so every existing call
 * site upgrades to Framer Motion without a code change.
 *
 * Progressive enhancement is preserved two ways:
 *   1. `data-reveal` — a `<noscript>` rule in the root layout forces these
 *      elements visible (`opacity:1 !important`) when JS is disabled, so
 *      crawlers and no-JS users never see a blank section.
 *   2. Reduced motion — `<MotionConfig reducedMotion="user">` (motion-provider)
 *      collapses transforms to a plain crossfade.
 */

// Framer Motion element per supported tag. Kept explicit (not `motion(Tag)`) so
// the bundle only pulls the handful of DOM elements actually used.
const MOTION_TAG = {
  div: motion.div,
  section: motion.section,
  span: motion.span,
  li: motion.li,
  article: motion.article,
  ul: motion.ul,
  p: motion.p
} as const;

type RevealTag = keyof typeof MOTION_TAG;

export function Reveal({
  children,
  variant = "fade-up",
  delay = 0,
  duration = 700,
  as = "div",
  className,
  once = true,
  style,
  amount
}: {
  children: ReactNode;
  variant?: RevealVariant;
  delay?: number;
  duration?: number;
  as?: RevealTag;
  className?: string;
  once?: boolean;
  style?: CSSProperties;
  amount?: number;
}) {
  const Tag = MOTION_TAG[as] ?? motion.div;
  const variants = revealVariants(variant, duration / 1000, delay / 1000);

  return (
    <Tag
      className={className}
      data-reveal=""
      style={style}
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ ...REVEAL_VIEWPORT, once, ...(amount != null ? { amount } : {}) }}
    >
      {children}
    </Tag>
  );
}

/**
 * Staggers a scroll reveal across direct children. The parent orchestrates;
 * each child animates in sequence via `staggerChildren`.
 *
 * Total stagger time is capped so a long list never crawls in: past ~14 items
 * the per-item step is compressed to keep the whole sequence under ~1.1s.
 */
export function RevealStagger({
  children,
  variant = "fade-up",
  step = 90,
  start = 0,
  className,
  as = "div",
  once = true
}: {
  children: ReactNode;
  variant?: RevealVariant;
  step?: number;
  start?: number;
  className?: string;
  as?: "div" | "section" | "span" | "ul";
  once?: boolean;
}) {
  const items = Children.toArray(children);
  const Tag = MOTION_TAG[as] ?? motion.div;

  // Cap the cumulative stagger: many items should not add up to a slow reveal.
  const cappedStep = items.length > 12 ? Math.max(35, Math.round(1000 / items.length)) : step;
  const { container, item } = staggerVariants(variant, cappedStep / 1000, start / 1000, DUR.med);

  return (
    <Tag
      className={className}
      data-reveal=""
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ ...REVEAL_VIEWPORT, once, amount: 0.12 }}
    >
      {items.map((child, index) => (
        <motion.div
          className="reveal"
          data-reveal=""
          key={isValidElement(child) && child.key != null ? child.key : index}
          variants={item}
        >
          {child}
        </motion.div>
      ))}
    </Tag>
  );
}

/**
 * Reveals a single child without adding a visible wrapper in the layout flow.
 * Retained for API compatibility; renders the child inside an inline reveal.
 */
export function RevealInline({
  children,
  delay = 0
}: {
  children: ReactNode;
  delay?: number;
}) {
  return (
    <Reveal as="span" delay={delay} variant="fade-up">
      {children}
    </Reveal>
  );
}
