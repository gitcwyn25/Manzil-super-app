"use server";

import { revalidatePath } from "next/cache";

/**
 * Busts the cached business profile after its data changes.
 *
 * `getBusiness` fetches with `next: { revalidate: 30 }`, so without this a
 * freshly submitted review is invisible for up to 30 seconds — while the form
 * tells the user it "will appear when the page refreshes". A success message
 * that is not yet true is the same class of confusion as the failure message
 * that was not true.
 */
export async function revalidateBusinessProfile(locale: string, slug: string) {
  revalidatePath(`/${locale}/businesses/${slug}`);
}
