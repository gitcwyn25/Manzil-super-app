"use client";

import { useAuth } from "@clerk/nextjs";
import type { Locale } from "@manzil/shared";
import { type FormEvent, useState } from "react";
import { API_BASE_URL } from "../lib/api-base-url";

export function ReviewForm({ businessSlug, locale }: { businessSlug: string; locale: Locale }) {
  const { getToken, isSignedIn } = useAuth();
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = String(form.get("text") ?? "").trim();
    const rating = Number(form.get("rating") ?? 5);

    if (text.length < 20) {
      setError(true);
      setMessage("Sharh kamida 20 ta belgidan iborat bo'lishi kerak.");
      return;
    }

    if (!isSignedIn) {
      setError(true);
      setMessage("Sharh yozish uchun avval tizimga kiring.");
      window.location.href = `/${locale}/sign-in`;
      return;
    }

    setSubmitting(true);

    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/businesses/${businessSlug}/reviews`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ rating, text })
      });

      if (!response.ok) {
        throw new Error(`Review submit failed: ${response.status}`);
      }

      setError(false);
      setMessage("Sharhingiz qabul qilindi. Sahifa yangilanishi bilan ko'rinadi.");
      event.currentTarget.reset();
    } catch {
      setError(true);
      setMessage("Sharhni yuborib bo'lmadi. Qayta urinib ko'ring.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="review-form" onSubmit={submit}>
      <label>
        <span>Reyting</span>
        <select name="rating" defaultValue="5">
          <option value="5">5 - A&apos;lo</option>
          <option value="4">4 - Yaxshi</option>
          <option value="3">3 - O&apos;rtacha</option>
          <option value="2">2 - Qoniqarsiz</option>
          <option value="1">1 - Tavsiya qilmayman</option>
        </select>
      </label>
      <label>
        <span>Sharhingiz</span>
        <textarea
          name="text"
          rows={4}
          minLength={20}
          placeholder="Nima yoqdi? Narx, xizmat, muhit haqida yozing."
        />
      </label>
      <button className="primary-button" type="submit" disabled={submitting}>
        {submitting ? "Yuborilmoqda..." : "Sharhni yuborish"}
      </button>
      <p className="form-note" style={{ color: error ? "var(--error)" : "var(--primary)" }} role="status">
        {message}
      </p>
    </form>
  );
}
