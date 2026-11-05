import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { api, ApiError, type Business, type Review } from "../../lib/api";
import { BusinessView, type Photo } from "../../components/business-view";
import Link from "next/link";
const getBusiness = cache((slug: string) => api<{ business: Business; reviews: Review[] }>(`/reviews-directory/businesses/${encodeURIComponent(slug)}`));
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try { const { business } = await getBusiness(slug); return { title: `${business.name} — reviews and local information`, description: `${business.name}, ${business.address}, Tashkent. Find opening hours, directions, community reviews, and photos on Manzil.`, alternates: { canonical: `/business/${encodeURIComponent(slug)}` } }; } catch { return { title: "Place unavailable", robots: { index: false } }; }
}
export default async function BusinessPage({ params }: Props) {
  const { slug } = await params;
  let data: { business: Business; reviews: Review[] };
  try { data = await getBusiness(slug); } catch (e) { if (e instanceof ApiError && e.status === 404) notFound(); return <section className="container page-section"><h1>This place is temporarily unavailable</h1><p>Please try again in a moment.</p><Link className="button" href="/">Browse places</Link></section>; }
  const photos = await api<{ photos: Photo[] }>(`/media/businesses/${encodeURIComponent(slug)}/photos`).catch(() => ({ photos: [] }));
  return <BusinessView business={data.business} reviews={data.reviews} photos={photos.photos}/>;
}
