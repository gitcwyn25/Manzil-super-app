import { BadRequestException } from "@nestjs/common";
import { WaitlistController } from "./waitlist.controller";
import type { WaitlistRepository } from "./waitlist.repository";

function makeRepo(overrides: Partial<WaitlistRepository> = {}) {
  return { join: jest.fn().mockResolvedValue({ position: 7 }), count: jest.fn().mockResolvedValue(42), ...overrides } as unknown as WaitlistRepository;
}

describe("WaitlistController", () => {
  it("rejects an unknown topic", async () => { await expect(new WaitlistController(makeRepo()).join({ topic: "spaceship", email: "a@b.com", locale: "en" })).rejects.toBeInstanceOf(BadRequestException); });
  it("rejects a malformed email", async () => { await expect(new WaitlistController(makeRepo()).join({ topic: "gurman", email: "not-an-email", locale: "en" })).rejects.toBeInstanceOf(BadRequestException); });
  it("requires a city for the city topic", async () => { await expect(new WaitlistController(makeRepo()).join({ topic: "city", email: "a@b.com", locale: "en" })).rejects.toBeInstanceOf(BadRequestException); });
  it("requires the Gurman profile and research answers", async () => { await expect(new WaitlistController(makeRepo()).join({ topic: "gurman", email: "a@b.com", locale: "en" })).rejects.toBeInstanceOf(BadRequestException); });

  it("accepts a valid Gurman signup and forwards the answers", async () => {
    const repo = makeRepo();
    const result = await new WaitlistController(repo).join({ topic: "gurman", email: "A@B.com", locale: "en", firstName: "Sunnatilla", lastName: "Tursunov", heardAbout: "telegram", featureInterest: "planning" });
    expect(result).toEqual({ data: { ok: true, position: 7 } });
    expect(repo.join).toHaveBeenCalledWith(expect.objectContaining({ email: "a@b.com", topic: "gurman", firstName: "Sunnatilla", lastName: "Tursunov", heardAbout: "telegram", featureInterest: "planning" }));
  });

  it("accepts a valid city signup and returns its position", async () => {
    const repo = makeRepo();
    const result = await new WaitlistController(repo).join({ topic: "city", email: "A@B.com", locale: "en", city: "Bukhara" });
    expect(result).toEqual({ data: { ok: true, position: 7 } });
    expect(repo.join).toHaveBeenCalledWith(expect.objectContaining({ email: "a@b.com", city: "Bukhara", topic: "city" }));
  });

  it("ignores a city sent with a non-city topic", async () => {
    const repo = makeRepo();
    await new WaitlistController(repo).join({ topic: "gurman", email: "a@b.com", locale: "en", firstName: "A", lastName: "B", heardAbout: "other", featureInterest: "all", city: "Bukhara" });
    expect(repo.join).toHaveBeenCalledWith(expect.objectContaining({ city: null }));
  });

  it("counts signups for a topic", async () => {
    const repo = makeRepo();
    const controller = new WaitlistController(repo);
    expect(await controller.count("city", "Bukhara")).toEqual({ data: { count: 42 } });
    expect(repo.count).toHaveBeenCalledWith("city", "Bukhara");
  });
});
