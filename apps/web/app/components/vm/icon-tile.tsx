import { Icon, type IconName } from "./icons";

const ICON_SIZES = { sm: 20, md: 22, lg: 24 } as const;

/**
 * Rounded-square accent tile holding one inline-SVG glyph — feature trios,
 * KPI cards, panel headers. Resting state is a 10-15% accent tint; inside a
 * `.vm-hover-group` ancestor it fills solid on group hover (_vm-kit.scss).
 * Decorative: the accompanying text labels the concept, so it is aria-hidden.
 */
export function IconTile({
  icon,
  accent = "primary",
  size = "md",
  className
}: {
  icon: IconName;
  accent?: "primary" | "secondary" | "tertiary";
  /** sm=40px, md=48px, lg=56px square. */
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const classes = ["vm-icon-tile", `vm-icon-tile--${accent}`, `vm-icon-tile--${size}`, className]
    .filter(Boolean)
    .join(" ");

  return (
    <span aria-hidden="true" className={classes}>
      <Icon name={icon} size={ICON_SIZES[size]} />
    </span>
  );
}
