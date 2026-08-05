"use client";

import { useEffect, useRef, type ReactNode } from "react";

type Props = {
  id: string;
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
};

/**
 * Thin client wrapper around Bootstrap's offcanvas JS. No react-bootstrap
 * dependency — the dynamically imported chunk is bundled and served from the
 * app's own origin, satisfying the `script-src 'self'` CSP.
 *
 * The offcanvas markup (and thus `children`) is always rendered, open or not
 * — only Bootstrap's `show`/`hide` toggles its visibility. Callers that don't
 * need React-side open/close tracking (e.g. a trigger elsewhere in the DOM
 * using Bootstrap's own `data-bs-toggle="offcanvas"` data-api, which this
 * import wires up as a side effect) can pass `open={false}` and a no-op
 * `onClose` and let Bootstrap drive the panel entirely.
 *
 * Reused by later tasks for modals and accordions via the same dynamic-import
 * pattern.
 */
export function BootstrapOffcanvas({ id, title, open, onClose, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let instance: { show: () => void; hide: () => void; dispose: () => void } | null = null;
    let cancelled = false;

    void import("bootstrap/js/dist/offcanvas").then(({ default: Offcanvas }) => {
      if (cancelled || !ref.current) return;
      instance = new Offcanvas(ref.current);
      el.addEventListener("hidden.bs.offcanvas", onClose);
      if (open) instance.show();
    });

    return () => {
      cancelled = true;
      el.removeEventListener("hidden.bs.offcanvas", onClose);
      instance?.dispose();
    };
  }, [open, onClose]);

  return (
    <div ref={ref} className="offcanvas offcanvas-end" tabIndex={-1} id={id} aria-labelledby={`${id}-label`}>
      <div className="offcanvas-header">
        <h2 className="offcanvas-title h5" id={`${id}-label`}>{title}</h2>
        <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close" />
      </div>
      <div className="offcanvas-body">{children}</div>
    </div>
  );
}
