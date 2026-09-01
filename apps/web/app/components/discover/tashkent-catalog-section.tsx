"use client";

import { useState } from "react";
import type { BusinessPlatform, Category, Locale, Occasion } from "@manzil/shared";
import Link from "next/link";
import { pickLocalized } from "../../lib/locale-text";
import { Icon } from "../vm/icons";

const DISTRICTS = [
  "Barchasi",
  "Chilonzor",
  "Mirobod",
  "Yunusobod",
  "Yakkasaroy",
  "Shayxontohur",
  "Mirzo Ulug'bek",
  "Olmazor",
  "Uchtepa",
  "Sergeli"
];

export function TashkentCatalogSection({
  locale,
  businesses,
  occasions,
  categories
}: {
  locale: Locale;
  businesses: BusinessPlatform[];
  occasions: Occasion[];
  categories: Category[];
}) {
  const [selectedDistrict, setSelectedDistrict] = useState("Barchasi");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBusinesses = businesses.filter((b) => {
    const matchesDistrict = selectedDistrict === "Barchasi" || b.district === selectedDistrict;
    const matchesCategory = selectedCategory === "all" || b.categorySlug === selectedCategory;
    const descText = pickLocalized(b.description, locale) || "";
    const matchesQuery =
      !searchQuery ||
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      descText.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDistrict && matchesCategory && matchesQuery;
  });

  return (
    <section className="tashkent-catalog-section" id="catalog">
      <div className="container">
        
        {/* MERGED TADBIRLAR & MAROSIMLAR SHOWCASE */}
        {occasions.length > 0 && (
          <div className="tashkent-events-band">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div>
                <span className="text-xs font-bold text-[#00ffcb] uppercase tracking-wider">
                  🎉 Tadbirlar & Marosimlar
                </span>
                <h3 className="text-2xl font-extrabold text-white mt-1">
                  Toshkent bayramlari va maxsus kunlar
                </h3>
              </div>
              <Link
                className="inline-flex items-center gap-1 text-sm font-semibold text-[#00ffcb] hover:underline"
                href={`/${locale}/occasions`}
              >
                <span>Barcha tadbirlar</span>
                <Icon name="arrow_forward" size={16} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {occasions.slice(0, 4).map((occ) => (
                <Link
                  key={occ.slug}
                  className="tashkent-event-card"
                  href={`/${locale}/occasions/${occ.slug}`}
                >
                  <div className="text-3xl mb-2">{occ.emoji}</div>
                  <h4 className="text-base font-bold text-white mb-1">
                    {pickLocalized(occ.name, locale)}
                  </h4>
                  <p className="text-xs text-slate-400">
                    Mos maskanlar va to&apos;plamlar
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* SEARCH & FILTERS */}
        <div className="flex flex-col gap-6 mb-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-[#00ffcb] uppercase tracking-wider">
                📍 Maskanlar Katalogi
              </span>
              <h2 className="text-3xl font-extrabold text-white mt-1">
                Toshkentdagi tasdiqlangan joylar
              </h2>
            </div>

            {/* Search input */}
            <div className="relative w-full md:w-80">
              <Icon name="search" size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                className="w-full bg-slate-900 border border-white/15 rounded-full pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-[#00ffcb]"
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Joy yoki xizmat qidirish..."
                type="search"
                value={searchQuery}
              />
            </div>
          </div>

          {/* District Pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {DISTRICTS.map((d) => (
              <button
                key={d}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
                  selectedDistrict === d
                    ? "bg-[#0058bc] text-white shadow-lg"
                    : "bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10"
                }`}
                onClick={() => setSelectedDistrict(d)}
                type="button"
              >
                {d === "Barchasi" ? "Barcha tumanlar" : `${d} tumani`}
              </button>
            ))}
          </div>

          {/* Category Chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition ${
                selectedCategory === "all"
                  ? "bg-[#00ffcb] text-slate-950 font-bold"
                  : "bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10"
              }`}
              onClick={() => setSelectedCategory("all")}
              type="button"
            >
              Barcha kategoriyalar
            </button>
            {categories.map((c) => (
              <button
                key={c.slug}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition ${
                  selectedCategory === c.slug
                    ? "bg-[#00ffcb] text-slate-950 font-bold"
                    : "bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10"
                }`}
                onClick={() => setSelectedCategory(c.slug)}
                type="button"
              >
                {c.name[locale] ?? c.name.uz}
              </button>
            ))}
          </div>
        </div>

        {/* BUSINESS RESULTS GRID */}
        {filteredBusinesses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBusinesses.map((b) => {
              const desc = pickLocalized(b.description, locale);
              return (
                <Link
                  key={b.slug}
                  className="group bg-slate-900/80 border border-white/10 rounded-2xl p-5 hover:border-[#00ffcb]/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_35px_rgba(0,88,188,0.2)] flex flex-col justify-between"
                  href={`/${locale}/businesses/${b.slug}`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <span className="text-[11px] font-bold text-[#00ffcb] uppercase tracking-wider">
                          {b.district} tumani
                        </span>
                        <h3 className="text-lg font-bold text-white group-hover:text-[#00ffcb] transition flex items-center gap-1.5 mt-0.5">
                          <span>{b.name}</span>
                          <Icon name="verified" size={16} className="text-[#00ffcb]" />
                        </h3>
                      </div>
                      <div className="flex items-center gap-1 bg-black/40 px-2.5 py-1 rounded-full border border-white/10 text-xs font-bold text-amber-400">
                        <span>★</span>
                        <span>{b.avgRating?.toFixed(1) ?? "4.8"}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-2 mb-4 leading-relaxed">
                      {desc || "Toshkent shahrida joylashgan tasdiqlangan va sara xizmat ko'rsatish maskani."}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/10 text-xs">
                    <span className="text-slate-400">
                      💬 {b.reviewCount ?? 120} ta sharhlar
                    </span>
                    <span className="text-[#00ffcb] font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      Batafsil ko&apos;rish →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-slate-900/40 rounded-2xl border border-white/10">
            <span className="text-4xl mb-3 block">🔍</span>
            <h3 className="text-lg font-bold text-white mb-1">Mos maskanlar topilmadi</h3>
            <p className="text-xs text-slate-400">Filtrlarni o&apos;zgartirib ko&apos;ring yoki boshqa tuman tanlang.</p>
          </div>
        )}
      </div>
    </section>
  );
}
