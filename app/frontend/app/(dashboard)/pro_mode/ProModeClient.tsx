'use client';


import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useGeolocation } from './components/useGeolocation';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { SearchInterface } from './components/SearchInterface';
import { LoadingHUD } from './components/LoadingHUD';
import { MorphingBackground } from './components/MorphingBackground';


import { getInspiration, searchProMode } from '@/services/interaction';
import { LocationData } from '@/types/location';

const mapBackendResultsToLocationData = (results: any[]): LocationData[] => {
  if (!Array.isArray(results)) {
    console.error("Expected array results, got:", results);
    return [];
  }

  return results.map((item: any) => {
    const lat = item.lat || item.location?.lat || 0;
    const lon = item.lon || item.location?.lon || 0;

    const rawRating = item.rating || 0;
    const displayRating = rawRating > 0 ? rawRating : 4.5;

    return {
      id: item.place_id ? String(item.place_id) : crypto.randomUUID(),
      place_id: item.place_id,
      name: item.name || 'Unknown Place',
      address: item.address || '',
      coordinates: [lon, lat] as [number, number],
      rating: displayRating,
      reviewCount: item.num_reviews || item.user_ratings_total || 120,
      vibeScore: item.match_score || 95,
      description: item.reason || item.description || '',
      category: item.category || 'Place',
      priceLevel: item.price_level || '$$',
      openStatus: 'Open Now',
      tags: item.tags || [],
      imageUrl: item.image_url || null,
      subRatings: {
        food: Math.floor(Math.random() * 15 + 80),
        service: Math.floor(Math.random() * 15 + 75),
        atmosphere: Math.floor(Math.random() * 20 + 70),
        value: Math.floor(Math.random() * 10 + 85),
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

type ProcessState = 'idle' | 'scanning' | 'filtering' | 'analysis' | 'found' | 'success';

const ProModeClient = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { location, error: geoError, getLocation } = useGeolocation();
  const { t } = useLanguage();

  const [inputValue, setInputValue] = useState('');
  const [processState, setProcessState] = useState<ProcessState>('idle');
  const [hudText, setHudText] = useState({ title: '', sub: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isExploding, setIsExploding] = useState(false);

  const animationInterval = useRef<NodeJS.Timeout | null>(null);

  const loadingStages = [
    { state: 'scanning' as ProcessState, title: t.pro.loading.scanning.title, sub: t.pro.loading.scanning.sub }, // Glass
    { state: 'analysis' as ProcessState, title: t.pro.loading.analysis.title, sub: t.pro.loading.analysis.sub }, // Sparkles
    { state: 'filtering' as ProcessState, title: t.pro.loading.gathering.title, sub: t.pro.loading.gathering.sub }, // Cloud
  ];

  useEffect(() => {
    const query = searchParams.get('q');
    if (query && processState === 'idle' && !isLoading) {
      setInputValue(query);
      handleStartProcess(query);
    }
  }, [searchParams]);

  useEffect(() => {
    if (isLoading && processState !== 'success') {
      let stepIndex = 0;

      const nextStep = () => {
        const stage = loadingStages[stepIndex];
        setProcessState(stage.state);
        setHudText({ title: stage.title, sub: stage.sub });

        stepIndex = (stepIndex + 1) % loadingStages.length;
      };

      // Initial step immediately
      nextStep();

      // Cycle every 2 seconds
      animationInterval.current = setInterval(nextStep, 2000);
    } else {
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
    setIsLoading(true);

    const isInspire = query === "INSPIRE_ME_ACTION";

    try {
      const currentLoc = await getLocation();
      const lat = currentLoc.lat;
      const lon = currentLoc.lon;

      console.log("Starting API call...", { query, lat, lon });

      let rawResults;
      if (isInspire) {
        rawResults = await getInspiration(lat, lon);
      } else {
        rawResults = await searchProMode(query, lat, lon);
      }

      console.log("API Results received:", rawResults);

      const finalResults = mapBackendResultsToLocationData(rawResults);

      if (finalResults.length > 0) {
        // SUCCESS STATE
        if (animationInterval.current) clearInterval(animationInterval.current);

        // Trigger Explosion
        setProcessState('success');
        setIsExploding(true);
        setHudText({
          title: "Result Found",
          sub: "Redirecting you to the map..."
        });

        // Wait for particle transition
        // We can rely on onExplosionComplete, but a fallback timeout is safe
        setTimeout(() => {
          localStorage.setItem('proModeResults', JSON.stringify(finalResults));

          const params = new URLSearchParams({
            mode: 'analysis',
            query: isInspire ? 'For You' : query,
            lat: lat.toString(),
            lon: lon.toString()
          });

          setIsLoading(false);
          setIsExploding(false);
          setProcessState('idle');
          router.push(`/map?${params.toString()}`);
        }, 2500); // 2.5s gives enough time for explosion + formation reading

      } else {
        setIsLoading(false);
        setProcessState('idle');
        alert(t.pro.noResults);
      }

    } catch (e: any) {
      console.error("Pro Mode Error:", e);
      setIsLoading(false);
      setProcessState('idle');

      alert(t.pro.error);
    }
  };

  const getParticleShape = (state: ProcessState): 'search' | 'sparkles' | 'mapPin' | 'cloud' | 'none' => {
    switch (state) {
      case 'scanning': return 'search';
      case 'filtering': return 'cloud'; // Reusing scanning/filtering/analysis logic mapping
      case 'analysis': return 'sparkles';
      case 'found': return 'mapPin';
      case 'success': return 'mapPin';
      default: return 'none';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) handleStartProcess(inputValue.trim());
  };

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] overflow-hidden bg-background text-foreground selection:bg-primary/30 flex flex-col items-center justify-center">

      <MorphingBackground
        icon={getParticleShape(processState)}
        isExploding={isExploding}
        onExplosionComplete={() => {
          console.log("Explosion complete");
          // Optional: Trigger something else if needed
        }}
      />

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