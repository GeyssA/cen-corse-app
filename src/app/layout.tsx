import type { Metadata } from "next";
import { IBM_Plex_Sans, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Script from "next/script";

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "CEN Corse - Communauté",
  description: "Application communautaire du CEN Corse",
  manifest: "/manifest.json",
  themeColor: "#1e3a8a",
  viewport: "width=device-width, initial-scale=0.9, maximum-scale=1, user-scalable=no",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CEN Corse",
  },
  icons: {
    icon: "/logo_pwa.png",
    apple: "/logo_pwa.png",
  },
  // Contrôle du cache
  other: {
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="CEN Corse" />
        <meta name="mobile-web-app-capable" content="yes" />
        <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body
        className={`${ibmPlexSans.variable} ${inter.variable} antialiased`}
      >
        <AuthProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </AuthProvider>
        <Script
          id="register-sw"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                // Fonction pour forcer les mises à jour
                function forceUpdate() {
                  navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    for(let registration of registrations) {
                      registration.update();
                    }
                  });
                }
                
                // Fonction pour vider le cache
                function clearCache() {
                  if ('caches' in window) {
                    caches.keys().then(function(names) {
                      for (let name of names) {
                        caches.delete(name);
                      }
                    });
                  }
                }
                
                // Vider le cache au démarrage en développement
                if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                  clearCache();
                }
                
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('SW registered: ', registration);
                      
                      // Écouter les mises à jour du service worker
                      registration.addEventListener('updatefound', function() {
                        console.log('🔄 Nouvelle version du service worker disponible');
                        forceUpdate();
                      });
                    })
                    .catch(function(registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
                
                // Exposer les fonctions globalement pour le débogage
                window.forceUpdate = forceUpdate;
                window.clearCache = clearCache;
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
