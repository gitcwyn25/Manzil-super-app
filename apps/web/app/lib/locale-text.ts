import type { Locale, LocalizedText } from "@manzil/shared";

export function pickLocalized(text: LocalizedText, locale: Locale) {
  return text[locale] ?? text.uz;
}

export function formatCount(count: number) {
  return new Intl.NumberFormat("en-US").format(count);
}
