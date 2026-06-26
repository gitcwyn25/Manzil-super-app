'use client';

import { useTranslations } from 'next-intl';

export default function ReviewList({ businessId }: { businessId: string }) {
  const t = useTranslations('reviews');

  return (
    <div className="space-y-4">
      <div className="bg-white p-6 rounded-lg border border-slate-200">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 bg-slate-300 rounded-full" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-slate-900">Reviewer Name</h4>
              <span className="text-yellow-400">★★★★★</span>
            </div>
            <p className="text-slate-600 mb-3">
              Great place! Highly recommended to everyone.
            </p>
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <button className="hover:text-slate-900">👍 Helpful</button>
              <span>2 days ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
