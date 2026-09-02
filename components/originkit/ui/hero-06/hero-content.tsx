// Delivered by Originkit · stack: nextjs · styling: tailwind
"use client";

import { motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/originkit/ui/hero-06/button";

/** ease-out-cubic */
const EASE_OUT = [0.215, 0.61, 0.355, 1] as const;

type HeroContentProps = {
  onExplorePeople: () => void;
  onViewStories: () => void;
};

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
      <div className="flex w-full flex-col items-center gap-2 text-center ipad:gap-4">
        <motion.h1
          {...reveal(0.28)}
          className="pointer-events-auto w-full max-w-[370px] font-helvetica-neue text-[30px] desktop-sm:text-[38px] font-medium leading-tight tracking-[-1.28px] text-balance ipad:max-w-[423px] ipad:text-[38px] ipad:tracking-[-1.6px]"
        >
          <span className="text-black/40">Toshkentdagi sara joylar. </span>
          <span className="text-black">Gurman AI topadi.</span>
        </motion.h1>

        <motion.p
          {...reveal(0.36)}
          className="pointer-events-auto w-full max-w-[312px] font-sans text-[14px] leading-normal tracking-[-0.56px] text-black/60 text-pretty ipad:max-w-none ipad:text-[15px] ipad:tracking-[-0.6px]"
        >
          Tabiiy tilda yozing: Gurman AI Manzil katalogidan sizga mos restoran, kafe va xizmatlarni saralaydi.
        </motion.p>
      </div>

      <motion.div
        {...reveal(0.44)}
        className="pointer-events-auto flex w-full flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4"
      >
        <Button
          variant="primary"
          aria-label="Tavsiya olish"
          onClick={() => {
            const el = document.getElementById("gurman-workstation");
            el?.scrollIntoView({ behavior: "smooth", block: "start" });
          }}
          className="w-full sm:w-auto"
        >
          Tavsiya olish
        </Button>

        <Button
          variant="secondary"
          aria-label="Katalogni ko'rish"
          onClick={() => {
            window.location.href = "/uz/discover";
          }}
          className="w-full sm:w-auto"
        >
          Katalogni ko'rish
        </Button>
      </motion.div>
    </div>
  );
};
