// Delivered by Originkit · stack: nextjs · styling: tailwind
"use client";

"use client";

import { motion, useReducedMotion } from "motion/react";

type TrustedLogo = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

type TrustedByProps = {
  logos: readonly TrustedLogo[];
  active?: boolean;
};

const easeOutCubic = [0.215, 0.61, 0.355, 1] as const;

/** Repeat so each half fills the viewport — required for a seamless -50% loop. */
const MARQUEE_REPEAT = 3;

const LogoItem = ({
  logo,
  duplicate = false,
}: {
  logo: TrustedLogo;
  duplicate?: boolean;
}) => (
  <li
    className="flex h-5.5 shrink-0 items-center opacity-80"
    aria-hidden={duplicate || undefined}
  >
    <img
      alt={duplicate ? "" : logo.alt}
      src={logo.src}
      width={logo.width}
      height={logo.height}
      className="h-full w-auto max-w-none object-contain"
    />
  </li>
);

const MarqueeHalf = ({
  logos,
  duplicate = false,
}: {
  logos: readonly TrustedLogo[];
  duplicate?: boolean;
}) => (
  <ul
    className="flex shrink-0 items-center gap-x-6 pr-6 ipad:gap-x-10 ipad:pr-10"
    aria-hidden={duplicate || undefined}
  >
    {Array.from({ length: MARQUEE_REPEAT }, (_, repeatIndex) =>
      logos.map((logo) => (
        <LogoItem
          key={`${duplicate ? "b" : "a"}-${repeatIndex}-${logo.src}`}
          logo={logo}
          duplicate={duplicate || repeatIndex > 0}
        />
      )),
    )}
  </ul>
);

const TrustedBy = ({ logos, active = false }: TrustedByProps) => {
  const prefersReducedMotion = useReducedMotion();

  const hidden = prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 24 };
  const visible = prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 };

  return (
    <motion.div
      className="flex w-full max-w-295.5 flex-col items-center gap-5 will-change-transform ipad:gap-6"
      initial={hidden}
      animate={active ? visible : hidden}
      transition={{
        type: "tween",
        duration: prefersReducedMotion ? 0.2 : 0.35,
        ease: easeOutCubic,
      }}
    >
      <div className="flex w-full max-w-150 items-center gap-3 ipad:gap-4">
        <span
          aria-hidden="true"
          className="h-px min-w-0 flex-1 bg-linear-to-r from-[#4b4b4b]/0 to-[#4b4b4b]"
        />
        <p className="shrink-0 text-center text-[16px] font-medium tracking-[-0.0125em] text-black/70 ipad:text-base">
          More than 100+
          <br className="block ipad:hidden" /> companies trusted us
        </p>
        <span
          aria-hidden="true"
          className="h-px min-w-0 flex-1 bg-linear-to-r from-[#4b4b4b] to-[#4b4b4b]/0"
        />
      </div>

      <div
        className="relative w-full overflow-hidden mask-[linear-gradient(to_right,transparent,black_12%,black_88%,transparent)] [-webkit-mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)] motion-reduce:hidden desktop-sm:hidden"
        aria-label="Trusted brands"
        role="region"
      >
        <div className="flex w-max items-center animate-trusted-marquee will-change-transform motion-reduce:animate-none">
          <MarqueeHalf logos={logos} />
          <MarqueeHalf logos={logos} duplicate />
        </div>
      </div>

      <ul className="hidden w-full flex-wrap items-center justify-center gap-x-6 gap-y-4 motion-reduce:flex ipad:gap-x-10 laptop:gap-x-14 desktop-sm:flex">
        {logos.map((logo) => (
          <li key={logo.src} className="flex h-5.5 items-center opacity-80">
            <img
              alt={logo.alt}
              src={logo.src}
              width={logo.width}
              height={logo.height}
              className="h-full w-auto max-w-none object-contain"
            />
          </li>
        ))}
      </ul>
    </motion.div>
  );
};

export default TrustedBy;
