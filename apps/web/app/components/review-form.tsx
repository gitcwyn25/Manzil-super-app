"use client";

import { useAuth } from "@clerk/nextjs";
import type { Locale } from "@manzil/shared";
import { type FormEvent, useState } from "react";
import { API_BASE_URL } from "../lib/api-base-url";

/**
 * Pulls a human-readable reason out of a failed API response.
 *
 * NestJS returns `{ message }` for HttpExceptions, where `message` is a string
 * for most errors but an **array** of strings from ValidationPipe. Handling
 * only the string case would render "[object Object]" to the user on exactly
 * the validation errors they can act on.
 */
async function readErrorMessage(response: Response): Promise<string> {
  const fallbackByStatus: Record<number, string> = {
    401: "Sessiya muddati tugagan. Iltimos, qaytadan tizimga kiring.",
    403: "Bu amalni bajarishga ruxsatingiz yo'q.",
    409: "Siz bu biznesga allaqachon sharh qoldirgansiz.",
    429: "Juda ko'p urinish. Bir oz kutib, qayta urinib ko'ring."
  };

  try {
    const body = await response.json();
    const raw = body?.message;

    if (Array.isArray(raw) && raw.length > 0) return raw.join(". ");
    if (typeof raw === "string" && raw.trim().length > 0) return raw;
  } catch {
    // Non-JSON body (proxy error page, empty 502) — fall through to status.
  }

  return fallbackByStatus[response.status] ?? `Sharhni yuborib bo'lmadi (${response.status}).`;
}

export function ReviewForm({ businessSlug, locale }: { businessSlug: string; locale: Locale }) {
  const { getToken, isSignedIn } = useAuth();
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Capture the element now. `event.currentTarget` is only valid while the
    // event is being dispatched — it is null once this handler yields at the
    // first `await`. Reading it after the fetch threw a TypeError that the
    // catch below reported as a submit failure, on submissions that had in
    // fact succeeded and saved.
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
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
        // The API returns a structured { message } for validation and auth
        // failures. Showing it tells the user what to actually do — "sign in
        // again", "review is too short" — instead of a generic retry prompt
        // that is wrong advice for most of these cases.
        setError(true);
        setMessage(await readErrorMessage(response));
        return;
      }

      setError(false);
      setMessage("Sharhingiz qabul qilindi. Sahifa yangilanishi bilan ko'rinadi.");
      formElement.reset();
    } catch {
      // Only genuinely unexpected failures reach here now: the network never
      // completed, or the response was not JSON. A retry is sound advice for
      // those, and only those.
      setError(true);
      setMessage("Sharhni yuborib bo'lmadi. Internet aloqasini tekshirib, qayta urinib ko'ring.");
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
