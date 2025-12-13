'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Volume2, Sun, Wifi, Sparkles, ChevronRight, MapPin, Star } from 'lucide-react';
import { LocationData } from '@/types/location';
import { useRouter } from 'next/navigation';

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
  
  if (!isVisible) return null;

  // Helper for crowd bar visualization and legend
  const renderCrowdBar = (makeup: LocationData['crowdMakeup']) => {
    const data = makeup || { students: 33, families: 33, remote: 34 };
    return (
      <div className="space-y-2 mt-3">
        <div className="flex h-2 w-full rounded-full overflow-hidden bg-[#2A2A2A]">
          <div className="bg-blue-500 h-full" style={{ width: `${data.students}%` }} />
          <div className="bg-emerald-500 h-full" style={{ width: `${data.families}%` }} />
          <div className="bg-orange-500 h-full" style={{ width: `${data.remote}%` }} />
        </div>
        <div className="flex justify-between text-[10px] text-neutral-400 font-mono">
          <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"/> Students</div>
          <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"/> Families</div>
          <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-orange-500"/> Remote</div>
        </div>
      </div>
    );
  };

  return (
    <div className="hidden md:flex flex-col w-[420px] h-full bg-[#0F0F0F] border-r border-[#222] z-20 shadow-2xl relative">
      
      {/* === HEADER AREA (Sticky) === */}
      <div className="shrink-0 border-b border-[#222] bg-[#0F0F0F] z-10">
        {selectedLocation ? (
          // DETAIL HEADER: Explicit Back Button
          <div className="p-4 flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onBack}
              className="text-neutral-400 hover:text-white hover:bg-[#222] -ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Results
            </Button>
          </div>
        ) : (
          // LIST HEADER
          <div className="p-6 pb-4">
            <h2 className="text-xl font-bold text-white mb-2">Pro Mode Results</h2>
            {query && (
              <div className="flex items-center gap-2 text-sm text-neutral-400 bg-[#1A1A1A] py-2 px-3 rounded-lg border border-[#2A2A2A]">
                <Sparkles className="w-3.5 h-3.5 text-yellow-500" />
                <span className="truncate">"{query}"</span>
              </div>
            )}
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        {selectedLocation ? (
          /* === DETAIL CONTENT (Image 4 Style) === */
          <div className="p-6 space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            
            {/* Hero Info */}
            <div>
              <div className="flex justify-between items-start mb-2">
                <h1 className="text-3xl font-bold text-white leading-tight">{selectedLocation.name}</h1>
                <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded text-xs font-bold whitespace-nowrap">
                  {selectedLocation.vibeScore || 95}% Match
                </div>
              </div>
              <p className="text-sm text-neutral-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                {selectedLocation.address}
              </p>
              <div className="flex gap-2 mt-3">
                <span className="bg-[#1A1A1A] text-green-400 border border-green-900/30 px-2 py-0.5 rounded text-xs font-medium">
                  {selectedLocation.openStatus || 'Open Now'}
                </span>
                <span className="bg-[#1A1A1A] text-neutral-300 border border-[#374151] px-2 py-0.5 rounded text-xs font-medium">
                  {selectedLocation.priceLevel || '$$'}
                </span>
              </div>
            </div>

            {/* Rating Card */}
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-5 flex gap-5 items-center">
              <div className="text-center shrink-0">
                <div className="text-5xl font-bold text-white tracking-tighter">{selectedLocation.rating?.toFixed(1)}</div>
                <div className="text-xs text-neutral-500 mt-1">{selectedLocation.reviewCount} reviews</div>
              </div>
              <div className="flex-1 space-y-2">
                <div className="text-xs text-neutral-400 mb-1">Based on sub-ratings:</div>
                
                {/* Progress Bars */}
                <div className="grid grid-cols-[50px_1fr] items-center gap-2 text-xs">
                  <span className="text-neutral-400">Food</span>
                  <div className="h-1.5 bg-[#2A2A2A] rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${selectedLocation.subRatings?.food || 80}%` }}></div>
                  </div>
                </div>
                <div className="grid grid-cols-[50px_1fr] items-center gap-2 text-xs">
                  <span className="text-neutral-400">Service</span>
                  <div className="h-1.5 bg-[#2A2A2A] rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full" style={{ width: `${selectedLocation.subRatings?.service || 70}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Analysis */}
            <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/20 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider">AI Analysis</h3>
              </div>
              <p className="text-sm text-neutral-300 leading-relaxed">
                {selectedLocation.description || selectedLocation.reason || "Detailed analysis not available for this mock entry."}
              </p>
            </div>

            {/* Vibe Signature */}
            <div>
              <h3 className="text-white font-semibold mb-3">Vibe Signature</h3>
              <div className="grid grid-cols-3 gap-3">
                <VibeMetric icon={Volume2} label="Noise" value={selectedLocation.vibeSignature?.noise || 'Medium'} color="text-yellow-400" />
                <VibeMetric icon={Sun} label="Light" value={selectedLocation.vibeSignature?.light || 'Bright'} color="text-orange-400" />
                <VibeMetric icon={Wifi} label="Wifi" value={selectedLocation.vibeSignature?.wifi || 'Fast'} color="text-green-400" />
              </div>
            </div>

            {/* Crowd Makeup */}
            <div className="bg-[#151515] border border-[#222] p-4 rounded-xl">
              <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-2">Crowd Demographics</h4>
              {renderCrowdBar(selectedLocation.crowdMakeup)}
            </div>

            <Button 
              onClick={() => router.push(`/compare?place1=${selectedLocation.id}`)}
              className="w-full h-12 bg-white text-black hover:bg-neutral-200 font-bold rounded-xl"
            >
              Compare with Competitors
            </Button>

            <div className="h-8"/>
          </div>
        ) : (
          /* === LIST CONTENT (Image 3 Style) === */
          <div className="px-4 pb-4 space-y-3">
            {locations.map((loc) => (
              <div 
                key={loc.id} 
                onClick={() => onSelect(loc)}
                className="group p-4 bg-[#151515] border border-[#222] hover:border-neutral-600 hover:bg-[#1A1A1A] rounded-xl cursor-pointer transition-all duration-200 flex gap-4"
              >
                {/* Score Badge */}
                <div className="w-12 h-12 rounded-lg bg-[#222] flex flex-col items-center justify-center shrink-0 border border-[#333]">
                  <span className="text-lg font-bold text-white">{loc.rating?.toFixed(1)}</span>
                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className="text-white font-bold truncate pr-2 group-hover:text-blue-400 transition-colors">{loc.name}</h3>
                  </div>
                  
                  <p className="text-xs text-neutral-500 mb-2 truncate">
                    {loc.category} • {loc.distance || '1.2km away'}
                  </p>

                  {loc.tags && (
                    <div className="flex flex-wrap gap-1.5">
                      {loc.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-[#252525] text-neutral-300 rounded border border-[#333]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center text-neutral-600 group-hover:text-white">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

// Helper Component for Vibe Metrics
const VibeMetric = ({ icon: Icon, label, value, color }: { icon: any, label: string, value: string, color: string }) => (
  <div className="bg-[#1A1A1A] border border-[#2A2A2A] p-3 rounded-xl flex flex-col items-center justify-center text-center gap-1">
    <Icon className={`w-5 h-5 ${color} mb-1`} />
    <span className="text-[10px] text-neutral-500 font-bold uppercase">{label}</span>
    <span className="text-sm font-semibold text-white">{value}</span>
  </div>
);