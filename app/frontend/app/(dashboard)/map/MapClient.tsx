'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { MapWrapper } from './_components/MapWrapper';
import { MapMarker } from './_components/MapMarker';
import { GeolocationControl } from './_components/GeolocationControl';
import { ResultsSidebar } from './_components/ResultsSidebar';
import { MobileBottomSheet } from './_components/MobileBottomSheet';
import { useNav } from '@/context/NavContext';
import { LocationData } from '@/types/location';
// ВАЖНО: Импортируем хук нормально
import { useMap } from './_components/MapContext'; 

interface MapClientProps {
  mode?: string;
  query?: string;
  userLat?: number;
  userLon?: number;
}

// --- КОМПОНЕНТ МАРКЕРА ПОЛЬЗОВАТЕЛЯ (Внутри файла, но снаружи MapClient) ---
const UserLocationMarker = ({ coordinates }: { coordinates: [number, number] }) => {
    const { map, mapglAPI } = useMap(); // Используем хук легально
    const markerRef = useRef<any>(null);

    useEffect(() => {
        if (!map || !mapglAPI || !coordinates) return;

        // Удаляем старый, если есть
        if (markerRef.current) markerRef.current.destroy();

        try {
            // Рисуем красивую точку
            markerRef.current = new mapglAPI.CircleMarker(map, {
                coordinates: coordinates,
                radius: 14,
                color: '#0088ff',
                strokeWidth: 2,
                strokeColor: '#ffffff',
                stroke2Width: 6,
                stroke2Color: 'rgba(0, 136, 255, 0.3)',
            });
        } catch (e) {
            console.error("Error creating user marker:", e);
        }

        return () => {
            if (markerRef.current) markerRef.current.destroy();
        };
    }, [map, mapglAPI, coordinates]);

    return null;
};

// --- ОСНОВНОЙ КОМПОНЕНТ ---
const MapClient = ({ mode, query, userLat, userLon }: MapClientProps) => {
  const { setNavHidden } = useNav();
  
  // Дефолт (Астана/Алматы), если координат нет
  // 2GIS порядок: [LON (Долгота), LAT (Широта)]
  const defaultCenter: [number, number] = (userLon && userLat) 
    ? [userLon, userLat] 
    : [71.4304, 51.1282]; // Астана по дефолту

  const [locations, setLocations] = useState<LocationData[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [isSheetExpanded, setIsSheetExpanded] = useState(false);
  
  const mapRef = useRef<any>(null);

  // 1. Загрузка данных
  useEffect(() => {
    // Лог для отладки
    console.log("MapClient Init -> Mode:", mode);
    
    if (mode === 'analysis') {
      try {
        const stored = localStorage.getItem('proModeResults');
        if (stored) {
          const parsedLocations: LocationData[] = JSON.parse(stored);
          console.log("📍 Loaded locations from Storage:", parsedLocations.length);
          setLocations(parsedLocations);
        } else {
            console.warn("⚠️ No proModeResults in LocalStorage");
        }
      } catch (e) { console.error("Error parsing locations:", e); }
    }
  }, [mode]);

  // 2. Инициализация карты
  const handleMapInit = useCallback((mapInstance: any) => {
    mapRef.current = mapInstance;
    console.log("🗺️ Map Initialized");

    // Центрируем карту
    if (locations.length > 0) {
        // Берем первую точку
        const first = locations[0];
        // Проверка на валидность координат перед полетом
        if (first.coordinates && first.coordinates.length === 2) {
             mapInstance.setCenter(first.coordinates);
             mapInstance.setZoom(13);
        }
    } else if (userLat && userLon) {
        mapInstance.setCenter([userLon, userLat]);
        mapInstance.setZoom(14);
    }
  }, [locations, userLat, userLon]);

  const handleSelect = (loc: LocationData) => {
    setSelectedLocation(loc);
    setIsSheetExpanded(true);
    if (mapRef.current) {
      mapRef.current.setCenter(loc.coordinates, { animate: true, duration: 800 });
      mapRef.current.setZoom(16, { animate: true, duration: 800 });
    }
  };

  const handleBack = () => {
    setSelectedLocation(null);
    setIsSheetExpanded(false);
    if (mapRef.current) mapRef.current.setZoom(14, { animate: true });
  };
  
  const handleSheetStateChange = (expanded: boolean) => {
      setIsSheetExpanded(expanded);
      setNavHidden(expanded);
  };

  useEffect(() => { return () => setNavHidden(false); }, [setNavHidden]);

  return (
    <div className="w-full h-full flex overflow-hidden bg-background relative">
      
      <ResultsSidebar 
        locations={locations} 
        selectedLocation={selectedLocation}
        query={query} 
        onSelect={handleSelect} 
        onBack={handleBack}
        isVisible={mode === 'analysis' && locations.length > 0}
      />

      {mode === 'analysis' && locations.length > 0 && (
          <MobileBottomSheet 
            locations={locations}
            selectedLocation={selectedLocation}
            onSelect={handleSelect}
            onClose={handleBack}
            onExpandChange={handleSheetStateChange}
          />
      )}

      <div className="flex-1 relative z-0">
        <MapWrapper 
          initialCenter={defaultCenter}
          onMapInit={handleMapInit}
        >
          <div className="hidden md:block">
             <GeolocationControl />
          </div>
          
          {/* 1. Маркер пользователя */}
          {userLat && userLon && (
             <UserLocationMarker coordinates={[userLon, userLat]} />
          )}

          {/* 2. Маркеры мест */}
          {locations.map((loc) => (
            <MapMarker
              key={loc.id}
              coordinates={loc.coordinates}
              label={loc.name}
              category={loc.category}
              isSelected={selectedLocation?.id === loc.id} 
              onClick={() => handleSelect(loc)}
            />
          ))}

        </MapWrapper>
      </div>
    </div>
  );
};

export default MapClient;