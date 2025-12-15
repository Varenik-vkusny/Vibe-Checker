import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Loader2, Search, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface UnifiedSearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    onSearch?: () => void;
    loading?: boolean;
    containerClassName?: string;
    rightElement?: React.ReactNode;
    icon?: React.ComponentType<any>;
}

export const UnifiedSearchInput = forwardRef<HTMLInputElement, UnifiedSearchInputProps>(
    ({ className, containerClassName, onSearch, loading, rightElement, icon: Icon = Search, ...props }, ref) => {
        return (
            <div className={cn("relative w-full group", containerClassName)}>
                <Input
                    ref={ref}
                    className={cn(
                        "pl-6 pr-20 h-16 md:h-20 bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800",
                        "focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-white",
                        "focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-950",
                        "text-lg md:text-xl placeholder:text-zinc-400 dark:placeholder:text-zinc-600",
                        "rounded-2xl shadow-xl w-full transition-all",
                        className
                    )}
                    autoComplete="off"
                    {...props}
                />
                {(onSearch || rightElement) && (
                    <div className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2">
                        {rightElement ? (
                            rightElement
                        ) : (
                            <Button
                                type="button"
                                onClick={onSearch}
                                disabled={loading || props.disabled}
                                className="h-12 w-12 md:h-14 md:w-14 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white hover:scale-105 transition-all shadow-lg border border-zinc-800 dark:border-zinc-200 p-0 flex items-center justify-center"
                            >
                                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Icon className="w-6 h-6" />}
                            </Button>
                        )}
                    </div>
                )}
            </div>
        );
    }
);

UnifiedSearchInput.displayName = "UnifiedSearchInput";
