import type { ReactNode } from "react";

export type StatusPillVariant = "success" | "pending" | "danger" | "neutral";

/**
 * One variant-mapped status pill for the whole app: success/confirmed =
 * secondary-green tint with a dot, pending/draft = surface-variant,
 * canceled/error = danger tint, neutral = quiet meta. `kind` is the
 * uppercase kind-chip treatment (announcement types). Labels always come
 * from the owning screen's trilingual copy record — this component never
 * hardcodes copy.
 */
export function StatusPill({
  variant,
  children,
  kind = false,
  className
}: {
  variant: StatusPillVariant;
  children: ReactNode;
  kind?: boolean;
  className?: string;
}) {
  const classes = [
    "vm-status-pill",
    `vm-status-pill--${variant}`,
    kind ? "vm-status-pill--kind" : null,
    className
  ]
    .filter(Boolean)
    .join(" ");

  return <span className={classes}>{children}</span>;
}
