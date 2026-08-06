import type { Locale } from "@manzil/shared";
import Link from "next/link";
import { IconField, IconSelect } from "../../../../components/vm/icon-field";
import { IconTile } from "../../../../components/vm/icon-tile";
import type { IconName } from "../../../../components/vm/icons";
import { PageHeaderCard } from "../../../../components/vm/page-header-card";
import { StatusPill } from "../../../../components/vm/status-pill";
import type { StatusPillVariant } from "../../../../components/vm/status-pill";
import { getMyBusinesses } from "../../../../lib/api";
import {
  createAnnouncementAction,
  deleteAnnouncementAction,
  setAnnouncementStatusAction
} from "../../../../lib/crm-actions";
import { getAnnouncements, getPackages } from "../../../../lib/crm-api";
import type { CrmAnnouncement } from "../../../../lib/crm-api";
import { getCrmCopy } from "../../../../lib/crm-copy";
import type { CrmCopy } from "../../../../lib/crm-copy";
import { formatNumber, formatRelativeTime, selectPlural } from "../../../../lib/format";

export const dynamic = "force-dynamic";

/**
 * Marketing & updates (Vibrant Marketplace, task D4). Fully server-rendered:
 * both composers and every row action are plain forms posting server actions,
 * so the whole screen works without JS.
 *
 * Honest-data contract (D7 + api-map): CrmAnnouncement has NO redemption
 * counts, NO discount codes, NO per-post views/likes, and NO media field —
 * campaign rows therefore show the real facts (title, percent, expiry,
 * status), timeline posts show text only, and the mock's image-attach button
 * is not rendered. The old table's publish/archive/delete and draft-save
 * affordances are folded into the rows/forms rather than dropped.
 */

const STATUS_VARIANTS: Record<CrmAnnouncement["status"], StatusPillVariant> = {
  draft: "pending",
  published: "success",
  archived: "neutral"
};

// Same static slug map the consumer screens use (Category/Business carry no
// icon field — api-map gap): campaign tiles show the business's own trade.
const CATEGORY_ICONS: Record<string, IconName> = {
  auto: "car",
  beauty: "scissors",
  cafes: "coffee",
  repairs: "wrench",
  restaurants: "utensils"
};

type AnnouncementsCopy = CrmCopy["announcements"];

function isExpired(item: CrmAnnouncement): boolean {
  if (!item.endsAt) return false;
  const ends = Date.parse(item.endsAt);
  return Number.isFinite(ends) && ends < Date.now();
}

// List order inside the campaigns panel: running discounts first, then
// drafts, then expired, then archived — newest-first within each group
// (Array#sort is stable, the list arrives pre-sorted by createdAt).
function campaignRank(item: CrmAnnouncement): number {
  if (item.status === "published") return isExpired(item) ? 2 : 0;
  return item.status === "draft" ? 1 : 3;
}

// "20% off • Expires in 3 days" from the fields that actually exist.
function campaignMeta(item: CrmAnnouncement, copy: AnnouncementsCopy, locale: Locale): string {
  const parts: string[] = [];

  if (item.discountPercent) {
    parts.push(copy.percentOffMeta.replace("{n}", formatNumber(item.discountPercent, locale)));
  }

  if (item.endsAt) {
    const ends = Date.parse(item.endsAt);
    if (Number.isFinite(ends)) {
      const diff = ends - Date.now();
      if (diff <= 0) {
        parts.push(copy.expired);
      } else {
        const days = Math.floor(diff / 86_400_000);
        parts.push(
          days === 0
            ? copy.expiresToday
            : selectPlural(days, copy.expiresIn, locale).replace("{n}", formatNumber(days, locale))
        );
      }
    }
  }

  return parts.join(" • ");
}

/** Publish/archive + delete, re-housed from the old management table. */
function ManageActions({ item, copy }: { item: CrmAnnouncement; copy: AnnouncementsCopy }) {
  return (
    <div className="ws-mkt-actions">
      {item.status !== "published" ? (
        <form action={setAnnouncementStatusAction}>
          <input name="id" type="hidden" value={item.id} />
          <input name="status" type="hidden" value="published" />
          <button className="ws-mkt-act" type="submit">
            {copy.publish}
          </button>
        </form>
      ) : (
        <form action={setAnnouncementStatusAction}>
          <input name="id" type="hidden" value={item.id} />
          <input name="status" type="hidden" value="archived" />
          <button className="ws-mkt-act" type="submit">
            {copy.archive}
          </button>
        </form>
      )}
      <form action={deleteAnnouncementAction}>
        <input name="id" type="hidden" value={item.id} />
        <button className="ws-mkt-act ws-mkt-act--danger" type="submit">
          {copy.remove}
        </button>
      </form>
    </div>
  );
}

export default async function AnnouncementsPage({
  params
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const copy = getCrmCopy(locale);
  const { businesses } = await getMyBusinesses();
  const business = businesses[0];

  if (!business) return null;

  const [announcementsData, packagesData] = await Promise.all([
    getAnnouncements(business.slug),
    getPackages(business.slug)
  ]);

  const announcements = announcementsData?.announcements ?? [];
  // Discounts attach to a service the owner actually offers right now.
  const activeServices = (packagesData?.packages ?? [])
    .filter((pkg) => pkg.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const newestFirst = [...announcements].sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
  );
  const campaigns = newestFirst
    .filter((item) => item.kind === "discount")
    .sort((a, b) => campaignRank(a) - campaignRank(b));
  const updates = newestFirst.filter((item) => item.kind !== "discount");

  const categoryIcon = CATEGORY_ICONS[business.categorySlug] ?? "storefront";
  const base = `/${locale}/dashboard`;
  const a = copy.announcements;

  return (
    <div className="ws-mkt">
      <PageHeaderCard subtitle={a.marketingSubtitle} title={a.marketingTitle} />

      <div className="ws-mkt-grid">
        <div className="ws-mkt-col">
          {/* Create discount */}
          <section className="card ws-mkt-action ws-mkt-action--discount vm-hover-group">
            <div className="card-body ws-mkt-action__body">
              <div className="ws-mkt-head">
                <IconTile accent="secondary" icon="percent" size="sm" />
                <h2 className="ws-mkt-title">{a.createDiscount}</h2>
              </div>
              {activeServices.length === 0 ? (
                <div className="ws-mkt-form">
                  <p className="ws-mkt-empty">{a.needService}</p>
                  <div className="ws-mkt-form__actions">
                    <Link className="btn btn-secondary btn-sm" href={`${base}/packages`}>
                      {copy.packages.addNew}
                    </Link>
                  </div>
                </div>
              ) : (
                <form action={createAnnouncementAction} className="ws-mkt-form">
                  <input name="business" type="hidden" value={business.slug} />
                  <input name="kind" type="hidden" value="discount" />
                  {/* The API has no service-reference field on announcements:
                      the chosen service's name IS the campaign title. */}
                  <label className="ws-mkt-field">
                    <span className="ws-mkt-field__label">{a.selectService}</span>
                    <IconSelect defaultValue="" icon="tag" name="title" required>
                      <option disabled hidden value="">
                        {a.selectService}
                      </option>
                      {activeServices.map((pkg) => (
                        <option key={pkg.id} value={pkg.name}>
                          {pkg.name}
                        </option>
                      ))}
                    </IconSelect>
                  </label>
                  <div className="ws-mkt-form__row">
                    <label className="ws-mkt-field">
                      <span className="ws-mkt-field__label">{a.discountPercent}</span>
                      <IconField
                        icon="percent"
                        inputMode="numeric"
                        max={100}
                        min={1}
                        name="discountPercent"
                        placeholder="20"
                        required
                        type="number"
                      />
                    </label>
                    <label className="ws-mkt-field">
                      <span className="ws-mkt-field__label">{a.durationDays}</span>
                      <IconField
                        icon="schedule"
                        inputMode="numeric"
                        max={365}
                        min={1}
                        name="durationDays"
                        placeholder="7"
                        required
                        type="number"
                      />
                    </label>
                  </div>
                  <div className="ws-mkt-form__actions">
                    <button className="btn btn-primary vm-cta" name="status" type="submit" value="published">
                      {a.publishDiscount}
                    </button>
                    <button className="btn btn-secondary btn-sm" name="status" type="submit" value="draft">
                      {a.saveDraft}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </section>

          {/* Post an update */}
          <section className="card ws-mkt-action ws-mkt-action--update vm-hover-group">
            <div className="card-body ws-mkt-action__body">
              <div className="ws-mkt-head">
                <IconTile accent="primary" icon="campaign" size="sm" />
                <h2 className="ws-mkt-title">{a.composerTitle}</h2>
              </div>
              <form action={createAnnouncementAction} className="ws-mkt-form">
                <input name="business" type="hidden" value={business.slug} />
                <input name="kind" type="hidden" value="news" />
                {/* Title is derived server-side from the text — the approved
                    screen has no title field. */}
                <label className="ws-mkt-field">
                  <span className="visually-hidden">{a.formBody}</span>
                  <textarea
                    className="form-control ws-mkt-textarea"
                    maxLength={5000}
                    minLength={3}
                    name="body"
                    placeholder={a.composerPlaceholder}
                    required
                    rows={4}
                  />
                </label>
                {/* No image-attach button: announcements have no media field (D7). */}
                <div className="ws-mkt-composer-foot">
                  <button className="btn btn-secondary btn-sm" name="status" type="submit" value="draft">
                    {a.saveDraft}
                  </button>
                  <button className="ws-mkt-publish" name="status" type="submit" value="published">
                    {a.submit}
                  </button>
                </div>
              </form>
            </div>
          </section>
        </div>

        <div className="ws-mkt-col">
          {/* Discount campaigns */}
          <section className="card ws-mkt-panel">
            <div className="card-body ws-mkt-panel__body">
              <div className="ws-mkt-head">
                <h2 className="ws-mkt-title">{a.campaignsTitle}</h2>
              </div>
              {campaigns.length === 0 ? (
                <p className="ws-mkt-empty">{a.emptyCampaigns}</p>
              ) : (
                <ul className="ws-camp-list">
                  {campaigns.map((item) => {
                    const meta = campaignMeta(item, a, locale);
                    const done =
                      item.status === "archived" || (item.status === "published" && isExpired(item));
                    const rowClass = [
                      "ws-camp",
                      "vm-hover-group",
                      item.status === "draft" ? "ws-camp--draft" : null,
                      done ? "ws-camp--done" : null
                    ]
                      .filter(Boolean)
                      .join(" ");
                    return (
                      <li className={rowClass} key={item.id}>
                        <div className="ws-camp__main">
                          <IconTile accent="tertiary" icon={categoryIcon} size="md" />
                          <div className="ws-camp__text">
                            <h3 className="ws-camp__title">{item.title}</h3>
                            {meta ? <span className="ws-camp__meta">{meta}</span> : null}
                          </div>
                        </div>
                        <div className="ws-camp__end">
                          <StatusPill variant={STATUS_VARIANTS[item.status]}>
                            {a.statuses[item.status]}
                          </StatusPill>
                          <ManageActions copy={a} item={item} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>

          {/* Recent updates timeline */}
          <section className="card ws-mkt-panel">
            <div className="card-body ws-mkt-panel__body">
              <div className="ws-mkt-head">
                <h2 className="ws-mkt-title">{a.updatesTitle}</h2>
              </div>
              {updates.length === 0 ? (
                <p className="ws-mkt-empty">{a.emptyUpdates}</p>
              ) : (
                <ol className="ws-tl">
                  {updates.map((item, index) => {
                    const relative = formatRelativeTime(item.createdAt, locale);
                    const timeLabel =
                      item.status === "published" && relative
                        ? a.postedAt.replace("{relative}", relative)
                        : relative;
                    // Composer-derived titles are a collapsed prefix of the
                    // body; only legacy stand-alone titles render separately.
                    const showTitle = !item.body.replace(/\s+/g, " ").startsWith(item.title);
                    return (
                      <li
                        className={index === 0 ? "ws-tl-item ws-tl-item--new" : "ws-tl-item"}
                        key={item.id}
                      >
                        <div className="ws-tl-item__head">
                          <span className="ws-tl-item__time">{timeLabel}</span>
                          <span className="ws-tl-item__chips">
                            {item.status !== "published" ? (
                              <StatusPill variant={STATUS_VARIANTS[item.status]}>
                                {a.statuses[item.status]}
                              </StatusPill>
                            ) : null}
                            <StatusPill kind variant="neutral">
                              {a.kinds[item.kind]}
                            </StatusPill>
                          </span>
                        </div>
                        {showTitle ? <strong className="ws-tl-item__title">{item.title}</strong> : null}
                        <p className="ws-tl-item__body">{item.body}</p>
                        {/* No media strip, no views/likes: none exist in the API (D7). */}
                        <div className="ws-tl-item__foot">
                          <ManageActions copy={a} item={item} />
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
