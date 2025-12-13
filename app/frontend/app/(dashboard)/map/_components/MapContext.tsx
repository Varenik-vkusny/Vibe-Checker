'use client';

import { createContext, useContext } from 'react';
import type { Map } from '@2gis/mapgl/types';

interface MapContextType {
  map: Map | null;
  mapglAPI: any | null; // Ссылка на сам объект mapgl
}

export const MapContext = createContext<MapContextType>({ map: null, mapglAPI: null });

export const useMap = () => useContext(MapContext);