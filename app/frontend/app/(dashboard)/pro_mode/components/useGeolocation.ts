import { useState, useEffect } from 'react';

const DEFAULT_LOCATION = { lat: 25.23584, lon: 55.31878 }; // Dubai

export const useGeolocation = () => {
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported");
      setLocation(DEFAULT_LOCATION);
      return;
    }

    const getPosition = (options: PositionOptions) => {
      return new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, options);
      });
    };

    const fetchLocation = async () => {
      try {
        // Попытка 1: Высокая точность
        const pos = await getPosition({ enableHighAccuracy: true, timeout: 5000, maximumAge: 0 });
        setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      } catch (err) {
        console.warn("High accuracy failed, trying low accuracy...");
        try {
          // Попытка 2: Низкая точность (для ПК/Localhost)
          const pos = await getPosition({ enableHighAccuracy: false, timeout: 10000, maximumAge: 0 });
          setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        } catch (finalErr) {
          console.error("Geolocation failed", finalErr);
          setError("Location unavailable. Using default.");
          setLocation(DEFAULT_LOCATION);
        }
      }
    };

    fetchLocation();
  }, []);

  return { location, error };
};