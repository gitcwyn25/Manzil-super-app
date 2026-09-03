// Delivered by Originkit · stack: nextjs · styling: tailwind
"use client";

"use client";

import { useEffect, useRef } from "react";
import { motion, useReducedMotion } from "motion/react";

type SpotlightRevealProps = {
  text: string;
  id?: string;
  className?: string;
  blur?: number;
  delay?: number;
  active?: boolean;
  onComplete?: () => void;
};

const easeOutCubic = [0.215, 0.61, 0.355, 1] as const;

const SpotlightReveal = ({
  text,
  id,
  className,
  blur = 6,
  delay = 0,
  active = true,
  onComplete,
}: SpotlightRevealProps) => {
  const prefersReducedMotion = useReducedMotion();
  const words = text.split(" ");
  const lastIndex = words.length - 1;
  const completedRef = useRef(false);

  useEffect(() => {
    if (active) completedRef.current = false;
  }, [active]);

  const handleWordComplete = (index: number) => {
    if (index !== lastIndex || completedRef.current) return;
    completedRef.current = true;
    onComplete?.();
  };

  return (
    <h1 id={id} aria-label={text} className={className}>
      {words.map((word, index) => {
        const wordDelay = prefersReducedMotion ? 0 : delay + index * 0.06;
        const hidden = prefersReducedMotion
          ? { opacity: 0 }
          : { opacity: 0, y: 12, filter: `blur(${blur}px)` };
        const visible = prefersReducedMotion
          ? { opacity: 1 }
          : { opacity: 1, y: 0, filter: "blur(0px)" };

        return (
          <motion.span
            key={`${word}-${index}`}
            className="inline-block"
            aria-hidden="true"
            initial={hidden}
            animate={active ? visible : hidden}
            transition={{
              type: "tween",
              duration: prefersReducedMotion ? 0.2 : 0.4,
              delay: active ? wordDelay : 0,
              ease: easeOutCubic,
            }}
            onAnimationComplete={() => {
              if (active) handleWordComplete(index);
            }}
          >
            {word}
            {index < words.length - 1 ? "\u00A0" : null}
          </motion.span>
        );
      })}
    </h1>
  );
};

export default SpotlightReveal;
