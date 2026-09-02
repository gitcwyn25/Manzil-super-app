// Delivered by Originkit · stack: nextjs · styling: tailwind
"use client";

"use client";

import { motion, useReducedMotion } from "motion/react";
import SpiralImages from "@/components/originkit/ui/hero-06/spiral-image";
import { HeroContent } from "@/components/originkit/ui/hero-06/hero-content";

/** Public asset URLs — use a function so preview rewriters stay stable. */
function asset(file: string) {
  return `/originkit/hero-06/${file}`;
}

/** ease-out-cubic */
const EASE_OUT = [0.215, 0.61, 0.355, 1] as const;

const CLUSTER_POSITION =
  "absolute inset-x-0 top-[96px] flex justify-center ipad:top-[191px] desktop-sm:top-[30.7%] desktop-sm:-translate-y-[130px]";

/** Figma lens: mobile 150 · tablet 201 · desktop fluid */
const LENS_BOX =
  "size-[150px] w-[150px] h-[150px] shrink-0 ipad:size-[201px] ipad:w-[201px] ipad:h-[201px] desktop-sm:size-[clamp(140px,13.3vw,201px)] desktop-sm:w-[clamp(140px,13.3vw,201px)] desktop-sm:h-[clamp(140px,13.3vw,201px)]";

type SpiralStageProps = {
  onExplorePeople: () => void;
  onViewStories: () => void;
};

export const SpiralStage = ({
  onExplorePeople,
  onViewStories,
}: SpiralStageProps) => {
  const reduceMotion = useReducedMotion();

  return (
    <div className="pointer-events-none relative h-full w-full">
      {/*
        Layer order (back → front):
        1. Spiral images (z-20) — Originkit defaults only
        2. Lens + glow pedestal (z-25)
        3. Hero copy (z-30)
      */}

      <motion.div
        className="absolute inset-0 z-20 translate-y-[-20%] md:translate-y-0"
        initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={
          reduceMotion
            ? { duration: 0 }
            : { type: "tween", duration: 0.55, ease: EASE_OUT, delay: 0.12 }
        }
      >
        <SpiralImages />
      </motion.div>

      {/* Lens — Figma 1:456: glow inset behind transparent lens PNG */}
      <div className={`${CLUSTER_POSITION} z-[25]`}>
        <motion.div
          className="relative flex w-full max-w-[1512px] flex-col items-center px-4"
          initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            reduceMotion
              ? { duration: 0 }
              : { type: "tween", duration: 0.45, ease: EASE_OUT, delay: 0.2 }
          }
        >
          <motion.div
            className={`relative overflow-visible ${LENS_BOX}`}
            initial={
              reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }
            }
            animate={{ opacity: 1, y: 0 }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : { type: "tween", duration: 0.45, ease: EASE_OUT, delay: 0.24 }
            }
          >
            {/* Ellipse 48438 — left 8 top 5 size 182 in 201 frame, bleed -16.48% */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute z-0"
              style={{
                left: `${(8 / 201) * 100}%`,
                top: `${(5 / 201) * 100}%`,
                width: `${(182 / 201) * 100}%`,
                height: `${(182 / 201) * 100}%`,
              }}
            >
              <div className="absolute inset-[-16.48%]">
                <img
                  src={asset("lens-lens-glow.svg")}
                  alt=""
                  className="block size-full max-w-none"
                  draggable={false}
                />
              </div>
            </div>

            <img
              src={asset("lens-camera-lens.png")}
              alt=""
              width={201}
              height={201}
              className="absolute inset-0 z-[1] size-full object-cover"
              aria-hidden="true"
              draggable={false}
            />
          </motion.div>
        </motion.div>
      </div>

      {/* Copy — above spiral; spacer = lens + 14px gap (Figma) */}
      <div className={`${CLUSTER_POSITION} z-30`}>
        <div className="relative flex w-full max-w-[1512px] flex-col items-center px-4">
          <div
            className={`mb-[14px] desktop-sm:mb-1 ${LENS_BOX}`}
            aria-hidden="true"
          />
          <HeroContent
            onExplorePeople={onExplorePeople}
            onViewStories={onViewStories}
          />
        </div>
      </div>
    </div>
  );
};
