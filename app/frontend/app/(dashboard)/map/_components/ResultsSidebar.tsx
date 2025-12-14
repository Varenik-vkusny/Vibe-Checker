'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  ArrowLeft, Volume2, Sun, Wifi, Sparkles, ChevronRight,
  MapPin, Star, ThumbsUp, ThumbsDown, CheckCircle,
  GitCompare, ArrowUpRight
} from 'lucide-react';
import { LocationData } from '@/types/location';
import { interactWithPlace, markVisited } from '@/services/interaction';

interface ResultsSidebarProps {
  locations: LocationData[];
  selectedLocation: LocationData | null;
  query?: string;
  onSelect: (location: LocationData) => void;
  onBack: () => void;
  isVisible: boolean;
}

export const ResultsSidebar = ({
  locations,
  selectedLocation,
  query,
  onSelect,
  onBack,
  isVisible
}: ResultsSidebarProps) => {
  const router = useRouter();
  const { t } = useLanguage();
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  if (!isVisible) return null;

  // --- Url Construction Generator ---
  const constructUrl = (place: LocationData) => {
    // 1. Use place_id if available and valid (Google format often starts with 0x)
    if (place.place_id && String(place.place_id).includes('0x')) {
      return `https://www.google.com/maps/search/?api=1&query=Google&query_place_id=${place.place_id}`;
    }
    // 2. Fallback: Search by name and address
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ' ' + place.address)}`;
  };

  const handleCompareSelect = (secondPlace: LocationData) => {
    if (!selectedLocation) return;

    const urlA = constructUrl(selectedLocation);
    const urlB = constructUrl(secondPlace);

    router.push(`/compare?url_a=${encodeURIComponent(urlA)}&url_b=${encodeURIComponent(urlB)}`);
    setIsCompareOpen(false);
  };

  const handleAnalyze = () => {
    if (!selectedLocation) return;

    const url = constructUrl(selectedLocation);

    // Navigate to analysis page
    router.push(`/analysis?url=${encodeURIComponent(url)}`);
  };

  return (
    <>
      <div className="h-full flex flex-col bg-white dark:bg-zinc-950">

        {/* Header - Sticky */}
        <div className="shrink-0 p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur z-10 sticky top-0">
          {selectedLocation ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="pl-0 hover:bg-transparent hover:text-primary transition-colors -ml-2 mb-2 font-medium"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Results
            </Button>
          ) : (
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-500">{t.map.proModeResults}</h2>
              {query && (
                <Badge variant="outline" className="font-mono text-[10px] h-5">
                  {locations.length} RES
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          {selectedLocation ? (
            /* --- DETAIL VIEW (Vibe Sheet) --- */
            <div className="p-6">

              {/* Title Section */}
              <div className="mb-6">
                <div className="flex justify-between items-start">
                  <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">{selectedLocation.name}</h1>
                  <Badge className="bg-zinc-900 text-white dark:bg-white dark:text-black font-mono text-xs">
                    {selectedLocation.vibeScore}%
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-500 mt-2 font-mono">
                  <span>{selectedLocation.category}</span>
                  <span>•</span>
                  <span>{selectedLocation.priceLevel || '$$'}</span>
                  <span>•</span>
                  <span>{selectedLocation.distance || '1.2km'}</span>
                </div>
              </div>

              {/* AI Insight Box - Warning Style */}
              <div className="mb-6 bg-zinc-50 dark:bg-zinc-900/50 p-4 border-l-2 border-blue-500 rounded-r-lg text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                <span className="font-bold text-blue-500 block mb-1 text-xs uppercase tracking-wide">AI Insight</span>
                {selectedLocation.description || t.map.defaultAiInsight}
              </div>

              {/* Vibe Signature - Data Grid Row */}
              <div className="grid grid-cols-3 border-y border-zinc-100 dark:border-zinc-800 py-4 mb-6">
                <div className="flex flex-col items-center gap-1 border-r border-zinc-100 dark:border-zinc-800 last:border-0">
                  <Volume2 className="w-4 h-4 text-zinc-400" />
                  <span className="text-[10px] uppercase text-zinc-400 font-medium">{t.map.noise}</span>
                  <span className="text-sm font-semibold">{selectedLocation.vibeSignature?.noise || 'Med'}</span>
                </div>
                <div className="flex flex-col items-center gap-1 border-r border-zinc-100 dark:border-zinc-800 last:border-0">
                  <Sun className="w-4 h-4 text-zinc-400" />
                  <span className="text-[10px] uppercase text-zinc-400 font-medium">{t.map.light}</span>
                  <span className="text-sm font-semibold">{selectedLocation.vibeSignature?.light || 'Dim'}</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Wifi className="w-4 h-4 text-zinc-400" />
                  <span className="text-[10px] uppercase text-zinc-400 font-medium">{t.map.wifi}</span>
                  <span className="text-sm font-semibold">{selectedLocation.vibeSignature?.wifi || 'Fast'}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <Button onClick={handleAnalyze} className="w-full h-12 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-black font-medium text-sm">
                  {t.map.fullReport}
                </Button>
                <Button onClick={() => setIsCompareOpen(true)} variant="outline" className="w-full h-12 rounded-lg border-zinc-200 dark:border-zinc-800 font-medium text-sm">
                  {t.map.comparePlace}
                </Button>
              </div>

            </div>
          ) : (
            /* --- LIST VIEW (Compact) --- */
            <div className="flex flex-col">
              {locations.map((loc) => (
                <div
                  key={loc.id}
                  onClick={() => onSelect(loc)}
                  className="group flex items-center p-4 border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer transition-colors relative"
                >
                  {/* Selection Indicator */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-black dark:bg-white opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* Number / Score */}
                  <div className="w-10 h-10 shrink-0 bg-zinc-100 dark:bg-zinc-900 rounded-lg flex items-center justify-center font-mono text-sm font-bold text-zinc-700 dark:text-zinc-300 mr-4">
                    {loc.rating.toFixed(1)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className="font-semibold text-sm truncate text-zinc-900 dark:text-zinc-200">{loc.name}</h3>
                      {loc.vibeScore && (
                        <span className="font-mono text-[10px] font-bold text-green-600 bg-green-50 px-1.5 rounded">{loc.vibeScore}%</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
                      <span>{loc.distance || '1.2km'}</span>
                      <span>•</span>
                      <span>{loc.priceLevel || '$$'}</span>
                      <span>•</span>
                      <span className="truncate max-w-[100px]">{loc.category}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Compare Dialog */}
      <Dialog open={isCompareOpen} onOpenChange={setIsCompareOpen}>
        <DialogContent className="sm:max-w-[425px] bg-background border border-border sm:rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle>{t.map.compareWith.replace('{name}', selectedLocation?.name || '')}</DialogTitle>
            <DialogDescription>{t.map.selectToCompare}</DialogDescription>
          </DialogHeader>
          <div className="h-[300px] mt-2 pr-2 overflow-y-auto">
            <div className="space-y-2">
              {locations
                .filter(l => l.id !== selectedLocation?.id)
                .map(loc => (
                  <div
                    key={loc.id}
                    onClick={() => handleCompareSelect(loc)}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border/50 hover:bg-muted/80 cursor-pointer transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center font-bold text-xs">
                      {loc.rating > 0 ? loc.rating.toFixed(1) : "4.5"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{loc.name}</h4>
                      <p className="text-xs text-muted-foreground truncate">{loc.address}</p>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground opacity-50" />
                  </div>
                ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

const VibeCard = ({ icon: Icon, label, value }: any) => (
  <div className="bg-secondary/30 border border-border/50 p-3 rounded-xl flex flex-col items-center justify-center text-center gap-1.5">
    <Icon className="w-4 h-4 text-muted-foreground" />
    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{label}</span>
    <span className="text-xs font-semibold">{value}</span>
  </div>
);

const ProgressBar = ({ label, value, color }: any) => (
  <div className="grid grid-cols-[80px_1fr] items-center gap-2 text-xs">
    <span className="text-muted-foreground truncate">{label}</span>
    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }}></div>
    </div>
  </div>
);

const InteractionButtons = ({ place }: { place: LocationData }) => {
  const { t } = useLanguage();
  const [state, setState] = useState({ liked: false, disliked: false, visited: false });

  useEffect(() => {
    if (place.userInteraction) {
      setState({
        liked: place.userInteraction.isLiked,
        disliked: place.userInteraction.isDisliked,
        visited: place.userInteraction.isVisited
      });
    } else {
      setState({ liked: false, disliked: false, visited: false });
    }
  }, [place]);

  const handleRate = async (type: 'LIKE' | 'DISLIKE') => {
    const newState = type === 'LIKE' ? { liked: !state.liked, disliked: false } : { disliked: !state.disliked, liked: false };
    setState(prev => ({ ...prev, ...newState }));
    try {
      if (place.place_id) {
        const apiRating = (type === 'LIKE' && state.liked) || (type === 'DISLIKE' && state.disliked) ? 'NONE' : type;
        await interactWithPlace(place.place_id, apiRating);
      }
    } catch (e) { setState(prev => ({ ...prev, liked: state.liked, disliked: state.disliked })); }
  };

  const handleVisit = async () => {
    setState(prev => ({ ...prev, visited: !prev.visited }));
    try {
      if (place.place_id) await markVisited(place.place_id, !state.visited);
    } catch (e) { setState(prev => ({ ...prev, visited: state.visited })); }
  };

  return (
    <div className="flex gap-2 w-full">
      <Button variant="outline" size="sm" className={`flex-1 h-9 border-border/60 ${state.liked ? 'bg-primary/10 text-primary border-primary/20' : 'hover:bg-muted'}`} onClick={(e) => { e.stopPropagation(); handleRate('LIKE'); }}>
        <ThumbsUp className={`w-3.5 h-3.5 mr-1.5 ${state.liked ? 'fill-current' : ''}`} /> {t.map.like}
      </Button>
      <Button variant="outline" size="sm" className={`h-9 px-3 border-border/60 ${state.disliked ? 'bg-destructive/10 text-destructive border-destructive/20' : 'hover:bg-muted'}`} onClick={(e) => { e.stopPropagation(); handleRate('DISLIKE'); }}>
        <ThumbsDown className={`w-3.5 h-3.5 ${state.disliked ? 'fill-current' : ''}`} />
      </Button>
      <Button variant="outline" size="sm" className={`flex-1 h-9 border-border/60 ${state.visited ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'hover:bg-muted'}`} onClick={(e) => { e.stopPropagation(); handleVisit(); }}>
        <CheckCircle className={`w-3.5 h-3.5 mr-1.5 ${state.visited ? 'fill-current' : ''}`} /> {state.visited ? t.map.visited : t.map.markVisited}
      </Button>
    </div>
  );
};