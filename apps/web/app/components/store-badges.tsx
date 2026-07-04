/**
 * App Store / Google Play download badges (inline SVG, self-contained).
 * Links point at the anchor until the store listings go live; the caption
 * communicates availability honestly.
 */
export function StoreBadges({
  iosLabel,
  androidLabel,
  soonLabel,
  variant = "dark"
}: {
  iosLabel: string;
  androidLabel: string;
  soonLabel?: string;
  variant?: "dark" | "light";
}) {
  return (
    <div className="store-badges-wrap">
      <div className="store-badges">
        <a aria-label={`${iosLabel} — ${soonLabel ?? ""}`} className={`store-badge store-badge-${variant}`} href="#download">
          <svg aria-hidden="true" fill="currentColor" viewBox="0 0 24 24" width="26" height="26">
            <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 4.08ZM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25Z" />
          </svg>
          <span>
            <small>Download on the</small>
            {iosLabel}
          </span>
        </a>
        <a aria-label={`${androidLabel} — ${soonLabel ?? ""}`} className={`store-badge store-badge-${variant}`} href="#download">
          <svg aria-hidden="true" viewBox="0 0 24 24" width="24" height="24">
            <path d="M3.6 1.8 13.7 12 3.6 22.2c-.36-.19-.6-.57-.6-1.05V2.85c0-.48.24-.86.6-1.05Z" fill="#00D2FF" />
            <path d="m17.4 8.3-3.7 3.7L3.6 1.8c.16-.09.35-.13.55-.11.2.02.42.1.65.23L17.4 8.3Z" fill="#00F076" />
            <path d="M17.4 15.7 4.8 22.08c-.46.26-.9.3-1.2.12L13.7 12l3.7 3.7Z" fill="#F63448" />
            <path d="M21.3 10.95c.75.42.75 1.68 0 2.1l-3.9 2.65-4-3.7 4-3.7 3.9 2.65Z" fill="#FFCB00" />
          </svg>
          <span>
            <small>Get it on</small>
            {androidLabel}
          </span>
        </a>
      </div>
      {soonLabel ? <p className="store-badges-note">{soonLabel}</p> : null}
    </div>
  );
}
