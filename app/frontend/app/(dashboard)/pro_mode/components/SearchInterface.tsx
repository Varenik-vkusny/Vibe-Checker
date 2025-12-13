import { Search, SendHorizonal } from 'lucide-react';

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