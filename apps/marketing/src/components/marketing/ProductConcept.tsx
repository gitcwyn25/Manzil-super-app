import { cn } from "@/lib/utils";

const CONCEPTS = {
  community: {
    file: "community-ios-preview",
    width: 941,
    height: 1672,
    alt: "Illustrative Manzil mobile community feed with local conversations.",
  },
  discover: {
    file: "discover-ios-preview",
    width: 941,
    height: 1672,
    alt: "Illustrative Manzil mobile discovery view for places in Tashkent.",
  },
  connected: {
    file: "connected-context-preview",
    width: 1672,
    height: 941,
    alt: "Product concept connecting a community post, a place and shared experiences.",
  },
  desktop: {
    file: "desktop-community-dashboard-preview",
    width: 1536,
    height: 1024,
    alt: "Illustrative Manzil desktop community dashboard.",
  },
} as const;

export function ProductConcept({
  concept,
  className,
}: {
  concept: keyof typeof CONCEPTS;
  className?: string;
}) {
  const { file, width, height, alt } = CONCEPTS[concept];
  const base = `/images/v3/${file}`;

  return (
    <figure className={cn("min-w-0", className)}>
      <picture className="block overflow-hidden rounded-2xl">
        <source srcSet={`${base}.avif`} type="image/avif" />
        <source srcSet={`${base}.webp`} type="image/webp" />
        <img
          src={`${base}.webp`}
          alt={alt}
          width={width}
          height={height}
          loading="lazy"
          decoding="async"
          className="block h-auto w-full object-contain"
        />
      </picture>
      <figcaption className="mt-4 text-muted-foreground">
        <span className="eyebrow block leading-relaxed">Product concept · illustrative UI</span>
        <span className="mt-1 block text-xs leading-relaxed">
          Sample people, places and activity are illustrative.
        </span>
      </figcaption>
    </figure>
  );
}
