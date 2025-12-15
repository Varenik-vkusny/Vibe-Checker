'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import Link from 'next/link';
import { Github } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [tickerText, setTickerText] = useState("INITIALIZING VIBE ENGINE...");

  // Simple ticker effect
  useEffect(() => {
    const texts = [
      "ANALYZING 1,240 PLACES IN ALMATY...",
      "VIBE CHECK IN PROGRESS...",
      "CALIBRATING SENSORS...",
      "ESTABLISHING SECURE CONNECTION..."
    ];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % texts.length;
      setTickerText(texts[i]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginValues) => {
    setError(null);
    try {
      await login(data);
    } catch (err: unknown) {
      console.error(err);
      setError('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen w-full bg-zinc-50 dark:bg-black flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Texture */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] dark:opacity-[0.1]" style={{ backgroundImage: "url('/grid.svg')", backgroundSize: '40px 40px' }}></div>
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent to-zinc-50/80 dark:to-black/80 pointer-events-none"></div>

      {/* Access Card */}
      <div className="relative z-10 w-full max-w-[400px] bg-white dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-2xl dark:shadow-black rounded-2xl p-8 animate-in fade-in zoom-in-95 duration-500">

        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-10 h-10 mb-6 relative">
            <Image src="/logo.svg" alt="Logo" fill className="dark:invert" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-center text-zinc-900 dark:text-zinc-100">
            Welcome back, Curator.
          </h1>
          <p className="text-sm text-zinc-500 text-center mt-2">
            Enter your credentials to access the Vibe Engine.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && <div className="text-red-500 text-xs font-mono text-center mb-4">{error}</div>}

          <div className="space-y-1">
            <Input
              id="email"
              type="email"
              placeholder="user@example.com"
              {...register('email')}
              className="h-11 bg-transparent border-zinc-300 dark:border-zinc-700 focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white focus:border-zinc-900 dark:focus:border-white transition-all font-mono text-sm shadow-none"
            />
            {errors.email && <span className="text-red-500 text-[10px] font-mono">{errors.email.message}</span>}
          </div>

          <div className="space-y-1">
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              {...register('password')}
              className="h-11 bg-transparent border-zinc-300 dark:border-zinc-700 focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white focus:border-zinc-900 dark:focus:border-white transition-all font-mono text-sm shadow-none"
            />
            {errors.password && <span className="text-red-500 text-[10px] font-mono">{errors.password.message}</span>}
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black font-medium transition-opacity hover:opacity-90 shadow-none mt-2"
          >
            {isSubmitting ? 'AUTHENTICATING...' : 'Sign In'}
          </Button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-zinc-900 px-2 text-zinc-500">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Social Auth Placeholders */}
            <button type="button" className="flex items-center justify-center gap-2 h-11 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
              <Github size={16} className="text-zinc-900 dark:text-white" />
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">GitHub</span>
            </button>
            <button type="button" className="flex items-center justify-center gap-2 h-11 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
              {/* Google SVG */}
              <svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Google</span>
            </button>
          </div>
        </form>

        <div className="mt-8 text-center text-xs text-zinc-500">
          <Link href="/register" className="hover:text-zinc-900 dark:hover:text-zinc-100 underline underline-offset-4 decoration-zinc-300 dark:decoration-zinc-700">
            Create an account
          </Link>
        </div>
      </div>

      {/* Vibe Ticker */}
      <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
        <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-[0.2em] animate-pulse">
          {tickerText}
        </p>
      </div>
    </div>
  );
}
