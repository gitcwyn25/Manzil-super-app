"use client";

import { useAuth } from "@clerk/nextjs";
import type { Locale } from "@manzil/shared";
import { getUiCopy } from "@manzil/shared";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { API_BASE_URL } from "../lib/api-base-url";
import { revalidateBusinessProfile } from "../lib/revalidate-actions";

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

const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

/**
 * Presigns and uploads one review photo. Returns false on any failure so the
 * caller can report that the review saved but the photo did not — the review
 * is the thing the user came to do, and losing it to a photo problem would be
 * the worse outcome.
 */
async function uploadReviewPhoto(
  file: File,
  reviewId: string,
  token: string | null
): Promise<boolean> {
  try {
    const presign = await fetch(`${API_BASE_URL}/media/presign`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        ownerType: "review",
        ownerId: reviewId,
        contentType: file.type,
        contentLength: file.size
      })
    });

    if (!presign.ok) return false;

    const { data } = await presign.json();

    // Content-Type and Content-Length are signed into the URL, so these headers
    // must be replayed exactly or R2 rejects the signature.
    const put = await fetch(data.uploadUrl, {
      method: "PUT",
      headers: data.requiredHeaders,
      body: file
    });

    return put.ok;
  } catch {
    return false;
  }
}

export function ReviewForm({ businessSlug, locale }: { businessSlug: string; locale: Locale }) {
  // `isLoaded` matters as much as `isSignedIn`: until Clerk hydrates,
  // `isSignedIn` is false for everyone, so a signed-in user who submits during
  // that window would be bounced to sign-in for no reason.
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const copy = getUiCopy(locale);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pendingPhoto, setPendingPhoto] = useState<File | null>(null);
  const router = useRouter();

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

    if (!isLoaded) {
      // Genuinely unknown yet — say so rather than redirecting someone who is
      // in fact signed in.
      setError(true);
      setMessage(copy.business.writeWait);
      return;
    }

    if (!isSignedIn) {
      setError(true);
      setMessage(copy.business.writeSignIn);
      // Carry the current page so sign-in returns here rather than dumping the
      // user on the homepage with their half-written review lost.
      const back = encodeURIComponent(`/${locale}/businesses/${businessSlug}`);
      window.location.href = `/${locale}/sign-in?redirect_url=${back}`;
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

      // The photo is attached after the review exists, because a review photo
      // is owned by its review — there is no id to presign against until the
      // review has been created.
      const created = (await response.json().catch(() => null)) as
        | { data?: { review?: { id?: string } } }
        | null;
      const reviewId = created?.data?.review?.id;

      if (pendingPhoto && reviewId) {
        const uploaded = await uploadReviewPhoto(pendingPhoto, reviewId, token);

        if (!uploaded) {
          // The review itself saved — say so, and be specific that only the
          // photo failed. Reporting a blanket failure here would push the user
          // to resubmit and hit the duplicate-review constraint.
          setError(false);
          setMessage(
            "Sharhingiz qabul qilindi, ammo rasmni yuklab bo'lmadi. Rasmni keyinroq qo'shishingiz mumkin."
          );
          setPendingPhoto(null);
          formElement.reset();
          return;
        }
      }

      setError(false);
      setMessage(
        pendingPhoto
          ? "Sharhingiz va rasmingiz qabul qilindi. Moderatsiyadan so'ng ko'rinadi."
          : "Sharhingiz qabul qilindi."
      );
      setPendingPhoto(null);
      formElement.reset();

      // Bust the 30s profile cache and re-render, so the review the user just
      // wrote is actually on screen. Without this the success message is a
      // promise the page does not keep for up to half a minute.
      await revalidateBusinessProfile(locale, businessSlug);
      router.refresh();
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
      <label>
        <span>Rasm qo&apos;shish (ixtiyoriy)</span>
        <input
          accept={ALLOWED_PHOTO_TYPES.join(",")}
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null;

            if (file && !ALLOWED_PHOTO_TYPES.includes(file.type)) {
              setError(true);
              setMessage("Faqat JPEG, PNG, WebP yoki AVIF rasmlar qabul qilinadi.");
              event.target.value = "";
              return;
            }

            if (file && file.size > MAX_PHOTO_BYTES) {
              setError(true);
              setMessage("Rasm hajmi 8MB dan oshmasligi kerak.");
              event.target.value = "";
              return;
            }

            setMessage("");
            setPendingPhoto(file);
          }}
          type="file"
        />
      </label>

      <button className="primary-button" type="submit" disabled={submitting || !isLoaded}>
        {submitting ? "Yuborilmoqda..." : "Sharhni yuborish"}
      </button>
      <p className="form-note" style={{ color: error ? "var(--error)" : "var(--primary)" }} role="status">
        {message}
      </p>
    </form>
  );
}
