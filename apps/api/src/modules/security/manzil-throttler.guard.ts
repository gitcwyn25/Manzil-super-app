import { ExecutionContext, Injectable } from "@nestjs/common";
import { ThrottlerGuard, ThrottlerException } from "@nestjs/throttler";
import type { ThrottlerLimitDetail } from "@nestjs/throttler";

type ThrottledRequest = {
  ip?: string;
  ips?: string[];
  path?: string;
  body?: Record<string, unknown>;
};

/**
 * Rate-limit guard for Manzil.
 *
 * Tracking is **by client IP, not by session**. That is deliberate: this guard
 * is registered globally and therefore runs *before* the controller-scoped
 * `ManzilAuthGuard`, so no verified actor exists yet. Keying on an unverified
 * bearer token would be worse than useless — an attacker could rotate random
 * tokens to get a fresh bucket per request and bypass the limit entirely.
 *
 * IP resolution depends on `trust proxy` being set in `main.ts`. Without it
 * every request behind Railway's proxy reports the same address and the limits
 * become global instead of per-client.
 */
@Injectable()
export class ManzilThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: ThrottledRequest): Promise<string> {
    // `req.ips` is populated (left-to-right, client first) only when Express
    // trusts the proxy chain; fall back to `req.ip` for direct connections.
    const forwarded = req.ips?.length ? req.ips[0] : undefined;
    return forwarded ?? req.ip ?? "unknown";
  }

  /**
   * Returns 429 with a machine-readable body so clients can show a real
   * "try again in N seconds" instead of a generic failure.
   */
  protected async throwThrottlingException(
    _context: ExecutionContext,
    detail: ThrottlerLimitDetail
  ): Promise<void> {
    throw new ThrottlerException(
      JSON.stringify({
        message: "Too many requests. Please slow down and try again shortly.",
        code: "RATE_LIMITED",
        retryAfterSeconds: detail.timeToBlockExpire || detail.timeToExpire
      })
    );
  }
}

/**
 * Tracker for OTP routes: buckets by the **destination phone number** rather
 * than the caller's IP.
 *
 * SMS-bombing and code brute-forcing both target one phone number while the
 * attacker rotates IPs, so an IP-keyed limit does not constrain either. Falls
 * back to IP when no phone is present in the body.
 *
 * Wire with `@Throttle(...)` + `@ThrottlerTracker(phoneTracker)` on the OTP
 * send/verify handlers once those endpoints exist.
 */
export const phoneTracker = async (req: ThrottledRequest): Promise<string> => {
  const phone = req.body?.phone ?? req.body?.phoneNumber;

  if (typeof phone === "string" && phone.trim().length > 0) {
    // Normalise so "+998 90 123-45-67" and "+998901234567" share a bucket.
    return `phone:${phone.replace(/[^\d]/g, "")}`;
  }

  const forwarded = req.ips?.length ? req.ips[0] : undefined;
  return `ip:${forwarded ?? req.ip ?? "unknown"}`;
};
