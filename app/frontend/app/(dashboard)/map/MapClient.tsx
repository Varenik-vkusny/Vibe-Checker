'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { MapWrapper } from './_components/MapWrapper';
import { MapMarker } from './_components/MapMarker';
import { GeolocationControl } from './_components/GeolocationControl';
import { ResultsSidebar } from './_components/ResultsSidebar';
import { MobileBottomSheet } from './_components/MobileBottomSheet';
import { useNav } from '@/context/NavContext'; // Импортируем хук для управления меню
import { LocationData } from '@/types/location'; // Убедись, что путь к типам верный

interface MapClientProps {
  mode?: string;
  query?: string;
  userLat?: number;
  userLon?: number;
}

const MapClient = ({ mode, query, userLat, userLon }: MapClientProps) => {
  const { setNavHidden } = useNav(); // Получаем управление навигацией
  
  const defaultCenter: [number, number] = (userLon && userLat) 
    ? [userLon, userLat] 
    : [55.31878, 25.23584]; // Дубай как дефолт

  const [locations, setLocations] = useState<LocationData[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [isSheetExpanded, setIsSheetExpanded] = useState(false); // Состояние раскрытия мобильной шторки
  
  const mapRef = useRef<any>(null);

  // Загрузка данных и центрирование карты на результатах
  useEffect(() => {
    if (mode === 'analysis') {
      try {
        const stored = localStorage.getItem('proModeResults');
        if (stored) {
          const parsedLocations: LocationData[] = JSON.parse(stored);
          setLocations(parsedLocations);
          
          // Центрируем на первый результат, если карта уже готова
          if (parsedLocations.length > 0 && mapRef.current) {
            mapRef.current.setCenter(parsedLocations[0].coordinates); 
            mapRef.current.setZoom(14);
          }
        }
      } catch (e) { console.error(e); }
    }
  }, [mode]);

  // Callback от MapWrapper, когда карта полностью готова
  const handleMapInit = useCallback((mapInstance: any) => {
    mapRef.current = mapInstance;
    // Повторная попытка центрирования, если данные уже загружены
    if (locations.length > 0) {
        mapInstance.setCenter(locations[0].coordinates);
        mapInstance.setZoom(14);
    }
  }, [locations]);

  const handleSelect = (loc: LocationData) => {
    setSelectedLocation(loc);
    setIsSheetExpanded(true); // Раскрываем мобильную шторку
    
    if (mapRef.current) {
      mapRef.current.setCenter(loc.coordinates, { animate: true, duration: 800 });
      mapRef.current.setZoom(16, { animate: true, duration: 800 });
    }
  };

  const handleBack = () => {
    setSelectedLocation(null);
    setIsSheetExpanded(false); // Сворачиваем мобильную шторку
    if (mapRef.current) {
        mapRef.current.setZoom(14, { animate: true });
    }
  };
  
  // Callback от мобильной шторки, чтобы управлять видимостью ГЛОБАЛЬНОГО меню
  const handleSheetStateChange = (expanded: boolean) => {
      setIsSheetExpanded(expanded);
      setNavHidden(expanded); // Прячем/показываем нижний док
  };

  // Возвращаем навигацию при уходе со страницы
  useEffect(() => {
    return () => setNavHidden(false);
  }, [setNavHidden]);

  return (
    <div className="w-full h-full flex overflow-hidden bg-background relative">
      
      {/* 1. Desktop Sidebar (Появляется, если есть результаты) */}
      <ResultsSidebar 
        locations={locations} 
        selectedLocation={selectedLocation}
        query={query} 
        onSelect={handleSelect} 
        onBack={handleBack}
        isVisible={mode === 'analysis' && locations.length > 0}
      />

      {/* 2. Mobile Bottom Sheet */}
      {mode === 'analysis' && locations.length > 0 && (
          <MobileBottomSheet 
            locations={locations}
            selectedLocation={selectedLocation}
            onSelect={handleSelect}
            onClose={handleBack}
            onExpandChange={handleSheetStateChange}
          />
      )}

      {/* 3. Map Wrapper - Z-index 0, чтобы быть под боковыми панелями */}
      <div className="flex-1 relative z-0">
        <MapWrapper 
          initialCenter={defaultCenter}
          onMapInit={handleMapInit}
        >
          {/* Кнопка Геолокации: только на Desktop */}
          <div className="hidden md:block">
             <GeolocationControl />
          </div>
          
          {/* Маркеры */}
          {locations.map((loc) => (
            <MapMarker
              key={loc.id}
              coordinates={loc.coordinates}
              label={loc.name}
              category={loc.category}
              onClick={() => handleSelect(loc)}
            />
          ))}

        </MapWrapper>
      </div>
    </div>
  );
};

export default MapClient;