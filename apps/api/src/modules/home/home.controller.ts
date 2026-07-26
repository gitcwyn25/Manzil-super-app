import { Controller, Get, Query } from "@nestjs/common";
import { ThrottleSearch } from "../security/throttle.config";
import { HomeRepository } from "./home.repository";

const LOCALES = ["uz", "ru", "en"];

@Controller("home")
export class HomeController {
  constructor(private readonly home: HomeRepository) {}

  /** Public landing-page feed: just-joined, featured picks, and category counts. */
  @Get()
  @ThrottleSearch()
  async feed(@Query("locale") locale?: string) {
    return { data: await this.home.getHomeFeed(LOCALES.includes(locale ?? "") ? locale : "uz") };
  }
}
