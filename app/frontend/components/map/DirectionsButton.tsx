'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Navigation, MoreHorizontal, Copy, Check } from 'lucide-react';

interface DirectionsButtonProps {
    lat: number;
    lng: number;
    address?: string; // Optional address for "Copy" feature
}

export const DirectionsButton = ({ lat, lng, address }: DirectionsButtonProps) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (address) {
            navigator.clipboard.writeText(address);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const openGoogleMaps = () => {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
    };

    // Universal Links
    const links = {
        yandex: `yandexmaps://build_route_on_map?lat_to=${lat}&lon_to=${lng}`,
        twoGis: `https://2gis.ru/route/search/to/${lng},${lat}`,
        apple: `http://maps.apple.com/?daddr=${lat},${lng}`
    };

    return (
        <div className="flex items-center gap-2 w-full">
            {/* Primary: Google Maps (Universal Standard) */}
            <Button
                onClick={openGoogleMaps}
                className="flex-1 bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 font-semibold hover:bg-zinc-800 dark:hover:bg-zinc-200"
            >
                <Navigation className="w-4 h-4 mr-2" />
                Get Directions
            </Button>

            {/* Secondary: Local Apps & Utils */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="shrink-0 border-zinc-200 dark:border-zinc-800">
                        <MoreHorizontal className="w-5 h-5 text-zinc-500" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">

                    {/* Copy Address - Top Priority for Local Apps */}
                    {address && (
                        <>
                            <DropdownMenuItem onClick={handleCopy} className="cursor-pointer font-medium text-zinc-900 dark:text-zinc-100">
                                {copied ? <Check className="w-4 h-4 mr-2 text-green-500" /> : <Copy className="w-4 h-4 mr-2 text-zinc-500" />}
                                {copied ? 'Copied!' : 'Copy Address'}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-zinc-100 dark:bg-zinc-800" />
                        </>
                    )}

                    <DropdownMenuItem onClick={() => window.open(links.twoGis, '_blank')}>
                        Open in 2GIS
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.open(links.yandex, '_blank')}>
                        Open in Yandex Maps
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.open(links.apple, '_blank')}>
                        Open in Apple Maps
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
};
