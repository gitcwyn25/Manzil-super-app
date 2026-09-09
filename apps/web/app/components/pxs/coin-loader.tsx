import type { CSSProperties } from "react";

export type CoinLoaderProps = {
  /** Spoken label when no visible text already describes the pending work. */
  label: string;
  size?: number;
  className?: string;
  /** Avoids announcing the same label twice when a button renders it beside the loader. */
  decorative?: boolean;
};

/**
 * Branded indeterminate activity indicator.
 *
 * This is intentionally local CSS rather than a generated dependency: no
 * credential, network call, or third-party runtime is needed for a loading
 * state. It claims only that work is in flight; it never invents progress.
 */
export function CoinLoader({
  label,
  size = 18,
  className,
  decorative = false
}: CoinLoaderProps) {
  const style = {
    width: size,
    height: size,
    fontSize: size * 0.42
  } as CSSProperties;

  return (
    <span
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : label}
      className={"pxs-coin-loader" + (className ? " " + className : "")}
      role={decorative ? undefined : "status"}
      style={style}
    >
      <span aria-hidden="true" className="pxs-coin-loader__face">M</span>
    </span>
  );
}
