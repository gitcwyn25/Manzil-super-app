"use client";

import type { Category, Locale } from "@manzil/shared";
import { getUiCopy } from "@manzil/shared";
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
  const copy = getUiCopy(locale);
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
    <form className="search-panel glass-panel" onSubmit={submit} style={{ marginTop: 28 }}>
      <label>
        <span>{copy.search.queryLabel}</span>
        <input
          type="search"
          value={queryValue}
          onChange={(event) => setQueryValue(event.target.value)}
          placeholder={copy.search.queryPlaceholder}
        />
      </label>
      <label>
        <span>{copy.search.categoryLabel}</span>
        <select value={categoryValue} onChange={(event) => setCategoryValue(event.target.value)}>
          <option value="all">{copy.search.allCategories}</option>
          {categories.map((item) => (
            <option key={item.id} value={item.slug}>
              {item.name[locale] ?? item.name.uz}
            </option>
          ))}
        </select>
      </label>
      <button className="primary-button" type="submit">{copy.search.filter}</button>
    </form>
  );
}
