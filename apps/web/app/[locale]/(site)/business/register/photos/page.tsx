import { auth } from "@clerk/nextjs/server";
import type { Locale } from "@manzil/shared";
import { BusinessPhotoManager } from "../../../../../components/business-photo-manager";
import { getBusinessPhotos } from "../../../../../lib/crm-api";
import { getCrmCopy } from "../../../../../lib/crm-copy";

export const dynamic = "force-dynamic";

/**
 * The photos step: after the business exists and a plan is chosen, before
 * the dashboard. Deliberately skippable — `POST /media/presign` verifies the
 * business exists before signing anything, so this can never run ahead of
 * registration, but there is no reason to force a photo before the owner is
 * ready to add one.
 */
export default async function RegisterPhotosPage({
  params,
  searchParams
}: {
  params: Promise<{ locale: Locale }>;
  searchParams: Promise<{ business?: string }>;
}) {
  const [{ locale }, { business: slug }] = await Promise.all([params, searchParams]);
  const copy = getCrmCopy(locale);
  const { userId } = await auth();

  if (!userId || !slug) {
    return (
      <section className="crm-auth-panel">
        <h1>{copy.register.signInFirst}</h1>
        <a className="bz-btn-primary" href={`/${locale}/business/register`}>{copy.common.registerCta}</a>
      </section>
    );
  }

  const photosData = await getBusinessPhotos(slug);

  return (
    <section className="crm-register">
      <header className="crm-register-head">
        <h1>{copy.photos.title}</h1>
        <p>{copy.photos.subtitle}</p>
      </header>

      <div className="crm-panel">
        <BusinessPhotoManager
          businessSlug={slug}
          copy={copy.photos}
          initialPhotos={
            photosData?.photos.map((photo) => ({
              id: photo.id,
              publicUrl: photo.publicUrl,
              moderationStatus: photo.moderationStatus,
              isCover: photo.isCover
            })) ?? []
          }
        />
      </div>

      <div className="crm-form-actions">
        <a className="bz-btn-ghost" href={`/${locale}/dashboard`}>
          {copy.photos.skip}
        </a>
        <a className="bz-btn-primary" href={`/${locale}/dashboard`}>
          {copy.photos.continueCta}
        </a>
      </div>
    </section>
  );
}
