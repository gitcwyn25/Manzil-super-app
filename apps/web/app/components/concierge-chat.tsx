"use client";

import type { Locale } from "@manzil/shared";
import { getUiCopy } from "@manzil/shared";
import { useEffect, useRef, useState } from "react";
import { API_BASE_URL } from "../lib/api-base-url";
import { pickLocalized } from "../lib/locale-text";
import { parseStages, type PxsStage, type PxsStageEvent } from "../lib/pxs/types";
import { StageList } from "./pxs/stage-list";
import { useMutation } from "./pxs/use-mutation";
import { IconField } from "./vm/icon-field";
import { Icon } from "./vm/icons";
import { PrimaryCta } from "./vm/primary-cta";

type Suggestion = { slug: string; name: string; reason: string };

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  suggestions?: Suggestion[];
  /**
   * Stages the engine reported for *this* answer, if it reported any.
   * Empty for every answer today — see the note on `AskResponse.data.stages`.
   */
  stages?: PxsStage[];
};

type AskResponse = {
  data: {
    text: string;
    businesses: Array<{ businessId: string; slug: string; name: string; reason: string }>;
    available: boolean;
    /**
     * ⛔ THE BINDING RULE — the API contract, shipped ahead of the API.
     *
     * `POST /gurman/ask` does **not** return this field today. It returns text,
     * grounded businesses and an availability flag, and nothing else. So this
     * is optional, `parseStages()` yields `[]` for every real response, and the
     * UI renders the honest indeterminate "thinking" state.
     *
     * What is deliberately NOT done here is the tempting version:
     *
     * ```
     * Reading your preferences… → Comparing 24 restaurants…
     *   → Removing closed places… → Ranking by your budget…
     * ```
     *
     * Gurman does retrieve the catalog, call a model, and run a grounding
     * validator — but this component cannot observe those steps, does not know
     * how many places were compared, and must not say. Inventing that sequence
     * would be a fabricated metric wearing a progress bar, and it is forbidden
     * by exactly the principle that governs the rest of this product
     * (docs/evidence/TRUST-AUDIT.md).
     *
     * When Epic 03's `RecommendationTrace` and Epic 09's conversational layer
     * begin emitting stages in this shape, real stages appear here with no
     * change to this component. The contract is specified in
     * docs/design/PRODUCT-EXPERIENCE-SYSTEM.md § "Server-side contract
     * required".
     */
    stages?: PxsStageEvent[];
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
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "welcome", role: "assistant", text: copy.concierge.welcome }
  ]);

  /**
   * PXS mutation system (Epic 17).
   *
   * This replaces a hand-rolled `inFlight` ref. The single-flight guard now
   * lives inside the primitive, which matters here more than on most surfaces:
   * `/gurman/ask` is throttled to 10 requests per 15 minutes, so a double-tap
   * costs the user a fifth of their daily budget for one question.
   *
   * `refresh: false` — the reply is client state, so there is no server render
   * to revalidate. `successAnnouncement: null` — the transcript is already an
   * `aria-live` region, so the reply announces itself; adding "Saved" would be
   * both redundant and wrong for a chat.
   */
  const ask = useMutation<string, void>({
    locale,
    refresh: false,
    successAnnouncement: null,
    errorTitle: copy.concierge.unavailable,
    run: async (text, { signal }) => {
      const response = await fetch(`${API_BASE_URL}/gurman/ask`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ query: text, locale }),
        signal
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
            : undefined,
          // Whatever the engine reported, and nothing else. `[]` today.
          stages: parseStages(data.stages)
        }
      ]);
    },
    onError: () => {
      // Kept as an in-transcript message as well as the toast: the chat is the
      // record of the conversation, and a turn that failed should stay visible
      // in it rather than vanishing once the toast is dismissed.
      setMessages((current) => [
        ...current,
        { id: `assistant-${Date.now()}`, role: "assistant", text: copy.concierge.unavailable }
      ]);
    }
  });

  const pending = ask.pending;

  // The scroll area follows the newest message; instant (no smooth scroll)
  // when the user prefers reduced motion.
  const messagesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = messagesRef.current;
    if (!node) {
      return;
    }
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    node.scrollTo({ top: node.scrollHeight, behavior: reduceMotion ? "auto" : "smooth" });
  }, [messages, pending]);

  function sendMessage(raw: string) {
    const text = raw.trim();
    // `ask.mutate` refuses re-entry on its own; this only avoids clearing the
    // input for a submission that was never going to be sent.
    if (!text || pending) {
      return;
    }

    setInput("");
    setMessages((current) => [...current, { id: `user-${Date.now()}`, role: "user", text }]);
    ask.mutate(text);
  }

  return (
    <div className="concierge-shell">
      <header className="concierge-head">
        <span aria-hidden="true" className="concierge-head__avatar">
          <Icon name="robot" size={22} />
        </span>
        <div>
          <p className="concierge-head__name">{copy.concierge.assistantName}</p>
          {/* Honest presence: mirrors the actual request state, never a
              blanket "Always online" claim. */}
          <p className="concierge-head__status">
            {pending ? copy.concierge.thinking : copy.concierge.statusReady}
          </p>
        </div>
      </header>

      <div aria-live="polite" className="concierge-messages" ref={messagesRef}>
        {messages.map((message) => (
          <article className={`concierge-message ${message.role}`} key={message.id}>
            <span aria-hidden="true" className="concierge-message__avatar">
              <Icon name={message.role === "assistant" ? "robot" : "user"} size={16} />
            </span>
            <div className="concierge-message__bubble">
              {/* Renders only if this answer arrived with stages attached.
                  Today that is never — `StageList` returns null for an empty
                  list with `busy={false}`, which is the correct, honest
                  rendering of "the engine reported no stages". */}
              {message.stages?.length ? (
                <StageList locale={locale} stages={message.stages} />
              ) : null}
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
            </div>
          </article>
        ))}

        {pending ? (
          <article className="concierge-message assistant is-thinking">
            <span aria-hidden="true" className="concierge-message__avatar">
              <Icon name="robot" size={16} />
            </span>
            <div className="concierge-message__bubble">
              {/*
                ⛔ THE BINDING RULE, at the one place it is hardest to hold.

                An in-flight turn passes `stages={[]}` because nothing has
                reported a stage — `/gurman/ask` is a single request/response
                with no streaming and no trace in its payload. `StageList`
                therefore renders one indeterminate indicator and the word
                "Thinking…", which is a claim this component can actually
                verify: a request is open and no reply has arrived.

                It would be trivial, and would look far more impressive, to
                list "Reading your preferences… / Comparing 24 restaurants…"
                on a timer here. That is precisely the forbidden thing. The
                component is built so it cannot: `stages` is a required prop
                with no default, and there is no stage text anywhere in the
                PXS component tree to copy from.
              */}
              <StageList
                busy
                locale={locale}
                stages={[]}
                waitingLabel={copy.concierge.thinking}
              />
            </div>
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
        <IconField
          className="concierge-form__field"
          disabled={pending}
          icon="sparkles"
          placeholder={copy.concierge.placeholder}
          value={input}
          onChange={(event) => setInput(event.target.value)}
        />
        <PrimaryCta className="concierge-form__send" disabled={pending} shape="pill" type="submit">
          <Icon name="send" size={18} />
          {pending ? copy.concierge.thinking : copy.concierge.send}
        </PrimaryCta>
      </form>
    </div>
  );
}
