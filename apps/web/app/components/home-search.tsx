"use client";

import type { Locale } from "@manzil/shared";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

export function HomeSearch({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("Toshkent");

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();

    if (query.trim()) {
      params.set("q", query.trim());
    }

    params.set("location", location.trim() || "Toshkent");
    router.push(`/${locale}/discover?${params.toString()}`);
  }

  return (
    <form className="search-panel" onSubmit={submitSearch}>
      <label>
        <span>Nima qidiryapsiz?</span>
        <input
          type="search"
          placeholder="Masalan: osh, qahva, go'zallik"
          autoComplete="off"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <label>
        <span>Hudud</span>
        <input value={location} onChange={(event) => setLocation(event.target.value)} />
      </label>
      <button className="primary-button" type="submit">Natijalarni ko'rish</button>
    </form>
  );
}
