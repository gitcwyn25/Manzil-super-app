"use client";

import type { Locale } from "@manzil/shared";
import { useId, useMemo, useState } from "react";
import { createPackageAction, deletePackageAction, togglePackageAction } from "../../lib/crm-actions";
import type { CrmPackage } from "../../lib/crm-api";
import { formatNumber, formatUzs } from "../../lib/format";
import { IconField } from "../vm/icon-field";
import { Icon } from "../vm/icons";
import { PageHeaderCard } from "../vm/page-header-card";
import { StatusPill } from "../vm/status-pill";

/**
 * Services & pricing (workspace "packages" screen, task D3). Client component
 * because the Stitch layout adds two stateful affordances — the header CTA
 * toggling the create-service panel and the client-side search filter — while
 * everything else stays server-rendered markup hydrated in place.
 *
 * Honest-data contract (D7 + api-map): CrmPackage has NO image, NO duration,
 * and NO per-package booking aggregates, so the card carries none of those
 * slots (no placeholders pretending data exists) and the mock's "Most
 * popular" glass metric is omitted — only the derived active-services count
 * is real. The mock's edit button has no backend (no updatePackageAction /
 * PATCH fields endpoint), so it is not rendered; the live activate/deactivate
 * affordance the mock lacks is kept in the card footer instead.
 */

export type ServicesCopy = {
  title: string;
  subtitle: string;
  addNew: string;
  newTitle: string;
  name: string;
  description: string;
  price: string;
  submit: string;
  activate: string;
  deactivate: string;
  deleteAria: string;
  empty: string;
  noMatches: string;
  metricActive: string;
  searchLabel: string;
  searchPlaceholder: string;
  active: string;
  inactive: string;
};

function priceLabel(pkg: CrmPackage, locale: Locale): string {
  const amount = Number.parseFloat(pkg.price);
  if (!Number.isFinite(amount)) {
    return `${pkg.price} ${pkg.currency}`;
  }
  return pkg.currency === "UZS"
    ? formatUzs(Math.round(amount), locale)
    : `${formatNumber(Math.round(amount), locale)} ${pkg.currency}`;
}

function ServiceCard({
  pkg,
  locale,
  copy
}: {
  pkg: CrmPackage;
  locale: Locale;
  copy: ServicesCopy;
}) {
  return (
    <li className={pkg.isActive ? "card ws-svc-card" : "card ws-svc-card ws-svc-card--draft"}>
      <div className="card-body ws-svc-card__body">
        <div className="ws-svc-card__top">
          <StatusPill variant={pkg.isActive ? "success" : "pending"}>
            {pkg.isActive ? copy.active : copy.inactive}
          </StatusPill>
        </div>
        <div className="ws-svc-card__title-row">
          <h3 className="ws-svc-card__name">{pkg.name}</h3>
          <span className="ws-num ws-svc-card__price">{priceLabel(pkg, locale)}</span>
        </div>
        {pkg.description ? <p className="ws-svc-card__desc">{pkg.description}</p> : null}
        {/* Footer row is a <div> — never <footer> (shell-boundary contract). */}
        <div className="ws-svc-card__foot">
          <form action={togglePackageAction}>
            <input name="id" type="hidden" value={pkg.id} />
            <input name="isActive" type="hidden" value={pkg.isActive ? "false" : "true"} />
            <button className="ws-svc-toggle" type="submit">
              {pkg.isActive ? copy.deactivate : copy.activate}
            </button>
          </form>
          <form action={deletePackageAction}>
            <input name="id" type="hidden" value={pkg.id} />
            <button
              aria-label={`${copy.deleteAria}: ${pkg.name}`}
              className="ws-svc-icon-btn ws-svc-icon-btn--danger"
              type="submit"
            >
              <Icon name="trash" size={18} />
            </button>
          </form>
        </div>
      </div>
    </li>
  );
}

export function ServicesManager({
  locale,
  businessSlug,
  packages,
  copy
}: {
  locale: Locale;
  businessSlug: string;
  packages: CrmPackage[];
  copy: ServicesCopy;
}) {
  const panelId = useId();
  const searchId = useId();
  // First-run onboarding: with zero services the create panel starts open
  // (and is therefore fully server-rendered), matching the empty-state hint.
  const [panelOpen, setPanelOpen] = useState(packages.length === 0);
  const [query, setQuery] = useState("");

  const sorted = useMemo(
    () => [...packages].sort((a, b) => a.sortOrder - b.sortOrder),
    [packages]
  );

  const needle = query.trim().toLowerCase();
  const visible = needle
    ? sorted.filter(
        (pkg) =>
          pkg.name.toLowerCase().includes(needle) ||
          (pkg.description ?? "").toLowerCase().includes(needle)
      )
    : sorted;

  const activeCount = packages.filter((pkg) => pkg.isActive).length;

  return (
    <div className="ws-services">
      <PageHeaderCard
        action={
          <button
            aria-controls={panelId}
            aria-expanded={panelOpen}
            className="btn btn-primary vm-cta"
            onClick={() => setPanelOpen((open) => !open)}
            type="button"
          >
            <Icon name="plus" size={18} />
            {copy.addNew}
          </button>
        }
        subtitle={copy.subtitle}
        title={copy.title}
      />

      <section className="card ws-svc-panel" hidden={!panelOpen} id={panelId}>
        <div className="card-body ws-svc-panel__body">
          <h2 className="ws-svc-panel__title">{copy.newTitle}</h2>
          <form action={createPackageAction} className="ws-svc-form">
            <input name="business" type="hidden" value={businessSlug} />
            <div className="ws-svc-form__grid">
              <label className="ws-svc-field">
                <span className="ws-svc-field__label">{copy.name} *</span>
                <input className="form-control" maxLength={140} minLength={2} name="name" required type="text" />
              </label>
              <label className="ws-svc-field">
                <span className="ws-svc-field__label">{copy.price} *</span>
                <input className="form-control" min={0} name="price" required step="1000" type="number" />
              </label>
              <label className="ws-svc-field ws-svc-field--wide">
                <span className="ws-svc-field__label">{copy.description}</span>
                <input className="form-control" name="description" type="text" />
              </label>
            </div>
            <div className="ws-svc-form__actions">
              <button className="btn btn-primary vm-cta" type="submit">
                {copy.submit}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Metric + search bento. The mock's "Most popular" glass card needs
          per-package booking aggregates no API returns — omitted, not faked. */}
      <div className="ws-svc-bento">
        <section className="vm-glass ws-svc-metric">
          <div className="ws-svc-metric__head">
            <span className="ws-svc-metric__caption">{copy.metricActive}</span>
            <Icon className="ws-svc-metric__icon" name="tag" size={22} />
          </div>
          <strong className="ws-num ws-svc-metric__value">{formatNumber(activeCount, locale)}</strong>
        </section>
        <section className="card ws-svc-search">
          <div className="card-body ws-svc-search__body">
            <label className="ws-svc-search__label" htmlFor={searchId}>
              {copy.searchLabel}
            </label>
            <IconField
              icon="search"
              id={searchId}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={copy.searchPlaceholder}
              type="search"
              value={query}
            />
          </div>
        </section>
      </div>

      {packages.length === 0 ? (
        <section className="card ws-svc-empty">
          <p className="card-body ws-svc-empty__body">{copy.empty}</p>
        </section>
      ) : visible.length === 0 ? (
        <section className="card ws-svc-empty">
          <p className="card-body ws-svc-empty__body">{copy.noMatches}</p>
        </section>
      ) : (
        <ul className="ws-svc-grid">
          {visible.map((pkg) => (
            <ServiceCard copy={copy} key={pkg.id} locale={locale} pkg={pkg} />
          ))}
        </ul>
      )}
    </div>
  );
}
