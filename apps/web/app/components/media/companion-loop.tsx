type CompanionLoopProps = {
  src: string;
  alt?: string;
  className?: string;
  decorative?: boolean;
};

export function CompanionLoop({
  src,
  alt = "",
  className,
  decorative = true
}: CompanionLoopProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={decorative ? "" : alt}
      aria-hidden={decorative ? true : undefined}
      className={className}
      decoding="async"
      draggable={false}
      src={src}
    />
  );
}
