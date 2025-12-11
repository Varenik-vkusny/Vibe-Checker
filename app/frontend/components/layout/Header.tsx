'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Map, GitCompare, Sparkles, User, Sun, Moon, LogOut, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function Header() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user, logout, isAuthenticated } = useAuth();
  const { t } = useLanguage();

  const isActive = (path: string) => pathname === path ? 'text-primary' : 'text-muted-foreground';

  return (
    <header className="h-[72px] border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-6">
      <Link href="/" className="text-xl font-bold tracking-tight">
        VibeCheck
      </Link>

      <nav className="hidden md:flex items-center gap-8">
        <Link href="/map" className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary ${isActive('/map')}`}>
          <Map className="w-4 h-4" />
          <span>{t.header.places}</span>
        </Link>
        <Link href="/compare" className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary ${isActive('/compare')}`}>
          <GitCompare className="w-4 h-4" />
          <span>{t.header.compare}</span>
        </Link>
        <Link href="/analysis" className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary ${isActive('/analysis')}`}>
          <Sparkles className="w-4 h-4" />
          <span>{t.header.analysis}</span>
        </Link>
        {isAuthenticated && (
          <Link href="/profile" className={`flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary ${isActive('/profile')}`}>
            <User className="w-4 h-4" />
            <span>{t.header.profile}</span>
          </Link>
        )}
      </nav>

      <div className="flex items-center gap-4">
        <LanguageSwitcher />
        <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={t.header.toggleTheme}>
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
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
              <DropdownMenuItem onClick={() => logout()}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>{t.header.logout}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link href="/login">
            <Button variant="outline">{t.header.signIn}</Button>
          </Link>
        )}
      </div>
    </header>
  );
}
