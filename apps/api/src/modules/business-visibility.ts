/**
 * What "publicly visible" means for a business — the single definition.
 *
 * A takedown is not a status column. `ConsoleRepository.rejectBusiness` writes
 * `status: "suspended"` and `mergeBusiness` writes `mergedIntoId`; neither
 * removes the row. So every public read path must carry this predicate itself,
 * or the suspended listing keeps being served.
 *
 * This lives at the module root, depending on nothing, precisely so that the
 * core repository, the Gurman retriever, the media controller and the cover
 * loader can all import the same object without any of them depending on a
 * feature module. It was previously copied into three files and consequently
 * reached three of five public read paths — the two it missed still served a
 * suspended business's photos after its listing had 404'd (SECURITY-AUDIT F-1).
 *
 * If you are adding a public read path: import this. If you find yourself
 * typing `status: { not: "suspended" }` by hand, that is the bug.
 */
export const PUBLICLY_VISIBLE_BUSINESS = {
  status: { not: "suspended" },
  mergedIntoId: null
} as const;

/**
 * The same rule expressed as a nested relation filter, for queries that reach
 * a business through another model (`photo.business`, for example) rather than
 * selecting businesses directly.
 */
export const PUBLICLY_VISIBLE_BUSINESS_RELATION = {
  business: PUBLICLY_VISIBLE_BUSINESS
} as const;
