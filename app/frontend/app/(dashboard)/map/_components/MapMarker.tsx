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

    // 2. Логика иконки
    const emoji = getIconForCategory(category || '');
    const color = isSelected ? '#ef4444' : '#ffffff';
    const scale = isSelected ? 1.2 : 1;
    const zIndex = isSelected ? 9999 : 10;

    // SVG иконка (Пин)
    const svgIcon = `
      <svg width="46" height="54" viewBox="0 0 46 54" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g transform="scale(${scale}) translate(${23 * (1-scale)}, ${54 * (1-scale)})">
          <path d="M23 46C35.1503 46 45 36.1503 45 24C45 11.8497 35.1503 2 23 2C10.8497 2 1 11.8497 1 24C1 36.1503 10.8497 46 23 46Z" fill="${color}" stroke="${isSelected ? '#fff' : '#00000033'}" stroke-width="1"/>
          <path d="M23 52L17 44H29L23 52Z" fill="${color}" stroke="${isSelected ? '#fff' : '#00000033'}" stroke-width="1"/>
          <text x="50%" y="28" font-family="Arial" font-size="20" text-anchor="middle" dominant-baseline="middle">${emoji}</text>
        </g>
      </svg>
    `;

    const iconUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgIcon)));

    // 3. Удаляем старый перед созданием нового
    if (markerRef.current) markerRef.current.destroy();

    try {
        markerRef.current = new mapglAPI.Marker(map, {
            coordinates,
            icon: iconUrl,
            size: [46 * scale, 54 * scale],
            anchor: [23 * scale, 54 * scale],
            zIndex: zIndex,
            label: isSelected && label ? { 
                text: label, 
                offset: [0, -60], 
                relativeAnchor: [0.5, 1],
                fontSize: 14,
                color: '#ffffff',
                haloColor: '#000000',
                haloRadius: 2
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

function getIconForCategory(cat: string): string {
  const c = cat.toLowerCase();
  if (c.includes('burger') || c.includes('fast')) return '🍔';
  if (c.includes('chicken')) return '🍗';
  if (c.includes('pizza')) return '🍕';
  if (c.includes('coffee') || c.includes('cafe')) return '☕';
  if (c.includes('bar') || c.includes('pub') || c.includes('club')) return '🍸';
  if (c.includes('sushi') || c.includes('asian')) return '🍣';
  return '📍';
}