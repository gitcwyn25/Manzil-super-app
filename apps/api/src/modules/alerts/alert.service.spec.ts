import { AlertService } from "./alert.service";

/** Flushes the microtask queue so `dispatch`'s fire-and-forget persist() settles. */
function flush() {
  return new Promise((resolve) => setImmediate(resolve));
}

function makeService() {
  const prisma = { adminNotification: { create: jest.fn().mockResolvedValue({ id: "notif_1" }) } };
  const service = new AlertService(prisma as never);
  return { service, prisma };
}

describe("AlertService.dispatch — persistence", () => {
  const originalUrl = process.env.ALERT_WEBHOOK_URL;

  beforeEach(() => {
    delete process.env.ALERT_WEBHOOK_URL;
  });

  afterAll(() => {
    if (originalUrl) process.env.ALERT_WEBHOOK_URL = originalUrl;
  });

  it("persists an AdminNotification for business_awaiting_approval", async () => {
    const { service, prisma } = makeService();

    service.dispatch({
      kind: "business_awaiting_approval",
      title: "New business awaiting approval: Caravan Coffee",
      detail: "Chilonzor, Tashkent"
    });
    await flush();

    expect(prisma.adminNotification.create).toHaveBeenCalledWith({
      data: {
        kind: "business_awaiting_approval",
        title: "New business awaiting approval: Caravan Coffee",
        body: "Chilonzor, Tashkent",
        businessId: null
      }
    });
  });

  it("carries an optional businessId through for deep-linking", async () => {
    const { service, prisma } = makeService();

    service.dispatch({
      kind: "business_awaiting_approval",
      title: "New business awaiting approval: Caravan Coffee",
      businessId: "biz_1"
    });
    await flush();

    expect(prisma.adminNotification.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ businessId: "biz_1" }) })
    );
  });

  it("does not persist a kind with no corresponding AdminNotificationKind", async () => {
    const { service, prisma } = makeService();

    service.dispatch({ kind: "payment_failure", title: "Stripe webhook signature mismatch" });
    await flush();

    expect(prisma.adminNotification.create).not.toHaveBeenCalled();
  });

  it("never throws into the caller when persistence fails — dispatch stays synchronous and void", () => {
    const prisma = { adminNotification: { create: jest.fn().mockRejectedValue(new Error("db down")) } };
    const service = new AlertService(prisma as never);

    expect(() =>
      service.dispatch({ kind: "business_awaiting_approval", title: "New business awaiting approval: X" })
    ).not.toThrow();
  });

  it("does not reject the returned/awaited call site path even after the async persist rejects", async () => {
    const prisma = { adminNotification: { create: jest.fn().mockRejectedValue(new Error("db down")) } };
    const service = new AlertService(prisma as never);

    service.dispatch({ kind: "business_awaiting_approval", title: "New business awaiting approval: X" });

    // If the rejection were unhandled, Jest/Node would report an
    // unhandledRejection for this test — flushing and reaching this line
    // without the process complaining is the assertion.
    await flush();
    expect(prisma.adminNotification.create).toHaveBeenCalledTimes(1);
  });
});
