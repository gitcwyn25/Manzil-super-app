import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { BookingsRepository } from "./bookings.repository";
import type { AuthActor } from "../repositories/database.repository";

const owner: AuthActor = { userId: "owner_1", role: "business_owner" } as AuthActor;
const stranger: AuthActor = { userId: "stranger_1", role: "business_owner" } as AuthActor;

const ownedBusiness = {
  id: "biz_1",
  slug: "caravan-coffee",
  claimedByUserId: "owner_1",
  createdByUserId: "owner_1",
  status: "claimed"
};

/**
 * `$transaction` mock supports the interactive callback form used by
 * `completeBooking`, running it against the same mocked `prisma` object a
 * real transaction would hand back as `tx` — same pattern as
 * media.controller.spec.ts.
 */
function makePrisma() {
  const prisma = {
    business: { findUnique: jest.fn() },
    customer: { findUnique: jest.fn(), upsert: jest.fn() },
    customerVisit: { findUnique: jest.fn(), create: jest.fn() },
    booking: {
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn(),
      update: jest.fn()
    },
    $transaction: jest.fn()
  };

  prisma.$transaction.mockImplementation((arg: unknown) => {
    if (typeof arg === "function") {
      return (arg as (tx: unknown) => unknown)(prisma);
    }
    return Promise.all(arg as Promise<unknown>[]);
  });

  return prisma;
}

function makeLoyalty() {
  return { awardForCompletedBooking: jest.fn().mockResolvedValue({ awarded: 10, customerId: "cust_1" }) };
}

function makeRepo(prisma: ReturnType<typeof makePrisma>, loyalty: ReturnType<typeof makeLoyalty>) {
  return new BookingsRepository(prisma as never, loyalty as never);
}

const bookingRow = {
  id: "bk_1",
  businessId: "biz_1",
  customerId: null as string | null,
  customerPhone: "+998901234567",
  serviceName: "Haircut",
  startsAt: new Date("2026-08-01T09:00:00.000Z"),
  endsAt: null,
  status: "confirmed",
  depositAmount: null,
  createdAt: new Date("2026-07-20T00:00:00.000Z"),
  updatedAt: new Date("2026-07-20T00:00:00.000Z"),
  payment: null as { amount: unknown; status: string } | null
};

describe("BookingsRepository — ownership", () => {
  it("rejects listing another owner's bookings", async () => {
    const prisma = makePrisma();
    prisma.business.findUnique.mockResolvedValue(ownedBusiness);
    const repo = makeRepo(prisma, makeLoyalty());

    await expect(repo.listBookings("caravan-coffee", {}, stranger)).rejects.toBeInstanceOf(
      ForbiddenException
    );
    expect(prisma.booking.findMany).not.toHaveBeenCalled();
  });

  it("rejects a status change on another owner's booking", async () => {
    const prisma = makePrisma();
    prisma.booking.findUnique.mockResolvedValue({
      ...bookingRow,
      business: { slug: "caravan-coffee" }
    });
    prisma.business.findUnique.mockResolvedValue(ownedBusiness);
    const repo = makeRepo(prisma, makeLoyalty());

    await expect(repo.setStatus("bk_1", "confirmed", stranger)).rejects.toBeInstanceOf(
      ForbiddenException
    );
    expect(prisma.booking.update).not.toHaveBeenCalled();
  });
});

describe("BookingsRepository.createBooking — validation", () => {
  it("rejects endsAt before startsAt", async () => {
    const prisma = makePrisma();
    prisma.business.findUnique.mockResolvedValue(ownedBusiness);
    prisma.customer.findUnique.mockResolvedValue(null);
    const repo = makeRepo(prisma, makeLoyalty());

    await expect(
      repo.createBooking(
        "caravan-coffee",
        {
          serviceName: "Haircut",
          customerPhone: "+998901234567",
          startsAt: "2026-08-01T10:00:00.000Z",
          endsAt: "2026-08-01T09:00:00.000Z"
        },
        owner
      )
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.booking.create).not.toHaveBeenCalled();
  });

  it("rejects a blank customerPhone", async () => {
    const prisma = makePrisma();
    prisma.business.findUnique.mockResolvedValue(ownedBusiness);
    const repo = makeRepo(prisma, makeLoyalty());

    await expect(
      repo.createBooking(
        "caravan-coffee",
        { serviceName: "Haircut", customerPhone: "   ", startsAt: "2026-08-01T10:00:00.000Z" },
        owner
      )
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("creates a pending booking when the input is valid", async () => {
    const prisma = makePrisma();
    prisma.business.findUnique.mockResolvedValue(ownedBusiness);
    prisma.customer.findUnique.mockResolvedValue(null);
    prisma.booking.create.mockResolvedValue({ ...bookingRow, status: "pending" });
    const repo = makeRepo(prisma, makeLoyalty());

    const result = await repo.createBooking(
      "caravan-coffee",
      { serviceName: "Haircut", customerPhone: "+998901234567", startsAt: "2026-08-01T09:00:00.000Z" },
      owner
    );

    expect(result.status).toBe("pending");
    expect(prisma.booking.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "pending" }) })
    );
  });
});

describe("BookingsRepository.setStatus — transition rules", () => {
  it("rejects completing a canceled booking", async () => {
    const prisma = makePrisma();
    prisma.booking.findUnique.mockResolvedValue({
      ...bookingRow,
      status: "canceled",
      business: { slug: "caravan-coffee" }
    });
    prisma.business.findUnique.mockResolvedValue(ownedBusiness);
    const repo = makeRepo(prisma, makeLoyalty());

    await expect(repo.setStatus("bk_1", "completed", owner)).rejects.toBeInstanceOf(
      BadRequestException
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("rejects reviving a no_show booking into confirmed", async () => {
    const prisma = makePrisma();
    prisma.booking.findUnique.mockResolvedValue({
      ...bookingRow,
      status: "no_show",
      business: { slug: "caravan-coffee" }
    });
    prisma.business.findUnique.mockResolvedValue(ownedBusiness);
    const repo = makeRepo(prisma, makeLoyalty());

    await expect(repo.setStatus("bk_1", "confirmed", owner)).rejects.toBeInstanceOf(
      BadRequestException
    );
  });

  it("allows pending -> confirmed", async () => {
    const prisma = makePrisma();
    prisma.booking.findUnique.mockResolvedValue({
      ...bookingRow,
      status: "pending",
      business: { slug: "caravan-coffee" }
    });
    prisma.business.findUnique.mockResolvedValue(ownedBusiness);
    prisma.booking.update.mockResolvedValue({ ...bookingRow, status: "confirmed" });
    const repo = makeRepo(prisma, makeLoyalty());

    const result = await repo.setStatus("bk_1", "confirmed", owner);
    expect(result.status).toBe("confirmed");
  });
});

describe("BookingsRepository.setStatus — completion side effects", () => {
  function primeForCompletion(prisma: ReturnType<typeof makePrisma>) {
    prisma.booking.findUnique.mockResolvedValue({
      ...bookingRow,
      status: "confirmed",
      business: { slug: "caravan-coffee" }
    });
    prisma.business.findUnique.mockResolvedValue(ownedBusiness);
    prisma.booking.findUniqueOrThrow.mockResolvedValue({ ...bookingRow, status: "confirmed" });
    prisma.customer.findUnique.mockResolvedValue(null);
    prisma.customer.upsert.mockResolvedValue({ id: "cust_1", lastVisitAt: bookingRow.startsAt });
    prisma.customerVisit.findUnique.mockResolvedValue(null);
    prisma.customerVisit.create.mockResolvedValue({ id: "visit_1", bookingId: "bk_1" });
    prisma.booking.update.mockResolvedValue({
      ...bookingRow,
      status: "completed",
      customerId: "cust_1"
    });
  }

  it("completing creates exactly one CustomerVisit and upserts the Customer", async () => {
    const prisma = makePrisma();
    const loyalty = makeLoyalty();
    primeForCompletion(prisma);
    const repo = makeRepo(prisma, loyalty);

    const result = await repo.setStatus("bk_1", "completed", owner);

    expect(result.status).toBe("completed");
    expect(prisma.customerVisit.create).toHaveBeenCalledTimes(1);
    expect(prisma.customerVisit.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ bookingId: "bk_1", customerId: "cust_1", businessId: "biz_1" })
      })
    );
    expect(prisma.customer.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.customer.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { businessId_phone: { businessId: "biz_1", phone: "+998901234567" } }
      })
    );
    expect(loyalty.awardForCompletedBooking).toHaveBeenCalledTimes(1);
  });

  it("is idempotent when the same request is resubmitted after the booking already reads completed", async () => {
    const prisma = makePrisma();
    const loyalty = makeLoyalty();
    primeForCompletion(prisma);
    const repo = makeRepo(prisma, loyalty);

    await repo.setStatus("bk_1", "completed", owner);

    // The booking now reads "completed", as it would after the first request
    // committed — the outer status check short-circuits before touching the
    // transaction at all.
    prisma.booking.findUnique.mockResolvedValue({
      ...bookingRow,
      status: "completed",
      business: { slug: "caravan-coffee" }
    });

    const second = await repo.setStatus("bk_1", "completed", owner);

    expect(second.status).toBe("completed");
    expect(prisma.customerVisit.create).toHaveBeenCalledTimes(1);
    expect(prisma.customer.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it("is idempotent even when a second attempt races past the outer status check", async () => {
    // Simulates two near-simultaneous completions: both read the booking as
    // "confirmed" outside the transaction (the outer same-status guard can't
    // help here), so the guarantee has to come from CustomerVisit.bookingId's
    // uniqueness inside the transaction itself.
    const prisma = makePrisma();
    const loyalty = makeLoyalty();
    primeForCompletion(prisma);
    const repo = makeRepo(prisma, loyalty);

    await repo.setStatus("bk_1", "completed", owner);

    // Second transaction "sees" the visit the first one already committed.
    prisma.customerVisit.findUnique.mockResolvedValue({ id: "visit_1", bookingId: "bk_1" });
    prisma.booking.findUniqueOrThrow.mockResolvedValue({ ...bookingRow, status: "confirmed" });

    const second = await repo.setStatus("bk_1", "completed", owner);

    expect(second.status).toBe("completed");
    // Still exactly one visit and one customer upsert across both calls.
    expect(prisma.customerVisit.create).toHaveBeenCalledTimes(1);
    expect(prisma.customer.upsert).toHaveBeenCalledTimes(1);
  });
});
