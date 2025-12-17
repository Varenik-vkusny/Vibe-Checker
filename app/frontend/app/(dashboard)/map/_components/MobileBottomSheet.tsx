'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Sparkles, Wifi, Sun, Volume2, Coffee, Armchair, Laptop, ChevronLeft, ArrowRight, GitCompare } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { LocationData } from '@/types/location';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { DirectionsButton } from '@/components/map/DirectionsButton';
import { InteractionToolbar } from '@/components/map/InteractionToolbar';
import { getDistance, convertDistance } from 'geolib';

interface MobileBottomSheetProps {
  locations: LocationData[];
  selectedLocation: LocationData | null;
  onSelect: (loc: LocationData) => void;
  onClose: () => void;
  onExpandChange?: (isExpanded: boolean) => void;
  onClearSelection?: () => void;
  userLocation: { lat: number; lng: number } | null;
  onInteractionUpdate?: (placeId: string, updates: any) => void;
}

export const MobileBottomSheet = ({
  locations,
  selectedLocation,
  onSelect,
  onClose,
  onExpandChange,
  onClearSelection,
  userLocation,
  onInteractionUpdate
}: MobileBottomSheetProps) => {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (selectedLocation) {
      setIsExpanded(true);
      onExpandChange?.(true);
    }
  }, [selectedLocation]);

  const toggleSheet = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    onExpandChange?.(newState);
  };

  const MOCK_PHOTOS = [
    "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=400",
    "https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=400",
    "https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?q=80&w=400",
    "https://images.unsplash.com/photo-1514362545857-3bc16549766b?q=80&w=400"
  ];

  const displayPhotos = (selectedLocation?.photos && selectedLocation.photos.length > 0)
    ? selectedLocation.photos
    : (selectedLocation?.imageUrl
      ? [selectedLocation.imageUrl, ...MOCK_PHOTOS.slice(0, 3)]
      : MOCK_PHOTOS);

  const router = useRouter();
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  const constructUrl = (place: LocationData) => {
    if (place.place_id && String(place.place_id).includes('0x')) {
      return `https://www.google.com/maps/search/?api=1&query=Google&query_place_id=${place.place_id}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ' ' + place.address)}`;
  };

  const handleCompareSelect = (secondPlace: LocationData) => {
    if (!selectedLocation) return;
    const urlA = constructUrl(selectedLocation);
    const urlB = constructUrl(secondPlace);
    router.push(`/compare?url_a=${encodeURIComponent(urlA)}&url_b=${encodeURIComponent(urlB)}`);
    setIsCompareOpen(false);
  };

  return (
    <motion.div
      initial={false}
      animate={{
        height: isExpanded ? 'auto' : selectedLocation ? 95 : 160
      }}
      transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.8 }}
      className={`
        md:hidden fixed bottom-[calc(4rem+env(safe-area-inset-bottom))] left-0 right-0 z-40
        bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 shadow-[0_-10px_40px_rgba(0,0,0,0.2)]
        rounded-t-[32px] overflow-hidden flex flex-col max-h-[80vh]
      `}
    >
      <div
        onClick={toggleSheet}
        className="w-full shrink-0 pt-3 pb-4 px-6 bg-white dark:bg-zinc-900 cursor-pointer active:bg-zinc-50 dark:active:bg-zinc-800 transition-colors"
      >
        <div className="w-12 h-1.5 bg-zinc-300 dark:bg-zinc-700 rounded-full mx-auto mb-4" />

        {selectedLocation ? (
          <div className="flex justify-between items-start animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div>
              <div className="flex items-center gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => { e.stopPropagation(); onClearSelection?.(); }}
                  className="p-1 -ml-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <ChevronLeft className="w-5 h-5 text-zinc-500" />
                </motion.button>
                <h2 className="text-xl font-bold truncate max-w-[200px]">{selectedLocation.name}</h2>
              </div>
              <p className="text-sm text-zinc-500 pl-6">{selectedLocation.category} • {userLocation && selectedLocation.coordinates
                ? `${convertDistance(getDistance(
                  userLocation,
                  { latitude: selectedLocation.coordinates[1], longitude: selectedLocation.coordinates[0] }
                ), 'km').toFixed(1)}km`
                : (selectedLocation.distance || '1.2km')}</p>
            </div>
            <div className="flex flex-col items-end">
              <Badge className="bg-black text-white dark:bg-white dark:text-black h-8 px-3 text-sm font-mono">
                {selectedLocation.vibeScore}%
              </Badge>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold">{t.map.proModeResults}</h2>
                <p className="text-sm text-zinc-500">{locations.length} {t.header.places.toLowerCase()}</p>
              </div>
              <Button size="sm" variant="secondary" className="rounded-full h-8">{isExpanded ? 'View Map' : 'View List'}</Button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              <Badge variant="outline" className="px-3 py-1.5 gap-1.5 text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 font-medium">
                <Coffee className="w-3.5 h-3.5" /> Coffee
              </Badge>
              <Badge variant="outline" className="px-3 py-1.5 gap-1.5 text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 font-medium">
                <Laptop className="w-3.5 h-3.5" /> Work
              </Badge>
              <Badge variant="outline" className="px-3 py-1.5 gap-1.5 text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 font-medium">
                <Armchair className="w-3.5 h-3.5" /> Cozy
              </Badge>
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {selectedLocation ? (
          <div className="space-y-6 pt-2 animate-in fade-in slide-in-from-bottom-4 duration-500">

            <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 snap-x">
              {displayPhotos.map((url: string, i: number) => (
                <div key={i} className="shrink-0 w-32 h-32 rounded-lg overflow-hidden bg-zinc-100 snap-center">
                  <img src={url} alt="Location" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>

            <DirectionsButton
              lat={selectedLocation.coordinates?.[1] || 0}
              lng={selectedLocation.coordinates?.[0] || 0}
              address={selectedLocation.name}
            />

            <div className="bg-zinc-50 dark:bg-zinc-800/50 p-4 border border-zinc-100 dark:border-zinc-700 rounded-2xl">
              <h3 className="text-xs font-bold text-indigo-500 uppercase tracking-wide mb-2 flex items-center gap-2">
                <Sparkles className="w-3 h-3" /> {t.map.aiInsight}
              </h3>
              <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                {selectedLocation.description || t.map.defaultAiInsight}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white dark:bg-black border border-zinc-100 dark:border-zinc-800 p-3 rounded-xl text-center">
                <Volume2 className="w-5 h-5 mx-auto text-zinc-400 mb-1" />
                <div className="text-[10px] text-zinc-400 uppercase">{t.map.noise}</div>
                <div className="font-semibold text-sm">Low</div>
              </div>
              <div className="bg-white dark:bg-black border border-zinc-100 dark:border-zinc-800 p-3 rounded-xl text-center">
                <Sun className="w-5 h-5 mx-auto text-zinc-400 mb-1" />
                <div className="text-[10px] text-zinc-400 uppercase">{t.map.light}</div>
                <div className="font-semibold text-sm">Dim</div>
              </div>
              <div className="bg-white dark:bg-black border border-zinc-100 dark:border-zinc-800 p-3 rounded-xl text-center">
                <Wifi className="w-5 h-5 mx-auto text-zinc-400 mb-1" />
                <div className="text-[10px] text-zinc-400 uppercase">{t.map.wifi}</div>
                <div className="font-semibold text-sm">Fast</div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-sm">{t.map.ratingBreakdown}</h4>
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
            {selectedLocation.place_id && (
              <InteractionToolbar
                placeId={String(selectedLocation.place_id)}
                initialLikeState={selectedLocation.userInteraction?.isLiked}
                initialDislikeState={selectedLocation.userInteraction?.isDisliked}
                initialVisitedState={selectedLocation.userInteraction?.isVisited}
                onUpdate={(updates) => onInteractionUpdate?.(String(selectedLocation.place_id), updates)}
              />
            )}

            <div className="grid grid-cols-2 gap-3 pt-4">
              <Link href={`/analysis?url=${encodeURIComponent(constructUrl(selectedLocation))}`} className="w-full">
                <Button variant="outline" className="w-full justify-between h-12 rounded-xl border-zinc-200 dark:border-zinc-800">
                  {t.analysis.title || 'Analysis'} <ArrowRight className="w-4 h-4 ml-2 text-zinc-400" />
                </Button>
              </Link>
              <Button
                variant="outline"
                className="w-full justify-between h-12 rounded-xl border-zinc-200 dark:border-zinc-800"
                onClick={() => setIsCompareOpen(true)}
              >
                {t.compare.compareButton || 'Compare'} <GitCompare className="w-4 h-4 ml-2 text-zinc-400" />
              </Button>
            </div>
          </div>
        ) : (
          isExpanded && (
            <div className="space-y-2 pt-2">
              {locations.map(loc => {
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
                    className="flex items-center gap-4 p-4 bg-white dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800 rounded-2xl active:scale-[0.98] transition-transform"
                  >
                    <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center font-bold text-sm">
                      {loc.rating}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm truncate">{loc.name}</h3>
                      <p className="text-xs text-zinc-500">{loc.category} • {distanceStr}</p>
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
                    {loc.vibeScore && (
                      <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        {loc.vibeScore}%
                      </Badge>
                    )}
                  </div>
                )
              })}
            </div>
          )
        )}
      </div>

      <Dialog open={isCompareOpen} onOpenChange={setIsCompareOpen}>
        <DialogContent className="sm:max-w-[425px] w-[90%] rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle>Compare with {selectedLocation?.name}</DialogTitle>
            <DialogDescription>Select another place to compare</DialogDescription>
          </DialogHeader>
          <div className="h-[300px] mt-2 pr-2 overflow-y-auto">
            <div className="space-y-2">
              {locations
                .filter(l => l.id !== selectedLocation?.id)
                .map(loc => (
                  <div
                    key={loc.id}
                    onClick={() => handleCompareSelect(loc)}
                    className="flex items-center gap-3 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 active:bg-zinc-100 dark:active:bg-zinc-800 cursor-pointer transition-colors"
                  >
                    <div className="w-10 h-10 rounded-lg bg-white dark:bg-zinc-700 flex items-center justify-center font-bold text-xs">
                      {loc.rating > 0 ? loc.rating.toFixed(1) : "4.5"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{loc.name}</h4>
                      <p className="text-xs text-zinc-500 truncate">{loc.address}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-400" />
                  </div>
                ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};
