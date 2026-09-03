// Delivered by Originkit · stack: nextjs · styling: tailwind
"use client";

"use client";

import Image from "next/image";

/** Public asset URLs — use a function so preview rewriters stay stable. */
function asset(file: string) {
  return `/originkit/footer-01/${file}`;
}

const NAV_LINKS = [
  { label: "Benefits", href: "#benefits" },
  { label: "Features", href: "#features" },
  { label: "How To Use", href: "#how-to-use" },
  { label: "Pricing", href: "#pricing" },
  { label: "Testimonials", href: "#testimonials" },
  { label: "Waitlist", href: "#waitlist" },
] as const;

const SOCIAL_LINKS = [
  {
    label: "LinkedIn",
    href: "https://linkedin.com",
    icon: "linkedin.svg",
  },
  {
    label: "X",
    href: "https://x.com",
    icon: "twitter.svg",
  },
  {
    label: "Instagram",
    href: "https://instagram.com",
    icon: "instagram.svg",
  },
] as const;

const STORE_BUTTONS = [
  {
    href: "https://play.google.com",
    icon: "google-play.svg",
    eyebrow: "Get It On",
    label: "Google Play",
    ariaLabel: "Get it on Google Play",
  },
  {
    href: "https://apps.apple.com",
    icon: "app-store.svg",
    eyebrow: "Download on",
    label: "App Store",
    ariaLabel: "Download on the App Store",
  },
] as const;

type PhoneMockupProps = {
  screen: string;
  screenWidth: number;
  screenHeight: number;
  className?: string;
};

/**
 * Mobile.svg frame with Vector screen layered on top.
 * (The SVG’s inner fill is solid #1D1D1B — content behind it is invisible,
 * so the screenshot must sit above the frame, clipped to the screen inset.)
 */
function PhoneMockup({
  screen,
  screenWidth,
  screenHeight,
  className = "",
}: PhoneMockupProps) {
  return (
    <div className={`relative overflow-clip ${className}`}>
      <Image
        src={asset("Mobile.svg")}
        alt=""
        aria-hidden="true"
        width={235}
        height={476}
        priority
        className="pointer-events-none absolute inset-0 size-full object-fill"
      />

      <div
        aria-hidden="true"
        className="absolute inset-[2.1%_4.9%_2.1%_4.9%] z-[1] overflow-clip rounded-[6%] bg-[#1d1d1b]"
      >
        <Image
          src={asset(screen)}
          alt=""
          width={screenWidth}
          height={screenHeight}
          priority
          className="size-full object-cover object-top"
        />
      </div>

      <Image
        src={asset("dynamic-island.svg")}
        alt=""
        aria-hidden="true"
        width={52}
        height={16}
        priority
        className="pointer-events-none absolute top-[3%] left-1/2 z-[2] w-[22.1%] -translate-x-1/2"
      />
    </div>
  );
}

const PHONES_STAGE_W = 506.68;
const PHONES_STAGE_H = 528.892;

/** Convert design-px → % of stage (so the cluster scales with container width). */
const stageX = (px: number) => `${(px / PHONES_STAGE_W) * 100}%`;
const stageY = (px: number) => `${(px / PHONES_STAGE_H) * 100}%`;

function PhonesHero() {
  return (
    <div className="pointer-events-none relative z-10 mx-auto w-full max-w-[506.68px]">
      <div
        className="relative w-full mask-b-from-20% mask-b-to-80%"
        style={{ aspectRatio: `${PHONES_STAGE_W} / ${PHONES_STAGE_H}` }}
      >
        <div
          aria-hidden="true"
          className="absolute inset-0 z-0 opacity-60"
          style={{
            backgroundImage:
              "radial-gradient(circle, #c8ced8 1.4px, transparent 1.5px)",
            backgroundSize: "9.02px 9.02px",
            maskImage:
              "radial-gradient(ellipse 80% 70% at 50% 40%, black 20%, transparent 75%), linear-gradient(to bottom, black 0%, black 55%, transparent 100%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 80% 70% at 50% 40%, black 20%, transparent 75%), linear-gradient(to bottom, black 0%, black 55%, transparent 100%)",
            maskComposite: "intersect",
            WebkitMaskComposite: "source-in",
          }}
        />

        {/* Left phone — flip-in after center */}
        <div
          className="absolute bottom-0 z-[1] flex -translate-x-1/2 items-center justify-center [perspective:900px]"
          style={{
            left: `calc(50% - ${stageX(102.85)})`,
            width: stageX(300.972),
            height: stageY(451.104),
          }}
        >
          <div className="flex size-full origin-bottom items-center justify-center animate-phone-flip-in-x will-change-transform motion-reduce:animate-none [transform-style:preserve-3d] [animation-delay:280ms]">
            <div
              className="relative rotate-[-14.52deg]"
              style={{
                width: `${(203.908 / 300.972) * 100}%`,
                aspectRatio: "203.908 / 413.181",
              }}
            >
              <PhoneMockup
                screen="Vector2.png"
                screenWidth={362}
                screenHeight={788}
                className="size-full"
              />
            </div>
          </div>
        </div>

        {/* Right phone — flip-in after center */}
        <div
          className="absolute bottom-0 z-[1] flex -translate-x-1/2 items-center justify-center [perspective:900px]"
          style={{
            left: `calc(50% + ${stageX(102.84)})`,
            width: stageX(300.987),
            height: stageY(451.108),
          }}
        >
          <div className="flex size-full origin-bottom items-center justify-center animate-phone-flip-in-x will-change-transform motion-reduce:animate-none [transform-style:preserve-3d] [animation-delay:360ms]">
            <div
              className="relative rotate-[14.52deg]"
              style={{
                width: `${(203.908 / 300.987) * 100}%`,
                aspectRatio: "203.908 / 413.181",
              }}
            >
              <PhoneMockup
                screen="Vector3.png"
                screenWidth={362}
                screenHeight={788}
                className="size-full"
              />
            </div>
          </div>
        </div>

        {/* Center phone — slide up first */}
        <div
          className="absolute left-1/2 z-10 -translate-x-1/2 animate-phone-slide-up will-change-transform motion-reduce:animate-none [animation-delay:0ms]"
          style={{
            bottom: stageY(21.82),
            width: stageX(234.606),
            aspectRatio: "234.606 / 475.386",
          }}
        >
          <PhoneMockup
            screen="Vector.png"
            screenWidth={417}
            screenHeight={906}
            className="size-full"
          />
        </div>
      </div>
    </div>
  );
}

function StoreButton({
  href,
  icon,
  eyebrow,
  label,
  ariaLabel,
}: (typeof STORE_BUTTONS)[number]) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      className="inline-flex h-[65px] w-[195px] touch-manipulation items-center justify-center gap-2.5 rounded-full border border-solid border-[#dee5ed] bg-[#f5f7fa] px-6 py-3 transition-[background-color,border-color] duration-200 ease focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#333] motion-reduce:transition-none xl:h-[68px] xl:w-[192px] [@media(hover:hover)_and_(pointer:fine)]:hover:border-[#c9d3e0] [@media(hover:hover)_and_(pointer:fine)]:hover:bg-[#eef2f7]"
    >
      <span className="relative size-8 shrink-0 overflow-clip">
        <Image
          src={asset(icon)}
          alt=""
          width={32}
          height={32}
          className="size-full"
          aria-hidden="true"
        />
      </span>
      <span className="flex flex-col items-start justify-center font-medium leading-[1.5]">
        <span className="text-[13px] text-[#262626]">{eyebrow}</span>
        <span className="whitespace-nowrap text-[16px] text-[#333] xl:text-[18px]">
          {label}
        </span>
      </span>
    </a>
  );
}

function DownloadFooter() {
  return (
    <footer className="flex w-full flex-col gap-12.5">
      <div className="flex items-center gap-4.5 iphone:gap-7.5">
        <div aria-hidden="true" className="h-px min-w-0 flex-1 bg-[#dee5ed]" />
        <a
          href="mailto:hello@capable.com"
          className="inline-flex min-h-12 shrink-0 touch-manipulation items-center gap-1 rounded-full border border-solid border-[#dee5ed] bg-[#f5f7fa] px-4 py-3 transition-[background-color,border-color] duration-200 ease focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#333] [@media(hover:hover)_and_(pointer:fine)]:hover:border-[#c9d3e0] [@media(hover:hover)_and_(pointer:fine)]:hover:bg-[#eef2f7]"
        >
          <span className="relative size-6 shrink-0 overflow-clip">
            <Image
              src={asset("email.svg")}
              alt=""
              width={24}
              height={24}
              className="size-full"
              aria-hidden="true"
            />
          </span>
          <span className="whitespace-nowrap text-base font-medium leading-normal text-[#262626] xl:text-[18px]">
            hello@capable.com
          </span>
        </a>
        <div aria-hidden="true" className="h-px min-w-0 flex-1 bg-[#dee5ed]" />
      </div>

      <div className="flex flex-col gap-12.5">
        <nav
          aria-label="Footer"
          className="flex flex-wrap items-center justify-center gap-3 iphone:gap-4.5"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="group relative inline-flex min-h-[52px] touch-manipulation items-center justify-center overflow-clip rounded-full border border-solid border-[#dee5ed] bg-[#f5f7fa] px-5 py-3.5 text-base font-medium leading-normal whitespace-nowrap text-[#333] transition-[background-color,border-color] duration-200 ease focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#333] motion-reduce:transition-none xl:min-h-[55px] [@media(hover:hover)_and_(pointer:fine)]:hover:border-[#c9d3e0] [@media(hover:hover)_and_(pointer:fine)]:hover:bg-[#eef2f7]"
            >
              <span className="translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] will-change-transform motion-reduce:transition-none xl:text-[18px] [@media(hover:hover)_and_(pointer:fine)]:group-hover:-translate-y-[150%]">
                {link.label}
              </span>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 flex translate-y-[150%] items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] will-change-transform motion-reduce:transition-none xl:text-[18px] [@media(hover:hover)_and_(pointer:fine)]:group-hover:translate-y-0"
              >
                {link.label}
              </span>
            </a>
          ))}
        </nav>

        <div className="relative flex flex-col items-center gap-6 border-t border-solid border-[#dee5ed] px-4 py-6 ipad-landscape:flex-row ipad-landscape:justify-between ipad-landscape:gap-0 ipad-landscape:px-7.5 ipad-landscape:py-7.5">
          <p className="order-2 text-base font-medium leading-normal text-[#262626] ipad-landscape:order-1 xl:text-[18px]">
            Template by Origin
          </p>

          <div className="order-1 mx-auto flex items-center justify-center gap-2.5 md:max-w-[530px] ipad-landscape:absolute ipad-landscape:top-1/2 ipad-landscape:left-1/2 ipad-landscape:order-0 ipad-landscape:-translate-x-1/2 ipad-landscape:-translate-y-1/2">
            {SOCIAL_LINKS.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className="inline-flex size-11 touch-manipulation items-center justify-center rounded-full bg-[#262626] p-2.5 transition-[background-color,transform] duration-200 ease focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#262626] motion-reduce:transition-none [@media(hover:hover)_and_(pointer:fine)]:hover:-translate-y-0.5 [@media(hover:hover)_and_(pointer:fine)]:hover:bg-[#3a3a3a]"
              >
                <span className="relative size-6 overflow-clip">
                  <Image
                    src={asset(social.icon)}
                    alt=""
                    width={24}
                    height={24}
                    className="size-full"
                    aria-hidden="true"
                  />
                </span>
              </a>
            ))}
          </div>

          <a
            href="#privacy"
            className="order-3 text-base font-medium leading-normal text-[#262626] transition-colors duration-200 ease focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#262626] xl:text-[18px] [@media(hover:hover)_and_(pointer:fine)]:hover:text-[#333]"
          >
            Privacy Policy
          </a>
        </div>
      </div>
    </footer>
  );
}

/** Capable download footer from https://github.com/diip3sh/sections — app/section-10 */
export function Section10Download() {
  return (
    <section
      aria-label="Download Capable"
      className="relative w-full overflow-hidden bg-white text-[#0d0d0d]"
    >
      <div className="relative mx-auto flex w-full flex-col items-center px-4 pt-8 pb-10 android-sm:pt-10 ipad:px-[119px] ipad:pt-12 ipad:pb-16">
        <div
          id="download"
          className="flex w-full max-w-[1201px] flex-col items-center gap-[clamp(3.5rem,8vw,6.25rem)]"
        >
          <div className="relative flex w-full flex-col items-center gap-0 pt-10">
            <PhonesHero />

            <div className="relative z-20 -mt-14 flex w-full animate-hero-reveal flex-col items-center gap-5 px-0 pt-8 text-center motion-reduce:animate-none android-sm:-mt-16 ipad:-mt-20 md:pt-6 [animation-delay:80ms] desktop-sm:max-w-[695px]">
              <h1 className="font-urbanist text-[30px] font-bold leading-[1.2] text-pretty text-[#0d0d0d] lg:text-[45px] xl:text-[58px]">
                Download Capable and Connect Today
              </h1>
              <p className="mx-auto w-full text-base font-medium leading-normal text-pretty text-[#666] lg:max-w-[650px] xl:text-[18px]">
                Download Capable now to start connecting with like-minded people
                and enjoy a seamless social experience!
              </p>
            </div>

            <div className="relative z-20 flex w-full animate-hero-reveal flex-col items-center justify-center gap-4 pt-10 motion-reduce:animate-none iphone:items-center iphone:gap-5 lg:flex-row lg:gap-5 [animation-delay:160ms]">
              {STORE_BUTTONS.map((button) => (
                <StoreButton key={button.label} {...button} />
              ))}
            </div>
          </div>

          <DownloadFooter />
        </div>
      </div>
    </section>
  );
}
