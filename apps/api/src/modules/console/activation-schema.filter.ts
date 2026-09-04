import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from "@nestjs/common";
import { Prisma } from "@prisma/client";

/**
 * The activation contract is deliberately gated behind an independently
 * released migration. If the flag and schema drift, operators need a typed
 * unavailable state—not a generic 500 or fabricated empty queue.
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class ActivationSchemaFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost): void {
    if (exception.code !== "P2021" && exception.code !== "P2022") {
      throw exception;
    }

    const response = host.switchToHttp().getResponse();
    response.status(HttpStatus.SERVICE_UNAVAILABLE).json({
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      code: "SCHEMA_UNAVAILABLE",
      message: "Merchant activation schema is not applied in this environment"
    });
  }
}
