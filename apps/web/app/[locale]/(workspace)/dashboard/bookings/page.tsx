import type { Locale } from "@manzil/shared";
import { isLocale } from "@manzil/shared";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookingSubmit } from "../../../../components/crm/booking-submit";
import { getMyBusinesses } from "../../../../lib/api";
import { createBookingAction, setBookingStatusAction } from "../../../../lib/crm-actions";
import { getBookings, type BookingStatus } from "../../../../lib/crm-api";
import { getCrmCopy } from "../../../../lib/crm-copy";

export const dynamic = "force-dynamic";

/** Business timezone, matching the customer list — a UTC-rendered time shows the wrong hour to a Tashkent owner. */
const TIME_ZONE = "Asia/Tashkent";

const STATUS_FILTERS: BookingStatus[] = ["pending", "confirmed", "completed", "canceled", "no_show"];

function formatDateTime(iso: string, locale: string): string {
  return new Date(iso).toLocaleString(locale, {
    timeZone: TIME_ZONE,
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function formatMoney(amount: string | null, locale: string): string {
  const value = amount ? Number(amount) : 0;
  if (!Number.isFinite(value) || value === 0) return "—";
  return `${new Intl.NumberFormat(locale).format(Math.round(value))} UZS`;
}

/** Chip color per status — canceled/no_show share the "negative outcome" hue, completed reads as neutral/historical rather than "still good". */
function chipClass(status: BookingStatus): string {
  switch (status) {
    case "pending":
      return "crm-chip-warn";
    case "confirmed":
      return "crm-chip-ok";
    case "completed":
      return "crm-chip-muted";
    default:
      return "crm-chip-danger";
  }
}

/**
 * Which status actions are offered from a given status — mirrors the API's
 * transition rule exactly (BookingsRepository: any non-terminal status may
 * move to any other status; completed/canceled/no_show are terminal and get
 * no actions at all).
 */
function actionsFor(status: BookingStatus): Array<{ status: BookingStatus; danger: boolean }> {
  switch (status) {
    case "pending":
      return [
        { status: "confirmed", danger: false },
        { status: "completed", danger: false },
        { status: "canceled", danger: true },
        { status: "no_show", danger: true }
      ];
    case "confirmed":
      return [
        { status: "completed", danger: false },
        { status: "canceled", danger: true },
        { status: "no_show", danger: true }
      ];
    default:
      return [];
  }
}

export default async function BookingsPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const [{ locale }, filters] = await Promise.all([params, searchParams]);

  if (!isLocale(locale)) {
    notFound();
  }

  const copy = getCrmCopy(locale as Locale);
  const text = copy.bookings;

  const { businesses } = await getMyBusinesses();
  const business = businesses[0];

  if (!business) {
    notFound();
  }

  const statusFilter = STATUS_FILTERS.includes(filters.status as BookingStatus)
    ? (filters.status as BookingStatus)
    : undefined;

  const result = await getBookings(business.slug, statusFilter ? { status: statusFilter } : {});
  const bookings = result?.bookings ?? [];

  const now = new Date();
  const upcomingCount = bookings.filter(
    (booking) =>
      (booking.status === "pending" || booking.status === "confirmed") &&
      new Date(booking.startsAt) > now
  ).length;

  const actionLabels: Record<BookingStatus, { label: string; pendingLabel: string }> = {
    pending: { label: "", pendingLabel: "" },
    confirmed: { label: text.confirm, pendingLabel: text.confirming },
    completed: { label: text.complete, pendingLabel: text.completing },
    canceled: { label: text.cancel, pendingLabel: text.canceling },
    no_show: { label: text.noShow, pendingLabel: text.noShowing }
  };

  const base = `/${locale}/dashboard/bookings`;

  return (
    <>
      <header className="crm-page-head">
        <div>
          <h1>{text.title}</h1>
          <p>{text.subtitle}</p>
        </div>
        <span className="ws-live">
          {text.upcoming}: <span className="ws-num">{upcomingCount}</span>
        </span>
      </header>

      <nav aria-label={text.table.status} className="crm-status-filter">
        <Link className={!statusFilter ? "active" : undefined} href={base}>
          {text.filterAll}
        </Link>
        {STATUS_FILTERS.map((status) => (
          <Link
            className={statusFilter === status ? "active" : undefined}
            href={`${base}?status=${status}`}
            key={status}
          >
            {text.statuses[status]}
          </Link>
        ))}
      </nav>

      <section className="crm-panel">
        <h2>{text.newTitle}</h2>
        <form action={createBookingAction} className="crm-form compact">
          <input name="business" type="hidden" value={business.slug} />
          <div className="crm-form-grid">
            <label>
              <span>{text.customerPhone} *</span>
              <input maxLength={32} name="customerPhone" placeholder="+998 90 123 45 67" required type="tel" />
            </label>
            <label>
              <span>{text.serviceName} *</span>
              <input maxLength={200} name="serviceName" required type="text" />
            </label>
            <label>
              <span>{text.depositAmount}</span>
              <input min={0} name="depositAmount" step="1000" type="number" />
            </label>
            <label>
              <span>{text.startsAt} *</span>
              <input name="startsAt" required type="datetime-local" />
            </label>
            <label>
              <span>{text.endsAt}</span>
              <input name="endsAt" type="datetime-local" />
            </label>
          </div>
          <div className="crm-form-actions">
            <BookingSubmit label={text.submit} pendingLabel={text.submitting} />
          </div>
        </form>
      </section>

      {bookings.length === 0 ? (
        <div className="empty-state">
          <h2>{text.emptyTitle}</h2>
          <p>{text.emptyBody}</p>
        </div>
      ) : (
        <section className="crm-panel">
          <table className="ws-table">
            <thead>
              <tr>
                <th>{text.table.customer}</th>
                <th>{text.table.phone}</th>
                <th>{text.table.service}</th>
                <th>{text.table.when}</th>
                <th>{text.table.status}</th>
                <th>{text.table.actions}</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <td>
                    {booking.customerId ? (
                      <Link href={`/${locale}/dashboard/customers/${booking.customerId}`}>
                        {booking.customerName ?? booking.customerPhone}
                      </Link>
                    ) : (
                      booking.customerName ?? booking.customerPhone
                    )}
                  </td>
                  <td className="ws-num">{booking.customerPhone}</td>
                  <td>{booking.serviceName}</td>
                  <td className="ws-num">{formatDateTime(booking.startsAt, locale)}</td>
                  <td>
                    <span className={`crm-chip ${chipClass(booking.status)}`}>
                      {text.statuses[booking.status]}
                    </span>
                    {booking.depositAmount ? (
                      <p className="crm-cell-sub">{formatMoney(booking.depositAmount, locale)}</p>
                    ) : null}
                  </td>
                  <td>
                    <div className="crm-row-actions">
                      {actionsFor(booking.status).map((action) => (
                        <form action={setBookingStatusAction} key={action.status}>
                          <input name="id" type="hidden" value={booking.id} />
                          <input name="status" type="hidden" value={action.status} />
                          <BookingSubmit
                            danger={action.danger}
                            label={actionLabels[action.status].label}
                            pendingLabel={actionLabels[action.status].pendingLabel}
                            tone="row"
                          />
                        </form>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </>
  );
}
