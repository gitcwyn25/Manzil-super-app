import { BadRequestException, Body, Controller, Get, Post, Query } from "@nestjs/common";
import { ThrottleSearch } from "../security/throttle.config";
import { WaitlistRepository, type WaitlistTopicName } from "./waitlist.repository";

const TOPICS: WaitlistTopicName[] = ["city", "gurman", "pro"];
const LOCALES = ["uz", "ru", "en"];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type JoinBody = {
  topic?: string;
  email?: string;
  locale?: string;
  city?: string;
  businessName?: string;
  source?: string;
};

function isTopic(value: unknown): value is WaitlistTopicName {
  return typeof value === "string" && TOPICS.includes(value as WaitlistTopicName);
}

@Controller("waitlist")
export class WaitlistController {
  constructor(private readonly waitlist: WaitlistRepository) {}

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

    const { position } = await this.waitlist.join({
      topic: body.topic,
      email,
      locale: LOCALES.includes(body.locale ?? "") ? (body.locale as string) : "uz",
      city: city.length > 0 ? city : null,
      businessName: body.topic === "pro" ? (body.businessName ?? "").trim() || null : null,
      source: body.source ?? null
    });

    return { data: { ok: true, position } };
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
