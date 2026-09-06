import { WaitlistWelcomeMailService } from "./waitlist-welcome-mail.service";

describe("WaitlistWelcomeMailService", () => {
  const originalApiKey = process.env.RESEND_API_KEY;
  const originalFromEmail = process.env.RESEND_FROM_EMAIL;
  const originalFromName = process.env.RESEND_FROM_NAME;
  const originalFetch = global.fetch;

  afterEach(() => {
    if (originalApiKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = originalApiKey;
    if (originalFromEmail === undefined) delete process.env.RESEND_FROM_EMAIL;
    else process.env.RESEND_FROM_EMAIL = originalFromEmail;
    if (originalFromName === undefined) delete process.env.RESEND_FROM_NAME;
    else process.env.RESEND_FROM_NAME = originalFromName;
    global.fetch = originalFetch;
  });

  it("skips delivery when the API key is not configured", async () => {
    delete process.env.RESEND_API_KEY;
    const fetchMock = jest.fn();
    global.fetch = fetchMock as typeof fetch;

    const result = await new WaitlistWelcomeMailService().send({
      email: "ada@example.com",
      firstName: "Ada",
      locale: "en",
      position: 7
    });

    expect(result).toEqual({ status: "not_configured" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends a localized welcome email with the queue position through Resend", async () => {
    process.env.RESEND_API_KEY = "test-key";
    process.env.RESEND_FROM_EMAIL = "no-reply@manzilgroup.uz";
    process.env.RESEND_FROM_NAME = "Manzil Group";
    const fetchMock = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: "re_123" }), { status: 200, headers: { "content-type": "application/json" } })
    );
    global.fetch = fetchMock as typeof fetch;

    const result = await new WaitlistWelcomeMailService().send({
      email: "ada@example.com",
      firstName: "Ada",
      locale: "en",
      position: 7
    });

    expect(result).toEqual({ status: "sent", id: "re_123" });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.resend.com/emails",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer test-key" })
      })
    );

    const request = fetchMock.mock.calls[0][1] as RequestInit;
    const body = JSON.parse(String(request.body)) as { to: string[]; from: string; subject: string; html: string; text: string };
    expect(body.to).toEqual(["ada@example.com"]);
    expect(body.from).toBe("Manzil Group <no-reply@manzilgroup.uz>");
    expect(body.subject).toContain("Gurman Mobile");
    expect(body.html).toContain("#7");
    expect(body.text).toContain("#7");
  });
});
