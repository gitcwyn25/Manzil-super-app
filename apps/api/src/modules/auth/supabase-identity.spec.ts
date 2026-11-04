import { verifySupabaseIdentity } from "./supabase-identity";

const subject = "ed06986c-3e08-4cc1-86ac-e05e6a56ad94";
const issuer = "https://wfabehnihelxemztmvca.supabase.co/auth/v1";
const token = (claims: object = {}) => `header.${Buffer.from(JSON.stringify({ sub: subject, iss: issuer,
  aud: "authenticated", exp: Math.floor(Date.now() / 1000) + 100, ...claims })).toString("base64url")}.signature`;
const user = { id: subject, email: "member@example.org", email_confirmed_at: "2026-10-01T00:00:00Z", is_anonymous: false };

describe("fixed-project Supabase identity boundary", () => {
  const oldEnv = { ...process.env };
  beforeEach(() => {
    process.env.SUPABASE_URL = issuer.replace("/auth/v1", "");
    process.env.SUPABASE_PUBLISHABLE_KEY = "public-test-key";
  });
  afterAll(() => { process.env = oldEnv; });

  it("requires provider verification and only maps a bounded display name, never a role", async () => {
    const request = jest.fn().mockResolvedValue(new Response(JSON.stringify({ ...user, user_metadata: { full_name: "Member", role: "admin" } })));
    await expect(verifySupabaseIdentity(token(), request)).resolves.toEqual({ subject, email: user.email, displayName: "Member" });
    expect(request).toHaveBeenCalledWith(`${issuer}/user`, expect.objectContaining({ redirect: "error", headers: expect.objectContaining({ apikey: "public-test-key" }) }));
  });
  it.each([
    { iss: "https://other.supabase.co/auth/v1" }, { sub: "not-a-uuid" }, { exp: 1 }, { aud: "anon" }
  ])("rejects an invalid token envelope without sending it to another host: %j", async claims => {
    const request = jest.fn();
    await expect(verifySupabaseIdentity(token(claims), request)).rejects.toMatchObject({ status: 401 });
    expect(request).not.toHaveBeenCalled();
  });
  it("rejects a provider-denied signature instead of trusting decoded claims", async () => {
    const request = jest.fn().mockResolvedValue(new Response("{}", { status: 401 }));
    await expect(verifySupabaseIdentity(token(), request)).rejects.toMatchObject({ status: 401 });
  });
  it.each([
    { email_confirmed_at: null }, { is_anonymous: true }, { id: "another-id" }, { banned_until: "2999-01-01T00:00:00Z" },
    { factors: [{ status: "verified" }] }
  ])("rejects an ineligible account: %j", async patch => {
    const request = jest.fn().mockResolvedValue(new Response(JSON.stringify({ ...user, ...patch })));
    await expect(verifySupabaseIdentity(token(), request)).rejects.toMatchObject({ status: 401 });
  });
  it("accepts a verified MFA session when an active factor exists", async () => {
    const request = jest.fn().mockResolvedValue(new Response(JSON.stringify({ ...user, factors: [{ status: "verified" }] })));
    await expect(verifySupabaseIdentity(token({ aal: "aal2" }), request)).resolves.toMatchObject({ subject });
  });
  it("fails closed on oversized provider responses", async () => {
    const request = jest.fn().mockResolvedValue(new Response("a".repeat(256001)));
    await expect(verifySupabaseIdentity(token(), request)).rejects.toMatchObject({ status: 401 });
  });
});
