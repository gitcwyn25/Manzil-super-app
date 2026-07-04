"use client";

import type { Locale } from "@manzil/shared";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const LOCALES: Array<{ code: Locale; label: string }> = [
  { code: "uz", label: "O'zbekcha" },
  { code: "ru", label: "Русский" },
  { code: "en", label: "English" }
];

/**
 * Single, unobtrusive language button: a globe icon that opens a small
 * dropdown. Switching swaps the locale segment of the current path.
 */
export function LocaleSwitcher({ locale }: { locale: Locale }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function switchTo(next: Locale) {
    setOpen(false);
    if (next === locale) return;
    const segments = pathname.split("/");
    segments[1] = next;
    router.push(segments.join("/") || `/${next}`);
  }

  return (
    <div className="lang-menu" ref={rootRef}>
      <button
        aria-expanded={open ? "true" : "false"}
        aria-haspopup="menu"
        aria-label="Language"
        className="lang-button"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24" width="19" height="19">
          <circle cx="12" cy="12" r="9" />
          <path d="M3.5 12h17M12 3a14.5 14.5 0 0 1 0 18M12 3a14.5 14.5 0 0 0 0 18" />
        </svg>
        <span className="lang-code">{locale.toUpperCase()}</span>
      </button>
      {open ? (
        <div className="lang-dropdown" role="menu">
          {LOCALES.map((item) => (
            <button
              className={item.code === locale ? "active" : undefined}
              key={item.code}
              onClick={() => switchTo(item.code)}
              role="menuitem"
              type="button"
            >
              {item.label}
              {item.code === locale ? (
                <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.4" viewBox="0 0 24 24" width="14" height="14"><path d="m5 12 5 5 9-10" /></svg>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
