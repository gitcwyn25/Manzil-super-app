import { BadRequestException } from "@nestjs/common";
import { WaitlistController } from "./waitlist.controller";
import type { WaitlistWelcomeMailService } from "./waitlist-welcome-mail.service";
import type { WaitlistRepository } from "./waitlist.repository";

function makeRepo(overrides: Partial<WaitlistRepository> = {}) {
  return {
    join: jest.fn().mockResolvedValue({ position: 7, created: true }),
    count: jest.fn().mockResolvedValue(42),
    ...overrides
  } as unknown as WaitlistRepository;
}

function makeWelcomeMail(overrides: Partial<WaitlistWelcomeMailService> = {}) {
  return {
    send: jest.fn().mockResolvedValue({ status: "sent", id: "email_123" }),
    ...overrides
  } as unknown as WaitlistWelcomeMailService;
}

function makeController(
  repo: WaitlistRepository = makeRepo(),
  welcomeMail: WaitlistWelcomeMailService = makeWelcomeMail()
) {
  return new WaitlistController(repo, welcomeMail);
}

describe("WaitlistController", () => {
  it("rejects an unknown topic", async () => {
    const controller = makeController(makeRepo());

    await expect(
      controller.join({ topic: "spaceship", email: "a@b.com", locale: "en" })
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("rejects a malformed email", async () => {
    const controller = makeController(makeRepo());

    await expect(
      controller.join({ topic: "gurman", email: "not-an-email", locale: "en" })
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("requires a city for the city topic", async () => {
    const controller = makeController(makeRepo());

    await expect(
      controller.join({ topic: "city", email: "a@b.com", locale: "en" })
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("accepts a valid city signup and returns its position", async () => {
    const repo = makeRepo();
    const controller = makeController(repo);

    const result = await controller.join({
      topic: "city",
      email: "A@B.com",
      locale: "en",
      city: "Bukhara"
    });

    expect(result).toEqual({ data: { ok: true, position: 7 } });
    // Stored lowercase so the unique constraint actually deduplicates.
    expect(repo.join).toHaveBeenCalledWith(
      expect.objectContaining({ email: "a@b.com", city: "Bukhara", topic: "city" })
    );
  });

  it("ignores a city sent with a non-city topic", async () => {
    const repo = makeRepo();
    const controller = makeController(repo);

    await controller.join({
      topic: "gurman",
      email: "a@b.com",
      locale: "en",
      city: "Bukhara",
      firstName: "A",
      lastName: "B",
      purpose: "discover",
      heardFrom: "friend",
      acceptedLegal: true
    });

    expect(repo.join).toHaveBeenCalledWith(expect.objectContaining({ city: null }));
  });

  it("requires Gurman profile, survey, and legal-consent fields", async () => {
    const controller = makeController(makeRepo());

    await expect(
      controller.join({ topic: "gurman", email: "a@b.com", locale: "en" })
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("accepts a complete Gurman signup, returns its position, and sends one welcome email", async () => {
    const repo = makeRepo();
    const welcomeMail = makeWelcomeMail();
    const controller = makeController(repo, welcomeMail);

    const result = await controller.join({
      topic: "gurman",
      email: "A@B.com",
      locale: "en",
      firstName: "Ada",
      lastName: "Lovelace",
      purpose: "plan",
      heardFrom: "youtube",
      acceptedLegal: true
    });

    expect(result).toEqual({ data: { ok: true, position: 7 } });
    expect(repo.join).toHaveBeenCalledWith(expect.objectContaining({
      topic: "gurman",
      email: "a@b.com",
      firstName: "Ada",
      lastName: "Lovelace",
      purpose: "plan",
      heardFrom: "youtube",
      acceptedLegalAt: expect.any(Date)
    }));
    expect(welcomeMail.send).toHaveBeenCalledWith({
      email: "a@b.com",
      firstName: "Ada",
      locale: "en",
      position: 7
    });
  });

  it("does not resend a welcome email for an idempotent repeat", async () => {
    const repo = makeRepo({ join: jest.fn().mockResolvedValue({ position: 7, created: false }) });
    const welcomeMail = makeWelcomeMail();
    const controller = makeController(repo, welcomeMail);

    await controller.join({
      topic: "gurman",
      email: "a@b.com",
      locale: "en",
      firstName: "Ada",
      lastName: "Lovelace",
      purpose: "plan",
      heardFrom: "youtube",
      acceptedLegal: true
    });

    expect(welcomeMail.send).not.toHaveBeenCalled();
  });

  it("returns success even if the email provider fails after persistence", async () => {
    const welcomeMail = makeWelcomeMail({ send: jest.fn().mockRejectedValue(new Error("provider unavailable")) });
    const controller = makeController(makeRepo(), welcomeMail);

    await expect(controller.join({
      topic: "gurman",
      email: "a@b.com",
      locale: "en",
      firstName: "Ada",
      lastName: "Lovelace",
      purpose: "plan",
      heardFrom: "youtube",
      acceptedLegal: true
    })).resolves.toEqual({ data: { ok: true, position: 7 } });
  });

  it("counts signups for a topic", async () => {
    const repo = makeRepo();
    const controller = makeController(repo);

    expect(await controller.count("city", "Bukhara")).toEqual({ data: { count: 42 } });
    expect(repo.count).toHaveBeenCalledWith("city", "Bukhara");
  });
});
