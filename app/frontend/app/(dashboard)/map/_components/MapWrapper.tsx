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
  onMapInit?: (map: any, mapgl: any) => void;
}

export const MapWrapper = ({ children, initialCenter, className, onMapInit }: MapWrapperProps) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null); // Храним инстанс карты в ref, чтобы он пережил ререндеры

  const [mapState, setMapState] = useState<{ map: any; mapglAPI: any } | null>(null);
  const [isReady, setIsReady] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (mapInstanceRef.current) return;

    let isMounted = true;

    load().then((mapgl) => {
      if (!isMounted || !mapContainerRef.current) return;

      const initialStyle = resolvedTheme === 'dark'
        ? 'e05ac437-fcc2-4845-ad74-b1de9ce07555'
        : 'c080bb6a-8134-4993-93a1-5b4d8c36a59b';

      const map = new mapgl.Map(mapContainerRef.current, {
        center: initialCenter,
        zoom: 13,
        key: '019cced9-f6a6-4f10-b7c3-b6d91a0d0e35',
        zoomControl: false,
        style: initialStyle,
      });

      mapInstanceRef.current = map;

      map.once('styleload', () => {
        if (isMounted) setIsReady(true);
      });

      setMapState({ map, mapglAPI: mapgl });

      if (onMapInit) {
        onMapInit(map, mapgl);
      }
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (mapInstanceRef.current && isReady) {
      const styleId = resolvedTheme === 'dark'
        ? 'e05ac437-fcc2-4845-ad74-b1de9ce07555'
        : 'c080bb6a-8134-4993-93a1-5b4d8c36a59b';

      if (typeof mapInstanceRef.current.setStyleById === 'function') {
        mapInstanceRef.current.setStyleById(styleId);
      } else {
        console.warn('setStyleById not found on map instance');
      }
    }
  }, [resolvedTheme, isReady]);

  return (
    <div className={`relative w-full h-full min-h-[500px] ${className}`}>
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full bg-muted/20" />

      <div
        className={`
          absolute inset-0 z-50 flex flex-col items-center justify-center 
          bg-background transition-opacity duration-700 ease-in-out pointer-events-none
          ${isReady ? 'opacity-0' : 'opacity-100'}
        `}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
            <MapPin className="w-12 h-12 text-primary animate-bounce relative z-10" />
          </div>
          <div className="flex items-center gap-2 text-muted-foreground font-mono text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>INITIALIZING MAP...</span>
          </div>
        </div>
      </div>

      <MapContext.Provider value={{ map: mapState?.map || null, mapglAPI: mapState?.mapglAPI || null }}>
        {mapState && children}
      </MapContext.Provider>
    </div>
  );
};