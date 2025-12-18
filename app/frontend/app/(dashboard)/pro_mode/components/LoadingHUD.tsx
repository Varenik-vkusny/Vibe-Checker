import { useLanguage } from '@/lib/i18n/LanguageContext';


interface LoadingHUDProps {
  title: string;
  subtitle: string;
}

export const LoadingHUD = ({ title, subtitle }: LoadingHUDProps) => {
  const { t } = useLanguage();

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-end pb-32 pointer-events-none animate-in fade-in duration-500">

      <div className="text-center">
        <p className="text-muted-foreground text-xs font-medium tracking-widest uppercase animate-pulse">
          {title || t.pro.analyzing}
        </p>
      </div>

    </div>
  );
};