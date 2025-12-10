'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import api from '@/lib/api';
import { Trophy, Check } from 'lucide-react';

const compareSchema = z.object({
  url_a: z.string().url('Please enter a valid URL'),
  url_b: z.string().url('Please enter a valid URL'),
});

type CompareValues = z.infer<typeof compareSchema>;

export default function ComparePage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<CompareValues>({
    resolver: zodResolver(compareSchema),
  });

  const onSubmit = async (data: CompareValues) => {
    setLoading(true);
    try {
      const response = await api.post('/place/compare', {
        url_a: data.url_a,
        url_b: data.url_b,
        limit: 50
      });
      setResult(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8 max-w-5xl">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Compare Places</h1>
        <p className="text-muted-foreground">See which spot wins the vibe check.</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 md:grid-cols-[1fr_1fr_auto] items-end">
            <div className="space-y-2">
              <Label htmlFor="url_a">Place A URL</Label>
              <Input id="url_a" placeholder="First place..." {...register('url_a')} />
              {errors.url_a && <span className="text-destructive text-xs">{errors.url_a.message}</span>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="url_b">Place B URL</Label>
              <Input id="url_b" placeholder="Second place..." {...register('url_b')} />
              {errors.url_b && <span className="text-destructive text-xs">{errors.url_b.message}</span>}
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Comparing...' : 'Compare'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Winner Banner */}
          <div className="md:col-span-2 bg-primary/10 border border-primary/20 rounded-xl p-6 text-center">
            <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
                <Trophy className="h-6 w-6 text-yellow-500" />
                Winner: {result.comparison.verdict}
            </h2>
            <p className="text-muted-foreground">Based on reviews, atmosphere, and value.</p>
          </div>

          <Card className="border-primary/50 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-blue-500" />
             <CardHeader>
                <CardTitle>{result.place_a.name}</CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
                <ul className="space-y-2">
                    {result.comparison.place_a_unique_pros.map((pro: string, i: number) => (
                        <li key={i} className="flex gap-2 text-sm">
                            <Check className="h-4 w-4 text-green-500 shrink-0" />
                            {pro}
                        </li>
                    ))}
                </ul>
             </CardContent>
          </Card>

          <Card className="border-primary/50 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-purple-500" />
             <CardHeader>
                <CardTitle>{result.place_b.name}</CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
                <ul className="space-y-2">
                    {result.comparison.place_b_unique_pros.map((pro: string, i: number) => (
                        <li key={i} className="flex gap-2 text-sm">
                            <Check className="h-4 w-4 text-green-500 shrink-0" />
                            {pro}
                        </li>
                    ))}
                </ul>
             </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
                <CardTitle>Head-to-Head</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div className="p-4 bg-secondary rounded-lg">
                        <div className="text-xs text-muted-foreground mb-1">Food</div>
                        <div className="font-bold">{result.comparison.winner_category.food}</div>
                    </div>
                    <div className="p-4 bg-secondary rounded-lg">
                        <div className="text-xs text-muted-foreground mb-1">Service</div>
                        <div className="font-bold">{result.comparison.winner_category.service}</div>
                    </div>
                    <div className="p-4 bg-secondary rounded-lg">
                        <div className="text-xs text-muted-foreground mb-1">Atmosphere</div>
                        <div className="font-bold">{result.comparison.winner_category.atmosphere}</div>
                    </div>
                    <div className="p-4 bg-secondary rounded-lg">
                        <div className="text-xs text-muted-foreground mb-1">Value</div>
                        <div className="font-bold">{result.comparison.winner_category.value}</div>
                    </div>
                </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
