'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Mock Data
const analyses = [
    { id: 1, name: "Kultura Almaty", score: 9.2, tags: ["ELEGANT", "MINIMAL", "TECHNO"], time: "2 mins ago" },
    { id: 2, name: "Nedelka Press", score: 8.5, tags: ["COZY", "WARM", "BUSY"], time: "15 mins ago" },
    { id: 3, name: "Afisha", score: 7.8, tags: ["UPSCALE", "FINE-DINING"], time: "1 hour ago" },
    { id: 4, name: "Shuqee", score: 8.9, tags: ["HIPSTER", "COFFEE", "MODERN"], time: "2 hours ago" },
    { id: 5, name: "Cafeteria", score: 7.2, tags: ["CASUAL", "OUTDOOR"], time: "3 hours ago" },
];

export default function AnalysesPage() {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Recent Analyses</h1>
                <p className="text-zinc-500">Real-time feed of Vibe Engine outputs.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {analyses.map((item) => (
                    <Card key={item.id} className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-lg">{item.name}</CardTitle>
                                <Badge variant="outline" className="font-mono text-xs">{item.score}/10</Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2 mb-4">
                                {item.tags.map(tag => (
                                    <span key={tag} className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                            <div className="text-xs text-zinc-400">
                                Analyzed {item.time}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="text-center p-8 text-zinc-400 text-sm">
                Connect to a real data source to see live analyses.
            </div>
        </div>
    );
}
