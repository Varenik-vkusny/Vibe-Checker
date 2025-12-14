'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Search, ChevronUp, MapPin, Star, ArrowLeft, Navigation, Sparkles, Wifi, Sun, Volume2 } from 'lucide-react';
import { LocationData } from '@/types/location'; // Или интерфейс локально
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface MobileBottomSheetProps {
  locations: LocationData[];
  selectedLocation: LocationData | null;
  onSelect: (loc: LocationData) => void;
  onClose: () => void;
  // В interface MobileBottomSheetProps добавь:
  onExpandChange?: (isExpanded: boolean) => void;
}

export const MobileBottomSheet = ({ locations, selectedLocation, onSelect, onClose, onExpandChange }: MobileBottomSheetProps) => {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);

  // Auto-expand on selection, collapse on deselect (or distinct logic)
  useEffect(() => {
    if (selectedLocation) {
      // Start collapsed mostly? Or expanded? User said "Collapsed State: Shows only Top Result... Expanded State: Slides up"
      // Assuming initial state is collapsed if user just searched, but if they clicked a pin, maybe collapsed first?
      // Let's go with Collapsed by default when selecting a pin, user taps to expand.
      // Or 40% height.
      // "Collapsed State: Shows only 'Top Result' name + 'Vibe Score'".
      setIsExpanded(false);
      onExpandChange?.(false);
    }
  }, [selectedLocation]);

  const toggleSheet = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    onExpandChange?.(newState);
  };

  return (
    <div
      className={`
        md:hidden fixed bottom-0 left-0 w-full z-40
        bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 shadow-[0_-10px_40px_rgba(0,0,0,0.2)]
        transition-all duration-500 cubic-bezier(0.32, 0.72, 0, 1)
        rounded-t-[32px] overflow-hidden flex flex-col
        ${isExpanded ? 'h-[85vh]' : 'h-[160px]'}
      `}
    >
      {/* --- HANDLE & HEADER (Always Visible) --- */}
      <div
        onClick={toggleSheet}
        className="w-full shrink-0 pt-3 pb-4 px-6 bg-white dark:bg-zinc-900 cursor-pointer active:bg-zinc-50 dark:active:bg-zinc-800 transition-colors"
      >
        <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-6" />

        {/* Collapsed Content Preview */}
        {selectedLocation ? (
          <div className="flex justify-between items-center animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <h2 className="text-xl font-bold truncate max-w-[250px]">{selectedLocation.name}</h2>
              <p className="text-sm text-zinc-500">{selectedLocation.category} • {selectedLocation.distance || '1.2km'}</p>
            </div>
            <div className="flex flex-col items-end">
              <Badge className="bg-black text-white dark:bg-white dark:text-black h-8 px-3 text-sm font-mono">
                {selectedLocation.vibeScore}%
              </Badge>
            </div>
          </div>
        ) : (
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold">Pro Mode Results</h2>
              <p className="text-sm text-zinc-500">{locations.length} places found</p>
            </div>
            <Button size="sm" variant="secondary" className="rounded-full h-8">View List</Button>
          </div>
        )}
      </div>

      {/* --- SCROLLABLE CONTENT (Visible on Expand) --- */}
      <div className="flex-1 overflow-y-auto px-6 pb-32">
        {selectedLocation ? (
          <div className="space-y-6 pt-2">
            {/* Actions */}
            <div className="flex gap-3">
              <Button className="flex-1 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20">
                <Navigation className="w-4 h-4 mr-2" />
                Directions
              </Button>
              <Button variant="outline" className="h-12 w-12 rounded-xl border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-indigo-500" />
              </Button>
            </div>

            {/* AI Insight */}
            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 border border-zinc-100 dark:border-zinc-700 rounded-2xl">
              <h3 className="text-xs font-bold text-indigo-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                <Sparkles className="w-3 h-3" /> AI Insight
              </h3>
              <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                {selectedLocation.description || t.map.defaultAiInsight}
              </p>
            </div>

            {/* Vibe Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white dark:bg-black border border-zinc-100 dark:border-zinc-800 p-3 rounded-xl text-center">
                <Volume2 className="w-5 h-5 mx-auto text-zinc-400 mb-1" />
                <div className="text-[10px] text-zinc-400 uppercase">Noise</div>
                <div className="font-semibold text-sm">Low</div>
              </div>
              <div className="bg-white dark:bg-black border border-zinc-100 dark:border-zinc-800 p-3 rounded-xl text-center">
                <Sun className="w-5 h-5 mx-auto text-zinc-400 mb-1" />
                <div className="text-[10px] text-zinc-400 uppercase">Light</div>
                <div className="font-semibold text-sm">Dim</div>
              </div>
              <div className="bg-white dark:bg-black border border-zinc-100 dark:border-zinc-800 p-3 rounded-xl text-center">
                <Wifi className="w-5 h-5 mx-auto text-zinc-400 mb-1" />
                <div className="text-[10px] text-zinc-400 uppercase">Wifi</div>
                <div className="font-semibold text-sm">Fast</div>
              </div>
            </div>

            {/* Reviews Breakdown */}
            <div className="space-y-3">
              <h4 className="font-bold text-sm">Rating Breakdown</h4>
              <div className="flex items-center gap-4">
                <div className="text-5xl font-bold tracking-tighter">{selectedLocation.rating}</div>
                <div className="flex-1 space-y-2">
                  <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-black dark:bg-white w-[85%]" />
                  </div>
                  <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-zinc-400 dark:bg-zinc-600 w-[65%]" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* LIST VIEW */
          <div className="space-y-2 pt-2">
            {locations.map(loc => (
              <div
                key={loc.id}
                onClick={() => onSelect(loc)}
                className="flex items-center gap-4 p-4 bg-white dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 rounded-2xl active:scale-[0.98] transition-transform"
              >
                <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center font-bold text-sm">
                  {loc.rating}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm truncate">{loc.name}</h3>
                  <p className="text-xs text-zinc-500">{loc.category} • {loc.distance || '1.2km'}</p>
                </div>
                {loc.vibeScore && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    {loc.vibeScore}%
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
