"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useApp } from "./providers";
import { Mark } from "./shell";
import { Notice } from "./ui";
type Mode = "login" | "signup" | "forgot" | "reset";
import { localPath } from "../lib/navigation";
export function AuthForm({ callback = false }: { callback?: boolean }) {
  const { user } = useApp();
  const [mode, setMode] = useState<Mode>("login"), [notice, setNotice] = useState(""), [error, setError] = useState(""), [busy, setBusy] = useState(callback), [show, setShow] = useState(false), [factor, setFactor] = useState(""), [challengeId, setChallengeId] = useState(""), [next, setNext] = useState("/profile");
  const handled = useRef(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setNext(localPath(params.get("next")));
    const m = params.get("mode"); if (m === "signup" || m === "forgot" || m === "reset") setMode(m);
    if (!callback || handled.current) return;
    handled.current = true;
    const client = supabase();
    if (!client) { setError("Account access is being configured. Please try again later."); setBusy(false); return; }
    void (async () => {
      try {
        const providerError = params.get("error_description");
        if (providerError) throw new Error(providerError);
        const code = params.get("code");
        if (!code) throw new Error("This confirmation link is incomplete. Request a new link from the sign-in page.");
        const { error: exchangeError } = await client.auth.exchangeCodeForSession(code);
        window.history.replaceState({}, "", "/auth/callback");
        if (exchangeError) throw new Error("This link has expired or was opened in a different browser. Request a new link and open it in the browser where you signed up.");
        await finishSignIn(localPath(params.get("next"))); setBusy(false);
      } catch (e) { setError((e as Error).message); setBusy(false); }
    })();
  }, [callback]);
  async function finishSignIn(destination = next) {
    setNext(destination);
    const client = supabase()!;
    const { data, error: assuranceError } = await client.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assuranceError) throw assuranceError;
    if (data?.nextLevel === "aal2" && data.currentLevel !== "aal2") {
      const { data: factors, error: factorsError } = await client.auth.mfa.listFactors();
      if (factorsError) throw factorsError;
      const selected = factors.all.find(f => f.status === "verified" && f.factor_type === "totp") || factors.all.find(f => f.status === "verified" && f.factor_type === "phone");
      if (!selected) throw new Error("Your account needs a second factor. Complete that verification with your account provider, then sign in again.");
      const challenge = await client.auth.mfa.challenge({ factorId: selected.id });
      if (challenge.error) throw challenge.error;
      setFactor(selected.id); setChallengeId(challenge.data.id); setNotice(selected.factor_type === "phone" ? "Enter the code sent to your verified phone." : "Enter the code from your authenticator app.");
      return;
    }
    window.location.assign(destination);
  }
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(""); setNotice(""); setBusy(true);
    const fields = new FormData(e.currentTarget), client = supabase();
    try {
      if (!client) throw new Error("Account access is being configured. Please try again later.");
      const email = String(fields.get("email") || "").trim(), password = String(fields.get("password") || "");
      if (factor) {
        const verified = await client.auth.mfa.verify({ factorId: factor, challengeId, code: String(fields.get("code") || "").trim() });
        if (verified.error) throw verified.error;
        window.location.assign(next); return;
      }
      if (mode === "login") {
        const result = await client.auth.signInWithPassword({ email, password });
        if (result.error) throw result.error;
        await finishSignIn();
      } else if (mode === "signup") {
        const result = await client.auth.signUp({ email, password, options: { data: { full_name: String(fields.get("name") || "").trim() }, emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` } });
        if (result.error) throw result.error;
        if (result.data.session) await finishSignIn();
        else setNotice("Check your email for the confirmation link. Open it in this browser, then return here to sign in. Check spam if it has not arrived.");
      } else if (mode === "forgot") {
        const result = await client.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent("/auth?mode=reset")}` });
        if (result.error) throw result.error;
        setNotice("If an account exists for that address, a password-reset link will arrive by email. Open it in this browser.");
      } else {
        if (!user) throw new Error("Open the password-reset link from your email first.");
        const result = await client.auth.updateUser({ password });
        if (result.error) throw result.error;
        await client.auth.signOut({ scope: "global" }); setMode("login"); setNotice("Password updated. Sign in with your new password.");
      }
    } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  function changeMode(nextMode: Mode) { setMode(nextMode); setError(""); setNotice(""); setFactor(""); }
  const title = factor ? "One more step" : callback ? "Confirming your account" : mode === "signup" ? "Your city. Your discoveries." : mode === "forgot" ? "Reset your password" : mode === "reset" ? "Choose a new password" : "Welcome to Manzil";
  return <div className="auth-layout container"><aside className="auth-story"><Mark/><span className="eyebrow">A LITTLE LOCAL KNOWLEDGE GOES A LONG WAY</span><h1>Make room for your next favourite.</h1><p>Save a place worth visiting. Share an experience that matters. Help your neighbourhood shine.</p><div className="auth-arches"><span/><span/><span/></div></aside><section className="auth-card"><span className="eyebrow">MANZIL REVIEWS</span><h2>{title}</h2><p className="muted">{mode === "signup" ? "Create your account to save places and share honest reviews." : "A local perspective starts with you."}</p>{error && <Notice error>{error}</Notice>}{notice && <Notice>{notice}</Notice>}{callback && !factor ? <><p>{busy ? "Please wait while your link is verified…" : "You can request a new confirmation or recovery link."}</p><Link className="button secondary" href="/auth">Back to sign in</Link></> : <form onSubmit={submit} className="stack-form">{factor ? <label>Verification code<input name="code" autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" minLength={6} maxLength={6} required autoFocus/></label> : <>{mode === "signup" && <label>Your name<input name="name" autoComplete="name" minLength={2} maxLength={100} required/></label>}{mode !== "reset" && <label>Email address<input name="email" type="email" autoComplete="email" maxLength={254} required/></label>}{mode !== "forgot" && <label>Password<div className="password-field"><input name="password" type={show ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={mode === "login" ? 1 : 8} maxLength={256} required/><button type="button" className="icon-button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"}>{show ? <EyeOff size={19}/> : <Eye size={19}/>}</button></div>{mode !== "login" && <small>Use at least 8 characters and a password you do not use elsewhere.</small>}</label>}</>}{mode === "login" && !factor && <button type="button" className="text-link forgot-link" onClick={() => changeMode("forgot")}>Forgot your password?</button>}<button className="button" disabled={busy}>{busy ? "Please wait…" : factor ? "Verify and sign in" : mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset link" : mode === "reset" ? "Update password" : "Sign in"}<ArrowRight size={17}/></button>{!factor && <p className="auth-switch">{mode === "signup" ? "Already have an account?" : mode === "login" ? "New to Manzil?" : "Remember your password?"} <button type="button" onClick={() => changeMode(mode === "login" ? "signup" : "login")}>{mode === "login" ? "Create an account" : "Sign in"}</button></p>}<p className="auth-legal"><ShieldCheck size={15}/>By continuing, you agree to Manzil’s <a href="https://manzilgroup.uz/en/terms">Terms</a> and <a href="https://manzilgroup.uz/en/privacy">Privacy Policy</a>.</p></form>}</section></div>;
}
