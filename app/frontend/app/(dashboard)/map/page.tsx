import { Metadata } from 'next';
import MapClient from './MapClient'; // Убедись, что импорт правильный (MapClient.tsx в той же папке)

export const metadata: Metadata = {
  title: 'Map | Vibe Checker',
  description: 'Interactive map powered by 2GIS MapGL API.',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0', // Важно для мобилок
};

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function MapPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const mode = typeof resolvedParams.mode === 'string' ? resolvedParams.mode : undefined;
  const query = typeof resolvedParams.query === 'string' ? resolvedParams.query : undefined;
  const userLat = typeof resolvedParams.lat === 'string' ? parseFloat(resolvedParams.lat) : undefined;
  const userLon = typeof resolvedParams.lon === 'string' ? parseFloat(resolvedParams.lon) : undefined;

  return (
    // fixed inset-0 и overflow-hidden убивают любой скролл
    <main className="fixed inset-0 w-full h-[100dvh] overflow-hidden bg-background overscroll-none touch-none pt-16">
      <MapClient
        mode={mode}
        query={query}
        userLat={userLat}
        userLon={userLon}
      />
    </main>
  );
}