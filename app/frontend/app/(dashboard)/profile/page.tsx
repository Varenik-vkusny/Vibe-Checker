'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useRouter } from 'next/navigation';
import {
  Settings, LogOut, MapPin, Star, Library,
  TrendingUp, Info, X, MoreHorizontal, Check, Trash2
} from 'lucide-react';

// UI Components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Recharts
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

// --- MOCK DATA ---
const VIBE_DATA = [
  { subject: 'Quick', A: 120, fullMark: 150 },
  { subject: 'Quiet', A: 98, fullMark: 150 },
  { subject: 'Value', A: 86, fullMark: 150 },
  { subject: 'Cozy', A: 99, fullMark: 150 },
  { subject: 'Social', A: 85, fullMark: 150 },
  { subject: 'Late', A: 65, fullMark: 150 },
];

const INITIAL_SAVED_PLACES = [
  { id: 1, title: "Brew & Code", score: 9.8, tags: ["Work", "Coffee"], img: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=800" },
  { id: 2, title: "The Velvet Room", score: 9.2, tags: ["Date", "Jazz"], img: "https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=800" },
  { id: 3, title: "Sunny Side", score: 8.9, tags: ["Brunch", "Sunny"], img: "https://images.unsplash.com/photo-1600093463592-8e36ae95ef56?q=80&w=800" },
  { id: 4, title: "Night Owl", score: 8.5, tags: ["Late", "Bar"], img: "https://images.unsplash.com/photo-1514362545857-3bc16549766b?q=80&w=800" },
];

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  // State
  const [tags, setTags] = useState(['Quiet Atmosphere', 'Strong Coffee', 'Late Night', 'Fast Wifi']);
  const [savedPlaces, setSavedPlaces] = useState(INITIAL_SAVED_PLACES);

  // Handlers
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const addTag = (newTag: string) => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
    }
  };

  const deletePlace = (id: number) => {
    setSavedPlaces(savedPlaces.filter(p => p.id !== id));
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleSettings = () => {
    alert("Settings panel would open here.");
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-4 md:p-8 pt-24 max-w-full overflow-x-hidden">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* --- LEFT COLUMN: IDENTITY CARD (4 cols) --- */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">

            {/* Header / Avatar */}
            <div className="flex flex-col items-center text-center mb-6">
              <Avatar className="w-24 h-24 mb-4 border-2 border-zinc-100 dark:border-zinc-800 shadow-sm">
                <AvatarImage src="/avatars/01.png" />
                <AvatarFallback className="text-2xl font-bold bg-zinc-100 dark:bg-zinc-800">{user?.first_name?.[0]}</AvatarFallback>
              </Avatar>
              <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">{user?.first_name} {user?.last_name}</h1>
              <p className="text-sm text-zinc-500">{user?.email}</p>
              <p className="text-xs font-mono text-zinc-400 mt-2">Member since Dec 2024</p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 gap-4 py-6 border-t border-b border-zinc-100 dark:border-zinc-800 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{savedPlaces.length}</div>
                <div className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Saved</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">12</div>
                <div className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Reviews</div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button
                variant="outline"
                onClick={handleSettings}
                className="w-full justify-start rounded-lg font-medium text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                <Settings className="w-4 h-4 mr-3 text-zinc-400" />
                Settings
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start rounded-lg font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-3" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>

        {/* --- RIGHT COLUMN: MAIN CONTENT (8 cols) --- */}
        <div className="lg:col-span-8 space-y-8">

          {/* 1. VIBE MODEL */}
          <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
            {/* Mobile: Accordion / Desktop: Block */}
            <div className="block md:hidden">
              <Accordion type="single" collapsible defaultValue="vibe-model">
                <AccordionItem value="vibe-model" className="border-none">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
                      <TrendingUp className="w-4 h-4 text-indigo-500" />
                      <span className="font-bold">Your Vibe Model</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <VibeModelContent tags={tags} removeTag={removeTag} addTag={addTag} isMobile={true} />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            <div className="hidden md:block p-6">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-5 h-5 text-indigo-500" />
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Your Vibe Model</h2>
                <Info className="w-4 h-4 text-zinc-400" />
              </div>
              <VibeModelContent tags={tags} removeTag={removeTag} addTag={addTag} isMobile={false} />
            </div>
          </section>

          {/* 2. COLLECTIONS */}
          <section>
            <Tabs defaultValue="saved" className="w-full">
              <div className="flex items-center justify-between mb-6">
                <TabsList className="bg-transparent p-0 h-auto space-x-6">
                  <TabsTrigger
                    value="saved"
                    className="bg-transparent p-0 pb-2 rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-500 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 data-[state=active]:shadow-none font-bold text-zinc-400"
                  >
                    Saved Places
                  </TabsTrigger>
                  <TabsTrigger
                    value="visited"
                    className="bg-transparent p-0 pb-2 rounded-none border-b-2 border-transparent data-[state=active]:border-indigo-500 data-[state=active]:text-indigo-600 dark:data-[state=active]:text-indigo-400 data-[state=active]:shadow-none font-bold text-zinc-400"
                  >
                    Visited
                  </TabsTrigger>
                </TabsList>
                <Button variant="ghost" size="sm" className="h-8 text-xs font-medium text-zinc-400">View All</Button>
              </div>

              <TabsContent value="saved">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {savedPlaces.map((place) => (
                    <div key={place.id} className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden hover:border-zinc-300 dark:hover:border-zinc-700 transition-all shadow-sm hover:shadow-md">
                      <div className="aspect-[16/10] bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden">
                        <img src={place.img} alt={place.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute top-2 right-2 flex gap-1">
                          <Badge className="bg-black/80 text-white backdrop-blur-md border-none text-[10px] h-5 px-1.5">{place.score}</Badge>
                        </div>
                      </div>
                      <div className="p-3">
                        <div className="flex justify-between items-start mb-1 h-6">
                          <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-50 truncate">{place.title}</h3>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6 -mt-1 -mr-1">
                                <MoreHorizontal className="w-4 h-4 text-zinc-400" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem className="text-red-600" onClick={() => deletePlace(place.id)}>
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>

                        </div>
                        <div className="flex flex-wrap gap-1">
                          {place.tags.map(tag => (
                            <span key={tag} className="text-[10px] text-zinc-500 font-medium">#{tag}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* Add New Placeholder */}
                  <div className="border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg flex flex-col items-center justify-center text-zinc-400 min-h-[160px] cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-2">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-medium">Add Place</span>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="visited">
                <div className="border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg p-12 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                    <Library className="w-6 h-6 text-zinc-400" />
                  </div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 mb-1">No visited places yet</h3>
                  <p className="text-xs text-zinc-500 max-w-[200px]">Mark places you've been to build your history.</p>
                </div>
              </TabsContent>
            </Tabs>
          </section>

        </div>
      </div>
    </div>
  );
}

// Extracted Component
function VibeModelContent({ tags, removeTag, addTag, isMobile }: { tags: string[], removeTag: (t: string) => void, addTag: (t: string) => void, isMobile: boolean }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newValue, setNewValue] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newValue.trim()) {
      addTag(newValue);
      setNewValue("");
      setIsAdding(false);
    }
  };

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 gap-8 ${isMobile ? 'p-6 pt-0' : ''}`}>
      <div>
        <h3 className="text-sm font-medium text-zinc-500 mb-4">Based on your searching history, you prefer:</h3>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 pl-3 pr-1 py-1 gap-1 cursor-default text-xs font-normal border border-zinc-200 dark:border-zinc-700"
            >
              {tag}
              <button
                onClick={() => removeTag(tag)}
                className="w-4 h-4 rounded-full hover:bg-zinc-300 dark:hover:bg-zinc-600 flex items-center justify-center transition-colors"
                aria-label={`Remove ${tag}`}
              >
                <X className="w-3 h-3 text-zinc-500" />
              </button>
            </Badge>
          ))}

          {isAdding ? (
            <form onSubmit={submit} className="flex items-center gap-1">
              <Input
                autoFocus
                value={newValue}
                onChange={e => setNewValue(e.target.value)}
                className="h-6 w-24 text-xs px-2 py-0"
                placeholder="Trait..."
                onBlur={() => !newValue && setIsAdding(false)}
              />
              <button type="submit" className="w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                <Check className="w-3 h-3" />
              </button>
            </form>
          ) : (
            <button
              onClick={() => setIsAdding(true)}
              className="text-xs text-indigo-500 font-medium hover:underline px-2 py-1 flex items-center"
            >
              + Add Trait
            </button>
          )}
        </div>
      </div>

      <div className="h-40 w-full flex items-center justify-center pointer-events-auto">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={VIBE_DATA}>
            <PolarGrid stroke="#e4e4e7" />
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#71717a' }} />
            <Radar
              name="Vibe"
              dataKey="A"
              stroke="#6366f1"
              strokeWidth={2}
              fill="#6366f1"
              fillOpacity={0.2}
            />
            <Tooltip
              contentStyle={{ background: '#18181b', border: 'none', borderRadius: '8px', color: '#fff' }}
              itemStyle={{ color: '#fff' }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
