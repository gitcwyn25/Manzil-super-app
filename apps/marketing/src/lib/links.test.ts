import { describe, expect, it } from "vitest";
import { appAuthUrl, links } from "./links";

describe("customer entry points", () => {
  it("Get Started opens sign-up on the single customer app and returns to Community", () => {
    const url = new URL(links.getStarted);
    expect(url.origin).toBe("https://app.manzilgroup.uz");
    expect(url.pathname).toBe("/auth");
    expect(url.searchParams.get("mode")).toBe("signup");
    expect(url.searchParams.get("next")).toBe("/");
  });

  it("Log In opens the login form on the same app, not a separate site", () => {
    const url = new URL(links.logIn);
    expect(url.origin).toBe("https://app.manzilgroup.uz");
    expect(url.pathname).toBe("/auth");
    expect(url.searchParams.get("mode")).toBeNull();
    expect(url.searchParams.get("next")).toBe("/");
  });

  it("rejects off-site return destinations", () => {
    expect(new URL(appAuthUrl("login", "https://evil.example")).searchParams.get("next")).toBe("/");
    expect(new URL(appAuthUrl("login", "//evil.example")).searchParams.get("next")).toBe("/");
    for (const destination of [
      "/\\evil.example",
      "/\t/evil.example",
      "/\n/evil.example",
      "/%5Cevil.example",
      "/%2F%2Fevil.example",
      "/%ZZ",
    ]) {
      expect(new URL(appAuthUrl("login", destination)).searchParams.get("next")).toBe("/");
    }
    expect(new URL(appAuthUrl("login", "/places/x")).searchParams.get("next")).toBe("/places/x");
  });

  it("never links to the legacy discover or review hosts", () => {
    for (const href of Object.values(links)) {
      const host = new URL(href, "https://manzilgroup.uz").host;
      expect(host).not.toBe("discover.manzilgroup.uz");
      expect(host).not.toBe("review.manzilgroup.uz");
    }
  });

  it("For Businesses goes to the separate business page, not customer sign-up", () => {
    expect(links.forBusinesses).toBe("https://business.manzilgroup.uz");
  });

  it("uses corporate entry points and the owner's exact Tally form", () => {
    expect(links.docs).toBe("/docs");
    expect(links.gurman).toBe("/gurman");
    expect(links.gurmanWaitlist).toBe("/gurman");
    expect(links.gurmanWaitlistEntry).toBe("/gurman/waitlist");
    expect(links.tallyGurmanWaitlist).toBe("https://tally.so/r/eqJLdQ");
  });
});
