import api from '@/lib/api';
import { LocationData } from '@/types/location';

export const interactWithPlace = async (placeId: string | number, type: 'LIKE' | 'DISLIKE' | 'NONE') => {
  return await api.post('/interactions/update', {
    place_id: String(placeId),
    rating: type
  });
};

export const markVisited = async (placeId: string | number, isVisited: boolean) => {
  return await api.post('/interactions/update', {
    place_id: String(placeId),
    is_visited: isVisited
  });
};

export const getInspiration = async (lat: number, lon: number) => {
  console.log(`[API] Inspire request: ${lat}, ${lon}`);
  const response = await api.post('/rec/inspire', { lat, lon });

  return response.data.recommendations || [];
};

export const searchProMode = async (query: string, lat: number, lon: number, radius: number = 5000) => {
  console.log(`[API] Pro Mode request: "${query}" near ${lat}, ${lon}`);

  await new Promise(resolve => setTimeout(resolve, 6000));

  const response = await api.post('/place/pro_analyze', {
    query,
    lat,
    lon,
    radius
  });

  return response.data.recommendations || [];
};