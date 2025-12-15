import React from 'react';
import { cn } from '@/lib/utils';

interface VibeSliderProps {
    label: string;
    leftLabel: string;
    rightLabel: string;
    value: number;
    onChange: (value: number) => void;
}

export const VibeSlider: React.FC<VibeSliderProps> = ({ label, leftLabel, rightLabel, value, onChange }) => {
    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center text-xs uppercase tracking-widest font-mono text-zinc-500">
                <span>{label}</span>
                <span className="text-zinc-600 dark:text-zinc-400">{value}%</span>
            </div>
            <div className="relative h-6 flex items-center">
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="w-full h-1 bg-zinc-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-zinc-900 [&::-webkit-slider-thumb]:shadow-md focus:outline-none"
                />
            </div>
            <div className="flex justify-between text-[10px] font-medium text-zinc-500 dark:text-zinc-500 font-sans uppercase">
                <span>{leftLabel}</span>
                <span>{rightLabel}</span>
            </div>
        </div>
    );
};
