'use client';

import { useState, useRef, useEffect } from 'react'; // Added useEffect
import { useRouter, useSearchParams } from 'next/navigation'; // Added useSearchParams
import { useGeolocation } from './components/useGeolocation';
import { ParticleBackground } from './components/ParticleBackground';
import { SearchInterface } from './components/SearchInterface';
import { LoadingHUD } from './components/LoadingHUD';

// Mock Data (Keep as is)
const mockAnalysisResults = [
    {
      id: 'loc1',
      name: 'Cozy Corner Cafe',
      address: '123 Main St, Downtown',
      coordinates: [55.31878, 25.23584],
      rating: 4.5,
      reviewCount: 128,
      vibeScore: 92,
      description: 'A quiet spot perfect for reading and working, with excellent coffee.',
      category: 'Cafe'
    },
    // ... other mocks
];

type ProcessState = 'idle' | 'scanning' | 'filtering' | 'analysis';

const ProModeClient = () => {
  const router = useRouter();
  const searchParams = useSearchParams(); // Get params
  const { location, error: geoError } = useGeolocation();
  
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

  const startProcess = (query: string) => {
    // 1. Scanning
    setProcessState('scanning');
    setHudText({ title: 'SCANNING', sub: 'Triangulating local hotspots...' });

    // 2. Filtering
    setTimeout(() => {
      setProcessState('filtering');
      setHudText({ title: 'FILTERING', sub: `Matching "${query}" parameters...` });
    }, 3500);

    // 3. Analysis
    setTimeout(() => {
      setProcessState('analysis');
      setHudText({ title: 'ANALYSIS', sub: 'Processing semantic reviews...' });
    }, 6500);

    // 4. Finish
    setTimeout(() => {
      localStorage.setItem('proModeResults', JSON.stringify(mockAnalysisResults));
      const params = new URLSearchParams({
        mode: 'analysis',
        query: query,
        lat: (location?.lat || 25.2).toString(),
        lon: (location?.lon || 55.3).toString()
      });
      router.push(`/map?${params.toString()}`);
    }, 10000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) startProcess(inputValue.trim());
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-neutral-950 text-white selection:bg-cyan-500/30">
      
      {/* 1. 3D Background */}
      <ParticleBackground shape={getShapeForState(processState)} />

      {/* 2. Main Content Layer */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
        
        {processState === 'idle' ? (
          <SearchInterface 
            inputValue={inputValue}
            setInputValue={setInputValue}
            onSubmit={handleSubmit}
            onSuggestion={(text) => {
              setInputValue(text);
              startProcess(text);
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