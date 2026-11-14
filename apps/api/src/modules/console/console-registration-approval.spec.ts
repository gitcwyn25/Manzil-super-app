import { ConsoleRepository } from "./console.repository";

function setup(registration: { id: string; userId: string } | null) {
  const before = { id: "b1", status: "pending_claim", createdByUserId: "registrant", claimedByUserId: null, claimedAt: null };
  const prisma = {
    business: { findUnique: jest.fn().mockResolvedValue(before), update: jest.fn().mockImplementation(async ({ data }) => ({ ...before, ...data })) },
    claim: { findFirst: jest.fn().mockResolvedValue(registration), updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    user: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    auditLog: { create: jest.fn().mockResolvedValue({ id: "audit" }) },
    $transaction: jest.fn()
  };
  prisma.$transaction.mockImplementation(async callback => callback(prisma));
  return { prisma, repo: new ConsoleRepository(prisma as never, {} as never, {} as never) };
}

describe("console approval of Reviews registrations", () => {
  it("assigns ownership and approves only the matching pending registration in the audited transaction", async () => {
    const { prisma, repo } = setup({ id: "registration", userId: "registrant" });
    await repo.approveBusiness("b1", { adminId: "console-admin" });
    expect(prisma.claim.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { businessId: "b1", userId: "registrant", verificationMethod: "registration", status: "pending" } }));
    expect(prisma.business.update).toHaveBeenCalledWith({ where: { id: "b1" }, data: { status: "claimed", claimedByUserId: "registrant", claimedAt: expect.any(Date) } });
    expect(prisma.claim.updateMany).toHaveBeenCalledWith({ where: { id: "registration", status: "pending" }, data: { status: "approved" } });
    expect(prisma.user.updateMany).toHaveBeenCalledWith({ where: { id: "registrant", role: "consumer" }, data: { role: "business_owner" } });
    expect(prisma.auditLog.create).toHaveBeenCalledWith({ data: expect.objectContaining({ actorId: "console-admin", afterState: expect.objectContaining({ registrationClaimId: "registration", claimedByUserId: "registrant" }) }) });
  });

  it("preserves other approval semantics when no matching registration claim exists", async () => {
    const { prisma, repo } = setup(null);
    await repo.approveBusiness("b1", { adminId: "console-admin" });
    expect(prisma.business.update).toHaveBeenCalledWith({ where: { id: "b1" }, data: { status: "claimed" } });
    expect(prisma.claim.updateMany).not.toHaveBeenCalled();
    expect(prisma.user.updateMany).not.toHaveBeenCalled();
  });

  it("fails the transaction rather than assigning ownership when the claim was concurrently reviewed", async () => {
    const { prisma, repo } = setup({ id: "registration", userId: "registrant" });
    prisma.claim.updateMany.mockResolvedValue({ count: 0 });
    await expect(repo.approveBusiness("b1", { adminId: "console-admin" })).rejects.toMatchObject({ status: 409 });
    expect(prisma.business.update).not.toHaveBeenCalled();
    expect(prisma.user.updateMany).not.toHaveBeenCalled();
  });
});
