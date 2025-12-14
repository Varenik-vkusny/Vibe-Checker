import { Search, SendHorizonal, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  inputValue: string;
  setInputValue: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onSuggestion: (t: string) => void;
  error?: string | null;
}

const SUGGESTIONS = ['Cozy coffee shop with WiFi', 'Lively bar near tourist spots', 'Quiet library branch'];

export const SearchInterface = ({ inputValue, setInputValue, onSubmit, onSuggestion, error }: Props) => {
  return (
    <div className="pointer-events-auto w-full max-w-xl p-6 flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-500">
      
      {/* Header - Minimalist */}
      <div className="text-center space-y-3">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-foreground">
          Pro Mode
        </h1>
        <p className="text-muted-foreground text-sm md:text-base font-light tracking-wide max-w-sm mx-auto">
          Neural analysis of vibe & atmosphere
        </p>
      </div>

      {/* Input Form - Linear Style */}
      <form onSubmit={onSubmit} className="w-full relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-violet-500/20 rounded-2xl blur-md opacity-0 group-hover:opacity-100 transition duration-700"></div>
        
        <div className="relative bg-background/80 backdrop-blur-xl border border-primary/10 shadow-lg rounded-2xl p-2 flex items-center transition-all focus-within:ring-2 focus-within:ring-primary/20">
          <div className="pl-3 text-muted-foreground">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Describe the vibe..."
            className="flex-1 bg-transparent border-none text-foreground placeholder:text-muted-foreground/50 focus:ring-0 px-4 py-3 outline-none text-lg font-medium"
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className={cn(
                "rounded-xl w-10 h-10 flex items-center justify-center transition-all duration-300",
                inputValue.trim() 
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md transform hover:scale-105" 
                    : "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
            )}
          >
            <SendHorizonal className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Error Message */}
      {error && (
        <div className="text-destructive text-xs font-medium bg-destructive/10 px-3 py-1 rounded-full animate-in fade-in slide-in-from-top-2">
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
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground border border-border/50 transition-all hover:border-primary/20"
              >
                {s}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 w-full max-w-xs">
            <div className="h-px bg-border flex-1"></div>
            <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">OR</span>
            <div className="h-px bg-border flex-1"></div>
          </div>

          <button
            type="button"
            onClick={() => onSuggestion("INSPIRE_ME_ACTION")} 
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-pink-500/10 to-violet-500/10 hover:from-pink-500/20 hover:to-violet-500/20 border border-pink-500/20 hover:border-pink-500/40 transition-all group"
          >
            <Sparkles className="w-4 h-4 text-pink-500 group-hover:animate-pulse" />
            <span className="text-sm font-medium text-pink-600 dark:text-pink-400">Surprise Me</span>
          </button>
      </div>
    </div>
  );
};