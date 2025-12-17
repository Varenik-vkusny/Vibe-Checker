'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Map, GitCompare, Sparkles, User } from 'lucide-react';

interface MobileNavDockProps {
  isHidden: boolean; // Проп чтобы прятать меню, когда открыта шторка
}

export const MobileNavDock = ({ isHidden }: MobileNavDockProps) => {
  const pathname = usePathname();

  const navItems = [
    { name: 'Places', href: '/map', icon: Map },
    { name: 'Compare', href: '/compare', icon: GitCompare },
    { name: 'AI Analysis', href: '/pro_mode', icon: Sparkles }, // или pro.html
    { name: 'Profile', href: '/profile', icon: User },
  ];

  return (
    <nav 
      className={`
        md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-[40]
        bg-black/80 backdrop-blur-xl border border-white/10
        rounded-full px-6 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.4)]
        transition-all duration-500 cubic-bezier(0.19, 1, 0.22, 1)
        ${isHidden ? 'translate-y-[200%] opacity-0' : 'translate-y-0 opacity-100'}
      `}
    >
      <ul className="flex items-center gap-8">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          
          return (
            <li key={item.name}>
              <Link 
                href={item.href}
                className={`
                  flex flex-col items-center gap-1 transition-colors
                  ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-white'}
                `}
              >
                <item.icon 
                  className={`w-6 h-6 ${isActive ? 'fill-primary/20' : ''}`} 
                  strokeWidth={isActive ? 2.5 : 2}
                />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};