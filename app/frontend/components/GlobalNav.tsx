'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useNav } from '@/context/NavContext';
import { GitCompare, Map as MapIcon, Search, User, Sun, Moon, LogOut, ShieldCheck, Command, Sparkles, Bookmark, BarChart2, Home } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { LanguageSwitcher } from './layout/LanguageSwitcher';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const GlobalNav = () => {
  const pathname = usePathname();
  const { isNavHidden } = useNav();
  const { theme, setTheme } = useTheme();
  const { user, logout, isAuthenticated } = useAuth();
  const { t } = useLanguage();

  const isActive = (path: string) => pathname === path;

  // Hybrid Navigation Logic
  // Map & Pro Mode -> Floating Island (Exploration Mode)
  // Analysis, Profile, Compare -> Fixed Bottom Bar (Data Mode)
  const isExplorationMode = pathname === '/map' || pathname === '/pro_mode' || pathname === '/';

  // Helper to get Page Name for Breadcrumb
  const getPageTitle = (path: string) => {
    if (path === '/') return 'Home';
    if (path === '/map') return 'Map';
    if (path === '/pro_mode') return 'Pro Mode';
    if (path === '/compare') return 'Compare';
    if (path === '/profile') return 'Profile';
    if (path === '/analysis') return 'Analysis';
    return 'Page';
  }

  const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'AI Analysis', href: '/analysis', icon: BarChart2 },
    { name: 'Search', href: '/pro_mode', icon: Sparkles },
    { name: 'Compare', href: '/compare', icon: GitCompare },
    { name: 'Library', href: '/bookmarks', icon: Bookmark },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 w-full h-14 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md z-50 border-b border-zinc-200 dark:border-zinc-800">
        <div className="h-full px-4 md:px-6 grid grid-cols-[auto_1fr_auto] md:grid-cols-[1fr_auto_1fr] items-center gap-4">

          {/* --- ZONE 1: CONTEXT (LEFT) --- */}
          <div className="flex items-center justify-start gap-3">
            <Link href="/" className="flex items-center gap-3 group">
              <img src="/logo.svg" alt="VibeCheck Logo" className="w-6 h-6 rounded dark:invert transition-transform group-hover:scale-105" />
              <span className="text-zinc-300 font-light text-lg">/</span>
              <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{getPageTitle(pathname)}</span>
            </Link>
          </div>

          {/* --- ZONE 2: NAV ISLAND (CENTER) - Hidden on Mobile, Visible on Desktop --- */}
          <nav className="hidden md:flex items-center justify-center gap-1">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn( // Using cn here if available, or template literals as before. File imports `cn`? No, it doesn't. I should check imports. It uses template literals.
                    "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                    active
                      ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-white"
                      : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 dark:hover:text-zinc-200 dark:hover:bg-zinc-800/50"
                  )}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* --- ZONE 3: ACTIONS (RIGHT) --- */}
          <div className="flex items-center justify-end gap-2 md:gap-4">

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-3">
              <LanguageSwitcher />

              <div className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-800 mx-1"></div>

              {/* Segmented Theme Toggle */}
              <div className="flex items-center p-0.5 bg-zinc-100 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 rounded-full">
                <button
                  onClick={() => setTheme('light')}
                  className={`p-1.5 rounded-full transition-all ${theme === 'light' ? 'bg-white shadow-sm text-zinc-900' : 'text-zinc-400 hover:text-zinc-600'}`}
                >
                  <Sun className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`p-1.5 rounded-full transition-all ${theme === 'dark' ? 'bg-zinc-800 shadow-sm text-zinc-100' : 'text-zinc-400 hover:text-zinc-600'}`}
                >
                  <Moon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Mobile Actions: Theme + Language */}
            <div className="flex md:hidden items-center gap-1">
              <LanguageSwitcher />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="rounded-full w-9 h-9"
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>
            </div>

            {/* Profile Avatar / Auth */}
            {/* Profile Avatar / Auth - Desktop Only */}
            <div className="hidden md:block">
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0 overflow-hidden ring-1 ring-zinc-200 dark:ring-zinc-800 hover:ring-zinc-400 dark:hover:ring-zinc-600 transition-all">
                      <Avatar className="h-full w-full">
                        <AvatarImage src="/avatars/01.png" alt={user?.first_name} />
                        <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold text-xs">{user?.first_name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900" align="end" forceMount>
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{user?.first_name} {user?.last_name}</p>
                      <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
                    </div>
                    <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />
                    {user?.role === 'ADMIN' && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin">
                          <ShieldCheck className="mr-2 h-4 w-4" />
                          <span>Admin Panel</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link href="/profile">
                        <User className="mr-2 h-4 w-4" />
                        <span>{t.header.profile}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />
                    <DropdownMenuItem onClick={() => logout()} className="text-red-600 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-900/10">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>{t.header.logout}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button variant="default" size="sm" className="rounded-full px-4 h-8 font-medium bg-zinc-900 dark:bg-zinc-50 text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200" asChild>
                  <Link href="/login">{t.header.signIn}</Link>
                </Button>
              )}
            </div>

          </div>
        </div>
      </header>

      {/* --- MOBILE NAVIGATION --- */}

      {/* 1. FLOATING ISLAND (Exploration Mode: Map, Pro Mode) */}
      {/* 1. FLOATING ISLAND (Exploration Mode: Map, Pro Mode) */}
      {/* --- MOBILE FIXED NAV (5 Pillars) --- */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full h-16 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 z-50 pb-[env(safe-area-inset-bottom)]">
        <div className="grid grid-cols-5 h-full items-center px-1">

          {/* 1. Analysis */}
          <Link href="/analysis" className={`flex flex-col items-center justify-center gap-1 h-full ${isActive('/analysis') ? 'text-zinc-900 dark:text-zinc-50' : 'text-zinc-400'}`}>
            <BarChart2 className="w-5 h-5" />
            <span className="text-[10px] font-medium">Analysis</span>
          </Link>

          {/* 2. Compare */}
          <Link href="/compare" className={`flex flex-col items-center justify-center gap-1 h-full ${isActive('/compare') ? 'text-zinc-900 dark:text-zinc-50' : 'text-zinc-400'}`}>
            <GitCompare className="w-5 h-5" />
            <span className="text-[10px] font-medium">Compare</span>
          </Link>

          {/* 3. SEARCH (Center Focus) */}
          <Link href="/pro_mode" className="flex flex-col items-center justify-center -mt-6">
            <div className={`
                 w-14 h-14 rounded-full 
                 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 
                 shadow-lg shadow-zinc-900/20 dark:shadow-zinc-50/20
                 ring-4 ring-white dark:ring-zinc-950
                 flex items-center justify-center
                 transition-transform active:scale-95
              `}>
              <Sparkles className="w-6 h-6" strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-bold mt-1 text-zinc-900 dark:text-zinc-50">Search</span>
          </Link>

          {/* 4. Bookmarks */}
          <Link href="/bookmarks" className={`flex flex-col items-center justify-center gap-1 h-full ${isActive('/bookmarks') ? 'text-zinc-900 dark:text-zinc-50' : 'text-zinc-400'}`}>
            <Bookmark className="w-5 h-5" />
            <span className="text-[10px] font-medium">Saved</span>
          </Link>

          {/* 5. Profile */}
          <Link href="/profile" className={`flex flex-col items-center justify-center gap-1 h-full ${isActive('/profile/settings') ? 'text-zinc-900 dark:text-zinc-50' : 'text-zinc-400'}`}>
            <User className="w-5 h-5" />
            <span className="text-[10px] font-medium">Profile</span>
          </Link>

        </div>
      </nav>

    </>
  );
};