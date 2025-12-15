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
  GitCompare, ArrowUpRight, ArrowRight, ChevronLeft
} from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { LocationData } from '@/types/location';
import { interactWithPlace, markVisited } from '@/services/interaction';
import { InteractionToolbar } from '@/components/map/InteractionToolbar';
import { getDistance, convertDistance } from 'geolib';

interface ResultsSidebarProps {
  locations: LocationData[];
  selectedLocation: LocationData | null;
  query?: string;
  onSelect: (location: LocationData) => void;
  onBack: () => void;
  isVisible: boolean;
  userLocation: { lat: number; lng: number } | null;
  onInteractionUpdate?: (placeId: string, updates: any) => void;
}

export const ResultsSidebar = ({
  locations,
  selectedLocation,
  query,
  onSelect,
  onBack,
  isVisible,
  userLocation,
  onInteractionUpdate
}: ResultsSidebarProps) => {
  const router = useRouter();
  const { t } = useLanguage();
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  const MOCK_PHOTOS = [
    "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=400",
    "https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=400",
    "https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?q=80&w=400",
    "https://images.unsplash.com/photo-1514362545857-3bc16549766b?q=80&w=400"
  ];

  const displayPhotos = selectedLocation?.imageUrl
    ? [selectedLocation.imageUrl, ...MOCK_PHOTOS.slice(0, 3)]
    : MOCK_PHOTOS;

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
      <div className="h-full w-full flex flex-col bg-white dark:bg-zinc-950 overflow-hidden">

        {/* Header - Sticky */}
        <div className="shrink-0 p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur z-10 sticky top-0">
          {selectedLocation ? (
            <div className="animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={onBack}
                      className="p-1 -ml-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <ChevronLeft className="w-5 h-5 text-zinc-500" />
                    </motion.button>
                    <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 truncate max-w-[280px]">{selectedLocation.name}</h1>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-zinc-500 pl-7 font-mono">
                    <span>{selectedLocation.category}</span>
                    <span>•</span>
                    <span>
                      {userLocation && selectedLocation.coordinates
                        ? `${convertDistance(getDistance(
                          userLocation,
                          { latitude: selectedLocation.coordinates[1], longitude: selectedLocation.coordinates[0] }
                        ), 'km').toFixed(1)}km`
                        : (selectedLocation.distance || '1.2km')}
                    </span>
                  </div>
                </div>
                <Badge className="bg-zinc-900 text-white dark:bg-white dark:text-black font-mono text-xs h-7 px-2">
                  {selectedLocation.vibeScore}%
                </Badge>
              </div>
            </div>
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
        <div className="flex-1 w-full min-w-0 overflow-y-auto">
          {selectedLocation ? (
            /* --- DETAIL VIEW (Vibe Sheet) --- */
            <div className="p-6 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-full">

              {/* Photos - Grid + Overflow Pattern */}
              <div className="grid grid-cols-3 gap-2 mb-6">
                {displayPhotos.slice(0, 3).map((url, i) => {
                  const isLastSlot = i === 2;
                  const overflowCount = displayPhotos.length - 3;
                  const showOverlay = isLastSlot && overflowCount > 0;

                  return (
                    <div
                      key={i}
                      onClick={() => setIsGalleryOpen(true)}
                      className="relative aspect-square rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 cursor-pointer hover:opacity-90 transition-opacity"
                    >
                      <img src={url} alt="Location" className="w-full h-full object-cover" />
                      {showOverlay && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                          <span className="text-white font-bold text-lg">+{overflowCount + 1}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* AI Insight Box */}
              <div className="mb-6 bg-zinc-50 dark:bg-zinc-900/50 p-4 border border-zinc-100 dark:border-zinc-700 rounded-2xl text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                <h3 className="text-xs font-bold text-indigo-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                  <Sparkles className="w-3 h-3" /> AI Insight
                </h3>
                {selectedLocation.description || t.map.defaultAiInsight}
              </div>

              {/* Vibe Grid (3 Cards) */}
              <div className="grid grid-cols-3 gap-2 mb-6">
                <div className="bg-white dark:bg-black border border-zinc-100 dark:border-zinc-800 p-2 lg:p-3 rounded-xl text-center min-w-0">
                  <Volume2 className="w-5 h-5 mx-auto text-zinc-400 mb-1" />
                  <div className="text-[10px] text-zinc-400 uppercase truncate">{t.map.noise}</div>
                  <div className="font-semibold text-sm truncate">{selectedLocation.vibeSignature?.noise || 'Low'}</div>
                </div>
                <div className="bg-white dark:bg-black border border-zinc-100 dark:border-zinc-800 p-2 lg:p-3 rounded-xl text-center min-w-0">
                  <Sun className="w-5 h-5 mx-auto text-zinc-400 mb-1" />
                  <div className="text-[10px] text-zinc-400 uppercase truncate">{t.map.light}</div>
                  <div className="font-semibold text-sm truncate">{selectedLocation.vibeSignature?.light || 'Dim'}</div>
                </div>
                <div className="bg-white dark:bg-black border border-zinc-100 dark:border-zinc-800 p-2 lg:p-3 rounded-xl text-center min-w-0">
                  <Wifi className="w-5 h-5 mx-auto text-zinc-400 mb-1" />
                  <div className="text-[10px] text-zinc-400 uppercase truncate">{t.map.wifi}</div>
                  <div className="font-semibold text-sm truncate">{selectedLocation.vibeSignature?.wifi || 'Fast'}</div>
                </div>
              </div>

              {/* Reviews Breakdown */}
              <div className="space-y-3 mb-6">
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

              {/* Interaction Toolbar */}
              <div className="mb-6">
                {selectedLocation.place_id && (
                  <InteractionToolbar
                    placeId={String(selectedLocation.place_id)}
                    initialLikeState={selectedLocation.userInteraction?.isLiked}
                    initialDislikeState={selectedLocation.userInteraction?.isDisliked}
                    initialVisitedState={selectedLocation.userInteraction?.isVisited}
                    onUpdate={(updates) => onInteractionUpdate?.(String(selectedLocation.place_id), updates)}
                  />
                )}
              </div>


              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-4">
                <Link href={`/analysis?url=${encodeURIComponent(constructUrl(selectedLocation))}`} className="flex-1 min-w-[140px]">
                  <Button variant="outline" className="w-full justify-between h-12 rounded-xl border-zinc-200 dark:border-zinc-800">
                    Full Analysis <ArrowRight className="w-4 h-4 ml-2 text-zinc-400" />
                  </Button>
                </Link>
                <Link href={`/compare?url_a=${encodeURIComponent(constructUrl(selectedLocation))}`} className="flex-1 min-w-[140px]">
                  <Button variant="outline" className="w-full justify-between h-12 rounded-xl border-zinc-200 dark:border-zinc-800">
                    Compare <GitCompare className="w-4 h-4 ml-2 text-zinc-400" />
                  </Button>
                </Link>
              </div>

            </div>
          ) : (
            /* --- LIST VIEW (Compact) --- */
            <div className="flex flex-col">
              {locations.map((loc) => {
                const distanceStr = (userLocation && loc.coordinates)
                  ? `${convertDistance(getDistance(
                    userLocation,
                    { latitude: loc.coordinates[1], longitude: loc.coordinates[0] }
                  ), 'km').toFixed(1)}km`
                  : (loc.distance || '1.2km');

                return (
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
                        <span>{distanceStr}</span>
                        <span>•</span>
                        <span>{loc.priceLevel || '$$'}</span>
                        <span>•</span>
                        <span className="truncate max-w-[100px]">{loc.category}</span>
                      </div>
                      <div className="mt-2 w-full max-w-[200px]" onClick={(e) => e.stopPropagation()}>
                        <InteractionToolbar
                          placeId={String(loc.place_id || '0')}
                          initialLikeState={loc.userInteraction?.isLiked}
                          initialDislikeState={loc.userInteraction?.isDisliked}
                          initialVisitedState={loc.userInteraction?.isVisited}
                          onUpdate={(updates) => onInteractionUpdate?.(String(loc.place_id), updates)}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Compare Dialog */}
      <Dialog open={isCompareOpen} onOpenChange={setIsCompareOpen}>
        <DialogContent className="sm:max-w-[425px] bg-background border border-border sm:rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle>{(t.map.compareWith || 'Compare with {name}').replace('{name}', selectedLocation?.name || '')}</DialogTitle>
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

      {/* Gallery Dialog */}
      <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] p-0 overflow-hidden bg-background border-none sm:rounded-2xl shadow-2xl">
          <div className="p-4 border-b border-border bg-background z-10 sticky top-0 flex justify-between items-center">
            <div>
              <DialogTitle className="text-lg font-bold">{selectedLocation?.name}</DialogTitle>
              <DialogDescription className="text-xs">Gallery • {displayPhotos.length} photos</DialogDescription>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setIsGalleryOpen(false)}>
              <div className="sr-only">Close</div>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x w-4 h-4"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
            </Button>
          </div>
          <ScrollArea className="h-full max-h-[calc(90vh-65px)] w-full p-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pb-4">
              {displayPhotos.map((url, i) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-800">
                  <img src={url} alt={`Location photo ${i}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                </div>
              ))}
            </div>
          </ScrollArea>
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
