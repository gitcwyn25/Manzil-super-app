import { Prisma } from "@prisma/client";
import { ActivationSchemaFilter } from "./activation-schema.filter";

function makeHost() {
  const response = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn()
  };
  const host = {
    switchToHttp: () => ({ getResponse: () => response })
  } as never;
  return { host, response };
}

describe("ActivationSchemaFilter", () => {
  it("returns a typed unavailable response for missing activation schema", () => {
    const { host, response } = makeHost();
    const filter = new ActivationSchemaFilter();

    filter.catch({ code: "P2021" } as Prisma.PrismaClientKnownRequestError, host);

    expect(response.status).toHaveBeenCalledWith(503);
    expect(response.json).toHaveBeenCalledWith({
      statusCode: 503,
      code: "SCHEMA_UNAVAILABLE",
      message: "Merchant activation schema is not applied in this environment"
    });
  });

  it("does not swallow unrelated Prisma failures", () => {
    const { host } = makeHost();
    const filter = new ActivationSchemaFilter();
    const error = { code: "P2002" } as Prisma.PrismaClientKnownRequestError;

    expect(() => filter.catch(error, host)).toThrow();
  });
});
