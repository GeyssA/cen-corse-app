import type { NextConfig } from "next";

/** Autoriser next/image sur les fichiers publics du Storage (médias migrés). */
function supabaseStorageRemotePattern():
  | { protocol: "https"; hostname: string; pathname: string }
  | undefined {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) return undefined
  try {
    const { hostname } = new URL(url)
    return {
      protocol: "https",
      hostname,
      pathname: "/storage/v1/object/public/**",
    }
  } catch {
    return undefined
  }
}

const supabaseRemote = supabaseStorageRemotePattern()

const nextConfig: NextConfig = {
  // Optimisations pour la production
  generateEtags: true,
  poweredByHeader: false,
  
  // Désactiver ESLint temporairement pour le build
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // TypeScript strict mode
  typescript: {
    ignoreBuildErrors: true, // Temporairement désactivé pour permettre le démarrage
  },
  
  // Headers optimisés pour le cache et sécurité
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
        source: '/.well-known/assetlinks.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/json',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600',
          },
        ],
      },
      {
        source: '/logo_pwa_format.png',
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
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  
  // Configuration Turbopack (stable dans Next.js 15)
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  
  // Optimisations de build avancées
  experimental: {
    optimizePackageImports: [
      '@emailjs/browser',
      'react',
      'react-dom'
    ],
    optimizeCss: true,
    webpackBuildWorker: true,
    esmExternals: true,
    serverMinification: true,
  },
  
  // Désactiver les source maps en production pour réduire la taille
  productionBrowserSourceMaps: false,
  
  // Configuration Webpack (uniquement pour les builds de production, dev utilise Turbopack)
  webpack: (config, { dev, isServer }) => {
    if (!dev) {
      // Désactiver complètement le cache
      config.cache = false;
      
      // Supprimer les plugins de cache
      config.plugins = config.plugins.filter(plugin => 
        plugin.constructor.name !== 'MemoryCachePlugin' &&
        plugin.constructor.name !== 'FileCachePlugin'
      );
      
      // Optimisations agressives
      config.optimization = {
        ...config.optimization,
        removeAvailableModules: true,
        removeEmptyChunks: true,
        mergeDuplicateChunks: true,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              enforce: true
            }
          }
        }
      };
    }
    return config;
  },
  
  // Packages externes pour le serveur
  serverExternalPackages: ['@supabase/supabase-js'],
  
  // Compression et optimisations d'images
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    ...(supabaseRemote ? { remotePatterns: [supabaseRemote] } : {}),
  },
  
  // Optimisations de performance et bundle
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  
  // Export statique pour Capacitor (fichiers dans out/)
  // Sur Vercel : ne pas mettre output (défaut). Sinon Capacitor = 'export', self-host = 'standalone'
  ...(process.env.VERCEL
    ? {}
    : { output: process.env.CAPACITOR_BUILD === 'true' ? 'export' : 'standalone' }),
  // Si on est en mode Capacitor, on exporte en statique
  ...(process.env.CAPACITOR_BUILD === 'true' && {
    trailingSlash: true,
    images: {
      unoptimized: true, // Désactiver l'optimisation d'images pour l'export statique
      ...(supabaseRemote ? { remotePatterns: [supabaseRemote] } : {}),
    },
    // Les routes API sont masquées par le script prepare-capacitor-build.js
  }),
};

export default nextConfig;
