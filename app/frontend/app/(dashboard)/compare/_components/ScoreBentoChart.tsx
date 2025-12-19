import React from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { cn } from '@/lib/utils';

interface ScoreBentoChartProps {
    scoresA: Record<string, number>;
    scoresB: Record<string, number>;
}

export const ScoreBentoChart: React.FC<ScoreBentoChartProps> = ({ scoresA, scoresB }) => {
    const { t } = useLanguage();
    const categories = ['food', 'service', 'atmosphere', 'value'];

    return (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm h-full flex flex-col justify-center">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-6 text-center">
                {t.analysis?.scoreComparison || 'Detailed Performance Analysis'}
            </h3>

            <div className="space-y-6">
                {categories.map((cat) => {
                    const scoreA = scoresA?.[cat] || 0;
                    const scoreB = scoresB?.[cat] || 0;

                    const colorA = scoreA >= scoreB ? "bg-emerald-500" : "bg-zinc-100 dark:bg-zinc-800";
                    const colorB = scoreB >= scoreA ? "bg-violet-500" : "bg-zinc-100 dark:bg-zinc-800";

                    return (
                        <div key={cat} className="group relative">
                            <div className="flex items-center gap-4">
                                {/* Left Score */}
                                <div className="w-10 text-right">
                                    <span className={cn("font-black text-sm tabular-nums transition-colors", scoreA > scoreB ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400")}>
                                        {scoreA}
                                    </span>
                                </div>

                                {/* Center Viz */}
                                <div className="flex-1 flex items-center gap-2 relative h-2 bg-zinc-50 dark:bg-zinc-950 rounded-full overflow-visible">
                                    {/* Left Bar (Right aligned) */}
                                    <div className="flex-1 h-full flex justify-end items-center">
                                        <div
                                            className={cn("h-full rounded-l-full transition-all duration-1000 ease-out", colorA)}
                                            style={{ width: `${scoreA}%` }}
                                        />
                                    </div>

                                    {/* Center Label (Floating above bar) */}
                                    <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-10 bg-white dark:bg-zinc-800 px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest text-zinc-500 border border-zinc-200 dark:border-zinc-700 shadow-sm whitespace-nowrap">
                                        {t.analysis?.scores?.[cat as keyof typeof t.analysis.scores] || cat}
                                    </div>

                                    {/* Right Bar (Left aligned) */}
                                    <div className="flex-1 h-full flex justify-start items-center">
                                        <div
                                            className={cn("h-full rounded-r-full transition-all duration-1000 ease-out", colorB)}
                                            style={{ width: `${scoreB}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Right Score */}
                                <div className="w-10 text-left">
                                    <span className={cn("font-black text-sm tabular-nums transition-colors", scoreB > scoreA ? "text-violet-600 dark:text-violet-400" : "text-zinc-400")}>
                                        {scoreB}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
