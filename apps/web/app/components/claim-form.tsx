"use client";

import { useAuth } from "@clerk/nextjs";
import type { Locale } from "@manzil/shared";
import { type FormEvent, useState } from "react";
import { API_BASE_URL } from "../lib/api";

export function ClaimForm({
  businessName,
  businessSlug,
  locale
}: {
  businessName?: string;
  businessSlug?: string;
  locale: Locale;
}) {
  const { getToken, isSignedIn } = useAuth();
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("businessName") ?? "").trim();
    const ownerName = String(form.get("ownerName") ?? "").trim();
    const phone = String(form.get("phone") ?? "").trim();

    if (!name || !ownerName || !phone) {
      setError(true);
      setMessage("Biznes nomi, egasi ismi va telefon raqamini kiriting.");
      return;
    }

    if (!isSignedIn) {
      setError(true);
      setMessage("Claim yuborish uchun avval tizimga kiring.");
      window.location.href = `/${locale}/sign-in`;
      return;
    }

    setSubmitting(true);

    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/claims`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          businessSlug,
          businessName: name,
          ownerName,
          phone
        })
      });

      if (!response.ok) {
        throw new Error(`Claim submit failed: ${response.status}`);
      }

      setError(false);
      setMessage("Claim so'rovi yuborildi. Admin tasdiqlashini kuting.");
      event.currentTarget.reset();
    } catch {
      setError(true);
      setMessage("Claim yuborib bo'lmadi. Qayta urinib ko'ring.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="claim-form" onSubmit={submit}>
      <label>
        <span>Biznes nomi</span>
        <input name="businessName" defaultValue={businessName} placeholder="Masalan: Caravan Coffee" />
      </label>
      <label>
        <span>Egasi ismi</span>
        <input name="ownerName" placeholder="Ism familiya" />
      </label>
      <label>
        <span>Aloqa raqami</span>
        <input name="phone" type="tel" placeholder="+998 90 000 00 00" />
      </label>
      <button className="gold-button" type="submit" disabled={submitting}>
        {submitting ? "Yuborilmoqda..." : "Claim so'rovini boshlash"}
      </button>
      <p className="form-note" style={{ color: error ? "var(--error)" : "var(--primary)" }} role="status">
        {message}
      </p>
    </form>
  );
}
