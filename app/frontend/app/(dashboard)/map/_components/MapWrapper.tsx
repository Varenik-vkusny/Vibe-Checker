'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';
import { load } from '@2gis/mapgl';
import { MapContext } from './MapContext';
import { useTheme } from 'next-themes';
import { Loader2, MapPin } from 'lucide-react';

interface MapWrapperProps {
  children: ReactNode;
  initialCenter: [number, number];
  className?: string;
  // Новый проп для передачи инстанса наверх
  onMapInit?: (map: any) => void;
}

export const MapWrapper = ({ children, initialCenter, className, onMapInit }: MapWrapperProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any | null>(null);
  const [mapglAPI, setMapglAPI] = useState<any | null>(null);
  const [isReady, setIsReady] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    let map: any = null;

    load().then((mapgl) => {
      if (!mapContainerRef.current) return;

      setMapglAPI(mapgl);

      map = new mapgl.Map(mapContainerRef.current, {
        center: initialCenter,
        zoom: 13,
        key: '019cced9-f6a6-4f10-b7c3-b6d91a0d0e35',
        zoomControl: false,
        style: resolvedTheme === 'dark' 
           ? 'e05ac437-fcc2-4845-ad74-b1de9ce07555' 
           : 'c080bb6a-8134-4993-93a1-5b4d8c36a59b',
      });

      map.once('styleload', () => {
        setIsReady(true);
      });

      setMapInstance(map);
      
      // Сообщаем родителю, что карта готова
      if (onMapInit) {
        onMapInit(map);
      }
    });

    return () => {
      if (map) map.destroy();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  // Синхронизация темы
  useEffect(() => {
    if (mapInstance && isReady) {
      const styleId = resolvedTheme === 'dark' 
        ? 'e05ac437-fcc2-4845-ad74-b1de9ce07555' 
        : 'c080bb6a-8134-4993-93a1-5b4d8c36a59b';
      mapInstance.setStyleById(styleId);
    }
  }, [resolvedTheme, mapInstance, isReady]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Лоадер */}
      <div 
        className={`
          absolute inset-0 z-50 flex flex-col items-center justify-center 
          bg-background transition-opacity duration-700 ease-in-out
          ${isReady ? 'opacity-0 pointer-events-none' : 'opacity-100'}
        `}
      >
        <div className="flex flex-col items-center gap-4">
           <div className="relative">
             <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
             <MapPin className="w-12 h-12 text-primary animate-bounce relative z-10" />
           </div>
           <div className="flex items-center gap-2 text-muted-foreground font-mono text-sm">
             <Loader2 className="w-4 h-4 animate-spin" />
             <span>LOADING TERRAIN...</span>
           </div>
        </div>
      </div>

      <MapContext.Provider value={{ map: mapInstance, mapglAPI }}>
        {mapglAPI && mapInstance && children}
      </MapContext.Provider>
    </div>
  );
};