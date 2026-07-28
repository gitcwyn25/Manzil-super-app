import type { Locale } from "@manzil/shared";
import { isLocale } from "@manzil/shared";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getMyBusinesses } from "../../../../../lib/api";
import { getCustomer } from "../../../../../lib/crm-api";
import { getCrmCopy } from "../../../../../lib/crm-copy";

export const dynamic = "force-dynamic";

/** Business timezone, matching the customer list. A UTC-rendered date shows the wrong day to a Tashkent owner. */
const TIME_ZONE = "Asia/Tashkent";

function formatMoney(amount: string, locale: string): string {
  const value = Number(amount);
  if (!Number.isFinite(value) || value === 0) return "—";
  return `${new Intl.NumberFormat(locale).format(Math.round(value))} UZS`;
}

function formatDate(iso: string, locale: string): string {
  return new Date(iso).toLocaleDateString(locale, { timeZone: TIME_ZONE });
}

export default async function CustomerDetailPage({
  params
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const copy = getCrmCopy(locale as Locale);
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

  return (
    <section>
      <header className="crm-page-head">
        <h1>{customer.name ?? customer.phone}</h1>
      </header>

      <p className="crm-pending-note">
        <Link href={`/${locale}/dashboard/customers`}>← {text.back}</Link>
      </p>

      <div className="crm-statrow">
        <article className="crm-statcard">
          <span>{listText.colVisits}</span>
          <strong>{customer.visitCount}</strong>
        </article>
        <article className="crm-statcard">
          <span>{listText.colSpend}</span>
          <strong>{formatMoney(customer.totalSpend, locale)}</strong>
        </article>
        <article className="crm-statcard">
          <span>{listText.colLastVisit}</span>
          <strong>
            {customer.lastVisitAt ? formatDate(customer.lastVisitAt, locale) : listText.never}
          </strong>
        </article>
        <article className="crm-statcard">
          <span>{text.firstSeen}</span>
          <strong>{formatDate(customer.firstSeenAt, locale)}</strong>
        </article>
      </div>

      <div className="crm-panels">
        <section className="crm-panel">
          <h2>{text.profile}</h2>
          <dl className="crm-mini-facts">
            <div>
              <dt>{listText.colName}</dt>
              <dd>{customer.phone}</dd>
            </div>
            <div>
              <dt>{listText.colTags}</dt>
              <dd>{customer.tags.length > 0 ? customer.tags.join(", ") : "—"}</dd>
            </div>
            <div>
              <dt>{listText.colConsent}</dt>
              <dd>{customer.consentMarketing ? listText.consentYes : listText.consentNo}</dd>
            </div>
            <div>
              <dt>{text.notes}</dt>
              <dd>{customer.notes ?? text.noNotes}</dd>
            </div>
          </dl>
        </section>

        <section className="crm-panel">
          <h2>{text.bookings}</h2>
          {customer.bookings.length === 0 ? (
            <p className="crm-empty">{text.noBookings}</p>
          ) : (
            <table className="crm-table">
              <thead>
                <tr>
                  <th>{text.colService}</th>
                  <th>{text.colDate}</th>
                  <th>{text.colStatus}</th>
                  <th>{text.colAmount}</th>
                </tr>
              </thead>
              <tbody>
                {customer.bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td>{booking.serviceName}</td>
                    <td>{formatDate(booking.startsAt, locale)}</td>
                    <td>{booking.status.replace(/_/g, " ")}</td>
                    <td>{formatMoney(booking.amount, locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="crm-panel">
          <h2>{text.reviews}</h2>
          {/* An unlinked customer *cannot* have reviews — say that, rather than
              showing an empty state that reads as "left no review". */}
          {!customer.hasAccount ? (
            <p className="crm-empty">{text.noAccountHint}</p>
          ) : customer.reviews.length === 0 ? (
            <p className="crm-empty">{text.noReviews}</p>
          ) : (
            <ul className="crm-review-list">
              {customer.reviews.map((review) => (
                <li key={review.id} className="crm-review">
                  <strong>{"★".repeat(review.rating)}</strong>
                  <p>{review.text}</p>
                  <p className="crm-cell-sub">{formatDate(review.createdAt, locale)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="crm-panel">
          <h2>{text.visits}</h2>
          {customer.visits.length === 0 ? (
            <p className="crm-empty">{text.noVisits}</p>
          ) : (
            <ul className="crm-mini-facts">
              {customer.visits.map((visit) => (
                <li key={visit.id}>
                  <span>{formatDate(visit.occurredAt, locale)}</span>{" "}
                  <span className="crm-cell-sub">{visit.source.replace(/_/g, " ")}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </section>
  );
}
