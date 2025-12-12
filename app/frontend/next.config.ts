import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
  // Fix for source map issues with Next.js 16 and Turbopack
  // Disable source maps entirely to avoid parsing errors
  // This is a temporary fix for the Turbopack source map issue
  // Remove this when the issue is resolved in future Next.js versions
  productionBrowserSourceMaps: false,
  // Additional configuration to handle Turbopack issues
  experimental: {
    // Disable Turbopack for now to avoid source map issues
    // turbopack: false,
  },
};

export default nextConfig;
