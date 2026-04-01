'use client';

import { useEffect, useState } from 'react';

export default function MapPreview({ location }: { location: string }) {
  const [mapUrl, setMapUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!location) return;
    fetch(`/api/meet-up/map-preview?location=${encodeURIComponent(location)}`)
      .then(res => res.json())
      .then(data => setMapUrl(data.mapUrl))
      .catch(() => setMapUrl(null));
  }, [location]);

  if (!location) return null;
  if (!mapUrl) return <div className="rounded-lg bg-slate-100 h-[180px] flex items-center justify-center text-slate-400">Map preview unavailable</div>;

  return (
    <img
      src={mapUrl}
      alt="Map preview"
      className="rounded-lg shadow border mx-auto"
      width={300}
      height={150}
      style={{ maxWidth: '100%', height: 'auto' }}
    />
  );
}
