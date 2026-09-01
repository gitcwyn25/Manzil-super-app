/**
 * Bare layout — no site chrome (no header, nav, or footer).
 * Used for full-bleed immersive pages like the Gurman AI concierge hero.
 */
export default function BareLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
