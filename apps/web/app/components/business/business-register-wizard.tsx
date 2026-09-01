"use client";

import { useState } from "react";
import type { Category, Locale } from "@manzil/shared";
import { registerBusinessAction } from "../../lib/crm-actions";
import { MutationForm } from "../pxs/mutation-form";
import { RegisterSubmit } from "../crm/register-submit";
import { Icon } from "../vm/icons";

const TASHKENT_DISTRICTS = [
  "Chilonzor",
  "Mirobod",
  "Yunusobod",
  "Yakkasaroy",
  "Shayxontohur",
  "Mirzo Ulug'bek",
  "Olmazor",
  "Uchtepa",
  "Sergeli",
  "Yashnobod",
  "Bektemir",
  "Yangihayot"
];

const WIZARD_COPY: Record<
  Locale,
  {
    step1: { title: string; desc: string };
    step2: { title: string; desc: string };
    step3: { title: string; desc: string };
    name: string;
    namePlaceholder: string;
    category: string;
    categoryPlaceholder: string;
    phone: string;
    phonePlaceholder: string;
    telegram: string;
    telegramPlaceholder: string;
    district: string;
    districtPlaceholder: string;
    address: string;
    addressPlaceholder: string;
    hours: string;
    hoursPlaceholder: string;
    description: string;
    descriptionPlaceholder: string;
    terms: string;
    termsDoc: string;
    btnNext: string;
    btnPrev: string;
    btnSubmit: string;
    pendingLabel: string;
  }
> = {
  uz: {
    step1: { title: "1. Asosiy ma'lumotlar", desc: "Biznesingiz nomi, faoliyat turi va aloqa raqami" },
    step2: { title: "2. Joylashuv va Tavsif", desc: "Tuman, aniq manzil, ish vaqti va xizmatlar tavsifi" },
    step3: { title: "3. Tasdiqlash va Shartlar", desc: "Ommaviy oferta roziligi va profilingizni faollashtirish" },
    name: "Biznes nomi",
    namePlaceholder: "Masalan: Rayhon Milliy Taomlar yoki Breadly",
    category: "Faoliyat turkumi",
    categoryPlaceholder: "Turkumni tanlang",
    phone: "Aloqa telefoni",
    phonePlaceholder: "+998 90 123 45 67",
    telegram: "Telegram havola yoki foydalanuvchi nomi",
    telegramPlaceholder: "@biznes_nomi yoki havola",
    district: "Shahar / Tuman",
    districtPlaceholder: "Tumanni tanlang",
    address: "Aniq manzil va mo'ljal",
    addressPlaceholder: "Amir Temur ko'chasi, 12-uy (mo'ljal: Oloy bozori)",
    hours: "Ish vaqti",
    hoursPlaceholder: "Dush-Yak: 09:00 - 23:00",
    description: "Biznes haqida qisqacha ma'lumot",
    descriptionPlaceholder: "Kompaniyangiz, asosiy xizmatlaringiz va afzalliklaringiz haqida yozing...",
    terms: "Men Manzil platformasining ommaviy ofertasi va xizmat ko'rsatish shartlariga roziman",
    termsDoc: "Ommaviy oferta shartlarini o'qish",
    btnNext: "Keyingi bosqich",
    btnPrev: "Orqaga",
    btnSubmit: "Biznesni ro'yxatdan o'tkazish",
    pendingLabel: "Ro'yxatdan o'tkazilmoqda..."
  },
  ru: {
    step1: { title: "1. Основные данные", desc: "Название, категория деятельности и контакты" },
    step2: { title: "2. Локация и Описание", desc: "Район, точный адрес, график работы и описание" },
    step3: { title: "3. Подтверждение и Условия", desc: "Согласие с офертой и запуск профиля" },
    name: "Название компании",
    namePlaceholder: "Например: Rayhon Milliy Taomlar или Breadly",
    category: "Категория деятельности",
    categoryPlaceholder: "Выберите категорию",
    phone: "Контактный телефон",
    phonePlaceholder: "+998 90 123 45 67",
    telegram: "Telegram аккаунт или ссылка",
    telegramPlaceholder: "@biznes_imya или ссылка",
    district: "Город / Район",
    districtPlaceholder: "Выберите район",
    address: "Точный адрес и ориентир",
    addressPlaceholder: "ул. Амира Темура, дом 12 (ориентир: Алайский рынок)",
    hours: "График работы",
    hoursPlaceholder: "Пн-Вс: 09:00 - 23:00",
    description: "Краткое описание заведения",
    descriptionPlaceholder: "Расскажите об услугах, особенностях и преимуществах...",
    terms: "Я согласен с публичной офертой и правилами платформы Manzil",
    termsDoc: "Читать текст оферты",
    btnNext: "Далее",
    btnPrev: "Назад",
    btnSubmit: "Зарегистрировать бизнес",
    pendingLabel: "Регистрация..."
  },
  en: {
    step1: { title: "1. Basic Information", desc: "Business name, category, and direct contact" },
    step2: { title: "2. Location & Details", desc: "District, exact address, operating hours, and bio" },
    step3: { title: "3. Confirmation & Terms", desc: "Terms agreement and instant launch" },
    name: "Business Name",
    namePlaceholder: "e.g., Rayhon Traditional Dining or Breadly Café",
    category: "Category",
    categoryPlaceholder: "Select a category",
    phone: "Phone Number",
    phonePlaceholder: "+998 90 123 45 67",
    telegram: "Telegram Handle or Link",
    telegramPlaceholder: "@business_handle",
    district: "District",
    districtPlaceholder: "Select a district",
    address: "Street Address & Landmark",
    addressPlaceholder: "12 Amir Temur street (near Alay Bazaar)",
    hours: "Operating Hours",
    hoursPlaceholder: "Mon-Sun: 09:00 - 23:00",
    description: "Business Description",
    descriptionPlaceholder: "Highlight your key services, special atmosphere, and offerings...",
    terms: "I agree to the Manzil Platform Public Terms of Service and Privacy Policy",
    termsDoc: "Read Terms & Policy",
    btnNext: "Continue",
    btnPrev: "Back",
    btnSubmit: "Complete Registration",
    pendingLabel: "Registering..."
  }
};

export function BusinessRegisterWizard({
  locale,
  categories,
  terms
}: {
  locale: Locale;
  categories: Category[];
  terms?: { id?: string; title?: string; body?: string } | null;
}) {
  const [currentStep, setCurrentStep] = useState(1);
  const copy = WIZARD_COPY[locale] ?? WIZARD_COPY.uz;

  // Form states for progressive validation
  const [name, setName] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [phone, setPhone] = useState("");
  const [telegram, setTelegram] = useState("");
  const [district, setDistrict] = useState("Chilonzor");
  const [address, setAddress] = useState("");
  const [hours, setHours] = useState("09:00 - 23:00");
  const [description, setDescription] = useState("");
  const [agree, setAgree] = useState(false);

  const canProceedStep1 = name.trim().length >= 2 && categorySlug && phone.trim().length >= 7;
  const canProceedStep2 = address.trim().length >= 4 && description.trim().length >= 10;

  return (
    <div className="bz-wizard-wrapper">
      {/* Wizard Progress Bar */}
      <div className="bz-wizard-progress">
        <div className="bz-wizard-steps">
          {[1, 2, 3].map((step) => (
            <div
              key={step}
              className={`bz-wizard-step-node ${
                currentStep === step
                  ? "bz-wizard-step-node--active"
                  : currentStep > step
                  ? "bz-wizard-step-node--completed"
                  : ""
              }`}
              onClick={() => {
                if (step < currentStep) setCurrentStep(step);
              }}
            >
              <span className="bz-wizard-step-num">
                {currentStep > step ? <Icon name="check" size={14} /> : step}
              </span>
              <span className="bz-wizard-step-label">
                {step === 1 ? copy.step1.title : step === 2 ? copy.step2.title : copy.step3.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      <MutationForm
        action={registerBusinessAction}
        className="bz-wizard-form"
        errorTitle="Xatolik yuz berdi"
        guardUnsavedChanges
        locale={locale}
      >
        <input name="locale" type="hidden" value={locale} />

        {/* STEP 1: Basics */}
        <div className={`bz-wizard-step-content ${currentStep === 1 ? "d-block" : "d-none"}`}>
          <div className="bz-wizard-header">
            <h2>{copy.step1.title}</h2>
            <p>{copy.step1.desc}</p>
          </div>

          <div className="bz-form-grid">
            <div className="bz-form-field">
              <label htmlFor="bz_name">{copy.name} *</label>
              <div className="bz-input-group">
                <Icon name="storefront" size={18} className="bz-input-icon" />
                <input
                  id="bz_name"
                  name="name"
                  onChange={(e) => setName(e.target.value)}
                  placeholder={copy.namePlaceholder}
                  required
                  type="text"
                  value={name}
                />
              </div>
            </div>

            <div className="bz-form-field">
              <label htmlFor="bz_cat">{copy.category} *</label>
              <div className="bz-input-group">
                <Icon name="grid" size={18} className="bz-input-icon" />
                <select
                  id="bz_cat"
                  name="categorySlug"
                  onChange={(e) => setCategorySlug(e.target.value)}
                  required
                  value={categorySlug}
                >
                  <option value="" disabled>
                    {copy.categoryPlaceholder}
                  </option>
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name[locale] ?? c.name.uz}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bz-form-field">
              <label htmlFor="bz_phone">{copy.phone} *</label>
              <div className="bz-input-group">
                <Icon name="call" size={18} className="bz-input-icon" />
                <input
                  id="bz_phone"
                  name="phone"
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={copy.phonePlaceholder}
                  required
                  type="tel"
                  value={phone}
                />
              </div>
            </div>

            <div className="bz-form-field">
              <label htmlFor="bz_tg">{copy.telegram}</label>
              <div className="bz-input-group">
                <Icon name="send" size={18} className="bz-input-icon" />
                <input
                  id="bz_tg"
                  name="telegram"
                  onChange={(e) => setTelegram(e.target.value)}
                  placeholder={copy.telegramPlaceholder}
                  type="text"
                  value={telegram}
                />
              </div>
            </div>
          </div>

          <div className="bz-wizard-actions">
            <button
              className="clever-btn clever-btn--primary clever-btn--sm"
              disabled={!canProceedStep1}
              onClick={() => setCurrentStep(2)}
              type="button"
            >
              <span>{copy.btnNext}</span>
              <Icon name="arrow_forward" size={14} />
            </button>
          </div>
        </div>

        {/* STEP 2: Location & Details */}
        <div className={`bz-wizard-step-content ${currentStep === 2 ? "d-block" : "d-none"}`}>
          <div className="bz-wizard-header">
            <h2>{copy.step2.title}</h2>
            <p>{copy.step2.desc}</p>
          </div>

          <div className="bz-form-grid">
            <div className="bz-form-field">
              <label htmlFor="bz_district">{copy.district} *</label>
              <div className="bz-input-group">
                <Icon name="location" size={18} className="bz-input-icon" />
                <select
                  id="bz_district"
                  name="district"
                  onChange={(e) => setDistrict(e.target.value)}
                  required
                  value={district}
                >
                  {TASHKENT_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d} tumani
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bz-form-field">
              <label htmlFor="bz_addr">{copy.address} *</label>
              <div className="bz-input-group">
                <Icon name="location" size={18} className="bz-input-icon" />
                <input
                  id="bz_addr"
                  name="address"
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={copy.addressPlaceholder}
                  required
                  type="text"
                  value={address}
                />
              </div>
            </div>

            <div className="bz-form-field bz-form-field--full">
              <label htmlFor="bz_hours">{copy.hours}</label>
              <div className="bz-input-group">
                <Icon name="schedule" size={18} className="bz-input-icon" />
                <input
                  id="bz_hours"
                  name="workingHours"
                  onChange={(e) => setHours(e.target.value)}
                  placeholder={copy.hoursPlaceholder}
                  type="text"
                  value={hours}
                />
              </div>
            </div>

            <div className="bz-form-field bz-form-field--full">
              <label htmlFor="bz_desc">{copy.description} *</label>
              <textarea
                className="bz-textarea"
                id="bz_desc"
                minLength={10}
                name="description"
                onChange={(e) => setDescription(e.target.value)}
                placeholder={copy.descriptionPlaceholder}
                required
                rows={4}
                value={description}
              />
            </div>
          </div>

          <div className="bz-wizard-actions">
            <button
              className="clever-btn clever-btn--outline clever-btn--sm"
              onClick={() => setCurrentStep(1)}
              type="button"
            >
              <span>{copy.btnPrev}</span>
            </button>
            <button
              className="clever-btn clever-btn--primary clever-btn--sm"
              disabled={!canProceedStep2}
              onClick={() => setCurrentStep(3)}
              type="button"
            >
              <span>{copy.btnNext}</span>
              <Icon name="arrow_forward" size={14} />
            </button>
          </div>
        </div>

        {/* STEP 3: Verification & Submit */}
        <div className={`bz-wizard-step-content ${currentStep === 3 ? "d-block" : "d-none"}`}>
          <div className="bz-wizard-header">
            <h2>{copy.step3.title}</h2>
            <p>{copy.step3.desc}</p>
          </div>

          {/* Summary Card */}
          <div className="bz-wizard-summary">
            <div className="bz-summary-item">
              <span className="bz-summary-lbl">Biznes nomi:</span>
              <strong className="bz-summary-val">{name || "—"}</strong>
            </div>
            <div className="bz-summary-item">
              <span className="bz-summary-lbl">Turkum:</span>
              <span className="bz-summary-val">{categorySlug || "—"}</span>
            </div>
            <div className="bz-summary-item">
              <span className="bz-summary-lbl">Manzil:</span>
              <span className="bz-summary-val">{district}, {address || "—"}</span>
            </div>
            <div className="bz-summary-item">
              <span className="bz-summary-lbl">Telefon:</span>
              <span className="bz-summary-val">{phone || "—"}</span>
            </div>
          </div>

          {/* Terms Agreement Accordion */}
          <div className="bz-terms-box">
            <label className="bz-terms-checkbox">
              <input
                checked={agree}
                name="consent"
                onChange={(e) => setAgree(e.target.checked)}
                required
                type="checkbox"
                value="terms-accepted"
              />
              <span className="bz-terms-text">
                {copy.terms}
              </span>
            </label>

            {terms?.title && (
              <details className="bz-terms-details">
                <summary>{copy.termsDoc}</summary>
                <div className="bz-terms-body">
                  <h4>{terms.title}</h4>
                  <p>{terms.body}</p>
                </div>
              </details>
            )}
          </div>

          <div className="bz-wizard-actions">
            <button
              className="clever-btn clever-btn--outline clever-btn--sm"
              onClick={() => setCurrentStep(2)}
              type="button"
            >
              <span>{copy.btnPrev}</span>
            </button>
            <RegisterSubmit
              label={copy.btnSubmit}
              locale={locale}
              pendingLabel={copy.pendingLabel}
            />
          </div>
        </div>
      </MutationForm>
    </div>
  );
}
