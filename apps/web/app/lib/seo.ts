import { defaultLocale, locales, type Locale } from "@manzil/shared";
import type { Metadata } from "next";

/**
 * One source of truth for canonical URLs, hreflang, and per-route titles and
 * descriptions.
 *
 * Before this module the root layout carried a single hard-coded title (the
 * Manzil Business one) and every route inherited it, so the consumer home page
 * introduced itself as the business product and no page had a canonical, an
 * hreflang set, or an Open Graph card. Titles now live next to the route they
 * describe, in all three shipped locales, and canonical/hreflang are derived
 * from the same locale-relative path so they can never drift apart.
 */

/** Last-resort origin: the intended custom production host. Better a
 *  slightly stale absolute URL than a relative canonical or a localhost one. */
const PRODUCTION_ORIGIN = "https://manzilgroup.uz";

/**
 * Deployment origin for canonicals, hreflang and OG URLs.
 *
 * `NEXT_PUBLIC_SITE_URL` is the explicit production origin and should be set
 * to `https://manzilgroup.uz` in every deployment environment. The older
 * `NEXT_PUBLIC_APP_URL` remains useful for local `.env.local` development, but
 * must not decide production canonicals: it may contain localhost or an old
 * Vercel alias. This keeps canonical, hreflang, sitemap and OG URLs on the
 * intended public host even when Vercel's project alias changes.
 */
function resolveSiteUrl(): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
  if (siteUrl) return siteUrl;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/+$/, "");
  if (appUrl && process.env.NODE_ENV !== "production") {
    return appUrl;
  }

  return PRODUCTION_ORIGIN;
}

export const SITE_URL = resolveSiteUrl();

export const SITE_NAME = "Manzil";

/** Entity-consistent naming for structured data and AI crawlers — matches
 *  Appendix C of the product bible (Discover · Plan · Experience, Gurman). */
export const BRAND = {
  name: "Manzil",
  aiName: "Gurman",
  city: "Tashkent",
  country: "UZ"
} as const;

export const PUBLIC_CONTACT = {
  // Already published in the site footer; nothing new is disclosed here.
  telephone: "+998885861124",
  email: "tursunovsunnatilla223@gmail.com",
  telegram: "https://t.me/manzilbiz_bot"
} as const;

export function absoluteUrl(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Canonical URL for a locale-relative path ("" → "/uz", "/discover" → "/uz/discover"). */
export function canonicalUrl(locale: Locale, path = ""): string {
  return absoluteUrl(`/${locale}${path}`);
}

/**
 * hreflang map. Every locale-prefixed route exists in all three languages at
 * the same path, so the alternates are derivable rather than hand-listed.
 * `x-default` points at the Uzbek route: Manzil is Uzbek-first and there is no
 * language-selector landing page to point it at.
 */
export function languageAlternates(path = ""): Record<string, string> {
  const map: Record<string, string> = {};
  for (const locale of locales) {
    map[locale] = absoluteUrl(`/${locale}${path}`);
  }
  map["x-default"] = absoluteUrl(`/${defaultLocale}${path}`);
  return map;
}

type Trio = Record<Locale, string>;

export type RouteSeo = {
  /** Locale-relative path, "" for the home page. */
  path: string;
  title: Trio;
  description: Trio;
  /** Auth-gated or personal surfaces: real page, but nothing to index. */
  noIndex?: boolean;
  /** Skip the root layout's `%s | Manzil` template — set on the titles that
   *  already name the brand, so they do not read "… | Manzil | Manzil". */
  absoluteTitle?: boolean;
};

/**
 * Per-route copy. Written per locale rather than machine-translated: the
 * description is the snippet a searcher reads, and a mistranslated one costs
 * more than a missing one.
 */
export const ROUTE_SEO = {
  home: {
    path: "",
    absoluteTitle: true,
    title: {
      uz: "Manzil — Toshkentdagi joylarni Gurman AI bilan toping",
      ru: "Manzil — места Ташкента вместе с Gurman AI",
      en: "Manzil — discover Tashkent with Gurman AI"
    },
    description: {
      uz: "Toshkentdagi kafe, restoran va xizmatlarni haqiqiy sharhlar asosida toping. Gurman AI so'rovingizga qarab katalogdagi real joylarni tavsiya qiladi.",
      ru: "Находите кафе, рестораны и услуги Ташкента по реальным отзывам. Gurman AI подбирает настоящие места из каталога под ваш запрос.",
      en: "Find cafés, restaurants and services in Tashkent through real reviews. Gurman AI recommends real listed places based on what you ask for."
    }
  },
  discover: {
    path: "/discover",
    title: {
      uz: "Kashfiyot — Toshkentdagi joylarni qidiring",
      ru: "Поиск — места Ташкента",
      en: "Discover — search places in Tashkent"
    },
    description: {
      uz: "Kategoriya, tuman va reyting bo'yicha filtrlab Toshkentdagi joylarni qidiring. Har bir kartochka katalogdagi real biznes.",
      ru: "Ищите места в Ташкенте с фильтрами по категории, району и рейтингу. Каждая карточка — реальный бизнес из каталога.",
      en: "Search places in Tashkent with filters for category, district and rating. Every card is a real listed business."
    }
  },
  concierge: {
    path: "/concierge",
    title: {
      uz: "Gurman AI Concierge — tabiiy tilda so'rang",
      ru: "Gurman AI Concierge — спросите естественно",
      en: "Gurman AI Concierge — ask naturally"
    },
    description: {
      uz: "Nima izlayotganingizni o'z so'zlaringiz bilan yozing. Gurman AI katalogdagi real joylarni haqiqiy sharhlar asosida tavsiya qiladi.",
      ru: "Опишите, что ищете, своими словами. Gurman AI подбирает реальные места из каталога по настоящим отзывам.",
      en: "Describe what you are looking for in your own words. Gurman AI recommends real listed places grounded in real reviews."
    }
  },
  gurman: {
    path: "/gurman",
    absoluteTitle: true,
    title: {
      uz: "Gurman AI — Toshkentdagi keyingi rejangiz",
      ru: "Gurman AI — ваш следующий план в Ташкенте",
      en: "Gurman AI — plan your next experience in Tashkent"
    },
    description: {
      uz: "Gurman AI ga istagingizni ayting. U Manzil katalogidagi haqiqiy joylarni saralab, nima uchun mosligini tushuntiradi.",
      ru: "Расскажите Gurman AI о своём плане. Он подберёт реальные места из каталога Manzil и объяснит свой выбор.",
      en: "Tell Gurman AI what you want to do. It surfaces real places from the Manzil catalogue and explains why they fit."
    }
  },
  lists: {
    path: "/lists",
    title: {
      uz: "Jamiyat ro'yxatlari — odamlar yig'gan joylar",
      ru: "Списки сообщества — подборки мест",
      en: "Community lists — places curated by people"
    },
    description: {
      uz: "Toshkent aholisi tuzgan joy ro'yxatlari: kofe, kechki ovqat, ishlash uchun joylar.",
      ru: "Подборки мест от жителей Ташкента: кофе, ужин, места для работы.",
      en: "Place collections put together by people in Tashkent: coffee, dinner, places to work."
    }
  },
  occasions: {
    path: "/occasions",
    title: {
      uz: "Voqealar — tug'ilgan kun, uchrashuv, oilaviy kechki ovqat",
      ru: "Поводы — день рождения, свидание, семейный ужин",
      en: "Occasions — birthdays, dates, family dinners"
    },
    description: {
      uz: "Voqeaga qarab tanlangan joylar: tug'ilgan kun, uchrashuv, oilaviy kechki ovqat va boshqalar.",
      ru: "Места, подобранные под повод: день рождения, свидание, семейный ужин и другое.",
      en: "Places grouped by occasion: birthdays, dates, family dinners and more."
    }
  },
  business: {
    path: "/business",
    absoluteTitle: true,
    title: {
      uz: "Manzil Business — biznesingizni Manzil'da boshqaring",
      ru: "Manzil Business — управляйте бизнесом в Manzil",
      en: "Manzil Business — manage your business on Manzil"
    },
    description: {
      uz: "Listingingizni tasdiqlang, sharhlarga javob bering va Manzil'dagi obro'ingizni boshqaring.",
      ru: "Подтвердите карточку, отвечайте на отзывы и управляйте репутацией в Manzil.",
      en: "Claim your listing, reply to reviews and manage your reputation on Manzil."
    }
  },
  pricing: {
    path: "/business/pricing",
    title: {
      uz: "Tariflar — Free, Pro, Max",
      ru: "Тарифы — Free, Pro, Max",
      en: "Pricing — Free, Pro, Max"
    },
    description: {
      uz: "Manzil Business tariflari va har biriga kiradigan imkoniyatlar.",
      ru: "Тарифы Manzil Business и что входит в каждый из них.",
      en: "Manzil Business plans and what each one includes."
    }
  },
  register: {
    path: "/business/register",
    noIndex: true,
    title: {
      uz: "Biznesni ro'yxatdan o'tkazish",
      ru: "Регистрация бизнеса",
      en: "Register your business"
    },
    description: {
      uz: "Biznesingizni Manzil katalogiga qo'shing va profilini boshqaring.",
      ru: "Добавьте бизнес в каталог Manzil и управляйте его профилем.",
      en: "Add your business to the Manzil directory and manage its profile."
    }
  },
  registerPhotos: {
    path: "/business/register/photos",
    noIndex: true,
    title: {
      uz: "Biznes fotosuratlari",
      ru: "Фотографии бизнеса",
      en: "Business photos"
    },
    description: {
      uz: "Biznes profili uchun fotosuratlarni yuklang.",
      ru: "Загрузите фотографии для профиля бизнеса.",
      en: "Upload photos for your business profile."
    }
  },
  plans: {
    path: "/business/plans",
    noIndex: true,
    title: {
      uz: "Tarifni tanlash",
      ru: "Выбор тарифа",
      en: "Choose a plan"
    },
    description: {
      uz: "Biznesingiz uchun Manzil Business tarifini tanlang.",
      ru: "Выберите тариф Manzil Business для вашего бизнеса.",
      en: "Pick the Manzil Business plan for your business."
    }
  },
  profile: {
    path: "/profile",
    noIndex: true,
    title: {
      uz: "Profilingiz",
      ru: "Ваш профиль",
      en: "Your profile"
    },
    description: {
      uz: "Saqlangan joylar, yutuqlar va kuzatuvlaringiz.",
      ru: "Сохранённые места, достижения и подписки.",
      en: "Your saved places, achievements and follows."
    }
  },
  signIn: {
    path: "/sign-in",
    noIndex: true,
    title: { uz: "Kirish", ru: "Вход", en: "Sign in" },
    description: {
      uz: "Manzil hisobingizga kiring.",
      ru: "Войдите в аккаунт Manzil.",
      en: "Sign in to your Manzil account."
    }
  },
  signUp: {
    path: "/sign-up",
    noIndex: true,
    title: { uz: "Ro'yxatdan o'tish", ru: "Регистрация", en: "Sign up" },
    description: {
      uz: "Manzil hisobini yarating.",
      ru: "Создайте аккаунт Manzil.",
      en: "Create a Manzil account."
    }
  },
  notFound: {
    path: "",
    noIndex: true,
    title: {
      uz: "Sahifa topilmadi",
      ru: "Страница не найдена",
      en: "Page not found"
    },
    description: {
      uz: "Bu manzilda sahifa yo'q.",
      ru: "По этому адресу страницы нет.",
      en: "There is no page at this address."
    }
  }
} satisfies Record<string, RouteSeo>;

export type RouteKey = keyof typeof ROUTE_SEO;

/**
 * Short breadcrumb labels — the nav name, not the SEO title. Kept identical to
 * the wording in `@manzil/shared`'s `getUiCopy().nav` so the breadcrumb trail,
 * the header link and the schema.org node all name the same thing (the
 * cross-locale glossary rule in the launch checklist).
 */
export const CRUMB_LABEL = {
  home: { uz: "Bosh sahifa", ru: "Главная", en: "Home" },
  discover: { uz: "Kashfiyot", ru: "Поиск", en: "Discover" },
  concierge: { uz: "Concierge", ru: "Concierge", en: "Concierge" },
  gurman: { uz: "Gurman AI", ru: "Gurman AI", en: "Gurman AI" },
  lists: { uz: "Ro'yxatlar", ru: "Списки", en: "Lists" },
  occasions: { uz: "Voqealar", ru: "Поводы", en: "Occasions" },
  business: { uz: "Biznes", ru: "Бизнес", en: "Business" },
  pricing: { uz: "Tariflar", ru: "Тарифы", en: "Pricing" }
} satisfies Partial<Record<RouteKey, Trio>>;

export type CrumbKey = keyof typeof CRUMB_LABEL;

/**
 * Default social card: the 1200×630 image generated by
 * `app/opengraph-image.tsx`, referenced explicitly.
 *
 * Next only auto-attaches a file-based `opengraph-image` to segments that do
 * not declare their own `openGraph` object. Every route here declares one (for
 * og:url, og:locale and the alternates), which suppressed the automatic
 * attachment — verified in the built HTML, where `/uz` carried no `og:image`
 * at all. Naming it explicitly is deterministic and survives that merge rule.
 */
const DEFAULT_OG_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "Manzil — Tashkent business directory with the Gurman AI concierge"
};

/** OG locale tags. Uzbek Latin as used on the site is uz_UZ. */
const OG_LOCALE: Record<Locale, string> = {
  uz: "uz_UZ",
  ru: "ru_RU",
  en: "en_US"
};

export type PageMetadataInput = {
  locale: Locale;
  /** Locale-relative path; "" for the locale home. */
  path?: string;
  title: string;
  description: string;
  noIndex?: boolean;
  /** Absolute or root-relative image URLs. Omitted → the site-wide
   *  app/opengraph-image is inherited. */
  images?: string[];
  type?: "website" | "article" | "profile";
  /** Bypass the root `%s | Manzil` title template. */
  absoluteTitle?: boolean;
};

/**
 * Builds the full head for a route: canonical, hreflang, Open Graph, Twitter
 * card, robots directives. Every page-level `generateMetadata` goes through
 * here so no route can ship with a canonical but no hreflang, or vice versa.
 */
export function pageMetadata({
  locale,
  path = "",
  title,
  description,
  noIndex,
  images,
  type = "website",
  absoluteTitle
}: PageMetadataInput): Metadata {
  const url = canonicalUrl(locale, path);

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    alternates: {
      canonical: url,
      languages: languageAlternates(path)
    },
    // Spread rather than `robots: undefined`: an explicit undefined *overrides*
    // the root layout's directives (max-image-preview:large, max-snippet:-1),
    // silently dropping them from every page that is not noindex.
    ...(noIndex
      ? { robots: { index: false, follow: false, googleBot: { index: false, follow: false } } }
      : {}),
    openGraph: {
      type,
      url,
      siteName: SITE_NAME,
      // Always the plain string: og:title carries no template, so a card
      // should read the same as the tab regardless of `absoluteTitle`.
      title: absoluteTitle ? title : `${title} | ${SITE_NAME}`,
      description,
      locale: OG_LOCALE[locale],
      alternateLocale: locales.filter((item) => item !== locale).map((item) => OG_LOCALE[item]),
      images: images ?? [DEFAULT_OG_IMAGE]
    },
    twitter: {
      card: "summary_large_image",
      title: absoluteTitle ? title : `${title} | ${SITE_NAME}`,
      description,
      images: images ?? [DEFAULT_OG_IMAGE.url]
    }
  };
}

/** Convenience wrapper for the static routes described by ROUTE_SEO. */
export function routeMetadata(key: RouteKey, locale: Locale): Metadata {
  const route = ROUTE_SEO[key] as RouteSeo;
  return pageMetadata({
    locale,
    path: route.path,
    title: route.title[locale],
    description: route.description[locale],
    noIndex: route.noIndex,
    absoluteTitle: route.absoluteTitle
  });
}
