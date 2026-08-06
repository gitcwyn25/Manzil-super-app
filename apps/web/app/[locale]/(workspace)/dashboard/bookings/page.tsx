import type { Locale } from "@manzil/shared";
import { isLocale } from "@manzil/shared";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookingSubmit } from "../../../../components/crm/booking-submit";
import { IconField } from "../../../../components/vm/icon-field";
import { IconTile } from "../../../../components/vm/icon-tile";
import { PageHeaderCard } from "../../../../components/vm/page-header-card";
import type { StatusPillVariant } from "../../../../components/vm/status-pill";
import { BookingListItem } from "../../../../components/workspace/booking-list-item";
import { getMyBusinesses } from "../../../../lib/api";
import { createBookingAction, setBookingStatusAction } from "../../../../lib/crm-actions";
import { getBookings, type BookingStatus } from "../../../../lib/crm-api";
import { getCrmCopy } from "../../../../lib/crm-copy";
import { formatNumber, formatUzs, intlLocale } from "../../../../lib/format";

export const dynamic = "force-dynamic";

/** Business timezone, matching the customer list — a UTC-rendered time shows the wrong hour to a Tashkent owner. */
const TIME_ZONE = "Asia/Tashkent";

const STATUS_FILTERS: BookingStatus[] = ["pending", "confirmed", "completed", "canceled", "no_show"];

// Same map the overview uses: confirmed/completed read as success,
// canceled/no_show as danger, pending stays neutral surface.
const STATUS_VARIANTS: Record<BookingStatus, StatusPillVariant> = {
  pending: "pending",
  confirmed: "success",
  completed: "success",
  canceled: "danger",
  no_show: "danger"
};

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
  const dateTimeFormat = new Intl.DateTimeFormat(intlLocale(locale as Locale), {
    timeZone: TIME_ZONE,
    dateStyle: "medium",
    timeStyle: "short"
  });

  return (
    <div className="ws-page">
      <PageHeaderCard
        action={
          <span className="ws-live">
            {text.upcoming}: <span className="ws-num">{formatNumber(upcomingCount, locale as Locale)}</span>
          </span>
        }
        subtitle={text.subtitle}
        title={text.title}
      />

      <nav aria-label={text.table.status} className="ws-filter">
        <Link className={!statusFilter ? "ws-filter__chip active" : "ws-filter__chip"} href={base}>
          {text.filterAll}
        </Link>
        {STATUS_FILTERS.map((status) => (
          <Link
            className={statusFilter === status ? "ws-filter__chip active" : "ws-filter__chip"}
            href={`${base}?status=${status}`}
            key={status}
          >
            {text.statuses[status]}
          </Link>
        ))}
      </nav>

      {/* Manual booking intake — same form semantics as before, IconField skin. */}
      <section className="card ws-panel">
        <div className="card-body ws-panel__body">
          <div className="ws-panel__head">
            <div className="ws-panel-title-row">
              <IconTile accent="primary" icon="calendar" size="sm" />
              <h2 className="ws-panel__title">{text.newTitle}</h2>
            </div>
          </div>
          <form action={createBookingAction} className="ws-form">
            <input name="business" type="hidden" value={business.slug} />
            <div className="ws-form__grid">
              <label className="ws-field">
                <span className="ws-field__label">{text.customerPhone} *</span>
                <IconField
                  icon="call"
                  maxLength={32}
                  name="customerPhone"
                  placeholder="+998 90 123 45 67"
                  required
                  type="tel"
                />
              </label>
              <label className="ws-field">
                <span className="ws-field__label">{text.serviceName} *</span>
                <IconField icon="tag" maxLength={200} name="serviceName" required type="text" />
              </label>
              <label className="ws-field">
                <span className="ws-field__label">{text.depositAmount}</span>
                <IconField icon="banknote" min={0} name="depositAmount" step="1000" type="number" />
              </label>
              <label className="ws-field">
                <span className="ws-field__label">{text.startsAt} *</span>
                <IconField icon="calendar" name="startsAt" required type="datetime-local" />
              </label>
              <label className="ws-field">
                <span className="ws-field__label">{text.endsAt}</span>
                <IconField icon="schedule" name="endsAt" type="datetime-local" />
              </label>
            </div>
            <div className="ws-form__actions">
              <BookingSubmit label={text.submit} pendingLabel={text.submitting} />
            </div>
          </form>
        </div>
      </section>

      {bookings.length === 0 ? (
        <section className="card ws-panel">
          <div className="card-body ws-panel__body ws-empty">
            <h2 className="ws-panel__title">{text.emptyTitle}</h2>
            <p className="ws-empty__body">{text.emptyBody}</p>
          </div>
        </section>
      ) : (
        <section className="card ws-panel">
          <div className="card-body ws-panel__body">
            <ul className="ws-booking-list">
              {bookings.map((booking) => {
                const deposit = booking.depositAmount ? Number.parseFloat(booking.depositAmount) : Number.NaN;
                const actions = actionsFor(booking.status);
                return (
                  <BookingListItem
                    actions={
                      actions.length > 0 ? (
                        <>
                          {actions.map((action) => (
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
                        </>
                      ) : null
                    }
                    amount={Number.isFinite(deposit) ? formatUzs(Math.round(deposit), locale as Locale) : null}
                    href={
                      booking.customerId
                        ? `/${locale}/dashboard/customers/${booking.customerId}`
                        : undefined
                    }
                    key={booking.id}
                    meta={`${booking.customerPhone} • ${dateTimeFormat.format(new Date(booking.startsAt))}`}
                    name={booking.customerName ?? booking.customerPhone}
                    service={booking.serviceName}
                    statusLabel={text.statuses[booking.status]}
                    statusVariant={STATUS_VARIANTS[booking.status]}
                  />
                );
              })}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}
