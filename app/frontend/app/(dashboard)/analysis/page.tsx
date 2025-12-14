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
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '@/lib/api';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Loader2, Sparkles, Wifi, Sun, Volume2, Globe, ArrowUpRight, Search, Bookmark, ArrowRight, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SkeletonAnalysis } from "@/components/SkeletonAnalysis";
import { toast } from 'sonner'; // Assuming sonner is installed or will use simple alert/state if not.

// Relaxed Schema to allow Text Search
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

  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const initialized = useRef(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<AnalysisValues>({
    resolver: zodResolver(analysisSchema),
  });

  // --- API HANDLERS ---

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

    // Simulate API Search Delay
    setTimeout(() => {
      setSearchCandidates(MOCK_SEARCH_RESULTS);
      setLoading(false);
    }, 800);
  };

  const handleBookmark = () => {
    setIsBookmarked(true);
    // In a real app, this would call an API
    // toast.success("Saved to Library"); 
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

  // --- EFFECT: Handle URL Params ---
  useEffect(() => {
    const urlParam = searchParams.get('url');
    if (urlParam && !initialized.current) {
      initialized.current = true;
      setValue('query', urlParam);
      performAnalysis(urlParam);
    }
  }, [searchParams, setValue]);

  // derived state
  const isIdle = !loading && !result && !searchCandidates;

  const scores = result ? [
    { name: t.analysis.food, score: result.ai_analysis.scores.food, fill: '#e4e4e7' },
    { name: t.analysis.service, score: result.ai_analysis.scores.service, fill: '#a1a1aa' },
    { name: t.analysis.atmosphere, score: result.ai_analysis.scores.atmosphere, fill: '#71717a' },
    { name: t.analysis.value, score: result.ai_analysis.scores.value, fill: '#52525b' },
  ] : [];

  return (
    <div className={cn(
      "h-[calc(100vh-3.5rem)] bg-white dark:bg-zinc-950 text-foreground pt-20 pb-24 px-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]",
      (result || searchCandidates) ? "overflow-y-auto" : "overflow-hidden"
    )}>
      <div className={cn("w-full max-w-4xl mx-auto transition-all duration-500 ease-in-out", isIdle ? "space-y-12" : "space-y-6")}>

        {/* HERO SECTION */}
        <div className="flex flex-col items-center text-center md:items-start md:text-left animate-in fade-in slide-in-from-bottom-4 duration-700">
          {isIdle && (
            <>
              <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-zinc-900 dark:text-white mb-6">
                Check the Vibe.
              </h1>
              <p className="text-zinc-500 dark:text-zinc-400 text-lg md:text-xl mb-10 max-w-2xl leading-relaxed">
                Paste a Google Maps link (or just search "Coffee") to unlock AI insights, hidden gems, and crowd sentiment.
              </p>
            </>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="w-full relative group">
            <div className="relative">
              <Input
                id="query"
                placeholder="Paste URL or type 'Sushi'..."
                {...register('query')}
                className="pl-6 pr-20 h-16 md:h-20 bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950 text-lg md:text-xl placeholder:text-zinc-400 dark:placeholder:text-zinc-600 rounded-2xl shadow-2xl w-full transition-all"
                autoComplete="off"
              />
              <Button
                type="submit"
                disabled={loading}
                className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 h-12 w-12 md:h-14 md:w-14 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white hover:scale-105 transition-all shadow-lg border border-zinc-800 dark:border-zinc-200 p-0 flex items-center justify-center"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Search className="w-6 h-6" />}
              </Button>
            </div>
          </form>
        </div>

        {/* STATE HANDLING */}

        {/* 1. LOADING */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-6">
            <div className="w-12 h-12 border-4 border-zinc-800 border-t-white rounded-full animate-spin" />
            <div className="text-zinc-500 font-mono text-xs tracking-widest uppercase animate-pulse">Analyzing Vibe Data...</div>
          </div>
        )}

        {/* 2. SEARCH CANDIDATES (Discovery Mode) */}
        {!loading && searchCandidates && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <h3 className="text-zinc-500 dark:text-zinc-400 text-sm font-medium uppercase tracking-wider mb-4 text-center md:text-left">Did you mean...</h3>
            {searchCandidates.map((candidate) => (
              <div
                key={candidate.id}
                onClick={() => performAnalysis("https://goo.gl/maps/mockurl")} // Mock selection
                className="group flex items-center justify-between p-3 bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600 rounded-xl cursor-pointer transition-all hover:bg-zinc-50 dark:hover:bg-zinc-900"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <img src={candidate.image} alt={candidate.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="text-zinc-900 dark:text-white font-bold group-hover:text-zinc-700 dark:group-hover:text-zinc-200">{candidate.name}</h4>
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

        {/* 3. ANALYSIS RESULT (Result Mode) */}
        {!loading && result && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700 items-stretch">

            {/* HEADER: Technical Report Style */}
            <div className="lg:col-span-3 flex flex-col gap-4 mb-2 pb-6 border-b border-zinc-200 dark:border-zinc-800">

              {/* Row 1: Title & Action */}
              <div className="flex justify-between items-start">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white leading-tight">
                  {result.place_info.name}
                </h1>
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handleBookmark}
                  className={cn(
                    "h-10 w-10 shrink-0 rounded-full border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900",
                    isBookmarked
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-900 dark:border-zinc-100"
                      : "text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                  )}
                >
                  <Bookmark className={cn("w-5 h-5", isBookmarked && "fill-current")} />
                </Button>
              </div>

              {/* Row 2: Metadata Strip */}
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

              {/* Row 3: The Verdict Badge */}
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20">
                  <div className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </div>
                  <span className="text-sm font-medium text-green-700 dark:text-green-400 tracking-wide">
                    VIBE SCORE: <span className="font-bold">9.2</span>
                  </span>
                </div>
              </div>

            </div>

            {/* PHOTO GALLERY (Accordion) */}
            {result.photos && result.photos.length > 0 && (
              <div className="lg:col-span-3 -mt-4 mb-2 pb-2">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="photos" className="border-none">
                    <AccordionTrigger className="py-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 font-mono text-xs uppercase tracking-wider hover:no-underline justify-start gap-2">
                      vibe shots ({result.photos.length})
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                        {result.photos.map((photo: string, index: number) => (
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

            {/* AREA A: The Verdict (Main) */}
            <div className="lg:col-span-2 h-full">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm h-full flex flex-col">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
                  </div>
                  <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">AI Verdict</h3>
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

            {/* AREA B: Attributes (Sidebar) */}
            <div className="lg:col-span-1 h-full">
              <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 h-full flex flex-col">
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-6">Environment</h3>
                <div className="space-y-4 flex-1">
                  <AttributeRow icon={Volume2} label="Noise Level" value={result.ai_analysis.detailed_attributes.noise_level} />
                  <AttributeRow icon={Sun} label="Lighting" value="Dim & Cozy" />
                  <AttributeRow icon={Wifi} label="Wifi Speed" value={result.ai_analysis.detailed_attributes.service_speed === 'Fast' ? 'High Speed' : 'Moderate'} />
                  <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-4" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-zinc-600 dark:text-zinc-500">Price Range</span>
                    <span className="text-zinc-900 dark:text-white font-bold">{result.ai_analysis.price_level}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* AREA C: Metrics (Bottom) */}
            <div className="lg:col-span-3">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8">
                <div className="flex justify-between items-end mb-8">
                  <div>
                    <h3 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">Vibe Metrics</h3>
                    <p className="text-zinc-500 text-sm">Quantitative analysis of 120+ data points.</p>
                  </div>
                  <Button variant="outline" size="sm" className="hidden md:flex gap-2 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800">
                    <ArrowUpRight className="w-4 h-4" /> Export Report
                  </Button>
                </div>

                {/* MOBILE: Label-on-Top Stack */}
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

                {/* DESKTOP: Recharts */}
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
                      <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={32} animationDuration={1000} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* 4. SKELETON (Idle Mode) */}
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