// app/(dashboard)/map/page.tsx
import { Metadata } from 'next';
import Map2GISClient from './Map2GISClient';

export const metadata: Metadata = {
  title: 'Explore Map | Vibe Checker',
  description: 'Interactive map powered by 2GIS MapGL API.',
};

export default async function MapPage({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const mode = searchParams?.mode as string | undefined;
  const query = typeof searchParams?.query === 'string' ? searchParams.query : undefined;
  const userLat = typeof searchParams?.lat === 'string' ? parseFloat(searchParams.lat) : undefined;
  const userLon = typeof searchParams?.lon === 'string' ? parseFloat(searchParams.lon) : undefined;

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-background">
      <Map2GISClient mode={mode} query={query} userLat={userLat} userLon={userLon} />
    </div>
  );
}