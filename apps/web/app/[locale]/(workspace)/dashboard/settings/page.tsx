import type { Locale } from "@manzil/shared";
import { getMyBusinesses } from "../../../../lib/api";
import { updateBusinessAction } from "../../../../lib/crm-actions";
import { getSubscription } from "../../../../lib/crm-api";
import { getBusinessAcceptances, getBusinessContract } from "../../../../lib/legal-api";
import { getCrmCopy } from "../../../../lib/crm-copy";

export const dynamic = "force-dynamic";

export default async function SettingsPage({
  params
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const copy = getCrmCopy(locale);
  const { businesses } = await getMyBusinesses();
  const business = businesses[0];

  if (!business) return null;

  const extra = business as unknown as Record<string, string | undefined>;
  const subscriptionData = await getSubscription(business.slug);
  const subscription = subscriptionData?.subscription;

  // Both return null when absent (no contract generated, or the endpoint
  // failed) — the section renders its own empty state rather than erroring.
  const [contract, acceptances] = await Promise.all([
    getBusinessContract(business.slug),
    getBusinessAcceptances(business.slug)
  ]);
  const dateFormat = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : locale, { dateStyle: "medium" });

  return (
    <>
      <header className="crm-page-head">
        <div>
          <h1>{copy.settings.title}</h1>
          <p>{copy.settings.subtitle}</p>
        </div>
      </header>

      <section className="crm-panel">
        <h2>{copy.settings.subscription}</h2>
        <div className="crm-sub-row">
          <div>
            <span className="crm-cell-sub">{copy.settings.plan}</span>
            <strong className="crm-sub-plan">{(subscription?.plan ?? "free").toUpperCase()}</strong>
          </div>
          <div>
            <span className="crm-cell-sub">{copy.settings.status}</span>
            <span className={`crm-chip crm-chip-${subscription?.status === "active" ? "ok" : "warn"}`}>
              {copy.settings.subStatuses[subscription?.status ?? "active"]}
            </span>
          </div>
          {subscription?.renewsAt ? (
            <div>
              <span className="crm-cell-sub">{copy.settings.renews}</span>
              <strong>{dateFormat.format(new Date(subscription.renewsAt))}</strong>
            </div>
          ) : null}
          <a className="bz-btn-ghost" href={`/${locale}/business/plans?business=${business.slug}`}>
            {copy.menu.upgrade}
          </a>
        </div>
      </section>

      <section className="crm-panel">
        <h2>{copy.settings.profile}</h2>
        <form action={updateBusinessAction} className="crm-form compact">
          <input name="business" type="hidden" value={business.slug} />
          <div className="crm-form-grid">
            <label>
              <span>{copy.settings.name}</span>
              <input defaultValue={business.name} name="name" type="text" />
            </label>
            <label>
              <span>{copy.settings.phone}</span>
              <input defaultValue={business.phone ?? ""} name="phone" type="tel" />
            </label>
            <label>
              <span>{copy.settings.address}</span>
              <input defaultValue={business.address} name="address" type="text" />
            </label>
            <label>
              <span>{copy.settings.district}</span>
              <input defaultValue={business.district} name="district" type="text" />
            </label>
            <label>
              <span>{copy.settings.email}</span>
              <input defaultValue={extra.email ?? ""} name="email" type="email" />
            </label>
            <label>
              <span>{copy.settings.website}</span>
              <input defaultValue={extra.website ?? ""} name="website" type="url" />
            </label>
            <label>
              <span>{copy.settings.instagram}</span>
              <input defaultValue={extra.instagram ?? ""} name="instagram" type="text" />
            </label>
            <label>
              <span>{copy.settings.telegram}</span>
              <input defaultValue={extra.telegram ?? ""} name="telegram" type="text" />
            </label>
            <label>
              <span>{copy.settings.hours}</span>
              <input defaultValue={business.hours ?? ""} name="hours" type="text" />
            </label>
            <label className="span2">
              <span>{copy.settings.description}</span>
              <textarea defaultValue={business.description?.uz ?? ""} name="description" rows={3} />
            </label>
            <label>
              <span>{copy.settings.legalName}</span>
              <input defaultValue={extra.legalName ?? ""} name="legalName" type="text" />
            </label>
            <label>
              <span>{copy.settings.taxId}</span>
              <input defaultValue={extra.taxId ?? ""} inputMode="numeric" maxLength={9} name="taxId" pattern="\d{9}" type="text" />
            </label>
          </div>
          <div className="crm-form-actions">
            <button className="bz-btn-primary" type="submit">{copy.settings.save}</button>
          </div>
        </form>
      </section>

      <section className="crm-panel">
        <h2>{copy.terms.contractTitle}</h2>

        {contract ? (
          <>
            <dl className="crm-mini-facts">
              <div>
                <dt>{copy.terms.contractNo}</dt>
                <dd>{contract.contract.contractNo}</dd>
              </div>
              <div>
                <dt>{copy.terms.version}</dt>
                <dd>{contract.contract.templateVersion}</dd>
              </div>
            </dl>

            {/* The stored, frozen text — not a re-render of the current
                template, which may have changed since this was agreed. */}
            <details className="crm-terms-doc">
              <summary>{copy.terms.download}</summary>
              <pre className="crm-contract-body">{contract.contract.body}</pre>
            </details>
          </>
        ) : (
          <p className="crm-hint">{copy.terms.noContract}</p>
        )}

        {acceptances && acceptances.acceptances.length > 0 ? (
          <>
            <h3 className="crm-subhead">{copy.terms.accepted}</h3>
            <ul className="crm-mini-facts">
              {acceptances.acceptances.map((document) => (
                <li key={document.id}>
                  <span>
                    {document.kind.replace(/_/g, " ")} · {copy.terms.version} {document.version}
                  </span>{" "}
                  <span className="crm-cell-sub">
                    {new Date(document.acceptedAt).toLocaleDateString(locale, {
                      timeZone: "Asia/Tashkent"
                    })}
                  </span>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </section>
    </>
  );
}
