const TIERS = ["$", "$$", "$$$"] as const;

export type PriceTier = (typeof TIERS)[number];

/**
 * The only honest price signal (D7): the business's priceTier glyph. The
 * `overlay` variant is the blurred white/90 chip that sits on card images;
 * `plain` is bold primary text for card footers. Accepts the loosely-typed
 * `priceTier: string | null` that /home returns and renders nothing unless
 * the value is one of the three real tiers.
 */
export function PriceTierBadge({
  tier,
  variant = "overlay",
  className
}: {
  tier?: string | null;
  variant?: "overlay" | "plain";
  className?: string;
}) {
  if (!tier || !TIERS.includes(tier as PriceTier)) {
    return null;
  }

  const classes = ["vm-price-tier", `vm-price-tier--${variant}`, className]
    .filter(Boolean)
    .join(" ");

  return <span className={classes}>{tier}</span>;
}
