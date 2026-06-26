import { useTranslations } from 'next-intl';
import Link from 'next/link';
import SearchBar from '@/components/SearchBar';
import CategoryGrid from '@/components/CategoryGrid';

export default function HomePage() {
  const t = useTranslations('home');

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero */}
      <section className="px-4 py-12 md:py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            {t('title')}
          </h1>
          <p className="text-lg text-slate-600 mb-8">{t('subtitle')}</p>
          <SearchBar />
        </div>
      </section>

      {/* Categories */}
      <section className="px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">
            {t('categories')}
          </h2>
          <CategoryGrid />
        </div>
      </section>

      {/* Trending */}
      <section className="px-4 py-12 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">
            {t('trending')}
          </h2>
          <p className="text-slate-600">{t('loadingBusinesses')}</p>
        </div>
      </section>
    </div>
  );
}
