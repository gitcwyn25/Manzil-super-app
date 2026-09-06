// Delivered by Originkit · stack: nextjs · styling: tailwind
"use client";

"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import SpotlightReveal from "@/components/originkit/ui/hero-01/spotlight-reveal";
import TrustedBy from "@/components/originkit/ui/hero-01/trusted-by";

/** Public asset URLs — use a function so preview rewriters stay stable. */
function asset(file: string) {
  return `/originkit/hero-01/${file}`;
}

const TRUSTED_LOGOS = [
  // {
  //   src: asset("logo-1.svg"),
  //   alt: "Logoipsum",
  //   width: 128,
  //   height: 10,
  // },
  {
    src: asset("logo-2.svg"),
    alt: "Logoipsum",
    width: 95,
    height: 22,
  },
  {
    src: asset("logo-3.svg"),
    alt: "Logoipsum",
    width: 108,
    height: 21,
  },
  {
    src: asset("logo-4.svg"),
    alt: "Logoipsum",
    width: 78,
    height: 18,
  },
] as const;

const easeOutCubic = [0.215, 0.61, 0.355, 1] as const;

const Annotation = () => {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute top-[-26px] -left-[165px] hidden h-[140px] w-[253px] select-none md:block"
    >
      <div className="absolute top-[23px] left-[73px] flex h-[36px] w-[80px] items-center justify-center">
        <div className="-scale-y-100 rotate-[83.54deg]">
          <img
            alt=""
            src={asset("annotation-arrow.svg")}
            width={27}
            height={78}
            className="lg:h-[78px] lg:w-[27px] h-[54px] w-[18px] max-w-none"
          />
        </div>
      </div>

      <p className="absolute lg:bottom-10 bottom-12 -left-10 lg:-left-20 flex w-[212px] rotate-[-10.6deg] flex-col justify-center text-center font-tillana text-[12px] lg:text-[18px] leading-[1.25] tracking-[-0.02em] text-[#144a58]">
        <span>Tried hold</span>
        <span>free for 7 days</span>
      </p>
    </div>
  );
};

const MenuIcon = () => {
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="size-4.5"
    >
      <path
        d="M2.25 4.5h13.5M2.25 9h13.5M2.25 13.5h13.5"
        stroke="white"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
};

const VideoPlayerButton = () => {
  return (
    <button
      type="button"
      aria-label="Play preview video"
      className="absolute top-1/2 left-1/2 z-10 flex size-14 -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-t border-[#bfbfbf] bg-linear-to-b from-[#eaeaea] to-white p-2.5 shadow-[inset_0_6px_13px_rgba(0,0,0,0.10)] transition-transform duration-200 ease will-change-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#010110] active:scale-[0.96] motion-reduce:transition-none motion-reduce:active:scale-100 [@media(hover:hover)_and_(pointer:fine)]:hover:scale-[1.04]"
    >
      <span className="relative flex size-full items-center justify-center overflow-hidden rounded-full bg-linear-to-b from-[#e0e0e0] to-white shadow-[0_4px_10px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.06),0_0_0_3px_rgba(255,255,255,0.65)]">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-full bg-white"
        />
        <img
          alt=""
          aria-hidden="true"
          src={asset("play.svg")}
          width={32}
          height={32}
          className="relative ml-px size-6"
        />
      </span>
    </button>
  );
};

const PREVIEW_IMAGE_CLASSNAME =
  "m-0 mx-auto block w-full object-top p-0 h-[300px] md:h-[320px] ipad:h-auto [mask-image:linear-gradient(to_bottom,black_0%,black_68%,rgba(0,0,0,0.45)_84%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_0%,black_68%,rgba(0,0,0,0.45)_84%,transparent_100%)]";

const BrowserPreview = ({ active }: { active: boolean }) => {
  const prefersReducedMotion = useReducedMotion();

  const hidden = prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 48 };
  const visible = prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 };

  return (
    <motion.div
      className="relative mx-auto mt-4 mb-[-72px] w-full min-w-0 max-w-[56rem] self-center will-change-transform ipad:mb-0 ipad:mt-6 laptop:mt-8"
      initial={hidden}
      animate={active ? visible : hidden}
      transition={{
        type: "tween",
        duration: prefersReducedMotion ? 0.2 : 0.45,
        ease: easeOutCubic,
      }}
    >
      <div className="translate-y-6 rounded-[14px] bg-[#f4f0e8] p-[8.5px] shadow-[0_0_6px_1px_rgba(0,0,0,0.05),0_0_200px_rgba(0,0,0,0.08),0_15px_20px_-17px_rgba(0,0,0,0.13),0_7px_14px_-10px_rgba(0,0,0,0.08)] ipad:translate-y-14 ipad:rounded-[18px]">
        <div className="relative overflow-hidden rounded-[5.5px] ipad:rounded-[9.5px]">
          <img
            alt="Mirror Pro dashboard preview in a browser mockup"
            src={asset("dashboard-preview.png")}
            width={2500}
            height={1280}
            className={`md:block hidden ${PREVIEW_IMAGE_CLASSNAME}`}
          />
          <img
            alt="Mirror Pro dashboard preview in a browser mockup"
            src={asset("mobile-dashboard.png")}
            width={2500}
            height={1280}
            className={`block md:hidden  ${PREVIEW_IMAGE_CLASSNAME}`}
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-24 bg-linear-to-t from-[#f4f0e8] from-0% via-[#f4f0e8]/85 via-30% to-transparent ipad:h-28 laptop:h-32"
          />

          <VideoPlayerButton />
        </div>
      </div>
    </motion.div>
  );
};

const SlideIn = ({
  active,
  children,
  className,
  y = 20,
  duration = 0.3,
  onComplete,
}: {
  active: boolean;
  children: ReactNode;
  className?: string;
  y?: number;
  duration?: number;
  onComplete?: () => void;
}) => {
  const prefersReducedMotion = useReducedMotion();
  const doneRef = useRef(false);

  const hidden = prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y };
  const visible = prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 };

  return (
    <motion.div
      className={className}
      initial={hidden}
      animate={active ? visible : hidden}
      transition={{
        type: "tween",
        duration: prefersReducedMotion ? 0.2 : duration,
        ease: easeOutCubic,
      }}
      onAnimationComplete={() => {
        if (!active || doneRef.current) return;
        doneRef.current = true;
        onComplete?.();
      }}
    >
      {children}
    </motion.div>
  );
};

const Hero01Content = () => {
  const prefersReducedMotion = useReducedMotion();
  const navDoneRef = useRef(false);

  const [showHero, setShowHero] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [showCtas, setShowCtas] = useState(false);
  const [showTrusted, setShowTrusted] = useState(false);

  useEffect(() => {
    if (!prefersReducedMotion) return;
    setShowHero(true);
    setShowDescription(true);
    setShowCtas(true);
    setShowTrusted(true);
  }, [prefersReducedMotion]);

  const handleNavComplete = () => {
    if (navDoneRef.current || prefersReducedMotion) return;
    navDoneRef.current = true;
    setShowHero(true);
  };

  const handleSpotlightComplete = () => {
    if (prefersReducedMotion) return;
    setShowDescription(true);
  };

  const handleDescriptionComplete = () => {
    if (prefersReducedMotion) return;
    setShowCtas(true);
    setShowTrusted(true);
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-white px-3 pt-2.5 text-[#010110]">
      <section
        aria-labelledby="onchat-hero-heading"
        className="relative mx-auto w-full overflow-hidden md:rounded-[10px] bg-[url(/originkit/hero-01/mesh-gradient.png)] bg-cover bg-center pb-0 rounded-[10px] ipad:pb-10 desktop-sm:min-h-200"
      >
        <div className="relative z-10 flex w-full flex-col items-center px-3 pt-3 ipad:px-4 ipad:pt-4">
          <motion.header
            className="flex w-full max-w-150.5 items-center justify-between gap-2 rounded-full border border-white bg-white px-2.5 py-1.5 shadow-[0_0_0.5px_rgba(0,0,0,0.5)] ipad:gap-3 ipad:px-3 ipad:py-2"
            initial={
              prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -28 }
            }
            animate={
              prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }
            }
            transition={{
              type: "tween",
              duration: prefersReducedMotion ? 0.2 : 0.3,
              ease: easeOutCubic,
            }}
            onAnimationComplete={handleNavComplete}
          >
            <a
              href="#main"
              className="flex shrink-0 items-center gap-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#010110] ipad:gap-1.5"
              aria-label="OnChat home"
            >
              <img
                alt=""
                aria-hidden="true"
                src={asset("logo-mark.svg")}
                width={24}
                height={24}
                className="size-5 ipad:size-6"
              />
              <span className="font-geist text-[1.125rem] font-medium leading-none text-black ipad:text-[1.35rem]">
                OnChat
              </span>
            </a>

            <nav
              aria-label="Primary"
              className="flex items-center gap-3 ipad:gap-6"
            >
              <a
                href="#login"
                className="text-sm font-medium leading-none text-[#363636] transition-colors duration-200 ease focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#010110] ipad:text-[15px] [@media(hover:hover)_and_(pointer:fine)]:hover:text-black"
              >
                Login
              </a>

              <a
                href="#contact"
                className="relative hidden min-h-11 items-center justify-center overflow-clip rounded-[41px] border border-solid border-[#57565f] px-5 py-3 text-center text-[15px] font-medium leading-[19.6px] text-white transition-[opacity,transform] duration-200 ease focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#010110] active:scale-[0.96] motion-reduce:active:scale-100 ipad:inline-flex [@media(hover:hover)_and_(pointer:fine)]:hover:opacity-90"
                style={{
                  boxShadow:
                    "0 4px 7.7px rgba(0,0,0,0.05), 0 10px 24px rgba(0,0,0,0.05), 0 24px 40.8px rgba(0,0,0,0.15), 0 25px 18.7px rgba(0,0,0,0.05), 0 52px 41.4px rgba(0,0,0,0.05)",
                }}
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-[41px]"
                  style={{
                    backgroundImage:
                      "linear-gradient(90deg, #000002, #000002), radial-gradient(ellipse 170px 258px at 50% -198px, rgba(237,239,255,0.71) 0%, rgba(237,239,255,0) 100%), linear-gradient(123.39deg, #1f1f21 0%, #3e3d4c 34%, #1f1f21 51%, #3e3d4c 72%, #1f1f21 100%)",
                  }}
                />
                <span className="relative">Contact Us</span>
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-[41px] shadow-[inset_0_5px_8px_rgba(255,255,255,0.05),inset_0_1px_1px_rgba(255,255,255,0.25)]"
                />
              </a>

              <button
                type="button"
                aria-label="Open menu"
                className="inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#111] text-white shadow-[0_4px_12px_rgba(0,0,0,0.18)] transition-[opacity,transform] duration-200 ease focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#010110] active:scale-[0.96] motion-reduce:active:scale-100 ipad:hidden [@media(hover:hover)_and_(pointer:fine)]:hover:opacity-90"
              >
                <MenuIcon />
              </button>
            </nav>
          </motion.header>

          <div
            id="main"
            className="mt-[62px] flex w-full max-w-162.75 scroll-mt-24 flex-col items-center gap-7 text-center iphone:mt-12 ipad:mt-16 ipad:gap-10 laptop:mt-31.5"
          >
            <div className="flex w-full flex-col items-center gap-3 ipad:gap-3.5">
              <SpotlightReveal
                id="onchat-hero-heading"
                text="Task Management Made Simple and Powerful"
                blur={6}
                delay={0}
                active={showHero}
                onComplete={handleSpotlightComplete}
                className="text-[32px] md:text-[44px] lg:text-[56px] font-medium leading-[1.15] tracking-[-0.02em] text-wrap text-[#010110] [text-shadow:0_5px_5px_rgba(0,0,0,0.05),0_1px_1px_rgba(0,0,0,0.16),0_1px_1px_rgba(255,255,255,0.6)] ipad:leading-[1.1]"
              />
              <SlideIn
                active={showDescription}
                y={16}
                duration={0.3}
                onComplete={handleDescriptionComplete}
                className="max-w-118.75 will-change-transform"
              >
                <p className="px-1 text-[clamp(15px,2.5vw,16px)] font-medium leading-normal tracking-[-0.02em] text-pretty text-[#45545e] ipad:px-0">
                  We optimize for the single statistic that matters: Amount of
                  real-world tasks a model can solve
                </p>
              </SlideIn>
            </div>

            <SlideIn
              active={showCtas}
              y={20}
              duration={0.3}
              className="relative flex w-full flex-col items-stretch gap-3 will-change-transform ipad:w-auto ipad:flex-row ipad:items-center ipad:justify-center ipad:gap-5"
            >
              <Annotation />
              <a
                href="#trial"
                className="relative inline-flex min-h-11.5 w-full shrink-0 items-center justify-center overflow-clip rounded-full border-3 border-solid border-[#3E3E3E] bg-linear-to-b from-[#292929] to-[#111] py-3.5 pr-5 pl-[19px] text-center text-[clamp(15px,2.5vw,16px)] font-medium leading-[1.1] tracking-[-0.01em] text-white transition-[opacity,transform] duration-200 ease focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#010110] active:scale-[0.96] motion-reduce:active:scale-100 ipad:w-auto [@media(hover:hover)_and_(pointer:fine)]:hover:opacity-90"
              >
                Start your free trial
              </a>
              <a
                href="#demo"
                className="relative inline-flex min-h-11.5 w-full shrink-0 items-center justify-center rounded-full border-3 border-solid border-white bg-linear-to-b from-[#f4f4f4] to-[#fefefe] py-3.5 pr-5 pl-[19px] text-center text-[clamp(15px,2.5vw,16px)] font-medium leading-[1.1] tracking-[-0.01em] text-[#161616] shadow-[0_0_0.225px_rgba(0,0,0,0.07),0_0_0.225px_rgba(0,0,0,0.05),0_2.698px_2.923px_-1.349px_rgba(0,0,0,0.25),0_0.899px_3.598px_0.899px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.14),inset_0_-1px_1px_rgba(0,0,0,0.06)] transition-[transform,box-shadow,opacity] duration-200 ease focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#010110] active:scale-[0.96] motion-reduce:transition-none motion-reduce:active:scale-100 motion-reduce:hover:translate-y-0 ipad:w-auto [@media(hover:hover)_and_(pointer:fine)]:hover:-translate-y-0.5 [@media(hover:hover)_and_(pointer:fine)]:hover:opacity-95 [@media(hover:hover)_and_(pointer:fine)]:hover:shadow-[0_0_0.225px_rgba(0,0,0,0.08),0_0_0.225px_rgba(0,0,0,0.06),0_4px_8px_-2px_rgba(0,0,0,0.22),0_2px_6px_1px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.14),inset_0_-1px_1px_rgba(0,0,0,0.06)]"
              >
                Book a demo
              </a>
            </SlideIn>
          </div>

          <BrowserPreview active={showHero} />
        </div>
      </section>
      <div className="relative z-10 mt-0 flex flex-col items-center px-4 pt-13.5 md:pt-17.5 pb-12 ipad:px-6 ipad:pb-16 laptop:pb-20">
        <TrustedBy logos={TRUSTED_LOGOS} active={showTrusted} />
      </div>
    </main>
  );
};

export default Hero01Content;
