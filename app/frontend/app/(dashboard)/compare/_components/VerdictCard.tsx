import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface VerdictCardProps {
    verdictText: string;
}

export const VerdictCard: React.FC<VerdictCardProps> = ({ verdictText }) => {
    const { t } = useLanguage();
    const [displayedText, setDisplayedText] = useState('');

    useEffect(() => {
        if (!verdictText) {
            setDisplayedText('');
            return;
        }

        let index = 0;
        setDisplayedText('');

        const timer = setInterval(() => {
            if (index <= verdictText.length) {
                setDisplayedText(verdictText.slice(0, index));
                index++;
            } else {
                clearInterval(timer);
            }
        }, 15);

        return () => clearInterval(timer);
    }, [verdictText]);

    return (
        <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 md:p-8 shadow-sm relative overflow-hidden group min-h-[120px] flex flex-col justify-center">
            <div className="flex flex-col gap-3 relative z-10 w-full">
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-400 block">
                    {t.map.aiInsight || 'AI Insight'}
                </span>
                <p className="text-base md:text-lg font-normal font-sans text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-normal transition-all duration-300">
                    {displayedText}
                </p>
            </div>
        </div>
    );
};
