'use client';

import { useEffect, useRef } from 'react';
import { useMap } from './MapContext';

interface MapMarkerProps {
  coordinates: [number, number];
  label?: string;
  onClick?: () => void;
  category?: string;
}

export const MapMarker = ({ coordinates, label, onClick, category }: MapMarkerProps) => {
  const { map, mapglAPI } = useMap();
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (!map || !mapglAPI) return;

    const emoji = getIconForCategory(category || '');
    
    // SVG Data URI for the marker
    // White bubble with emoji inside, small arrow at bottom
    const svgIcon = `
      <svg width="46" height="54" viewBox="0 0 46 54" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g filter="url(#filter0_d)">
          <!-- Bubble Body -->
          <path d="M23 46C35.1503 46 45 36.1503 45 24C45 11.8497 35.1503 2 23 2C10.8497 2 1 11.8497 1 24C1 36.1503 10.8497 46 23 46Z" fill="white"/>
          <!-- Pointer -->
          <path d="M23 52L17 44H29L23 52Z" fill="white"/>
          <!-- Emoji Text -->
          <text x="50%" y="30" font-family="Arial, sans-serif" font-size="20" text-anchor="middle">${emoji}</text>
        </g>
        <defs>
          <filter id="filter0_d" x="0" y="0" width="46" height="54" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
            <feFlood flood-opacity="0" result="BackgroundImageFix"/>
            <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
            <feOffset dy="2"/>
            <feGaussianBlur stdDeviation="2"/>
            <feComposite in2="hardAlpha" operator="out"/>
            <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.15 0"/>
            <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow"/>
            <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow" result="shape"/>
          </filter>
        </defs>
      </svg>
    `;

    const iconUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgIcon)));

    markerRef.current = new mapglAPI.Marker(map, {
      coordinates,
      icon: iconUrl,
      size: [46, 54],
      anchor: [23, 54], // Bottom tip center
      label: label ? { 
        text: label, 
        offset: [0, -25], // Above the marker
        relativeAnchor: [0.5, 1],
        fontSize: 13,
        color: '#ffffff',
        haloColor: '#000000',
        haloRadius: 2
      } : undefined,
    });

    if (onClick) {
      markerRef.current.on('click', onClick);
    }

    return () => {
      if (markerRef.current) markerRef.current.destroy();
    };
  }, [map, mapglAPI, coordinates, label, onClick, category]);

  return null;
};

function getIconForCategory(cat: string): string {
  const c = cat.toLowerCase();
  if (c.includes('burger') || c.includes('fast')) return '🍔';
  if (c.includes('chicken')) return '🍗';
  if (c.includes('pizza')) return '🍕';
  if (c.includes('coffee') || c.includes('cafe')) return '☕';
  if (c.includes('bar') || c.includes('pub')) return '🍸';
  return '📍';
}