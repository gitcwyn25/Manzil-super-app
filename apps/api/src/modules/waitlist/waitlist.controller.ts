import { BadRequestException, Body, Controller, Get, Post, Query } from "@nestjs/common";
import { ThrottleSearch } from "../security/throttle.config";
import { WaitlistWelcomeMailService } from "./waitlist-welcome-mail.service";
import { WaitlistRepository, type WaitlistTopicName } from "./waitlist.repository";

const TOPICS: WaitlistTopicName[] = ["city", "gurman", "pro"];
const LOCALES = ["uz", "ru", "en"];
const GURMAN_PURPOSES = ["discover", "plan", "food", "local", "other"];
const GURMAN_SOURCES = ["instagram", "telegram", "youtube", "friend", "search", "other"];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function isTopic(value: unknown): value is WaitlistTopicName {
  return typeof value === "string" && TOPICS.includes(value as WaitlistTopicName);
}

function isChoice(value: unknown, choices: readonly string[]): value is string {
  return typeof value === "string" && choices.includes(value);
}

export type JoinBody = {
  topic?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  locale?: string;
  city?: string;
  businessName?: string;
  purpose?: string;
  heardFrom?: string;
  acceptedLegal?: boolean;
  source?: string;
};

@Controller("waitlist")
export class WaitlistController {
  constructor(
    private readonly waitlist: WaitlistRepository,
    private readonly welcomeMail: WaitlistWelcomeMailService
  ) {}

  /** Public capture for the three waitlist topics. Unauthenticated by design. */
  @Post()
  @ThrottleSearch()
  async join(@Body() body: JoinBody) {
    if (!isTopic(body.topic)) {
      throw new BadRequestException("Unknown waitlist topic");
    }

    const email = (body.email ?? "").trim().toLowerCase();

    if (!EMAIL.test(email)) {
      throw new BadRequestException("Enter a valid email address");
    }

    // A city signup with no city cannot answer the question the city waitlist
    // exists to answer, so it is rejected rather than stored as noise.
    const city = body.topic === "city" ? (body.city ?? "").trim() : "";

    if (body.topic === "city" && city.length === 0) {
      throw new BadRequestException("Choose a city");
    }

    const firstName = body.topic === "gurman" ? (body.firstName ?? "").trim() : "";
    const lastName = body.topic === "gurman" ? (body.lastName ?? "").trim() : "";
    const purpose = body.topic === "gurman" ? (body.purpose ?? "").trim() : "";
    const heardFrom = body.topic === "gurman" ? (body.heardFrom ?? "").trim() : "";
    const locale = LOCALES.includes(body.locale ?? "") ? (body.locale as string) : "uz";

    if (body.topic === "gurman") {
      if (!firstName) throw new BadRequestException("Enter your forename");
      if (!lastName) throw new BadRequestException("Enter your surname");
      if (!isChoice(purpose, GURMAN_PURPOSES)) throw new BadRequestException("Choose how you want to use Gurman");
      if (!isChoice(heardFrom, GURMAN_SOURCES)) throw new BadRequestException("Choose where you heard about Gurman");
      if (body.acceptedLegal !== true) {
        throw new BadRequestException("Please agree to the Terms of Service and Privacy Policy");
      }
    }

    const result = await this.waitlist.join({
      topic: body.topic,
      email,
      locale,
      city: city.length > 0 ? city : null,
      businessName: body.topic === "pro" ? (body.businessName ?? "").trim() || null : null,
      firstName: body.topic === "gurman" ? firstName : null,
      lastName: body.topic === "gurman" ? lastName : null,
      purpose: body.topic === "gurman" ? purpose : null,
      heardFrom: body.topic === "gurman" ? heardFrom : null,
      acceptedLegalAt: body.topic === "gurman" ? new Date() : null,
      source: body.source ?? null
    });

    // Registration is the durable operation. Resend is deliberately best
    // effort: a provider outage must not make a saved signup look failed or
    // cause the user to submit a second time.
    if (body.topic === "gurman" && result.created) {
      try {
        await this.welcomeMail.send({
          email,
          firstName,
          locale,
          position: result.position
        });
      } catch {
        // The adapter already handles provider errors; this guard protects the
        // signup path from an unexpected adapter implementation failure.
      }
    }

    return { data: { ok: true, position: result.position } };
  }

  /** Public signup count, used to show real demand on the waitlist page. */
  @Get("count")
  @ThrottleSearch()
  async count(@Query("topic") topic?: string, @Query("city") city?: string) {
    if (!isTopic(topic)) {
      throw new BadRequestException("Unknown waitlist topic");
    }

    return { data: { count: await this.waitlist.count(topic, city?.trim() || undefined) } };
  }
}
