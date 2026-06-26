'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

export default function ReviewForm() {
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const t = useTranslations('reviews');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Submit review
    console.log({ rating, text });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-slate-50 p-6 rounded-lg mb-8">
      <h3 className="font-bold text-lg mb-4">{t('writeReview')}</h3>

      {/* Rating */}
      <div className="mb-4">
        <label className="block font-medium mb-2">{t('rating')}</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className={`text-3xl ${
                star <= rating ? 'text-yellow-400' : 'text-slate-300'
              }`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      {/* Text */}
      <div className="mb-4">
        <label className="block font-medium mb-2">{t('text')}</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('placeholder')}
          className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
          rows={4}
          required
          minLength={20}
        />
      </div>

      <button
        type="submit"
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
      >
        {t('submit')}
      </button>
    </form>
  );
}
