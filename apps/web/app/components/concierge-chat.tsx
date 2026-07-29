"use client";

import type { Locale } from "@manzil/shared";
import { getUiCopy } from "@manzil/shared";
import { useRef, useState } from "react";
import { API_BASE_URL } from "../lib/api-base-url";
import { pickLocalized } from "../lib/locale-text";

type Suggestion = { slug: string; name: string; reason: string };

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  suggestions?: Suggestion[];
};

type AskResponse = {
  data: {
    text: string;
    businesses: Array<{ businessId: string; slug: string; name: string; reason: string }>;
    available: boolean;
  };
};

/**
 * The Gurman concierge.
 *
 * This previously called `getConciergeReply()` — a keyword matcher in
 * `@manzil/shared` that returned canned copy. It now asks the real
 * `POST /gurman/ask`, which retrieves the live catalog, calls the model, and
 * runs every suggestion through a grounding validator before returning it.
 *
 * Three honest states: thinking, answered, and unavailable. There is
 * deliberately no fallback that invents places — the whole point of the
 * grounding step is that Gurman only ever names businesses that exist, so a
 * cheerful fake answer when the service is down would defeat it.
 */
export function ConciergeChat({
  locale,
  prompts
}: {
  locale: Locale;
  prompts: Array<{ uz: string; ru: string; en: string }>;
}) {
  const copy = getUiCopy(locale);

  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "welcome", role: "assistant", text: copy.concierge.welcome }
  ]);

  // Guards against a second submit while the first is in flight: the endpoint
  // is throttled to 10 requests per 15 minutes, so a double-tap costs the user
  // a fifth of their budget for one question.
  const inFlight = useRef(false);

  async function sendMessage(raw: string) {
    const text = raw.trim();
    if (!text || inFlight.current) {
      return;
    }

    inFlight.current = true;
    setPending(true);
    setInput("");
    setMessages((current) => [...current, { id: `user-${Date.now()}`, role: "user", text }]);

    try {
      const response = await fetch(`${API_BASE_URL}/gurman/ask`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query: text, locale })
      });

      if (!response.ok) {
        throw new Error(`Gurman responded ${response.status}`);
      }

      const { data } = (await response.json()) as AskResponse;

      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          text: data.available ? data.text : copy.concierge.unavailable,
          suggestions: data.available
            ? data.businesses.map((business) => ({
                slug: business.slug,
                name: business.name,
                reason: business.reason
              }))
            : undefined
        }
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        { id: `assistant-${Date.now()}`, role: "assistant", text: copy.concierge.unavailable }
      ]);
    } finally {
      inFlight.current = false;
      setPending(false);
    }
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
                    href={`/${locale}/businesses/${suggestion.slug}`}
                    key={suggestion.slug}
                  >
                    <strong>{suggestion.name}</strong>
                    <span>{suggestion.reason}</span>
                  </a>
                ))}
              </div>
            ) : null}
          </article>
        ))}

        {pending ? (
          <article className="concierge-message assistant is-thinking">
            <p>
              <span aria-hidden="true" className="concierge-dots">
                <i />
                <i />
                <i />
              </span>
              {copy.concierge.thinking}
            </p>
          </article>
        ) : null}
      </div>

      <div className="concierge-prompts no-scrollbar">
        {prompts.map((prompt) => (
          <button
            className="concierge-prompt"
            disabled={pending}
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
          void sendMessage(input);
        }}
      >
        <input
          disabled={pending}
          placeholder={copy.concierge.placeholder}
          value={input}
          onChange={(event) => setInput(event.target.value)}
        />
        <button className="primary-button" disabled={pending} type="submit">
          {pending ? copy.concierge.thinking : copy.concierge.send}
        </button>
      </form>
    </div>
  );
}
