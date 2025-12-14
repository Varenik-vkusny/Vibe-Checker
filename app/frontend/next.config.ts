import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Разрешаем запросы с ngrok и других хостов при разработке
  experimental: {
    // @ts-expect-error - TypeScript может не знать об этом поле, но оно работает в Next.js
    allowedDevOrigins: [
        "localhost:3000", 
        ".ngrok-free.app" // Разрешает все ngrok домены
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:8000/:path*',
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Отключаем source maps для продакшена (ускоряет билд)
  productionBrowserSourceMaps: false,
};

export default nextConfig;