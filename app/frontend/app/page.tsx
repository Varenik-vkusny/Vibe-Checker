'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Search, SendHorizonal, ChevronDown, Fingerprint, Sparkles } from 'lucide-react';
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

  const scrollToNext = () => {
    const nextSection = document.getElementById('slide-2');
    nextSection?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="h-screen w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth bg-background text-foreground">
      
      {/* --- HERO SECTION --- */}
      <section id="slide-1" className="h-screen w-full snap-start flex flex-col items-center justify-center relative px-6 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[100px] -z-10 animate-pulse" />
        
        <div className="relative z-10 max-w-4xl text-center flex flex-col items-center gap-8">
          <Badge variant="outline" className="px-4 py-1.5 text-sm rounded-full border-primary/20 bg-primary/5 text-primary">
            v2.0 Now Available
          </Badge>
          
          <h1 className="text-6xl md:text-8xl font-bold tracking-tighter leading-[1.1]">
            {t.landing.titlePrefix} <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-400 dark:to-purple-400">{t.landing.titleSuffix}</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl font-light leading-relaxed text-balance">
            {t.landing.subtitle}
          </p>

          {/* Search Component */}
          <div className="w-full max-w-lg mt-8">
            <form onSubmit={handleSearch} className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
              <div className="relative flex items-center bg-background border border-border/50 rounded-full p-2 shadow-xl">
                <Search className="ml-4 w-5 h-5 text-muted-foreground shrink-0" />
                <input 
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Describe your vibe (e.g. 'Cozy jazz bar')"
                  className="flex-1 bg-transparent border-none px-4 py-3 text-lg focus:outline-none placeholder:text-muted-foreground/60 text-foreground w-full"
                />
                <Button type="submit" size="icon" className="rounded-full w-11 h-11 shrink-0">
                  <SendHorizonal className="w-5 h-5" />
                </Button>
              </div>
            </form>
            
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {['☕ Cozy Cafe', '💻 Workspace', '🍸 Rooftop Bar'].map((tag) => (
                <button 
                  key={tag}
                  onClick={() => setQuery(tag)}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-muted/50 hover:bg-muted border border-border transition-all text-muted-foreground hover:text-foreground"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-10 animate-bounce cursor-pointer text-muted-foreground hover:text-foreground transition-colors" onClick={scrollToNext}>
          <ChevronDown className="w-6 h-6" />
        </div>
      </section>

      {/* --- FEATURE: VIBE SIGNATURE --- */}
      <section id="slide-2" className="h-screen w-full snap-start flex flex-col md:flex-row items-center justify-center p-6 md:p-24 bg-muted/30 border-t border-border/50 relative">
        <div className="flex-1 space-y-6 z-10 max-w-xl md:pr-12">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
            <Fingerprint className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight">Vibe Signatures</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            We don't just tell you if it's open. We translate thousands of data points into a simple signature. Know if it's <span className="text-foreground font-medium">loud</span>, <span className="text-foreground font-medium">bright</span>, or <span className="text-foreground font-medium">fast-paced</span> before you go.
          </p>
        </div>
        
        <div className="flex-1 h-full flex items-center justify-center">
           <div className="relative w-[320px] bg-background rounded-3xl border border-border shadow-2xl p-8 space-y-6 rotate-3 hover:rotate-0 transition-transform duration-500">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-lg">Signature</span>
                <Badge variant="outline">98% Match</Badge>
              </div>
              {['Noise Level', 'Lighting', 'Service Speed'].map((label, i) => (
                  <div key={label} className="space-y-2">
                    <div className="flex justify-between text-sm font-medium text-muted-foreground">
                        <span>{label}</span>
                        <span className={i === 0 ? 'text-red-500' : i === 1 ? 'text-yellow-500' : 'text-green-500'}>
                            {i === 0 ? 'High' : i === 1 ? 'Dim' : 'Fast'}
                        </span>
                    </div>
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${i === 0 ? 'bg-red-500 w-[85%]' : i === 1 ? 'bg-yellow-500 w-[30%]' : 'bg-green-500 w-[90%]'}`} />
                    </div>
                  </div>
              ))}
           </div>
        </div>
      </section>

      {/* --- FEATURE: AI --- */}
      <section id="slide-3" className="h-screen w-full snap-start flex flex-col-reverse md:flex-row items-center justify-center p-6 md:p-24 bg-background border-t border-border/50">
        <div className="flex-1 h-full flex items-center justify-center">
           <div className="w-full max-w-md bg-gradient-to-br from-purple-500/10 to-transparent p-1 rounded-3xl border border-purple-500/20">
             <div className="bg-card/80 backdrop-blur-sm rounded-[22px] p-8 space-y-4 shadow-sm">
               <div className="flex items-center gap-3 mb-2">
                 <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                 </div>
                 <div className="text-sm font-bold text-purple-600 dark:text-purple-400">AI Summary</div>
               </div>
               <p className="text-lg font-medium leading-relaxed">
                 "A hidden gem for digital nomads. The coffee is strong, outlets are everywhere, but it gets crowded with students after 3 PM."
               </p>
             </div>
           </div>
        </div>
        
        <div className="flex-1 space-y-6 z-10 max-w-xl md:pl-12">
          <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
            <Sparkles className="w-7 h-7 text-purple-600 dark:text-purple-400" />
          </div>
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight">Read Less.<br/>Know More.</h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Our neural networks analyze thousands of comments across the web to extract the <span className="text-foreground font-medium">hidden truths</span> about a place.
          </p>
        </div>
      </section>

      {/* --- CTA --- */}
      <section id="slide-4" className="h-screen w-full snap-start flex flex-col items-center justify-center p-6 text-center bg-grid-black/[0.02] dark:bg-grid-white/[0.02] relative border-t border-border/50">
        <div className="max-w-2xl space-y-8 relative z-10">
          <h2 className="text-5xl md:text-7xl font-bold tracking-tighter">Ready to check the vibe?</h2>
          <Button 
            size="lg" 
            className="h-14 px-10 text-lg rounded-full shadow-xl hover:scale-105 transition-transform"
            onClick={() => router.push('/map')}
          >
            Launch Map
          </Button>
        </div>
        
        <footer className="absolute bottom-8 text-muted-foreground text-sm font-medium">
          &copy; {new Date().getFullYear()} VibeCheck.
        </footer>
      </section>

    </div>
  );
}