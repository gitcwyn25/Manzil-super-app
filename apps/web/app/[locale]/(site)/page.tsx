import type { Locale } from "@manzil/shared";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CleverFaq } from "../../components/home/clever-faq";
import { GurmanVideoSection } from "../../components/home/gurman-video-section";
import { ManzilStory } from "../../components/home/manzil-story";
import { getLandingCopy } from "../../lib/landing-copy";
import { routeMetadata } from "../../lib/seo";
import styles from "./landing.module.css";

const openingCopy: Record<Locale, { label: string; title: [string, string]; description: string; action: string; place: string; image: string }> = {
  en: { label: "A little closer to your city", title: ["Find your", "next Manzil."], description: "Places to discover. Plans to make. Experiences worth sharing. Start with the city around you.", action: "Explore Manzil", place: "Chorsu · Tashkent, Uzbekistan", image: "The tiled dome of Chorsu Bazaar in Tashkent" },
  uz: { label: "Shahringizga yanada yaqin", title: ["Keyingi manzilingiz", "shu yerda."], description: "Kashf etiladigan joylar. Tuziladigan rejalar. Ulashishga arzigulik taassurotlar. Atrofingizdagi shahardan boshlang.", action: "Manzilni kashf eting", place: "Chorsu · Toshkent, O‘zbekiston", image: "Toshkentdagi Chorsu bozorining naqshli gumbazi" },
  ru: { label: "Чуть ближе к своему городу", title: ["Ваш следующий", "Manzil."], description: "Места для открытий. Планы для встреч. Впечатления, которыми хочется делиться. Начните с города вокруг вас.", action: "Открыть Manzil", place: "Чорсу · Ташкент, Узбекистан", image: "Узорчатый купол базара Чорсу в Ташкенте" }
};

export async function generateMetadata({
  params
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return routeMetadata("home", locale);
}

/**
 * Home — one Manzil system with a clear current/future boundary:
 * 1. Mobile story: discovery, everyday needs, human experience, and sharing.
 * 2. Directory boundary: real listings belong to Discover only.
 * 3. FAQ and final path selection.
 */
export default async function LandingPage({
  params
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const copy = getLandingCopy(locale);
  const opening = openingCopy[locale];

  return (
    <div className={styles.landing} data-landing-palette="marshmallow-galactic">
      <section className={styles.opening} aria-labelledby="landing-opening-title">
        <Image className={styles.photograph} src="/discover/chorsu-bazaar-6k.jpg" alt={opening.image} fill sizes="100vw" preload />
        <div className={styles.photoShade} aria-hidden="true" />
        <div className={styles.openingInner}>
          <p className={styles.eyebrow}><span aria-hidden="true" />{opening.label}</p>
          <h1 id="landing-opening-title">{opening.title.map(line => <span key={line}>{line}</span>)}</h1>
          <div className={styles.openingBottom}>
            <p>{opening.description}</p>
            <Link className={styles.primaryAction} href={`/${locale}/discover`}>{opening.action}<ArrowUpRight size={23} aria-hidden="true" /></Link>
          </div>
          <div className={styles.photoCaption}><span>MANZIL / 01</span><span>{opening.place}<a href="/photography.html">{locale === "uz" ? "Foto mualliflari" : locale === "ru" ? "Авторы фото" : "Photo credits"}</a></span></div>
        </div>
      </section>
      <ManzilStory copy={copy.story} />
      <GurmanVideoSection copy={copy.gurman} locale={locale} />
      <CleverFaq copy={copy.faq} />
    </div>
  );
}
