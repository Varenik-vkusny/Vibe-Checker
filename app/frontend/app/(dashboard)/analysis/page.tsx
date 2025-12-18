'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api from '@/lib/api';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Loader2, Sparkles, Wifi, Sun, Volume2, Globe, ArrowUpRight, Search, Bookmark, ArrowRight, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SkeletonAnalysis } from "@/components/SkeletonAnalysis";
import { UnifiedSearchInput } from '@/components/UnifiedSearchInput';
import { InteractionToolbar } from '@/components/map/InteractionToolbar';
import { toast } from 'sonner';
import { favoritesService } from '@/services/favorites';

const analysisSchema = z.object({
  query: z.string().min(1, 'Please enter a URL or Place Name'),
});

type AnalysisValues = z.infer<typeof analysisSchema>;

const MOCK_SEARCH_RESULTS = [
  { id: 101, name: "The Daily Grind", address: "123 Main St, Downtown", image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=200" },
  { id: 102, name: "Grind & Brew Co.", address: "456 Market Ave, Westside", image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=200" },
  { id: 103, name: "Cafe Grind", address: "789 Park Blvd, North Hills", image: "https://images.unsplash.com/photo-1514362545857-3bc16549766b?q=80&w=200" },
];

export default function AnalysisPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searchCandidates, setSearchCandidates] = useState<any[] | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number, lon: number } | null>(null);

  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const initialized = useRef(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<AnalysisValues>({
    resolver: zodResolver(analysisSchema),
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        (error) => {
          console.log('Geolocation error:', error);
          setUserLocation({ lat: 51.1694, lon: 71.4491 });
        }
      );
    } else {
      setUserLocation({ lat: 51.1694, lon: 71.4491 });
    }
  }, []);


  const performAnalysis = async (url: string) => {
    setLoading(true);
    setSearchCandidates(null); // Clear candidates
    try {
      const response = await api.post('/place/analyze', {
        url: url,
        limit: 10
      });
      setResult(response.data);
      setIsBookmarked(false); // Reset bookmark state for new result
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const performSearch = async (query: string) => {
    setLoading(true);
    setResult(null); // Clear previous result
    setSearchCandidates(null);

    try {
      const response = await api.post('/place/search_candidates', {
        query,
        lat: userLocation?.lat,
        lon: userLocation?.lon
      });
      setSearchCandidates(response.data.candidates);
    } catch (error) {
      console.error(error);
      toast.error("Search failed");
    } finally {
      setLoading(false);
    }
  };

  const checkBookmarkStatus = async (placeId: number) => {
    try {
      const favorites = await favoritesService.getFavorites();
      const isFav = favorites.some(f => f.id === placeId);
      setIsBookmarked(isFav);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCandidateClick = (candidate: any) => {
    if (candidate.google_place_id) {
      const validUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(candidate.name)}&query_place_id=${candidate.google_place_id}`;
      performAnalysis(validUrl);
    } else {
      performAnalysis(candidate.name);
    }
  };

  useEffect(() => {
    if (result?.place_info?.id) {
      checkBookmarkStatus(result.place_info.id);
    }
  }, [result]);

  const handleBookmark = async () => {
    if (!result?.place_info?.id) return;
    try {
      await favoritesService.toggleFavorite(result.place_info.id);
      setIsBookmarked(prev => !prev);
      toast.success(!isBookmarked ? "Saved to Library" : "Removed from Library");
    } catch (e) {
      toast.error("Failed to update bookmark");
    }
  };

  const onSubmit = async (data: AnalysisValues) => {
    const input = data.query;
    const isUrl = input.startsWith('http');

    if (isUrl) {
      await performAnalysis(input);
    } else {
      await performSearch(input);
    }
  };

  useEffect(() => {
    const urlParam = searchParams.get('url');
    if (urlParam && !initialized.current) {
      initialized.current = true;
      setValue('query', urlParam);
      performAnalysis(urlParam);
    }
  }, [searchParams, setValue]);

  const isIdle = !loading && !result && !searchCandidates;

  const scores = result ? [
    { name: t.analysis.scores.food, score: result.ai_analysis.scores.food, fill: '#10B981' },
    { name: t.analysis.scores.service, score: result.ai_analysis.scores.service, fill: '#3B82F6' },
    { name: t.analysis.scores.atmosphere, score: result.ai_analysis.scores.atmosphere, fill: '#8B5CF6' },
    { name: t.analysis.scores.value, score: result.ai_analysis.scores.value, fill: '#F59E0B' },
  ] : [];

  return (
    <div className={cn(
      "h-[calc(100vh-3.5rem)] bg-white dark:bg-zinc-950 text-foreground pb-24 px-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]",
      isIdle ? "pt-20" : "pt-4 md:pt-6",
      (result || searchCandidates) ? "overflow-y-auto" : "overflow-hidden"
    )}>
      <div className={cn("w-full max-w-4xl mx-auto transition-all duration-500 ease-in-out", isIdle ? "space-y-12" : "space-y-6")}>

        <div className="flex flex-col items-center text-center md:items-start md:text-left animate-in fade-in slide-in-from-bottom-4 duration-700">
          {isIdle && (
            <>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-zinc-900 dark:text-white mb-6">
                {t.analysis.heroTitle}
              </h1>
              <p className="text-zinc-500 dark:text-zinc-400 text-lg md:text-xl mb-10 max-w-2xl leading-relaxed">
                {t.analysis.heroSubtitle}
              </p>
            </>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="w-full relative group">
            <UnifiedSearchInput
              {...register('query')}
              placeholder={t.analysis.placeholder}
              loading={loading}
              rightElement={
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-12 w-12 md:h-14 md:w-14 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white hover:scale-105 transition-all shadow-lg border border-zinc-800 dark:border-zinc-200 p-0 flex items-center justify-center"
                >
                  {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Search className="w-6 h-6" />}
                </Button>
              }
            />
          </form>
        </div>


        {loading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-6">
            <div className="w-12 h-12 border-4 border-zinc-800 border-t-white rounded-full animate-spin" />
            <div className="text-zinc-500 font-mono text-xs tracking-widest uppercase animate-pulse">{t.analysis.analyzingButton}</div>
          </div>
        )}

        {!loading && searchCandidates && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <h3 className="text-zinc-500 dark:text-zinc-400 text-sm font-medium uppercase tracking-wider mb-4 text-center md:text-left">{t.analysis.didYouMean}</h3>
            {searchCandidates.map((candidate) => (
              <div
                key={candidate.id || candidate.google_place_id || Math.random()}
                onClick={() => handleCandidateClick(candidate)}
                className="group flex items-center justify-between p-3 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 rounded-xl cursor-pointer transition-all hover:bg-zinc-50 dark:hover:bg-zinc-900"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 overflow-hidden relative">
                    {candidate.image ? (
                      <img src={candidate.image} alt={candidate.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-300"><MapPin size={24} /></div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-zinc-900 dark:text-white font-bold group-hover:text-zinc-700 dark:group-hover:text-zinc-200">{candidate.name}</h4>
                      {candidate.source === 'library' && (
                        <Badge variant="secondary" className="text-[10px] h-5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                          Library
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-zinc-500">{candidate.address}</p>
                  </div>
                </div>
                <Button size="icon" variant="ghost" className="text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white">
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            ))}
          </div>
        )}
        {!loading && result && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 items-stretch">

            <div className="lg:col-span-3 flex flex-col gap-4 mb-2 pb-6 border-b border-zinc-200 dark:border-zinc-800">

              <div className="flex justify-between items-start">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white leading-tight">
                  {result.place_info.name}
                </h1>
                <div className="flex items-center gap-2">
                  <InteractionToolbar
                    placeId={result.place_info.google_place_id || String(result.place_info.id || '0')}
                    initialLikeState={false}
                    initialDislikeState={false}
                    initialVisitedState={false}
                    initialSavedState={isBookmarked}
                    onUpdate={(updates) => {
                      if (updates.saved !== undefined) setIsBookmarked(updates.saved);
                    }}
                  />

                </div>
              </div>

              <div className="flex flex-wrap gap-2 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
                <Badge variant="outline" className="font-mono text-xs px-2 py-1 h-auto rounded border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/50">
                  RESTAURANT
                </Badge>
                <Badge variant="outline" className="font-mono text-xs px-2 py-1 h-auto rounded border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/50">
                  {result.ai_analysis.price_level || '$$$'}
                </Badge>
                <Badge variant="outline" className="font-mono text-xs px-2 py-1 h-auto rounded border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/50">
                  ★ {result.place_info.rating || '4.8'} ({result.ai_analysis.review_count || '120'})
                </Badge>
                <Badge variant="outline" className="font-mono text-xs px-2 py-1 h-auto rounded border-green-200 dark:border-green-900/30 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/10">
                  OPEN
                </Badge>
              </div>

              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20">
                  <div className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </div>
                  <span className="text-sm font-medium text-green-700 dark:text-green-400 tracking-wide">
                    {t.compare.categories.vibe.toUpperCase()}: <span className="font-bold">9.2</span>
                  </span>
                </div>
              </div>

            </div>

            {(result.place_info?.photos?.length > 0 || result.place_info?.imageUrl) && (
              <div className="lg:col-span-3 -mt-4 mb-2 pb-2">
                <Accordion type="single" collapsible className="w-full" defaultValue="photos">
                  <AccordionItem value="photos" className="border-none">
                    <AccordionTrigger className="py-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 font-mono text-xs uppercase tracking-wider hover:no-underline justify-start gap-2">
                      vibe shots ({result.place_info.photos?.length || 1})
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        {(result.place_info.photos?.length > 0 ? result.place_info.photos : [result.place_info.imageUrl]).map((photo: string, index: number) => (
                          <div key={index} className="group relative aspect-square overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 cursor-zoom-in">
                            <img
                              src={photo}
                              alt={`Vibe shot ${index + 1}`}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            )}

            <div className="lg:col-span-2 h-full">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm h-full flex flex-col">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
                  </div>
                  <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">{t.compare.verdict}</h3>
                </div>

                <div className="prose prose-invert max-w-none text-lg leading-relaxed text-zinc-600 dark:text-zinc-300 flex-1">
                  {result.ai_analysis.summary.verdict}
                </div>

                <div className="mt-8 flex flex-wrap gap-2">
                  {result.ai_analysis.tags.map((tag: string, i: number) => (
                    <Badge key={i} variant="secondary" className="px-3 py-1 bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 border border-transparent">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1 h-full">
              <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 h-full flex flex-col">
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-6">{t.compare.featureAnalysis || 'Environment'}</h3>
                <div className="space-y-4 flex-1">
                  <AttributeRow icon={Volume2} label={t.map.noise} value={result.ai_analysis.detailed_attributes.noise_level} />
                  <AttributeRow icon={Sun} label={t.map.light} value="Dim & Cozy" />
                  <AttributeRow icon={Wifi} label={t.map.wifi} value={result.ai_analysis.detailed_attributes.service_speed === 'Fast' ? 'High Speed' : 'Moderate'} />
                  <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-4" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-zinc-600 dark:text-zinc-500">{t.compare.categories.price}</span>
                    <span className="text-zinc-900 dark:text-white font-bold">{result.ai_analysis.price_level}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8">
                <div className="flex justify-between items-end mb-8">
                  <div>
                    <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">{t.map.ratingBreakdown}</h3>
                    <p className="text-zinc-500 text-sm">{t.compare.basedOn}</p>
                  </div>
                </div>

                <div className="md:hidden space-y-6">
                  {scores.map((item) => (
                    <div key={item.name}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{item.name}</span>
                        <span className="text-xs font-mono text-zinc-500">{item.score}/100</span>
                      </div>
                      <div className="h-3 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${item.score}%`, backgroundColor: item.fill }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="hidden md:block h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={scores} layout="vertical" margin={{ left: 0, right: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.1} stroke="#52525b" />
                      <XAxis type="number" domain={[0, 100]} hide />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={100}
                        tick={{ fontSize: 12, fontWeight: 500, fill: '#a1a1aa' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: 'transparent' }}
                        content={<CustomTooltip />}
                      />
                      <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={32} animationDuration={1000}>
                        {scores.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

          </div>
        )}

        {!loading && !result && !searchCandidates && (
          <SkeletonAnalysis />
        )}

      </div>
    </div>
  );
}

const AttributeRow = ({ icon: Icon, label, value }: any) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center">
        <Icon className="w-4 h-4 text-zinc-400" />
      </div>
      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</span>
    </div>
    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{value || 'N/A'}</span>
  </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl shadow-xl">
        <p className="text-sm font-bold text-zinc-900 dark:text-white mb-1">{label}</p>
        <p className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
          Score: <span className="font-bold text-zinc-900 dark:text-zinc-100">{payload[0].value}</span>/100
        </p>
      </div>
    );
  }
  return null;
};