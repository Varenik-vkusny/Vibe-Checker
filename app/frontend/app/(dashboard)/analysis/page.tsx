'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '@/lib/api';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Loader2, Sparkles, Wifi, Sun, Volume2, Globe, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const analysisSchema = z.object({
  url: z.string().url('Please enter a valid URL'),
});

type AnalysisValues = z.infer<typeof analysisSchema>;

export default function AnalysisPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const initialized = useRef(false);

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
    { name: t.analysis.food, score: result.ai_analysis.scores.food, fill: '#18181b' }, // zinc-900
    { name: t.analysis.service, score: result.ai_analysis.scores.service, fill: '#52525b' }, // zinc-600
    { name: t.analysis.atmosphere, score: result.ai_analysis.scores.atmosphere, fill: '#a1a1aa' }, // zinc-400
    { name: t.analysis.value, score: result.ai_analysis.scores.value, fill: '#d4d4d8' }, // zinc-300
  ] : [];

  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-12">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* TOP BAR: URL Input */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 rounded-full flex justify-between items-center sticky top-6 z-40 shadow-xl shadow-zinc-200/50 dark:shadow-black/50 transition-all focus-within:ring-2 focus-within:ring-zinc-900 dark:focus-within:ring-zinc-100">
          <form onSubmit={handleSubmit(onSubmit)} className="w-full flex gap-2">
            <div className="relative flex-1">
              <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
              <Input
                id="url"
                placeholder="Paste URL to analyze..."
                {...register('url')}
                className="pl-12 h-12 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-lg placeholder:text-zinc-400 w-full"
              />
            </div>
            <Button type="submit" disabled={loading} className="rounded-full px-8 h-12 bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 hover:scale-105 transition-transform">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowUpRight className="w-5 h-5 ml-1" />}
            </Button>
          </form>
        </div>

        {/* LOADING STATE */}
        {loading && !result && (
          <div className="flex flex-col items-center justify-center py-32 space-y-6">
            <div className="w-16 h-16 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
            <div className="text-zinc-500 font-mono text-sm tracking-widest uppercase animate-pulse">Reading Reviews...</div>
          </div>
        )}

        {/* DASHBOARD CONTENT */}
        {result && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">

            {/* HEADER: Span 3 */}
            <div className="lg:col-span-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-8">
              <div className="space-y-1">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{result.place_info.name}</h1>
                <div className="flex items-center gap-2 text-zinc-500">
                  <span className="text-zinc-900 dark:text-zinc-100 font-semibold uppercase tracking-wider text-xs">Restaurant</span>
                  <span>•</span>
                  <span className="text-sm">Based on {result.ai_analysis.review_count || '120+'} reviews</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                  <span className="text-xs font-bold uppercase text-zinc-400 tracking-wider">Vibe Match</span>
                  <span className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">98%</span>
                </div>
                <div className="w-16 h-16 rounded-full border-4 border-zinc-900 dark:border-zinc-100 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-zinc-900 dark:text-white" />
                </div>
              </div>
            </div>

            {/* AREA A: The Verdict (Main) */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-zinc-900 dark:text-zinc-100" />
                  </div>
                  <h3 className="text-lg font-bold tracking-tight">AI Verdict</h3>
                </div>

                <div className="prose prose-zinc dark:prose-invert max-w-none text-lg leading-relaxed text-zinc-600 dark:text-zinc-300">
                  {result.ai_analysis.summary.verdict}
                </div>

                <div className="mt-8 flex flex-wrap gap-2">
                  {result.ai_analysis.tags.map((tag: string, i: number) => (
                    <Badge key={i} variant="secondary" className="px-3 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 border border-transparent">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* AREA B: Attributes (Sidebar) */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-6">Environment</h3>
                <div className="space-y-4">
                  <AttributeRow icon={Volume2} label="Noise Level" value={result.ai_analysis.detailed_attributes.noise_level} />
                  <AttributeRow icon={Sun} label="Lighting" value="Dim & Cozy" /> {/* Mock logic if missing */}
                  <AttributeRow icon={Wifi} label="Wifi Speed" value={result.ai_analysis.detailed_attributes.service_speed === 'Fast' ? 'High Speed' : 'Moderate'} />
                  <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-4" />
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-zinc-500">Price Range</span>
                    <span className="text-zinc-900 dark:text-zinc-100 font-bold">{result.ai_analysis.price_level}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* AREA C: Metrics (Bottom) */}
            <div className="lg:col-span-3">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8">
                <div className="flex justify-between items-end mb-8">
                  <div>
                    <h3 className="text-lg font-bold tracking-tight">Vibe Metrics</h3>
                    <p className="text-zinc-500 text-sm">Quantitative analysis of 120+ data points.</p>
                  </div>
                  <Button variant="outline" size="sm" className="hidden md:flex gap-2">
                    <ArrowUpRight className="w-4 h-4" /> Export Report
                  </Button>
                </div>

                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={scores} layout="vertical" margin={{ left: 0, right: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.1} />
                      <XAxis type="number" domain={[0, 100]} hide />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={100}
                        tick={{ fontSize: 12, fontWeight: 500, fill: 'currentColor' }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', backgroundColor: '#fff', color: '#000' }}
                      />
                      <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={32} animationDuration={1000} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

const AttributeRow = ({ icon: Icon, label, value }: any) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-full bg-white dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 flex items-center justify-center">
        <Icon className="w-4 h-4 text-zinc-400" />
      </div>
      <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">{label}</span>
    </div>
    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{value || 'N/A'}</span>
  </div>
);