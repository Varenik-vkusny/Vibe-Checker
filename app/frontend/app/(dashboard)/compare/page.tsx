'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';
import { Check, Loader2, ArrowRight, Edit2, Trophy, Minus } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

import { UnifiedSearchInput } from '@/components/UnifiedSearchInput';
import { InteractionToolbar } from '@/components/map/InteractionToolbar';

const compareSchema = z.object({
  url_a: z.string().url('Please enter a valid URL'),
  url_b: z.string().url('Please enter a valid URL'),
});

type CompareValues = z.infer<typeof compareSchema>;

export default function ComparePage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showInputs, setShowInputs] = useState(true);
  const { t } = useLanguage();
  const searchParams = useSearchParams();

  const { register, handleSubmit, setValue, getValues, formState: { errors } } = useForm<CompareValues>({
    resolver: zodResolver(compareSchema),
  });

  const performComparison = async (urlA: string, urlB: string) => {
    setLoading(true);
    try {
      // In a real app, this would be a real API call.
      // Our mock returns the rich data structure we defined.
      const response = await api.post('/place/compare', {
        url_a: urlA,
        url_b: urlB,
        limit: 50
      });
      setResult(response.data);
      setShowInputs(false);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: CompareValues) => {
    await performComparison(data.url_a, data.url_b);
  };

  const toggleInputs = () => setShowInputs(!showInputs);

  useEffect(() => {
    const urlA = searchParams.get('url_a');
    const urlB = searchParams.get('url_b');

    if (urlA && urlB) {
      setValue('url_a', urlA);
      setValue('url_b', urlB);
      performComparison(urlA, urlB);
    }
  }, [searchParams, setValue]);

  // Helper to render dollar signs with color logic
  const renderPrice = (level: string, isCheaper: boolean) => (
    <span className={`font-mono font-bold text-lg ${isCheaper ? 'text-green-500' : 'text-zinc-400'}`}>
      {level}
    </span>
  );

  return (
    <div className={`container mx-auto p-6 max-w-5xl h-[calc(100vh-4rem)] overflow-hidden flex flex-col pb-32 ${!result ? 'justify-center' : ''}`}>

      {/* --- 1. COMPACT HEADER / INPUTS --- */}
      {showInputs ? (
        <div
          className="space-y-8 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700"
        >
          <div className="flex flex-col items-center text-center md:items-start md:text-left">
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-zinc-900 dark:text-white mb-6">
              {t.compare.heroTitle}
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-lg md:text-xl mb-4 max-w-2xl leading-relaxed">
              {t.compare.heroSubtitle}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col md:flex-row gap-6 items-center w-full justify-center">
            <div className="space-y-2 w-full relative group">
              <Label className="text-xs font-bold uppercase text-zinc-500 ml-2">{t.compare.inputPlaceholderA}</Label>
              <UnifiedSearchInput
                {...register('url_a')}
                placeholder={t.analysis.placeholder}
                className="pr-6"
              />
              {errors.url_a && <span className="absolute -bottom-6 left-2 text-red-500 text-xs font-medium">{errors.url_a.message}</span>}
            </div>

            <div className="flex shrink-0 justify-center pt-6 md:pt-6 relative z-10">
              <div className="w-12 h-12 rounded-full bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-600 shadow-md flex items-center justify-center font-black text-zinc-800 dark:text-zinc-100 text-sm italic">{t.compare.vs}</div>
            </div>

            <div className="space-y-2 w-full relative group">
              <Label className="text-xs font-bold uppercase text-zinc-500 ml-2">{t.compare.inputPlaceholderB}</Label>
              <UnifiedSearchInput
                {...register('url_b')}
                placeholder={t.analysis.placeholder}
                rightElement={
                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-12 w-12 md:h-14 md:w-14 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white hover:scale-105 transition-all shadow-lg border border-zinc-800 dark:border-zinc-200 p-0 flex items-center justify-center shrink-0"
                  >
                    {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <ArrowRight className="w-6 h-6" />}
                  </Button>
                }
              />
              {errors.url_b && <span className="absolute -bottom-6 left-2 text-red-500 text-xs font-medium">{errors.url_b.message}</span>}
            </div>

          </form>
        </div>
      ) : (
        <div
          className="flex items-center justify-center gap-4 mb-8 py-4 border-b border-zinc-100 dark:border-zinc-900 animate-in fade-in slide-in-from-bottom-4 duration-700"
        >
          <div className="flex items-center gap-3 text-sm font-medium text-zinc-500">
            <span className="text-zinc-900 dark:text-zinc-200 max-w-[120px] md:max-w-xs truncate">{result?.place_a?.name || getValues('url_a')}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800">VS</span>
            <span className="text-zinc-900 dark:text-zinc-200 max-w-[120px] md:max-w-xs truncate">{result?.place_b?.name || getValues('url_b')}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={toggleInputs} className="h-8 w-8 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full">
            <Edit2 className="w-3 h-3 text-zinc-400" />
          </Button>
        </div>
      )}


      {/* --- RESULTS VIEW --- */}
      {result && !loading && (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700">

          {/* --- 2. THE VERDICT CARD --- */}
          <div className="w-full bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 rounded-xl p-8 md:p-12 border border-zinc-200 dark:border-zinc-800 border-l-4 border-l-green-500 shadow-xl relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4 text-green-600 dark:text-green-500 font-mono text-sm tracking-wider uppercase">
                <Trophy className="w-4 h-4" />
                {t.compare.verdict}
              </div>
              <h2 className="text-3xl md:text-5xl font-bold mb-6 text-balance leading-tight text-zinc-900 dark:text-white">
                {result.comparison.verdict_text || `Better for ${result.comparison.verdict === result.place_a.name ? 'Overall Vibe' : 'Specific Needs'}`}
              </h2>
              <div className="inline-block px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-sm font-medium">
                {t.compare.winner}: <span className="font-bold text-green-600 dark:text-green-500 ml-1">{result.comparison.verdict}</span>
              </div>
            </div>
            {/* Background noise/texture */}
            <div className="absolute inset-0 opacity-40 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />
            <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-green-500/10 rounded-full blur-[80px]" />
          </div>

          {/* --- 3. TALE OF THE TAPE --- */}
          <div className="max-w-4xl mx-auto w-full px-2 md:px-0">
            <div className="grid grid-cols-[1fr_auto_1fr] gap-2 md:gap-8 mb-8 text-[10px] md:text-sm font-mono text-zinc-400 uppercase tracking-widest text-center border-b border-zinc-200 dark:border-zinc-800 pb-4">
              <div className="text-right truncate">
                <div className="text-lg font-bold mb-2">{result.place_a.name}</div>
                <div className="flex justify-end">
                  <div className="w-full max-w-[200px]">
                    <InteractionToolbar
                      placeId={String(result.place_a.place_id || '0')}
                      initialLikeState={result.place_a.userInteraction?.isLiked}
                      initialDislikeState={result.place_a.userInteraction?.isDisliked}
                      initialVisitedState={result.place_a.userInteraction?.isVisited}
                    />
                  </div>
                </div>
              </div>
              <div className="w-20 md:w-24 pt-1">Category</div>
              <div className="text-left truncate">
                <div className="text-lg font-bold mb-2">{result.place_b.name}</div>
                <div className="flex justify-start">
                  <div className="w-full max-w-[200px]">
                    <InteractionToolbar
                      placeId={String(result.place_b.place_id || '0')}
                      initialLikeState={result.place_b.userInteraction?.isLiked}
                      initialDislikeState={result.place_b.userInteraction?.isDisliked}
                      initialVisitedState={result.place_b.userInteraction?.isVisited}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              {['food', 'service', 'atmosphere', 'value'].map((cat) => {
                const scoreA = result.comparison.scores.place_a[cat];
                const scoreB = result.comparison.scores.place_b[cat];
                const total = scoreA + scoreB;
                const percentA = (scoreA / total) * 100;
                const percentB = (scoreB / total) * 100;
                const winner = scoreA > scoreB ? 'A' : 'B';

                return (
                  <div key={cat} className="grid grid-cols-[1fr_auto_1fr] gap-2 md:gap-8 items-center group">
                    {/* Place A Side */}
                    <div className="flex items-center justify-end gap-2 md:gap-3">
                      <span className={`font-mono font-bold text-sm md:text-lg ${winner === 'A' ? 'text-green-500' : 'text-zinc-500'}`}>{scoreA}</span>
                      <div className="h-1.5 md:h-2 flex-1 bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden flex justify-end max-w-[80px] md:max-w-[120px]">
                        <div
                          className={`h-full transition-all duration-1000 ease-out ${winner === 'A' ? 'bg-green-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                          style={{ width: `${percentA}%` }}
                        />
                      </div>
                    </div>

                    {/* Label */}
                    <div className="w-20 md:w-24 text-center text-[10px] md:text-xs font-bold uppercase text-zinc-500 truncate">{t.analysis.scores[cat as keyof typeof t.analysis.scores]}</div>

                    {/* Place B Side */}
                    <div className="flex items-center justify-start gap-2 md:gap-3">
                      <div className="h-1.5 md:h-2 flex-1 bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden max-w-[80px] md:max-w-[120px]">
                        <div
                          className={`h-full transition-all duration-1000 ease-out ${winner === 'B' ? 'bg-green-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                          style={{ width: `${percentB}%` }}
                        />
                      </div>
                      <span className={`font-mono font-bold text-sm md:text-lg ${winner === 'B' ? 'text-green-500' : 'text-zinc-500'}`}>{scoreB}</span>
                    </div>
                  </div>
                );
              })}

              {/* Price Comparison */}
              <div className="grid grid-cols-[1fr_auto_1fr] gap-4 md:gap-8 items-center pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <div className="text-right">
                  {renderPrice(result.place_a.price_level, result.place_a.price_level.length < result.place_b.price_level.length)}
                </div>
                <div className="w-24 text-center text-xs font-bold uppercase text-zinc-500">{t.compare.categories.price}</div>
                <div className="text-left">
                  {renderPrice(result.place_b.price_level, result.place_b.price_level.length < result.place_a.price_level.length)}
                </div>
              </div>
            </div>
          </div>

          {/* --- 4. UNIQUE SELLING POINTS --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-12">
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-8 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
              <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-6">{t.map.match} {result.place_a.name}</div>
              <ul className="space-y-3">
                {result.comparison.place_a_unique_pros.map((pro: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 text-zinc-700 dark:text-zinc-300">
                    <div className="mt-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 p-1">
                      <Check className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    {pro}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-xl p-8 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors">
              <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-6">{t.map.match} {result.place_b.name}</div>
              <ul className="space-y-3">
                {result.comparison.place_b_unique_pros.map((pro: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 text-zinc-700 dark:text-zinc-300">
                    <div className="mt-0.5 rounded-full bg-violet-50 dark:bg-violet-900/30 p-1">
                      <Check className="w-3 h-3 text-violet-600 dark:text-violet-400" />
                    </div>
                    {pro}
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}