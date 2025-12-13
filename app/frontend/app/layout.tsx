import './globals.css';
import { NavProvider } from '@/context/NavContext';
import { GlobalNav } from '@/components/GlobalNav';
import { ThemeProvider } from '@/components/theme-provider'; 
import { LanguageProvider } from '@/lib/i18n/LanguageContext'; 
// !!! НОВЫЙ ИМПОРТ !!!
import { AuthProvider } from '@/lib/auth'; // <--- Замените на реальный путь

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
                
                <div className="md:pt-16 min-h-screen">
                  {children}
                </div>

              </LanguageProvider>
            </NavProvider>
          </ThemeProvider>
        </AuthProvider>
        
      </body>
    </html>
  );
}