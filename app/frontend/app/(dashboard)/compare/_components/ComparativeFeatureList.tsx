import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ComparativeFeatureListProps {
    featuresA: string[];
    featuresB: string[];
    nameA?: string;
    nameB?: string;
}

export const ComparativeFeatureList: React.FC<ComparativeFeatureListProps> = ({ featuresA, featuresB, nameA, nameB }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full min-h-0">
            {/* List A */}
            <div className="bg-white dark:bg-zinc-900/50 rounded-xl p-3 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col min-h-0 max-h-[220px]">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-2 truncate">
                    {nameA || 'Place A'}
                </h3>
                <ul className="space-y-2 overflow-y-auto pr-1 custom-scrollbar">
                    {featuresA.length > 0 ? featuresA.map((feat, i) => (
                        <li key={i} className="flex items-start gap-2 text-[11px] leading-tight">
                            <Check className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                            <span className="text-zinc-600 dark:text-zinc-300">{feat}</span>
                        </li>
                    )) : (
                        <li className="text-zinc-400 italic text-[11px]">No specific pros listed</li>
                    )}
                </ul>
            </div>

            {/* List B */}
            <div className="bg-white dark:bg-zinc-900/50 rounded-xl p-3 border border-zinc-200 dark:border-zinc-800 shadow-sm flex flex-col min-h-0 max-h-[220px]">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400 mb-2 truncate">
                    {nameB || 'Place B'}
                </h3>
                <ul className="space-y-2 overflow-y-auto pr-1 custom-scrollbar">
                    {featuresB.length > 0 ? featuresB.map((feat, i) => (
                        <li key={i} className="flex items-start gap-2 text-[11px] leading-tight">
                            <Check className="w-3 h-3 text-violet-500 mt-0.5 shrink-0" />
                            <span className="text-zinc-600 dark:text-zinc-300">{feat}</span>
                        </li>
                    )) : (
                        <li className="text-zinc-400 italic text-[11px]">No specific pros listed</li>
                    )}
                </ul>
            </div>
        </div>
    );
};
