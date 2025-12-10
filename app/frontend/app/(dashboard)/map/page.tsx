'use client';

import dynamic from 'next/dynamic';

const MapClient = dynamic(() => import('@/components/map/MapClient'), {
  ssr: false,
  loading: () => <div className="h-[calc(100vh-72px)] flex items-center justify-center">Loading Map...</div>
});

export default function MapPage() {
  return <MapClient />;
}
