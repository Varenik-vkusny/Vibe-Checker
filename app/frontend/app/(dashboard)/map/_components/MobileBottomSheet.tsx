'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Search, ChevronUp, MapPin, Star, ArrowLeft, Navigation, Sparkles, Wifi, Sun, Volume2 } from 'lucide-react';
import { LocationData } from '@/types/location'; // Или интерфейс локально

interface MobileBottomSheetProps {
  locations: LocationData[];
  selectedLocation: LocationData | null;
  onSelect: (loc: LocationData) => void;
  onClose: () => void;
  // В interface MobileBottomSheetProps добавь:
  onExpandChange?: (isExpanded: boolean) => void;
}

export const MobileBottomSheet = ({ locations, selectedLocation, onSelect, onClose, onExpandChange }: MobileBottomSheetProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Если выбрали локацию - автоматически раскрываем шторку
  useEffect(() => {
  if (selectedLocation) {
    setIsExpanded(true);
    onExpandChange?.(true);
  } else {
    // Если сняли выделение, но шторку не закрыли полностью (она просто свернулась в список)
    // Тут логика зависит от UX. Допустим, при списке док виден.
    setIsExpanded(false);
    onExpandChange?.(false);
  }
}, [selectedLocation]);

  // Сворачивание/Разворачивание
  const toggleSheet = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    onExpandChange?.(newState);
};

  // Закрытие деталей (кнопка назад)
  const handleBack = (e: React.MouseEvent) => {
    e.stopPropagation(); // Чтобы клик не проваливался
    onClose();
    // Опционально: можно оставить шторку открытой или свернуть
    // setIsExpanded(false); 
  };

  

  return (
    <>
      {/* --- BOTTOM SHEET CONTAINER --- */}
      <div 
        className={`
          md:hidden fixed bottom-0 left-0 w-full z-40
          flex flex-col
          bg-background/85 backdrop-blur-xl border-t border-white/10 shadow-[0_-4px_30px_rgba(0,0,0,0.1)]
          transition-all duration-500 cubic-bezier(0.19, 1, 0.22, 1)
          rounded-t-[24px] overflow-hidden
          ${isExpanded ? 'h-[85vh]' : 'h-[140px]'}
        `}
      >
        {/* 1. HANDLE (Chevron) */}
        <div 
          className="w-full h-6 flex items-center justify-center cursor-pointer shrink-0 pt-2 pb-1"
          onClick={toggleSheet}
        >
          <div className="w-10 h-1 bg-muted-foreground/20 rounded-full" />
        </div>

        {/* 2. HEADER (Search) - Always visible */}
        <div className="px-5 pb-2 shrink-0">
          <div className="relative bg-muted/50 rounded-xl border border-transparent focus-within:border-primary/20 transition-colors">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Try 'Quiet cafe with wifi'..."
              className="w-full bg-transparent border-none py-3 pl-10 pr-4 text-sm outline-none placeholder:text-muted-foreground/70"
              onFocus={() => setIsExpanded(true)} // Раскрываем при фокусе
            />
          </div>
        </div>

        {/* 3. CONTENT AREA */}
        <div className="flex-1 overflow-y-auto px-5 pb-24 scrollbar-hide">
          
          {selectedLocation ? (
            /* --- DETAIL VIEW --- */
            <div className="animate-in slide-in-from-bottom-5 fade-in duration-300 flex flex-col gap-6 pt-2">
              
              {/* Back Button */}
              <button 
                onClick={handleBack}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-fit"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to list
              </button>

              {/* Hero */}
              <div>
                <h1 className="text-2xl font-bold leading-tight mb-1">{selectedLocation.name}</h1>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                   {selectedLocation.category} • <span className="text-primary">0.5km away</span>
                </p>
                <div className="flex gap-2 mt-3">
                    <span className="px-2 py-1 rounded-md bg-green-500/10 text-green-600 text-xs font-semibold border border-green-500/20">Open Now</span>
                    <span className="px-2 py-1 rounded-md bg-muted text-foreground text-xs font-medium border border-border">$$</span>
                </div>
              </div>

              {/* Score Card */}
              <div className="bg-background/40 border border-white/10 p-4 rounded-xl flex gap-4 items-center">
                 <div className="text-5xl font-bold tracking-tighter text-foreground">
                    {selectedLocation.rating}
                 </div>
                 <div className="flex-1 flex flex-col justify-center gap-1.5">
                    <span className="text-xs text-muted-foreground">Based on <b className="text-foreground">{selectedLocation.reviewCount}</b> reviews</span>
                    
                    {/* Fake Progress Bars for Demo */}
                    <div className="flex items-center gap-2 text-[10px]">
                        <span className="w-10 text-muted-foreground">Food</span>
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 w-[85%] rounded-full" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-[10px]">
                        <span className="w-10 text-muted-foreground">Vibe</span>
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary w-[92%] rounded-full" />
                        </div>
                    </div>
                 </div>
              </div>

              {/* AI Verdict Box */}
              <div className="bg-gradient-to-br from-blue-500/5 to-purple-500/5 border border-blue-500/20 p-4 rounded-xl">
                 <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-blue-500" />
                    <h3 className="text-sm font-bold text-blue-500">AI Analysis</h3>
                 </div>
                 <p className="text-sm text-foreground/90 leading-relaxed">
                    {selectedLocation.description || "A great spot with a unique atmosphere based on recent reviews."}
                 </p>
              </div>

              {/* Vibe Signature Grid */}
              <div className="pt-2">
                 <h4 className="text-sm font-semibold mb-3">Vibe Signature</h4>
                 <div className="grid grid-cols-3 gap-3">
                    <div className="bg-muted/30 border border-border p-3 rounded-lg flex flex-col items-center text-center gap-1">
                        <Volume2 className="w-5 h-5 text-muted-foreground" />
                        <span className="text-[10px] uppercase text-muted-foreground">Noise</span>
                        <span className="text-xs font-semibold">Medium</span>
                    </div>
                    <div className="bg-muted/30 border border-border p-3 rounded-lg flex flex-col items-center text-center gap-1">
                        <Sun className="w-5 h-5 text-muted-foreground" />
                        <span className="text-[10px] uppercase text-muted-foreground">Light</span>
                        <span className="text-xs font-semibold">Warm</span>
                    </div>
                    <div className="bg-muted/30 border border-border p-3 rounded-lg flex flex-col items-center text-center gap-1">
                        <Wifi className="w-5 h-5 text-muted-foreground" />
                        <span className="text-[10px] uppercase text-muted-foreground">WiFi</span>
                        <span className="text-xs font-semibold">Fast</span>
                    </div>
                 </div>
              </div>

              {/* Spacing for sticky bottom bar */}
              <div className="h-16" />
            </div>

          ) : (
            /* --- LIST VIEW --- */
            <div className="animate-in fade-in duration-300 pt-2 space-y-3">
              {locations.map(loc => (
                <div 
                  key={loc.id}
                  onClick={() => onSelect(loc)}
                  className="group flex gap-3 p-3 bg-background/60 hover:bg-muted/50 border border-transparent hover:border-border rounded-2xl cursor-pointer transition-all active:scale-[0.98]"
                >
                  {/* Icon/Image Placeholder */}
                  <div className="w-16 h-16 rounded-xl bg-muted shrink-0 flex items-center justify-center border border-border">
                     <MapPin className="w-6 h-6 text-muted-foreground" />
                  </div>
                  
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                     <div className="flex justify-between items-start mb-1">
                        <h3 className="font-semibold text-sm truncate pr-2">{loc.name}</h3>
                        <span className="flex items-center text-[10px] font-bold bg-green-500/10 text-green-600 px-1.5 py-0.5 rounded">
                            {loc.rating}
                        </span>
                     </div>
                     <p className="text-xs text-muted-foreground truncate mb-1.5">{loc.category} • {loc.address}</p>
                     
                     <div className="flex gap-1.5">
                        {loc.vibeScore && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary font-medium rounded">
                                Vibe: {loc.vibeScore}%
                            </span>
                        )}
                        <span className="text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded">
                            Quiet
                        </span>
                     </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* --- STICKY ACTION BAR (Visible only in Detail View) --- */}
      {/* Находится вне скролл-контейнера, фиксирован внизу экрана, но над навигацией */}
      <div 
        className={`
            md:hidden fixed bottom-0 left-0 w-full p-4 z-50
            bg-gradient-to-t from-background via-background to-transparent
            flex flex-col gap-3
            transition-transform duration-500 cubic-bezier(0.19, 1, 0.22, 1)
            ${selectedLocation && isExpanded ? 'translate-y-0' : 'translate-y-[150%]'}
        `}
      >
         <Button variant="outline" className="w-full rounded-xl h-11 bg-background/80 backdrop-blur-md">
            Compare to Competitors
         </Button>
         <Button className="w-full rounded-xl h-11 shadow-lg shadow-primary/20">
            Get Directions
         </Button>
      </div>
    </>
  );
};
