"use client";

import { type FormEvent, useState } from "react";

export function ReviewForm({ businessSlug }: { businessSlug: string }) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = String(form.get("text") ?? "").trim();

    if (text.length < 20) {
      setError(true);
      setMessage("Sharh kamida 20 ta belgidan iborat bo'lishi kerak.");
      return;
    }

    setError(false);
    setMessage(`Demo qabul qilindi. API ulanganda sharh ${businessSlug} uchun saqlanadi.`);
    event.currentTarget.reset();
  }

  return (
    <form className="review-form" onSubmit={submit}>
      <label>
        <span>Reyting</span>
        <select name="rating" defaultValue="5">
          <option value="5">5 - A'lo</option>
          <option value="4">4 - Yaxshi</option>
          <option value="3">3 - O'rtacha</option>
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
      <button className="primary-button" type="submit">Sharhni yuborish</button>
      <p className="form-note" style={{ color: error ? "var(--error)" : "var(--primary)" }} role="status">
        {message}
      </p>
    </form>
  );
}
