import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Configuration pour éviter les problèmes de cache
  generateEtags: false,
  
  // Désactiver ESLint temporairement pour le build
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Headers pour contrôler le cache
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
    ];
  },
  
  // Configuration pour le développement
  ...(process.env.NODE_ENV === 'development' && {
    experimental: {
      // Options expérimentales pour le développement
    },
  }),
};

export default nextConfig;
