import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";

export type WaitlistTopicName = "city" | "gurman" | "pro";

export type WaitlistJoinInput = {
  topic: WaitlistTopicName;
  email: string;
  locale: string;
  city: string | null;
  businessName: string | null;
  source: string | null;
};

@Injectable()
export class WaitlistRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Idempotent by (topic, email): re-submitting returns the existing entry
   * rather than creating a second one, so a double-click cannot push someone
   * behind themselves.
   */
  async join(input: WaitlistJoinInput): Promise<{ position: number }> {
    await this.prisma.waitlistSignup.upsert({
      where: { topic_email: { topic: input.topic, email: input.email } },
      // Existing reviewed/qualified records are intentionally immutable from
      // the public form. Only a still-new record may refresh intake context.
      update: {},
      create: {
        topic: input.topic,
        email: input.email,
        locale: input.locale,
        city: input.city,
        businessName: input.businessName,
        source: input.source
      }
    });

    await this.prisma.waitlistSignup.updateMany({
      where: {
        topic: input.topic,
        email: input.email,
        status: "new"
      },
      data: {
        locale: input.locale,
        city: input.city,
        businessName: input.businessName
      }
    });

    const signup = await this.prisma.waitlistSignup.findUniqueOrThrow({
      where: { topic_email: { topic: input.topic, email: input.email } }
    });

    const position = await this.prisma.waitlistSignup.count({
      where: {
        topic: input.topic,
        ...(input.city ? { city: input.city } : {}),
        createdAt: { lte: signup.createdAt }
      }
    });

    return { position };
  }

  async count(topic: WaitlistTopicName, city?: string): Promise<number> {
    return this.prisma.waitlistSignup.count({
      where: { topic, ...(city ? { city } : {}) }
    });
  }
}
