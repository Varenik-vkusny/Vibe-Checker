import React from 'react';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { InteractionToolbar } from '@/components/map/InteractionToolbar';

interface Place {
    id?: string | number;
    google_place_id?: string;
    name: string;
    rating?: number;
    google_rating?: number;
    user_ratings_total?: number;
    reviews_count?: number;
    price_level?: number;
}

interface ComparisonHeaderProps {
    placeA: Place;
    placeB: Place;
}

export const ComparisonHeader: React.FC<ComparisonHeaderProps> = ({ placeA, placeB }) => {
    const getPlaceLink = (place: Place) => {
        const id = place.google_place_id || place.id;
        const url = id && String(id).includes('0x')
            ? `https://www.google.com/maps/search/?api=1&query=Google&query_place_id=${id}`
            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name)}`;

        return `/analysis?url=${encodeURIComponent(url)}`;
    };

    return (
        <div className="relative flex items-center justify-between gap-4 py-5 px-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden min-h-[140px]">
            {/* Background Decorative Element */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-transparent to-violet-500/5 pointer-events-none" />

            {/* Place A */}
            <div className="flex-1 flex flex-col items-start gap-3 z-10 overflow-hidden">
                <div className="flex items-center gap-2 max-w-full">
                    <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-zinc-900 dark:text-white truncate">
                        {placeA.name}
                    </h2>
                </div>

                <div className="flex items-center gap-2">
                    <InteractionToolbar placeId={String(placeA.id || placeA.google_place_id)} />
                    <Link href={getPlaceLink(placeA)}>
                        <Button variant="outline" size="sm" className="h-9 rounded-full px-4 text-[10px] font-bold uppercase tracking-widest border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-950/30">
                            Full Analysis
                        </Button>
                    </Link>
                </div>

                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    <span>{placeA.google_rating || placeA.rating} ★</span>
                    <span className="opacity-30">•</span>
                    <span>{placeA.reviews_count || placeA.user_ratings_total || 0} reviews</span>
                </div>
            </div>

            {/* VS Badge */}
            <div className="shrink-0 relative z-20 flex flex-col items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center border-4 border-white dark:border-zinc-900 shadow-xl group">
                    <span className="font-black text-white dark:text-zinc-900 text-base italic group-hover:scale-110 transition-transform">VS</span>
                </div>
            </div>

            {/* Place B */}
            <div className="flex-1 flex flex-col items-end gap-3 z-10 text-right overflow-hidden">
                <div className="flex items-center gap-2 flex-row-reverse max-w-full">
                    <h2 className="text-2xl md:text-3xl font-black tracking-tighter text-zinc-900 dark:text-white truncate">
                        {placeB.name}
                    </h2>
                </div>

                <div className="flex items-center gap-2 flex-row-reverse">
                    <InteractionToolbar placeId={String(placeB.id || placeB.google_place_id)} />
                    <Link href={getPlaceLink(placeB)}>
                        <Button variant="outline" size="sm" className="h-9 rounded-full px-4 text-[10px] font-bold uppercase tracking-widest border-violet-200 text-violet-700 hover:bg-violet-50 dark:border-violet-800 dark:text-violet-400 dark:hover:bg-violet-950/30">
                            Full Analysis
                        </Button>
                    </Link>
                </div>

                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full">
                    <span>{placeB.reviews_count || placeB.user_ratings_total || 0} reviews</span>
                    <span className="opacity-30">•</span>
                    <span>{placeB.google_rating || placeB.rating} ★</span>
                </div>
            </div>
        </div>
    );
};
