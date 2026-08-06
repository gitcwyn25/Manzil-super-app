import type { Locale } from "@manzil/shared";
import Link from "next/link";
import { BusinessPhotoManager } from "../../../../components/business-photo-manager";
import { IconField } from "../../../../components/vm/icon-field";
import { PageHeaderCard } from "../../../../components/vm/page-header-card";
import { StatusPill } from "../../../../components/vm/status-pill";
import { getMyBusinesses } from "../../../../lib/api";
import { updateBusinessAction } from "../../../../lib/crm-actions";
import { getBusinessPhotos, getSubscription } from "../../../../lib/crm-api";
import { getBusinessAcceptances, getBusinessContract } from "../../../../lib/legal-api";
import { getCrmCopy } from "../../../../lib/crm-copy";

export const dynamic = "force-dynamic";

/**
 * Settings (Vibrant Marketplace, task D5): PageHeaderCard + the IconField
 * recipe applied to the existing profile form. Zero behavior change — every
 * input keeps its name, type, defaultValue and validation attributes, the
 * photo manager and legal sections keep their markup (incl. the
 * .crm-terms-doc/.crm-contract-body classes the contract viewer styles).
 */
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
  const [contract, acceptances, photosData] = await Promise.all([
    getBusinessContract(business.slug),
    getBusinessAcceptances(business.slug),
    getBusinessPhotos(business.slug)
  ]);
  const dateFormat = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : locale, { dateStyle: "medium" });

  return (
    <div className="ws-page">
      <PageHeaderCard subtitle={copy.settings.subtitle} title={copy.settings.title} />

      <section className="card ws-panel">
        <div className="card-body ws-panel__body">
          <div className="ws-panel__head">
            <h2 className="ws-panel__title">{copy.settings.subscription}</h2>
            <Link
              className="btn btn-secondary btn-sm"
              href={`/${locale}/business/plans?business=${business.slug}`}
            >
              {copy.menu.upgrade}
            </Link>
          </div>
          <div className="ws-sub-row">
            <div className="ws-fact">
              <span className="ws-fact-caption">{copy.settings.plan}</span>
              <strong className="ws-sub-plan">{(subscription?.plan ?? "free").toUpperCase()}</strong>
            </div>
            <div className="ws-fact">
              <span className="ws-fact-caption">{copy.settings.status}</span>
              <StatusPill variant={subscription?.status === "active" ? "success" : "pending"}>
                {copy.settings.subStatuses[subscription?.status ?? "active"]}
              </StatusPill>
            </div>
            {subscription?.renewsAt ? (
              <div className="ws-fact">
                <span className="ws-fact-caption">{copy.settings.renews}</span>
                <strong className="ws-num">{dateFormat.format(new Date(subscription.renewsAt))}</strong>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="card ws-panel">
        <div className="card-body ws-panel__body">
          <div className="ws-panel__head">
            <h2 className="ws-panel__title">{copy.settings.profile}</h2>
          </div>
          <form action={updateBusinessAction} className="ws-form">
            <input name="business" type="hidden" value={business.slug} />
            <div className="ws-form__grid">
              <label className="ws-field">
                <span className="ws-field__label">{copy.settings.name}</span>
                <IconField defaultValue={business.name} icon="storefront" name="name" type="text" />
              </label>
              <label className="ws-field">
                <span className="ws-field__label">{copy.settings.phone}</span>
                <IconField defaultValue={business.phone ?? ""} icon="call" name="phone" type="tel" />
              </label>
              <label className="ws-field">
                <span className="ws-field__label">{copy.settings.address}</span>
                <IconField defaultValue={business.address} icon="location" name="address" type="text" />
              </label>
              <label className="ws-field">
                <span className="ws-field__label">{copy.settings.district}</span>
                <IconField defaultValue={business.district} icon="location" name="district" type="text" />
              </label>
              <label className="ws-field">
                <span className="ws-field__label">{copy.settings.email}</span>
                <IconField defaultValue={extra.email ?? ""} icon="mail" name="email" type="email" />
              </label>
              <label className="ws-field">
                <span className="ws-field__label">{copy.settings.website}</span>
                <IconField defaultValue={extra.website ?? ""} icon="globe" name="website" type="url" />
              </label>
              <label className="ws-field">
                <span className="ws-field__label">{copy.settings.instagram}</span>
                <IconField defaultValue={extra.instagram ?? ""} icon="share" name="instagram" type="text" />
              </label>
              <label className="ws-field">
                <span className="ws-field__label">{copy.settings.telegram}</span>
                <IconField defaultValue={extra.telegram ?? ""} icon="send" name="telegram" type="text" />
              </label>
              <label className="ws-field">
                <span className="ws-field__label">{copy.settings.hours}</span>
                <IconField defaultValue={business.hours ?? ""} icon="schedule" name="hours" type="text" />
              </label>
              <label className="ws-field ws-field--span2">
                <span className="ws-field__label">{copy.settings.description}</span>
                <textarea
                  className="form-control"
                  defaultValue={business.description?.uz ?? ""}
                  name="description"
                  rows={3}
                />
              </label>
              <label className="ws-field">
                <span className="ws-field__label">{copy.settings.legalName}</span>
                <IconField defaultValue={extra.legalName ?? ""} icon="verified" name="legalName" type="text" />
              </label>
              <label className="ws-field">
                <span className="ws-field__label">{copy.settings.taxId}</span>
                <IconField
                  defaultValue={extra.taxId ?? ""}
                  icon="tag"
                  inputMode="numeric"
                  maxLength={9}
                  name="taxId"
                  pattern="\d{9}"
                  type="text"
                />
              </label>
            </div>
            <div className="ws-form__actions">
              <button className="btn btn-primary vm-cta" type="submit">
                {copy.settings.save}
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="card ws-panel">
        <div className="card-body ws-panel__body">
          <div className="ws-panel__head">
            <div>
              <h2 className="ws-panel__title">{copy.photos.title}</h2>
              <span className="ws-panel__hint">{copy.photos.subtitle}</span>
            </div>
          </div>
          <BusinessPhotoManager
            businessSlug={business.slug}
            copy={copy.photos}
            initialPhotos={
              photosData?.photos.map((photo) => ({
                id: photo.id,
                publicUrl: photo.publicUrl,
                moderationStatus: photo.moderationStatus,
                isCover: photo.isCover
              })) ?? []
            }
          />
        </div>
      </section>

      <section className="card ws-panel">
        <div className="card-body ws-panel__body">
          <div className="ws-panel__head">
            <h2 className="ws-panel__title">{copy.terms.contractTitle}</h2>
          </div>

          {contract ? (
            <>
              <dl className="ws-facts__body ws-facts__body--flush">
                <div className="ws-fact">
                  <dt>{copy.terms.contractNo}</dt>
                  <dd className="ws-num">{contract.contract.contractNo}</dd>
                </div>
                <div className="ws-fact">
                  <dt>{copy.terms.version}</dt>
                  <dd className="ws-num">{contract.contract.templateVersion}</dd>
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
            <p className="ws-empty__body">{copy.terms.noContract}</p>
          )}

          {acceptances && acceptances.acceptances.length > 0 ? (
            <div>
              <h3 className="ws-subhead">{copy.terms.accepted}</h3>
              <ul className="ws-mini-list">
                {acceptances.acceptances.map((document) => (
                  <li className="ws-mini-row" key={document.id}>
                    <div className="ws-mini-row__text">
                      <span className="ws-mini-row__title">
                        {document.kind.replace(/_/g, " ")} · {copy.terms.version} {document.version}
                      </span>
                    </div>
                    <span className="ws-mini-row__meta ws-num">
                      {new Date(document.acceptedAt).toLocaleDateString(locale, {
                        timeZone: "Asia/Tashkent"
                      })}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
