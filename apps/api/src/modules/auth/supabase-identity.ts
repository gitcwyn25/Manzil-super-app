import { UnauthorizedException, ServiceUnavailableException } from "@nestjs/common";

const PROJECT_URL = "https://wfabehnihelxemztmvca.supabase.co";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export type SupabaseIdentity = { subject: string; email: string; displayName: string };

export function supabaseConfig() {
  const url = (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").trim().replace(/\/+$/, "");
  const key = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY;
  return url === PROJECT_URL && key ? { url, key } : null;
}

export function hasSupabaseIssuer(token: string): boolean {
  if (token.length > 20000) return false;
  try { return JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString()).iss === `${PROJECT_URL}/auth/v1`; }
  catch { return false; }
}

/** Decode only to constrain routing; the fixed provider verifies the actual signature/session. */
export async function verifySupabaseIdentity(token: string, request: typeof fetch = fetch): Promise<SupabaseIdentity> {
  const config = supabaseConfig();
  if (!config) throw new ServiceUnavailableException("Manzil account sign-in is not configured");
  const invalid = () => new UnauthorizedException("Invalid or unconfirmed Manzil account");
  if (token.length > 20000 || token.split(".").length !== 3) throw invalid();
  let claims: Record<string, unknown>;
  try { claims = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString()); } catch { throw invalid(); }
  if (claims.iss !== `${config.url}/auth/v1`
    || typeof claims.sub !== "string" || !UUID.test(claims.sub) || typeof claims.exp !== "number" || claims.exp <= Date.now() / 1000
    || !(claims.aud === "authenticated" || Array.isArray(claims.aud) && claims.aud.includes("authenticated"))) throw invalid();
  let response: Response;
  try { response = await request(`${config.url}/auth/v1/user`, { headers: { apikey: config.key, Authorization: `Bearer ${token}` }, redirect: "error", signal: AbortSignal.timeout(10000) }); }
  catch { throw new ServiceUnavailableException("Account verification is temporarily unavailable"); }
  if (!response.ok || !response.body || Number(response.headers.get("content-length") || 0) > 256000) throw invalid();
  const reader = response.body.getReader(); const parts: Uint8Array[] = []; let bytes = 0;
  for (;;) { const item = await reader.read(); if (item.done) break; bytes += item.value.length; if (bytes > 256000) { await reader.cancel(); throw invalid(); } parts.push(item.value); }
  let user: Record<string, unknown>;
  try { user = JSON.parse(Buffer.concat(parts).toString()); } catch { throw invalid(); }
  if (!user || user.id !== claims.sub || user.is_anonymous === true || !user.email_confirmed_at || typeof user.email !== "string" || !user.email.includes("@")
    || typeof user.banned_until === "string" && new Date(user.banned_until).getTime() > Date.now()) throw invalid();
  if (Array.isArray(user.factors) && user.factors.some(factor => factor?.status === "verified") && claims.aal !== "aal2") throw invalid();
  const metadata = user.user_metadata as Record<string, unknown> | undefined;
  const name = typeof metadata?.full_name === "string" ? metadata.full_name : typeof metadata?.display_name === "string" ? metadata.display_name : typeof metadata?.username === "string" ? metadata.username : "Manzil member";
  return { subject: claims.sub, email: user.email.trim().toLowerCase(), displayName: name.trim().slice(0, 100) || "Manzil member" };
}
