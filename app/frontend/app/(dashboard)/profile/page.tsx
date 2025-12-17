'use client';

import { useState, useEffect, useMemo } from 'react';
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
  Laptop,
  Loader2,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { VibeSlider } from './_components/VibeSlider';
import { NavigatorCard } from './_components/NavigatorCard';
import { cn } from '@/lib/utils';
import { preferencesService } from '@/services/preferences';
import { useDebounce } from '@/hooks/useDebounce';

const getTimeGreeting = (t: any) => {
  const hour = new Date().getHours();
  if (hour < 12) return t.profile.greeting;
  if (hour < 18) return t.profile.greetingAfternoon;
  return t.profile.greetingEvening;
};

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const router = useRouter();

  const { t } = useLanguage();

  const [greeting, setGreeting] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [vibeDNA, setVibeDNA] = useState({
    noise: 50,
    light: 50,
    social: 50,
    budget: 50
  });

  const [negativePrompts, setNegativePrompts] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const [navigator, setNavigator] = useState('google');

  const debouncedVibeDNA = useDebounce(vibeDNA, 1000);
  const debouncedPrompts = useDebounce(negativePrompts, 1000);

  useEffect(() => {
    setGreeting(getTimeGreeting(t));

    const loadPreferences = async () => {
      try {
        const prefs = await preferencesService.getPreferences();
        setVibeDNA({
          noise: prefs.acoustics,
          light: prefs.lighting,
          social: prefs.crowdedness,
          budget: prefs.budget
        });
        setNegativePrompts(prefs.restrictions);
      } catch (error) {
        console.error('Failed to load preferences:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();

    const savedNav = localStorage.getItem('navigator_preference');
    if (savedNav) setNavigator(savedNav);
  }, [t]);

  useEffect(() => {
    if (navigator) {
      localStorage.setItem('navigator_preference', navigator);
    }
  }, [navigator]);

  useEffect(() => {
    if (!isLoading) {
      const savePreferences = async () => {
        setIsSaving(true);
        setSaveSuccess(false);
        try {
          await preferencesService.updatePreferences({
            acoustics: debouncedVibeDNA.noise,
            lighting: debouncedVibeDNA.light,
            crowdedness: debouncedVibeDNA.social,
            budget: debouncedVibeDNA.budget,
            restrictions: debouncedPrompts
          });
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 2000);
        } catch (error) {
          console.error('Failed to save preferences:', error);
        } finally {
          setIsSaving(false);
        }
      };
      savePreferences();
    }
  }, [debouncedVibeDNA, debouncedPrompts, isLoading]);

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

        <header className="border-b border-zinc-200 dark:border-zinc-800 pb-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900 dark:text-white mb-2">
              {greeting}, {user?.first_name || 'User'}
            </h1>
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              {isLoading && (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading...</span>
                </>
              )}
              {!isLoading && isSaving && (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              )}
              {!isLoading && !isSaving && saveSuccess && (
                <>
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-green-500">Saved</span>
                </>
              )}
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12">

          <div className="md:col-span-12 lg:col-span-7 space-y-10 animate-in fade-in slide-in-from-left-4 duration-700 delay-100">

            <section className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white uppercase tracking-tight">{t.profile.vibeDNA.title}</h2>
                <p className="text-zinc-500 text-sm">{t.profile.vibeDNA.subtitle}</p>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 md:p-8 space-y-8">
                <VibeSlider
                  label={t.profile.vibeDNA.noise.label}
                  leftLabel={t.profile.vibeDNA.noise.left}
                  rightLabel={t.profile.vibeDNA.noise.right}
                  value={vibeDNA.noise}
                  onChange={(val) => handleVibeChange('noise', val)}
                />
                <VibeSlider
                  label={t.profile.vibeDNA.light.label}
                  leftLabel={t.profile.vibeDNA.light.left}
                  rightLabel={t.profile.vibeDNA.light.right}
                  value={vibeDNA.light}
                  onChange={(val) => handleVibeChange('light', val)}
                />
                <VibeSlider
                  label={t.profile.vibeDNA.social.label}
                  leftLabel={t.profile.vibeDNA.social.left}
                  rightLabel={t.profile.vibeDNA.social.right}
                  value={vibeDNA.social}
                  onChange={(val) => handleVibeChange('social', val)}
                />
                <VibeSlider
                  label={t.profile.vibeDNA.budget.label}
                  leftLabel={t.profile.vibeDNA.budget.left}
                  rightLabel={t.profile.vibeDNA.budget.right}
                  value={vibeDNA.budget}
                  onChange={(val) => handleVibeChange('budget', val)}
                />
              </div>
            </section>

            <section className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white uppercase tracking-tight">{t.profile.vibeKillers.title}</h2>
                <p className="text-zinc-500 text-sm">{t.profile.vibeKillers.subtitle}</p>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 md:p-8 space-y-4">
                <Input
                  placeholder={t.profile.vibeKillers.placeholder}
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={addTag}
                  className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus-visible:ring-zinc-700 h-12"
                />
                <div className="flex flex-wrap gap-2 min-h-[40px]">
                  {negativePrompts.length === 0 && (
                    <span className="text-zinc-700 text-xs italic py-2">{t.profile.vibeKillers.empty}</span>
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

          <div className="md:col-span-12 lg:col-span-5 space-y-10 animate-in fade-in slide-in-from-right-4 duration-700 delay-200">

            <section className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white uppercase tracking-tight">{t.profile.navigator.title}</h2>
                <p className="text-zinc-500 text-sm">{t.profile.navigator.subtitle}</p>
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

            <section className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white uppercase tracking-tight">{t.profile.interface.title}</h2>
                <p className="text-zinc-500 text-sm">{t.profile.interface.subtitle}</p>
              </div>

              <div className="bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 space-y-6">

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{t.profile.interface.theme}</span>
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

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{t.profile.interface.language}</span>
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

              <Button
                variant="outline"
                onClick={handleLogout}
                className="w-full border-red-900/30 bg-red-950/10 text-red-500 hover:bg-red-950/30 hover:border-red-900/50 hover:text-red-400 h-12 uppercase tracking-widest font-bold"
              >
                <LogOut className="w-4 h-4 mr-2" />
                {t.header.logout}
              </Button>
            </section>

          </div>
        </div>

      </div>
    </div>
  );
}
