import type { Locale } from "@manzil/shared";

/**
 * Sample content for the audience bento mockups.
 *
 * These mockups previously rendered grey placeholder bars and English strings
 * ("Business name", "Owner reply", "Friend") on a trilingual Uzbek site, which
 * made a shipping product look like a wireframe. They now show plausible Manzil
 * content instead.
 *
 * Localised rather than hardcoded: a Russian visitor seeing Uzbek sample text
 * would read as an untranslated page, and these strings sit next to copy that
 * is already translated. Names are given as first name plus initial, matching
 * how reviews actually render elsewhere in the product.
 */
export type AudienceSamples = {
  listing: {
    name: string;
    meta: string;
    hours: string;
    phone: string;
    chipOpen: string;
    chipVerified: string;
  };
  review: {
    author: string;
    initial: string;
    text: string;
    replyLabel: string;
    replyText: string;
  };
  inbox: {
    title: string;
    items: Array<{ label: string; meta: string; tone: "gold" | "teal" | "terra" }>;
  };
  stats: {
    title: string;
    total: string;
    delta: string;
    days: string[];
  };
  profile: {
    name: string;
    initial: string;
    handle: string;
    counts: Array<{ value: string; label: string }>;
  };
  story: {
    caption: string;
    place: string;
    likes: string;
  };
  search: {
    query: string;
    results: Array<{ name: string; meta: string; initial: string }>;
  };
  follow: {
    people: Array<{ name: string; initial: string; meta: string; action: string; ghost?: boolean }>;
  };
};

const SAMPLES: Record<string, AudienceSamples> = {
  uz: {
    listing: {
      name: "Chorsu Osh Markazi",
      meta: "Milliy taomlar · Shayxontohur",
      hours: "Har kuni 09:00–23:00",
      phone: "+998 88 586 11 24",
      chipOpen: "Ochiq",
      chipVerified: "Tasdiqlangan"
    },
    review: {
      author: "Dilnoza R.",
      initial: "D",
      text: "Oshi zo'r, kutish uzoq emas. Oilaviy zal tinch ekan.",
      replyLabel: "Sizning javobingiz",
      replyText: "Rahmat, Dilnoza! Yana kutamiz."
    },
    inbox: {
      title: "E'lonlar",
      items: [
        { label: "Tushlik seti −20%", meta: "7 kun", tone: "gold" },
        { label: "Yangi ish vaqti", meta: "Bugun", tone: "teal" },
        { label: "Bayram menyusi", meta: "Rejalashtirilgan", tone: "terra" }
      ]
    },
    stats: {
      title: "Bu hafta",
      total: "2 480",
      delta: "+18%",
      days: ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"]
    },
    profile: {
      name: "Kamola S.",
      initial: "K",
      handle: "Toshkent",
      counts: [
        { value: "128", label: "Sharh" },
        { value: "2.4k", label: "Obunachi" },
        { value: "310", label: "Obuna" }
      ]
    },
    story: {
      caption: "Registon kechqurun",
      place: "Samarqand",
      likes: "214"
    },
    search: {
      query: "yaqinimdagi kafe",
      results: [
        { name: "Caravan Coffee", meta: "★ 4.9 · 1.2 km · Chilonzor", initial: "C" },
        { name: "Bibixonim Osh", meta: "★ 4.7 · 2.0 km · Yunusobod", initial: "B" }
      ]
    },
    follow: {
      people: [
        { name: "Jasur T.", initial: "J", meta: "Sizga obuna bo'ldi", action: "Obuna" },
        { name: "Nilufar A.", initial: "N", meta: "Hikoya ulashdi", action: "Ko'rish", ghost: true }
      ]
    }
  },
  ru: {
    listing: {
      name: "Чорсу Ош Маркази",
      meta: "Национальная кухня · Шайхантахур",
      hours: "Ежедневно 09:00–23:00",
      phone: "+998 88 586 11 24",
      chipOpen: "Открыто",
      chipVerified: "Подтверждено"
    },
    review: {
      author: "Дилноза Р.",
      initial: "Д",
      text: "Плов отличный, ждать почти не пришлось. В семейном зале тихо.",
      replyLabel: "Ваш ответ",
      replyText: "Спасибо, Дилноза! Ждём вас снова."
    },
    inbox: {
      title: "Объявления",
      items: [
        { label: "Ланч-сет −20%", meta: "7 дней", tone: "gold" },
        { label: "Новые часы работы", meta: "Сегодня", tone: "teal" },
        { label: "Праздничное меню", meta: "Запланировано", tone: "terra" }
      ]
    },
    stats: {
      title: "На этой неделе",
      total: "2 480",
      delta: "+18%",
      days: ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]
    },
    profile: {
      name: "Камола С.",
      initial: "К",
      handle: "Ташкент",
      counts: [
        { value: "128", label: "Отзывы" },
        { value: "2.4k", label: "Подписчики" },
        { value: "310", label: "Подписки" }
      ]
    },
    story: {
      caption: "Регистан вечером",
      place: "Самарканд",
      likes: "214"
    },
    search: {
      query: "кафе рядом",
      results: [
        { name: "Caravan Coffee", meta: "★ 4.9 · 1.2 км · Чиланзар", initial: "C" },
        { name: "Bibixonim Osh", meta: "★ 4.7 · 2.0 км · Юнусабад", initial: "B" }
      ]
    },
    follow: {
      people: [
        { name: "Жасур Т.", initial: "Ж", meta: "Подписался на вас", action: "Подписаться" },
        { name: "Нилуфар А.", initial: "Н", meta: "Поделилась историей", action: "Смотреть", ghost: true }
      ]
    }
  },
  en: {
    listing: {
      name: "Chorsu Osh Markazi",
      meta: "Uzbek cuisine · Shayxontohur",
      hours: "Daily 09:00–23:00",
      phone: "+998 88 586 11 24",
      chipOpen: "Open",
      chipVerified: "Verified"
    },
    review: {
      author: "Dilnoza R.",
      initial: "D",
      text: "The plov is excellent and the wait was short. The family room is quiet.",
      replyLabel: "Your reply",
      replyText: "Thank you, Dilnoza. We hope to see you again."
    },
    inbox: {
      title: "Announcements",
      items: [
        { label: "Lunch set −20%", meta: "7 days", tone: "gold" },
        { label: "New opening hours", meta: "Today", tone: "teal" },
        { label: "Holiday menu", meta: "Scheduled", tone: "terra" }
      ]
    },
    stats: {
      title: "This week",
      total: "2,480",
      delta: "+18%",
      days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    },
    profile: {
      name: "Kamola S.",
      initial: "K",
      handle: "Tashkent",
      counts: [
        { value: "128", label: "Reviews" },
        { value: "2.4k", label: "Followers" },
        { value: "310", label: "Following" }
      ]
    },
    story: {
      caption: "Registan at dusk",
      place: "Samarkand",
      likes: "214"
    },
    search: {
      query: "cafes near me",
      results: [
        { name: "Caravan Coffee", meta: "★ 4.9 · 1.2 km · Chilonzor", initial: "C" },
        { name: "Bibixonim Osh", meta: "★ 4.7 · 2.0 km · Yunusobod", initial: "B" }
      ]
    },
    follow: {
      people: [
        { name: "Jasur T.", initial: "J", meta: "Followed you", action: "Follow" },
        { name: "Nilufar A.", initial: "N", meta: "Shared a story", action: "View", ghost: true }
      ]
    }
  }
};

export function getAudienceSamples(locale: Locale): AudienceSamples {
  return SAMPLES[locale] ?? SAMPLES.uz;
}
