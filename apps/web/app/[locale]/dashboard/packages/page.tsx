import type { Locale } from "@manzil/shared";
import { getMyBusinesses } from "../../../lib/api";
import { createPackageAction, deletePackageAction, togglePackageAction } from "../../../lib/crm-actions";
import { getPackages } from "../../../lib/crm-api";
import { getCrmCopy } from "../../../lib/crm-copy";

export const dynamic = "force-dynamic";

export default async function PackagesPage({
  params
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const copy = getCrmCopy(locale);
  const { businesses } = await getMyBusinesses();
  const business = businesses[0];

  if (!business) return null;

  const data = await getPackages(business.slug);
  const packages = data?.packages ?? [];
  const priceFormat = new Intl.NumberFormat(locale === "en" ? "en-US" : "ru-RU");

  return (
    <>
      <header className="crm-page-head">
        <div>
          <h1>{copy.packages.title}</h1>
          <p>{copy.packages.subtitle}</p>
        </div>
      </header>

      <section className="crm-panel">
        <h2>{copy.packages.newTitle}</h2>
        <form action={createPackageAction} className="crm-form compact">
          <input name="business" type="hidden" value={business.slug} />
          <div className="crm-form-grid">
            <label>
              <span>{copy.packages.name} *</span>
              <input maxLength={140} minLength={2} name="name" required type="text" />
            </label>
            <label>
              <span>{copy.packages.price} *</span>
              <input min={0} name="price" required step="1000" type="number" />
            </label>
            <label className="span2">
              <span>{copy.packages.description}</span>
              <input name="description" type="text" />
            </label>
          </div>
          <div className="crm-form-actions">
            <button className="bz-btn-primary" type="submit">{copy.packages.submit}</button>
          </div>
        </form>
      </section>

      <section className="crm-panel">
        <table className="crm-table">
          <thead>
            <tr>
              <th>{copy.packages.table.name}</th>
              <th>{copy.packages.table.price}</th>
              <th>{copy.packages.table.status}</th>
              <th>{copy.packages.table.actions}</th>
            </tr>
          </thead>
          <tbody>
            {packages.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.name}</strong>
                  {item.description ? <p className="crm-cell-sub">{item.description}</p> : null}
                </td>
                <td className="crm-price">{priceFormat.format(Number(item.price))} {item.currency}</td>
                <td>
                  <span className={`crm-chip crm-chip-${item.isActive ? "ok" : "muted"}`}>
                    {item.isActive ? copy.packages.active : copy.packages.inactive}
                  </span>
                </td>
                <td>
                  <div className="crm-row-actions">
                    <form action={togglePackageAction}>
                      <input name="id" type="hidden" value={item.id} />
                      <input name="isActive" type="hidden" value={item.isActive ? "false" : "true"} />
                      <button type="submit">
                        {item.isActive ? copy.packages.deactivate : copy.packages.activate}
                      </button>
                    </form>
                    <form action={deletePackageAction}>
                      <input name="id" type="hidden" value={item.id} />
                      <button className="danger" type="submit">{copy.packages.remove}</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {packages.length === 0 ? (
              <tr>
                <td className="crm-empty" colSpan={4}>{copy.packages.empty}</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </>
  );
}
