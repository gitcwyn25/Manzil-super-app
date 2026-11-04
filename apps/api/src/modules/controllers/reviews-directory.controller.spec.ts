import { ReviewsDirectoryController } from "./reviews-directory.controller";

const body = { name: "Local cafe", categorySlug: "cafes", descriptionUz: "A local place to meet", address: "Tashkent", district: "Center", acceptedTerms: true, acceptedTermsVersion: "v1" };
const request = { headers: {}, manzilActor: { userId: "member", role: "consumer" as const } };

describe("Reviews-only business submission", () => {
  it("requires the server approval policy and records the authenticated actor and legal context", async () => {
    const crm = { registerBusiness: jest.fn().mockResolvedValue({ id: "b1", status: "pending_claim" }) };
    const legal = { assertIsCurrentVersion: jest.fn().mockResolvedValue(undefined) };
    const controller = new ReviewsDirectoryController({} as never, crm as never, legal as never);
    await expect(controller.submitBusiness(body, request, "127.0.0.1", "test-agent")).resolves.toMatchObject({ data: { status: "pending_claim" } });
    expect(crm.registerBusiness).toHaveBeenCalledWith(body, request.manzilActor, { acceptedTerms: true, ipAddress: "127.0.0.1", userAgent: "test-agent" }, { approvalRequired: true });
  });
  it("rejects stale terms before creating any business or claim", async () => {
    const crm = { registerBusiness: jest.fn() };
    const legal = { assertIsCurrentVersion: jest.fn().mockRejectedValue(new Error("Terms changed")) };
    const controller = new ReviewsDirectoryController({} as never, crm as never, legal as never);
    await expect(controller.submitBusiness(body, request, "127.0.0.1")).rejects.toThrow("Terms changed");
    expect(crm.registerBusiness).not.toHaveBeenCalled();
  });
});
