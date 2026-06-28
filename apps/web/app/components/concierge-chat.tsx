"use client";

import type { BusinessPlatform, Locale } from "@manzil/shared";
import { getConciergeReply, getUiCopy } from "@manzil/shared";
import { useMemo, useState } from "react";
import { pickLocalized } from "../lib/locale-text";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  suggestions?: Array<{ businessSlug: string; reason: string; businessName: string }>;
};

export function ConciergeChat({
  locale,
  businesses,
  prompts
}: {
  locale: Locale;
  businesses: BusinessPlatform[];
  prompts: Array<{ uz: string; ru: string; en: string }>;
}) {
  const copy = getUiCopy(locale);
  const businessBySlug = useMemo(
    () => new Map(businesses.map((business) => [business.slug, business])),
    [businesses]
  );

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: copy.concierge.welcome
    }
  ]);

  function sendMessage(raw: string) {
    const text = raw.trim();
    if (!text) {
      return;
    }

    const reply = getConciergeReply(text);
    setMessages((current) => [
      ...current,
      { id: `user-${Date.now()}`, role: "user", text },
      {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        text: pickLocalized(reply.text, locale),
        suggestions: reply.suggestions.map((item) => ({
          businessSlug: item.businessSlug,
          reason: pickLocalized(item.reason, locale),
          businessName: businessBySlug.get(item.businessSlug)?.name ?? item.businessSlug
        }))
      }
    ]);
    setInput("");
  }

  return (
    <div className="concierge-shell">
      <div className="concierge-messages" aria-live="polite">
        {messages.map((message) => (
          <article className={`concierge-message ${message.role}`} key={message.id}>
            <p>{message.text}</p>
            {message.suggestions?.length ? (
              <div className="concierge-suggestions">
                {message.suggestions.map((suggestion) => (
                  <a
                    className="concierge-suggestion"
                    href={`/${locale}/businesses/${suggestion.businessSlug}`}
                    key={suggestion.businessSlug}
                  >
                    <strong>{suggestion.businessName}</strong>
                    <span>{suggestion.reason}</span>
                  </a>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </div>

      <div className="concierge-prompts no-scrollbar">
        {prompts.map((prompt) => (
          <button
            className="concierge-prompt"
            key={pickLocalized(prompt, locale)}
            type="button"
            onClick={() => sendMessage(pickLocalized(prompt, locale))}
          >
            {pickLocalized(prompt, locale)}
          </button>
        ))}
      </div>

      <form
        className="concierge-form"
        onSubmit={(event) => {
          event.preventDefault();
          sendMessage(input);
        }}
      >
        <input
          placeholder={copy.concierge.placeholder}
          value={input}
          onChange={(event) => setInput(event.target.value)}
        />
        <button className="primary-button" type="submit">{copy.concierge.send}</button>
      </form>
    </div>
  );
}
