"use client";

import { useActionState } from "react";
import { publishLegalDocument } from "@/lib/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function PublishLegalForm() {
  const [state, formAction, pending] = useActionState(publishLegalDocument, { ok: false });

  return (
    <details className="rounded-[10px] border border-border bg-card text-card-foreground shadow-[0_1px_2px_rgba(18,36,40,0.03)]">
      <summary className="cursor-pointer px-5 py-4 text-sm font-semibold">Publish a new version</summary>
      <form action={formAction} className="space-y-4 border-t border-border p-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block space-y-2">
            <span className="text-xs font-medium text-muted-foreground">Kind</span>
            <Select name="kind" defaultValue="terms_of_service">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="terms_of_service">Terms of service</SelectItem><SelectItem value="privacy_policy">Privacy policy</SelectItem><SelectItem value="contract_template">Contract template</SelectItem></SelectContent>
            </Select>
          </label>
          <label className="block space-y-2"><span className="text-xs font-medium text-muted-foreground">Version</span><Input name="version" placeholder="1.0" required /></label>
          <label className="block space-y-2">
            <span className="text-xs font-medium text-muted-foreground">Locale</span>
            <Select name="locale" defaultValue="uz">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="uz">uz</SelectItem><SelectItem value="ru">ru</SelectItem><SelectItem value="en">en</SelectItem></SelectContent>
            </Select>
          </label>
        </div>
        <label className="block space-y-2"><span className="text-xs font-medium text-muted-foreground">Title</span><Input name="title" required /></label>
        <label className="block space-y-2"><span className="text-xs font-medium text-muted-foreground">Body (markdown)</span><Textarea className="min-h-[220px] font-data text-xs" name="body" required /></label>
        <p className="text-xs leading-5 text-muted-foreground">For a contract template, use <code>{"{{businessName}}"}</code>, <code>{"{{legalName}}"}</code>, <code>{"{{taxId}}"}</code>, <code>{"{{contractNo}}"}</code>, and <code>{"{{date}}"}</code>. They are substituted once, at acceptance, then frozen.</p>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" size="sm" disabled={pending}>{pending ? "Publishing…" : "Publish version"}</Button>
          {state.ok ? <span className="text-sm text-good" role="status">Published.</span> : null}
          {state.error ? <Alert variant="destructive" className="py-2"><AlertDescription>{state.error}</AlertDescription></Alert> : null}
        </div>
      </form>
    </details>
  );
}
