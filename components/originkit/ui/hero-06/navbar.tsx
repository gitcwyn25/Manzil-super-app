// Delivered by Originkit · stack: nextjs · styling: tailwind
"use client";

import { useState, type KeyboardEvent } from "react";
import { Button } from "@/components/originkit/ui/hero-06/button";

const NAV_LINKS = [
  { label: "Katalog", href: "/uz/discover" },
  { label: "Gurman AI", href: "/uz/concierge" },
  { label: "Biznes uchun", href: "/uz/business" },
] as const;

type NavbarProps = {
  onViewStories: () => void;
};

export const Navbar = ({ onViewStories }: NavbarProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleToggleMenu = () => {
    setIsMenuOpen((open) => !open);
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLAnchorElement>,
    href: string,
  ) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    window.location.href = href;
    setIsMenuOpen(false);
  };

  return (
    <nav aria-label="Primary" className="absolute inset-x-0 top-0 z-40 w-full">
      <div className="mx-auto flex w-full max-w-[1512px] items-center justify-between px-4 py-6 android-sm:px-8 ipad:px-12 ipad:py-8 desktop-sm:px-[130px] desktop-sm:py-9">
        <a
          href="/uz"
          aria-label="Manzil home"
          className="inline-flex min-h-11 cursor-pointer items-center touch-manipulation focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black [-webkit-tap-highlight-color:transparent]"
        >
          <span className="font-redhat text-[21px] font-bold leading-4 text-black ipad:text-[28px] ipad:leading-6 desktop-sm:text-[clamp(24px,2.1vw,30px)]">
            Manzil <span className="text-[#00ffcb] bg-black px-2 py-0.5 rounded-md text-[14px]">Gurman AI</span>
          </span>
        </a>

        <div className="flex items-center gap-3 desktop-sm:gap-[34px]">
          <ul className="hidden items-center gap-[34px] desktop-sm:flex">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  tabIndex={0}
                  aria-label={link.label}
                  onKeyDown={(event) => handleKeyDown(event, link.href)}
                  className="inline-flex min-h-11 cursor-pointer items-center font-redhat text-[16px] font-semibold leading-6 text-black touch-manipulation whitespace-nowrap transition-opacity duration-200 ease focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black [-webkit-tap-highlight-color:transparent] [@media(hover:hover)_and_(pointer:fine)]:hover:opacity-70"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          <Button
            variant="nav"
            aria-label="Tavsiya olish"
            onClick={() => {
              window.location.href = "/uz/concierge";
            }}
            className="!hidden min-w-[44px] desktop-sm:!inline-flex"
          >
            Tavsiya olish →
          </Button>

          <button
            type="button"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={isMenuOpen}
            onClick={handleToggleMenu}
            className="inline-flex size-11 cursor-pointer items-center justify-center touch-manipulation transition-opacity duration-200 ease focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black desktop-sm:hidden [-webkit-tap-highlight-color:transparent] [@media(hover:hover)_and_(pointer:fine)]:hover:opacity-80"
          >
            <span className="sr-only">{isMenuOpen ? "Close" : "Menu"}</span>
            <span
              aria-hidden="true"
              className="flex size-6 flex-col items-center justify-center gap-[5px] ipad:size-8 ipad:gap-1.5"
            >
              <span className="block h-0.5 w-full rounded-full bg-black" />
              <span className="block h-0.5 w-full rounded-full bg-black" />
              <span className="block h-0.5 w-full rounded-full bg-black" />
            </span>
          </button>
        </div>
      </div>

      {isMenuOpen ? (
        <div className="absolute inset-x-0 top-full z-50 border-t border-black/10 bg-[#f8f5ee]/95 px-5 py-4 backdrop-blur-sm desktop-sm:hidden">
          <ul className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  tabIndex={0}
                  aria-label={link.label}
                  onKeyDown={(event) => handleKeyDown(event, link.href)}
                  onClick={() => setIsMenuOpen(false)}
                  className="inline-flex min-h-11 w-full cursor-pointer items-center font-redhat text-[18px] font-semibold leading-6 text-black touch-manipulation focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black [-webkit-tap-highlight-color:transparent]"
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li className="pt-2">
              <Button
                variant="nav"
                aria-label="Tavsiya olish"
                onClick={() => {
                  window.location.href = "/uz/concierge";
                  setIsMenuOpen(false);
                }}
                className="w-full"
              >
                Tavsiya olish →
              </Button>
            </li>
          </ul>
        </div>
      ) : null}
    </nav>
  );
};
