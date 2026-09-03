import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.cencorse.app',
  appName: 'CEN Corse',
  webDir: 'out',
  // Par défaut, toute URL externe ouvre Chrome. Hosts autorisés dans la WebView (OAuth + Supabase + Vercel).
  // IMPORTANT : uniquement des noms d’hôte (sans https://). Sinon HostMask ne matche pas → Chrome s’ouvre.
  server: {
    allowNavigation: [
      'accounts.google.com',
      '*.google.com',
      'google.com',
      'oauth2.googleapis.com',
      'www.googleapis.com',
      '*.googleapis.com',
      '*.gstatic.com',
      '*.supabase.co',
      'cen-corse-app.vercel.app',
      '*.vercel.app',
    ],
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
    }
  },
  // Schéma custom pour le retour OAuth (PKCE) : cencorse://auth/callback — doit matcher Info.plist / Xcode.
  ios: {
    scheme: 'cencorse',
    contentInset: 'automatic',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: true,
      backgroundColor: "#1e3a8a",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: false,
      splashImmersive: false
    },
    StatusBar: {
      backgroundColor: "#1e3a8a",
      style: "dark",
      overlaysWebView: false
    }
  }
};

export default config;

