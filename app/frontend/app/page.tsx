import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-8 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl animate-pulse" />
        </div>
        
        <div className="relative z-10 max-w-2xl space-y-6">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter">
            Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Vibe</span>.
          </h1>
          <p className="text-xl text-muted-foreground">
            Discover places that match your mood. Powered by AI and real reviews.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/map">
              <Button size="lg" className="rounded-full px-8 text-lg h-12">
                Explore Map
              </Button>
            </Link>
            <Link href="/analysis">
              <Button size="lg" variant="outline" className="rounded-full px-8 text-lg h-12">
                Analyze Link
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
