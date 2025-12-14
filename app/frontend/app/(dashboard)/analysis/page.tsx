'use client';

import { useState, useEffect, useRef } from 'react'; // useRef
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '@/lib/api';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge'; // Добавил Badge

const analysisSchema = z.object({
  url: z.string().url('Please enter a valid URL'),
});

type AnalysisValues = z.infer<typeof analysisSchema>;

export default function AnalysisPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const initialized = useRef(false); // Защита от двойного вызова

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<AnalysisValues>({
    resolver: zodResolver(analysisSchema),
  });

  const performAnalysis = async (url: string) => {
    setLoading(true);
    try {
      const response = await api.post('/place/analyze', {
        url: url,
        limit: 10
      });
      setResult(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: AnalysisValues) => {
    await performAnalysis(data.url);
  };

  useEffect(() => {
    const urlParam = searchParams.get('url');
    if (urlParam && !initialized.current) {
      initialized.current = true; 
      setValue('url', urlParam);
      performAnalysis(urlParam);
    }
  }, [searchParams, setValue]);

  const scores = result ? [
    { name: t.analysis.food, score: result.ai_analysis.scores.food, fill: 'var(--chart-1)' },
    { name: t.analysis.service, score: result.ai_analysis.scores.service, fill: 'var(--chart-2)' },
    { name: t.analysis.atmosphere, score: result.ai_analysis.scores.atmosphere, fill: 'var(--chart-3)' },
    { name: t.analysis.value, score: result.ai_analysis.scores.value, fill: 'var(--chart-4)' },
  ] : [];

  return (
    <div className="container mx-auto p-6 space-y-8 max-w-4xl">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{t.analysis.title}</h1>
        <p className="text-muted-foreground">{t.analysis.subtitle}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t.analysis.cardTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex gap-4 items-end">
            <div className="grid w-full gap-2">
              <Label htmlFor="url">{t.analysis.urlLabel}</Label>
              <Input id="url" placeholder="https://maps.google.com/..." {...register('url')} />
              {errors.url && <span className="text-destructive text-xs">{errors.url.message}</span>}
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t.analysis.analyzingButton}
                </>
              ) : t.analysis.analyzeButton}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* ЛОАДЕР (Показываем, пока грузится) */}
      {loading && !result && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <p className="text-muted-foreground text-lg animate-pulse">Scanning reviews & vibe...</p>
          </div>
      )}

      {result && (
        <div className="grid gap-6 md:grid-cols-2 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="md:col-span-2 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-2xl text-primary">{result.place_info.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-lg font-medium leading-relaxed">{result.ai_analysis.summary.verdict}</div>
              <div className="flex gap-2 flex-wrap">
                {result.ai_analysis.tags.map((tag: string, i: number) => (
                  <Badge key={i} variant="secondary" className="px-3 py-1 text-sm">#{tag}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.analysis.scoresTitle}</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scores} layout="vertical" margin={{ left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.2} />
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                  <Tooltip 
                    cursor={{fill: 'transparent'}} 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.analysis.detailsTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                 <div>
                   <span className="text-muted-foreground text-xs uppercase tracking-wider">{t.analysis.noiseLevel}</span>
                   <div className="font-medium mt-1">{result.ai_analysis.detailed_attributes.noise_level || 'N/A'}</div>
                 </div>
                 <div>
                   <span className="text-muted-foreground text-xs uppercase tracking-wider">{t.analysis.serviceSpeed}</span>
                   <div className="font-medium mt-1">{result.ai_analysis.detailed_attributes.service_speed || 'N/A'}</div>
                 </div>
                 <div>
                   <span className="text-muted-foreground text-xs uppercase tracking-wider">{t.analysis.cleanliness}</span>
                   <div className="font-medium mt-1">{result.ai_analysis.detailed_attributes.cleanliness || 'N/A'}</div>
                 </div>
                 <div>
                   <span className="text-muted-foreground text-xs uppercase tracking-wider">{t.analysis.price}</span>
                   <div className="font-medium mt-1 text-green-600">{result.ai_analysis.price_level}</div>
                 </div>
               </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}