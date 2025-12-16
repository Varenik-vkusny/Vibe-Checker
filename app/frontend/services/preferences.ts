import api from '@/lib/api';

export interface UserPreferences {
    acoustics: number;
    lighting: number;
    crowdedness: number;
    budget: number;
    restrictions: string[];
}

export const preferencesService = {
    async getPreferences(): Promise<UserPreferences> {
        const response = await api.get('/users/preferences');
        return response.data;
    },

    async updatePreferences(preferences: Partial<UserPreferences>): Promise<UserPreferences> {
        const response = await api.put('/users/preferences', preferences);
        return response.data;
    }
};
