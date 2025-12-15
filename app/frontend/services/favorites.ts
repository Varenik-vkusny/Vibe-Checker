import api from '@/lib/api';

export interface VibeCardProps {
    id: number;
    google_place_id?: string;
    name: string;
    category: string;
    image: string | null;
    rating: number;
    price: string;
    distance: string;
    tags: string[];
    status: 'visited' | 'to_go';
}

export const favoritesService = {
    toggleFavorite: async (placeId: number | string) => {
        const response = await api.post(`/favorites/${placeId}`);
        return response.data;
    },

    getFavorites: async (): Promise<VibeCardProps[]> => {
        const response = await api.get('/favorites');
        return response.data;
    }
};
