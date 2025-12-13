import api from '@/lib/api';
import { LocationData } from '@/types/location';

export const interactWithPlace = async (placeId: number, type: 'LIKE' | 'DISLIKE' | 'NONE') => {
  return await api.post('/interactions/update', {
    place_id: placeId,
    rating: type
  });
};

export const markVisited = async (placeId: number, isVisited: boolean) => {
  return await api.post('/interactions/update', {
    place_id: placeId,
    is_visited: isVisited
  });
};

export const getInspiration = async (lat: number, lon: number) => {
  const response = await api.post<any>('/rec/inspire', { lat, lon });
  
  return response.data.recommendations || response.data; 
};
