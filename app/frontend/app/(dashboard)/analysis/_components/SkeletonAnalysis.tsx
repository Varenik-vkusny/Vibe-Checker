'use client';

import { ArrowUp } from 'lucide-react';

export const SkeletonAnalysis = () => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse opacity-50 pointer-events-none relative">

            <div className="absolute inset-0 z-10 flex flex-col items-center justify-start pt-20">
                <div className="bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm border border-zinc-200 dark:border-zinc-800 rounded-2xl px-6 py-4 shadow-xl flex items-center gap-3 animate-bounce">
                    <ArrowUp className="w-5 h-5 text-indigo-500" />
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">Paste a link above to unlock insights</span>
                </div>
            </div>

            <div className="lg:col-span-3 flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 pb-8">
                <div className="space-y-4">
                    <div className="h-10 w-64 bg-zinc-200 dark:bg-zinc-800 rounded-lg"></div>
                    <div className="h-4 w-48 bg-zinc-100 dark:bg-zinc-800/50 rounded"></div>
                </div>
                <div className="h-16 w-16 rounded-full bg-zinc-200 dark:bg-zinc-800"></div>
            </div>

            <div className="lg:col-span-2 space-y-6">
                <div className="bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 h-[300px]">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-800"></div>
                        <div className="h-6 w-32 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
                    </div>
                    <div className="space-y-3">
                        <div className="h-4 w-full bg-zinc-200 dark:bg-zinc-800 rounded"></div>
                        <div className="h-4 w-[90%] bg-zinc-200 dark:bg-zinc-800 rounded"></div>
                        <div className="h-4 w-[95%] bg-zinc-200 dark:bg-zinc-800 rounded"></div>
                        <div className="h-4 w-[80%] bg-zinc-200 dark:bg-zinc-800 rounded"></div>
                    </div>
                </div>
            </div>

            <div className="lg:col-span-1 space-y-6">
                <div className="bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 h-[300px]">
                    <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-800 rounded mb-6"></div>
                    <div className="space-y-6">
                        {[1, 2, 3].map((_, i) => (
                            <div key={i} className="flex justify-between items-center">
                                <div className="flex gap-3 items-center">
                                    <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800"></div>
                                    <div className="h-4 w-20 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
                                </div>
                                <div className="h-4 w-12 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="lg:col-span-3">
                <div className="bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 h-[300px]">
                    <div className="h-6 w-32 bg-zinc-200 dark:bg-zinc-800 rounded mb-8"></div>
                    <div className="space-y-4">
                        {[1, 2, 3, 4].map((_, i) => (
                            <div key={i} className="space-y-2">
                                <div className="flex justify-between">
                                    <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
                                    <div className="h-3 w-8 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
                                </div>
                                <div className="h-3 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

        </div>
    );
};
