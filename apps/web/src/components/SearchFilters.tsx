'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

export default function SearchFilters() {
  const [rating, setRating] = useState(0);
  const [distance, setDistance] = useState(5);
  const t = useTranslations('filters');

  return (
    <div className="bg-white p-6 rounded-lg border border-slate-200">
      <h3 className="font-bold text-lg mb-6">{t('filters')}</h3>

      {/* Rating Filter */}
      <div className="mb-6">
        <label className="font-medium text-slate-900 block mb-3">
          {t('rating')}
        </label>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              className={`text-2xl ${
                star <= rating ? 'text-yellow-400' : 'text-slate-300'
              }`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      {/* Distance Filter */}
      <div className="mb-6">
        <label className="font-medium text-slate-900 block mb-3">
          {t('distance')}: {distance}km
        </label>
        <input
          type="range"
          min="1"
          max="25"
          value={distance}
          onChange={(e) => setDistance(Number(e.target.value))}
          className="w-full"
        />
      </div>

      <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium">
        {t('apply')}
      </button>
    </div>
  );
}
