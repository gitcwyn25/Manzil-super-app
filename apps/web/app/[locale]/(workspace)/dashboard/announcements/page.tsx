import type { Locale } from "@manzil/shared";
import { getMyBusinesses } from "../../../../lib/api";
import {
  createAnnouncementAction,
  deleteAnnouncementAction,
  setAnnouncementStatusAction
} from "../../../../lib/crm-actions";
import { getAnnouncements } from "../../../../lib/crm-api";
import { getCrmCopy } from "../../../../lib/crm-copy";

export const dynamic = "force-dynamic";

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

  const data = await getAnnouncements(business.slug);
  const announcements = data?.announcements ?? [];
  const dateFormat = new Intl.DateTimeFormat(locale === "en" ? "en-GB" : locale, { dateStyle: "medium" });

  return (
    <>
      <header className="crm-page-head">
        <div>
          <h1>{copy.announcements.title}</h1>
          <p>{copy.announcements.subtitle}</p>
        </div>
      </header>

      <section className="crm-panel">
        <h2>{copy.announcements.newTitle}</h2>
        <form action={createAnnouncementAction} className="crm-form compact">
          <input name="business" type="hidden" value={business.slug} />
          <div className="crm-form-grid">
            <label>
              <span>{copy.announcements.kind}</span>
              <select defaultValue="news" name="kind">
                <option value="news">{copy.announcements.kinds.news}</option>
                <option value="discount">{copy.announcements.kinds.discount}</option>
                <option value="broadcast">{copy.announcements.kinds.broadcast}</option>
              </select>
            </label>
            <label>
              <span>{copy.announcements.formTitle} *</span>
              <input maxLength={160} minLength={3} name="title" required type="text" />
            </label>
            <label className="span2">
              <span>{copy.announcements.formBody} *</span>
              <textarea minLength={3} name="body" required rows={3} />
            </label>
            <label>
              <span>{copy.announcements.discountPercent}</span>
              <input max={99} min={1} name="discountPercent" type="number" />
            </label>
            <label>
              <span>{copy.announcements.startsAt}</span>
              <input name="startsAt" type="date" />
            </label>
            <label>
              <span>{copy.announcements.endsAt}</span>
              <input name="endsAt" type="date" />
            </label>
          </div>
          <div className="crm-form-actions">
            <button className="bz-btn-primary" name="status" type="submit" value="published">
              {copy.announcements.submit}
            </button>
            <button className="bz-btn-ghost" name="status" type="submit" value="draft">
              {copy.announcements.saveDraft}
            </button>
          </div>
        </form>
      </section>

      <section className="crm-panel">
        <table className="crm-table">
          <thead>
            <tr>
              <th>{copy.announcements.table.title}</th>
              <th>{copy.announcements.table.kind}</th>
              <th>{copy.announcements.table.status}</th>
              <th>{copy.announcements.table.date}</th>
              <th>{copy.announcements.table.actions}</th>
            </tr>
          </thead>
          <tbody>
            {announcements.map((item) => (
              <tr key={item.id}>
                <td>
                  <strong>{item.title}</strong>
                  {item.kind === "discount" && item.discountPercent ? (
                    <span className="crm-chip crm-chip-gold">-{item.discountPercent}%</span>
                  ) : null}
                </td>
                <td>{copy.announcements.kinds[item.kind]}</td>
                <td>
                  <span className={`crm-chip crm-chip-${item.status === "published" ? "ok" : item.status === "draft" ? "warn" : "muted"}`}>
                    {copy.announcements.statuses[item.status]}
                  </span>
                </td>
                <td>{dateFormat.format(new Date(item.createdAt))}</td>
                <td>
                  <div className="crm-row-actions">
                    {item.status !== "published" ? (
                      <form action={setAnnouncementStatusAction}>
                        <input name="id" type="hidden" value={item.id} />
                        <input name="status" type="hidden" value="published" />
                        <button type="submit">{copy.announcements.publish}</button>
                      </form>
                    ) : (
                      <form action={setAnnouncementStatusAction}>
                        <input name="id" type="hidden" value={item.id} />
                        <input name="status" type="hidden" value="archived" />
                        <button type="submit">{copy.announcements.archive}</button>
                      </form>
                    )}
                    <form action={deleteAnnouncementAction}>
                      <input name="id" type="hidden" value={item.id} />
                      <button className="danger" type="submit">{copy.announcements.remove}</button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {announcements.length === 0 ? (
              <tr>
                <td className="crm-empty" colSpan={5}>{copy.announcements.empty}</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </>
  );
}
