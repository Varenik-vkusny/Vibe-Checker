import { useState, useEffect, useCallback } from 'react';

const DEFAULT_LOCATION = { lat: 25.23584, lon: 55.31878 };

export const useGeolocation = () => {
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const getLocation = useCallback(async (): Promise<{ lat: number; lon: number }> => {
    setLoading(true);
    setError(null);

    if (typeof window !== 'undefined' && !navigator.geolocation) {
      console.warn("Geolocation is not supported by this browser.");
      setError("Geolocation not supported");
      setLoading(false);
      return DEFAULT_LOCATION;
    }

    return new Promise((resolve) => {
      const options = {
        enableHighAccuracy: false, 
        timeout: 7000,             
        maximumAge: 0
      };

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          console.log("Got location:", pos.coords);
          const newLoc = { lat: pos.coords.latitude, lon: pos.coords.longitude };
          setLocation(newLoc);
          setLoading(false);
          resolve(newLoc);
        },
        (err) => {
          console.warn(`Geolocation error (Code ${err.code}): ${err.message}`);
          
          let errorMsg = "Location unavailable";
          if (err.code === 1) errorMsg = "Permission denied (User blocked)";
          if (err.code === 2) errorMsg = "Position unavailable (Check GPS/Network)";
          if (err.code === 3) errorMsg = "Timeout";

          setError(errorMsg);
          setLocation(DEFAULT_LOCATION); 
          setLoading(false);
          
          resolve(DEFAULT_LOCATION);
        },
        options
      );
    });
  }, []);

  useEffect(() => {
    getLocation();
  }, []);

  return { location, error, loading, getLocation };
};