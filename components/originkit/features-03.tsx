"use client";

import "./process-01.css";
/** Asset root — flat files in package assets/. */
const A = "/originkit/features-03";

type Step = {
  step: string;
  title: string;
  description: string;
  screen: string;
  screenAlt: string;
  screenWidth: number;
  screenHeight: number;
};

const STEPS: Step[] = [
  {
    step: "Step 01",
    title: "Create an Account",
    description:
      "Create an account to start exploring and enrolling in courses.",
    screen: `${A}/screen-1.png`,
    screenAlt:
      "Task details screen showing assign to, deadline, priority, and members",
    screenWidth: 468,
    screenHeight: 1014,
  },
  {
    step: "Step 02",
    title: "Complete your Course",
    description:
      "Complete your courses by engaging with all lessons and assignments.",
    screen: `${A}/screen-2.png`,
    screenAlt: "Dashboard screen showing ongoing projects and today’s tasks",
    screenWidth: 468,
    screenHeight: 1014,
  },
  {
    step: "Step 03",
    title: "Receive Certificates",
    description:
      "Earn certificates upon course completion to showcase your new skills.",
    screen: `${A}/screen-3.png`,
    screenAlt: "Project details screen showing a 78 percent progress gauge",
    screenWidth: 468,
    screenHeight: 1014,
  },
];

/**
 * Figma node 3035:9939 — layered phone mockup.
 * Anchored from the top so the Dynamic Island stays visible; translate-y
 * eases upward with viewport so small screens show only the top peek.
 */
const PhoneMockup = ({
  screen,
  screenAlt,
  screenWidth,
  screenHeight,
}: {
  screen: string;
  screenAlt: string;
  screenWidth: number;
  screenHeight: number;
}) => {
  return (
    <div className="absolute top-[clamp(0.5rem,2.5vw,1.75rem)] left-1/2 aspect-[263.67/532] w-[clamp(10rem,70%,16.479375rem)] -translate-x-1/2 translate-y-3 overflow-clip will-change-transform ipad:translate-y-2 ipad-landscape:translate-y-0 laptop:translate-y-0 motion-reduce:translate-y-0">
      {/* Outer frame */}
      <div className="absolute inset-x-[0.84%] inset-y-0" aria-hidden="true">
        <img
          alt=""
          src={`${A}/phone-frame.svg`}
          width={259}
          height={532}
          className="size-full"
        />
      </div>

      {/* Screen glare */}
      <div
        className="absolute inset-[0.23%_1.33%_0.24%_1.32%] mix-blend-screen"
        aria-hidden="true"
      >
        <img
          alt=""
          src={`${A}/phone-glare.svg`}
          width={256}
          height={529}
          className="size-full"
        />
      </div>

      {/* Inner bezel */}
      <div
        className="absolute inset-[0.76%_2.53%_0.76%_2.51%]"
        aria-hidden="true"
      >
        <img
          alt=""
          src={`${A}/phone-bezel.svg`}
          width={250}
          height={524}
          className="size-full"
        />
      </div>

      {/* App screen */}
      <div className="absolute inset-[2.36%_5.65%_2.36%_5.64%] overflow-hidden rounded-[28px]">
        <img
          alt={screenAlt}
          src={screen}
          width={screenWidth}
          height={screenHeight}
          className="size-full object-cover object-top"/>
      </div>

      {/* Side buttons — insets relative to phone */}
      <div
        className="absolute inset-[25.55%_0_62.4%_99.14%]"
        aria-hidden="true"
      >
        <img
          alt=""
          src={`${A}/phone-btn-r.svg`}
          width={3}
          height={64}
          className="size-full"
        />
      </div>
      <div
        className="absolute inset-[23.01%_99.16%_69.35%_0]"
        aria-hidden="true"
      >
        <img
          alt=""
          src={`${A}/phone-btn-l1.svg`}
          width={3}
          height={40}
          className="size-full"
        />
      </div>
      <div
        className="absolute inset-[32.62%_99.16%_59.75%_0]"
        aria-hidden="true"
      >
        <img
          alt=""
          src={`${A}/phone-btn-l2.svg`}
          width={3}
          height={40}
          className="size-full"
        />
      </div>
      <div
        className="absolute inset-[15.8%_99.16%_80.28%_0]"
        aria-hidden="true"
      >
        <img
          alt=""
          src={`${A}/phone-btn-l3.svg`}
          width={3}
          height={21}
          className="size-full"
        />
      </div>

      {/* Dynamic Island — all insets relative to phone */}
      <div
        className="absolute inset-[3.82%_39.39%_93.01%_38.52%]"
        aria-hidden="true"
      >
        <img
          alt=""
          src={`${A}/phone-island.svg`}
          width={58}
          height={17}
          className="size-full"
        />
      </div>
      <div
        className="absolute inset-[4.72%_42.07%_93.9%_55.13%]"
        aria-hidden="true"
      >
        <img
          alt=""
          src={`${A}/phone-cam-1.svg`}
          width={7}
          height={7}
          className="size-full"
        />
      </div>
      <div
        className="absolute inset-[5.01%_42.67%_94.2%_55.73%]"
        aria-hidden="true"
      >
        <img
          alt=""
          src={`${A}/phone-cam-2.svg`}
          width={5}
          height={5}
          className="size-full"
        />
      </div>
      <div
        className="absolute inset-[5.06%_42.77%_94.24%_55.83%]"
        aria-hidden="true"
      >
        <img
          alt=""
          src={`${A}/phone-cam-3.svg`}
          width={5}
          height={5}
          className="size-full"
        />
      </div>
      <div
        className="absolute inset-[5.06%_42.77%_94.24%_55.83%] mix-blend-multiply"
        aria-hidden="true"
      >
        <img
          alt=""
          src={`${A}/phone-cam-4.svg`}
          width={5}
          height={5}
          className="size-full"
        />
      </div>
      <div
        className="absolute inset-[5.47%_42.84%_94.29%_56.66%] mix-blend-screen"
        aria-hidden="true"
      >
        <img
          alt=""
          src={`${A}/phone-cam-5.svg`}
          width={2}
          height={2}
          className="size-full"
        />
      </div>
    </div>
  );
};

const CardVisual = ({
  screen,
  screenAlt,
  screenWidth,
  screenHeight,
}: {
  screen: string;
  screenAlt: string;
  screenWidth: number;
  screenHeight: number;
}) => {
  return (
    <div className="relative h-[clamp(74rem,58vw,20.0625rem)] w-full shrink-0 overflow-clip rounded-t-3xl border-2 border-solid border-white android-sm:h-[clamp(15rem,60vw,20.0625rem)] iphone:h-[clamp(16rem,62vw,20.0625rem)] ipad:h-[20.0625rem]">
      {/* Soft blue light glow — Figma: top -236.59, left -54.77, 373.54×343.5 */}
      <div
        aria-hidden="true"
        className="absolute top-[-74%] left-[-17%] h-[107%] w-[116%] opacity-60 mix-blend-hard-light blur-[10px]"
      >
        <div className="absolute inset-0 overflow-hidden">
          <img
            alt=""
            src={`${A}/lights.png`}
            width={1200}
            height={1097}
            className="absolute top-[-40.28%] left-[-34.47%] h-[167.81%] w-[168.94%] max-w-none"
          />
        </div>
      </div>

      {/* Dot / concentric pattern — Figma: 431.76×422.9, bottom -182.45 */}
      <div
        aria-hidden="true"
        className="absolute bottom-[-57%] left-1/2 aspect-[431.76/422.9] w-[134%] max-w-none -translate-x-1/2"
      >
        <img
          alt=""
          src={`${A}/pattern.svg`}
          width={432}
          height={423}
          className="size-full"
        />
      </div>

      <PhoneMockup
        screen={screen}
        screenAlt={screenAlt}
        screenWidth={screenWidth}
        screenHeight={screenHeight}
      />
    </div>
  );
};

const CornerShapes = () => {
  return (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[-65.54px] left-0 flex h-[65.54px] w-[34.04px] items-center justify-center"
      >
        <div className="size-full -scale-y-100 rotate-180">
          <img
            alt=""
            src={`${A}/shape-left.svg`}
            width={34}
            height={66}
            className="size-full"
          />
        </div>
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[-65.54px] right-0 h-[65.54px] w-[34.04px]"
      >
        <img
          alt=""
          src={`${A}/shape-right.svg`}
          width={34}
          height={66}
          className="size-full"
        />
      </div>
    </>
  );
};

const StepCard = ({
  step,
  title,
  description,
  screen,
  screenAlt,
  screenWidth,
  screenHeight,
  className = "",
}: Step & { className?: string }) => {
  return (
    <article
      className={`relative flex h-full w-full max-w-[386px] min-w-0 flex-1 flex-col overflow-clip rounded-3xl border border-solid border-[#e1e4eb] p-1.5 shadow-[0_0_0_5px_white] ${className}`}
    >
      {/* Card background: gradient + texture + fade */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-3xl"
      >
        <div className="absolute inset-0 rounded-3xl bg-linear-to-b from-[#eaf3fb] to-white" />
        <div
          className="absolute inset-0 rounded-3xl bg-size-[140px_140px] bg-top-left opacity-80 mix-blend-luminosity"
          style={{ backgroundImage: `url(${A}/card-texture.png)` }}
        />
        <div className="absolute inset-0 rounded-3xl bg-linear-to-b from-[rgba(234,243,251,0)] to-white" />
      </div>

      <CardVisual
        screen={screen}
        screenAlt={screenAlt}
        screenWidth={screenWidth}
        screenHeight={screenHeight}
      />

      <div className="relative z-10 flex w-full flex-1 flex-col items-center justify-center gap-3 rounded-b-[20px] bg-white px-[clamp(1rem,3.5vw,1.5rem)] py-[clamp(1.25rem,4vw,1.5rem)] shadow-[0_-2px_6px_rgba(183,183,183,0.1),0_2px_4px_rgba(178,181,188,0.2)]">
        <CornerShapes />

        <div className="flex items-center justify-center rounded-full border border-solid border-[#e7e9ef] px-2.5 py-1.25">
          <span className="font-instrument-tight text-[clamp(0.8125rem,2.5vw,0.9375rem)] leading-normal font-medium whitespace-nowrap text-[#3d3d3d]">
            {step}
          </span>
        </div>

        <div className="flex w-full flex-col items-center gap-1 text-center leading-normal">
          <h3 className="font-clash text-[18px] lg:text-[20px] xl:text-[22px] font-medium text-[#1a1a1a]">
            {title}
          </h3>
          <p className="w-full text-pretty font-instrument text-[16px] leading-normal font-medium text-[#616161]">
            {description}
          </p>
        </div>
      </div>
    </article>
  );
};

const Process01 = () => {
  return (
    <main className="min-h-screen overflow-x-clip bg-[#f6f7f9] text-[#0d0d0d]">
      <section
        aria-labelledby="steps-heading"
        className="mx-auto flex w-full max-w-300 flex-col items-center gap-[clamp(2rem,5vw,2.5rem)] px-4 py-[clamp(3rem,8vw,4rem)] pb-[max(3rem,env(safe-area-inset-bottom))] sm:px-6 ipad:gap-15 ipad:px-8 ipad:py-[95px] laptop:px-10"
      >
        <header className="flex w-full max-w-3xl flex-col items-center gap-4">
          <div className="flex items-center gap-1 overflow-clip rounded-full border border-[#d4e7f6] bg-[#f2f7fd] px-2.5 py-1.5 shadow-[0_0_0_3px_white,0_2px_3px_rgba(183,183,183,0.1)]">
            <img
              alt=""
              aria-hidden="true"
              src={`${A}/process-icon.svg`}
              width={24}
              height={24}
              className="size-6 shrink-0"
            />
            <span className="font-instrument text-[clamp(0.9375rem,2.5vw,1.0625rem)] leading-normal font-medium text-[#3d3d3d]">
              Process
            </span>
          </div>

          <h1
            id="steps-heading"
            className="text-center text-[28px] lg:text-[42px] xl:text-[56px] leading-[1.2] font-medium tracking-[-0.02em] text-balance text-[#0d0d0d] font-clash"
          >
            Steps to Start
          </h1>
        </header>

        <div className="flex w-full flex-col items-center gap-[clamp(2rem,5vw,3.125rem)]">
          <div className="grid w-full max-w-[720px] xl:max-w-none grid-cols-1 items-stretch justify-items-center gap-5 iphone-max:gap-6 ipad:grid-cols-2 ipad:gap-6 laptop:grid-cols-3 laptop:gap-6">
            {STEPS.map((step, index) => (
              <StepCard
                key={step.step}
                {...step}
                className={
                  index === 2 ? "ipad:col-span-2 laptop:col-span-1" : undefined
                }
              />
            ))}
          </div>

          <a
            href="#get-started"
            className="inline-flex min-h-11 w-auto touch-manipulation items-center justify-center rounded-full bg-[#3385ff] px-6 py-4 font-instrument text-[17px]leading-normal font-semibold text-white transition-colors duration-200 ease [-webkit-tap-highlight-color:transparent] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3385ff] active:bg-[#2468d4] [@media(hover:hover)_and_(pointer:fine)]:hover:bg-[#2a75e6]"
          >
            Get Started Now
          </a>
        </div>
      </section>
    </main>
  );
};

export default Process01;
