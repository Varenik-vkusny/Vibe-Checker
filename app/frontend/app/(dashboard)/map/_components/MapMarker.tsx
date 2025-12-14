'use client';

import { useEffect, useRef } from 'react';
import { useMap } from './MapContext';

interface MapMarkerProps {
  coordinates: [number, number];
  label?: string;
  onClick?: () => void;
  category?: string;
  isSelected?: boolean;
}

export const MapMarker = ({ coordinates, label, onClick, category, isSelected }: MapMarkerProps) => {
  const { map, mapglAPI } = useMap();
  const markerRef = useRef<any>(null);

  useEffect(() => {
    // 1. Проверки на существование карты и координат
    if (!map || !mapglAPI) return;

    if (!coordinates || coordinates.length !== 2 ||
      typeof coordinates[0] !== 'number' || typeof coordinates[1] !== 'number') {
      console.warn('Invalid coordinates for marker:', label);
      return;
    }

    // 2. Logic for minimized industrial marker
    const active = !!isSelected;
    const color = active ? '#7c3aed' : '#52525b'; // Violet (Primary) vs Zinc-600
    const scale = active ? 1.5 : 1;
    const zIndex = active ? 9999 : 10;

    // Simple Circular Dot with White Stroke (Industrial Look)
    // Viewbox 24x24, Circle centered at 12,12
    const svgIcon = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
         <circle cx="12" cy="12" r="8" fill="${color}" stroke="white" stroke-width="2"/>
         ${isSelected ? `<circle cx="12" cy="12" r="11" stroke="${color}" stroke-opacity="0.3" stroke-width="2"/>` : ''}
      </svg>
    `;

    const iconUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgIcon)));

    // 3. Destroy old marker
    if (markerRef.current) markerRef.current.destroy();

    try {
      markerRef.current = new mapglAPI.Marker(map, {
        coordinates,
        icon: iconUrl,
        size: [24 * scale, 24 * scale],
        anchor: [12 * scale, 12 * scale], // Center
        zIndex: zIndex,
        label: isSelected && label ? {
          text: label,
          offset: [0, -22],
          relativeAnchor: [0.5, 1],
          fontSize: 13,
          color: '#ffffff',
          haloColor: '#000000',
          haloRadius: 1,
        } : undefined,
      });

      if (onClick) {
        markerRef.current.on('click', onClick);
      }
    } catch (e) {
      console.error('Error creating marker:', e);
    }

    return () => {
      if (markerRef.current) markerRef.current.destroy();
    };
  }, [map, mapglAPI, coordinates, label, onClick, category, isSelected]);

  return null;
};
// Removed getIconForCategory as it is no longer used