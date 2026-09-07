import { BadRequestException, Body, Controller, Get, Post, Query } from "@nestjs/common";
import { ThrottleSearch } from "../security/throttle.config";
import { WaitlistRepository, type WaitlistTopicName } from "./waitlist.repository";

const TOPICS: WaitlistTopicName[] = ["city", "gurman", "pro"];
const LOCALES = ["uz", "ru", "en"];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const GURMAN_HEARD_ABOUT = ["friend", "instagram", "telegram", "search", "other"] as const;
const GURMAN_FEATURES = ["discover", "planning", "recommendations", "bookings", "all"] as const;

type GurmanHeardAbout = (typeof GURMAN_HEARD_ABOUT)[number];
type GurmanFeatureInterest = (typeof GURMAN_FEATURES)[number];

export type JoinBody = {
  topic?: string;
  email?: string;
  locale?: string;
  city?: string;
  businessName?: string;
  firstName?: string;
  lastName?: string;
  heardAbout?: string;
  featureInterest?: string;
  source?: string;
};

function isTopic(value: unknown): value is WaitlistTopicName {
  return typeof value === "string" && TOPICS.includes(value as WaitlistTopicName);
}

function clean(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function isGurmanHeardAbout(value: string): value is GurmanHeardAbout {
  return (GURMAN_HEARD_ABOUT as readonly string[]).includes(value);
}

function isGurmanFeature(value: string): value is GurmanFeatureInterest {
  return (GURMAN_FEATURES as readonly string[]).includes(value);
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

    const email = clean(body.email, 160).toLowerCase();

    if (!EMAIL.test(email)) {
      throw new BadRequestException("Enter a valid email address");
    }

    const city = body.topic === "city" ? clean(body.city, 80) : "";
    if (body.topic === "city" && city.length === 0) {
      throw new BadRequestException("Choose a city");
    }

    const firstName = clean(body.firstName, 80);
    const lastName = clean(body.lastName, 80);
    const heardAbout = clean(body.heardAbout, 40);
    const featureInterest = clean(body.featureInterest, 40);

    if (body.topic === "gurman") {
      if (!firstName || !lastName) {
        throw new BadRequestException("Enter your name and surname");
      }
      if (!isGurmanHeardAbout(heardAbout)) {
        throw new BadRequestException("Choose how you heard about Manzil");
      }
      if (!isGurmanFeature(featureInterest)) {
        throw new BadRequestException("Choose a feature");
      }
    }

    const { position } = await this.waitlist.join({
      topic: body.topic,
      email,
      locale: LOCALES.includes(body.locale ?? "") ? (body.locale as string) : "uz",
      city: city.length > 0 ? city : null,
      businessName: body.topic === "pro" ? clean(body.businessName, 160) || null : null,
      firstName: firstName || null,
      lastName: lastName || null,
      heardAbout: heardAbout || null,
      featureInterest: featureInterest || null,
      source: clean(body.source, 120) || null
    });

    return { data: { ok: true, position } };
  }

  @Get("count")
  @ThrottleSearch()
  async count(@Query("topic") topic?: string, @Query("city") city?: string) {
    if (!isTopic(topic)) {
      throw new BadRequestException("Unknown waitlist topic");
    }

    return { data: { count: await this.waitlist.count(topic, city?.trim() || undefined) } };
  }
}
