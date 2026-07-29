import { MediaController } from "./media.controller";
import type { ManzilRequest } from "../auth/auth.types";

/**
 * `$transaction` is used two ways in the controller: the interactive
 * callback form (create) and the array form (cover swap). This mock supports
 * both, running the callback (or resolving the array) against the same
 * mocked `prisma` object a real interactive transaction would hand back.
 */
function makePrisma() {
  const prisma = {
    business: {
      findFirst: jest.fn(),
      findUnique: jest.fn()
    },
    review: {
      findUnique: jest.fn()
    },
    photo: {
      create: jest.fn((args: { data: unknown }) => Promise.resolve({ id: "photo_new", ...(args.data as object) })),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn()
    },
    $transaction: jest.fn()
  };

  // Assigned after construction (rather than inline) so the implementation
  // can close over `prisma` without a self-referential initializer.
  prisma.$transaction.mockImplementation((arg: unknown) => {
    if (typeof arg === "function") {
      return (arg as (tx: unknown) => unknown)(prisma);
    }
    return Promise.all(arg as Promise<unknown>[]);
  });

  return prisma;
}

function makeController(prisma: ReturnType<typeof makePrisma>) {
  const presign = {
    presignUpload: jest.fn().mockReturnValue({
      uploadUrl: "https://r2.example/upload",
      publicUrl: "https://cdn.example/photo.jpg",
      requiredHeaders: { "Content-Type": "image/jpeg", "Content-Length": "1000" }
    })
  };

  return new MediaController(presign as never, prisma as never);
}

function requestFor(userId: string): ManzilRequest {
  return { headers: {}, manzilActor: { userId, role: "business_owner" } };
}

const presignBody = {
  ownerType: "business" as const,
  ownerId: "biz_1",
  contentType: "image/jpeg",
  contentLength: 1000
};

describe("MediaController.createPresignedUpload — moderation and cover", () => {
  it("auto-approves an owner's photo of their own business", async () => {
    const prisma = makePrisma();
    prisma.business.findFirst.mockResolvedValue({
      id: "biz_1",
      status: "claimed",
      claimedByUserId: "owner_1",
      createdByUserId: "owner_1"
    });
    prisma.photo.findFirst.mockResolvedValue(null); // no existing cover

    const controller = makeController(prisma);
    const result = await controller.createPresignedUpload(presignBody, requestFor("owner_1"));

    expect(result.data.moderationStatus).toBe("approved");
    expect(prisma.photo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ moderationStatus: "approved", businessId: "biz_1" })
      })
    );
  });

  it("also auto-approves the registrant while the business is still pending its first claim", async () => {
    const prisma = makePrisma();
    prisma.business.findFirst.mockResolvedValue({
      id: "biz_1",
      status: "pending_claim",
      claimedByUserId: null,
      createdByUserId: "registrant_1"
    });
    prisma.photo.findFirst.mockResolvedValue(null);

    const controller = makeController(prisma);
    const result = await controller.createPresignedUpload(presignBody, requestFor("registrant_1"));

    expect(result.data.moderationStatus).toBe("approved");
  });

  it("leaves a stranger's photo of someone else's business pending", async () => {
    const prisma = makePrisma();
    prisma.business.findFirst.mockResolvedValue({
      id: "biz_1",
      status: "claimed",
      claimedByUserId: "owner_1",
      createdByUserId: "owner_1"
    });

    const controller = makeController(prisma);
    const result = await controller.createPresignedUpload(presignBody, requestFor("stranger_1"));

    expect(result.data.moderationStatus).toBe("pending");
    expect(result.data.isCover).toBe(false);
    // Non-owner uploads never even ask whether a cover already exists — the
    // short circuit is on moderationStatus, not on a separate check.
    expect(prisma.photo.findFirst).not.toHaveBeenCalled();
  });

  it("leaves a review photo pending regardless of who uploaded it", async () => {
    const prisma = makePrisma();
    prisma.review.findUnique.mockResolvedValue({ id: "rev_1" });

    const controller = makeController(prisma);
    const result = await controller.createPresignedUpload(
      { ownerType: "review", ownerId: "rev_1", contentType: "image/jpeg", contentLength: 1000 },
      requestFor("owner_1")
    );

    expect(result.data.moderationStatus).toBe("pending");
    expect(prisma.business.findFirst).not.toHaveBeenCalled();
  });

  it("makes the first approved business photo the cover", async () => {
    const prisma = makePrisma();
    prisma.business.findFirst.mockResolvedValue({
      id: "biz_1",
      status: "claimed",
      claimedByUserId: "owner_1",
      createdByUserId: "owner_1"
    });
    prisma.photo.findFirst.mockResolvedValue(null); // nothing is cover yet

    const controller = makeController(prisma);
    const result = await controller.createPresignedUpload(presignBody, requestFor("owner_1"));

    expect(result.data.isCover).toBe(true);
    expect(prisma.photo.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ isCover: true }) })
    );
  });

  it("does not make a second approved business photo the cover", async () => {
    const prisma = makePrisma();
    prisma.business.findFirst.mockResolvedValue({
      id: "biz_1",
      status: "claimed",
      claimedByUserId: "owner_1",
      createdByUserId: "owner_1"
    });
    prisma.photo.findFirst.mockResolvedValue({ id: "existing_cover" }); // already has one

    const controller = makeController(prisma);
    const result = await controller.createPresignedUpload(presignBody, requestFor("owner_1"));

    expect(result.data.isCover).toBe(false);
    expect(prisma.photo.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ isCover: false }) })
    );
  });
});

describe("MediaController.setCoverPhoto", () => {
  it("clears the previous cover and sets the new one in a single transaction", async () => {
    const prisma = makePrisma();
    prisma.photo.findUnique.mockResolvedValue({
      id: "photo_2",
      businessId: "biz_1",
      moderationStatus: "approved"
    });
    prisma.business.findUnique.mockResolvedValue({
      claimedByUserId: "owner_1",
      createdByUserId: "owner_1",
      status: "claimed"
    });
    prisma.photo.updateMany.mockResolvedValue({ count: 1 });
    prisma.photo.update.mockResolvedValue({ id: "photo_2", isCover: true });

    const controller = makeController(prisma);
    const result = await controller.setCoverPhoto("photo_2", requestFor("owner_1"));

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.photo.updateMany).toHaveBeenCalledWith({
      where: { businessId: "biz_1", isCover: true, id: { not: "photo_2" } },
      data: { isCover: false }
    });
    expect(prisma.photo.update).toHaveBeenCalledWith({
      where: { id: "photo_2" },
      data: { isCover: true }
    });
    expect(result.data.isCover).toBe(true);
  });

  it("rejects a non-owner", async () => {
    const prisma = makePrisma();
    prisma.photo.findUnique.mockResolvedValue({
      id: "photo_2",
      businessId: "biz_1",
      moderationStatus: "approved"
    });
    prisma.business.findUnique.mockResolvedValue({
      claimedByUserId: "owner_1",
      createdByUserId: "owner_1",
      status: "claimed"
    });

    const controller = makeController(prisma);

    await expect(controller.setCoverPhoto("photo_2", requestFor("stranger_1"))).rejects.toThrow();
    expect(prisma.photo.updateMany).not.toHaveBeenCalled();
  });

  it("rejects a photo that isn't approved yet", async () => {
    const prisma = makePrisma();
    prisma.photo.findUnique.mockResolvedValue({
      id: "photo_2",
      businessId: "biz_1",
      moderationStatus: "pending"
    });
    prisma.business.findUnique.mockResolvedValue({
      claimedByUserId: "owner_1",
      createdByUserId: "owner_1",
      status: "claimed"
    });

    const controller = makeController(prisma);

    await expect(controller.setCoverPhoto("photo_2", requestFor("owner_1"))).rejects.toThrow();
    expect(prisma.photo.updateMany).not.toHaveBeenCalled();
  });
});
