"use client";

import { useActionState } from "react";
import { editBusinessDetail } from "@/lib/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

export function BusinessEditor({ business }: { business: Editable }) {
  const [state, formAction, pending] = useActionState(editBusinessDetail, { ok: false });

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={business.id} />
      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map((field) => (
          <label key={field.key} className="block space-y-2">
            <span className="text-xs font-medium text-muted-foreground">{field.label}</span>
            <Input name={field.key} type={field.type ?? "text"} defaultValue={business[field.key] ?? ""} />
          </label>
        ))}
        <label className="block space-y-2">
          <span className="text-xs font-medium text-muted-foreground">Price tier</span>
          <Select name="priceTier" defaultValue={business.priceTier ?? "__none"}>
            <SelectTrigger><SelectValue placeholder="— unset —" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none">— unset —</SelectItem>
              <SelectItem value="$">$</SelectItem>
              <SelectItem value="$$">$$</SelectItem>
              <SelectItem value="$$$">$$$</SelectItem>
            </SelectContent>
          </Select>
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="sm" disabled={pending}>{pending ? "Saving…" : "Save changes"}</Button>
        {state.ok ? <span className="text-sm text-good" role="status">Saved.</span> : null}
        {state.error ? <Alert variant="destructive" className="py-2"><AlertDescription>{state.error}</AlertDescription></Alert> : null}
      </div>
    </form>
  );
}
