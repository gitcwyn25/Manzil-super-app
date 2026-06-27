"use client";

import { type FormEvent, useState } from "react";

export function ClaimForm({
  businessName,
  businessSlug
}: {
  businessName?: string;
  businessSlug?: string;
}) {
  const [message, setMessage] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("businessName") ?? "").trim();
    const phone = String(form.get("phone") ?? "").trim();

    if (!name || !phone) {
      setMessage("Biznes nomi va telefon raqamini kiriting.");
      return;
    }

    setMessage(`Claim so'rovi demo holatida qabul qilindi: ${businessSlug ?? name}.`);
    event.currentTarget.reset();
  }

  return (
    <form className="claim-form" onSubmit={submit}>
      <label>
        <span>Biznes nomi</span>
        <input name="businessName" defaultValue={businessName} placeholder="Masalan: Caravan Coffee" />
      </label>
      <label>
        <span>Aloqa raqami</span>
        <input name="phone" type="tel" placeholder="+998 90 000 00 00" />
      </label>
      <button className="gold-button" type="submit">Claim so'rovini boshlash</button>
      <p className="form-note" role="status">{message}</p>
    </form>
  );
}
