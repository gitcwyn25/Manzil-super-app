"use client";

import { useActionState } from "react";
import { updatePlanPrice } from "@/lib/actions";

/** Inline price editor — saves the new monthly price; dynamic, takes effect live. */
export function PlanPriceEditor({ tier, price }: { tier: string; price: number }) {
  const [state, formAction, pending] = useActionState(updatePlanPrice, { ok: false });

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="tier" value={tier} />
      <input
        className="input w-40 tabular-nums"
        defaultValue={price}
        inputMode="numeric"
        name="priceMonthly"
        step={1000}
        type="number"
      />
      <span className="text-sm text-muted">UZS / mo</span>
      <button className="btn-primary btn-xs" disabled={pending} type="submit">
        {pending ? "Saving…" : "Save"}
      </button>
      {state.ok ? <span className="text-xs text-good">✓ saved</span> : null}
      {state.error ? <span className="text-xs text-bad">{state.error}</span> : null}
    </form>
  );
}
