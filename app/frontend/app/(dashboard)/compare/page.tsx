'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';
import { Trophy, Check, Loader2, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

const compareSchema = z.object({
  url_a: z.string().url('Please enter a valid URL'),
  url_b: z.string().url('Please enter a valid URL'),
});

type CompareValues = z.infer<typeof compareSchema>;

export default function ComparePage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();
  const searchParams = useSearchParams();

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<CompareValues>({
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
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: CompareValues) => {
    await performComparison(data.url_a, data.url_b);
  };

  // --- АВТО-ЗАПУСК ---
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
    <div className="container mx-auto p-6 space-y-8 max-w-6xl">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{t.compare.title}</h1>
        <p className="text-muted-foreground">{t.compare.subtitle}</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 md:grid-cols-[1fr_auto_1fr_auto] items-end">
            <div className="space-y-2">
              <Label htmlFor="url_a">{t.compare.placeALabel}</Label>
              <Input id="url_a" placeholder={t.compare.placeAPlaceholder} {...register('url_a')} />
              {errors.url_a && <span className="text-destructive text-xs">{errors.url_a.message}</span>}
            </div>
            
            <div className="hidden md:flex pb-3 text-muted-foreground">
                <span className="font-bold text-lg">VS</span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="url_b">{t.compare.placeBLabel}</Label>
              <Input id="url_b" placeholder={t.compare.placeBPlaceholder} {...register('url_b')} />
              {errors.url_b && <span className="text-destructive text-xs">{errors.url_b.message}</span>}
            </div>

            <Button type="submit" disabled={loading} className="w-full md:w-auto">
              {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t.compare.comparingButton}
                  </>
              ) : t.compare.compareButton}
            </Button>
          </form>
        </CardContent>
      </Card>

      {loading && !result && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <p className="text-muted-foreground text-lg animate-pulse">Analyzing both places...</p>
          </div>
      )}

      {result && (
        <div className="grid gap-6 md:grid-cols-2 animate-in fade-in zoom-in duration-500">
          
          {/* Winner Banner */}
          <div className="md:col-span-2 bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-yellow-500/10 border border-yellow-500/30 rounded-2xl p-8 text-center shadow-lg">
            <h2 className="text-3xl font-bold mb-3 flex items-center justify-center gap-3 text-foreground">
                <Trophy className="h-8 w-8 text-yellow-500 drop-shadow-sm" />
                {t.compare.winner}: <span className="text-yellow-600 dark:text-yellow-400">{result.comparison.verdict}</span>
            </h2>
            <p className="text-muted-foreground">{t.compare.winnerSubtitle}</p>
          </div>

          {/* Place A Card */}
          <Card className="border-blue-500/30 relative overflow-hidden shadow-md">
             <div className="absolute top-0 left-0 w-full h-1.5 bg-blue-500" />
             <CardHeader>
                <CardTitle className="text-xl text-blue-600 dark:text-blue-400">{result.place_a.name}</CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
                <ul className="space-y-3">
                    {result.comparison.place_a_unique_pros.map((pro: string, i: number) => (
                        <li key={i} className="flex gap-3 text-sm items-start">
                            <Check className="h-5 w-5 text-blue-500 shrink-0 bg-blue-500/10 rounded-full p-0.5" />
                            <span>{pro}</span>
                        </li>
                    ))}
                </ul>
             </CardContent>
          </Card>

          {/* Place B Card */}
          <Card className="border-purple-500/30 relative overflow-hidden shadow-md">
             <div className="absolute top-0 left-0 w-full h-1.5 bg-purple-500" />
             <CardHeader>
                <CardTitle className="text-xl text-purple-600 dark:text-purple-400">{result.place_b.name}</CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
                <ul className="space-y-3">
                    {result.comparison.place_b_unique_pros.map((pro: string, i: number) => (
                        <li key={i} className="flex gap-3 text-sm items-start">
                            <Check className="h-5 w-5 text-purple-500 shrink-0 bg-purple-500/10 rounded-full p-0.5" />
                            <span>{pro}</span>
                        </li>
                    ))}
                </ul>
             </CardContent>
          </Card>

          {/* Head to Head Table */}
          <Card className="md:col-span-2">
            <CardHeader>
                <CardTitle>{t.compare.headToHead}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    {['food', 'service', 'atmosphere', 'value'].map((cat) => (
                        <div key={cat} className="p-4 bg-secondary/50 rounded-xl border border-border/50">
                            <div className="text-xs text-muted-foreground uppercase tracking-widest mb-2 font-semibold">
                                {t.analysis[cat as keyof typeof t.analysis]}
                            </div>
                            <div className="font-bold text-lg text-primary">
                                {result.comparison.winner_category[cat]}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}