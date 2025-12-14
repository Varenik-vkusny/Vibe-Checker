'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useNav } from '@/context/NavContext';
import { GitCompare, Map, Search, User, Sun, Moon, LogOut, ShieldCheck, Command } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
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
    { name: t.header.places, href: '/map' },
    { name: t.header.compare, href: '/compare' },
    { name: t.header.analysis, href: '/analysis' },
    { name: t.header.pro_mode, href: '/pro_mode' },
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

          {/* --- ZONE 2: NAV ISLAND (CENTER) - Hidden on Mobile --- */}
          <nav className="hidden md:flex items-center justify-center gap-1">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    px-4 py-1.5 rounded-full text-sm font-medium transition-all
                    ${active
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                    }
                  `}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* --- ZONE 3: ACTIONS (RIGHT) --- */}
          <div className="flex items-center justify-end gap-2 md:gap-4">

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-3">
              <LanguageSwitcher />

              {/* Command Hint */}
              <div className="hidden lg:flex items-center gap-1 px-1.5 py-0.5 border border-zinc-200 dark:border-zinc-800 rounded bg-zinc-50 dark:bg-zinc-900/50">
                <span className="text-xs text-zinc-400 font-medium font-mono flex items-center gap-0.5">
                  <Command className="w-3 h-3" />K
                </span>
              </div>

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

            {/* Mobile Actions: Theme + Language + Profile */}
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
      </header>

      {/* Mobile Fixed Bottom Nav - Floating Island */}
      <nav
        className={`
          md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50
          h-16 px-8
          bg-white/90 dark:bg-zinc-900/90 backdrop-blur-lg
          border border-zinc-200 dark:border-zinc-800
          shadow-xl shadow-zinc-200/50 dark:shadow-black/50
          rounded-full
          flex items-center gap-10
          transition-transform duration-300 cubic-bezier(0.32, 0.72, 0, 1)
          ${isNavHidden ? 'translate-y-[200%]' : 'translate-y-0'}
        `}
      >
        {[
          { name: 'Map', href: '/map', icon: Map },
          { name: 'Search', href: '/pro_mode', icon: Search },
          { name: 'Profile', href: '/profile', icon: User },
        ].map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                  relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300
                  ${active
                  ? 'bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 scale-110 shadow-md'
                  : 'text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }
                `}
            >
              <item.icon className="w-5 h-5" strokeWidth={2.5} />
              {active && (
                <span className="absolute -bottom-2 w-1 h-1 bg-zinc-900 dark:bg-zinc-50 rounded-full opacity-0"></span>
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
};