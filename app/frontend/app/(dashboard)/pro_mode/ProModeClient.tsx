'use client';

import { useState, useEffect } from 'react'; 
import { useRouter, useSearchParams } from 'next/navigation'; 
import { useGeolocation } from './components/useGeolocation';
import { ParticleBackground } from './components/ParticleBackground';
import { SearchInterface } from './components/SearchInterface';
import { LoadingHUD } from './components/LoadingHUD';
import { getInspiration } from '@/services/interaction'; 
import { LocationData } from '@/types/location';

// Mock Data (Fallback)
const mockAnalysisResults = [
    {
      id: 'loc1',
      name: 'Cozy Corner Cafe (Mock)',
      address: '123 Main St, Downtown',
      coordinates: [55.31878, 25.23584],
      rating: 4.5,
      reviewCount: 128,
      vibeScore: 92,
      description: 'A quiet spot perfect for reading and working.',
      category: 'Cafe',
      place_id: 1 
    },
];

type ProcessState = 'idle' | 'scanning' | 'filtering' | 'analysis';

const mapBackendResultsToLocationData = (results: any[]): LocationData[] => {
  if (!Array.isArray(results)) return [];
  
  return results.map((item: any) => ({
    id: item.place_id ? String(item.place_id) : (item.id || 'unknown'),
    place_id: item.place_id,
    name: item.name,
    address: item.address || 'Address not available',
    coordinates: [item.location?.lat || item.lat || 0, item.location?.lon || item.lon || 0],
    rating: item.rating || 0,
    reviewCount: item.user_ratings_total || 0,
    vibeScore: item.match_score || 85,
    description: item.reason || item.description || 'AI analysis pending...',
    category: item.types ? item.types[0] : 'Place',
    priceLevel: item.price_level || '$$',
    openStatus: 'Open Now',
    tags: item.tags || [],
    subRatings: {
      food: Math.floor(Math.random() * 20 + 80),
      service: Math.floor(Math.random() * 20 + 80),
    },
    vibeSignature: { noise: 'Medium', light: 'Dim', wifi: 'Fast' },
    crowdMakeup: { students: 40, families: 30, remote: 30 }
  }));
};

const ProModeClient = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Достаем функцию getLocation
  const { location, error: geoError, getLocation } = useGeolocation();
  
  const [inputValue, setInputValue] = useState('');
  const [processState, setProcessState] = useState<ProcessState>('idle');
  const [hudText, setHudText] = useState({ title: '', sub: '' });

  // CHECK FOR AUTO-START
  useEffect(() => {
    const query = searchParams.get('q');
    if (query && processState === 'idle') {
      setInputValue(query);
      startProcess(query);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const getShapeForState = (state: ProcessState) => {
    switch (state) {
      case 'scanning': return 'mapPin';
      case 'filtering': return 'balls';
      case 'analysis': return 'analysis';
      default: return 'idle';
    }
  };

  const startProcess = async (query: string) => {
    const isInspire = query === "INSPIRE_ME_ACTION";
    
    // 1. SCANNING STATE
    setProcessState('scanning');
    setHudText({ 
        title: isInspire ? 'AI DISCOVERY' : 'SCANNING', 
        sub: 'Acquiring GPS Signal...' 
    });

    // --- ВАЖНЫЙ МОМЕНТ: Запрашиваем локацию прямо сейчас ---
    // Это вызовет промпт браузера, если разрешения еще нет
    const currentLoc = await getLocation();
    const lat = currentLoc.lat;
    const lon = currentLoc.lon;

    setHudText({ 
        title: isInspire ? 'AI DISCOVERY' : 'SCANNING', 
        sub: isInspire ? 'Analyzing your vibe history...' : 'Triangulating local hotspots...' 
    });

    try {
        let finalResults: LocationData[] = [];
        
        await new Promise(r => setTimeout(r, 1500));

        // 2. FILTERING STATE
        setProcessState('filtering');
        setHudText({ title: 'CONNECTING', sub: 'Searching for matches...' });

        if (isInspire) {
             console.log("Calling Inspire API with coords:", lat, lon);
             const response = await getInspiration(lat, lon);
             
             const rawData = Array.isArray(response) ? response : (response.recommendations || []);
             finalResults = mapBackendResultsToLocationData(rawData);
             
        } else {
             // Тут логика обычного поиска (пока мок)
             await new Promise(r => setTimeout(r, 1500));
             finalResults = mapBackendResultsToLocationData(mockAnalysisResults);
        }

        // 3. ANALYSIS STATE
        setProcessState('analysis');
        setHudText({ title: 'COMPILING', sub: 'Ranking places by Vibe Score...' });
        
        await new Promise(r => setTimeout(r, 1000));

        // 4. FINISH
        if (finalResults.length > 0) {
            localStorage.setItem('proModeResults', JSON.stringify(finalResults));
        }

        const params = new URLSearchParams({
          mode: 'analysis',
          query: isInspire ? 'For You' : query,
          lat: lat.toString(),
          lon: lon.toString()
        });
        
        router.push(`/map?${params.toString()}`);

    } catch (e) {
        console.error("Process failed:", e);
        setProcessState('idle');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) startProcess(inputValue.trim());
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-neutral-950 text-white selection:bg-cyan-500/30">
      
      <ParticleBackground shape={getShapeForState(processState)} />

      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
        
        {processState === 'idle' ? (
          <SearchInterface 
            inputValue={inputValue}
            setInputValue={setInputValue}
            onSubmit={handleSubmit}
            onSuggestion={(text) => {
              if (text === "INSPIRE_ME_ACTION") {
                  startProcess("INSPIRE_ME_ACTION");
              } else {
                  setInputValue(text);
                  startProcess(text);
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
  );
};

export default ProModeClient;