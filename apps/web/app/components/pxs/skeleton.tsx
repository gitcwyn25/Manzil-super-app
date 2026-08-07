import type { CSSProperties } from "react";

/**
 * Loading & skeleton library.
 *
 * Server-safe by design — no "use client", no hooks, no browser API — so a
 * React Server Component can use these directly as a `<Suspense>` fallback
 * without opening a client boundary just to draw a grey box.
 *
 * The shimmer is CSS-only and is switched off by a real
 * `@media (prefers-reduced-motion: reduce)` rule in globals.css, which also
 * means it is correct during SSR and before hydration. A JS-gated animation
 * would flash for one frame on every reduced-motion user.
 *
 * Skeletons must mirror the shape of the content that replaces them. A
 * skeleton whose proportions do not match causes a visible reflow at the exact
 * moment the user starts reading — which is worse than a plain spinner,
 * because it moves the words they were about to read.
 */

type SkeletonProps = {
  /** CSS width. Number is treated as px. */
  width?: number | string;
  /** CSS height. Number is treated as px. */
  height?: number | string;
  /** Matches the radius of the real element: `pill` for chips, `md` for cards. */
  radius?: "sm" | "md" | "lg" | "pill" | "circle";
  className?: string;
  style?: CSSProperties;
};

function size(value: number | string | undefined): string | undefined {
  if (value == null) return undefined;
  return typeof value === "number" ? `${value}px` : value;
}

/**
 * One placeholder block.
 *
 * `aria-hidden`, always. A skeleton carries no information, and a screen
 * reader announcing a dozen empty boxes is noise. The *loading* fact is
 * announced once by whatever owns the region (`SkeletonRegion` below), not by
 * each shape.
 */
export function Skeleton({ width, height = 16, radius = "sm", className, style }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={`pxs-skeleton pxs-skeleton--${radius}${className ? ` ${className}` : ""}`}
      style={{ width: size(width), height: size(height), ...style }}
    />
  );
}

/**
 * A block of placeholder text lines.
 *
 * The last line is deliberately short — real paragraphs do not end flush, and
 * a stack of equal-length bars reads as a table rather than as prose.
 */
export function SkeletonText({
  lines = 3,
  className,
  lineHeight = 14
}: {
  lines?: number;
  className?: string;
  lineHeight?: number;
}) {
  return (
    <span aria-hidden="true" className={`pxs-skeleton-text${className ? ` ${className}` : ""}`}>
      {Array.from({ length: Math.max(1, lines) }, (_, index) => (
        <Skeleton
          height={lineHeight}
          key={index}
          width={index === lines - 1 && lines > 1 ? "62%" : "100%"}
        />
      ))}
    </span>
  );
}

/** Card-shaped placeholder: media block, title, two lines, a meta row. */
export function SkeletonCard({ className, media = true }: { className?: string; media?: boolean }) {
  return (
    <div aria-hidden="true" className={`pxs-skeleton-card${className ? ` ${className}` : ""}`}>
      {media ? <Skeleton height={160} radius="md" width="100%" /> : null}
      <Skeleton height={18} width="72%" />
      <SkeletonText lines={2} />
      <div className="pxs-skeleton-card__meta">
        <Skeleton height={22} radius="pill" width={68} />
        <Skeleton height={22} radius="pill" width={52} />
      </div>
    </div>
  );
}

/**
 * A grid of card skeletons that reuses the app's `.vm-grid` geometry, so the
 * placeholder occupies the same columns the real results will.
 */
export function SkeletonGrid({ count = 6, className }: { count?: number; className?: string }) {
  return (
    <div aria-hidden="true" className={`pxs-skeleton-grid${className ? ` ${className}` : ""}`}>
      {Array.from({ length: Math.max(1, count) }, (_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
}

/**
 * Wraps a loading area and announces the loading state **once**, in the
 * visitor's language.
 *
 * `aria-busy` on the container is the machine-readable half; `role="status"`
 * with the label is the spoken half. Pair every skeleton block with one of
 * these rather than labelling the individual shapes.
 */
export function SkeletonRegion({
  children,
  label,
  className
}: {
  children: React.ReactNode;
  /** Localized, e.g. `getPxsCopy(locale).loading.skeletonLabel`. */
  label: string;
  className?: string;
}) {
  return (
    <div
      aria-busy="true"
      aria-label={label}
      className={className}
      role="status"
    >
      {children}
    </div>
  );
}
