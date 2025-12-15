'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bookmark, MapPin, Sparkles, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n/LanguageContext';

// Mock Data for Vibe Cards
const MOCK_BOOKMARKS = [
    {
        id: 1,
        name: "Downtown Social",
        category: "Coffee Shop",
        image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=800",
        rating: 9.8,
        price: "$$",
        distance: "1.2km",
        tags: ["Cozy", "Wifi", "Laptop Friendly"],
        status: "visited"
    },
    {
        id: 2,
        name: "Neon Nights Arcade",
        category: "Entertainment",
        image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=800",
        rating: 9.4,
        price: "$$",
        distance: "3.5km",
        tags: ["Retro", "Loud", "Fun"],
        status: "to_go"
    },
    {
        id: 3,
        name: "The Green House",
        category: "Restaurant",
        image: "https://images.unsplash.com/photo-1514362545857-3bc16549766b?q=80&w=800",
        rating: 8.9,
        price: "$$$",
        distance: "0.8km",
        tags: ["Organic", "Quiet", "Date Night"],
        status: "visited"
    },
    {
        id: 4,
        name: "Skyline Lounge",
        category: "Bar",
        image: "https://images.unsplash.com/photo-1514362545857-3bc16549766b?q=80&w=800", // Fallback image reuse
        rating: 9.2,
        price: "$$$$",
        distance: "5.0km",
        tags: ["View", "Cocktails", "Fancy"],
        status: "to_go"
    }
];

export default function BookmarksPage() {
    const { t } = useLanguage();
    const [filter, setFilter] = useState<'all' | 'visited' | 'to_go'>('all');

    // Filter Logic
    const filteredBookmarks = MOCK_BOOKMARKS.filter(item => {
        if (filter === 'all') return true;
        return item.status === filter;
    });

    return (
        <div className="min-h-screen bg-white dark:bg-zinc-950 pt-6 pb-40 px-6">
            <div className="max-w-5xl mx-auto space-y-8">

                {/* HEADER SECTION */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white tracking-tight">{t.bookmarks.title}</h1>
                        <p className="text-zinc-500 dark:text-zinc-400 text-sm md:text-base">{t.bookmarks.subtitle}</p>
                    </div>

                    {/* FILTER PILLS */}
                    <div className="flex items-center gap-2">
                        <FilterPill label={t.bookmarks.tabs.all} active={filter === 'all'} onClick={() => setFilter('all')} />
                        <FilterPill label={t.bookmarks.tabs.visited} active={filter === 'visited'} onClick={() => setFilter('visited')} />
                        <FilterPill label={t.bookmarks.tabs.wantToGo} active={filter === 'to_go'} onClick={() => setFilter('to_go')} />
                    </div>
                </div>

                {/* GRID CONTENT */}
                {filteredBookmarks.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {filteredBookmarks.map((place) => (
                            <VibeCard key={place.id} place={place} />
                        ))}
                    </div>
                ) : (
                    /* EMPTY STATE */
                    <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
                        <div className="w-24 h-24 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                            <Bookmark className="w-10 h-10 text-zinc-400 dark:text-zinc-700" />
                        </div>
                        <div className="space-y-2 max-w-sm">
                            <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{t.bookmarks.empty.title}</h3>
                            <p className="text-zinc-500 dark:text-zinc-400">{t.bookmarks.empty.description}</p>
                        </div>
                        <Button asChild className="rounded-full bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 font-bold">
                            <Link href="/map">
                                <MapPin className="w-4 h-4 mr-2" /> {t.bookmarks.empty.button}
                            </Link>
                        </Button>
                    </div>
                )}

            </div>
        </div>
    );
}

// --- SUBCOMPONENTS ---

const FilterPill = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
    <button
        onClick={onClick}
        className={cn(
            "px-4 py-1.5 rounded-full text-sm font-medium transition-all border",
            active
                ? "bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-black dark:border-white"
                : "bg-transparent text-zinc-500 border-zinc-200 hover:border-zinc-300 hover:text-zinc-900 dark:text-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-700 dark:hover:text-zinc-200"
        )}
    >
        {label}
    </button>
);

const VibeCard = ({ place }: { place: any }) => (
    <div className="group relative flex flex-col gap-3 min-w-0 cursor-pointer">
        {/* Image Container */}
        <div className="aspect-[4/3] rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 relative">
            <img
                src={place.image}
                alt={place.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* Rating Badge */}
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-black text-xs font-bold px-2 py-1 rounded-md shadow-lg">
                {place.rating}
            </div>
            {/* Status Indicator (Optional) */}
            {place.status === 'visited' && (
                <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-[10px] uppercase font-bold px-2 py-1 rounded-md flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-yellow-500" /> Visited
                </div>
            )}
        </div>

        {/* Content */}
        <div className="space-y-1">
            <div className="flex justify-between items-start">
                <h3 className="font-bold text-zinc-900 dark:text-white text-lg truncate pr-2 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">{place.name}</h3>
            </div>

            <div className="flex items-center text-sm text-zinc-500 font-medium list-none">
                <span>{place.price}</span>
                <span className="mx-1.5">•</span>
                <span>{place.distance}</span>
                <span className="mx-1.5">•</span>
                <span className="truncate">{place.category}</span>
            </div>

            <div className="flex flex-wrap gap-2 mt-2">
                {place.tags.map((tag: string, i: number) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium">
                        {tag}
                    </span>
                ))}
            </div>
        </div>
    </div>
);
