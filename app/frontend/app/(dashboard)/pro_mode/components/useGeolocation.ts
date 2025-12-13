import { useState, useEffect, useCallback } from 'react';

// Дефолтная локация (например, Дубай), если юзер запретил доступ
const DEFAULT_LOCATION = { lat: 25.23584, lon: 55.31878 };

export const useGeolocation = () => {
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Эта функция теперь всегда возвращает координаты (реальные или дефолтные)
  // Она никогда не "падает" с ошибкой, чтобы не ломать флоу
  const getLocation = useCallback(async (): Promise<{ lat: number; lon: number }> => {
    setLoading(true);
    setError(null);

    // 1. Проверка поддержки браузером
    if (typeof window !== 'undefined' && !navigator.geolocation) {
      console.warn("Geolocation is not supported by this browser.");
      setError("Geolocation not supported");
      setLoading(false);
      return DEFAULT_LOCATION;
    }

    return new Promise((resolve) => {
      // Опции: не требуем супер-точности, чтобы работало быстрее и реже падало
      const options = {
        enableHighAccuracy: false, // false быстрее и работает по IP/Wi-Fi
        timeout: 7000,             // Ждем максимум 7 секунд
        maximumAge: 0
      };

      navigator.geolocation.getCurrentPosition(
        // УСПЕХ
        (pos) => {
          console.log("Got location:", pos.coords);
          const newLoc = { lat: pos.coords.latitude, lon: pos.coords.longitude };
          setLocation(newLoc);
          setLoading(false);
          resolve(newLoc);
        },
        // ОШИБКА
        (err) => {
          // Логируем код ошибки, чтобы ты видел в консоли причину
          // Code 1: Permission Denied (Юзер нажал блок)
          // Code 2: Position Unavailable (Не удалось определить, например нет GPS)
          // Code 3: Timeout (Слишком долго)
          console.warn(`Geolocation error (Code ${err.code}): ${err.message}`);
          
          let errorMsg = "Location unavailable";
          if (err.code === 1) errorMsg = "Permission denied (User blocked)";
          if (err.code === 2) errorMsg = "Position unavailable (Check GPS/Network)";
          if (err.code === 3) errorMsg = "Timeout";

          setError(errorMsg);
          setLocation(DEFAULT_LOCATION); 
          setLoading(false);
          
          // ВАЖНО: Возвращаем дефолт, чтобы приложение продолжило работу!
          resolve(DEFAULT_LOCATION);
        },
        options
      );
    });
  }, []);

  // При маунте пробуем получить тихо (чтобы если права уже есть, они подтянулись)
  useEffect(() => {
    getLocation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { location, error, loading, getLocation };
};