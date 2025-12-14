import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Loader2 } from 'lucide-react';

interface LoadingHUDProps {
  title: string;
  subtitle: string;
}

export const LoadingHUD = ({ title, subtitle }: LoadingHUDProps) => {
  const { t } = useLanguage();

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center pointer-events-none bg-background/80 backdrop-blur-sm animate-in fade-in duration-500">

      <div className="flex flex-col items-center gap-6">
        {/* Simple Modern Spinner */}
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-zinc-200 dark:border-zinc-800" />
          <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-primary border-t-transparent animate-spin" />
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            {title || t.pro.analyzing}
          </h2>
          <p className="text-muted-foreground text-sm font-medium animate-pulse">
            {subtitle || t.pro.compiling}
          </p>
        </div>
      </div>

    </div>
  );
};