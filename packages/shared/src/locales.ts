export const locales = ["uz", "ru", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "uz";

export function isLocale(value: string | undefined): value is Locale {
  return Boolean(value && locales.includes(value as Locale));
}

export function localeOrDefault(value: string | undefined): Locale {
  return isLocale(value) ? value : defaultLocale;
}

export type LocalizedText = {
  uz: string;
  ru?: string;
  en?: string;
};

export function localize(text: LocalizedText, locale: Locale): string {
  return text[locale] ?? text.ru ?? text.en ?? text.uz;
}
