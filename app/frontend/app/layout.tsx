import './globals.css';
import { NavProvider } from '@/context/NavContext';
import { GlobalNav } from '@/components/GlobalNav';
import { ThemeProvider } from '@/components/theme-provider';
import { LanguageProvider } from '@/lib/i18n/LanguageContext';
import { AuthProvider } from '@/lib/auth'; 
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

        <AuthProvider>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            <NavProvider>
              <LanguageProvider>

                <GlobalNav />

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