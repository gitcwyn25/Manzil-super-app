import { loadEnv } from "./env";
import { initSentry } from "./instrument";

loadEnv();

// Must run before express/prisma/ioredis are imported below — Sentry patches
// those at require time and silently degrades if initialised afterwards.
initSentry();

import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { Logger, ValidationPipe } from "@nestjs/common";
import type { NestExpressApplication } from "@nestjs/platform-express";
import helmet from "helmet";
import { AppModule } from "./modules/app.module";
import { resolveCorsOrigins } from "./modules/security/cors.config";

async function bootstrap() {
  // `rawBody: true` makes Nest additionally capture the unparsed request
  // body into `req.rawBody` alongside the normal parsed `req.body`. The
  // Stripe webhook needs this: signature verification hashes the exact bytes
  // Stripe sent, and re-serialising the parsed JSON does not reproduce them
  // byte-for-byte (key order, whitespace), which would make every signature
  // check fail.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true });
  const logger = new Logger("Bootstrap");

  // Railway (and any reverse proxy) terminates TLS and forwards the real client
  // address in X-Forwarded-For. Without this, Express reports the proxy's IP for
  // every request — which would make the rate limiter bucket all traffic
  // together and let one abusive client lock out every user.
  //
  // Scoped to one hop: trusting the whole chain would let a client spoof
  // X-Forwarded-For and mint a fresh rate-limit bucket per request.
  app.set("trust proxy", 1);

  app.setGlobalPrefix("v1");

  // Security headers. The API serves JSON only, so CSP is set to a minimal
  // deny-all rather than the browser-page defaults, and CORP is relaxed so the
  // web app on a different origin can read responses.
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'none'"],
          frameAncestors: ["'none'"],
          baseUri: ["'none'"],
          formAction: ["'none'"]
        }
      },
      crossOriginResourcePolicy: { policy: "cross-origin" },
      referrerPolicy: { policy: "no-referrer" },
      // HSTS is only meaningful over TLS and would pin localhost in dev.
      hsts: process.env.NODE_ENV === "production" ? { maxAge: 15552000, includeSubDomains: true } : false
    })
  );

  const { origins, isWildcard } = resolveCorsOrigins(process.env.WEB_ORIGIN, process.env.NODE_ENV);

  if (isWildcard) {
    // Wildcard + credentials is rejected by browsers anyway, and in production
    // it would mean any site could drive authenticated requests.
    throw new Error(
      'WEB_ORIGIN must be an explicit origin list in production — wildcard ("*") is not permitted with credentialed CORS.'
    );
  }

  app.enableCors({
    origin: origins,
    credentials: true
  });

  // Runtime validation for every DTO-typed handler. `whitelist` strips unknown
  // properties and `forbidNonWhitelisted` rejects them outright, so a client
  // cannot smuggle extra fields (e.g. `role`, `status`) into a create/update.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false }
    })
  );

  app.enableShutdownHooks();

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);

  logger.log(`Manzil API listening on port ${port}`);
  logger.log(
    `Auth mode: ${process.env.CLERK_SECRET_KEY ? "clerk" : process.env.MANZIL_DEV_AUTH === "true" ? "dev-headers" : "locked"}`
  );
  logger.log(`CORS origins: ${origins.join(", ")}`);
}

void bootstrap();
