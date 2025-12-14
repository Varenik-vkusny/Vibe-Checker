'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useNav } from '@/context/NavContext';
import { GitCompare, Sparkles, User, Sun, Moon, Search, ShieldCheck, LogOut, Map } from 'lucide-react';
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

  const mobileNavItems = [
    { name: 'Places', href: '/map', icon: Map },
    { name: 'Pro Mode', href: '/pro_mode', icon: Search },
    { name: 'Compare', href: '/compare', icon: GitCompare },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  return (
    <>
      <header className="fixed top-0 left-0 w-full h-16 bg-background z-50 px-4 md:px-8 flex items-center justify-between transition-all duration-300 shadow-sm dark:shadow-none dark:border-b dark:border-zinc-900 border-b border-zinc-100">

        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">V</div>
          <span className="font-bold text-lg tracking-tight hidden md:block">VibeCheck</span>
        </Link>

        {/* Industrial Pill Nav - Clean, no border */}
        <nav className="hidden md:flex items-center gap-1 bg-secondary/50 p-1 rounded-full">
          {[
            { name: t.header.places, href: '/map' },
            { name: t.header.compare, href: '/compare' },
            { name: t.header.analysis, href: '/analysis' },
            { name: t.header.pro_mode, href: '/pro_mode' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${isActive(item.href)
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <LanguageSwitcher />
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="rounded-lg w-9 h-9"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full ml-1 p-0 overflow-hidden ring-1 ring-border hover:ring-primary transition-all">
                  <Avatar className="h-full w-full">
                    <AvatarImage src="/avatars/01.png" alt={user?.first_name} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">{user?.first_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 border-border bg-card" align="end" forceMount>
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user?.first_name} {user?.last_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                </div>
                <DropdownMenuSeparator className="bg-border" />
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
                <DropdownMenuSeparator className="bg-border" />
                <DropdownMenuItem onClick={() => logout()} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t.header.logout}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="default" size="sm" className="rounded-md px-5 h-9 font-medium ml-2" asChild>
              <Link href="/login">{t.header.signIn}</Link>
            </Button>
          )}
        </div>
      </header>

      {/* Mobile Fixed Bottom Nav - Industrial Solid */}
      {/* Mobile Floating Island Dock - Industrial Vercel Style */}
      <nav
        className={`
          md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50
          h-16 px-8
          bg-zinc-900 text-white border border-zinc-800 shadow-2xl shadow-black/40
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
                  ? 'bg-white text-black scale-110 shadow-lg shadow-white/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                }
                `}
            >
              <item.icon className="w-5 h-5" strokeWidth={2.5} />
              {active && (
                <span className="absolute -bottom-2 w-1 h-1 bg-white rounded-full opacity-0"></span>
              )}
            </Link>
          );
        })}
      </nav>
    </>
  );
};