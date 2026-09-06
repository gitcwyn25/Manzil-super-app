import { Injectable } from "@nestjs/common";
import { Prisma, type WaitlistSignup } from "@prisma/client";
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
  purpose: string | null;
  heardFrom: string | null;
  acceptedLegalAt: Date | null;
  source: string | null;
};

@Injectable()
export class WaitlistRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Idempotent by (topic, email): re-submitting returns the existing entry
   * rather than creating a second one, so a double-click cannot push someone
   * behind themselves or send another welcome email.
   */
  async join(input: WaitlistJoinInput): Promise<{ position: number; created: boolean }> {
    let signup: WaitlistSignup;
    let created = false;

    try {
      signup = await this.prisma.waitlistSignup.create({
        data: {
          topic: input.topic,
          email: input.email,
          locale: input.locale,
          city: input.city,
          businessName: input.businessName,
          firstName: input.firstName,
          lastName: input.lastName,
          purpose: input.purpose,
          heardFrom: input.heardFrom,
          acceptedLegalAt: input.acceptedLegalAt,
          source: input.source
        }
      });
      created = true;
    } catch (error) {
      // The compound unique index is the idempotency boundary. A repeat
      // submission updates the profile answers but never creates a second
      // queue entry or sends another welcome email.
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
        throw error;
      }

      signup = await this.prisma.waitlistSignup.update({
        where: { topic_email: { topic: input.topic, email: input.email } },
        data: {
          locale: input.locale,
          city: input.city,
          businessName: input.businessName,
          firstName: input.firstName,
          lastName: input.lastName,
          purpose: input.purpose,
          heardFrom: input.heardFrom,
          acceptedLegalAt: input.acceptedLegalAt
        }
      });
    }

    const position = await this.prisma.waitlistSignup.count({
      where: {
        topic: input.topic,
        ...(input.city ? { city: input.city } : {}),
        OR: [
          { createdAt: { lt: signup.createdAt } },
          { createdAt: signup.createdAt, id: { lte: signup.id } }
        ]
      }
    });

    return { position, created };
  }

  async count(topic: WaitlistTopicName, city?: string): Promise<number> {
    return this.prisma.waitlistSignup.count({
      where: { topic, ...(city ? { city } : {}) }
    });
  }
}
