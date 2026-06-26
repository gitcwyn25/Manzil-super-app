'use client';

import { useTranslations } from 'next-intl';

interface BusinessCardProps {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviewCount: number;
  image: string;
  distance: number;
}

export default function BusinessCard({
  id,
  name,
  category,
  rating,
  reviewCount,
  image,
  distance,
}: BusinessCardProps) {
  const t = useTranslations('business');

  return (
    <a href={`/businesses/${id}`} className="block bg-white rounded-lg overflow-hidden border border-slate-200 hover:shadow-lg transition">
      <div className="aspect-video bg-slate-200 overflow-hidden">
        <img src={image} alt={name} className="w-full h-full object-cover" />
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg text-slate-900 mb-2">{name}</h3>
        <p className="text-sm text-slate-600 mb-3">{category}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-yellow-400">★</span>
            <span className="font-medium">{rating.toFixed(1)}</span>
            <span className="text-sm text-slate-600">({reviewCount})</span>
          </div>
          <span className="text-sm text-slate-600">{distance}km</span>
        </div>
      </div>
    </a>
  );
}
