import { useEffect, useState } from 'react';

interface LoadingHUDProps {
  title: string;
  subtitle: string;
}

// Эффект печатной машинки
const TypewriterText = ({ text, speed = 30 }: { text: string; speed?: number }) => {
  const [displayed, setDisplayed] = useState('');
  
  useEffect(() => {
    setDisplayed('');
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayed((prev) => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return <span>{displayed}<span className="animate-pulse">_</span></span>;
};

export const LoadingHUD = ({ title, subtitle }: LoadingHUDProps) => {
  // Фейковые координаты для декора
  const [coords, setCoords] = useState({ lat: 55.2341, lon: 25.1122 });

  useEffect(() => {
    const interval = setInterval(() => {
      setCoords({
        lat: 55 + Math.random() * 0.5,
        lon: 25 + Math.random() * 0.5
      });
    }, 200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-none">
      
      {/* 1. Glass Capsule */}
      <div className="relative backdrop-blur-md bg-black/40 border border-white/10 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl overflow-hidden">
        
        {/* Декоративные уголки (Sci-Fi corners) */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-500/50 rounded-tl-md"></div>
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-500/50 rounded-tr-md"></div>
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-500/50 rounded-bl-md"></div>
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-500/50 rounded-br-md"></div>

        {/* Сканирующая линия (CSS Animation) */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent animate-[scan_3s_ease-in-out_infinite] pointer-events-none"></div>

        {/* Контент */}
        <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400 mb-2 tracking-widest uppercase">
          {title}
        </h2>
        
        <div className="text-cyan-100/70 font-mono text-sm h-6">
          <TypewriterText text={subtitle} speed={20} />
        </div>

        {/* Технические данные */}
        <div className="mt-6 flex justify-between text-[10px] font-mono text-white/30 border-t border-white/5 pt-2">
          <span>LAT: {coords.lat.toFixed(4)}</span>
          <span>LON: {coords.lon.toFixed(4)}</span>
          <span>NET: SECURE</span>
        </div>
      </div>
      
      {/* 2. Background Grid Decoration */}
      <div className="absolute inset-0 z-[-1] opacity-20" 
           style={{ backgroundImage: 'radial-gradient(circle, #444 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>
    </div>
  );
};