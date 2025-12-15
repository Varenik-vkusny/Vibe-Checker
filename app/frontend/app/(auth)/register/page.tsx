'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/lib/auth';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import Link from 'next/link';

const registerSchema = z.object({
  first_name: z.string().min(2, 'Name must be at least 2 characters'),
  last_name: z.string().optional(),
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type RegisterValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const { t } = useLanguage();
  const [error, setError] = useState<string | null>(null);
  const [tickerText, setTickerText] = useState("INITIALIZING NEW PROTOCOL...");

  useEffect(() => {
    const texts = [
      "VERIFYING BIOMETRICS...",
      "ALLOCATING SECURE STORAGE...",
      "SYNCING WITH VIBE NETWORK...",
      "AWAITING USER INPUT..."
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
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterValues) => {
    setError(null);
    try {
      await registerUser(data);
    } catch (err: unknown) {
      console.error(err);
      setError('Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen w-full bg-zinc-50 dark:bg-black flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] dark:opacity-[0.1]" style={{ backgroundImage: "url('/grid.svg')", backgroundSize: '40px 40px' }}></div>
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent to-zinc-50/80 dark:to-black/80 pointer-events-none"></div>

      {}
      <div className="relative z-10 w-full max-w-[400px] bg-white dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 shadow-xl shadow-zinc-200/50 dark:shadow-2xl dark:shadow-black rounded-2xl p-8 animate-in fade-in zoom-in-95 duration-500">

        {}
        <div className="flex flex-col items-center mb-8">
          <div className="w-10 h-10 mb-6 relative">
            <Image src="/logo.svg" alt="Logo" fill className="dark:invert" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-center text-zinc-900 dark:text-zinc-100">
            {t.register.title}
          </h1>
          <p className="text-sm text-zinc-500 text-center mt-2">
            {t.register.subtitle}
          </p>
        </div>

        {}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && <div className="text-red-500 text-xs font-mono text-center mb-4">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              {}
              <Input
                id="first_name"
                placeholder={t.register.firstName}
                {...register('first_name')}
                className="h-11 bg-transparent border-zinc-300 dark:border-zinc-700 focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white focus:border-zinc-900 dark:focus:border-white transition-all font-mono text-sm shadow-none"
              />
              {errors.first_name && <span className="text-red-500 text-[10px] font-mono">{errors.first_name.message}</span>}
            </div>
            <div className="space-y-1">
              <Input
                id="last_name"
                placeholder={t.register.lastName}
                {...register('last_name')}
                className="h-11 bg-transparent border-zinc-300 dark:border-zinc-700 focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white focus:border-zinc-900 dark:focus:border-white transition-all font-mono text-sm shadow-none"
              />
              {errors.last_name && <span className="text-red-500 text-[10px] font-mono">{errors.last_name.message}</span>}
            </div>
          </div>

          <div className="space-y-1">
            <Input
              id="email"
              type="email"
              placeholder={t.register.email}
              {...register('email')}
              className="h-11 bg-transparent border-zinc-300 dark:border-zinc-700 focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white focus:border-zinc-900 dark:focus:border-white transition-all font-mono text-sm shadow-none"
            />
            {errors.email && <span className="text-red-500 text-[10px] font-mono">{errors.email.message}</span>}
          </div>

          <div className="space-y-1">
            <Input
              id="password"
              type="password"
              placeholder={t.register.password}
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
            {isSubmitting ? t.register.creatingAccount : t.register.createAccount}
          </Button>

          <div className="mt-8 text-center text-xs text-zinc-500">
            {t.register.alreadyHaveAccount}{' '}
            <Link href="/login" className="hover:text-zinc-900 dark:hover:text-zinc-100 underline underline-offset-4 decoration-zinc-300 dark:decoration-zinc-700">
              {t.register.signIn}
            </Link>
          </div>
        </form>
      </div>

      {}
      <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
        <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-[0.2em] animate-pulse">
          {tickerText}
        </p>
      </div>
    </div>
  );
}
