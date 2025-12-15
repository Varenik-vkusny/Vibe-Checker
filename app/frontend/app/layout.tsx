import './globals.css';
import { NavProvider } from '@/context/NavContext';
import { GlobalNav } from '@/components/GlobalNav';
import { ThemeProvider } from '@/components/theme-provider';
import { LanguageProvider } from '@/lib/i18n/LanguageContext';
// !!! НОВЫЙ ИМПОРТ !!!
import { AuthProvider } from '@/lib/auth'; // <--- Замените на реальный путь
import { Metadata } from 'next';
import { Toaster } from '@/components/ui/sonner';

export const metadata: Metadata = {
  title: 'Vibe-Checker',
  description: 'Pro-level place analysis',
  icons: {
    icon: '/logo.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>

        {/*
          ПОРЯДОК: Auth часто является самым внешним, так как 
          другие компоненты (Тема, Язык) могут зависеть от состояния пользователя.
        */}
        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            <NavProvider>
              <LanguageProvider>

                <GlobalNav />

                {/* 
                  Main Wrapper:
                  - pt-16: Compensate for the fixed 4rem (16) header.
                  - min-h-screen: Removed to prevent forcing overflow if children are strictly sized.
                  - But we need to ensure background color fills screen if content is short.
                  - Using 'min-h-[100dvh]' with flex might be better, but simplest fix for scrollbar:
                  - Just pt-16. Let pages decide height.
                */}
                <div className="pt-16">
                  {children}
                </div>
                <Toaster />

              </LanguageProvider>
            </NavProvider>
          </ThemeProvider>
        </AuthProvider>

      </body>
    </html >
  );
}