"use client";

import { defaultLocale, isLocale } from "@manzil/shared";
import { usePathname } from "next/navigation";
import { NOT_FOUND_COPY, StatusPage } from "./status-page";

/**
 * 404 body that speaks the visitor's language.
 *
 * `not-found.tsx` files never receive `params` — Next renders them outside the
 * matched segment's props — so the locale is read from the URL. `usePathname`
 * rather than `useParams` because for a path that matched no route at all
 * (`/ru/does-not-exist`) the params object can be empty while the pathname is
 * always intact.
 */
export function LocalizedNotFound() {
  const pathname = usePathname() ?? "";
  const [, first] = pathname.split("/");
  const locale = isLocale(first) ? first : defaultLocale;

  return <StatusPage copy={NOT_FOUND_COPY[locale]} locale={locale} />;
}
