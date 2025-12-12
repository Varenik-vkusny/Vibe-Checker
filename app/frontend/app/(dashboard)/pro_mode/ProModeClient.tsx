'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import * as THREE from 'three';
import gsap from 'gsap';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { SendHorizonal, Search } from 'lucide-react';

// Mock data to be passed to the map
const mockAnalysisResults = [
    {
      id: 'loc1',
      name: 'Cozy Corner Cafe',
      address: '123 Main St, Downtown',
      coordinates: [55.31878, 25.23584], // Note: These are still hardcoded for the demo
      rating: 4.5,
      reviewCount: 128,
      vibeScore: 92,
      description: 'A quiet spot perfect for reading and working, with excellent coffee.',
      category: 'Cafe'
    },
    {
      id: 'loc2',
      name: 'Sunset Lounge Bar',
      address: '456 Beach Rd, Marina',
      coordinates: [55.28925, 25.21161],
      rating: 4.2,
      reviewCount: 87,
      vibeScore: 88,
      description: 'Great atmosphere for evening drinks with a stunning waterfront view.',
      category: 'Bar'
    },
    {
      id: 'loc4',
      name: 'Tech Hub Workspace',
      address: '321 Innovation Blvd, Tech District',
      coordinates: [55.35036, 25.26068],
      rating: 4.7,
      reviewCount: 54,
      vibeScore: 95,
      description: 'Modern facilities with high-speed internet and reservable meeting rooms.',
      category: 'Workspace'
    },
];

// Define a default location to use as a fallback
const DEFAULT_LOCATION = { lat: 25.23584, lon: 55.31878 }; // Defaulting to Dubai

const ProModeClient = () => {
  const router = useRouter();

  // Refs for DOM elements and animation state
  const containerRef = useRef<HTMLDivElement>(null);
  const canvas3DRef = useRef<HTMLCanvasElement>(null);
  const canvas2DRef = useRef<HTMLCanvasElement>(null);
  const particleCtxRef = useRef<CanvasRenderingContext2D | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const particlesRef = useRef<any[]>([]);
  const currentShapeRef = useRef<string>('idle');

  // State for UI and location
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [processText, setProcessText] = useState('');
  const [processSub, setProcessSub] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Configuration
  const PARTICLE_COUNT = 400;
  const PARTICLE_SIZE = 2.5;
  const MORPH_DURATION = 1.2;

  // Shape definitions (target positions for particles)
  const getTargetPositions = (shapeName: string) => {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const time = Date.now() * 0.001;

    switch (shapeName) {
      case 'idle':
        const radius = 150;
        return particlesRef.current.map((_, i) => {
          const angle = (i / particlesRef.current.length) * Math.PI * 2;
          const r = radius + Math.sin(i * 0.5) * 30;
          return {
            x: centerX + Math.cos(angle) * r,
            y: centerY + Math.sin(angle) * r
          };
        });
      case 'mapPin':
        const headRadius = 60;
        const headParticles = Math.floor(PARTICLE_COUNT * 0.6);
        const positions: { x: number; y: number }[] = [];
        for (let i = 0; i < headParticles; i++) {
          const angle = (i / headParticles) * Math.PI * 2;
          const r = headRadius * (0.3 + Math.random() * 0.7);
          positions.push({
            x: centerX + Math.cos(angle) * r,
            y: centerY - 40 + Math.sin(angle) * r
          });
        }
        const bodyParticles = PARTICLE_COUNT - headParticles;
        for (let i = 0; i < bodyParticles; i++) {
          const t = i / bodyParticles;
          const x = centerX + (Math.random() - 0.5) * (1 - t) * 60;
          const y = centerY + 20 + t * 100;
          positions.push({ x, y });
        }
        return positions;
      case 'balls':
        const ballCount = 3;
        const particlesPerBall = Math.floor(PARTICLE_COUNT / ballCount);
        const rotationAngle = (time * 0.5) % (Math.PI * 2);
        const ballPositions: { x: number; y: number }[] = [];
        for (let b = 0; b < ballCount; b++) {
          const angle = (b / ballCount) * Math.PI * 2 + rotationAngle;
          const orbitRadius = 120;
          const ballX = centerX + Math.cos(angle) * orbitRadius;
          const ballY = centerY + Math.sin(angle) * orbitRadius;
          const ballRadius = 35;
          for (let i = 0; i < particlesPerBall; i++) {
            const a = Math.random() * Math.PI * 2;
            const r = Math.random() * ballRadius;
            ballPositions.push({
              x: ballX + Math.cos(a) * r,
              y: ballY + Math.sin(a) * r
            });
          }
        }
        return ballPositions;
      case 'analysis':
        const cardCount = 3;
        const particlesPerCard = Math.floor(PARTICLE_COUNT / cardCount);
        const analysisPositions: { x: number; y: number }[] = [];
        for (let c = 0; c < cardCount; c++) {
          const offset = (c - 1) * 180;
          const cardW = 120;
          const cardH = 160;
          for (let i = 0; i < particlesPerCard; i++) {
            analysisPositions.push({
              x: centerX + offset + (Math.random() - 0.5) * cardW,
              y: centerY + (Math.random() - 0.5) * cardH
            });
          }
        }
        return analysisPositions;
      default:
        return particlesRef.current.map(p => ({ x: p.x, y: p.y }));
    }
  };

  const init3DScene = () => {
    if (!containerRef.current) return;
    const scene = new THREE.Scene();
    scene.background = null;
    sceneRef.current = scene;
    const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 20;
    cameraRef.current = camera;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, canvas: canvas3DRef.current! });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    rendererRef.current = renderer;
    const rimLight = new THREE.SpotLight(0x4080ff, 8.0);
    rimLight.position.set(-10, 10, -5);
    scene.add(rimLight);
    const mainLight = new THREE.DirectionalLight(0xffffff, 2.0);
    mainLight.position.set(5, 5, 10);
    scene.add(mainLight);
    const fillLight = new THREE.PointLight(0xa855f7, 0.8);
    fillLight.position.set(0, -10, 5);
    scene.add(fillLight);
    const handleResize = () => {
      if (cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect = window.innerWidth / window.innerHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      }
      if (canvas2DRef.current) {
        canvas2DRef.current.width = window.innerWidth;
        canvas2DRef.current.height = window.innerHeight;
      }
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (rendererRef.current) rendererRef.current.dispose();
    };
  };

  const initParticleSystem = () => {
    if (!canvas2DRef.current) return;
    const canvas = canvas2DRef.current;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    particleCtxRef.current = ctx;
    const initialParticles = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      initialParticles.push({
        x: window.innerWidth / 2 + (Math.random() - 0.5) * 300,
        y: window.innerHeight / 2 + (Math.random() - 0.5) * 300,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        targetX: 0,
        targetY: 0,
        baseX: 0,
        baseY: 0
      });
    }
    particlesRef.current = initialParticles;
  };

  const morphToShape = (shapeName: string) => {
    currentShapeRef.current = shapeName;
    const targetPositions = getTargetPositions(shapeName);
    particlesRef.current.forEach((p, i) => {
      const target = targetPositions[i] || targetPositions[0];
      p.baseX = p.x;
      p.baseY = p.y;
      p.targetX = target.x;
      p.targetY = target.y;
      gsap.to(p, {
        x: target.x,
        y: target.y,
        duration: MORPH_DURATION,
        ease: "power2.inOut",
        delay: Math.random() * 0.3
      });
    });
  };

  const animate = () => {
    animationFrameIdRef.current = requestAnimationFrame(animate);
    const time = Date.now() * 0.001;
    if (currentShapeRef.current === 'balls') {
      const targetPositions = getTargetPositions('balls');
      particlesRef.current.forEach((p, i) => {
        const target = targetPositions[i] || targetPositions[0];
        p.targetX = target.x;
        p.targetY = target.y;
        p.x += (p.targetX - p.x) * 0.1;
        p.y += (p.targetY - p.y) * 0.1;
      });
    }
    if (particleCtxRef.current && canvas2DRef.current) {
      const ctx = particleCtxRef.current;
      const canvas = canvas2DRef.current;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const isDark = document.documentElement.classList.contains('dark');
      ctx.fillStyle = isDark ? '#ffffff' : '#000000';
      ctx.shadowBlur = 10;
      ctx.shadowColor = isDark ? '#4080ff' : '#2563EB';
      particlesRef.current.forEach((p, i) => {
        let floatX = 0, floatY = 0;
        if (currentShapeRef.current === 'idle') {
          floatX = Math.sin(time * 0.5 + p.x * 0.01) * 10 + Math.cos(time * 0.3 + i) * 5;
          floatY = Math.cos(time * 0.4 + p.y * 0.01) * 10 + Math.sin(time * 0.6 + i) * 5;
        } else if (currentShapeRef.current === 'mapPin') {
          const angle = time + i * 0.1;
          floatX = Math.cos(angle) * 2;
          floatY = Math.sin(angle) * 2 + Math.sin(time * 2) * 1;
        } else if (currentShapeRef.current === 'analysis') {
          floatX = Math.sin(time * 2 + p.y * 0.05) * 3;
          floatY = Math.cos(time * 1 + p.x * 0.05) * 2;
        } else {
          floatX = Math.sin(time + p.x) * 0.5;
          floatY = Math.cos(time + p.y) * 0.5;
        }
        ctx.beginPath();
        ctx.arc(p.x + floatX, p.y + floatY, PARTICLE_SIZE, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    if (sceneRef.current && cameraRef.current && rendererRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  };

  const startProcess = (query: string) => {
    const locationToUse = userLocation || DEFAULT_LOCATION;
    
    // Clear the error message once the process starts
    setLocationError(null);

    setIsLoading(true);
    setProcessText("Processing Query");
    setProcessSub("Analyzing semantic context...");
    setTimeout(() => {
      setProcessText("Scanning Area");
      setProcessSub(`Locating hotspots near you`);
      morphToShape('mapPin');
    }, 500);
    setTimeout(() => {
      setProcessText("Filtering Spots");
      setProcessSub("Evaluating locations based on your vibe");
      morphToShape('balls');
    }, 3500);
    setTimeout(() => {
      setProcessText("Deep Analysis");
      setProcessSub("Reading reviews in real-time");
      morphToShape('analysis');
    }, 6500);
    setTimeout(() => {
      localStorage.setItem('proModeResults', JSON.stringify(mockAnalysisResults));
      const params = new URLSearchParams({
        mode: 'analysis',
        query: query,
        lat: locationToUse.lat.toString(),
        lon: locationToUse.lon.toString()
      });
      router.push(`/map?${params.toString()}`);
    }, 10000);
  };
  
  useEffect(() => {
    // Attempt to get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
          setLocationError(null); // Clear any previous errors
        },
        (error) => {
          let errorMessage = "Could not get your location. Using a default location for the demo.";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location permission denied. Using a default location.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location is unavailable. Using a default location.";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out. Using a default location.";
              break;
          }
          console.error(`Geolocation error: ${error.message} (Code: ${error.code})`);
          setLocationError(errorMessage);
          // IMPORTANT: Set the userLocation to default so the app can proceed
          setUserLocation(DEFAULT_LOCATION); 
        }
      );
    } else {
      setLocationError("Geolocation is not supported. Using a default location.");
      setUserLocation(DEFAULT_LOCATION);
    }

    const cleanup3D = init3DScene();
    initParticleSystem();
    morphToShape('idle');
    animate();

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      if (cleanup3D) cleanup3D();
    };
  }, []);


  const handleSuggestionClick = (text: string) => {
    setInputValue(text);
    startProcess(text);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      startProcess(inputValue.trim());
    }
  };

  return (
    <div ref={containerRef} className="relative w-full h-screen overflow-hidden bg-background">
      <canvas ref={canvas3DRef} className="absolute top-0 left-0 w-full h-full" style={{ zIndex: 0 }} />
      <canvas ref={canvas2DRef} className="absolute top-0 left-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }} />
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center pointer-events-none">
        {!isLoading && (
          <div className="pointer-events-auto w-full max-w-2xl p-6 flex flex-col items-center gap-8 transition-opacity duration-500">
            <div className="text-center text-foreground">
              <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Pro Mode Analysis
              </h1>
              <p className="text-muted-foreground">
                Unlock deeper insights with AI-powered analysis.
              </p>
            </div>
             {locationError && (
              <div className="text-amber-500 text-sm bg-amber-500/10 border border-amber-500/20 rounded-md p-3 text-center w-full max-w-md">
                {locationError}
              </div>
            )}
            <form onSubmit={handleSubmit} className="w-full">
              <div className="bg-background/80 backdrop-blur-lg border border-border rounded-2xl shadow-lg p-2 w-full">
                <div className="flex items-center p-2">
                  <div className="text-muted-foreground mr-3">
                    <Search className="w-5 h-5" />
                  </div>
                  <input
                    id="pro-input"
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Describe your ideal spot..."
                    className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-base"
                  />
                  <button
                    type="submit"
                    className="ml-2 bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center hover:bg-primary/90 transition-colors"
                  >
                    <SendHorizonal className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </form>
            <div className="flex flex-wrap justify-center gap-2 max-w-lg">
              {['Cozy coffee shop with WiFi', 'Lively bar near tourist spots', 'Quiet library branch'].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="bg-secondary/50 hover:bg-secondary border border-border text-sm text-foreground px-4 py-2 rounded-full transition-colors cursor-pointer"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
        {isLoading && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="text-center text-white">
              <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-6"></div>
              <h2 className="text-2xl font-bold mb-2">{processText}</h2>
              <p className="text-muted-foreground">{processSub}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProModeClient;