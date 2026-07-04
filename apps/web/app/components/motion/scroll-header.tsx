"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * Header chrome that reacts to scroll: compact height, stronger glass and
 * shadow once the page is scrolled. Children stay server-rendered.
 */
export function ScrollHeader({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > 12);
        ticking = false;
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`site-header glass-bar${scrolled ? " is-scrolled" : ""}`}>
      {children}
    </header>
  );
}
