"use client";

import { useEffect, useState } from "react";

/**
 * The aperture — Manzil's signature element.
 *
 * A metro-medallion portal that content arrives through, once, on load. Its ring
 * is not decoration: it carries --signal only when `live` is true (businesses
 * open right now), so the brightest thing on the page is always a true statement
 * about the data. If nothing is live, the ring stays brass and still.
 *
 * Runs once per mount. Reduced motion gets the final state immediately.
 */
export function Aperture({
  live = false,
  label
}: {
  live?: boolean;
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      setOpen(true);
      return;
    }

    const id = window.requestAnimationFrame(() => setOpen(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  return (
    <div
      className={`aperture${open ? " is-open" : ""}${live ? " is-live" : ""}`}
      data-label={label}
    >
      <svg aria-hidden="true" viewBox="0 0 240 240" className="aperture__svg">
        <circle className="aperture__ring" cx="120" cy="120" r="112" />
        <circle className="aperture__ring aperture__ring--inner" cx="120" cy="120" r="88" />
      </svg>
      {label ? <span className="aperture__label">{label}</span> : null}
    </div>
  );
}
