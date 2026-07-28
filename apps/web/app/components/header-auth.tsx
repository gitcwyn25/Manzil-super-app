"use client";

import { UserButton, useAuth } from "@clerk/nextjs";
import type { Locale } from "@manzil/shared";
import { getUiCopy } from "@manzil/shared";
import { getBusinessCopy } from "../lib/business-copy";

export function HeaderAuth({ locale }: { locale: Locale }) {
  const copy = getUiCopy(locale);
  const { isSignedIn } = useAuth();

  if (isSignedIn) {
    return <UserButton />;
  }

  return <a className="header-signin" href={`/${locale}/sign-in`}>{copy.nav.signIn}</a>;
}

/**
 * The one way from the consumer site into the workspace. Rendered only when
 * signed in: an anonymous visitor has no workspace, and /dashboard already
 * handles the signed-in-but-no-business case with a register prompt.
 */
export function WorkspaceSwitch({ locale }: { locale: Locale }) {
  const { isSignedIn } = useAuth();
  const copy = getBusinessCopy(locale);

  if (!isSignedIn) {
    return null;
  }

  return (
    <a className="header-switch" href={`/${locale}/dashboard`}>
      <span aria-hidden="true" className="header-switch__ring" />
      {copy.nav.dashboard}
    </a>
  );
}
