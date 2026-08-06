import type { ReactNode } from "react";

/**
 * Metadata chips: label-sm, 4px radius. TagChip is the neutral variant for
 * tags/meta ("$$", district); CategoryChip is the secondary-tinted colored
 * variant for category labels, optionally a link into filtered discover.
 */
export function TagChip({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={className ? `vm-chip ${className}` : "vm-chip"}>{children}</span>;
}

export function CategoryChip({
  children,
  className,
  href
}: {
  children: ReactNode;
  className?: string;
  href?: string;
}) {
  const classes = className
    ? `vm-chip vm-chip--category ${className}`
    : "vm-chip vm-chip--category";

  if (href) {
    return (
      <a className={classes} href={href}>
        {children}
      </a>
    );
  }

  return <span className={classes}>{children}</span>;
}
