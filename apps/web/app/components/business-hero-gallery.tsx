import { Icon } from "./vm/icons";

/**
 * Business-details hero mosaic: one large tile spanning the left half plus a
 * 2x2 of smaller tiles on md+; mobile collapses to the main tile only.
 *
 * Photos come exclusively from getBusinessPhotos (the coverPhotoUrl/R2
 * pipeline). Missing slots degrade to VM-palette gradient tiles — the
 * established fallback pattern — and the photo-count pill renders only when
 * at least one real photo exists, always with the true count.
 */
const FALLBACK_VARIANTS = ["a", "b", "c", "d"] as const;

export function BusinessHeroGallery({
  name,
  initial,
  photos,
  countLabel
}: {
  name: string;
  /** First letter of the business name, shown on the main gradient fallback. */
  initial: string;
  photos: string[];
  /** Localized "N photos" label; null hides the pill (no photos yet). */
  countLabel: string | null;
}) {
  return (
    <div className="biz-hero">
      {[0, 1, 2, 3, 4].map((index) => {
        const photo = photos[index];
        const main = index === 0;

        return (
          <div className={main ? "biz-hero__tile biz-hero__tile--main" : "biz-hero__tile"} key={index}>
            {photo ? (
              <img
                alt={main ? name : ""}
                className="biz-hero__img"
                loading={main ? "eager" : "lazy"}
                src={photo}
              />
            ) : (
              <div
                aria-hidden="true"
                className={`biz-hero__fallback biz-hero__fallback--${FALLBACK_VARIANTS[index % FALLBACK_VARIANTS.length]}`}
              >
                {main ? <span className="biz-hero__initial">{initial}</span> : null}
              </div>
            )}
            {main && photo ? <div aria-hidden="true" className="biz-hero__scrim" /> : null}
            {main && countLabel ? (
              <span className="biz-hero__count">
                <Icon name="image" size={14} />
                {countLabel}
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
