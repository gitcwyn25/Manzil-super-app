import { SignUp } from "@clerk/nextjs";
import { localeOrDefault } from "@manzil/shared";
import type { Metadata } from "next";
import { BrandPanel, SplitAuthShell } from "../../../../components/vm/split-auth-shell";
import { vmClerkAppearance } from "../../../../lib/clerk-appearance";
import { routeMetadata } from "../../../../lib/seo";

function safeRedirect(locale: string, candidate?: string | string[]) {
  const fallback = `/${locale}/discover`;
  const value = Array.isArray(candidate) ? candidate[0] : candidate;
  return value?.startsWith(`/${locale}/`) && !value.startsWith("//") ? value : fallback;
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return routeMetadata("signUp", localeOrDefault(locale));
}

export default async function SignUpPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ redirect_url?: string | string[] }>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  const redirectUrl = safeRedirect(locale, query?.redirect_url);
  const redirectQuery = `?redirect_url=${encodeURIComponent(redirectUrl)}`;

  return (
    <SplitAuthShell panel={<BrandPanel wordmark="Manzil" />}>
      <div className="vm-auth-clerk">
        <SignUp
          appearance={vmClerkAppearance}
          routing="path"
          path={`/${locale}/sign-up`}
          signInUrl={`/${locale}/sign-in${redirectQuery}`}
          fallbackRedirectUrl={redirectUrl}
        />
      </div>
    </SplitAuthShell>
  );
}
