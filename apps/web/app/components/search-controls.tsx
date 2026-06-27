"use client";

import type { Category, Locale } from "@manzil/shared";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

export function SearchControls({
  categories,
  category,
  locale,
  query
}: {
  categories: Category[];
  category: string;
  locale: Locale;
  query: string;
}) {
  const router = useRouter();
  const [queryValue, setQueryValue] = useState(query);
  const [categoryValue, setCategoryValue] = useState(category);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();

    if (queryValue.trim()) {
      params.set("q", queryValue.trim());
    }

    if (categoryValue !== "all") {
      params.set("category", categoryValue);
    }

    router.push(`/${locale}/discover?${params.toString()}`);
  }

  return (
    <form className="search-panel" onSubmit={submit} style={{ marginTop: 28 }}>
      <label>
        <span>Qidiruv</span>
        <input
          type="search"
          value={queryValue}
          onChange={(event) => setQueryValue(event.target.value)}
          placeholder="Masalan: osh yoki Yunusobod"
        />
      </label>
      <label>
        <span>Kategoriya</span>
        <select value={categoryValue} onChange={(event) => setCategoryValue(event.target.value)}>
          <option value="all">Hammasi</option>
          {categories.map((item) => (
            <option key={item.id} value={item.slug}>
              {item.name[locale] ?? item.name.uz}
            </option>
          ))}
        </select>
      </label>
      <button className="primary-button" type="submit">Filtrlash</button>
    </form>
  );
}
