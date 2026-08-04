"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";
import { DUR, EASE_OUT } from "./presets";

/**
 * App-wide Framer Motion configuration.
 *
 * `reducedMotion="user"` is the accessibility contract: when the OS requests
 * reduced motion, Framer Motion drops transform/layout animations and keeps
 * only opacity, turning every reveal into a plain crossfade. No per-component
 * media query needed.
 *
 * The default `transition` gives any bare `animate` a consistent house curve.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ duration: DUR.med, ease: EASE_OUT }}>
      {children}
    </MotionConfig>
  );
}
