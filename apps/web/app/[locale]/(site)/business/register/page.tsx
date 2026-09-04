import { auth } from "@clerk/nextjs/server";
import type { Locale } from "@manzil/shared";
import type { Metadata } from "next";
import { BusinessRegisterWizard } from "../../../../components/business/business-register-wizard";
import { PrimaryCta } from "../../../../components/vm/primary-cta";
import { BrandPanel, SplitAuthShell } from "../../../../components/vm/split-auth-shell";
import { getCategories } from "../../../../lib/api";
import { getBusinessApplication } from "../../../../lib/crm-api";
import { getCrmCopy } from "../../../../lib/crm-copy";
import { getRegistrationTerms } from "../../../../lib/legal-api";
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
 * Modern Multi-Step Business Onboarding.
 */
export default async function RegisterBusinessPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ application?: string }>;
}) {
  const { locale } = await params;
  const { application: applicationId } = await searchParams;
  const copy = getCrmCopy(locale);
  const { userId } = await auth();
  const registerPath = `/${locale}/business/register${applicationId ? `?application=${encodeURIComponent(applicationId)}` : ""}`;

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
          <PrimaryCta
            className="vm-auth-submit"
            href={`/${locale}/sign-in?redirect_url=${encodeURIComponent(registerPath)}`}
          >
            {copy.register.signIn}
          </PrimaryCta>
          <p className="vm-auth-switch">
            <span>{copy.register.signUpPrompt}</span>
            <a href={`/${locale}/sign-up?redirect_url=${encodeURIComponent(registerPath)}`}>
              {copy.register.signUpCta}
            </a>
          </p>
        </div>
      </SplitAuthShell>
    );
  }

  const [categories, { terms }] = await Promise.all([
    getCategories(),
    getRegistrationTerms(locale)
  ]);
  const application = applicationId ? await getBusinessApplication(applicationId) : null;
  const initialApplication = application?.status === "changes_requested" ? application : undefined;

  return (
    <SplitAuthShell panel={panel}>
      <div className="vm-auth-flow">
        <BusinessRegisterWizard
          categories={categories}
          locale={locale}
          terms={terms}
          initialApplication={initialApplication}
        />
      </div>
    </SplitAuthShell>
  );
}
