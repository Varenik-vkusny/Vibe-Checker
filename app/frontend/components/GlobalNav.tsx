'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useNav } from '@/context/NavContext'; 
import { GitCompare, Sparkles, User, Sun, Moon, Search, ShieldCheck, LogOut } from 'lucide-react';
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
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export const GlobalNav = () => {
  const pathname = usePathname();
  const { isNavHidden } = useNav(); 
  const { theme, setTheme } = useTheme();
  const { user, logout, isAuthenticated } = useAuth();
  const { t } = useLanguage();

  const isActive = (path: string) => pathname === path;

  // REMOVED "Places" (Map) link. Pro Mode is the entry.
  const desktopNavItems = [
    { name: t.header.compare, href: '/compare', icon: GitCompare },
    { name: t.header.analysis, href: '/analysis', icon: Sparkles },
    { name: t.header.pro_mode, href: '/pro_mode', icon: Search },
  ];

  // Simplified Mobile Dock
  const mobileNavItems = [
    { name: 'Pro Mode', href: '/pro_mode', icon: Search },
    { name: 'Compare', href: '/compare', icon: GitCompare },
    { name: 'Analyze', href: '/analysis', icon: Sparkles },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  return (
    <>
      <header className="flex fixed top-0 left-0 w-full h-16 border-b border-border bg-background/80 backdrop-blur-md z-50 px-6 items-center justify-between pr-[var(--removed-body-scroll-bar-size)]">
        
        <Link href="/" className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          VibeCheck
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {desktopNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary ${
                isActive(item.href) ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </Link>
          ))}
          {isAuthenticated && (
             <Link href="/profile" className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary ${isActive('/profile') ? 'text-primary' : 'text-muted-foreground'}`}>
               <User className="w-4 h-4" />
               <span>{t.header.profile}</span>
             </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label={t.header.toggleTheme}
          >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/avatars/01.png" alt={user?.first_name} />
                    <AvatarFallback>{user?.first_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                {user?.role === 'ADMIN' && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="cursor-pointer text-purple-600 focus:text-purple-600 focus:bg-purple-100 dark:focus:bg-purple-900/50">
                      <ShieldCheck className="mr-2 h-4 w-4" />
                      <span>Admin Panel</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>{t.header.profile}</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => logout()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{t.header.logout}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button variant="outline" size="sm" asChild>
               <Link href="/login">{t.header.signIn}</Link>
            </Button>
          )}
        </div>
      </header>

      <nav
        className={`
          md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[40]
          bg-neutral-900/90 backdrop-blur-xl border border-white/10
          rounded-full px-6 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.5)]
          transition-all duration-500 cubic-bezier(0.19, 1, 0.22, 1)
          ${isNavHidden ? 'translate-y-[200%] opacity-0' : 'translate-y-0 opacity-100'}
        `}
      >
        <ul className="flex items-center gap-8">
          {mobileNavItems.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`
                    flex flex-col items-center gap-1 transition-all duration-300
                    ${active ? 'text-primary scale-110' : 'text-neutral-400 hover:text-white'}
                  `}
                >
                  <item.icon
                    className={`w-6 h-6 ${active ? 'fill-primary/20 stroke-[2.5px]' : 'stroke-2'}`}
                  />
                  {active && (
                    <span className="absolute -bottom-2 w-1 h-1 bg-primary rounded-full animate-in fade-in" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
};