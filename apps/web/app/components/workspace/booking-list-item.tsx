import Link from "next/link";
import type { ReactNode } from "react";
import { InitialsAvatar } from "../vm/initials-avatar";
import { StatusPill, type StatusPillVariant } from "../vm/status-pill";

/**
 * One booking row for workspace lists (dashboard overview "Recent Bookings",
 * /dashboard/bookings full list — D5 reuses this so both look identical):
 * InitialsAvatar + name/service two-liner + right-aligned amount and
 * StatusPill. `amount` is optional on purpose — CrmBooking carries only a
 * nullable depositAmount, so the row omits money it does not have (D7).
 *
 * The full-list variant adds three optional slots the overview never sets:
 * `meta` (phone • start time line), `href` (links the name to the customer
 * profile), and `actions` (the status-transition forms). Omitting them keeps
 * the overview row byte-identical to before.
 */
export function BookingListItem({
  name,
  service,
  meta,
  href,
  amount,
  statusLabel,
  statusVariant,
  actions
}: {
  name: string;
  service: string;
  /** Secondary data line under the service (phone, start time). */
  meta?: string | null;
  /** When set, the customer name links to their CRM profile. */
  href?: string;
  amount?: string | null;
  statusLabel: string;
  statusVariant: StatusPillVariant;
  /** Row-level management actions (server-action forms). */
  actions?: ReactNode;
}) {
  return (
    <li className="ws-booking">
      <InitialsAvatar name={name} />
      <div className="ws-booking__text">
        {href ? (
          <Link className="ws-booking__name ws-booking__profile-link" href={href}>
            {name}
          </Link>
        ) : (
          <span className="ws-booking__name">{name}</span>
        )}
        <span className="ws-booking__service">{service}</span>
        {meta ? <span className="ws-num ws-booking__meta">{meta}</span> : null}
      </div>
      <div className="ws-booking__end">
        {amount ? <span className="ws-num ws-booking__amount">{amount}</span> : null}
        <StatusPill variant={statusVariant}>{statusLabel}</StatusPill>
      </div>
      {actions ? <div className="ws-booking__actions">{actions}</div> : null}
    </li>
  );
}
