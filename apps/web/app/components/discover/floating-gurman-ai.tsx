"use client";

import { useState } from "react";
import type { Locale } from "@manzil/shared";
import Link from "next/link";
import { Icon } from "../vm/icons";

const PROMPT_CHIPS: Record<Locale, string[]> = {
  uz: [
    "☕ Shanba oqshomi uchun sokin qahvaxona",
    "🍽️ Toshkentda eng sara milliy taomlar",
    "🚗 Professional avtoyuvish va detailing",
    "🎉 To'y va marosimlar uchun shinam to'yxona"
  ],
  ru: [
    "☕ Уютная кофейня на вечер субботы",
    "🍽️ Лучшие заведения национальной кухни",
    "🚗 Профессиональный автосервис и детейлинг",
    "🎉 Банкетный зал для семейного торжества"
  ],
  en: [
    "☕ Quiet specialty café for Saturday evening",
    "🍽️ Top authentic national cuisine spots",
    "🚗 Premium car detailing & wash service",
    "🎉 Elegant banquet hall for family events"
  ]
};

const SAMPLE_ANSWERS: Record<Locale, { title: string; desc: string; place: string; rating: string }> = {
  uz: {
    title: "✨ Gurman AI tavsiyasi:",
    desc: "Sharhlar va joylashuv tahliliga ko'ra sizga ajoyib maskan topildi:",
    place: "Breadly Bakery & Café (Mirobod)",
    rating: "⭐ 4.9 (189 ta tasdiqlangan sharhlar)"
  },
  ru: {
    title: "✨ Рекомендация Gurman AI:",
    desc: "По отзывам гостей и рейтингу подобрано идеальное место:",
    place: "Breadly Bakery & Café (Мирабадский р-н)",
    rating: "⭐ 4.9 (189 проверенных отзывов)"
  },
  en: {
    title: "✨ Gurman AI Recommendation:",
    desc: "Based on authentic ratings and atmosphere analysis:",
    place: "Breadly Bakery & Café (Mirobod district)",
    rating: "⭐ 4.9 (189 verified guest reviews)"
  }
};

export function FloatingGurmanAi({ locale }: { locale: Locale }) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [messages, setMessages] = useState<
    { role: "user" | "assistant"; text: string; card?: { title: string; desc: string; place: string; rating: string } }[]
  >([]);
  const [isTyping, setIsTyping] = useState(false);

  const chips = PROMPT_CHIPS[locale] ?? PROMPT_CHIPS.uz;
  const sample = SAMPLE_ANSWERS[locale] ?? SAMPLE_ANSWERS.uz;

  const handleSend = (textToSend?: string) => {
    const q = textToSend || inputVal;
    if (!q.trim()) return;

    setMessages((prev) => [...prev, { role: "user", text: q }]);
    setInputVal("");
    setIsTyping(true);

    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: `${q} bo'yicha Manzil bazasidagi haqiqiy sharhlar va ma'lumotlar tahlil qilindi.`,
          card: sample
        }
      ]);
    }, 900);
  };

  return (
    <>
      {/* Floating 1-Click Launch Button */}
      <button
        className="floating-gurman-btn"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        aria-label="Gurman AI Concierge"
      >
        <span className="text-lg">✨</span>
        <span>Gurman AI</span>
      </button>

      {/* Interactive AI Drawer */}
      {isOpen && (
        <div className="floating-gurman-drawer" role="dialog" aria-label="Gurman AI Drawer">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-slate-900/90 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00ffcb] animate-pulse" />
              <div>
                <h4 className="text-sm font-extrabold text-white">Gurman AI Konsyerj</h4>
                <span className="text-[11px] text-[#00ffcb]">Online · Toshkent</span>
              </div>
            </div>
            <button
              className="text-slate-400 hover:text-white p-1 rounded-full text-lg leading-none"
              onClick={() => setIsOpen(false)}
              type="button"
            >
              &times;
            </button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3 text-xs">
            <div className="bg-white/5 p-3 rounded-2xl border border-white/10 text-slate-200">
              👋 <strong>Assalomu alaykum!</strong> Toshkentda qanday joy yoki tadbir izlayapsiz? Menga yozing, mos maskanlarni tavsiya qilaman.
            </div>

            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-2xl max-w-[88%] ${
                  m.role === "user"
                    ? "self-end bg-[#0058bc] text-white rounded-tr-none"
                    : "self-start bg-white/10 text-slate-100 rounded-tl-none border border-white/10"
                }`}
              >
                <div>{m.text}</div>
                {m.card && (
                  <div className="mt-2.5 p-2.5 bg-black/40 rounded-xl border border-white/10">
                    <div className="font-bold text-[#00ffcb] mb-1">{m.card.place}</div>
                    <div className="text-[11px] text-amber-300 font-semibold mb-1">{m.card.rating}</div>
                    <div className="text-[11px] text-slate-300">{m.card.desc}</div>
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="self-start p-3 bg-white/5 rounded-2xl text-slate-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00ffcb] animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#00ffcb] animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-[#00ffcb] animate-bounce [animation-delay:0.4s]" />
                <span>Gurman qidirmoqda...</span>
              </div>
            )}
          </div>

          {/* Suggestion Chips */}
          <div className="px-3 py-2 flex gap-1.5 overflow-x-auto border-t border-white/5 no-scrollbar">
            {chips.map((chip, i) => (
              <button
                key={i}
                className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/5 hover:bg-[#0058bc]/40 text-slate-200 hover:text-white border border-white/10 whitespace-nowrap transition"
                onClick={() => handleSend(chip)}
                type="button"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-slate-900 border-t border-white/10 flex items-center gap-2">
            <input
              className="flex-1 bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 outline-none focus:border-[#00ffcb]"
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
              placeholder="Masalan: shinam qahvaxona..."
              type="text"
              value={inputVal}
            />
            <button
              className="bg-[#00ffcb] text-slate-950 font-bold p-2 rounded-xl text-xs flex items-center justify-center hover:bg-[#38bdf8] transition"
              onClick={() => handleSend()}
              type="button"
            >
              <Icon name="send" size={16} />
            </button>
          </div>

          {/* Footer link to full concierge */}
          <div className="p-2 text-center bg-black/50 text-[11px] text-slate-400">
            <Link className="text-[#00ffcb] hover:underline" href={`/${locale}/concierge`}>
              To&apos;liq Gurman AI sahifasiga o&apos;tish →
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
