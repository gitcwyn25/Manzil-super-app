import type { ReactNode } from "react";

/**
 * 50/50 auth/registration layout: a sticky full-viewport brand panel on the
 * left (hidden below md) and a centered content column on the right.
 * Consumers: /business/register, /sign-in, /sign-up.
 */
export function SplitAuthShell({
  panel,
  children,
  className
}: {
  /** The photo/brand side — normally a BrandPanel. */
  panel: ReactNode;
  /** The form side. */
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className ? `vm-auth-shell ${className}` : "vm-auth-shell"}>
      <div className="vm-auth-shell__panel">{panel}</div>
      <div className="vm-auth-shell__content">{children}</div>
    </div>
  );
}

/**
 * The photo half of SplitAuthShell: wordmark pinned top-left, headline +
 * tagline bottom-left, an inverse-surface gradient scrim for text contrast.
 * `imageSrc` must be a self-hosted /public asset or a coverPhotoUrl-pipeline
 * URL (CSP blocks external images); without one, the panel falls back to a
 * primary-blue gradient.
 */
export function BrandPanel({
  wordmark,
  title,
  tagline,
  imageSrc,
  className
}: {
  wordmark: ReactNode;
  title?: ReactNode;
  tagline?: ReactNode;
  imageSrc?: string;
  className?: string;
}) {
  return (
    <div className={className ? `vm-brand-panel ${className}` : "vm-brand-panel"}>
      {imageSrc ? (
        // eslint-disable-next-line @next/next/no-img-element -- decorative panel photo; plain img keeps the component server-safe
        <img alt="" className="vm-brand-panel__photo" src={imageSrc} />
      ) : null}
      <div aria-hidden="true" className="vm-brand-panel__scrim" />
      <div className="vm-brand-panel__chrome">
        <p className="vm-brand-panel__wordmark">{wordmark}</p>
        {title || tagline ? (
          <div className="vm-brand-panel__copy">
            {title ? <h2 className="vm-brand-panel__title">{title}</h2> : null}
            {tagline ? <p className="vm-brand-panel__tagline">{tagline}</p> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
