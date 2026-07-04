"use client";

import { useEffect, useMemo, useRef, useState } from "react";

function easeOutExpo(t: number) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

const formatters: Record<string, (current: number) => string> = {
  plain: (current) => `${Math.round(current)}`,
  thousands: (current) =>
    current >= 1000 ? `${(current / 1000).toFixed(1)}k` : `${Math.round(current)}`
};

/**
 * Counts from 0 to `value` with an exponential ease once scrolled into view.
 * `format` is a named formatter ("plain" | "thousands") so this component
 * stays usable from Server Components (functions can't cross the boundary).
 */
export function AnimatedCounter({
  value,
  format = "plain",
  duration = 1600,
  suffix = ""
}: {
  value: number;
  format?: "plain" | "thousands";
  duration?: number;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const frame = useRef<number>(0);
  const fmt = useMemo(() => formatters[format] ?? formatters.plain, [format]);
  const [display, setDisplay] = useState(() => fmt(0));
  const [done, setDone] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduced =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const finish = () => {
      setDisplay(fmt(value));
      setDone(true);
    };

    if (reduced || typeof IntersectionObserver === "undefined") {
      finish();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        const startedAt = performance.now();

        const tick = (now: number) => {
          const progress = Math.min(1, (now - startedAt) / duration);
          const eased = easeOutExpo(progress);
          const current = value * eased;
          setDisplay(fmt(current));
          if (progress < 1) {
            frame.current = requestAnimationFrame(tick);
          } else {
            finish();
          }
        };

        frame.current = requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame.current);
    };
  }, [value, duration, fmt]);

  return (
    <span className={`animated-counter${done ? " is-done" : ""}`} ref={ref}>
      {display}
      {suffix}
    </span>
  );
}
