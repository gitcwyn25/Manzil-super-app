"use client";

import type { Locale } from "@manzil/shared";
import Image from "next/image";
import Link from "next/link";
import { getBusinessCopy } from "../lib/business-copy";
import { getLandingCopy } from "../lib/landing-copy";

/** Asset root for Footer 01 */
const A = "/originkit/footer-01";

const PHONES_STAGE_W = 506.68;
const PHONES_STAGE_H = 528.892;

const stageX = (px: number) => `${(px / PHONES_STAGE_W) * 100}%`;
const stageY = (px: number) => `${(px / PHONES_STAGE_H) * 100}%`;

type PhoneMockupProps = {
  screen: string;
  screenWidth: number;
  screenHeight: number;
  className?: string;
};

const PhoneMockup = ({
  screen,
  screenWidth,
  screenHeight,
  className = "",
}: PhoneMockupProps) => (
  <div className={`relative overflow-clip ${className}`}>
    {/* Device chrome */}
    <Image
      src={`${A}/Mobile.svg`}
      alt=""
      aria-hidden="true"
      width={235}
      height={476}
      className="pointer-events-none absolute inset-0 size-full object-fill"
    />

    {/* Screen content */}
    <div
      aria-hidden="true"
      className="absolute inset-[2.1%_4.9%_2.1%_4.9%] z-[1] rounded-[6%] overflow-clip bg-[#1d1d1b]"
    >
      <Image
        src={screen}
        alt=""
        width={screenWidth}
        height={screenHeight}
        className="size-full object-cover object-top"
      />
    </div>

    {/* Dynamic Island */}
    <Image
      src={`${A}/dynamic-island.svg`}
      alt=""
      aria-hidden="true"
      width={52}
      height={16}
      className="pointer-events-none absolute top-[3%] left-1/2 z-[2] w-[22.1%] -translate-x-1/2"
    />
  </div>
);

const PhonesHero = () => (
  <div className="pointer-events-none relative z-10 mx-auto w-full max-w-[506.68px]">
    <div
      className="relative w-full"
      style={{ aspectRatio: `${PHONES_STAGE_W} / ${PHONES_STAGE_H}` }}
    >
      {/* Dot grid behind phones */}
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
        }}
      />

      {/* Left phone */}
      <div
        className="absolute bottom-0 z-[1] flex -translate-x-1/2 items-center justify-center"
        style={{
          left: `calc(50% - ${stageX(102.85)})`,
          width: stageX(300.972),
          height: stageY(451.104),
        }}
      >
        <div className="flex size-full origin-bottom items-center justify-center">
          <div
            className="relative rotate-[-14.52deg]"
            style={{
              width: `${(203.908 / 300.972) * 100}%`,
              aspectRatio: "203.908 / 413.181",
            }}
          >
            <PhoneMockup
              screen={`${A}/Vector2.png`}
              screenWidth={362}
              screenHeight={788}
              className="size-full"
            />
          </div>
        </div>
      </div>

      {/* Right phone */}
      <div
        className="absolute bottom-0 z-[1] flex -translate-x-1/2 items-center justify-center"
        style={{
          left: `calc(50% + ${stageX(102.84)})`,
          width: stageX(300.987),
          height: stageY(451.108),
        }}
      >
        <div className="flex size-full origin-bottom items-center justify-center">
          <div
            className="relative rotate-[14.52deg]"
            style={{
              width: `${(203.908 / 300.987) * 100}%`,
              aspectRatio: "203.908 / 413.181",
            }}
          >
            <PhoneMockup
              screen={`${A}/Vector3.png`}
              screenWidth={362}
              screenHeight={788}
              className="size-full"
            />
          </div>
        </div>
      </div>

      {/* Center phone */}
      <div
        className="absolute left-1/2 z-10 -translate-x-1/2"
        style={{
          bottom: stageY(21.82),
          width: stageX(234.606),
          aspectRatio: "234.606 / 475.386",
        }}
      >
        <PhoneMockup
          screen={`${A}/Vector.png`}
          screenWidth={417}
          screenHeight={906}
          className="size-full"
        />
      </div>
    </div>
  </div>
);

const FOOTER_DOWNLOAD_TEXT: Record<Locale, { title: string; desc: string }> = {
  uz: {
    title: "Manzil ilovasini yuklab oling",
    desc: "Shahringizning eng sara joylari va Gurman AI shaxsiy maslahatchisi cho'ntagingizda."
  },
  ru: {
    title: "Скачайте приложение Manzil",
    desc: "Лучшие заведения города и персональный AI-консьерж Gurman всегда под рукой."
  },
  en: {
    title: "Download Manzil App Today",
    desc: "Discover the best local spots and get instant recommendations with Gurman AI."
  }
};

/**
 * Originkit "Footer 01" section adapted for Manzil.
 */
export function Footer({ locale }: { locale: Locale }) {
  const businessCopy = getBusinessCopy(locale);
  const landing = getLandingCopy(locale);
  const year = new Date().getFullYear();
  const t = FOOTER_DOWNLOAD_TEXT[locale] ?? FOOTER_DOWNLOAD_TEXT.uz;

  const navLinks = [
    { label: businessCopy.nav.discover, href: `/${locale}/discover` },
    { label: businessCopy.nav.concierge, href: `/${locale}/concierge` },
    { label: businessCopy.nav.events, href: `/${locale}/occasions` },
    { label: businessCopy.nav.forBusiness, href: `/${locale}/business` },
    { label: businessCopy.footer.pricing, href: `/${locale}/business/pricing` },
    { label: businessCopy.footer.dashboard, href: `/${locale}/dashboard` },
    { label: businessCopy.footer.otherCities, href: `/${locale}/waitlist/city` },
  ];

  const socialLinks = [
    {
      label: "Telegram",
      href: "https://t.me/manzilbiz_bot",
      icon: `${A}/email.svg`,
    },
    {
      label: "Instagram",
      href: "https://instagram.com",
      icon: `${A}/instagram.svg`,
    },
    {
      label: "LinkedIn",
      href: "https://linkedin.com",
      icon: `${A}/linkedin.svg`,
    },
    {
      label: "X",
      href: "https://x.com",
      icon: `${A}/twitter.svg`,
    },
  ];

  return (
    <footer className="footer-01-wrapper bg-white text-[#0d0d0d] border-t border-solid border-[#dee5ed]">
      <div className="mx-auto flex w-full max-w-[1240px] flex-col items-center px-4 pt-12 pb-10 sm:px-6 lg:px-8">
        
        {/* Phones Hero & App Download */}
        <div id="download" className="flex w-full flex-col items-center gap-6 pt-4 pb-12">
          <PhonesHero />

          <div className="relative z-20 -mt-10 flex w-full flex-col items-center gap-4 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-[#0d0d0d] sm:text-4xl lg:text-5xl">
              {t.title}
            </h2>
            <p className="mx-auto max-w-xl text-base text-[#666] lg:text-lg">
              {t.desc}
            </p>
          </div>

          <div className="relative z-20 flex flex-wrap items-center justify-center gap-4 pt-4">
            {/* Google Play */}
            <a
              aria-label="Google Play"
              className="inline-flex h-[62px] min-w-[190px] items-center justify-center gap-3 rounded-full border border-solid border-[#dee5ed] bg-[#f5f7fa] px-6 py-3 transition-all duration-200 hover:border-[#c9d3e0] hover:bg-[#eef2f7] hover:-translate-y-0.5"
              href={`/${locale}#download`}
            >
              <Image
                src={`${A}/google-play.svg`}
                alt=""
                width={28}
                height={28}
                aria-hidden="true"
              />
              <span className="flex flex-col items-start leading-tight">
                <span className="text-[12px] text-[#666]">GET IT ON</span>
                <span className="text-[16px] font-bold text-[#222]">Google Play</span>
              </span>
            </a>

            {/* App Store */}
            <a
              aria-label="App Store"
              className="inline-flex h-[62px] min-w-[190px] items-center justify-center gap-3 rounded-full border border-solid border-[#dee5ed] bg-[#f5f7fa] px-6 py-3 transition-all duration-200 hover:border-[#c9d3e0] hover:bg-[#eef2f7] hover:-translate-y-0.5"
              href={`/${locale}#download`}
            >
              <Image
                src={`${A}/app-store.svg`}
                alt=""
                width={28}
                height={28}
                aria-hidden="true"
              />
              <span className="flex flex-col items-start leading-tight">
                <span className="text-[12px] text-[#666]">Download on the</span>
                <span className="text-[16px] font-bold text-[#222]">App Store</span>
              </span>
            </a>
          </div>
        </div>

        {/* Contact Banner */}
        <div className="flex w-full items-center gap-4 my-8">
          <div aria-hidden="true" className="h-px min-w-0 flex-1 bg-[#dee5ed]" />
          <a
            className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-solid border-[#dee5ed] bg-[#f5f7fa] px-5 py-2.5 text-sm font-semibold text-[#262626] transition-all duration-200 hover:border-[#c9d3e0] hover:bg-[#eef2f7]"
            href="mailto:tursunovsunnatilla223@gmail.com"
          >
            <Image
              src={`${A}/email.svg`}
              alt=""
              width={20}
              height={20}
              aria-hidden="true"
            />
            <span>tursunovsunnatilla223@gmail.com</span>
          </a>
          <a
            className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-solid border-[#dee5ed] bg-[#f5f7fa] px-5 py-2.5 text-sm font-semibold text-[#262626] transition-all duration-200 hover:border-[#c9d3e0] hover:bg-[#eef2f7]"
            href="https://t.me/manzilbiz_bot"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>@manzilbiz_bot</span>
          </a>
          <div aria-hidden="true" className="h-px min-w-0 flex-1 bg-[#dee5ed]" />
        </div>

        {/* Capsule Navigation Links */}
        <nav aria-label="Footer Navigation" className="flex flex-wrap items-center justify-center gap-2.5 mb-10">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              className="inline-flex min-h-[46px] items-center justify-center rounded-full border border-solid border-[#dee5ed] bg-[#f5f7fa] px-4 py-2 text-sm font-medium text-[#333] transition-all duration-200 hover:border-[#c9d3e0] hover:bg-[#eef2f7] hover:text-[#0058bc]"
              href={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Bottom Legal Row */}
        <div className="flex w-full flex-col items-center justify-between gap-4 border-t border-solid border-[#dee5ed] pt-6 sm:flex-row">
          <p className="text-sm font-medium text-[#666]">
            &copy; {year} Manzil. {businessCopy.footer.rights}
          </p>

          {/* Social Icons */}
          <div className="flex items-center gap-3">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                aria-label={social.label}
                className="inline-flex size-10 items-center justify-center rounded-full bg-[#262626] p-2 text-white transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[#0058bc]"
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  src={social.icon}
                  alt=""
                  width={20}
                  height={20}
                  className="size-5"
                  aria-hidden="true"
                />
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4 text-sm font-medium text-[#666]">
            <Link className="hover:text-[#0058bc]" href={`/${locale}/business/plans`}>
              {businessCopy.nav.forBusiness}
            </Link>
            <span>&bull;</span>
            <Link className="hover:text-[#0058bc]" href={`/${locale}/admin`}>
              {businessCopy.nav.admin}
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
