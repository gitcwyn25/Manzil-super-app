import type { Locale } from "@manzil/shared";
import { isLocale } from "@manzil/shared";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InitialsAvatar } from "../../../../components/vm/initials-avatar";
import { PageHeaderCard } from "../../../../components/vm/page-header-card";
import { StatusPill } from "../../../../components/vm/status-pill";
import { getMyBusinesses } from "../../../../lib/api";
import { getCustomers } from "../../../../lib/crm-api";
import { getCrmCopy } from "../../../../lib/crm-copy";
import { formatNumber, formatUzs, intlLocale } from "../../../../lib/format";

export const dynamic = "force-dynamic";

/** Business timezone — a UTC-rendered date shows the wrong day to a Tashkent owner. */
const TIME_ZONE = "Asia/Tashkent";

/**
 * Customer directory (Vibrant Marketplace, task D5): the table becomes an
 * InitialsAvatar card-list — each row is the same L1 recipe as the bookings
 * list, with per-fact captions replacing the column headers and the
 * marketing-consent flag as a StatusPill.
 */
export default async function CustomersPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: rawLocale } = await params;

  if (!isLocale(rawLocale)) {
    notFound();
  }

  const locale = rawLocale as Locale;
  const copy = getCrmCopy(locale);
  const text = copy.customers;

  const { businesses } = await getMyBusinesses();
  const business = businesses[0];

  if (!business) {
    notFound();
  }

  const result = await getCustomers(business.slug);
  const customers = result?.customers ?? [];
  const dateFormat = new Intl.DateTimeFormat(intlLocale(locale), { timeZone: TIME_ZONE });

  return (
    <div className="ws-page">
      <PageHeaderCard subtitle={text.subtitle} title={text.title} />

      {customers.length === 0 ? (
        <section className="card ws-panel">
          <div className="card-body ws-panel__body ws-empty">
            <p className="ws-empty__body">{text.empty}</p>
          </div>
        </section>
      ) : (
        <section className="card ws-panel">
          <div className="card-body ws-panel__body">
            <ul className="ws-booking-list">
              {customers.map((customer) => {
                const name = customer.name ?? customer.phone;
                const spend = Number.parseFloat(customer.totalSpend);
                return (
                  <li className="ws-booking ws-cust" key={customer.id}>
                    <InitialsAvatar name={name} />
                    <div className="ws-booking__text">
                      {/* The name is the row's affordance into the profile — a
                          separate "view" column would add a cell for nothing. */}
                      <Link
                        className="ws-booking__name ws-booking__profile-link"
                        href={`/${locale}/dashboard/customers/${customer.id}`}
                      >
                        {name}
                      </Link>
                      <span className="ws-booking__service ws-num">{customer.phone}</span>
                      {customer.tags.length > 0 ? (
                        <span className="ws-booking__service">{customer.tags.join(", ")}</span>
                      ) : null}
                    </div>
                    <div className="ws-cust__facts">
                      <span className="ws-cust__fact">
                        <em>{text.colLastVisit}</em>
                        <b className="ws-num">
                          {customer.lastVisitAt
                            ? dateFormat.format(new Date(customer.lastVisitAt))
                            : text.never}
                        </b>
                      </span>
                      <span className="ws-cust__fact">
                        <em>{text.colVisits}</em>
                        <b className="ws-num">{formatNumber(customer.visitCount, locale)}</b>
                      </span>
                      <span className="ws-cust__fact">
                        <em>{text.colSpend}</em>
                        <b className="ws-num">
                          {Number.isFinite(spend) && spend > 0
                            ? formatUzs(Math.round(spend), locale)
                            : "—"}
                        </b>
                      </span>
                      <StatusPill variant={customer.consentMarketing ? "success" : "neutral"}>
                        {customer.consentMarketing ? text.consentPillYes : text.consentPillNo}
                      </StatusPill>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}
