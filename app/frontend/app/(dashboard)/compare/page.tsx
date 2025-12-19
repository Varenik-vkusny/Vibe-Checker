'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';
import { Loader2, ArrowRight, Edit2 } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { UnifiedSearchInput } from '@/components/UnifiedSearchInput';
import { cn } from '@/lib/utils';

import { ComparisonHeader } from './_components/ComparisonHeader';
import { VerdictCard } from './_components/VerdictCard';
import { ScoreBentoChart } from './_components/ScoreBentoChart';
import { ComparativeFeatureList } from './_components/ComparativeFeatureList';

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

  return (
    <div className={cn(
      "container mx-auto px-4 md:px-8 max-w-7xl transition-all duration-700 relative",
      !result ? 'h-[calc(100vh-3.5rem)] overflow-y-auto flex flex-col justify-center' : 'pt-6 h-[calc(100vh-3.5rem)] overflow-y-auto custom-scrollbar scroll-smooth'
    )}>

      {showInputs ? (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 w-full max-w-4xl mx-auto">
          <div className="flex flex-col items-center text-center">
            <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-zinc-900 dark:text-white mb-6 uppercase">
              {t.compare.faceOff}
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-lg md:text-2xl mb-4 max-w-2xl leading-relaxed font-light">
              {t.compare.heroSubtitle}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col md:flex-row gap-8 items-center w-full justify-center">
            <div className="space-y-2 w-full relative group">
              <Label className="text-xs font-bold uppercase text-zinc-500 ml-2 tracking-widest">{t.compare.inputPlaceholderA}</Label>
              <UnifiedSearchInput
                {...register('url_a')}
                placeholder="https://maps.google.com/..."
                className="pr-6 h-14 text-lg"
              />
              {errors.url_a && <span className="absolute -bottom-6 left-2 text-red-500 text-xs font-medium">{errors.url_a.message}</span>}
            </div>

            <div className="flex shrink-0 justify-center pt-6 relative z-10">
              <div className="w-16 h-16 rounded-full bg-zinc-900 dark:bg-zinc-100 shadow-xl flex items-center justify-center border-4 border-white dark:border-zinc-900">
                <span className="font-black text-white dark:text-zinc-900 text-xl italic">{t.compare.vs}</span>
              </div>
            </div>

            <div className="space-y-2 w-full relative group">
              <Label className="text-xs font-bold uppercase text-zinc-500 ml-2 tracking-widest">{t.compare.inputPlaceholderB}</Label>
              <UnifiedSearchInput
                {...register('url_b')}
                placeholder="https://maps.google.com/..."
                rightElement={
                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-12 w-12 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white hover:scale-110 transition-all shadow-lg p-0 flex items-center justify-center shrink-0"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                  </Button>
                }
              />
              {errors.url_b && <span className="absolute -bottom-6 left-2 text-red-500 text-xs font-medium">{errors.url_b.message}</span>}
            </div>
          </form>
        </div>
      ) : (
        <div className="flex flex-col animate-in fade-in zoom-in-95 duration-500 pb-12">
          {/* Edit Toolbar */}
          <div className="flex justify-between items-center mb-10">
            <div className="flex flex-col">
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400 mb-1">Combat Records</h2>
              <div className="h-1 w-12 bg-zinc-900 dark:bg-zinc-100 rounded-full" />
            </div>
            <Button variant="outline" size="sm" onClick={toggleInputs} className="h-9 rounded-full px-6 text-[10px] font-bold uppercase tracking-widest border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all shadow-sm">
              <Edit2 className="w-3.5 h-3.5 mr-2" />
              New Comparison
            </Button>
          </div>

          {result && !loading && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

              {/* Top Row: Full Width Header */}
              <div className="lg:col-span-4 animate-in slide-in-from-top-4 duration-500">
                <ComparisonHeader placeA={result.place_a} placeB={result.place_b} />
              </div>

              {/* Second Row: Full Width Verdict (Verdict Card) */}
              <div className="lg:col-span-4 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-100">
                <VerdictCard
                  verdictText={result.comparison.verdict}
                />
              </div>

              {/* Third Row: Metrics (Full Width bi-directional chart) */}
              <div className="lg:col-span-4 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-200">
                <ScoreBentoChart
                  scoresA={result.comparison.scores?.place_a}
                  scoresB={result.comparison.scores?.place_b}
                />
              </div>

              {/* Fourth Row: Features (Full Width side-by-side lists) */}
              <div className="lg:col-span-4 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300">
                <ComparativeFeatureList
                  featuresA={result.comparison.place_a_unique_pros}
                  featuresB={result.comparison.place_b_unique_pros}
                  nameA={result.place_a.name}
                  nameB={result.place_b.name}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
