import { BadRequestException } from "@nestjs/common";
import { WaitlistController } from "./waitlist.controller";
import type { WaitlistRepository } from "./waitlist.repository";

function makeRepo(overrides: Partial<WaitlistRepository> = {}) {
  return {
    join: jest.fn().mockResolvedValue({ position: 7 }),
    count: jest.fn().mockResolvedValue(42),
    ...overrides
  } as unknown as WaitlistRepository;
}

describe("WaitlistController", () => {
  it("rejects an unknown topic", async () => {
    const controller = new WaitlistController(makeRepo());

    await expect(
      controller.join({ topic: "spaceship", email: "a@b.com", locale: "en" })
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("rejects a malformed email", async () => {
    const controller = new WaitlistController(makeRepo());

    await expect(
      controller.join({ topic: "gurman", email: "not-an-email", locale: "en" })
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("requires a city for the city topic", async () => {
    const controller = new WaitlistController(makeRepo());

    await expect(
      controller.join({ topic: "city", email: "a@b.com", locale: "en" })
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("accepts a valid city signup and returns its position", async () => {
    const repo = makeRepo();
    const controller = new WaitlistController(repo);

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
    const controller = new WaitlistController(repo);

    await controller.join({ topic: "gurman", email: "a@b.com", locale: "en", city: "Bukhara" });

    expect(repo.join).toHaveBeenCalledWith(expect.objectContaining({ city: null }));
  });

  it("counts signups for a topic", async () => {
    const repo = makeRepo();
    const controller = new WaitlistController(repo);

    expect(await controller.count("city", "Bukhara")).toEqual({ data: { count: 42 } });
    expect(repo.count).toHaveBeenCalledWith("city", "Bukhara");
  });
});
