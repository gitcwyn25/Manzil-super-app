import { auth } from "@clerk/nextjs/server";
import type { Locale } from "@manzil/shared";
import { getCategories } from "../../../../lib/api";
import { registerBusinessAction } from "../../../../lib/crm-actions";
import { getRegistrationTerms } from "../../../../lib/legal-api";
import { getCrmCopy } from "../../../../lib/crm-copy";
import { RegisterSubmit } from "../../../../components/crm/register-submit";
import { MutationForm } from "../../../../components/pxs/mutation-form";
import { IconField, IconSelect } from "../../../../components/vm/icon-field";
import { PrimaryCta } from "../../../../components/vm/primary-cta";
import { BrandPanel, SplitAuthShell } from "../../../../components/vm/split-auth-shell";
import type { Metadata } from "next";
import { routeMetadata } from "../../../../lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return routeMetadata("register", locale);
}

/**
 * Business registration in the Vibrant Marketplace split-auth composition:
 * sticky brand panel left (hidden below md), the real Clerk-gated, 13-field
 * onboarding form right. The mock's 4-field account form is a visual
 * reference only — every posted field, the terms consent block, and the
 * registration.spec.ts selectors (input names, details.crm-terms-doc,
 * .crm-terms-body, single button[type='submit']) are preserved verbatim.
 */
export default async function RegisterBusinessPage({
  params
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const copy = getCrmCopy(locale);
  const { userId } = await auth();

  const panel = (
    <BrandPanel
      tagline={copy.register.brandSubline}
      title={copy.register.brandTagline}
      wordmark={copy.register.brandWordmark}
    />
  );

  if (!userId) {
    return (
      <SplitAuthShell panel={panel}>
        <div className="vm-auth-flow">
          <div className="vm-auth-kicker d-md-none">
            <p className="vm-auth-kicker__brand">{copy.register.brandWordmark}</p>
            <p className="vm-auth-kicker__sub">{copy.register.mobileKicker}</p>
          </div>
          <header className="vm-auth-head">
            <h1 className="vm-auth-head__title">{copy.register.signInFirst}</h1>
            <p className="vm-auth-head__subtitle">{copy.register.signInText}</p>
          </header>
          <PrimaryCta className="vm-auth-submit" href={`/${locale}/sign-in`}>
            {copy.register.signIn}
          </PrimaryCta>
          <p className="vm-auth-switch">
            <span>{copy.register.signUpPrompt}</span>
            <a href={`/${locale}/sign-up`}>{copy.register.signUpCta}</a>
          </p>
        </div>
      </SplitAuthShell>
    );
  }

  const categories = await getCategories();
  const { terms } = await getRegistrationTerms(locale);

  return (
    <SplitAuthShell panel={panel}>
      <div className="vm-auth-flow">
        <div className="vm-auth-kicker d-md-none">
          <p className="vm-auth-kicker__brand">{copy.register.brandWordmark}</p>
          <p className="vm-auth-kicker__sub">{copy.register.mobileKicker}</p>
        </div>

        <header className="vm-auth-head">
          <h1 className="vm-auth-head__title">{copy.register.title}</h1>
          <p className="vm-auth-head__subtitle">{copy.register.subtitle}</p>
        </header>

        {/* PXS mutation system (Epic 17). This form is a *create*, and before
            this change a double-click produced two business rows — the most
            likely origin of the duplicate listing in the live catalogue.
            MutationForm supplies, for free and unforgettably: one request per
            intent (the button disables and the form refuses re-entry), an
            `Idempotency-Key` per submission attempt that survives a retry, a
            red toast carrying the API's own message on failure, and — the part
            that matters most on a thirteen-field form — the user's typing left
            intact when a save fails. */}
        <MutationForm
          action={registerBusinessAction}
          className="vm-auth-form"
          // The toast body is the API's own validation message, so the owner
          // is told which field is wrong rather than getting a generic line.
          errorTitle={copy.register.failedTitle}
          // Thirteen fields of typing is real work. This guards both exits:
          // the browser prompt for closing the tab, and a confirm dialog for
          // an in-app link — the one Next.js client navigation never fires
          // `beforeunload` for.
          guardUnsavedChanges
          locale={locale}
        >
          <input name="locale" type="hidden" value={locale} />

          <fieldset>
            <legend>{copy.register.basics}</legend>
            <label className="vm-field">
              <span className="vm-field__label">{copy.settings.name} *</span>
              <IconField
                icon="storefront"
                maxLength={120}
                minLength={2}
                name="name"
                placeholder={copy.register.namePlaceholder}
                required
                type="text"
              />
            </label>
            <label className="vm-field">
              <span className="vm-field__label">{copy.register.category} *</span>
              <IconSelect defaultValue="" icon="grid" name="categorySlug" required>
                <option disabled value="">
                  {copy.register.categoryPlaceholder}
                </option>
                {categories.map((category) => (
                  <option key={category.slug} value={category.slug}>
                    {category.name[locale] ?? category.name.uz}
                  </option>
                ))}
              </IconSelect>
            </label>
            <label className="vm-field">
              <span className="vm-field__label">{copy.settings.description} *</span>
              <textarea className="form-control" minLength={10} name="description" required rows={3} />
            </label>
            <label className="vm-field">
              <span className="vm-field__label">{copy.settings.address} *</span>
              <IconField icon="location" name="address" required type="text" />
            </label>
            <label className="vm-field">
              <span className="vm-field__label">{copy.settings.district} *</span>
              <IconField icon="location" name="district" required type="text" />
            </label>
          </fieldset>

          <fieldset>
            <legend>{copy.register.contactSection}</legend>
            <label className="vm-field">
              <span className="vm-field__label">{copy.settings.phone}</span>
              {/* The field accepted anything at all, so listings went live with
                  unreachable numbers that then render as a `tel:` link on the
                  public profile. Uzbek mobile/landline numbers are +998 plus
                  nine digits; spaces, dashes and parentheses are tolerated so
                  the pattern rejects wrong numbers, not wrong formatting. */}
              <IconField
                autoComplete="tel"
                icon="call"
                inputMode="tel"
                name="phone"
                pattern="^\+?998[\s\-()]*([0-9][\s\-()]*){9}$"
                placeholder="+998 90 123 45 67"
                title="+998 90 123 45 67"
                type="tel"
              />
            </label>
            <label className="vm-field">
              <span className="vm-field__label">{copy.settings.email}</span>
              <IconField icon="mail" name="email" type="email" />
            </label>
            <label className="vm-field">
              <span className="vm-field__label">{copy.settings.website}</span>
              <IconField icon="globe" name="website" placeholder="https://" type="url" />
            </label>
            <label className="vm-field">
              <span className="vm-field__label">{copy.settings.instagram}</span>
              <IconField icon="image" name="instagram" type="text" />
            </label>
            <label className="vm-field">
              <span className="vm-field__label">{copy.settings.telegram}</span>
              <IconField icon="send" name="telegram" type="text" />
            </label>
          </fieldset>

          <fieldset>
            <legend>{copy.register.legalSection}</legend>
            <p className="vm-field__hint">{copy.register.legalHint}</p>
            <label className="vm-field">
              <span className="vm-field__label">{copy.settings.legalName}</span>
              <IconField icon="verified" name="legalName" type="text" />
            </label>
            <label className="vm-field">
              <span className="vm-field__label">{copy.settings.taxId}</span>
              <IconField
                icon="percent"
                inputMode="numeric"
                maxLength={9}
                name="taxId"
                pattern="\d{9}"
                type="text"
              />
            </label>
          </fieldset>

          <fieldset>
            <legend>{copy.terms.section}</legend>
            <p className="vm-field__hint">{copy.terms.hint}</p>

            {terms ? (
              <>
                {/* Pinned to the version rendered here. If the terms are
                    republished while this page sits open, the API rejects the
                    submission rather than recording acceptance of text the user
                    never saw. */}
                <input name="acceptedTermsVersion" type="hidden" value={terms.version} />

                <details className="crm-terms-doc">
                  <summary>
                    {copy.terms.read} — {terms.title} ({copy.terms.version} {terms.version})
                  </summary>
                  <div className="crm-terms-body">{terms.body}</div>
                </details>
              </>
            ) : (
              <p className="vm-field__hint">{copy.terms.unavailable}</p>
            )}

            {/* Required and unchecked by default: consent has to be a deliberate
                act, so it is never pre-ticked. */}
            <label className="crm-consent">
              <input name="acceptedTerms" required type="checkbox" />
              <span>{copy.terms.checkbox}</span>
            </label>
          </fieldset>

          <RegisterSubmit
            label={copy.register.submit}
            locale={locale}
            pendingLabel={copy.register.submitting}
          />
        </MutationForm>
      </div>
    </SplitAuthShell>
  );
}
