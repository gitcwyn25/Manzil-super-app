"use client";

import type { Locale } from "@manzil/shared";
import { useState } from "react";
import { API_BASE_URL } from "../../lib/api-base-url";
import { WAITLIST_CITIES, getWaitlistCopy, type WaitlistTopic } from "../../lib/waitlist-copy";

export function WaitlistForm({
  topic,
  locale
}: {
  topic: WaitlistTopic;
  locale: Locale;
}) {
  const copy = getWaitlistCopy(topic, locale);
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [position, setPosition] = useState(0);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Read the form before any await: the event target is detached afterwards.
    const form = new FormData(event.currentTarget);
    setState("sending");
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/waitlist`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          topic,
          locale,
          email: form.get("email"),
          city: form.get("city"),
          businessName: form.get("businessName"),
          source: `web:${topic}`
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        setError(payload?.message ?? copy.errorGeneric);
        setState("idle");
        return;
      }

      setPosition(payload.data.position);
      setState("done");
    } catch {
      setError(copy.errorGeneric);
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <div className="wl-done" role="status">
        <h2>{copy.successTitle}</h2>
        <p>{copy.successBody(position)}</p>
      </div>
    );
  }

  return (
    <form className="wl-form" onSubmit={submit}>
      {topic === "city" ? (
        <label className="wl-field">
          <span>{copy.cityLabel}</span>
          <select name="city" required>
            {WAITLIST_CITIES.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </label>
      ) : null}

      {topic === "pro" ? (
        <label className="wl-field">
          <span>{copy.businessLabel}</span>
          <input name="businessName" type="text" />
        </label>
      ) : null}

      <label className="wl-field">
        <span>{copy.emailLabel}</span>
        <input autoComplete="email" name="email" required type="email" />
      </label>

      {error ? <p className="wl-error">{error}</p> : null}

      <button className="wl-submit" disabled={state === "sending"} type="submit">
        {copy.submit}
      </button>
    </form>
  );
}
