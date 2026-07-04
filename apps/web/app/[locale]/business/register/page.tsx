import { auth } from "@clerk/nextjs/server";
import type { Locale } from "@manzil/shared";
import { getCategories } from "../../../lib/api";
import { registerBusinessAction } from "../../../lib/crm-actions";
import { getCrmCopy } from "../../../lib/crm-copy";

export const dynamic = "force-dynamic";

export default async function RegisterBusinessPage({
  params
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const copy = getCrmCopy(locale);
  const { userId } = await auth();

  if (!userId) {
    return (
      <section className="crm-auth-panel">
        <h1>{copy.register.signInFirst}</h1>
        <p>{copy.register.signInText}</p>
        <a className="bz-btn-primary" href={`/${locale}/sign-in`}>{copy.register.signIn}</a>
      </section>
    );
  }

  const categories = await getCategories();

  return (
    <section className="crm-register">
      <header className="crm-register-head">
        <h1>{copy.register.title}</h1>
        <p>{copy.register.subtitle}</p>
      </header>

      <form action={registerBusinessAction} className="crm-form">
        <input name="locale" type="hidden" value={locale} />

        <fieldset>
          <legend>{copy.register.basics}</legend>
          <div className="crm-form-grid">
            <label>
              <span>{copy.settings.name} *</span>
              <input maxLength={120} minLength={2} name="name" required type="text" />
            </label>
            <label>
              <span>{copy.register.category} *</span>
              <select defaultValue="" name="categorySlug" required>
                <option disabled value="" />
                {categories.map((category) => (
                  <option key={category.slug} value={category.slug}>
                    {category.name[locale] ?? category.name.uz}
                  </option>
                ))}
              </select>
            </label>
            <label className="span2">
              <span>{copy.settings.description} *</span>
              <textarea minLength={10} name="description" required rows={3} />
            </label>
            <label>
              <span>{copy.settings.address} *</span>
              <input name="address" required type="text" />
            </label>
            <label>
              <span>{copy.settings.district} *</span>
              <input name="district" required type="text" />
            </label>
          </div>
        </fieldset>

        <fieldset>
          <legend>{copy.register.contactSection}</legend>
          <div className="crm-form-grid">
            <label>
              <span>{copy.settings.phone}</span>
              <input name="phone" placeholder="+998" type="tel" />
            </label>
            <label>
              <span>{copy.settings.email}</span>
              <input name="email" type="email" />
            </label>
            <label>
              <span>{copy.settings.website}</span>
              <input name="website" placeholder="https://" type="url" />
            </label>
            <label>
              <span>{copy.settings.instagram}</span>
              <input name="instagram" type="text" />
            </label>
            <label>
              <span>{copy.settings.telegram}</span>
              <input name="telegram" type="text" />
            </label>
          </div>
        </fieldset>

        <fieldset>
          <legend>{copy.register.legalSection}</legend>
          <p className="crm-hint">{copy.register.legalHint}</p>
          <div className="crm-form-grid">
            <label>
              <span>{copy.settings.legalName}</span>
              <input name="legalName" type="text" />
            </label>
            <label>
              <span>{copy.settings.taxId}</span>
              <input inputMode="numeric" maxLength={9} name="taxId" pattern="\d{9}" type="text" />
            </label>
          </div>
        </fieldset>

        <button className="bz-btn-primary crm-submit" type="submit">
          {copy.register.submit}
        </button>
      </form>
    </section>
  );
}
