"use client";

import { UserButton, useAuth } from "@clerk/nextjs";
import type { Locale } from "@manzil/shared";
import { getUiCopy } from "@manzil/shared";

export function HeaderAuth({ locale }: { locale: Locale }) {
  const copy = getUiCopy(locale);
  const { isSignedIn } = useAuth();

  if (isSignedIn) {
    return <UserButton />;
  }

  return <a className="ghost-button" href={`/${locale}/sign-in`}>{copy.nav.signIn}</a>;
}
