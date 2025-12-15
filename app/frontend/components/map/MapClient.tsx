'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import api from '@/lib/api';
import { geocodeAddress } from '@/lib/geocoding';
import { SearchSettingsPanel, SearchSettings } from '../search/SearchSettingsPanel';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 13);
  }, [center, map]);
  return null;
}

export default function MapClient() {
  const [query, setQuery] = useState('');
  const [places, setPlaces] = useState<any[]>([]);
  const [center, setCenter] = useState<[number, number]>([51.505, -0.09]); // Default London
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState<SearchSettings>({
    acoustics: 50,
    lighting: 50,
    crowdedness: 50,
    budget: 50,
    restrictions: []
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    setLoading(true);

    try {
      const response = await api.post('/place/pro_analyze', {
        query,
        lat: center[0],
        lon: center[1],
        radius: 5000,
        ...settings
      });

      const recommendations = response.data.recommendations || [];

      const geocodedPlaces = await Promise.all(recommendations.map(async (place: any) => {
        if (!place.address) return { ...place, lat: center[0], lon: center[1] }; // Fallback
        const coords = await geocodeAddress(place.address);
        return { ...place, ...coords };
      }));

      setPlaces(geocodedPlaces.filter((p: any) => p.lat && p.lon));

      if (geocodedPlaces.length > 0 && geocodedPlaces[0].lat) {
        setCenter([geocodedPlaces[0].lat, geocodedPlaces[0].lon]);
      }

    } catch (error) {
      console.error('Search error', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative h-[calc(100vh-4rem)] w-full bg-background">
      <div className="absolute top-4 left-4 z-[1000] w-full max-w-sm space-y-2">
        <Card className="p-2 bg-background/95 border border-border shadow-md rounded-lg">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="Describe your vibe (e.g. 'Cozy cafe with wifi')"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-transparent border-0 border-b border-border rounded-none focus-visible:ring-0 focus-visible:border-primary px-0"
            />
            <Button type="submit" size="icon" disabled={loading} className="rounded-md shrink-0">
              <Search className="h-4 w-4" />
            </Button>
          </form>
        </Card>

        {/* Search Settings */}
        <SearchSettingsPanel
          settings={settings}
          onSettingsChange={setSettings}
          className="shadow-md border-border"
        />
      </div>

      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false} className="outline-none">
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        <MapUpdater center={center} />

        {places.map((place, i) => (
          <Marker key={i} position={[place.lat || center[0], place.lon || center[1]]}>
            <Popup>
              <div className="p-2">
                <h3 className="font-bold">{place.name}</h3>
                <p className="text-sm text-muted-foreground">{place.address}</p>
                <div className="mt-2 text-xs bg-primary/10 p-1 rounded text-primary font-medium">
                  Match: {place.match_score}%
                </div>
                <p className="text-xs mt-1">{place.reason}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
