/**
 * Decorative motion-graphics layer for the home hero.
 * Pure CSS animations (see globals.css): drifting aurora blobs in brand
 * colors, a slow-rotating girih-inspired ornament, and floating map pins.
 * Server-renderable — no client JS.
 */
export function HeroBackdrop() {
  return (
    <div aria-hidden="true" className="hero-backdrop">
      <div className="aurora aurora-teal" />
      <div className="aurora aurora-gold" />
      <div className="aurora aurora-terracotta" />
      <svg className="girih-ornament" viewBox="0 0 200 200" fill="none">
        <g stroke="currentColor" strokeWidth="1">
          <polygon points="100,10 178,55 178,145 100,190 22,145 22,55" />
          <polygon points="100,30 161,65 161,135 100,170 39,135 39,65" />
          <path d="M100 10 L100 190 M22 55 L178 145 M178 55 L22 145" />
          <circle cx="100" cy="100" r="34" />
          <circle cx="100" cy="100" r="62" />
        </g>
      </svg>
      <span className="hero-pin hero-pin-a">
        <span className="hero-pin-dot" />
      </span>
      <span className="hero-pin hero-pin-b">
        <span className="hero-pin-dot" />
      </span>
      <span className="hero-pin hero-pin-c">
        <span className="hero-pin-dot" />
      </span>
      <div className="hero-grid-lines" />
    </div>
  );
}
