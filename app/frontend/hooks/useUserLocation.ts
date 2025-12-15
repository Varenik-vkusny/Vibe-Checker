'use client';

import { useState, useEffect } from 'react';

export interface UserLocation {
    lat: number;
    lng: number;
}

export interface UseUserLocationResult {
    location: UserLocation | null;
    error: string | null;
    loading: boolean;
    getLocation: () => void;
}

export const useUserLocation = (): UseUserLocationResult => {
    const [location, setLocation] = useState<UserLocation | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);

    const getLocation = () => {
        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser');
            return;
        }

        setLoading(true);
        setError(null);

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                });
                setLoading(false);
            },
            (err) => {
                setError(err.message);
                setLoading(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 0,
            }
        );
    };

    useEffect(() => {
        getLocation();
    }, []);

    return { location, error, loading, getLocation };
};
