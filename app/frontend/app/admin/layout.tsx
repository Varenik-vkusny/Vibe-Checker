'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, BarChart3, Terminal, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { logout } = useAuth();

    const links = [
        { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/admin/users', label: 'Users', icon: Users },
        { href: '/admin/analyses', label: 'Analyses', icon: BarChart3 },
        { href: '/admin/system-logs', label: 'System Logs', icon: Terminal },
    ];

    return (
        <div className="flex min-h-screen bg-zinc-50 dark:bg-black font-sans">
            {/* Sidebar */}
            <aside className="fixed inset-y-0 left-0 z-50 w-64 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/50 backdrop-blur-xl">
                <div className="flex h-full flex-col">
                    {/* Header */}
                    <div className="flex h-16 items-center border-b border-zinc-200 dark:border-zinc-800 px-6">
                        <span className="text-lg font-semibold tracking-tight">Admin OS</span>
                    </div>

                    {/* Navigation */}
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

                    {/* Footer */}
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

            {/* Main Content */}
            <main className="ml-64 flex-1 p-8">
                <div className="mx-auto max-w-6xl space-y-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
