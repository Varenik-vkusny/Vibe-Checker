'use client';

export const SkeletonAnalysis = () => {
    return (
        <div className="relative w-full space-y-8 animate-pulse opacity-50 mask-image-fade-bottom">

            {/* 1. Verdict Card (Top) */}
            <div className="w-full h-32 bg-zinc-800/50 rounded-xl" />

            {/* 2. Vibe Tags (Middle) */}
            <div className="flex gap-3">
                <div className="h-8 w-24 bg-zinc-800/50 rounded-full" />
                <div className="h-8 w-20 bg-zinc-800/50 rounded-full" />
                <div className="h-8 w-28 bg-zinc-800/50 rounded-full" />
            </div>

            {/* 3. Metrics Grid (Bottom) */}
            <div className="grid grid-cols-3 gap-4 h-40">
                <div className="w-full h-full bg-zinc-800/50 rounded-xl mt-8" />
                <div className="w-full h-full bg-zinc-800/50 rounded-xl" />
                <div className="w-full h-full bg-zinc-800/50 rounded-xl mt-4" />
            </div>

            {/* Fade Effect Overlay (Alternative to mask-image if tailwind plugin missing) */}
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-zinc-950 to-transparent pointer-events-none" />

        </div>
    );
};
