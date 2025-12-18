'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, BarChart3, Terminal, LogOut, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { logout } = useAuth();

    const { t } = useLanguage();

    const links = [
        { href: '/admin', label: t.admin.dashboard, icon: LayoutDashboard },
        { href: '/admin/users', label: t.admin.users, icon: Users },
        { href: '/admin/analyses', label: t.admin.analyses, icon: BarChart3 },
        { href: '/admin/system-logs', label: t.admin.logs, icon: FileText },
    ];

    return (
        <div className="h-full w-full flex overflow-hidden bg-zinc-50 dark:bg-black font-sans">
            <aside className="w-64 shrink-0 flex flex-col h-full border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/50 backdrop-blur-xl">
                <div className="flex h-full flex-col">
                    <div className="flex h-16 items-center border-b border-zinc-200 dark:border-zinc-800 px-6">
                        <span className="text-lg font-semibold tracking-tight">Admin Panel</span>
                    </div>

                    <nav className="flex-1 space-y-1 p-4">
                        {links.map((link) => {
                            const Icon = link.icon;
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={cn(
                                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                                        isActive
                                            ? 'bg-zinc-900 text-white dark:bg-white dark:text-black shadow-sm'
                                            : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100'
                                    )}
                                >
                                    <Icon size={18} />
                                    {link.label}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="border-t border-zinc-200 dark:border-zinc-800 p-4">
                        <Button
                            variant="outline"
                            className="w-full justify-start gap-2 border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                            onClick={logout}
                        >
                            <LogOut size={16} />
                            Sign Out
                        </Button>
                    </div>
                </div>
            </aside>

            <main className="flex-1 h-full overflow-y-auto p-8">
                <div className="mx-auto max-w-6xl space-y-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
