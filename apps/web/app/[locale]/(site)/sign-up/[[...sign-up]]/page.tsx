import { SignUp } from "@clerk/nextjs";
import { localeOrDefault } from "@manzil/shared";
import type { Metadata } from "next";
import { BrandPanel, SplitAuthShell } from "../../../../components/vm/split-auth-shell";
import { vmClerkAppearance } from "../../../../lib/clerk-appearance";
import { routeMetadata } from "../../../../lib/seo";

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return routeMetadata("signUp", localeOrDefault(locale));
}

/**
 * Consumer sign-up in the Vibrant Marketplace split-auth composition: the
 * Clerk widget (appearance synced to the VM tokens) in the form column, the
 * brand panel left (hidden below md).
 */
export default async function SignUpPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <SplitAuthShell panel={<BrandPanel wordmark="Manzil" />}>
      <div className="vm-auth-clerk">
        <SignUp
          appearance={vmClerkAppearance}
          routing="path"
          path={`/${locale}/sign-up`}
          signInUrl={`/${locale}/sign-in`}
          fallbackRedirectUrl={`/${locale}/discover`}
        />
      </div>
    </SplitAuthShell>
  );
}
