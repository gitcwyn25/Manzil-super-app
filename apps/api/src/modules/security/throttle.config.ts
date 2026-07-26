import { Throttle, seconds, minutes, hours } from "@nestjs/throttler";

/**
 * Rate-limit tiers.
 *
 * One `default` throttler is registered globally (generous, catches broad
 * scraping/abuse). Sensitive routes override it with `@Throttle` via the
 * helpers below, so the limit lives next to the handler it protects.
 *
 * `blockDuration` matters as much as `limit`: without it a caller resumes the
 * moment the window rolls, which barely slows a brute-force. With it, tripping
 * the limit costs a fixed penalty.
 */

/** Global fallback — broad abuse/scraping protection, not a security control. */
export const DEFAULT_THROTTLE = {
  limit: 300,
  ttl: minutes(1),
  blockDuration: minutes(1)
};

/**
 * OTP send. Tight because each request costs money and spams a real phone.
 * Tracked per destination phone number, not per IP — see `PhoneThrottleGuard`.
 */
export const ThrottleOtpSend = () =>
  Throttle({ default: { limit: 3, ttl: minutes(15), blockDuration: minutes(30) } });

/**
 * OTP verify. The tightest limit in the app: a 4-6 digit code is 10k-1M
 * possibilities, so an unthrottled verify endpoint is brute-forceable in
 * minutes. 5 attempts per 15 minutes with a 1-hour block makes exhaustive
 * search take years.
 */
export const ThrottleOtpVerify = () =>
  Throttle({ default: { limit: 5, ttl: minutes(15), blockDuration: hours(1) } });

/** Session/token exchange — credential-stuffing surface. */
export const ThrottleAuth = () =>
  Throttle({ default: { limit: 10, ttl: minutes(1), blockDuration: minutes(5) } });

/** Business registration — fake-listing spam control. */
export const ThrottleRegister = () =>
  Throttle({ default: { limit: 5, ttl: hours(1), blockDuration: hours(1) } });

/** Search — expensive multi-column ILIKE scan; protects the database, not just the API. */
export const ThrottleSearch = () =>
  Throttle({ default: { limit: 30, ttl: minutes(1), blockDuration: minutes(1) } });

/** User-generated content writes (reviews, announcements) — spam control. */
export const ThrottleWrite = () =>
  Throttle({ default: { limit: 20, ttl: minutes(1), blockDuration: minutes(2) } });

/** Anonymous visit tracking — high legitimate volume, but trivially forgeable. */
export const ThrottleVisit = () =>
  Throttle({ default: { limit: 60, ttl: minutes(1), blockDuration: minutes(1) } });

/** Presigned upload issuance — each call creates a Photo row and a writable URL. */
export const ThrottleUpload = () =>
  Throttle({ default: { limit: 20, ttl: minutes(5), blockDuration: minutes(10) } });

export { seconds, minutes, hours };
