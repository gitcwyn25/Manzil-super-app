import type { ReactNode } from "react";
import { Icon } from "./icons";

/**
 * Section heading row: title + muted subtitle on the left, optional
 * "View All →" primary link end-aligned on the right. On mobile the link
 * drops below the text as a full-width ghost button (see _vm-kit.scss).
 */
export function SectionHeader({
  title,
  subtitle,
  viewAllHref,
  viewAllLabel,
  level = 2,
  className,
  id
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  viewAllHref?: string;
  viewAllLabel?: string;
  /** Heading element level; sections default to h2. */
  level?: 2 | 3;
  className?: string;
  id?: string;
}) {
  const Heading = level === 3 ? "h3" : "h2";

  return (
    <header className={className ? `vm-section-header ${className}` : "vm-section-header"}>
      <div className="vm-section-header__text">
        <Heading className="vm-section-header__title" id={id}>
          {title}
        </Heading>
        {subtitle ? <p className="vm-section-header__subtitle">{subtitle}</p> : null}
      </div>
      {viewAllHref && viewAllLabel ? (
        <a className="vm-section-header__link" href={viewAllHref}>
          {viewAllLabel}
          <Icon name="arrow_forward" size={16} />
        </a>
      ) : null}
    </header>
  );
}
