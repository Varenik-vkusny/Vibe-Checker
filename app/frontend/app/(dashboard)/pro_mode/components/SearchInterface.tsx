import { Search, SendHorizonal } from 'lucide-react';
import { Sparkles } from 'lucide-react';

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
    <div className="pointer-events-auto w-full max-w-2xl p-6 flex flex-col items-center gap-8 animate-in fade-in zoom-in duration-700">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-300 via-white to-violet-300 bg-clip-text text-transparent drop-shadow-sm">
          Pro Mode
        </h1>
        <p className="text-slate-400 font-light tracking-wide">
          Neural analysis of vibe & atmosphere
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="text-amber-400 text-xs font-mono bg-amber-900/20 border border-amber-500/30 px-4 py-2 rounded">
          ⚠ {error}
        </div>
      )}

      {/* Input Form - Glass Style */}
      <form onSubmit={onSubmit} className="w-full relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-violet-600 rounded-2xl opacity-30 group-hover:opacity-60 blur transition duration-500"></div>
        <div className="relative bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-1 flex items-center">
          <div className="pl-4 text-slate-500">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Describe the vibe you are looking for..."
            className="flex-1 bg-transparent border-none text-white placeholder:text-slate-600 focus:ring-0 px-4 py-3 outline-none"
          />
          <button
            type="submit"
            className="bg-gradient-to-r from-cyan-600 to-violet-600 text-white rounded-xl w-10 h-10 flex items-center justify-center hover:opacity-90 transition-opacity m-1"
          >
            <SendHorizonal className="w-4 h-4" />
          </button>
        </div>
      </form>

      <div className="flex items-center gap-4 w-full justify-center">
        <div className="h-px bg-white/10 flex-1"></div>
        <span className="text-xs text-neutral-500 font-mono">OR</span>
        <div className="h-px bg-white/10 flex-1"></div>
      </div>

      <button
        type="button"
        onClick={() => onSuggestion("INSPIRE_ME_ACTION")} 
        className="group relative flex items-center gap-3 px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500/10 to-purple-500/10 border border-pink-500/20 hover:border-pink-500/50 hover:from-pink-500/20 hover:to-purple-500/20 transition-all duration-300"
      >
        <Sparkles className="w-4 h-4 text-pink-400 animate-pulse" />
        <span className="text-sm font-medium text-pink-200">Surprise me (AI Recommendation)</span>
        <div className="absolute inset-0 rounded-xl bg-pink-500/20 blur-xl opacity-0 group-hover:opacity-50 transition-opacity"></div>
      </button>

      {/* Suggestions */}
      <div className="flex flex-wrap justify-center gap-3">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onSuggestion(s)}
            className="px-4 py-1.5 rounded-full text-xs font-mono text-cyan-200/70 border border-cyan-500/20 bg-cyan-900/10 hover:bg-cyan-500/20 hover:border-cyan-400/50 transition-all"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
};