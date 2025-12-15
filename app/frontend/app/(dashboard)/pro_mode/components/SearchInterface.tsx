import { Search, SendHorizonal, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UnifiedSearchInput } from '@/components/UnifiedSearchInput';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface Props {
  inputValue: string;
  setInputValue: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onSuggestion: (t: string) => void;
  error?: string | null;
}

const SUGGESTIONS = ['Cozy coffee shop with WiFi', 'Lively bar near tourist spots', 'Quiet library branch'];

export const SearchInterface = ({ inputValue, setInputValue, onSubmit, onSuggestion, error }: Props) => {
  const { t } = useLanguage();

  return (
    <div className="pointer-events-auto w-full max-w-xl p-6 flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-500">

      {/* Header - Minimalist */}
      <div className="text-center space-y-3">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-zinc-900 dark:text-white">
          {t.pro.title}
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-lg md:text-xl mb-10 max-w-2xl leading-relaxed mx-auto">
          {t.pro.subtitle}
        </p>
      </div>

      {/* Input Form - Industrial Style */}
      <form onSubmit={onSubmit} className="w-full relative group">
        <UnifiedSearchInput
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={t.pro.searchPlaceholder}
          rightElement={
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className={cn(
                "h-12 w-12 md:h-14 md:w-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg border border-zinc-800 dark:border-zinc-200",
                inputValue.trim()
                  ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:scale-105 hover:bg-zinc-800 dark:hover:bg-white"
                  : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed border-transparent"
              )}
            >
              <SendHorizonal className="w-6 h-6" />
            </button>
          }
        />
      </form>

      {/* Error Message */}
      {error && (
        <div className="text-destructive text-xs font-medium border border-destructive/20 bg-destructive/5 px-3 py-1 rounded-sm animate-in fade-in slide-in-from-top-2">
          {error}
        </div>
      )}

      {/* Suggestions & Actions */}
      <div className="space-y-6 w-full flex flex-col items-center">
        <div className="flex flex-wrap justify-center gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => onSuggestion(s)}
              className="px-4 py-2 rounded-full text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all hover:scale-105 active:scale-95"
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 w-full max-w-xs">
          <div className="h-px bg-border flex-1"></div>
          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">{t.pro.or}</span>
          <div className="h-px bg-border flex-1"></div>
        </div>

        <button
          type="button"
          onClick={() => onSuggestion("INSPIRE_ME_ACTION")}
          className="flex items-center gap-2 px-6 py-2.5 rounded-md bg-secondary text-secondary-foreground hover:opacity-90 border border-transparent hover:border-border transition-all group"
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-medium">{t.pro.surpriseMe}</span>
        </button>
      </div>
    </div>
  );
};