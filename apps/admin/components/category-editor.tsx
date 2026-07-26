"use client";

import { useActionState } from "react";
import { upsertCategory } from "@/lib/actions";

/**
 * Create or edit one category.
 *
 * Editing is by id: leave it blank to create. Kept as a single form rather than
 * an inline per-row editor because the taxonomy is small and changes rarely —
 * a row-level edit affordance would be more UI than the task warrants.
 */
export function CategoryEditor({
  categories
}: {
  categories: Array<{ id: string; nameEn: string }>;
}) {
  const [state, formAction, pending] = useActionState(upsertCategory, { ok: false });

  return (
    <details className="card p-5">
      <summary className="cursor-pointer text-sm font-semibold">Add or edit a category</summary>

      <form action={formAction} className="mt-4 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">
              Edit existing (leave blank to create)
            </span>
            <select className="input" name="id" defaultValue="">
              <option value="">— create new —</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.nameEn}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">
              Slug (lowercase, digits, hyphens)
            </span>
            <input
              className="input"
              name="slug"
              pattern="[a-z0-9-]+"
              placeholder="coffee-shops"
              required
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">English name</span>
            <input className="input" name="nameEn" required />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">O&apos;zbekcha nomi</span>
            <input className="input" name="nameUz" required />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">Русское название</span>
            <input className="input" name="nameRu" required />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">Parent (optional)</span>
            <select className="input" name="parentId" defaultValue="">
              <option value="">— top level —</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.nameEn}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex items-center gap-3">
          <button className="btn-primary btn-xs" disabled={pending} type="submit">
            {pending ? "Saving…" : "Save category"}
          </button>
          {state.ok ? <span className="text-sm text-good">Saved.</span> : null}
          {state.error ? <span className="text-sm text-bad">{state.error}</span> : null}
        </div>
      </form>
    </details>
  );
}
