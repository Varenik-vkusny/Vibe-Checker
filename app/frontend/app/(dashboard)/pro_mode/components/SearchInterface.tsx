import { Search, SendHorizonal, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
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
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-foreground">
          {t.pro.title}
        </h1>
        <p className="text-muted-foreground text-sm md:text-base font-light tracking-wide max-w-sm mx-auto">
          {t.pro.subtitle}
        </p>
      </div>

      {/* Input Form - Industrial Style */}
      <form onSubmit={onSubmit} className="w-full relative group">

        <div className="relative bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-2 flex items-center transition-all focus-within:ring-2 focus-within:ring-zinc-900 dark:focus-within:ring-zinc-100 focus-within:border-transparent">
          <div className="pl-3 text-zinc-400">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={t.pro.searchPlaceholder}
            className="flex-1 bg-transparent border-none text-foreground placeholder:text-zinc-400 focus:ring-0 px-4 py-3 outline-none text-lg font-medium"
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className={cn(
              "rounded-lg w-10 h-10 flex items-center justify-center transition-all duration-300",
              inputValue.trim()
                ? "bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:scale-105"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
            )}
          >
            <SendHorizonal className="w-4 h-4" />
          </button>
        </div>
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