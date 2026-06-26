import { useTranslations } from 'next-intl';
import { Suspense } from 'react';
import BusinessCard from '@/components/BusinessCard';
import SearchFilters from '@/components/SearchFilters';

export default function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string; category?: string };
}) {
  const t = useTranslations('search');

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">
          {t('results')}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Filters */}
          <div className="md:col-span-1">
            <SearchFilters />
          </div>

          {/* Results */}
          <div className="md:col-span-3">
            <Suspense fallback={<div>{t('loading')}</div>}>
              <div className="grid grid-cols-1 gap-4">
                <p className="text-slate-600">Results will appear here</p>
              </div>
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
