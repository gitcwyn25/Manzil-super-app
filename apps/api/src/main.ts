import { loadEnv } from "./env";

loadEnv();

import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { Logger } from "@nestjs/common";
import { AppModule } from "./modules/app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("v1");
  app.enableCors({
    origin: process.env.WEB_ORIGIN?.split(",").map((origin) => origin.trim()) ?? "http://localhost:3000",
    credentials: true
  });
  app.enableShutdownHooks();

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);

  const logger = new Logger("Bootstrap");
  logger.log(`Manzil API listening on port ${port}`);
  logger.log(
    `Auth mode: ${process.env.CLERK_SECRET_KEY ? "clerk" : process.env.MANZIL_DEV_AUTH === "true" ? "dev-headers" : "locked"}`
  );
}

void bootstrap();
