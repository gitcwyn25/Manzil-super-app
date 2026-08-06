import type { ReactNode } from "react";

/**
 * Page-topping header card: h1 + muted subtitle on the left, an optional
 * action slot on the right, all inside a white L1 card. Used by the
 * workspace routes and any site page that opens with a titled card.
 */
export function PageHeaderCard({
  title,
  subtitle,
  action,
  className
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Right-aligned slot: PrimaryCta, filter controls, etc. */
  action?: ReactNode;
  className?: string;
}) {
  return (
    <header className={className ? `card vm-page-header ${className}` : "card vm-page-header"}>
      <div className="card-body vm-page-header__body">
        <div className="vm-page-header__text">
          <h1 className="vm-page-header__title">{title}</h1>
          {subtitle ? <p className="vm-page-header__subtitle">{subtitle}</p> : null}
        </div>
        {action ? <div className="vm-page-header__action">{action}</div> : null}
      </div>
    </header>
  );
}
