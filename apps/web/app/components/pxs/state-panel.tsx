import type { ReactNode } from "react";
import type { PxsIntent } from "../../lib/pxs/types";
import { Icon, type IconName } from "../vm/icons";

/**
 * Empty / no-results / error / success panels.
 *
 * This generalises the empty states the trust audit wrote by hand across
 * Discover, Lists, Occasions and the occasion detail page (see
 * docs/evidence/TRUST-AUDIT.md §4). Those were correct — each one says what is
 * missing and offers the two things that genuinely help from there — but they
 * were four copies of the same markup, so the fifth surface would have
 * invented a fifth variant. One component, four presets.
 *
 * The rule those states encode, now enforced by the API: **`actions` is not
 * optional in practice.** A panel that states a problem and offers nothing to
 * click is a dead end, and a dead end is what the audit found and fixed. If
 * there is genuinely nothing to do, say so in `body` rather than leaving the
 * user to guess.
 *
 * Server-safe (no "use client"): every consumer so far is an RSC.
 */

export type StatePanelProps = {
  title: string;
  body?: string;
  /** Links or buttons. Put the most likely next step first. */
  actions?: ReactNode;
  icon?: IconName;
  intent?: PxsIntent | "neutral";
  /**
   * `region` (default) renders a bordered card. `inline` drops the border for
   * use inside an existing panel.
   */
  variant?: "region" | "inline";
  className?: string;
  children?: ReactNode;
};

const INTENT_ICON: Record<PxsIntent | "neutral", IconName> = {
  neutral: "search",
  info: "help_circle",
  success: "check_circle",
  warning: "alert_circle",
  danger: "alert_circle"
};

export function StatePanel({
  title,
  body,
  actions,
  icon,
  intent = "neutral",
  variant = "region",
  className,
  children
}: StatePanelProps) {
  return (
    <div
      className={`pxs-state pxs-state--${intent} pxs-state--${variant}${
        className ? ` ${className}` : ""
      }`}
      // An error state must reach a screen-reader user without them hunting
      // for it; an empty state is ordinary content and should not interrupt.
      role={intent === "danger" ? "alert" : undefined}
    >
      <span aria-hidden="true" className="pxs-state__icon">
        <Icon name={icon ?? INTENT_ICON[intent]} size={26} />
      </span>
      <h3 className="pxs-state__title">{title}</h3>
      {body ? <p className="pxs-state__body">{body}</p> : null}
      {children}
      {actions ? <div className="pxs-state__actions">{actions}</div> : null}
    </div>
  );
}

/** Nothing exists here yet. Offer the action that would create the first one. */
export function EmptyState(props: Omit<StatePanelProps, "intent">) {
  return <StatePanel {...props} icon={props.icon ?? "grid"} intent="neutral" />;
}

/** Things exist, but not for this query or filter. Offer a way to widen it. */
export function NoResultsState(props: Omit<StatePanelProps, "intent">) {
  return <StatePanel {...props} icon={props.icon ?? "search"} intent="neutral" />;
}

/** Something failed. `actions` should include a retry. */
export function ErrorState(props: Omit<StatePanelProps, "intent">) {
  return <StatePanel {...props} icon={props.icon ?? "alert_circle"} intent="danger" />;
}

/** Something worked, and the confirmation deserves more than a toast. */
export function SuccessState(props: Omit<StatePanelProps, "intent">) {
  return <StatePanel {...props} icon={props.icon ?? "check_circle"} intent="success" />;
}
