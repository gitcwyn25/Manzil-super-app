import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";

export type WaitlistTopicName = "city" | "gurman" | "pro";

export type WaitlistJoinInput = {
  topic: WaitlistTopicName;
  email: string;
  locale: string;
  city: string | null;
  businessName: string | null;
  firstName: string | null;
  lastName: string | null;
  heardAbout: string | null;
  featureInterest: string | null;
  source: string | null;
};

@Injectable()
export class WaitlistRepository {
  constructor(private readonly prisma: PrismaService) {}

  async join(input: WaitlistJoinInput): Promise<{ position: number }> {
    const signup = await this.prisma.waitlistSignup.upsert({
      where: { topic_email: { topic: input.topic, email: input.email } },
      update: {
        locale: input.locale,
        city: input.city,
        businessName: input.businessName,
        firstName: input.firstName,
        lastName: input.lastName,
        heardAbout: input.heardAbout,
        featureInterest: input.featureInterest
      },
      create: {
        topic: input.topic,
        email: input.email,
        locale: input.locale,
        city: input.city,
        businessName: input.businessName,
        firstName: input.firstName,
        lastName: input.lastName,
        heardAbout: input.heardAbout,
        featureInterest: input.featureInterest,
        source: input.source
      }
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
