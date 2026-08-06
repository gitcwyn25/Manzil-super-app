/**
 * Deal/value badge — GATED (D7): the API has no deals/promotions entity
 * today, so this renders nothing unless a REAL datum supplies a label (e.g.
 * a future deals field, or copy derived from `HomeCard.featured === true`).
 * No screen may fabricate an offer to feed it; passing static marketing
 * strings ("20% OFF", "Hot Deal") without a backing entity is forbidden.
 */
export function DealBadge({
  label,
  variant = "solid",
  className
}: {
  /** The real, API-backed deal label. Absent/empty renders nothing. */
  label?: string | null;
  /** solid = secondary-green fill; tint = secondary-container savings chip. */
  variant?: "solid" | "tint";
  className?: string;
}) {
  if (!label) {
    return null;
  }

  const classes = ["vm-deal-badge", `vm-deal-badge--${variant}`, className]
    .filter(Boolean)
    .join(" ");

  return <span className={classes}>{label}</span>;
}
