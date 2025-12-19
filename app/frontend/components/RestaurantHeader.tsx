'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { InteractionToolbar } from '@/components/map/InteractionToolbar';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Sparkles, DollarSign, Star, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RestaurantHeaderProps {
    name: string;
    priceLevel: string;
    rating: number;
    reviewCount: number;
    openState?: string;
    vibeScore: number;
    placeId: string | number;
    isBookmarked: boolean;
    onBookmarkToggle?: () => void;
}

export const RestaurantHeader: React.FC<RestaurantHeaderProps> = ({
    name,
    priceLevel,
    rating,
    reviewCount,
    openState,
    vibeScore,
    placeId,
    isBookmarked,
    onBookmarkToggle
}) => {
    const { t } = useLanguage();

    const isOpen = openState?.toLowerCase().includes('open') || openState?.toLowerCase().includes('открыто');
    const statusColor = isOpen ? 'bg-green-500' : 'bg-red-500';
    const statusText = isOpen ? 'OPEN' : 'CLOSED'; 

    const displayRating = rating || 0;
    const displayCount = reviewCount || 0;
    const displayPrice = priceLevel || '$$$';

    const priceColor = (priceLevel && priceLevel.length > 2) ? 'text-red-500' : (priceLevel && priceLevel.length > 1) ? 'text-yellow-500' : 'text-green-500';

    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const progress = Math.min(Math.max(vibeScore, 0), 100);
    const dashoffset = circumference - (progress / 100) * circumference;

    return (
        <div className="flex flex-col gap-4 mb-2 pb-6 border-b border-zinc-200 dark:border-zinc-800">
            {/* Header Row: Name & Toolbar */}
            <div className="flex justify-between items-start">
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white leading-tight">
                    {name}
                </h1>
                <div className="flex items-center gap-2">
                    <InteractionToolbar
                        placeId={String(placeId)}
                        initialSavedState={isBookmarked}
                        onUpdate={(updates) => {
                            if (updates.saved !== undefined && onBookmarkToggle) {
                                onBookmarkToggle();
                            }
                        }}
                    />
                </div>
            </div>

            {/* Meta Row: Badges */}
            <div className="flex flex-wrap gap-2 items-center">
                {/* Price Badge - Text Colored */}
                <div className={cn("font-mono text-xl font-bold px-2", priceColor)}>
                    {displayPrice}
                </div>

                {/* Rating Badge */}
                <Badge variant="outline" className="font-mono text-xs px-2 py-1 h-7 rounded border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/50 flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    {displayRating} ({displayCount})
                </Badge>

                {/* Open/Closed Status - Dynamic */}
                {openState ? (
                    <div className={cn(
                        "font-mono text-xs px-2.5 py-1 h-7 rounded-full border flex items-center gap-2",
                        isOpen
                            ? "border-green-200 dark:border-green-900/30 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/10"
                            : "border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/10"
                    )}>
                        <span className="relative flex h-2 w-2">
                            {isOpen && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
                            <span className={cn("relative inline-flex rounded-full h-2 w-2", statusColor)}></span>
                        </span>
                        {openState}
                    </div>
                ) : (
                    <Badge variant="outline" className="font-mono text-xs px-2 py-1 h-7 rounded border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900/50 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Check Open Times
                    </Badge>
                )}
            </div>

            {/* Vibe Score Row - Radial Indicator */}
            <div className="mt-4 flex items-center gap-4">
                <div className="relative w-[100px] h-[100px] flex items-center justify-center">
                    {/* Background Circle */}
                    <svg className="w-full h-full transform -rotate-90">
                        <circle
                            cx="50"
                            cy="50"
                            r={radius}
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            className="text-zinc-100 dark:text-zinc-800"
                        />
                        {/* Progress Circle */}
                        <circle
                            cx="50"
                            cy="50"
                            r={radius}
                            stroke="url(#vibeGradient)"
                            strokeWidth="8"
                            fill="transparent"
                            strokeDasharray={circumference}
                            strokeDashoffset={dashoffset}
                            strokeLinecap="round"
                            className="transition-all duration-1000 ease-out"
                        />
                        <defs>
                            <linearGradient id="vibeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#8B5CF6" />
                                <stop offset="100%" stopColor="#EC4899" />
                            </linearGradient>
                        </defs>
                    </svg>

                    {/* Score Text */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-pink-500">
                            {vibeScore}
                        </span>
                    </div>
                </div>

                <div className="flex flex-col">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-violet-500" />
                        AI Vibe Score
                    </h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-[200px]">
                        {t.analysis.vibeScoreDescription(displayCount)}
                    </p>
                </div>
            </div>
        </div>
    );
};
