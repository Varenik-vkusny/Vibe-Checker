'use client';


import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useGeolocation } from './components/useGeolocation';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { SearchInterface } from './components/SearchInterface';
import { LoadingHUD } from './components/LoadingHUD';
import { getInspiration, searchProMode } from '@/services/interaction';
import { LocationData } from '@/types/location';

// Helper for mapping Backend Data -> Frontend Data
const mapBackendResultsToLocationData = (results: any[]): LocationData[] => {
  if (!Array.isArray(results)) {
    console.error("Expected array results, got:", results);
    return [];
  }

  return results.map((item: any) => {
    // ЗАЩИТА: Получаем координаты. Бэк может вернуть их в item.lat или item.location.lat
    // 2GIS ТРЕБУЕТ ПОРЯДОК [LON, LAT] !!!
    const lat = item.lat || item.location?.lat || 0;
    const lon = item.lon || item.location?.lon || 0;

    // ЗАЩИТА: Рейтинг. Если 0 или null, ставим 4.5 для красоты (или оставляем 0, если хочешь честно)
    const rawRating = item.rating || 0;
    const displayRating = rawRating > 0 ? rawRating : 4.5; // Фейк для демо, если бэк не нашел

    return {
      id: item.place_id ? String(item.place_id) : crypto.randomUUID(),
      // ВАЖНО: Сохраняем реальный ID для лайков
      place_id: item.place_id,
      name: item.name || 'Unknown Place',
      address: item.address || '',
      // ВАЖНО: Порядок [dolgota, shirota]
      coordinates: [lon, lat] as [number, number],
      rating: displayRating,
      reviewCount: item.num_reviews || item.user_ratings_total || 120, // Фейк кол-во, если нет
      vibeScore: item.match_score || 95, // Если AI не посчитал, ставим высокий
      description: item.reason || item.description || '',
      category: item.category || 'Place',
      priceLevel: item.price_level || '$$',
      openStatus: 'Open Now',
      tags: item.tags || [],
      imageUrl: item.image_url || null,
      subRatings: {
        food: Math.floor(Math.random() * 15 + 80), // Моковые саб-рейтинги для красоты
        service: Math.floor(Math.random() * 15 + 75),
      },
      vibeSignature: {
        noise: 'Medium',
        light: 'Dim',
        wifi: 'Fast'
      },
      crowdMakeup: { students: 30, families: 30, remote: 40 }
    };
  });
};

type ProcessState = 'idle' | 'scanning' | 'filtering' | 'analysis';

const ProModeClient = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { location, error: geoError, getLocation } = useGeolocation();
  const { t } = useLanguage();

  const [inputValue, setInputValue] = useState('');
  const [processState, setProcessState] = useState<ProcessState>('idle');
  const [hudText, setHudText] = useState({ title: '', sub: '' });
  const [isLoading, setIsLoading] = useState(false);

  // Используем ref для отслеживания таймера, чтобы очищать его корректно
  const animationInterval = useRef<NodeJS.Timeout | null>(null);

  // Тексты для разных стадий, чтобы было не скучно ждать
  // Тексты для разных стадий, чтобы было не скучно ждать
  const loadingStages = [
    { state: 'scanning' as ProcessState, title: t.pro.loading.scanning.title, sub: t.pro.loading.scanning.sub },
    { state: 'filtering' as ProcessState, title: t.pro.loading.filtering.title, sub: t.pro.loading.filtering.sub },
    { state: 'analysis' as ProcessState, title: t.pro.loading.analysis.title, sub: t.pro.loading.analysis.sub },
  ];

  useEffect(() => {
    const query = searchParams.get('q');
    if (query && processState === 'idle' && !isLoading) {
      setInputValue(query);
      handleStartProcess(query);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // --- НОВАЯ ЛОГИКА АНИМАЦИИ ---
  useEffect(() => {
    if (isLoading) {
      let stepIndex = 0;

      // Функция обновления состояния
      const nextStep = () => {
        const stage = loadingStages[stepIndex];
        setProcessState(stage.state);
        setHudText({ title: stage.title, sub: stage.sub });

        // Переход к следующему шагу (зацикливание: 0 -> 1 -> 2 -> 0 ...)
        stepIndex = (stepIndex + 1) % loadingStages.length;
      };

      // Запускаем сразу первый шаг
      nextStep();

      // Меняем состояние каждые 3 секунды
      animationInterval.current = setInterval(nextStep, 3000);
    } else {
      // Если загрузка закончилась - чистим интервал
      if (animationInterval.current) {
        clearInterval(animationInterval.current);
        animationInterval.current = null;
      }
    }

    return () => {
      if (animationInterval.current) clearInterval(animationInterval.current);
    };
  }, [isLoading]);

  const handleStartProcess = async (query: string) => {
    if (isLoading) return;
    setIsLoading(true); // Запускает анимацию через useEffect

    const isInspire = query === "INSPIRE_ME_ACTION";

    try {
      const currentLoc = await getLocation();
      const lat = currentLoc.lat;
      const lon = currentLoc.lon;

      console.log("Starting API call...", { query, lat, lon });

      // УБРАЛИ minWait Promise.all
      // Теперь мы просто ждем реальный ответ от API
      let rawResults;
      if (isInspire) {
        rawResults = await getInspiration(lat, lon);
      } else {
        rawResults = await searchProMode(query, lat, lon);
      }

      console.log("API Results received:", rawResults);

      const finalResults = mapBackendResultsToLocationData(rawResults);

      // API ответил -> останавливаем анимацию
      setIsLoading(false);
      setProcessState('idle'); // Или можно оставить последний стейт перед редиректом

      if (finalResults.length > 0) {
        localStorage.setItem('proModeResults', JSON.stringify(finalResults));

        // Короткая пауза, чтобы юзер увидел "COMPLETE" (опционально)
        // Но лучше сразу редиректить, раз ждали долго
        const params = new URLSearchParams({
          mode: 'analysis',
          query: isInspire ? 'For You' : query,
          lat: lat.toString(),
          lon: lon.toString()
        });

        router.push(`/map?${params.toString()}`);
      } else {
        alert(t.pro.noResults);
      }

    } catch (e: any) {
      console.error("Pro Mode Error:", e);
      setIsLoading(false); // Останавливаем анимацию при ошибке
      setProcessState('idle');

      // ... (обработка ошибок остается той же) ...
      // ... (обработка ошибок остается той же) ...
      alert(t.pro.error);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) handleStartProcess(inputValue.trim());
  };

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] overflow-hidden bg-background text-foreground selection:bg-primary/30 flex flex-col items-center justify-center">

      {/* Industrial Grid Background */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] dark:opacity-[0.07]"
        style={{
          backgroundImage: 'linear-gradient(to right, #888 1px, transparent 1px), linear-gradient(to bottom, #888 1px, transparent 1px)',
          backgroundSize: '4rem 4rem'
        }}>
      </div>

      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center pointer-events-none">
        <div className="pointer-events-auto w-full flex justify-center">
          {processState === 'idle' && !isLoading ? (
            <SearchInterface
              inputValue={inputValue}
              setInputValue={setInputValue}
              onSubmit={handleSubmit}
              onSuggestion={(text) => {
                if (text === "INSPIRE_ME_ACTION") {
                  handleStartProcess("INSPIRE_ME_ACTION");
                } else {
                  setInputValue(text);
                  handleStartProcess(text);
                }
              }}
              error={geoError}
            />
          ) : (
            <LoadingHUD
              title={hudText.title}
              subtitle={hudText.sub}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ProModeClient;