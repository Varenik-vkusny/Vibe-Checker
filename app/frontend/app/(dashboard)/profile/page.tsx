'use client';

import { Sidebar } from '@/components/layout/Sidebar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bookmark, Settings, Search, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/i18n/LanguageContext';

export default function ProfilePage() {
  const { user } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-6 max-w-[1440px] mx-auto min-h-[calc(100vh-72px)]">
      <Sidebar />
      
      <main className="flex-1">
        <Tabs defaultValue="saved" className="w-full">
          <TabsList className="grid w-full max-w-[400px] grid-cols-2 mb-8">
            <TabsTrigger value="saved" className="flex gap-2">
              <Bookmark className="h-4 w-4" />
              {t.profile.savedPlaces}
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex gap-2">
              <Settings className="h-4 w-4" />
              {t.profile.settings}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="saved" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">{t.profile.yourCollection}</h2>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder={t.profile.searchPlaceholder} className="pl-8" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
               {/* Mock Data */}
               {[
                 { title: "Brew & Code", vibe: "Work", score: 9.8, desc: "Quiet, fast Wi-Fi.", img: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=800" },
                 { title: "The Velvet Room", vibe: "Date", score: 9.2, desc: "Dim lighting, jazz.", img: null },
                 { title: "Sunny Side Cafe", vibe: "Chill", score: 8.9, desc: "Great brunch vibes.", img: "https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=800" }
               ].map((item, i) => (
                 <div key={i} className="group relative rounded-xl overflow-hidden border bg-card text-card-foreground shadow-sm h-64 flex flex-col justify-end p-4 transition-all hover:shadow-md" 
                      style={item.img ? { backgroundImage: `url(${item.img})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { backgroundColor: 'var(--card)' }}>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    
                    <div className="relative z-10 text-white">
                        <div className="flex gap-2 mb-2">
                            <span className="bg-white/20 backdrop-blur-md px-2 py-0.5 rounded text-xs font-bold">{item.score}</span>
                            <span className="bg-primary/80 backdrop-blur-md px-2 py-0.5 rounded text-xs">{item.vibe}</span>
                        </div>
                        <h3 className="text-lg font-bold">{item.title}</h3>
                        <p className="text-sm opacity-90">{item.desc}</p>
                    </div>
                    
                    <Button size="icon" variant="destructive" className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                 </div>
               ))}
            </div>
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardContent className="space-y-6 p-6">
                <div>
                   <h2 className="text-xl font-semibold mb-4">{t.profile.accountSettings}</h2>
                   <div className="grid gap-4">
                      <div className="grid gap-2">
                        <Label>{t.profile.displayName}</Label>
                        <Input defaultValue={user?.first_name} />
                      </div>
                      <div className="grid gap-2">
                        <Label>{t.profile.email}</Label>
                        <Input defaultValue={user?.email} disabled />
                      </div>
                   </div>
                </div>

                <div className="flex gap-4">
                  <Button>{t.profile.saveChanges}</Button>
                  <Button variant="outline" className="text-destructive border-destructive hover:bg-destructive/10">{t.profile.deleteAccount}</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
