import { isLocale } from "@manzil/shared";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "../../../../components/json-ld";
import { FOUNDER_COPY, FOUNDER_PROFILE } from "../../../../lib/founder-profile";
import { pageMetadata } from "../../../../lib/seo";
import { breadcrumbSchema, founderProfileSchema } from "../../../../lib/structured-data";
import styles from "./profile.module.css";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const copy = FOUNDER_COPY[locale];
  return pageMetadata({
    locale,
    path: FOUNDER_PROFILE.path,
    title: copy.title,
    description: copy.description,
    absoluteTitle: true,
    type: "profile",
    images: [FOUNDER_PROFILE.image]
  });
}

export default async function FounderProfilePage({ params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const copy = FOUNDER_COPY[locale];
  const publication = FOUNDER_PROFILE.publication;

  return (
    <article className={styles.page}>
      <JsonLd data={[
        founderProfileSchema(locale),
        breadcrumbSchema(locale, [
          { name: "Manzil", path: "" },
          { name: copy.founders, path: "/founders" },
          { name: FOUNDER_PROFILE.name, path: FOUNDER_PROFILE.path }
        ])
      ]} />
      <Link className={styles.back} href={`/${locale}/founders`}>
        <span aria-hidden="true">← </span>{copy.founders}
      </Link>

      <header className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>{copy.role}</p>
          <h1>{FOUNDER_PROFILE.name}</h1>
          <p className={styles.bio}>{copy.bio}</p>
          <a className="btn btn-primary" href={FOUNDER_PROFILE.linkedIn}>{copy.linkedIn}</a>
        </div>
        <figure className={styles.portrait}>
          <Image
            src={FOUNDER_PROFILE.image}
            alt={FOUNDER_PROFILE.name}
            fill
            priority
            sizes="(max-width: 760px) calc(100vw - 32px), 340px"
          />
          <figcaption>{FOUNDER_PROFILE.name}<span>{copy.role}</span></figcaption>
        </figure>
      </header>

      <nav className={styles.navigation} aria-label={copy.onThisPage}>
        <a href="#manzil">Manzil Group</a>
        <a href="#education">{copy.educationTitle}</a>
        <a href="#research">{copy.researchTitle}</a>
        <a href="#coverage">{copy.coverageTitle}</a>
      </nav>

      <div className={styles.sections}>
        <section id="manzil" className={styles.section} aria-labelledby="manzil-heading">
          <h2 id="manzil-heading">{copy.startupTitle}</h2>
          <div>
            <p>{copy.startupBody}</p>
            <Link className={styles.link} href={`/${locale}`}>{copy.explore}<span aria-hidden="true"> →</span></Link>
          </div>
        </section>

        <section id="education" className={styles.section} aria-labelledby="education-heading">
          <h2 id="education-heading">{copy.educationTitle}</h2>
          <div>
            <p>{copy.currentStudies}</p>
            <p className={styles.eyebrow}><time dateTime="2026-07">{copy.graduation}</time></p>
            <p>{copy.educationBody}</p>
          </div>
        </section>

        <section id="research" className={styles.section} aria-labelledby="research-heading">
          <h2 id="research-heading">{copy.researchTitle}</h2>
          <div>
            <p className={styles.eyebrow}><time dateTime={publication.published}>{copy.publicationDate}</time></p>
            <h3 className={styles.publicationTitle} lang="en">{publication.title}</h3>
            <p>{copy.researchBody}</p>
            <p className={styles.detail}>{copy.coauthor} {publication.coauthor}.<br />
              <cite lang="en">{publication.journal}</cite>, {publication.citation}.
            </p>
            <a className={styles.link} href={publication.url}>{copy.readResearch}<span aria-hidden="true"> ↗</span></a>
          </div>
        </section>

        <section id="coverage" className={styles.section} aria-labelledby="coverage-heading">
          <h2 id="coverage-heading">{copy.coverageTitle}</h2>
          <div>
            <p>{copy.coverageBody}</p>
            <ul className={styles.coverage}>
              {FOUNDER_PROFILE.coverage.map((source) => (
                <li key={source.url}>
                  <h3>{source.title[locale]}</h3>
                  <a className={styles.link} href={source.url}>{copy.readCoverage}<span aria-hidden="true"> ↗</span>
                    <span className="visually-hidden">: {source.title[locale]}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>
    </article>
  );
}
