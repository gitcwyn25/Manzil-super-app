import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import ReviewList from '@/components/ReviewList';
import ReviewForm from '@/components/ReviewForm';
import BusinessMap from '@/components/BusinessMap';

export default function BusinessPage({
  params: { id },
}: {
  params: { id: string };
}) {
  const t = useTranslations('business');

  return (
    <div className="min-h-screen bg-white">
      {/* Business Header */}
      <section className="border-b">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Business Name
          </h1>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex text-yellow-400">★★★★☆</div>
            <span className="text-slate-600">4.5 (128 reviews)</span>
          </div>
          <p className="text-slate-600 mb-4">Category • Address • 2km away</p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Photos & Map */}
        <div className="md:col-span-2">
          <Suspense fallback={<div>{t('loadingPhotos')}</div>}>
            <div className="aspect-video bg-slate-200 rounded-lg mb-8">Photo gallery</div>
          </Suspense>
          <Suspense fallback={<div>{t('loadingMap')}</div>}>
            <BusinessMap />
          </Suspense>
        </div>

        {/* Info Sidebar */}
        <div className="bg-slate-50 p-6 rounded-lg">
          <h3 className="font-bold mb-4">{t('hours')}</h3>
          <p className="text-slate-600 text-sm mb-6">9:00 AM - 10:00 PM</p>
          <h3 className="font-bold mb-4">{t('contact')}</h3>
          <p className="text-slate-600 text-sm">(99) 123-45-67</p>
        </div>
      </div>

      {/* Reviews Section */}
      <section className="border-t">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">
            {t('reviews')}
          </h2>
          <Suspense fallback={<div>{t('loadingReviews')}</div>}>
            <ReviewForm />
          </Suspense>
          <Suspense fallback={<div>{t('loadingReviews')}</div>}>
            <ReviewList businessId={id} />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
