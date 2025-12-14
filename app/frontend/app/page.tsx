'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Search, SendHorizonal, Sparkles, Eye, ArrowRight, Github, Twitter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function Home() {
  const { t } = useLanguage();
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/pro_mode?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="min-h-screen w-full bg-zinc-50 dark:bg-zinc-950 text-foreground selection:bg-indigo-500/20 flex flex-col">

      {/* --- SECTION 1: HERO (Entry Point) --- */}
      <section className="relative w-full min-h-[90vh] flex flex-col items-center justify-center px-6 pt-20 pb-12 text-center overflow-hidden">

        {/* Abstract Background Elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none brightness-100 contrast-150" />

        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-700">
          <Badge variant="outline" className="mb-8 px-4 py-1.5 text-sm rounded-full border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-black/20 backdrop-blur-md text-zinc-600 dark:text-zinc-400 font-medium">
            Running Vibe-Checker v2.0
          </Badge>

          <h1 className="text-5xl md:text-8xl font-bold tracking-tighter text-zinc-900 dark:text-zinc-50 mb-8 max-w-3xl leading-[1.05]">
            {t.landing.titlePrefix} <span className="text-zinc-400 dark:text-zinc-600">{t.landing.titleSuffix}</span>
          </h1>

          <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl font-normal leading-relaxed text-balance mb-12">
            {t.landing.subtitle}
          </p>

          {/* Search Bar - Main CTA */}
          <div className="w-full max-w-2xl relative group">
            <form onSubmit={handleSearch} className="relative">
              {/* Glow Effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full opacity-20 group-hover:opacity-40 transition duration-500 blur-lg" />

              <div className="relative flex items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full h-16 pl-6 pr-2 shadow-xl shadow-zinc-200/50 dark:shadow-black/50 transition-transform transform group-hover:scale-[1.01]">
                <Search className="w-5 h-5 text-zinc-400 shrink-0 mr-4" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask nicely... e.g. 'Quiet cafe for reading'"
                  className="flex-1 bg-transparent border-none text-lg focus:outline-none placeholder:text-zinc-400 text-foreground h-full"
                />
                <Button type="submit" size="icon" className="rounded-full w-12 h-12 shrink-0 bg-primary/90 hover:bg-primary text-primary-foreground shadow-sm transition-colors">
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            </form>
          </div>

          {/* Quick Tags */}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {['☕ Focus Work', '🍸 Date Night', '🥗 Healthy Lunch', '📚 Study Spot'].map((tag) => (
              <button
                key={tag}
                onClick={() => setQuery(tag)}
                className="px-4 py-2 rounded-full text-sm font-medium bg-white/60 dark:bg-zinc-900/60 backdrop-blur-sm border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all hover:-translate-y-0.5"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </section>


      {/* --- SECTION 2: FEATURES (Simplified Bento) --- */}
      <section className="w-full py-24 bg-white dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-900">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* Feature 1: AI Analysis */}
            <div className="group relative overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-10 flex flex-col justify-between h-[400px]">
              <div className="space-y-6 relative z-10">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white dark:bg-zinc-800 shadow-sm border border-zinc-100 dark:border-zinc-700">
                  <Sparkles className="w-7 h-7 text-indigo-500" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-3">AI Verdicts</h3>
                  <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-sm">
                    We aggregate thousands of reviews into a single, honest "Vibe Score". No more reading 5-star bots.
                  </p>
                </div>
              </div>

              {/* Visual Element */}
              <div className="absolute right-0 bottom-0 opacity-10 dark:opacity-5">
                <Sparkles className="w-64 h-64 -mb-12 -mr-12" />
              </div>
            </div>

            {/* Feature 2: Pro Mode (Theme-Aware) */}
            <div className="group relative overflow-hidden rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-zinc-900 dark:bg-zinc-950 p-10 flex flex-col justify-between h-[400px] text-white">
              {/* Background Gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-transparent to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-700" />

              <div className="space-y-6 relative z-10">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-zinc-800/80 backdrop-blur-md border border-zinc-700">
                    <Eye className="w-7 h-7 text-white" />
                  </div>
                  <Badge className="bg-green-500/20 text-green-400 hover:bg-green-500/30 border-green-500/20 pointer-events-none">
                    Recommended
                  </Badge>
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-white mb-3">Pro Mode</h3>
                  <p className="text-lg text-zinc-400 leading-relaxed max-w-sm">
                    Semantic search engine for power users. Find places based on specific vibes, amenities, or crowd type.
                  </p>
                </div>
              </div>

              <Button
                onClick={() => router.push('/pro_mode')}
                className="mt-6 self-start bg-white text-black hover:bg-zinc-200 border-none rounded-full px-8 h-12 text-base font-medium"
              >
                Try Pro Mode
              </Button>
            </div>

          </div>
        </div>
      </section>


      {/* --- SECTION 3: FOOTER --- */}
      <footer className="w-full py-12 px-6 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-900 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-zinc-500 dark:text-zinc-500">
          <p>© 2025 Vibe-Checker Inc. All visuals handcrafted.</p>

          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors">Privacy</a>
            <a href="#" className="hover:text-zinc-900 dark:hover:text-zinc-300 transition-colors">Terms</a>
            <div className="flex items-center gap-4 ml-4">
              <a href="#" className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
                <Github className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-full bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}