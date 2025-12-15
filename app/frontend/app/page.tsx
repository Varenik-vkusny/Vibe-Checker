'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { Search, ArrowRight, Sparkles, AlertCircle, CheckCircle2, Map as MapIcon, Wifi, Coffee, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// --- ANIMATION VARIANTS ---
const fadeInUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

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
    // MAIN CONTAINER: Scroll Snap
    <div className="fixed top-14 left-0 right-0 bottom-0 w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth bg-zinc-50 dark:bg-zinc-950 text-foreground selection:bg-indigo-500/20 z-0">

      {/* --- SLIDE 1: THE INPUT --- */}
      <section className="h-full w-full snap-start relative flex flex-col justify-center items-center px-6 border-b border-zinc-200/50 dark:border-zinc-800/50">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="max-w-4xl w-full flex flex-col items-center text-center z-10"
        >
          <motion.div variants={fadeInUp}>
            <Badge variant="outline" className="mb-6 px-3 py-1 text-xs uppercase tracking-widest text-zinc-500 border-zinc-300 dark:border-zinc-700">
              Vibe-Checker v2.0
            </Badge>
          </motion.div>

          <motion.h1 variants={fadeInUp} className="text-5xl md:text-7xl font-bold tracking-tighter text-zinc-900 dark:text-zinc-50 mb-6 text-balance">
            {t.landing.titlePrefix} <br className="hidden md:block" /> {t.landing.titleSuffix}
          </motion.h1>

          <motion.p variants={fadeInUp} className="text-lg md:text-xl text-zinc-500 dark:text-zinc-400 max-w-2xl mb-12 text-balance leading-relaxed">
            {t.landing.subtitle}
          </motion.p>

          <motion.div variants={fadeInUp} className="w-full max-w-2xl relative group">
            <form onSubmit={handleSearch} className="relative w-full">
              <div className="relative flex items-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full h-14 pl-6 pr-2 shadow-sm transition-all duration-300 focus-within:ring-2 focus-within:ring-zinc-900/10 dark:focus-within:ring-white/10 group-hover:border-zinc-300 dark:group-hover:border-zinc-700">
                <Search className="w-5 h-5 text-zinc-400 shrink-0 mr-4" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t.landing.searchPlaceholder}
                  className="flex-1 bg-transparent border-none text-base md:text-lg focus:outline-none placeholder:text-zinc-400 text-foreground h-full"
                />
                <Button type="submit" size="sm" className="rounded-full w-10 h-10 shrink-0 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>

        {/* Subtle background grid */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-zinc-50 dark:from-zinc-950 to-transparent pointer-events-none" />
      </section>

      {/* --- SLIDE 2: THE OUTPUT (Vibe Analysis) --- */}
      <section className="h-full w-full snap-start relative flex items-center justify-center px-6 bg-white dark:bg-zinc-950">
        <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-24 items-center">

          {/* Left: Text */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.5 }}
            variants={staggerContainer}
            className="text-center md:text-left order-1 md:order-1"
          >
            <motion.h2 variants={fadeInUp} className="text-4xl md:text-6xl font-bold tracking-tighter text-zinc-900 dark:text-zinc-50 mb-6">
              {t.landing.starRatingsAre} <br /><span className="text-red-500 dark:text-red-400 decoration-red-500/50 line-through decoration-4">{t.landing.obsolete}</span>
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-lg text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-md mx-auto md:mx-0">
              {t.landing.reviewsDontLie}
              <br /><br />
              <strong className="text-zinc-900 dark:text-zinc-200 font-semibold">{t.landing.readingReviews}</strong>
            </motion.p>
          </motion.div>

          {/* Right: Mockup Card */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            viewport={{ once: false }}
            className="order-2 md:order-2 flex justify-center md:justify-end"
          >
            {/* The "Vibe Card" */}
            <div className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl shadow-zinc-200/50 dark:shadow-black/50 overflow-hidden transform md:rotate-3 transition-transform hover:rotate-0 duration-500">
              <div className="h-40 bg-zinc-100 dark:bg-zinc-800 relative">
                <div className="absolute inset-0 flex items-center justify-center text-zinc-300 dark:text-zinc-600">
                  <MapIcon className="w-12 h-12 opacity-50" />
                </div>
                <div className="absolute top-4 right-4 bg-white dark:bg-zinc-950 px-3 py-1 rounded-full text-xs font-bold border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                  <span>8.9/10 {t.landing.demo.mockCard.match}</span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{t.landing.demo.mockCard.name}</h3>
                <p className="text-sm text-zinc-500 mb-4">{t.landing.demo.mockCard.type}</p>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">{t.landing.demo.mockCard.verdictLabel}</p>
                    <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-snug">
                      {t.landing.demo.mockCard.verdictText}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-md text-xs font-medium text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">{t.landing.demo.mockCard.tag1}</span>
                    <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-md text-xs font-medium text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">{t.landing.demo.mockCard.tag2}</span>
                    <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded-md text-xs font-medium text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">{t.landing.demo.mockCard.tag3}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- SLIDE 3: THE DECISION (Comparison) --- */}
      <section className="h-full w-full snap-start relative flex flex-col justify-center items-center px-6 bg-zinc-50 dark:bg-zinc-950">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <motion.h2 variants={fadeInUp} className="text-4xl md:text-6xl font-bold tracking-tighter text-zinc-900 dark:text-zinc-50 mb-4">
            {t.landing.settlingDebate}
          </motion.h2>
          <motion.p variants={fadeInUp} className="text-lg text-zinc-500 dark:text-zinc-400">
            {t.landing.stopGuessing}
          </motion.p>
        </motion.div>

        <div className="relative w-full max-w-3xl flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12">

          {/* Card A: Loser */}
          <motion.div
            initial={{ opacity: 0, x: -50, rotate: -4 }}
            whileInView={{ opacity: 1, x: 0, rotate: -2 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            viewport={{ once: false }}
            className="w-72 bg-white dark:bg-zinc-900/50 border border-red-200 dark:border-red-900/30 rounded-xl p-6 opacity-80 blur-[1px] grayscale-[0.5] hover:grayscale-0 hover:blur-0 hover:opacity-100 transition-all duration-300"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <span className="text-xs font-mono text-zinc-400">{t.landing.demo.placeA.label}</span>
            </div>
            <h4 className="font-bold text-lg text-zinc-800 dark:text-zinc-200 mb-2">{t.landing.demo.placeA.name}</h4>
            <ul className="space-y-2 text-sm text-zinc-500">
              <li className="flex items-center gap-2"><span className="text-red-400">×</span> {t.landing.demo.placeA.tag1}</li>
              <li className="flex items-center gap-2"><span className="text-red-400">×</span> {t.landing.demo.placeA.tag2}</li>
              <li className="flex items-center gap-2"><span className="text-red-400">×</span> {t.landing.demo.placeA.tag3}</li>
            </ul>
          </motion.div>

          {/* VS Badge */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center font-black text-sm border-4 border-zinc-50 dark:border-zinc-950">
            VS
          </div>

          {/* Card B: Winner */}
          <motion.div
            initial={{ opacity: 0, x: 50, rotate: 4 }}
            whileInView={{ opacity: 1, x: 0, rotate: 2 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            viewport={{ once: false }}
            className="w-80 bg-white dark:bg-zinc-900 border border-green-200 dark:border-green-800 rounded-xl p-8 shadow-2xl shadow-green-900/5 dark:shadow-green-500/5 scale-105 z-10 relative"
          >
            <div className="absolute -top-3 -right-3 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
              {t.landing.demo.placeB.winner}
            </div>
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-500" />
              </div>
              <span className="text-xs font-mono text-zinc-400">{t.landing.demo.placeB.label}</span>
            </div>
            <h4 className="font-bold text-xl text-zinc-900 dark:text-zinc-50 mb-2">{t.landing.demo.placeB.name}</h4>
            <ul className="space-y-3 text-sm text-zinc-600 dark:text-zinc-400">
              <li className="flex items-center gap-2"><span className="text-green-500">✓</span> {t.landing.demo.placeB.tag1}</li>
              <li className="flex items-center gap-2"><span className="text-green-500">✓</span> {t.landing.demo.placeB.tag2}</li>
              <li className="flex items-center gap-2"><span className="text-green-500">✓</span> {t.landing.demo.placeB.tag3}</li>
            </ul>
          </motion.div>
        </div>
      </section>

      {/* --- SLIDE 4: THE ACTION (Map & CTA) --- */}
      <section className="h-full w-full snap-start relative flex flex-col justify-center items-center px-6 overflow-hidden bg-white dark:bg-zinc-950 text-center">

        {/* Background Map Grid Pattern (Faint) */}
        <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white dark:to-zinc-950 z-0 pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <motion.h2
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="text-5xl md:text-7xl font-bold tracking-tighter text-zinc-900 dark:text-zinc-50 mb-8 whitespace-pre-line"
          >
            {t.landing.seeWholePicture}
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <Button
              onClick={() => router.push('/pro_mode')}
              className="h-14 px-10 rounded-full text-lg font-medium bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 hover:scale-105 transition-all duration-300 shadow-xl"
            >
              {t.landing.exploreMap}
            </Button>
          </motion.div>
        </div>
      </section>

    </div>
  );
}