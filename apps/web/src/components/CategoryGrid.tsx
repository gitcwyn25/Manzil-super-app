'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';

const categories = [
  { id: 'restaurants', icon: '🍽️' },
  { id: 'cafes', icon: '☕' },
  { id: 'beauty', icon: '💇' },
  { id: 'healthcare', icon: '⚕️' },
  { id: 'auto', icon: '🚗' },
  { id: 'fitness', icon: '💪' },
];

export default function CategoryGrid() {
  const t = useTranslations('categories');

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {categories.map((cat) => (
        <Link
          key={cat.id}
          href={`/search?category=${cat.id}`}
          className="p-6 bg-white rounded-lg border border-slate-200 hover:border-blue-500 hover:shadow-lg transition text-center"
        >
          <div className="text-4xl mb-2">{cat.icon}</div>
          <p className="font-medium text-slate-900">{t(cat.id)}</p>
        </Link>
      ))}
    </div>
  );
}
