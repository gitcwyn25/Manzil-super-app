'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';

export default function BusinessMap() {
  const mapRef = useRef<HTMLDivElement>(null);
  const t = useTranslations('business');

  useEffect(() => {
    // TODO: Initialize Google Maps when API key is available
  }, []);

  return (
    <div
      ref={mapRef}
      className="w-full h-96 bg-slate-200 rounded-lg border border-slate-200 flex items-center justify-center"
    >
      <p className="text-slate-600">{t('mapLoading')}</p>
    </div>
  );
}
