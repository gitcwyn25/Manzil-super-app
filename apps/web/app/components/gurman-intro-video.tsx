import type { Locale } from "@manzil/shared";

const VIDEO_ID = "CxOYDJKz5dc";

const COPY: Record<Locale, { eyebrow: string; title: string; body: string; label: string }> = {
  uz: {
    eyebrow: "Gurman bilan tanishing",
    title: "Toshkentni boshqacha kashf eting.",
    body: "Gurman AI ni amalda ko'ring: niyatdan haqiqiy joylargacha bo'lgan yo'lni bitta suhbatga yig'amiz.",
    label: "Gurman AI intro videosini tomosha qiling"
  },
  ru: {
    eyebrow: "Познакомьтесь с Gurman",
    title: "Открывайте Ташкент по-новому.",
    body: "Посмотрите Gurman AI в действии: от намерения до реальных мест — в одном разговоре.",
    label: "Посмотреть видео о Gurman AI"
  },
  en: {
    eyebrow: "Meet Gurman",
    title: "Discover Tashkent differently.",
    body: "See Gurman AI in action: from an intention to real places, brought together in one conversation.",
    label: "Watch the Gurman AI introduction video"
  }
};

export function GurmanIntroVideo({ locale }: { locale: Locale }) {
  const copy = COPY[locale];

  return (
    <section className="gurman-video" aria-labelledby="gurman-video-title">
      <div className="gurman-video__copy">
        <p className="gurman-landing__eyebrow">{copy.eyebrow}</p>
        <h2 id="gurman-video-title">{copy.title}</h2>
        <p>{copy.body}</p>
        <span className="gurman-video__caption">{copy.label}</span>
      </div>
      <div className="gurman-video__frame">
        <iframe
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          src={`https://www.youtube.com/embed/${VIDEO_ID}?rel=0&modestbranding=1`}
          title="Discover Tashkent with Manzil & Gurman AI"
        />
      </div>
    </section>
  );
}
