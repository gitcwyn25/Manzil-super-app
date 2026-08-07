import { SetMetadata } from "@nestjs/common";

export const NO_IDEMPOTENCY_KEY = "manzil:no-idempotency";

/**
 * Opts a handler out of idempotent replay.
 *
 * The interceptor is global and applies to every POST that carries a key, so
 * an endpoint that must not have its response recorded has to say so
 * explicitly. Two categories qualify, and only two:
 *
 * 1. **Endpoints with their own deduplication contract.** The Stripe webhook
 *    verifies a signature over the exact bytes and Stripe already redelivers
 *    with its own event id; layering a second scheme on it would add a way for
 *    the two to disagree.
 * 2. **Endpoints whose response is a credential.** A session token replayed
 *    from a 24h store is a token whose lifetime we no longer control.
 *
 * "This endpoint is not a create" is *not* a reason to opt out. A non-create
 * POST that receives a key simply records its own response and replays it,
 * which is correct.
 */
export const NoIdempotency = () => SetMetadata(NO_IDEMPOTENCY_KEY, true);
