import { InitialsAvatar } from "../vm/initials-avatar";
import { StatusPill, type StatusPillVariant } from "../vm/status-pill";

/**
 * One booking row for workspace lists (dashboard overview "Recent Bookings",
 * /dashboard/bookings full list — D5 reuses this so both look identical):
 * InitialsAvatar + name/service two-liner + right-aligned amount and
 * StatusPill. `amount` is optional on purpose — CrmBooking carries only a
 * nullable depositAmount, so the row omits money it does not have (D7).
 */
export function BookingListItem({
  name,
  service,
  amount,
  statusLabel,
  statusVariant
}: {
  name: string;
  service: string;
  amount?: string | null;
  statusLabel: string;
  statusVariant: StatusPillVariant;
}) {
  return (
    <li className="ws-booking">
      <InitialsAvatar name={name} />
      <div className="ws-booking__text">
        <span className="ws-booking__name">{name}</span>
        <span className="ws-booking__service">{service}</span>
      </div>
      <div className="ws-booking__end">
        {amount ? <span className="ws-num ws-booking__amount">{amount}</span> : null}
        <StatusPill variant={statusVariant}>{statusLabel}</StatusPill>
      </div>
    </li>
  );
}
