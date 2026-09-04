// Delivered by Originkit · stack: nextjs · styling: tailwind
"use client";

"use client";

import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/originkit/ui/hero-06/button";

/** ease-out-cubic */
const EASE_OUT = [0.215, 0.61, 0.355, 1] as const;

type HeroContentProps = {
  onExplorePeople: () => void;
  onViewStories: () => void;
};

/**
 * Hero copy + CTAs — Figma Frame 8305 (1:1641) desktop;
 * mobile/tablet scales from 1:1028 / 1:441.
 */
export const HeroContent = ({
  onExplorePeople,
  onViewStories,
}: HeroContentProps) => {
  const reduceMotion = useReducedMotion();

  const reveal = (delay: number) =>
    reduceMotion
      ? { initial: { opacity: 1 }, animate: { opacity: 1 } }
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: {
            type: "tween" as const,
            duration: 0.45,
            ease: EASE_OUT,
            delay,
          },
        };

  return (
    <div className="pointer-events-none relative z-20 flex w-full max-w-[370px] flex-col items-center gap-4 px-0 ipad:max-w-[423px] ipad:gap-6">
      {/* Frame 8303 — gap 16px (Figma) */}
      <div className="flex w-full flex-col items-center gap-2 text-center ipad:gap-4">
        <motion.h1
          {...reveal(0.28)}
          className="pointer-events-auto w-full max-w-[370px] font-helvetica-neue text-[32px] desktop-sm:text-[40px] font-medium leading-tight tracking-[-1.28px] text-balance ipad:max-w-[423px] ipad:text-[40px] ipad:tracking-[-1.6px]"
        >
          <span className="text-black/40">Meet the People Behind </span>
          <span className="text-black">Every Great Idea.</span>
        </motion.h1>

        <motion.p
          {...reveal(0.36)}
          className="pointer-events-auto w-full max-w-[312px] font-sans text-[14px] leading-normal tracking-[-0.56px] text-black/40 text-pretty ipad:max-w-none ipad:text-[15px] ipad:tracking-[-0.6px]"
        >
          Connect with creators, professionals, and communities shaping the
          future together.
        </motion.p>
      </div>

      {/* Frame 8395 — gap 24px (Figma) */}
      <motion.div
        {...reveal(0.48)}
        className="pointer-events-auto flex flex-row flex-wrap items-center justify-center gap-4 ipad:gap-6"
      >
        <Button
          variant="primary"
          aria-label="Explore People"
          onClick={onExplorePeople}
        >
          Explore People
        </Button>
        <Button
          variant="secondary"
          aria-label="View Stories"
          onClick={onViewStories}
        >
          View Stories
        </Button>
      </motion.div>
    </div>
  );
};
