import { SignUp } from "@clerk/nextjs";

export default async function SignUpPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <section className="section-block auth-section">
      <SignUp
        routing="path"
        path={`/${locale}/sign-up`}
        signInUrl={`/${locale}/sign-in`}
        fallbackRedirectUrl={`/${locale}/discover`}
      />
    </section>
  );
}
