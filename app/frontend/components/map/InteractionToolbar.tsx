'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ThumbsUp, ThumbsDown, CheckCircle, Bookmark } from 'lucide-react';
import { interactWithPlace, markVisited } from '@/services/interaction';
import { favoritesService } from '@/services/favorites';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface InteractionToolbarProps {
    placeId: string;
    initialLikeState?: boolean;
    initialDislikeState?: boolean;
    initialVisitedState?: boolean;
    initialSavedState?: boolean;
    onUpdate?: (updates: { liked?: boolean; disliked?: boolean; visited?: boolean; saved?: boolean }) => void;
}

export const InteractionToolbar = ({
    placeId,
    initialLikeState = false,
    initialDislikeState = false,
    initialVisitedState = false,
    initialSavedState = false,
    onUpdate
}: InteractionToolbarProps) => {
    const { t } = useLanguage();

    const [liked, setLiked] = useState(initialLikeState);
    const [disliked, setDisliked] = useState(initialDislikeState);
    const [visited, setVisited] = useState(initialVisitedState);
    const [saved, setSaved] = useState(initialSavedState);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setLiked(initialLikeState);
        setDisliked(initialDislikeState);
        setVisited(initialVisitedState);
        setSaved(initialSavedState);
    }, [initialLikeState, initialDislikeState, initialVisitedState, initialSavedState]);

    const handleRate = async (type: 'LIKE' | 'DISLIKE') => {
        if (isLoading) return;

        const prevLiked = liked;
        const prevDisliked = disliked;

        let newLiked = prevLiked;
        let newDisliked = prevDisliked;

        if (type === 'LIKE') {
            newLiked = !prevLiked;
            newDisliked = false; // Cannot be both
        } else {
            newDisliked = !prevDisliked;
            newLiked = false;
        }

        setLiked(newLiked);
        setDisliked(newDisliked);
        onUpdate?.({ liked: newLiked, disliked: newDisliked });

        try {
            const apiRating = (type === 'LIKE' && newLiked) || (type === 'DISLIKE' && newDisliked)
                ? type
                : 'NONE';

            await interactWithPlace(placeId, apiRating);
        } catch (error) {
            setLiked(prevLiked);
            setDisliked(prevDisliked);
            onUpdate?.({ liked: prevLiked, disliked: prevDisliked });

            toast.error("Failed to save rating. Please try again.");
        }
    };

    const handleVisit = async () => {
        if (isLoading) return;

        const prevVisited = visited;
        setVisited(!prevVisited);
        onUpdate?.({ visited: !prevVisited });

        try {
            await markVisited(placeId, !prevVisited);
        } catch (error) {
            setVisited(prevVisited);
            onUpdate?.({ visited: prevVisited });

            toast.error("Failed to update visited status.");
        }
    };

    const handleSave = async () => {
        if (isLoading) return;

        const prevSaved = saved;
        setSaved(!prevSaved);
        onUpdate?.({ saved: !prevSaved });

        try {
            await favoritesService.toggleFavorite(placeId);
            toast.success(!prevSaved ? "Saved to Library" : "Removed from Library");
        } catch (error) {
            setSaved(prevSaved);
            onUpdate?.({ saved: prevSaved });
            toast.error("Failed to update bookmark.");
        }
    };

    return (
        <div className="flex gap-1.5">
            <Button
                variant="outline"
                size="icon"
                className={cn(
                    "h-9 w-9 shrink-0 rounded-xl border border-zinc-200 dark:border-zinc-800 transition-all duration-200 hover:scale-105 active:scale-95",
                    liked
                        ? "bg-green-500/10 text-green-600 border-green-500/50 hover:bg-green-500/20 hover:text-green-700 hover:border-green-600"
                        : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                )}
                onClick={(e) => { e.stopPropagation(); handleRate('LIKE'); }}
                title={t.map.like || 'Like'}
            >
                <ThumbsUp className={cn("w-4 h-4", liked && "fill-current")} />
            </Button>

            <Button
                variant="outline"
                size="icon"
                className={cn(
                    "h-9 w-9 shrink-0 rounded-xl border border-zinc-200 dark:border-zinc-800 transition-all duration-200 hover:scale-105 active:scale-95",
                    disliked
                        ? "bg-red-500/10 text-red-600 border-red-500/50 hover:bg-red-500/20 hover:text-red-700 hover:border-red-600"
                        : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                )}
                onClick={(e) => { e.stopPropagation(); handleRate('DISLIKE'); }}
                title="Dislike"
            >
                <ThumbsDown className={cn("w-4 h-4", disliked && "fill-current")} />
            </Button>

            <Button
                variant="outline"
                size="icon"
                className={cn(
                    "h-9 w-9 shrink-0 rounded-xl border border-zinc-200 dark:border-zinc-800 transition-all duration-200 hover:scale-105 active:scale-95",
                    visited
                        ? "bg-blue-500/10 text-blue-600 border-blue-500/50 hover:bg-blue-500/20 hover:text-blue-700 hover:border-blue-600"
                        : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                )}
                onClick={(e) => { e.stopPropagation(); handleVisit(); }}
                title={visited ? (t.map.visited || 'Visited') : (t.map.markVisited || 'Mark Visited')}
            >
                <CheckCircle className={cn("w-4 h-4", visited && "fill-current")} />
            </Button>

            <Button
                variant="outline"
                size="icon"
                className={cn(
                    "h-9 w-9 shrink-0 rounded-xl border border-zinc-200 dark:border-zinc-800 transition-all duration-200 hover:scale-105 active:scale-95",
                    saved
                        ? "bg-yellow-500/10 text-yellow-600 border-yellow-500/50 hover:bg-yellow-500/20 hover:text-yellow-700 hover:border-yellow-600"
                        : "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                )}
                onClick={(e) => { e.stopPropagation(); handleSave(); }}
                title="Save"
            >
                <Bookmark className={cn("w-4 h-4", saved && "fill-current")} />
            </Button>
        </div>
    );
};
