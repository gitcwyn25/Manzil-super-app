"use client";

import type { Locale } from "@manzil/shared";
import { type FormEvent, useCallback, useState } from "react";
import { API_BASE_URL } from "../../lib/api-base-url";

type Choice = { value: string; label: string };

type GurmanCopy = {
  kicker: string;
  title: string;
  body: string;
  forenameLabel: string;
  forenamePlaceholder: string;
  surnameLabel: string;
  surnamePlaceholder: string;
  emailLabel: string;
  emailPlaceholder: string;
  purposeLabel: string;
  purposePlaceholder: string;
  purposeOptions: Choice[];
  heardFromLabel: string;
  heardFromPlaceholder: string;
  heardFromOptions: Choice[];
  consentBefore: string;
  terms: string;
  consentJoin: string;
  privacy: string;
  consentAfter: string;
  submit: string;
  submitting: string;
  successTitle: string;
  successBody: (position: number) => string;
  positionLabel: string;
  again: string;
  privacyNote: string;
  error: string;
};

const COPY: Record<Locale, GurmanCopy> = {
  uz: {
    kicker: "Early access / 01",
    title: "Gurman Mobile uchun navbatga turing",
    body: "Ilova tayyor bo‘lganda birinchi bo‘lib xabar olish uchun ma’lumotlaringizni qoldiring.",
    forenameLabel: "Ism",
    forenamePlaceholder: "Ismingiz",
    surnameLabel: "Familiya",
    surnamePlaceholder: "Familiyangiz",
    emailLabel: "Email",
    emailPlaceholder: "emailingiz@example.com",
    purposeLabel: "Gurmanni nima uchun ishlatmoqchisiz?",
    purposePlaceholder: "Maqsadingizni tanlang",
    purposeOptions: [
      { value: "discover", label: "Yangi joylarni topish" },
      { value: "plan", label: "Kun va marshrut rejalash" },
      { value: "food", label: "Ovqatlanish joylarini topish" },
      { value: "local", label: "Mahalliy tajribalarni kashf etish" },
      { value: "other", label: "Boshqa" }
    ],
    heardFromLabel: "Gurman haqida qayerdan eshitdingiz?",
    heardFromPlaceholder: "Manbani tanlang",
    heardFromOptions: [
      { value: "instagram", label: "Instagram" },
      { value: "telegram", label: "Telegram" },
      { value: "youtube", label: "YouTube" },
      { value: "friend", label: "Do‘st yoki hamkasb" },
      { value: "search", label: "Google yoki qidiruv" },
      { value: "other", label: "Boshqa" }
    ],
    consentBefore: "Men ",
    terms: "Foydalanish shartlari",
    consentJoin: " va ",
    privacy: "Maxfiylik siyosati",
    consentAfter: "ni o‘qidim va roziman.",
    submit: "Waitlistga qo‘shilish",
    submitting: "Yuborilmoqda…",
    successTitle: "Ro‘yxatdasiz.",
    successBody: (position) => `Siz navbatda ${position}-o‘rindasiz. Gurman Mobile tayyor bo‘lganda sizga birinchi bo‘lib yozamiz.`,
    positionLabel: "Navbatdagi o‘rningiz",
    again: "Boshqa email qo‘shish",
    privacyNote: "Faqat Gurman yangiliklari. Spam yo‘q.",
    error: "Yuborib bo‘lmadi. Qaytadan urinib ko‘ring."
  },
  ru: {
    kicker: "Early access / 01",
    title: "Встаньте в очередь Gurman Mobile",
    body: "Оставьте свои данные, чтобы первым узнать о запуске приложения.",
    forenameLabel: "Имя",
    forenamePlaceholder: "Ваше имя",
    surnameLabel: "Фамилия",
    surnamePlaceholder: "Ваша фамилия",
    emailLabel: "Email",
    emailPlaceholder: "you@example.com",
    purposeLabel: "Для чего вы хотите использовать Gurman?",
    purposePlaceholder: "Выберите цель",
    purposeOptions: [
      { value: "discover", label: "Находить новые места" },
      { value: "plan", label: "Планировать дни и маршруты" },
      { value: "food", label: "Находить места для еды" },
      { value: "local", label: "Открывать локальные впечатления" },
      { value: "other", label: "Другое" }
    ],
    heardFromLabel: "Откуда вы узнали о Gurman?",
    heardFromPlaceholder: "Выберите источник",
    heardFromOptions: [
      { value: "instagram", label: "Instagram" },
      { value: "telegram", label: "Telegram" },
      { value: "youtube", label: "YouTube" },
      { value: "friend", label: "Друг или коллега" },
      { value: "search", label: "Google или поиск" },
      { value: "other", label: "Другое" }
    ],
    consentBefore: "Я прочитал(а) и согласен(на) с ",
    terms: "Условиями использования",
    consentJoin: " и ",
    privacy: "Политикой конфиденциальности",
    consentAfter: ".",
    submit: "Встать в список",
    submitting: "Отправляем…",
    successTitle: "Вы в списке.",
    successBody: (position) => `Ваше место в очереди — ${position}. Мы напишем вам первыми, когда Gurman Mobile будет готов.`,
    positionLabel: "Ваше место в очереди",
    again: "Добавить другой email",
    privacyNote: "Только новости Gurman. Без спама.",
    error: "Не удалось отправить. Попробуйте ещё раз."
  },
  en: {
    kicker: "Early access / 01",
    title: "Join the Gurman Mobile waitlist",
    body: "Leave your details to hear first when the app is ready.",
    forenameLabel: "Forename",
    forenamePlaceholder: "Your forename",
    surnameLabel: "Surname",
    surnamePlaceholder: "Your surname",
    emailLabel: "Email",
    emailPlaceholder: "you@example.com",
    purposeLabel: "What would you use Gurman for?",
    purposePlaceholder: "Choose a purpose",
    purposeOptions: [
      { value: "discover", label: "Discover new places" },
      { value: "plan", label: "Plan days and routes" },
      { value: "food", label: "Find places to eat" },
      { value: "local", label: "Explore local experiences" },
      { value: "other", label: "Other" }
    ],
    heardFromLabel: "Where did you hear about Gurman?",
    heardFromPlaceholder: "Choose a source",
    heardFromOptions: [
      { value: "instagram", label: "Instagram" },
      { value: "telegram", label: "Telegram" },
      { value: "youtube", label: "YouTube" },
      { value: "friend", label: "Friend or colleague" },
      { value: "search", label: "Google or search" },
      { value: "other", label: "Other" }
    ],
    consentBefore: "I have read and agree to the ",
    terms: "Terms of Service",
    consentJoin: " and ",
    privacy: "Privacy Policy",
    consentAfter: ".",
    submit: "Join the waitlist",
    submitting: "Sending…",
    successTitle: "You’re on the list.",
    successBody: (position) => `Your place in line is ${position}. We’ll write first when Gurman Mobile is ready.`,
    positionLabel: "Your place in line",
    again: "Add another email",
    privacyNote: "Gurman updates only. No spam.",
    error: "That didn’t send. Try again."
  }
};

const PURPOSE_VALUES = new Set(["discover", "plan", "food", "local", "other"]);
const SOURCE_VALUES = new Set(["instagram", "telegram", "youtube", "friend", "search", "other"]);

function legalPath(locale: Locale, document: "terms" | "privacy") {
  return `/${locale}/legal/${document}`;
}

function CompanionVideo({ src, className, label }: { src: string; className: string; label: string }) {
  return (
    <div aria-label={label} className={`gw-companion ${className}`}>
      <video autoPlay className="gw-companion__video" loop muted playsInline preload="metadata" src={src} />
    </div>
  );
}

export function GurmanWaitlistForm({ locale }: { locale: Locale }) {
  const text = COPY[locale] ?? COPY.uz;
  const [forename, setForename] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [purpose, setPurpose] = useState("");
  const [heardFrom, setHeardFrom] = useState("");
  const [acceptedLegal, setAcceptedLegal] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [queuePosition, setQueuePosition] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = useCallback(async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!PURPOSE_VALUES.has(purpose) || !SOURCE_VALUES.has(heardFrom) || !acceptedLegal) {
      setError(text.error);
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/waitlist`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          topic: "gurman",
          firstName: forename,
          lastName: surname,
          email,
          purpose,
          heardFrom,
          acceptedLegal,
          locale,
          source: "web:gurman"
        })
      });
      const payload = (await response.json().catch(() => null)) as {
        data?: { position?: unknown };
        message?: string | string[];
      } | null;

      if (!response.ok) {
        const message = Array.isArray(payload?.message) ? payload.message.join(" ") : payload?.message;
        setError(message || text.error);
        setSubmitting(false);
        return;
      }

      const position = payload?.data?.position;
      setQueuePosition(typeof position === "number" && Number.isInteger(position) && position > 0 ? position : null);
      setSubmitted(true);
      setSubmitting(false);
    } catch {
      setError(text.error);
      setSubmitting(false);
    }
  }, [acceptedLegal, email, forename, heardFrom, locale, purpose, surname, text.error]);

  function resetForm() {
    setSubmitted(false);
    setQueuePosition(null);
    setForename("");
    setSurname("");
    setEmail("");
    setPurpose("");
    setHeardFrom("");
    setAcceptedLegal(false);
    setError("");
  }

  if (submitted) {
    return (
      <div className="gw-page">
        <div className="gw-ambient gw-ambient--gold" aria-hidden="true" />
        <div className="gw-ambient gw-ambient--orange" aria-hidden="true" />
        <div className="gw-card-wrap">
          <div className="gw-card-glow" aria-hidden="true" />
          <div className="gw-card gw-card--success wl-done" role="status">
            <div className="gw-card-header"><span>{text.kicker}</span><span className="gw-status"><span aria-hidden="true">✦</span> Mobile concept</span></div>
            <div className="gw-success">
              <div className="gw-success-icon" aria-hidden="true">✓</div>
              <h1>{text.successTitle}</h1>
              <p>{text.successBody(queuePosition ?? 0)}</p>
              {queuePosition ? <div className="gw-position" aria-label={`${text.positionLabel}: ${queuePosition}`}><span>{text.positionLabel}</span><strong>#{queuePosition}</strong></div> : null}
              <button className="gw-again" onClick={resetForm} type="button">{text.again}</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="gw-page">
      <div className="gw-ambient gw-ambient--gold" aria-hidden="true" />
      <div className="gw-ambient gw-ambient--orange" aria-hidden="true" />
      <div className="gw-card-wrap">
        <div className="gw-card-glow" aria-hidden="true" />
        <CompanionVideo className="gw-companion--read" label="Gurman reading" src="/companions/read.webm" />
        <CompanionVideo className="gw-companion--think" label="Gurman thinking" src="/companions/think.webm" />
        <CompanionVideo className="gw-companion--tired" label="Gurman resting" src="/companions/tired.webm" />
        <div className="gw-card">
          <div className="gw-card-header"><span>{text.kicker}</span><span className="gw-status"><span aria-hidden="true">✦</span> Mobile concept</span></div>
          <div className="gw-card-content">
            <h1>{text.title}</h1>
            <p className="gw-card-lead">{text.body}</p>
            <form className="gw-form" onSubmit={handleSubmit}>
              <div className="gw-grid gw-grid--names">
                <div className="gw-field"><label htmlFor="gurman-forename">{text.forenameLabel}</label><input autoComplete="given-name" id="gurman-forename" onChange={(event) => setForename(event.target.value)} placeholder={text.forenamePlaceholder} required value={forename} /></div>
                <div className="gw-field"><label htmlFor="gurman-surname">{text.surnameLabel}</label><input autoComplete="family-name" id="gurman-surname" onChange={(event) => setSurname(event.target.value)} placeholder={text.surnamePlaceholder} required value={surname} /></div>
              </div>
              <div className="gw-field"><label htmlFor="gurman-email">{text.emailLabel}</label><input autoComplete="email" id="gurman-email" name="email" onChange={(event) => setEmail(event.target.value)} placeholder={text.emailPlaceholder} required type="email" value={email} /></div>
              <div className="gw-grid">
                <div className="gw-field"><label htmlFor="gurman-purpose">{text.purposeLabel}</label><select id="gurman-purpose" name="purpose" onChange={(event) => setPurpose(event.target.value)} required value={purpose}><option disabled value="">{text.purposePlaceholder}</option>{text.purposeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
                <div className="gw-field"><label htmlFor="gurman-heard-from">{text.heardFromLabel}</label><select id="gurman-heard-from" name="heardFrom" onChange={(event) => setHeardFrom(event.target.value)} required value={heardFrom}><option disabled value="">{text.heardFromPlaceholder}</option>{text.heardFromOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
              </div>
              <label className="gw-consent"><input checked={acceptedLegal} onChange={(event) => setAcceptedLegal(event.target.checked)} required type="checkbox" /><span>{text.consentBefore}<a href={legalPath(locale, "terms")}>{text.terms}</a>{text.consentJoin}<a href={legalPath(locale, "privacy")}>{text.privacy}</a>{text.consentAfter}</span></label>
              {error ? <p className="gw-error" role="alert">{error}</p> : null}
              <button className="gw-submit wl-submit" disabled={submitting} type="submit">{submitting ? text.submitting : text.submit}<span aria-hidden="true">↗</span></button>
            </form>
            <p className="gw-privacy">{text.privacyNote}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
