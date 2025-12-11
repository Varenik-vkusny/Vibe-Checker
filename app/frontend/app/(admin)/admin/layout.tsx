'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useEffect } from 'react';
import { ShieldAlert, Activity, Users, FileText, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && user?.role !== 'ADMIN') {
      router.push('/profile'); 
    }
  }, [user, loading, router]);

  if (loading || user?.role !== 'ADMIN') return <div className="p-10 text-center">Verifying Access...</div>;

  const menuItems = [
    { href: '/admin', label: 'Dashboard', icon: Activity },
    { href: '/admin/users', label: 'Database Roles', icon: Users },
    { href: '/admin/logs', label: 'System Logs', icon: FileText },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card p-6 flex flex-col gap-6">
        <div className="flex items-center gap-2 font-bold text-xl px-2">
          <ShieldAlert className="text-primary" />
          VibeCheck<span className="text-xs text-muted-foreground self-end mb-1">Admin</span>
        </div>
        
        <nav className="flex flex-col gap-2">
          {menuItems.map((item) => {
             const Icon = item.icon;
             const isActive = pathname === item.href;
             return (
               <Link key={item.href} href={item.href}>
                 <Button variant={isActive ? "secondary" : "ghost"} className="w-full justify-start gap-2">
                   <Icon className="w-4 h-4" />
                   {item.label}
                 </Button>
               </Link>
             )
          })}
        </nav>

        <div className="mt-auto">
            <Link href="/profile">
                <Button variant="outline" className="w-full gap-2">
                    <ArrowLeft className="w-4 h-4"/> Back to App
                </Button>
            </Link>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}