import type { Locale } from "@manzil/shared";
import { ArrowRight, ArrowUpRight, Compass, MapPin, Star } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "../../../components/json-ld";
import { DISCOVER_URL, REVIEWS_URL } from "../../../lib/discover";
import { canonicalUrl, routeMetadata, ROUTE_SEO } from "../../../lib/seo";
import styles from "./hub.module.css";

const copy = {
  en: {
    eyebrow: "Your Manzil, connected", title: "One starting point.\nMore places to go.",
    intro: "Find a place worth knowing, plan what comes next, and share what made it special. Choose your Manzil app.",
    section: "Explore the Manzil apps", discoverLabel: "Plan & explore",
    discoverDescription: "Turn the places you find into a plan. Explore maps, build trips and bring your people along.",
    discoverFeatures: ["Places & maps", "Plans & trips", "Shared itineraries"], discoverAction: "Open Discover",
    reviewsLabel: "Find & recommend",
    reviewsDescription: "Get to know local businesses through useful details and community reviews. Save your favorites and share your experience.",
    reviewsFeatures: ["Business search", "Reviews & ratings", "Saved places"], reviewsAction: "Open Reviews",
    businessTitle: "A place for your business, too.", businessDescription: "Explore how your business can become part of Manzil.",
    businessAction: "Cooperation", footer: "Made for the places and people around you."
  },
  uz: {
    eyebrow: "Manzil imkoniyatlari bir joyda", title: "Bitta boshlanish.\nKo'plab yangi manzillar.",
    intro: "Yangi joylarni toping, keyingi rejangizni tuzing va taassurotlaringizni ulashing. O'zingizga kerakli Manzil ilovasini tanlang.",
    section: "Manzil ilovalarini kashf eting", discoverLabel: "Rejalang va kashf eting",
    discoverDescription: "Topgan joylaringizni rejaga aylantiring. Xaritalarni o'rganing, sayohat tuzing va yaqinlaringiz bilan birga rejalang.",
    discoverFeatures: ["Joylar va xaritalar", "Rejalar va sayohatlar", "Birgalikda rejalash"], discoverAction: "Discover ilovasini ochish",
    reviewsLabel: "Toping va tavsiya qiling",
    reviewsDescription: "Mahalliy bizneslarni ma'lumotlar va foydalanuvchilar sharhlari orqali o'rganing. Sevimli joylaringizni saqlang va tajribangizni ulashing.",
    reviewsFeatures: ["Bizneslarni qidirish", "Sharhlar va baholar", "Saqlangan joylar"], reviewsAction: "Reviews ilovasini ochish",
    businessTitle: "Biznesingiz uchun ham joy bor.", businessDescription: "Biznesingiz Manzilning bir qismiga qanday aylanishini bilib oling.",
    businessAction: "Hamkorlik", footer: "Atrofingizdagi joylar va insonlar uchun."
  },
  ru: {
    eyebrow: "Все возможности Manzil рядом", title: "Одна отправная точка.\nБольше новых мест.",
    intro: "Находите интересные места, стройте планы и делитесь впечатлениями. Выберите нужное приложение Manzil.",
    section: "Откройте приложения Manzil", discoverLabel: "Планируйте и открывайте",
    discoverDescription: "Превратите найденные места в план. Изучайте карты, составляйте поездки и планируйте вместе с близкими.",
    discoverFeatures: ["Места и карты", "Планы и поездки", "Общие маршруты"], discoverAction: "Открыть Discover",
    reviewsLabel: "Находите и рекомендуйте",
    reviewsDescription: "Знакомьтесь с местными компаниями по полезной информации и отзывам сообщества. Сохраняйте любимые места и делитесь опытом.",
    reviewsFeatures: ["Поиск компаний", "Отзывы и оценки", "Сохранённые места"], reviewsAction: "Открыть Reviews",
    businessTitle: "Есть место и для вашего бизнеса.", businessDescription: "Узнайте, как ваш бизнес может стать частью Manzil.",
    businessAction: "Сотрудничество", footer: "Для мест и людей вокруг вас."
  }
} satisfies Record<Locale, {
  eyebrow: string; title: string; intro: string; section: string;
  discoverLabel: string; discoverDescription: string; discoverFeatures: string[]; discoverAction: string;
  reviewsLabel: string; reviewsDescription: string; reviewsFeatures: string[]; reviewsAction: string;
  businessTitle: string; businessDescription: string; businessAction: string; footer: string;
}>;

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  return routeMetadata("discover", (await params).locale);
}

/** The public starting point; each destination retains its own application. */
export default async function DiscoverPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const text = copy[locale];
  const applications = [
    { name: "Manzil Discover", url: DISCOVER_URL, description: text.discoverDescription },
    { name: "Manzil Reviews", url: REVIEWS_URL, description: text.reviewsDescription }
  ];
  return (
    <div className={styles.hub} data-discover-hub>
      <JsonLd data={{
        "@context": "https://schema.org", "@type": "CollectionPage",
        name: ROUTE_SEO.discover.title[locale], description: ROUTE_SEO.discover.description[locale],
        url: canonicalUrl(locale, "/discover"), inLanguage: locale,
        mainEntity: { "@type": "ItemList", itemListElement: applications.map((application, index) => ({
          "@type": "ListItem", position: index + 1, item: { "@type": "WebApplication", ...application }
        })) }
      }} />
      <section className={styles.hero} aria-labelledby="discover-hub-title">
        <img className={styles.heroImage} src="/discover/tashkent-metro.png" alt="" fetchPriority="high" />
        <div className={styles.heroShade} aria-hidden="true" />
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}><span aria-hidden="true" />{text.eyebrow}</p>
            <h1 id="discover-hub-title">{text.title.split("\n").map(line => <span key={line}>{line}</span>)}</h1>
            <p className={styles.intro}>{text.intro}</p>
            <div className={styles.heroActions}>
              <a className={styles.heroLink} href={DISCOVER_URL}>{text.discoverAction}<ArrowUpRight aria-hidden="true" size={21} /></a>
              <a className={styles.heroSecondary} href={REVIEWS_URL}>{text.reviewsAction}<ArrowUpRight aria-hidden="true" size={21} /></a>
            </div>
          </div>
          <span className={styles.heroStamp} aria-hidden="true">M.</span>
        </div>
        <div className={styles.heroBottom}>
          <span><MapPin aria-hidden="true" size={15} /> TOSHKENT / MANZIL</span>
          <a href="#manzil-apps">{text.section}<ArrowRight aria-hidden="true" size={18} /></a>
        </div>
      </section>
      <section className={styles.apps} id="manzil-apps" aria-label={text.section}>
        <div className={styles.sectionHeading}><p className={styles.eyebrow}>{text.section}</p><span aria-hidden="true">01 — 02</span></div>
        <div className={styles.cardGrid}>
          <article className={styles.card} data-manzil-app="discover">
            <div className={styles.cardImage}><img src="/discover/tashkent-metro.png" alt="" loading="lazy" /><span aria-hidden="true">01</span></div>
            <div className={styles.cardBody}>
            <div className={styles.cardHeading}><span className={styles.appIcon}><Compass aria-hidden="true" size={21} /></span><span className={styles.appCategory}>{text.discoverLabel}</span></div>
            <h2>Manzil Discover</h2><p>{text.discoverDescription}</p>
            <ul>{text.discoverFeatures.map(feature => <li key={feature}>{feature}</li>)}</ul>
            <a className={styles.appLink} href={DISCOVER_URL}><span>{text.discoverAction}<small>discover.manzilgroup.uz</small></span><ArrowUpRight aria-hidden="true" size={24} /></a>
            </div>
          </article>
          <article className={`${styles.card} ${styles.reviewCard}`} data-manzil-app="reviews">
            <div className={styles.cardImage}><img src="/discover/tashkent-avenue.png" alt="" loading="lazy" /><span aria-hidden="true">02</span></div>
            <div className={styles.cardBody}>
            <div className={styles.cardHeading}><span className={styles.appIcon}><Star aria-hidden="true" size={21} /></span><span className={styles.appCategory}>{text.reviewsLabel}</span></div>
            <h2>Manzil Reviews</h2><p>{text.reviewsDescription}</p>
            <ul>{text.reviewsFeatures.map(feature => <li key={feature}>{feature}</li>)}</ul>
            <a className={styles.appLink} href={REVIEWS_URL}><span>{text.reviewsAction}<small>review.manzilgroup.uz</small></span><ArrowUpRight aria-hidden="true" size={24} /></a>
            </div>
          </article>
        </div>
        <aside className={styles.cooperation}>
          <div><h2>{text.businessTitle}</h2><p>{text.businessDescription}</p></div>
          <Link href={`/${locale}/business`}>{text.businessAction}<ArrowRight aria-hidden="true" size={18} /></Link>
        </aside>
        <p className={styles.closing}>{text.footer}</p>
      </section>
    </div>
  );
}
