"use client";

import type { CSSProperties, ReactNode } from "react";
import { motion } from "framer-motion";
import { cardHover, cardTap, wsCardHover } from "./presets";

/**
 * Hover-lift wrapper for a card or tile that is composed on the server (so it
 * can't hold its own `whileHover`). Framer Motion owns the transform here; make
 * sure the wrapped element's CSS does NOT also animate `transform` on `:hover`,
 * or the two will compound.
 *
 * `shell="ws"` uses the flatter, faster workspace hover per the product register.
 */
export function HoverCard({
  children,
  className,
  style,
  shell = "site",
  tap = true,
  href,
  ariaLabel
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  shell?: "site" | "ws";
  tap?: boolean;
  href?: string;
  ariaLabel?: string;
}) {
  const hover = shell === "ws" ? wsCardHover : cardHover;
  const commonProps = {
    className,
    style,
    whileHover: hover,
    whileTap: tap ? cardTap : undefined
  } as const;

  if (href) {
    return (
      <motion.a aria-label={ariaLabel} href={href} {...commonProps}>
        {children}
      </motion.a>
    );
  }

  return <motion.div {...commonProps}>{children}</motion.div>;
}
