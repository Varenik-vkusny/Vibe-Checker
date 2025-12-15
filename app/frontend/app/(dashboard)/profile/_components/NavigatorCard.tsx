import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface NavigatorCardProps {
    id: string;
    name: string;
    selected: boolean;
    onSelect: (id: string) => void;
    icon?: LucideIcon;
    imageSrc?: string;
}

export const NavigatorCard: React.FC<NavigatorCardProps> = ({ id, name, selected, onSelect, icon: Icon, imageSrc }) => {
    return (
        <div
            onClick={() => onSelect(id)}
            className={cn(
                "cursor-pointer rounded-xl border p-4 flex flex-col items-center justify-center gap-2 transition-all duration-200",
                selected
                    ? "border-zinc-900 bg-zinc-100 ring-1 ring-zinc-900 shadow-md dark:border-white dark:bg-zinc-800 dark:ring-white dark:shadow-lg"
                    : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100 hover:border-zinc-300 text-zinc-500 hover:text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/50 dark:hover:bg-zinc-800 dark:hover:border-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300"
            )}
        >
            {imageSrc ? (
                <img
                    src={imageSrc}
                    alt={name}
                    className={cn(
                        "w-8 h-8 object-contain transition-all",
                        selected ? "opacity-100" : "opacity-40 grayscale"
                    )}
                />
            ) : (
                Icon && <Icon className={cn("w-6 h-6", selected ? "text-zinc-900 dark:text-white" : "text-zinc-600")} />
            )}
            <span className={cn("text-xs font-bold uppercase tracking-wider", selected ? "text-zinc-900 dark:text-white" : "text-zinc-500")}>
                {name}
            </span>
        </div>
    );
};
