import type { Metadata } from "next";
import { IBM_Plex_Sans, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AmbienceProvider } from "@/contexts/AmbienceContext";
import { ToastProvider } from "@/components/ui/ToastProvider";
import OfflineSync from "@/components/OfflineSync";
import ScrollContainer from "@/components/ScrollContainer";
import NoPullToRefresh from "@/components/NoPullToRefresh";
import CapacitorStatusBar from "./layout-capacitor-statusbar";
import DisplayNameGate from "@/components/auth/DisplayNameGate";
import NativeAuthDeepLink from "@/components/auth/NativeAuthDeepLink";
import AppUpdateModal from "@/components/AppUpdateModal";
import ThemePreferenceModal from "@/components/ThemePreferenceModal";
// import Script from "next/script";

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
  themeColor: "#111827",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CEN Corse",
  },
  icons: {
    icon: [
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: '/apple-touch-icon.png',
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
        <meta name="theme-color" content="#111827" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="apple-touch-fullscreen" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <style dangerouslySetInnerHTML={{
          __html: `
            /* Désactiver le pull-to-refresh sur PWA */
            body {
              overscroll-behavior: none;
              -webkit-overflow-scrolling: touch;
            }
            
            /* Empêcher le refresh sur iOS */
            html, body {
              overscroll-behavior-y: none;
              -webkit-overflow-scrolling: touch;
            }
            
            /* Masquer la toolbar sur PWA */
            @media (display-mode: standalone) {
              body {
                -webkit-user-select: none;
                -webkit-touch-callout: none;
                -webkit-tap-highlight-color: transparent;
              }
            }
            
            /* Masquer les contrôles du navigateur */
            ::-webkit-scrollbar {
              display: none;
            }
            
            /* Permettre le scroll : pan-y pour défilement vertical */
            * {
              touch-action: pan-x pan-y;
            }
          `
        }} />
      </head>
      <body className={`${ibmPlexSans.variable} ${inter.variable} antialiased`}>
        <NoPullToRefresh />
        {process.env.NODE_ENV === 'production' && (
          <script src="/vercel-disable.js" defer></script>
        )}
        <AuthProvider>
          <ThemeProvider>
            <AppUpdateModal>
              <ThemePreferenceModal />
              <NativeAuthDeepLink />
              <CapacitorStatusBar />
              <AmbienceProvider>
                <ToastProvider>
                  <OfflineSync />
                  <DisplayNameGate />
                  <ScrollContainer>
                    {children}
                  </ScrollContainer>
                </ToastProvider>
              </AmbienceProvider>
            </AppUpdateModal>
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

