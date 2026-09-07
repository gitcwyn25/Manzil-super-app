"use client";

import type { Locale } from "@manzil/shared";
import { useState } from "react";
import { WAITLIST_CITIES, getWaitlistCopy, type WaitlistTopic } from "../../lib/waitlist-copy";
import { getPxsCopy } from "../../lib/pxs/copy";
import { CoinLoader } from "../pxs/coin-loader";

export function WaitlistForm({ topic, locale }: { topic: WaitlistTopic; locale: Locale }) {
  const copy = getWaitlistCopy(topic, locale);
  const pendingLabel = getPxsCopy(locale).async.saving;
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [position, setPosition] = useState(0);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setState("sending");
    setError("");

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          topic, locale,
          email: form.get("email"), city: form.get("city"), businessName: form.get("businessName"),
          firstName: form.get("firstName"), lastName: form.get("lastName"),
          heardAbout: form.get("heardAbout"), featureInterest: form.get("featureInterest"),
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
    return <div className="wl-done" role="status" aria-live="polite"><h2>{copy.successTitle}</h2><p>{copy.successBody(position)}</p></div>;
  }

  const isGurman = topic === "gurman";
  return (
    <form className="wl-form" onSubmit={submit}>
      {isGurman ? <>
        <label className="wl-field"><span>{copy.firstNameLabel}</span><input autoComplete="given-name" name="firstName" required type="text" /></label>
        <label className="wl-field"><span>{copy.lastNameLabel}</span><input autoComplete="family-name" name="lastName" required type="text" /></label>
      </> : null}
      {topic === "city" ? <label className="wl-field"><span>{copy.cityLabel}</span><select name="city" required>{WAITLIST_CITIES.map((city) => <option key={city} value={city}>{city}</option>)}</select></label> : null}
      {topic === "pro" ? <label className="wl-field"><span>{copy.businessLabel}</span><input name="businessName" type="text" /></label> : null}
      <label className={isGurman ? "wl-field wl-field--full" : "wl-field"}><span>{copy.emailLabel}</span><input autoComplete="email" name="email" required type="email" /></label>
      {isGurman && copy.heardAboutOptions && copy.featureInterestOptions ? <>
        <fieldset className="wl-field wl-choice-group wl-field--full"><legend>{copy.heardAboutLabel}</legend><div className="wl-choice-grid">{copy.heardAboutOptions.map((option) => <label className="wl-choice" key={option.value}><input name="heardAbout" required type="radio" value={option.value} /><span>{option.label}</span></label>)}</div></fieldset>
        <fieldset className="wl-field wl-choice-group wl-field--full"><legend>{copy.featureInterestLabel}</legend><div className="wl-choice-grid">{copy.featureInterestOptions.map((option) => <label className="wl-choice" key={option.value}><input name="featureInterest" required type="radio" value={option.value} /><span>{option.label}</span></label>)}</div></fieldset>
      </> : null}
      {error ? <p className="wl-error wl-field--full" role="alert">{error}</p> : null}
      <button className="wl-submit wl-field--full" disabled={state === "sending"} type="submit">{state === "sending" ? <><CoinLoader decorative label={pendingLabel} size={18} /><span>{pendingLabel}</span></> : copy.submit}</button>
    </form>
  );
}
