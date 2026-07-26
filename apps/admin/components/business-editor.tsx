"use client";

import { useActionState } from "react";
import { editBusinessDetail } from "@/lib/actions";

type Editable = {
  id: string;
  name: string;
  address: string;
  district: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  priceTier: string | null;
};

const FIELDS: Array<{ key: keyof Omit<Editable, "id">; label: string; type?: string }> = [
  { key: "name", label: "Name" },
  { key: "address", label: "Address" },
  { key: "district", label: "District" },
  { key: "phone", label: "Phone", type: "tel" },
  { key: "email", label: "Email", type: "email" },
  { key: "website", label: "Website", type: "url" }
];

/**
 * Contact/profile editor for a business.
 *
 * Inputs are pre-filled with current values and the action only sends fields
 * that are non-empty, so an untouched optional field is never posted as "" and
 * silently cleared.
 */
export function BusinessEditor({ business }: { business: Editable }) {
  const [state, formAction, pending] = useActionState(editBusinessDetail, { ok: false });

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="id" value={business.id} />

      <div className="grid gap-3 sm:grid-cols-2">
        {FIELDS.map((field) => (
          <label key={field.key} className="block">
            <span className="mb-1 block text-xs font-medium text-muted">{field.label}</span>
            <input
              className="input"
              name={field.key}
              type={field.type ?? "text"}
              defaultValue={business[field.key] ?? ""}
            />
          </label>
        ))}

        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">Price tier</span>
          <select className="input" name="priceTier" defaultValue={business.priceTier ?? ""}>
            <option value="">— unset —</option>
            <option value="$">$</option>
            <option value="$$">$$</option>
            <option value="$$$">$$$</option>
          </select>
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button className="btn-primary btn-xs" disabled={pending} type="submit">
          {pending ? "Saving…" : "Save changes"}
        </button>
        {state.ok ? <span className="text-sm text-good">Saved.</span> : null}
        {state.error ? <span className="text-sm text-bad">{state.error}</span> : null}
      </div>
    </form>
  );
}
