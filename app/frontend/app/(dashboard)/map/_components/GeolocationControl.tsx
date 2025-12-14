'use client';

import { useEffect, useRef } from 'react';
import { useMap } from './MapContext';

export const GeolocationControl = () => {
  const { map, mapglAPI } = useMap();
  const userCircleRef = useRef<any>(null);

  useEffect(() => {
    if (!map || !mapglAPI) return;

    const controlContent = `
        <div style="
            width: 36px; height: 36px; background: var(--background, #fff); 
            border-radius: 8px; display: flex; align-items: center; justify-content: center; 
            box-shadow: 0 4px 12px rgba(0,0,0,0.15); cursor: pointer;
        ">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
            </svg>
        </div>
    `;

    const control = new mapglAPI.Control(map, controlContent, {
      position: 'bottomRight',
    });

    const btn = control.getContainer().querySelector('div');

    const handleClick = () => {
      if (!navigator.geolocation) return alert('No Geo access');

      navigator.geolocation.getCurrentPosition((pos) => {
        const center = [pos.coords.longitude, pos.coords.latitude];

        if (userCircleRef.current) userCircleRef.current.destroy();

        userCircleRef.current = new mapglAPI.CircleMarker(map, {
          coordinates: center,
          radius: 14,
          color: '#0088ff',
          strokeWidth: 4,
          strokeColor: '#ffffff',
          stroke2Width: 6,
          stroke2Color: '#0088ff55',
        });

        map.setCenter(center, { animate: true, duration: 800 });
        map.setZoom(16, { animate: true, duration: 800 });
      });
    };

    btn?.addEventListener('click', handleClick);

    return () => {
      control.destroy();
      if (userCircleRef.current) userCircleRef.current.destroy();
    };
  }, [map, mapglAPI]);

  return null;
};