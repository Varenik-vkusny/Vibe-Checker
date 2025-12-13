'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Search, SendHorizonal, ChevronDown, Fingerprint, Users, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

  const scrollToNext = () => {
    const nextSection = document.getElementById('slide-2');
    nextSection?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    // Main container with Scroll Snap
    <div className="h-screen w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth bg-black text-white">
      
      {/* --- SLIDE 1: HERO & SEARCH --- */}
      <section id="slide-1" className="h-screen w-full snap-start flex flex-col items-center justify-center relative px-6 overflow-hidden">
        {/* Background Ambient Light */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px]" />
        
        <div className="relative z-10 max-w-4xl text-center space-y-8">
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter">
            Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Vibe.</span>
          </h1>
          <p className="text-xl text-neutral-400 max-w-2xl mx-auto font-light">
            Discover places that match your mood. Powered by AI and real reviews.
          </p>

          {/* Chat Bar */}
          <div className="w-full max-w-xl mx-auto mt-10">
            <form onSubmit={handleSearch} className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full opacity-50 blur transition duration-500 group-hover:opacity-100"></div>
              <div className="relative flex items-center bg-[#0A0A0A] border border-white/10 rounded-full p-2 shadow-2xl">
                <Search className="ml-4 w-5 h-5 text-neutral-500 shrink-0" />
                <input 
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Describe your vibe (e.g. 'Cozy jazz bar for a date')"
                  className="flex-1 bg-transparent border-none px-4 py-3 text-lg focus:outline-none placeholder:text-neutral-600 text-white w-full"
                />
                <button 
                  type="submit"
                  className="bg-white text-black rounded-full p-3 hover:scale-105 transition-transform"
                >
                  <SendHorizonal className="w-5 h-5" />
                </button>
              </div>
            </form>
            
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              {['☕ Cozy Cafe', '💻 Workspace', '🍸 Rooftop Bar', '🍜 Cheap Eats'].map((tag) => (
                <button 
                  key={tag}
                  onClick={() => setQuery(tag)}
                  className="px-4 py-1.5 rounded-full text-xs font-medium bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-neutral-300"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 animate-bounce cursor-pointer text-neutral-500 hover:text-white transition-colors" onClick={scrollToNext}>
          <ChevronDown className="w-8 h-8" />
        </div>
      </section>

      {/* --- SLIDE 2: VIBE SIGNATURE --- */}
      <section id="slide-2" className="h-screen w-full snap-start flex flex-col md:flex-row items-center justify-center p-6 md:p-24 bg-[#050505] relative overflow-hidden border-t border-white/5">
        <div className="flex-1 space-y-6 z-10 max-w-xl">
          <div className="w-16 h-16 rounded-2xl bg-blue-900/20 flex items-center justify-center mb-6">
            <Fingerprint className="w-8 h-8 text-blue-400" />
          </div>
          <h2 className="text-4xl md:text-6xl font-bold">Vibe Signatures</h2>
          <p className="text-xl text-neutral-400 leading-relaxed">
            We don't just tell you if it's open. We tell you if it's <span className="text-white">loud</span>, if the lights are <span className="text-white">dim</span>, and if the Wi-Fi is <span className="text-white">fast</span>.
          </p>
          <p className="text-neutral-500">Know the atmosphere before you walk through the door.</p>
        </div>
        <div className="flex-1 h-full flex items-center justify-center relative">
           {/* Visual Mockup for Vibe */}
           <div className="relative w-[300px] md:w-[400px] aspect-square bg-[#111] rounded-3xl border border-white/10 p-8 flex flex-col justify-center gap-6 shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500">
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-bold text-neutral-400"><span>NOISE</span> <span className="text-red-400">High</span></div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden"><div className="h-full w-[80%] bg-red-500"/></div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-bold text-neutral-400"><span>LIGHT</span> <span className="text-yellow-400">Dim</span></div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden"><div className="h-full w-[30%] bg-yellow-500"/></div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-bold text-neutral-400"><span>SERVICE</span> <span className="text-blue-400">Fast</span></div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden"><div className="h-full w-[90%] bg-blue-500"/></div>
              </div>
           </div>
        </div>
      </section>

      {/* --- SLIDE 3: AI ANALYSIS --- */}
      <section id="slide-3" className="h-screen w-full snap-start flex flex-col-reverse md:flex-row items-center justify-center p-6 md:p-24 bg-black relative border-t border-white/5">
        <div className="flex-1 h-full flex items-center justify-center">
           {/* Visual Mockup for AI */}
           <div className="w-full max-w-md bg-gradient-to-br from-purple-900/10 to-transparent p-1 rounded-3xl border border-purple-500/20">
             <div className="bg-[#0A0A0A] rounded-[22px] p-8 space-y-4">
               <div className="flex items-center gap-3 mb-4">
                 <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center"><Sparkles className="w-4 h-4 text-white fill-white" /></div>
                 <div className="text-sm font-bold text-purple-400">AI Summary</div>
               </div>
               <p className="text-lg text-neutral-200 leading-relaxed">
                 "A hidden gem for digital nomads. The coffee is strong, outlets are everywhere, but it gets crowded with students after 3 PM."
               </p>
               <div className="flex gap-2 mt-4">
                 <span className="px-3 py-1 rounded-md bg-white/5 text-xs text-neutral-400 border border-white/5">Productive</span>
                 <span className="px-3 py-1 rounded-md bg-white/5 text-xs text-neutral-400 border border-white/5">Good Coffee</span>
               </div>
             </div>
           </div>
        </div>
        <div className="flex-1 space-y-6 z-10 max-w-xl md:pl-12">
          <div className="w-16 h-16 rounded-2xl bg-purple-900/20 flex items-center justify-center mb-6">
            <Sparkles className="w-8 h-8 text-purple-400" />
          </div>
          <h2 className="text-4xl md:text-6xl font-bold">We Read the Reviews</h2>
          <p className="text-xl text-neutral-400 leading-relaxed">
            Our neural networks analyze thousands of comments across the web to extract the <span className="text-white">hidden truths</span> about a place.
          </p>
          <p className="text-neutral-500">Don't waste time reading. Get the summary instantly.</p>
        </div>
      </section>

      {/* --- SLIDE 4: CALL TO ACTION --- */}
      <section id="slide-4" className="h-screen w-full snap-start flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-black to-[#111]">
        <div className="max-w-2xl space-y-8">
          <h2 className="text-5xl font-bold">Ready to find your spot?</h2>
          <p className="text-xl text-neutral-400">
            Stop guessing. Start checking.
          </p>
          <Button 
            size="lg" 
            className="h-14 px-8 text-lg rounded-full bg-white text-black hover:bg-neutral-200"
            onClick={() => router.push('/map')}
          >
            Launch Map
          </Button>
        </div>
        
        <footer className="absolute bottom-6 text-neutral-600 text-sm">
          &copy; {new Date().getFullYear()} VibeCheck. Not just a map.
        </footer>
      </section>

    </div>
  );
}