import type { ComponentPropsWithoutRef } from "react";

type AnchorCta = { href: string } & ComponentPropsWithoutRef<"a">;
type ButtonCta = { href?: undefined } & ComponentPropsWithoutRef<"button">;

export type PrimaryCtaProps = (AnchorCta | ButtonCta) & {
  /** rounded = 8px corners; pill = fully rounded (hero/nav CTAs). */
  shape?: "rounded" | "pill";
  size?: "md" | "lg";
};

/**
 * The primary call-to-action: Bootstrap's .btn-primary (which vibrant.scss
 * already paints with the primary-container→primary gradient) plus the VM
 * tactility layer — soft shadow, hover lift, active press-down scale, all
 * short-circuited under prefers-reduced-motion (_vm-kit.scss). Renders an
 * anchor when `href` is present, a button otherwise.
 */
export function PrimaryCta(props: PrimaryCtaProps) {
  const { shape = "rounded", size = "md", className, ...rest } = props;

  const classes = [
    "btn",
    "btn-primary",
    "vm-cta",
    shape === "pill" ? "rounded-pill" : null,
    size === "lg" ? "btn-lg" : null,
    className
  ]
    .filter(Boolean)
    .join(" ");

  if (typeof rest.href === "string") {
    return <a className={classes} {...(rest as ComponentPropsWithoutRef<"a">)} />;
  }

  return <button className={classes} type="button" {...(rest as ComponentPropsWithoutRef<"button">)} />;
}
