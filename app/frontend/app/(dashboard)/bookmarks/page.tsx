'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bookmark, MapPin, Sparkles, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { favoritesService, VibeCardProps } from '@/services/favorites';

export default function BookmarksPage() {
    const { t } = useLanguage();
    const [filter, setFilter] = useState<'all' | 'visited' | 'to_go'>('all');
    const [bookmarks, setBookmarks] = useState<VibeCardProps[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBookmarks = async () => {
            try {
                const data = await favoritesService.getFavorites();
                setBookmarks(data);
            } catch (error) {
                console.error("Failed to fetch bookmarks", error);
            } finally {
                setLoading(false);
            }
        };
        fetchBookmarks();
    }, []);

    const filteredBookmarks = bookmarks.filter(item => {
        if (filter === 'all') return true;
        return item.status === filter;
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-white dark:bg-zinc-950 pt-6 pb-40 px-6 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
            </div>
        );
    }

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
                            <VibeCard
                                key={place.id}
                                place={place}
                                onDelete={() => {
                                    setBookmarks(prev => prev.filter(b => b.id !== place.id));
                                }}
                            />
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
                            <Link href="/pro_mode">
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

const VibeCard = ({ place, onDelete }: { place: VibeCardProps, onDelete: () => void }) => {
    return (
        <div className="group relative flex flex-col gap-3 min-w-0 cursor-pointer">
            {/* Image Container */}
            <div className="aspect-[4/3] rounded-xl overflow-hidden bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 relative">
                <img
                    src={place.image || "https://images.unsplash.com/photo-1514362545857-3bc16549766b?q=80&w=800"} // Fallback image
                    alt={place.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {/* Rating Badge */}
                {place.rating && (
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-black text-xs font-bold px-2 py-1 rounded-md shadow-lg">
                        {place.rating.toFixed(1)}
                    </div>
                )}
                {/* Status Indicator */}
                {place.status === 'visited' && (
                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-[10px] uppercase font-bold px-2 py-1 rounded-md flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-yellow-500" /> Visited
                    </div>
                )}

                {/* DELETE BUTTON (TRASH) */}
                <button
                    onClick={async (e) => {
                        e.stopPropagation();
                        // Call backend
                        try {
                            await favoritesService.toggleFavorite(place.id); // Toggle removes it if it's there
                            onDelete();
                            // Optional: toast
                        } catch (err) {
                            console.error(err);
                        }
                    }}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 hover:bg-red-50 text-zinc-500 hover:text-red-500 p-2 rounded-full shadow-sm z-10"
                    title="Delete from Bookmarks"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>

            {/* Content */}
            <div className="space-y-1">
                <div className="flex justify-between items-start">
                    <h3 className="font-bold text-zinc-900 dark:text-white text-lg truncate pr-2 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">{place.name}</h3>
                </div>

                <div className="flex items-center text-sm text-zinc-500 font-medium list-none">
                    <span>{place.price || "$$"}</span>
                    <span className="mx-1.5">•</span>
                    <span>{place.distance || "N/A"}</span>
                    <span className="mx-1.5">•</span>
                    <span className="truncate">{place.category || "Place"}</span>
                </div>

                <div className="flex flex-wrap gap-2 mt-2">
                    {place.tags && place.tags.map((tag: string, i: number) => (
                        <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-medium">
                            {tag}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};
