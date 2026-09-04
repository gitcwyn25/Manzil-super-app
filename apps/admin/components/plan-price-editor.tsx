"use client";

import { useActionState } from "react";
import { updatePlanPrice } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PlanPriceEditor({ tier, price }: { tier: string; price: number }) {
  const [state, formAction, pending] = useActionState(updatePlanPrice, { ok: false });

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="tier" value={tier} />
      <Input className="w-40 tabular-nums" defaultValue={price} inputMode="numeric" name="priceMonthly" step={1000} type="number" />
      <span className="text-sm text-muted-foreground">UZS / mo</span>
      <Button size="sm" type="submit" disabled={pending}>{pending ? "Saving…" : "Save"}</Button>
      {state.ok ? <span className="text-xs text-good" role="status">Saved</span> : null}
      {state.error ? <span className="text-xs text-danger" role="alert">{state.error}</span> : null}
    </form>
  );
}
