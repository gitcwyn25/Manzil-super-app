"use client";

import { useActionState } from "react";
import { upsertCategory } from "@/lib/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function CategoryEditor({ categories }: { categories: Array<{ id: string; nameEn: string }> }) {
  const [state, formAction, pending] = useActionState(upsertCategory, { ok: false });

  return (
    <details className="rounded-[10px] border border-border bg-card text-card-foreground shadow-[0_1px_2px_rgba(18,36,40,0.03)]">
      <summary className="cursor-pointer px-5 py-4 text-sm font-semibold">Add or edit a category</summary>
      <form action={formAction} className="space-y-4 border-t border-border p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-xs font-medium text-muted-foreground">Edit existing (leave blank to create)</span>
            <Select name="id" defaultValue="__create">
              <SelectTrigger><SelectValue placeholder="— create new —" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__create">— create new —</SelectItem>
                {categories.map((category) => <SelectItem key={category.id} value={category.id}>{category.nameEn}</SelectItem>)}
              </SelectContent>
            </Select>
          </label>
          <label className="block space-y-2"><span className="text-xs font-medium text-muted-foreground">Slug (lowercase, digits, hyphens)</span><Input name="slug" pattern="[a-z0-9-]+" placeholder="coffee-shops" required /></label>
          <label className="block space-y-2"><span className="text-xs font-medium text-muted-foreground">English name</span><Input name="nameEn" required /></label>
          <label className="block space-y-2"><span className="text-xs font-medium text-muted-foreground">O&apos;zbekcha nomi</span><Input name="nameUz" required /></label>
          <label className="block space-y-2"><span className="text-xs font-medium text-muted-foreground">Русское название</span><Input name="nameRu" required /></label>
          <label className="block space-y-2">
            <span className="text-xs font-medium text-muted-foreground">Parent (optional)</span>
            <Select name="parentId" defaultValue="__none">
              <SelectTrigger><SelectValue placeholder="— top level —" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">— top level —</SelectItem>
                {categories.map((category) => <SelectItem key={category.id} value={category.id}>{category.nameEn}</SelectItem>)}
              </SelectContent>
            </Select>
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" size="sm" disabled={pending}>{pending ? "Saving…" : "Save category"}</Button>
          {state.ok ? <span className="text-sm text-good" role="status">Saved.</span> : null}
          {state.error ? <Alert variant="destructive" className="py-2"><AlertDescription>{state.error}</AlertDescription></Alert> : null}
        </div>
      </form>
    </details>
  );
}
