"use client";

import { useActionState } from "react";
import { publishLegalDocument } from "@/lib/actions";

/**
 * Publishes a new legal document version.
 *
 * There is no edit form anywhere by design — the only write operation on legal
 * text is publishing a new version, because acceptances are bound to the exact
 * version they were made against.
 */
export function PublishLegalForm() {
  const [state, formAction, pending] = useActionState(publishLegalDocument, { ok: false });

  return (
    <details className="card p-5">
      <summary className="cursor-pointer text-sm font-semibold">Publish a new version</summary>

      <form action={formAction} className="mt-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">Kind</span>
            <select className="input" name="kind" defaultValue="terms_of_service" required>
              <option value="terms_of_service">Terms of service</option>
              <option value="privacy_policy">Privacy policy</option>
              <option value="contract_template">Contract template</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">Version</span>
            <input className="input" name="version" placeholder="1.0" required />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">Locale</span>
            <select className="input" name="locale" defaultValue="uz">
              <option value="uz">uz</option>
              <option value="ru">ru</option>
              <option value="en">en</option>
            </select>
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">Title</span>
          <input className="input" name="title" required />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">
            Body (markdown)
          </span>
          <textarea className="input min-h-[220px] font-mono text-xs" name="body" required />
        </label>

        <p className="text-xs text-muted">
          For a contract template, use <code>{"{{businessName}}"}</code>,{" "}
          <code>{"{{legalName}}"}</code>, <code>{"{{taxId}}"}</code>,{" "}
          <code>{"{{contractNo}}"}</code>, and <code>{"{{date}}"}</code> — they are substituted once,
          at acceptance, and then frozen.
        </p>

        <div className="flex items-center gap-3">
          <button className="btn-primary btn-xs" disabled={pending} type="submit">
            {pending ? "Publishing…" : "Publish version"}
          </button>
          {state.ok ? <span className="text-sm text-good">Published.</span> : null}
          {state.error ? <span className="text-sm text-bad">{state.error}</span> : null}
        </div>
      </form>
    </details>
  );
}
