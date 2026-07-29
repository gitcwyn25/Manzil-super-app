/**
 * Whether `userId` may manage a business's media: the claimed owner, or —
 * while the business is still waiting on its first claim — whoever
 * registered it. Mirrors the rule `requireOwnedBusiness`
 * (`../crm/business-ownership.util.ts`) enforces for CRM writes, kept here as
 * a plain boolean check rather than an import so a non-owner upload can fall
 * through to `pending` moderation instead of a thrown 403.
 *
 * This is the server-side claim the moderation decision is based on — never
 * a client-supplied flag.
 */
export type OwnableBusiness = {
  claimedByUserId: string | null;
  createdByUserId: string | null;
  status: string;
};

export function isBusinessOwner(business: OwnableBusiness, userId: string): boolean {
  return (
    business.claimedByUserId === userId ||
    (business.status === "pending_claim" && business.createdByUserId === userId)
  );
}
