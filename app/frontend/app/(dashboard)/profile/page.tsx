'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import {
  LogOut,
  Map as MapIcon,
  Navigation,
  Globe,
  Locate,
  X,
  CreditCard,
  Sun,
  Moon,
  Laptop
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { VibeSlider } from './_components/VibeSlider';
import { NavigatorCard } from './_components/NavigatorCard';
import { cn } from '@/lib/utils'; // Assuming cn exists

const getTimeGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
};

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguage(); // Assuming setLanguage works this way
  const router = useRouter();

  // --- STATE ---
  const [greeting, setGreeting] = useState('');

  // Vibe DNA
  const [vibeDNA, setVibeDNA] = useState({
    noise: 50,
    light: 50,
    social: 50,
    budget: 50
  });

  // Negative Prompts
  const [negativePrompts, setNegativePrompts] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // System
  const [navigator, setNavigator] = useState('google');

  // --- EFFECT: Hydration & LocalStorage ---
  useEffect(() => {
    setGreeting(getTimeGreeting());

    // Load from local storage (Mock)
    const savedNav = localStorage.getItem('navigator_preference');
    if (savedNav) setNavigator(savedNav);

    // Mock Vibe DNA loading
    // In a real app, this would fetch from DB
  }, []);

  useEffect(() => {
    if (navigator) {
      localStorage.setItem('navigator_preference', navigator);
    }
  }, [navigator]);

  // --- HANDLERS ---
  const handleVibeChange = (key: keyof typeof vibeDNA, value: number) => {
    setVibeDNA(prev => ({ ...prev, [key]: value }));
  };

  const addTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!negativePrompts.includes(tagInput.trim())) {
        setNegativePrompts([...negativePrompts, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setNegativePrompts(negativePrompts.filter(t => t !== tag));
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white pt-6 pb-20 px-6 font-sans">
      <div className="max-w-5xl mx-auto space-y-12">

        {/* --- 1. HEADER (Greeting Console) --- */}
        <header className="border-b border-zinc-200 dark:border-zinc-800 pb-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white mb-2">
            {greeting}, {user?.first_name || 'User'}
          </h1>
        </header>

        {/* --- MAIN GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">

          {/* --- LEFT COLUMN: "THE BRAIN" (7 Cols) --- */}
          <div className="md:col-span-12 lg:col-span-7 space-y-10 animate-in fade-in slide-in-from-left-4 duration-700 delay-100">

            {/* MODULE A: VIBE DNA */}
            <section className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white uppercase tracking-tight">Vibe DNA</h2>
                <p className="text-zinc-500 text-sm">Fine-tune the weights of your discovery engine.</p>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 md:p-8 space-y-8">
                <VibeSlider
                  label="Acoustic Profile"
                  leftLabel="Library Silence"
                  rightLabel="Stadium Concert"
                  value={vibeDNA.noise}
                  onChange={(val) => handleVibeChange('noise', val)}
                />
                <VibeSlider
                  label="Luminosity Index"
                  leftLabel="Dim / Intimate"
                  rightLabel="Bright / Daylight"
                  value={vibeDNA.light}
                  onChange={(val) => handleVibeChange('light', val)}
                />
                <VibeSlider
                  label="Social Density"
                  leftLabel="Solo"
                  rightLabel="Packed Crowd"
                  value={vibeDNA.social}
                  onChange={(val) => handleVibeChange('social', val)}
                />
                <VibeSlider
                  label="Fiscal Limit"
                  leftLabel="Saver"
                  rightLabel="Splurger"
                  value={vibeDNA.budget}
                  onChange={(val) => handleVibeChange('budget', val)}
                />
              </div>
            </section>

            {/* MODULE B: NEGATIVE PROMPTS */}
            <section className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white uppercase tracking-tight">Vibe Killers (Hard Block)</h2>
                <p className="text-zinc-500 text-sm">The AI will strictly avoid places with these attributes.</p>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 md:p-8 space-y-4">
                <Input
                  placeholder="Type 'Hookah' + Enter..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={addTag}
                  className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus-visible:ring-zinc-700 h-12"
                />
                <div className="flex flex-wrap gap-2 min-h-[40px]">
                  {negativePrompts.length === 0 && (
                    <span className="text-zinc-700 text-xs italic py-2">No active blocks configured.</span>
                  )}
                  {negativePrompts.map((tag) => (
                    <Badge
                      key={tag}
                      className="bg-red-950/30 border-red-900/50 text-red-500 hover:bg-red-900/50 hover:text-red-400 pl-3 pr-1 py-1 gap-1 text-xs uppercase"
                    >
                      {tag}
                      <button onClick={() => removeTag(tag)} className="ml-1 hover:text-white"><X className="w-3 h-3" /></button>
                    </Badge>
                  ))}
                </div>
              </div>
            </section>

          </div>

          {/* --- RIGHT COLUMN: "THE SYSTEM" (5 Cols) --- */}
          <div className="md:col-span-12 lg:col-span-5 space-y-10 animate-in fade-in slide-in-from-right-4 duration-700 delay-200">

            {/* MODULE C: NAVIGATOR PROTOCOL */}
            <section className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white uppercase tracking-tight">Navigator Protocol</h2>
                <p className="text-zinc-500 text-sm">Select your default geospatial provider.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <NavigatorCard
                  id="google"
                  name="Google Maps"
                  selected={navigator === 'google'}
                  onSelect={setNavigator}
                  imageSrc="/Google_Logo.svg"
                />
                <NavigatorCard
                  id="yandex"
                  name="Yandex"
                  selected={navigator === 'yandex'}
                  onSelect={setNavigator}
                  imageSrc="/Yandex_Logo.svg"
                />
                <NavigatorCard
                  id="2gis"
                  name="2GIS"
                  selected={navigator === '2gis'}
                  onSelect={setNavigator}
                  imageSrc="/2GIS_Logo.svg"
                />
                <NavigatorCard
                  id="apple"
                  name="Apple Maps"
                  selected={navigator === 'apple'}
                  onSelect={setNavigator}
                  imageSrc="/Apple_Logo.svg"
                />
              </div>
            </section>

            {/* MODULE D: INTERFACE SETTINGS */}
            <section className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white uppercase tracking-tight">Interface</h2>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-6">

                {/* Theme Control */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Theme</span>
                  <div className="flex items-center p-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                    <button onClick={() => setTheme('light')} className={cn("p-2 rounded-md transition-all", theme === 'light' ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-400")}>
                      <Sun className="w-4 h-4" />
                    </button>
                    <button onClick={() => setTheme('dark')} className={cn("p-2 rounded-md transition-all", theme === 'dark' ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-400")}>
                      <Moon className="w-4 h-4" />
                    </button>
                    <button onClick={() => setTheme('system')} className={cn("p-2 rounded-md transition-all", theme === 'system' ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-400")}>
                      <Laptop className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Language Control */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">Language</span>
                  <div className="flex items-center p-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                    <button onClick={() => setLanguage('en')} className={cn("px-3 py-1.5 rounded-md text-xs font-bold transition-all", language === 'en' ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-400")}>
                      EN
                    </button>
                    <button onClick={() => setLanguage('ru')} className={cn("px-3 py-1.5 rounded-md text-xs font-bold transition-all", language === 'ru' ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-400")}>
                      RU
                    </button>
                    <button onClick={() => setLanguage('kz')} className={cn("px-3 py-1.5 rounded-md text-xs font-bold transition-all", language === 'kz' ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-400")}>
                      KZ
                    </button>
                  </div>
                </div>

              </div>

              {/* Sign Out */}
              <Button
                variant="outline"
                onClick={handleLogout}
                className="w-full border-red-900/30 bg-red-950/10 text-red-500 hover:bg-red-950/30 hover:border-red-900/50 hover:text-red-400 h-12 uppercase tracking-widest font-bold"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </section>

          </div>
        </div>

      </div>
    </div>
  );
}
