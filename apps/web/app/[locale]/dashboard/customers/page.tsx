import type { Locale } from "@manzil/shared";
import { isLocale } from "@manzil/shared";
import { notFound } from "next/navigation";
import { getMyBusinesses } from "../../../lib/api";
import { getCustomers } from "../../../lib/crm-api";
import { getCrmCopy } from "../../../lib/crm-copy";

export const dynamic = "force-dynamic";

function formatMoney(amount: string, locale: string): string {
  const value = Number(amount);
  if (!Number.isFinite(value) || value === 0) return "—";
  return `${new Intl.NumberFormat(locale).format(Math.round(value))} UZS`;
}

export default async function CustomersPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const copy = getCrmCopy(locale as Locale);
  const text = copy.customers;

  const { businesses } = await getMyBusinesses();
  const business = businesses[0];

  if (!business) {
    notFound();
  }

  const result = await getCustomers(business.slug);
  const customers = result?.customers ?? [];

  return (
    <section>
      <header className="crm-page-head">
        <h1>{text.title}</h1>
      </header>
      <p className="crm-pending-note">{text.subtitle}</p>

      {customers.length === 0 ? (
        <p className="crm-pending-note">{text.empty}</p>
      ) : (
        <table className="crm-table">
          <thead>
            <tr>
              <th>{text.colName}</th>
              <th>{text.colLastVisit}</th>
              <th>{text.colVisits}</th>
              <th>{text.colSpend}</th>
              <th>{text.colTags}</th>
              <th>{text.colConsent}</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td>
                  {customer.name ?? "—"}
                  <p className="crm-cell-sub">{customer.phone}</p>
                </td>
                <td>
                  {customer.lastVisitAt
                    ? new Date(customer.lastVisitAt).toLocaleDateString(locale, { timeZone: "Asia/Tashkent" })
                    : text.never}
                </td>
                <td>{customer.visitCount}</td>
                <td>{formatMoney(customer.totalSpend, locale)}</td>
                <td>{customer.tags.length > 0 ? customer.tags.join(", ") : "—"}</td>
                <td>{customer.consentMarketing ? text.consentYes : text.consentNo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
