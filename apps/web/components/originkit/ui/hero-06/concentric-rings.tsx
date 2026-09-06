// Delivered by Originkit · stack: nextjs · styling: tailwind
"use client";

"use client";

import { motion, useReducedMotion } from "motion/react";
import type { CSSProperties } from "react";
import { PixelBackground } from "@/components/originkit/ui/hero-06/pixel-background";

/** Public asset URLs — use a function so preview rewriters stay stable. */
function asset(file: string) {
  return `/originkit/hero-06/${file}`;
}

/** ease-out-cubic */
const EASE_OUT = [0.215, 0.61, 0.355, 1] as const;

/** Mobile ≈838 · tablet ≈1224 · desktop max 1404 */
const OUTER_SIZE = "clamp(838px, 164.5vw, 1404px)";

/** Mobile ≈412 · tablet/desktop 516 */
const INNER_SIZE = "clamp(412px, 69.4vw, 516px)";

const OUTER_RING = {
  src: asset("rings-ring-outer.svg"),
  size: OUTER_SIZE,
  opacity: "opacity-10",
  direction: "normal" as const,
  duration: "32s",
};

const INNER_RING = {
  src: asset("rings-ring-inner.svg"),
  size: INNER_SIZE,
  opacity: "opacity-10",
  direction: "normal" as const,
  duration: "24s",
};

const SOFT_RINGS = [
  {
    src: asset("rings-ring-outer-soft.png"),
    size: "clamp(884px, 173vw, 1479px)",
    opacity: "opacity-[0.1]",
    direction: "reverse" as const,
    duration: "40s",
  },
  {
    src: asset("rings-ring-inner-soft.png"),
    size: "clamp(426px, 71.8vw, 534px)",
    opacity: "opacity-[0.12]",
    direction: "reverse" as const,
    duration: "28s",
  },
] as const;

const RingLayer = ({
  src,
  size,
  opacity,
  direction,
  duration,
  reduceMotion,
}: {
  src: string;
  size: string;
  opacity: string;
  direction: "normal" | "reverse";
  duration: string;
  reduceMotion: boolean | null;
}) => (
  <div
    className={`absolute left-1/2 top-[var(--ring-cy,50%)] -translate-x-1/2 -translate-y-1/2 ${opacity}`}
    style={{ width: size, height: size } as CSSProperties}
  >
    <div
      className={`size-full motion-safe:animate-ring-rotate ${
        direction === "reverse"
          ? "motion-safe:[animation-direction:reverse]"
          : ""
      } ${reduceMotion ? "motion-reduce:animate-none" : ""}`}
      style={{ animationDuration: duration } as CSSProperties}
    >
      <img
        src={src}
        alt=""
        className="size-full object-contain"
        draggable={false}
      />
    </div>
  </div>
);

/**
 * Pixel field sits in the annulus between hard rings.
 * Radii = half of INNER_SIZE / OUTER_SIZE, slightly inset so ticks stay clear.
 * Center MUST match RingLayer (`--ring-cy`) — previously 50% 50% so the
 * mask missed the ring gap on mobile/tablet.
 */
const PIXEL_INNER_EDGE = "clamp(210px, 35.5vw, 262px)"; // ≥ INNER_SIZE / 2
const PIXEL_OUTER_EDGE = "clamp(412px, 81vw, 690px)"; // ≤ OUTER_SIZE / 2

const PIXEL_ANNULUS_MASK: CSSProperties = {
  WebkitMaskImage: `radial-gradient(circle at 50% var(--ring-cy, 50%), transparent ${PIXEL_INNER_EDGE}, #000 ${PIXEL_INNER_EDGE}, #000 ${PIXEL_OUTER_EDGE}, transparent ${PIXEL_OUTER_EDGE})`,
  maskImage: `radial-gradient(circle at 50% var(--ring-cy, 50%), transparent ${PIXEL_INNER_EDGE}, #000 ${PIXEL_INNER_EDGE}, #000 ${PIXEL_OUTER_EDGE}, transparent ${PIXEL_OUTER_EDGE})`,
  WebkitMaskRepeat: "no-repeat",
  maskRepeat: "no-repeat",
  WebkitMaskSize: "100% 100%",
  maskSize: "100% 100%",
};

export const ConcentricRings = () => {
  const reduceMotion = useReducedMotion();

  return (
    <div
      className="pointer-events-none absolute inset-0 z-[1] [--ring-cy:300px] ipad:[--ring-cy:450px] desktop-sm:[--ring-cy:50%]"
      aria-hidden="true"
    >
      <motion.div
        className="relative size-full"
        initial={
          reduceMotion ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.94 }
        }
        animate={{ opacity: 1, scale: 1 }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : { type: "tween", duration: 0.5, ease: EASE_OUT }
        }
      >
        {/* Pixels behind both rings — cream fill was covering the outer ticks */}
        <div className="absolute inset-0 z-0" style={PIXEL_ANNULUS_MASK}>
          <PixelBackground />
        </div>

        {/* Rings above pixels so outer + inner ticks stay visible */}
        <div className="absolute inset-0 z-10">
          <RingLayer {...SOFT_RINGS[0]} reduceMotion={reduceMotion} />
          <RingLayer {...OUTER_RING} reduceMotion={reduceMotion} />
          <RingLayer {...SOFT_RINGS[1]} reduceMotion={reduceMotion} />
          <RingLayer {...INNER_RING} reduceMotion={reduceMotion} />
        </div>
      </motion.div>
    </div>
  );
};
