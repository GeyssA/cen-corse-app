import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimisations pour la production
  generateEtags: true,
  
  // Désactiver ESLint temporairement pour le build
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Headers optimisés pour le cache
  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, immutable',
          },
        ],
      },
      {
        source: '/logo_pwa.png',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache',
          },
        ],
      },
    ];
  },
  
  // Optimisations de build
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js'],
  },
  
  // Compression des images
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
  },
  
  // Optimisations de performance
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

export default nextConfig;
