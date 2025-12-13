'use client';

import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { LogOut, Edit } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function Sidebar() {
  const { user, logout } = useAuth();

  const data = [
    { subject: 'Quiet', A: 80, fullMark: 100 },
    { subject: 'Cost', A: 60, fullMark: 100 },
    { subject: 'Wi-Fi', A: 90, fullMark: 100 },
    { subject: 'Social', A: 40, fullMark: 100 },
    { subject: 'Food', A: 70, fullMark: 100 },
  ];

  return (
    // Updated classes: w-full on mobile, fixed width on LG. Removed fixed heights causing cutoff.
    <aside className="w-full lg:w-80 flex flex-col gap-6 shrink-0">
      <Card className="p-6 flex flex-col items-center text-center space-y-4 glass-card overflow-hidden">
        <div className="relative">
          <Avatar className="h-24 w-24 border-4 border-background">
            <AvatarImage src="/avatars/01.png" alt={user?.first_name} />
            <AvatarFallback className="text-2xl">{user?.first_name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <Button size="icon" variant="secondary" className="absolute bottom-0 right-0 rounded-full h-8 w-8 shadow-sm">
            <Edit className="h-4 w-4" />
          </Button>
        </div>

        <div className="w-full break-words">
          <h1 className="text-2xl font-bold truncate">{user?.first_name} {user?.last_name}</h1>
          <p className="text-muted-foreground text-sm truncate">{user?.email}</p>
        </div>

        <div className="text-xs font-medium bg-secondary/50 px-3 py-1 rounded-full">
          Member since {new Date().getFullYear()}
        </div>

        <div className="flex w-full justify-between py-4 border-y border-border/50">
          <div className="flex flex-col w-1/3">
            <span className="text-lg font-bold">12</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Reviews</span>
          </div>
          <div className="w-px bg-border/50 h-auto self-stretch"></div>
           <div className="flex flex-col w-1/3">
            <span className="text-lg font-bold">34</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Saved</span>
          </div>
          <div className="w-px bg-border/50 h-auto self-stretch"></div>
           <div className="flex flex-col w-1/3">
            <span className="text-lg font-bold">9.8</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Level</span>
          </div>
        </div>

        <div className="w-full space-y-2">
          <h3 className="text-sm font-semibold text-left">Your Vibe Signature</h3>
          {/* Adjusted height for mobile to ensure chart fits */}
          <div className="h-[180px] w-full -ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }} />
                <Radar
                  name="Vibe"
                  dataKey="A"
                  stroke="var(--primary)"
                  fill="var(--primary)"
                  fillOpacity={0.2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-muted-foreground">You prefer <strong>Quiet</strong> & <strong>Productive</strong> spots.</p>
        </div>

        <Button variant="outline" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10 mb-2" onClick={() => logout()}>
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </Card>
    </aside>
  );
}