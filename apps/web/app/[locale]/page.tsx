import type { Locale } from "@manzil/shared";
import { BusinessCard } from "../components/business-card";
import { ClaimForm } from "../components/claim-form";
import { HomeSearch } from "../components/home-search";
import { ReviewForm } from "../components/review-form";
import { ReviewList } from "../components/review-list";
import { getBusinesses, getBusiness, getCategories } from "../lib/api";

export const dynamic = "force-dynamic";

export default async function HomePage({
  params
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const [businesses, categories] = await Promise.all([getBusinesses(), getCategories()]);
  const featured = businesses[0];
  const { reviews: featuredReviews } = await getBusiness(featured.slug);

  return (
    <>
      <section className="hero-section">
        <div>
          <p className="section-kicker">Toshkent uchun mahalliy qo'llanma</p>
          <h1>Yaqiningizdagi ishonchli joylarni toping.</h1>
          <p className="hero-text">
            Restoranlar, qahvaxonalar, salonlar va xizmatlarni reyting, sharh,
            narx va joylashuv bo'yicha tez solishtiring.
          </p>
          <HomeSearch locale={locale} />
          <div className="trust-row" aria-label="Platforma ko'rsatkichlari">
            <span>500+ boshlang'ich listing</span>
            <span>Uzbek, Russian, English</span>
            <span>Founding reviewer badges</span>
          </div>
        </div>

        <aside aria-label="Manzil app preview">
          <div className="phone-shell">
            <div className="phone-top">
              <span>Manzil</span>
              <span>Toshkent</span>
            </div>
            <div className="mini-search">Milliy taomlar</div>
            {businesses.slice(0, 2).map((business) => (
              <div className="mini-card" key={business.id}>
                <div className={`mini-photo photo-block photo-${business.photo}`} />
                <div>
                  <strong>{business.name}</strong>
                  <p>
                    {business.avgRating} ({business.reviewCount}) - {business.tags[0]}
                  </p>
                </div>
              </div>
            ))}
            <div className="map-strip">
              <span className="pin one" />
              <span className="pin two" />
              <span className="pin three" />
            </div>
          </div>
        </aside>
      </section>

      <section className="category-section" aria-label="Kategoriyalar">
        <a className="category-chip active" href={`/${locale}/discover`}>
          Hammasi
        </a>
        {categories.map((category) => (
          <a className="category-chip" href={`/${locale}/discover?category=${category.slug}`} key={category.id}>
            {category.name[locale] ?? category.name.uz}
          </a>
        ))}
      </section>

      <section className="section-block" id="discover">
        <div className="section-heading">
          <p className="section-kicker">Kashfiyot</p>
          <h2>Toshkentda hozir trendda</h2>
          <p>
            Birinchi launch uchun restoranlar va qahvaxonalar chuqurroq
            qoplanadi. Keyin beauty, auto va repair kategoriyalari qo'shiladi.
          </p>
        </div>
        <div className="results-toolbar">
          <p>{businesses.length} ta natija</p>
          <div className="segmented-control" aria-label="Natija ko'rinishi">
            <button className="active" type="button">Ro'yxat</button>
            <button type="button">Xarita</button>
          </div>
        </div>
        <div className="business-grid">
          {businesses.map((business) => (
            <BusinessCard business={business} key={business.id} locale={locale} />
          ))}
        </div>
      </section>

      <section className="section-block profile-section" id="profile">
        <div className="profile-media">
          <div className={`profile-main-photo photo-block photo-${featured.photo}`} />
          <div className="profile-side-photo photo-block photo-somsa" />
          <div className="profile-side-photo photo-block photo-coffee" />
        </div>
        <div className="profile-copy">
          <p className="section-kicker">Biznes profili</p>
          <h2>{featured.name}</h2>
          <div className="rating-line">
            <strong>{featured.avgRating}</strong>
            <span>{featured.reviewCount} ta sharh</span>
            <span>{featured.district}</span>
          </div>
          <p>{featured.description[locale] ?? featured.description.uz}</p>
          <dl className="profile-facts">
            <div>
              <dt>Manzil</dt>
              <dd>{featured.address}</dd>
            </div>
            <div>
              <dt>Ish vaqti</dt>
              <dd>{featured.hours}</dd>
            </div>
            <div>
              <dt>Narx</dt>
              <dd>{featured.priceTier}</dd>
            </div>
          </dl>
          <div className="button-row">
            <a className="primary-button" href="#review">Sharh yozish</a>
            <a className="secondary-button" href="#business">Bu sizning biznesingizmi?</a>
          </div>
        </div>
      </section>

      <section className="section-block reviews-section" id="reviews">
        <div className="section-heading">
          <p className="section-kicker">Ishonch signallari</p>
          <h2>Sharhlar foydalanuvchiga qaror qilishga yordam beradi</h2>
        </div>
        <ReviewList reviews={featuredReviews} />
      </section>

      <section className="section-block review-form-section" id="review">
        <div>
          <p className="section-kicker">MVP formasi</p>
          <h2>Sharh qoldiring</h2>
          <p>
            Backend ulanganda bitta foydalanuvchi bitta biznesga bitta
            tahrirlanadigan sharh qoldiradi.
          </p>
        </div>
        <ReviewForm businessSlug={featured.slug} />
      </section>

      <section className="container business-cta" id="business">
        <div>
          <p className="section-kicker inverse">Biznes egalari uchun</p>
          <h2>Listingni bepul oling va mijozlarga ko'rining.</h2>
          <p>
            Manzil MVP bizneslarga profilni claim qilish, rasmlar va ish vaqtini
            yangilash, sharhlarga javob berish imkoniyatini beradi.
          </p>
        </div>
        <ClaimForm businessName={featured.name} businessSlug={featured.slug} />
      </section>
    </>
  );
}
