import { Prisma } from "@prisma/client";
import { WaitlistRepository, type WaitlistJoinInput } from "./waitlist.repository";

const input: WaitlistJoinInput = {
  topic: "gurman",
  email: "ada@example.com",
  locale: "en",
  city: null,
  businessName: null,
  firstName: "Ada",
  lastName: "Lovelace",
  purpose: "plan",
  heardFrom: "friend",
  acceptedLegalAt: new Date("2026-09-06T10:00:00.000Z"),
  source: "standalone:gurman-mobile-ui"
};

function makePrisma() {
  return {
    waitlistSignup: {
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn().mockResolvedValue(4)
    }
  };
}

describe("WaitlistRepository.join", () => {
  it("creates a signup and calculates its deterministic position", async () => {
    const prisma = makePrisma();
    const signup = { id: "c_signup_4", ...input, createdAt: new Date("2026-09-06T10:00:00.000Z") };
    prisma.waitlistSignup.create.mockResolvedValue(signup);
    const repository = new WaitlistRepository(prisma as never);

    await expect(repository.join(input)).resolves.toEqual({ position: 4, created: true });
    expect(prisma.waitlistSignup.create).toHaveBeenCalledWith({ data: expect.objectContaining(input) });
    expect(prisma.waitlistSignup.count).toHaveBeenCalledWith({
      where: {
        topic: "gurman",
        OR: [
          { createdAt: { lt: signup.createdAt } },
          { createdAt: signup.createdAt, id: { lte: signup.id } }
        ]
      }
    });
  });

  it("updates an existing compound-key signup without creating a second entry", async () => {
    const prisma = makePrisma();
    const signup = { id: "c_signup_4", ...input, createdAt: new Date("2026-09-06T10:00:00.000Z") };
    prisma.waitlistSignup.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("duplicate", { code: "P2002", clientVersion: "6.19.3" })
    );
    prisma.waitlistSignup.update.mockResolvedValue(signup);
    const repository = new WaitlistRepository(prisma as never);

    await expect(repository.join(input)).resolves.toEqual({ position: 4, created: false });
    expect(prisma.waitlistSignup.update).toHaveBeenCalledWith({
      where: { topic_email: { topic: "gurman", email: "ada@example.com" } },
      data: expect.objectContaining({ firstName: "Ada", purpose: "plan" })
    });
  });
});
