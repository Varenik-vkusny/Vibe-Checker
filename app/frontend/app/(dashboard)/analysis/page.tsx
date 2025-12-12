'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '@/lib/api';
import { useLanguage } from '@/lib/i18n/LanguageContext';

const analysisSchema = z.object({
  url: z.string().url('Please enter a valid URL'),
});

type AnalysisValues = z.infer<typeof analysisSchema>;

export default function AnalysisPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();

  const { register, handleSubmit, formState: { errors } } = useForm<AnalysisValues>({
    resolver: zodResolver(analysisSchema),
  });

  const onSubmit = async (data: AnalysisValues) => {
    setLoading(true);
    try {
      const response = await api.post('/place/analyze', {
        url: data.url,
        limit: 10
      });
      setResult(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

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
              {loading ? t.analysis.analyzingButton : t.analysis.analyzeButton}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>{result.place_info.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-xl font-medium">{result.ai_analysis.summary.verdict}</div>
              <div className="flex gap-2 flex-wrap">
                {result.ai_analysis.tags.map((tag: string, i: number) => (
                  <span key={i} className="px-2 py-1 bg-secondary rounded text-xs font-mono">{tag}</span>
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
                <BarChart data={scores} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip 
                    cursor={{fill: 'transparent'}} 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-popover border rounded-lg p-2 shadow-sm text-sm">
                            <div className="font-medium mb-1">{payload[0].payload.name}</div>
                            <div className="text-muted-foreground">
                              Score: {payload[0].value} / 100
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.analysis.detailsTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <span className="text-muted-foreground text-sm">{t.analysis.noiseLevel}</span>
                   <div className="font-medium">{result.ai_analysis.detailed_attributes.noise_level || 'N/A'}</div>
                 </div>
                 <div>
                   <span className="text-muted-foreground text-sm">{t.analysis.serviceSpeed}</span>
                   <div className="font-medium">{result.ai_analysis.detailed_attributes.service_speed || 'N/A'}</div>
                 </div>
                 <div>
                   <span className="text-muted-foreground text-sm">{t.analysis.cleanliness}</span>
                   <div className="font-medium">{result.ai_analysis.detailed_attributes.cleanliness || 'N/A'}</div>
                 </div>
                 <div>
                   <span className="text-muted-foreground text-sm">{t.analysis.price}</span>
                   <div className="font-medium">{result.ai_analysis.price_level}</div>
                 </div>
               </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
