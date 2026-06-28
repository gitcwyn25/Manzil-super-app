"use client";

import type { Locale } from "@manzil/shared";
import { getUiCopy } from "@manzil/shared";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

export function HomeSearch({ locale }: { locale: Locale }) {
  const copy = getUiCopy(locale);
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState(copy.brand.city);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();

    if (query.trim()) {
      params.set("q", query.trim());
    }

    params.set("location", location.trim() || copy.brand.city);
    router.push(`/${locale}/discover?${params.toString()}`);
  }

  return (
    <form className="search-panel glass-panel" onSubmit={submitSearch}>
      <label>
        <span>{copy.search.whatLabel}</span>
        <input
          type="search"
          placeholder={copy.search.whatPlaceholder}
          autoComplete="off"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <label>
        <span>{copy.search.whereLabel}</span>
        <input value={location} onChange={(event) => setLocation(event.target.value)} />
      </label>
      <button className="primary-button" type="submit">{copy.search.submit}</button>
    </form>
  );
}
