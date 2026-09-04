"use client";

import { useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ username, password }), credentials: "same-origin" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) { setError(payload.message ?? "Invalid username or password"); return; }
      window.location.assign("/");
    } catch {
      setError("The console is temporarily unavailable. Try again in a moment.");
    } finally {
      setPending(false);
    }
  }

  return <form onSubmit={submit} className="space-y-4" noValidate><div className="space-y-2"><label htmlFor="admin-username" className="text-xs font-medium text-foreground">Work email or username</label><Input id="admin-username" name="username" autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="you@manzilgroup.uz" required /></div><div className="space-y-2"><div className="flex items-center justify-between"><label htmlFor="admin-password" className="text-xs font-medium text-foreground">Password</label><span className="font-data text-[10px] uppercase tracking-[0.1em] text-muted-foreground">Employee account</span></div><Input id="admin-password" name="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" required /></div>{error ? <Alert variant="danger" aria-live="polite"><AlertDescription>{error}</AlertDescription></Alert> : null}<Button type="submit" variant="primary" className="w-full" disabled={pending} aria-busy={pending}>{pending ? <><Loader2 className="size-4 animate-spin" />Opening secure session…</> : <>Enter the control room <ArrowRight className="size-4" /></>}</Button></form>;
}
