import type { Locale } from "@manzil/shared";
import { isLocale } from "@manzil/shared";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Icon } from "../../../../../components/vm/icons";
import { InitialsAvatar } from "../../../../../components/vm/initials-avatar";
import { PageHeaderCard } from "../../../../../components/vm/page-header-card";
import { StatusPill } from "../../../../../components/vm/status-pill";
import type { StatusPillVariant } from "../../../../../components/vm/status-pill";
import { StatCard } from "../../../../../components/workspace/stat-card";
import { getMyBusinesses } from "../../../../../lib/api";
import { getCustomer } from "../../../../../lib/crm-api";
import type { BookingStatus } from "../../../../../lib/crm-api";
import { getCrmCopy } from "../../../../../lib/crm-copy";
import { formatNumber, formatUzs, intlLocale } from "../../../../../lib/format";

export const dynamic = "force-dynamic";

/** Business timezone, matching the customer list. A UTC-rendered date shows the wrong day to a Tashkent owner. */
const TIME_ZONE = "Asia/Tashkent";

// Same status → pill map as the bookings list; CustomerBooking.status is a
// plain string, so unknown values degrade to a neutral pill with the raw text.
const STATUS_VARIANTS: Record<BookingStatus, StatusPillVariant> = {
  pending: "pending",
  confirmed: "success",
  completed: "success",
  canceled: "danger",
  no_show: "danger"
};

function isBookingStatus(value: string): value is BookingStatus {
  return value in STATUS_VARIANTS;
}

export default async function CustomerDetailPage({
  params
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale: rawLocale, id } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale as Locale;
  const copy = getCrmCopy(locale);
  const text = copy.customerDetail;
  const listText = copy.customers;

  const { businesses } = await getMyBusinesses();
  const business = businesses[0];

  if (!business) {
    notFound();
  }

  const result = await getCustomer(business.slug, id);

  // Null covers both "no such customer for this business" and a transport
  // failure. Either way the owner cannot act on this id, so 404 is honest.
  if (!result?.customer) {
    notFound();
  }

  const customer = result.customer;
  const name = customer.name ?? customer.phone;
  const dateFormat = new Intl.DateTimeFormat(intlLocale(locale), { timeZone: TIME_ZONE });
  const spend = Number.parseFloat(customer.totalSpend);

  const formatMoney = (amount: string): string => {
    const value = Number.parseFloat(amount);
    if (!Number.isFinite(value) || value === 0) return "—";
    return formatUzs(Math.round(value), locale);
  };

  return (
    <div className="ws-page">
      <PageHeaderCard
        action={
          <Link className="btn btn-secondary btn-sm ws-back-link" href={`/${locale}/dashboard/customers`}>
            <Icon name="arrow_back" size={16} />
            {text.back}
          </Link>
        }
        subtitle={<span className="ws-num">{customer.phone}</span>}
        title={
          <span className="ws-detail-name">
            <InitialsAvatar name={name} size="lg" />
            {name}
          </span>
        }
      />

      <div className="ws-kpi-grid">
        <StatCard
          caption={listText.colVisits}
          icon="user"
          value={formatNumber(customer.visitCount, locale)}
        />
        <StatCard
          accent="secondary"
          caption={listText.colSpend}
          icon="banknote"
          value={Number.isFinite(spend) && spend > 0 ? formatUzs(Math.round(spend), locale) : "—"}
        />
        <StatCard
          caption={listText.colLastVisit}
          icon="schedule"
          value={customer.lastVisitAt ? dateFormat.format(new Date(customer.lastVisitAt)) : listText.never}
        />
        <StatCard
          accent="tertiary"
          caption={text.firstSeen}
          icon="calendar"
          value={dateFormat.format(new Date(customer.firstSeenAt))}
        />
      </div>

      <div className="ws-grid-2">
        <section className="card ws-panel">
          <div className="card-body ws-panel__body">
            <div className="ws-panel__head">
              <h2 className="ws-panel__title">{text.profile}</h2>
            </div>
            <dl className="ws-facts__body ws-facts__body--flush">
              <div className="ws-fact">
                <dt>{listText.colName}</dt>
                <dd className="ws-num">{customer.phone}</dd>
              </div>
              <div className="ws-fact">
                <dt>{listText.colTags}</dt>
                <dd>{customer.tags.length > 0 ? customer.tags.join(", ") : "—"}</dd>
              </div>
              <div className="ws-fact">
                <dt>{listText.colConsent}</dt>
                <dd>
                  <StatusPill variant={customer.consentMarketing ? "success" : "neutral"}>
                    {customer.consentMarketing ? listText.consentYes : listText.consentNo}
                  </StatusPill>
                </dd>
              </div>
              <div className="ws-fact">
                <dt>{text.notes}</dt>
                <dd>{customer.notes ?? text.noNotes}</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="card ws-panel">
          <div className="card-body ws-panel__body">
            <div className="ws-panel__head">
              <h2 className="ws-panel__title">{text.bookings}</h2>
            </div>
            {customer.bookings.length === 0 ? (
              <p className="ws-empty__body">{text.noBookings}</p>
            ) : (
              <ul className="ws-mini-list">
                {customer.bookings.map((booking) => (
                  <li className="ws-mini-row" key={booking.id}>
                    <div className="ws-mini-row__text">
                      <span className="ws-mini-row__title">{booking.serviceName}</span>
                      <span className="ws-mini-row__meta ws-num">
                        {dateFormat.format(new Date(booking.startsAt))}
                        {formatMoney(booking.amount) !== "—"
                          ? ` • ${formatMoney(booking.amount)}`
                          : ""}
                      </span>
                    </div>
                    <StatusPill
                      variant={isBookingStatus(booking.status) ? STATUS_VARIANTS[booking.status] : "neutral"}
                    >
                      {isBookingStatus(booking.status)
                        ? copy.bookings.statuses[booking.status]
                        : booking.status.replace(/_/g, " ")}
                    </StatusPill>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="card ws-panel">
          <div className="card-body ws-panel__body">
            <div className="ws-panel__head">
              <h2 className="ws-panel__title">{text.reviews}</h2>
            </div>
            {/* An unlinked customer *cannot* have reviews — say that, rather
                than showing an empty state that reads as "left no review". */}
            {!customer.hasAccount ? (
              <p className="ws-empty__body">{text.noAccountHint}</p>
            ) : customer.reviews.length === 0 ? (
              <p className="ws-empty__body">{text.noReviews}</p>
            ) : (
              <ul className="ws-mini-list">
                {customer.reviews.map((review) => (
                  <li className="ws-rev ws-rev--mini" key={review.id}>
                    <span aria-label={`${review.rating}/5`} className="biz-stars" role="img">
                      {[1, 2, 3, 4, 5].map((step) => (
                        <Icon
                          className={step <= review.rating ? undefined : "biz-stars__empty"}
                          key={step}
                          name={step <= review.rating ? "star_filled" : "star"}
                          size={14}
                        />
                      ))}
                    </span>
                    <p className="ws-rev__text">{review.text}</p>
                    <span className="ws-rev__meta ws-num">
                      {dateFormat.format(new Date(review.createdAt))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="card ws-panel">
          <div className="card-body ws-panel__body">
            <div className="ws-panel__head">
              <h2 className="ws-panel__title">{text.visits}</h2>
            </div>
            {customer.visits.length === 0 ? (
              <p className="ws-empty__body">{text.noVisits}</p>
            ) : (
              <ul className="ws-mini-list">
                {customer.visits.map((visit) => (
                  <li className="ws-mini-row" key={visit.id}>
                    <div className="ws-mini-row__text">
                      <span className="ws-mini-row__title ws-num">
                        {dateFormat.format(new Date(visit.occurredAt))}
                      </span>
                    </div>
                    <span className="ws-mini-row__meta">{visit.source.replace(/_/g, " ")}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
