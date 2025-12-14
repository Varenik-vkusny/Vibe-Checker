'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ScrollArea } from '@/components/ui/scroll-area'; 
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  
  if (!isVisible) return null;

  // --- 🔥 ГЛАВНОЕ ИСПРАВЛЕНИЕ: ГЕНЕРАТОР ССЫЛОК ---
  const constructUrl = (place: LocationData) => {
    // 1. Если есть ID в формате '0x...', используем его. Парсер бэкенда это обожает.
    if (place.place_id && String(place.place_id).includes('0x')) {
       return `https://www.google.com/maps/search/?api=1&query=Google&query_place_id=${place.place_id}`;
    }
    // 2. Фаллбэк: Если ID нет или он кривой, ищем по адресу.
    // (Но Pro Mode обычно всегда дает хороший ID)
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ' ' + place.address)}`;
  };

  const handleCompareSelect = (secondPlace: LocationData) => {
    if (!selectedLocation) return;
    
    // Используем генератор для обоих мест
    const urlA = constructUrl(selectedLocation);
    const urlB = constructUrl(secondPlace);

    router.push(`/compare?url_a=${encodeURIComponent(urlA)}&url_b=${encodeURIComponent(urlB)}`);
    setIsCompareOpen(false);
  };

  const handleAnalyze = () => {
    if (!selectedLocation) return;
    
    // Используем генератор для анализа
    const url = constructUrl(selectedLocation);
    
    // Переход на страницу анализа
    router.push(`/analysis?url=${encodeURIComponent(url)}`);
  };

  return (
    <>
      {/* Container */}
      <div className="hidden md:flex flex-col w-[400px] fixed top-[88px] left-6 z-20 h-[calc(100vh-120px)] glass-panel rounded-2xl border border-white/20 shadow-2xl overflow-hidden transition-all duration-300">
        
        {/* Header */}
        <div className="shrink-0 p-6 border-b border-border/40 bg-background/50 backdrop-blur-sm z-10">
          {selectedLocation ? (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack}
              className="pl-0 hover:bg-transparent hover:text-primary transition-colors -ml-2 mb-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Results
            </Button>
          ) : (
            <div className="space-y-1">
              <h2 className="text-xl font-semibold tracking-tight">Pro Mode Results</h2>
              {query && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Sparkles className="w-3 h-3 text-primary" />
                  <span>Found {locations.length} matches for "{query}"</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content with Native Scroll */}
        <div className="flex-1 overflow-y-auto">
          {selectedLocation ? (
            /* DETAIL */
            <div className="p-6 space-y-8 pb-10">
              
              <div className="space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <h1 className="text-2xl font-bold leading-tight tracking-tight">{selectedLocation.name}</h1>
                  <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20 px-2 py-1 shrink-0">
                    {selectedLocation.vibeScore || 95}% Match
                  </Badge>
                </div>
                
                <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                   <span className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 opacity-70" />
                      {selectedLocation.address}
                   </span>
                   <div className="flex gap-3 pt-1">
                      <span className="text-foreground font-medium">{selectedLocation.openStatus || 'Open Now'}</span>
                      <span>•</span>
                      <span>{selectedLocation.priceLevel || '$$'}</span>
                      <span>•</span>
                      <span>{selectedLocation.category}</span>
                   </div>
                </div>

                <InteractionButtons place={selectedLocation} />
              </div>
              
              <Separator className="bg-border/60" />

              <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/50 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">AI Insight</h3>
                </div>
                <p className="text-sm leading-relaxed text-foreground/90">
                  {selectedLocation.description || "AI has analyzed reviews to determine this place matches your vibe perfectly."}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                 <VibeCard icon={Volume2} label="Noise" value={selectedLocation.vibeSignature?.noise || 'Med'} />
                 <VibeCard icon={Sun} label="Light" value={selectedLocation.vibeSignature?.light || 'Dim'} />
                 <VibeCard icon={Wifi} label="Wifi" value={selectedLocation.vibeSignature?.wifi || 'Fast'} />
              </div>

              <div className="space-y-3">
                 <h4 className="text-sm font-semibold">Rating Breakdown</h4>
                 <div className="flex items-center gap-4">
                    <div className="text-4xl font-bold">
                      {selectedLocation.rating > 0 ? selectedLocation.rating?.toFixed(1) : "4.8"}
                    </div>
                    <div className="flex-1 space-y-2">
                       <ProgressBar label="Food Quality" value={selectedLocation.subRatings?.food || 88} color="bg-primary" />
                       <ProgressBar label="Service Speed" value={selectedLocation.subRatings?.service || 76} color="bg-primary/70" />
                    </div>
                 </div>
              </div>
              
              {/* ACTION BUTTONS */}
              <div className="flex flex-col gap-3 pt-6 pb-4 border-t border-border/40 mt-4">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Advanced Tools</h4>
                  
                  <Button 
                    onClick={handleAnalyze}
                    className="w-full h-12 rounded-xl font-medium gap-2 shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all"
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    Full AI Analysis Report
                  </Button>

                  <Button 
                    onClick={() => setIsCompareOpen(true)}
                    variant="secondary"
                    className="w-full h-12 rounded-xl border border-border hover:bg-background font-medium gap-2"
                  >
                    <GitCompare className="w-4 h-4 text-muted-foreground" />
                    Compare with another place
                  </Button>
              </div>
            </div>
          ) : (
            /* LIST */
            <div className="p-4 space-y-3 pb-24">
              {locations.map((loc) => (
                <div 
                  key={loc.id} 
                  onClick={() => onSelect(loc)}
                  className="group p-4 bg-card/40 hover:bg-accent/50 border border-border/40 hover:border-primary/20 rounded-xl cursor-pointer transition-all duration-200 flex gap-4"
                >
                  <div className="w-12 h-12 rounded-xl bg-muted/50 flex flex-col items-center justify-center shrink-0 border border-border/50 group-hover:scale-105 transition-transform">
                    <span className="text-sm font-bold">
                      {loc.rating > 0 ? loc.rating.toFixed(1) : "4.5"}
                    </span>
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{loc.name}</h3>
                    </div>
                    
                    <p className="text-xs text-muted-foreground truncate mb-2">
                      {loc.category} • {loc.distance || '1.2km'}
                    </p>

                    <div className="flex flex-wrap gap-1.5">
                      {loc.tags?.slice(0, 2).map(tag => (
                        <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-secondary text-secondary-foreground rounded-md">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center text-muted-foreground/30 group-hover:text-foreground/80 transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Compare Dialog */}
      <Dialog open={isCompareOpen} onOpenChange={setIsCompareOpen}>
        <DialogContent className="sm:max-w-[425px] glass-panel bg-background/95 backdrop-blur-xl border-white/20">
          <DialogHeader>
            <DialogTitle>Compare {selectedLocation?.name} with...</DialogTitle>
            <DialogDescription>Select another place to compare.</DialogDescription>
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
            <ThumbsUp className={`w-3.5 h-3.5 mr-1.5 ${state.liked ? 'fill-current' : ''}`} /> Like
        </Button>
        <Button variant="outline" size="sm" className={`h-9 px-3 border-border/60 ${state.disliked ? 'bg-destructive/10 text-destructive border-destructive/20' : 'hover:bg-muted'}`} onClick={(e) => { e.stopPropagation(); handleRate('DISLIKE'); }}>
            <ThumbsDown className={`w-3.5 h-3.5 ${state.disliked ? 'fill-current' : ''}`} />
        </Button>
        <Button variant="outline" size="sm" className={`flex-1 h-9 border-border/60 ${state.visited ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'hover:bg-muted'}`} onClick={(e) => { e.stopPropagation(); handleVisit(); }}>
            <CheckCircle className={`w-3.5 h-3.5 mr-1.5 ${state.visited ? 'fill-current' : ''}`} /> {state.visited ? 'Visited' : 'Mark Visited'}
        </Button>
    </div>
  );
};